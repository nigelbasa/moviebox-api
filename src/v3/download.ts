import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { CustomResolutionType, SubjectType } from "./constants.js";
import { getFileExtension } from "./helpers.js";
import {
  bestMediaFile,
  getQualityDownloadsMap,
  worstMediaFile,
  type CaptionFileMetadata,
  type RootDownloadableFilesDetailModel,
  type VideoFileMetadata
} from "./models.js";

export interface DownloadedFile {
  url: string;
  savedTo: string;
  bytes?: number;
}

export interface DownloadOptions {
  dir?: string;
  signal?: AbortSignal;
  headers?: HeadersInit;
}

export function resolveMediaFileToBeDownloaded(
  resolution: CustomResolutionType,
  downloadableFilesDetail: RootDownloadableFilesDetailModel
): VideoFileMetadata {
  if (downloadableFilesDetail.subjectType === SubjectType.TV_SERIES) {
    throw new Error(
      "Can only process items which fall under non-series subject types such as movies and music."
    );
  }

  if (resolution === CustomResolutionType.BEST) {
    return bestMediaFile(downloadableFilesDetail);
  }

  if (resolution === CustomResolutionType.WORST) {
    return worstMediaFile(downloadableFilesDetail);
  }

  const target = getQualityDownloadsMap(downloadableFilesDetail).get(resolution);
  if (!target) {
    throw new Error(`Media file for quality ${resolution} does not exist.`);
  }

  return target;
}

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function safeFilename(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim();
}

export class MediaFileDownloader {
  movieFilenameTemplate = "{title} ({release_year}).{ext}";
  seriesFilenameTemplate = "{title} S{season}E{episode}.{ext}";

  generateFilename(
    mediaFile: VideoFileMetadata,
    downloadableFilesDetail: RootDownloadableFilesDetailModel
  ): string {
    const releaseYear = String(downloadableFilesDetail.releaseDate ?? "").slice(0, 4);
    const ext = getFileExtension(mediaFile.resourceLink) ?? "mp4";
    const template =
      downloadableFilesDetail.subjectType === SubjectType.TV_SERIES
        ? this.seriesFilenameTemplate
        : this.movieFilenameTemplate;

    return safeFilename(
      template
        .replaceAll("{title}", downloadableFilesDetail.subjectTitle)
        .replaceAll("{release_year}", releaseYear)
        .replaceAll("{release_date}", downloadableFilesDetail.releaseDate)
        .replaceAll("{resolution}", String(mediaFile.resolution))
        .replaceAll("{ext}", ext)
        .replaceAll("{size_string}", formatFileSize(mediaFile.size))
        .replaceAll("{season}", String(mediaFile.se))
        .replaceAll("{episode}", String(mediaFile.ep))
        .replaceAll("{episode_title}", mediaFile.title)
        .replaceAll("{duration}", String(mediaFile.duration))
        .replaceAll("{codec_name}", mediaFile.codecName)
    );
  }

  async run(
    mediaFile: VideoFileMetadata,
    filenameOrDetail: string | RootDownloadableFilesDetailModel,
    options: DownloadOptions = {}
  ): Promise<DownloadedFile> {
    const filename =
      typeof filenameOrDetail === "string"
        ? filenameOrDetail
        : this.generateFilename(mediaFile, filenameOrDetail);

    return downloadToFile(mediaFile.resourceLink, filename, options);
  }
}

export class CaptionFileDownloader {
  movieFilenameTemplate = "{title} ({release_year}).{lan}.{ext}";
  seriesFilenameTemplate = "{title} S{season}E{episode}.{lan}.{ext}";

  generateFilename(
    captionFile: CaptionFileMetadata,
    videoFile: VideoFileMetadata,
    downloadableFilesDetail: RootDownloadableFilesDetailModel
  ): string {
    const releaseYear = String(downloadableFilesDetail.releaseDate ?? "").slice(0, 4);
    const ext = getFileExtension(captionFile.url) ?? "srt";
    const template =
      downloadableFilesDetail.subjectType === SubjectType.TV_SERIES
        ? this.seriesFilenameTemplate
        : this.movieFilenameTemplate;

    return safeFilename(
      template
        .replaceAll("{title}", downloadableFilesDetail.subjectTitle)
        .replaceAll("{release_year}", releaseYear)
        .replaceAll("{release_date}", downloadableFilesDetail.releaseDate)
        .replaceAll("{ext}", ext)
        .replaceAll("{size_string}", formatFileSize(captionFile.size))
        .replaceAll("{id}", captionFile.id)
        .replaceAll("{lan}", captionFile.lan)
        .replaceAll("{lan_name}", captionFile.lanName)
        .replaceAll("{delay}", String(captionFile.delay))
        .replaceAll("{season}", String(videoFile.se))
        .replaceAll("{episode}", String(videoFile.ep))
        .replaceAll("{episode_title}", videoFile.title)
    );
  }

  async run(
    captionFile: CaptionFileMetadata,
    videoFile: VideoFileMetadata,
    downloadableFilesDetail: RootDownloadableFilesDetailModel,
    options: DownloadOptions = {}
  ): Promise<DownloadedFile> {
    return downloadToFile(
      captionFile.url,
      this.generateFilename(captionFile, videoFile, downloadableFilesDetail),
      options
    );
  }
}

export async function downloadToFile(
  url: string,
  filename: string,
  options: DownloadOptions = {}
): Promise<DownloadedFile> {
  const dir = options.dir ?? process.cwd();
  await mkdir(dir, { recursive: true });

  const response = await fetch(url, {
    headers: options.headers,
    signal: options.signal
  });

  if (!response.ok || !response.body) {
    throw new Error(`Unable to download ${url}: ${response.status} ${response.statusText}`);
  }

  const savedTo = path.join(dir, filename);
  await pipeline(
    Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
    createWriteStream(savedTo)
  );

  return {
    url,
    savedTo,
    bytes: Number(response.headers.get("content-length") ?? undefined) || undefined
  };
}
