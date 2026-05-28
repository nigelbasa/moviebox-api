import { CustomResolutionType, normalizeResolution } from "./constants.js";
import { DownloadableCaptionFileDetails, DownloadableVideoFilesDetail } from "./core.js";
import { getDubOrThrow, normalizeDubName } from "./helpers.js";
import { MovieBoxHttpClient } from "./http-client.js";
import {
  bestMediaFile,
  getMediaFileByResolution,
  worstMediaFile,
  type BannerItem,
  type CaptionFileMetadata,
  type DubModel,
  type HomepageItemModel,
  type RootCaptionFileMetadata,
  type RootDownloadableFilesDetailModel,
  type RootHomepageModel,
  type RootItemDetailsModel,
  type SubjectModel,
  type VideoFileMetadata
} from "./models.js";

export interface HomeSectionSummary {
  type: string;
  title: string;
  subjectCount: number;
  bannerCount: number;
  filterCount: number;
  firstPoster?: string;
}

export function getHomeSections(
  homepage: RootHomepageModel,
  options: { type?: string; withSubjects?: boolean } = {}
): HomepageItemModel[] {
  return homepage.items.filter((section) => {
    if (options.type && section.type !== options.type) {
      return false;
    }
    if (options.withSubjects && !(section.subjects?.length > 0)) {
      return false;
    }
    return true;
  });
}

export function summarizeHomeSections(homepage: RootHomepageModel): HomeSectionSummary[] {
  return homepage.items.map((section) => ({
    type: section.type,
    title: section.title,
    subjectCount: section.subjects?.length ?? 0,
    bannerCount: section.banner?.banners?.length ?? 0,
    filterCount: section.filters?.length ?? 0,
    firstPoster:
      section.subjects?.[0]?.cover?.url ??
      section.banner?.banners?.[0]?.image?.url
  }));
}

export function getSectionSubjects(section: HomepageItemModel): SubjectModel[] {
  return section.subjects ?? [];
}

export function getSectionBanners(section: HomepageItemModel): BannerItem[] {
  return section.banner?.banners ?? [];
}

export interface DubSummary {
  name: string;
  normalizedName: string;
  code: string;
  subjectId: string;
  original: boolean;
  type: number;
}

export function listDubs(itemDetails: RootItemDetailsModel): DubSummary[] {
  return (itemDetails.dubs ?? []).map((dub) => ({
    name: dub.lanName,
    normalizedName: normalizeDubName(dub.lanName),
    code: dub.lanCode,
    subjectId: dub.subjectId,
    original: dub.original,
    type: dub.type
  }));
}

export function getDub(itemDetails: RootItemDetailsModel, language = "Original"): DubModel {
  return getDubOrThrow(itemDetails, language);
}

export function listQualities(
  downloadables: RootDownloadableFilesDetailModel
): number[] {
  const values = new Set<number>();
  for (const file of downloadables.list ?? []) {
    values.add(file.resolution);
  }
  for (const item of downloadables.collectionResolutions ?? []) {
    values.add(item.resolution);
  }
  return [...values].sort((a, b) => a - b);
}

export function listQualityLabels(
  downloadables: RootDownloadableFilesDetailModel
): string[] {
  return listQualities(downloadables).map((quality) => `${quality}p`);
}

export function pickVideoFile(
  downloadables: RootDownloadableFilesDetailModel,
  quality: "best" | "worst" | number | string = "best"
): VideoFileMetadata {
  if (quality === "best" || quality === CustomResolutionType.BEST) {
    return bestMediaFile(downloadables);
  }
  if (quality === "worst" || quality === CustomResolutionType.WORST) {
    return worstMediaFile(downloadables);
  }
  return getMediaFileByResolution(downloadables, normalizeResolution(quality));
}

export async function getDownloadablesForDub(
  client: MovieBoxHttpClient,
  itemDetails: RootItemDetailsModel,
  language = "Original",
  options: {
    resolution?: "best" | "worst" | number | string;
    page?: number;
    perPage?: number;
    releaseDate?: string;
  } = {}
): Promise<RootDownloadableFilesDetailModel> {
  const dub = getDub(itemDetails, language);
  return new DownloadableVideoFilesDetail(client, {
    resolution: options.resolution ?? "best",
    page: options.page,
    perPage: options.perPage
  }).getContentModel(dub.subjectId, options.releaseDate ?? itemDetails.releaseDate);
}

export async function getCaptionsForVideo(
  client: MovieBoxHttpClient,
  subjectId: string,
  video: VideoFileMetadata | string
): Promise<RootCaptionFileMetadata> {
  return new DownloadableCaptionFileDetails(client).getContentModel(subjectId, video);
}

export function pickCaption(
  captions: RootCaptionFileMetadata,
  language = "English"
): CaptionFileMetadata | undefined {
  if (language.length === 2) {
    return captions.extCaptions.find(
      (caption) => caption.lan.toLowerCase() === language.toLowerCase()
    );
  }
  return captions.extCaptions.find(
    (caption) => caption.lanName.toLowerCase() === language.toLowerCase()
  );
}
