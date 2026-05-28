import { ITEM_DETAILS_PATH, type DownloadQualitiesType, SubjectType } from "./constants.js";
import { ZeroMediaFileError } from "./exceptions.js";
import { getFileExtension } from "./helpers.js";

export interface MovieboxAppInfo {
  channelType: string;
  pkgName: string;
  url: string;
  versionCode: string;
  versionName: string;
}

export interface ContentImageModel {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  thumbnail: string;
  blurHash?: string;
  gif?: string | null;
  avgHueLight?: string;
  avgHueDark?: string;
  id?: string;
}

export interface VideoAddressModel {
  videoId: string;
  definition: string;
  url: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  fps: number;
  type: number;
}

export interface SubjectTrailerModel {
  videoAddress: VideoAddressModel;
  cover: ContentImageModel;
}

export interface ContentSubjectModel {
  subjectId: string;
  subjectType: SubjectType;
  title: string;
  description: string;
  releaseDate: string;
  duration: number;
  genre: string[] | string;
  cover: ContentImageModel;
  countryName?: string;
  imdbRatingValue?: number | string;
  trailer?: SubjectTrailerModel | null;
  detailPath: string;
  stafflist?: unknown[] | null;
  appointmentCnt?: number;
  appointmentDate?: string;
  corner?: string;
}

export interface ContentModel {
  id: string;
  title: string;
  image: ContentImageModel;
  url: string;
  subjectId: string;
  subjectType: SubjectType;
  subject?: ContentSubjectModel | null;
}

export function isMovie(content: ContentModel): boolean {
  return content.subjectType === SubjectType.MOVIES;
}

export function isTvSeries(content: ContentModel): boolean {
  return content.subjectType === SubjectType.TV_SERIES;
}

export function isMusic(content: ContentModel): boolean {
  return content.subjectType === SubjectType.MUSIC;
}

export interface PlatformsModel {
  name: string;
  uploadBy: string;
}

export interface ContentCategoryBannerModel {
  items: ContentModel[];
}

export interface ContentCategorySubjectsModel extends ContentSubjectModel {
  subtitles: string[] | string;
  ops: string;
  hasResource: boolean;
}

export interface ContentCategoryModel {
  type: string;
  position: number;
  title: string;
  subjects: ContentCategorySubjectsModel[];
  banner?: ContentCategoryBannerModel | null;
  opId: string;
  url: string;
  livelist?: unknown[] | null;
}

export interface HomepageContentModel {
  topPickList?: unknown[];
  homeList?: unknown[];
  url?: string;
  referer?: string;
  allPlatform?: unknown[];
  banner?: string | null;
  live?: string | null;
  platformList: PlatformsModel[];
  shareParam?: string | null;
  operatingList: ContentCategoryModel[];
}

export function homepageContents(homepage: HomepageContentModel): ContentModel[] {
  return homepage.operatingList.flatMap((operating) => operating.banner?.items ?? []);
}

export interface OPS {
  rid?: string;
  trace_id: string;
}

export interface SearchResultsItem extends ContentSubjectModel {
  subtitles?: string[] | string | null;
  ops?: OPS | string | null;
  hasResource?: boolean;
  imdbRatingCount?: number | null;
}

export function pageUrl(item: SearchResultsItem): string {
  return `${ITEM_DETAILS_PATH}/${item.detailPath}?id=${item.subjectId}`;
}

export interface SearchResultsPagerModel {
  hasMore: boolean;
  nextPage: number;
  page: number;
  perPage: number;
  totalCount: number;
}

export interface SearchResultsModel {
  pager: SearchResultsPagerModel;
  items: SearchResultsItem[];
}

export interface TrendingResultsModel {
  pager: SearchResultsPagerModel;
  subjectList: SearchResultsItem[];
}

export function trendingItems(model: TrendingResultsModel): SearchResultsItem[] {
  return model.subjectList;
}

export function firstSearchItem(
  model: SearchResultsModel | TrendingResultsModel
): SearchResultsItem | undefined {
  return "items" in model ? model.items[0] : model.subjectList[0];
}

export interface HotMoviesAndTVSeriesModel {
  movie: SearchResultsItem[];
  tv: SearchResultsItem[];
}

export function hotMovies(model: HotMoviesAndTVSeriesModel): SearchResultsItem[] {
  return model.movie;
}

export function hotTvSeries(model: HotMoviesAndTVSeriesModel): SearchResultsItem[] {
  return model.tv;
}

export interface SuggestedItemModel {
  type: SubjectType;
  subject?: string | null;
  word: string;
}

export interface SuggestedItemsModel {
  items: SuggestedItemModel[];
  keyword: string;
  ops: string;
}

export interface BaseFileMetadata {
  url: string;
}

export function metadataExt(item: BaseFileMetadata): string | undefined {
  return getFileExtension(item.url);
}

export interface MediaFileMetadata extends BaseFileMetadata {
  id: string;
  resolution: number;
  size: number;
}

export interface CaptionFileMetadata extends BaseFileMetadata {
  id: string;
  lan: string;
  lanName: string;
  size: number;
  delay: number;
}

export interface DownloadableFilesMetadata {
  downloads: MediaFileMetadata[];
  captions: CaptionFileMetadata[];
  limited: boolean;
  limitedCode: string;
  hasResource: boolean;
}

function assertDownloads(model: DownloadableFilesMetadata): void {
  if (!model.downloads.length) {
    throw new ZeroMediaFileError(
      "There are no downloadable mediafiles for the targeted item"
    );
  }
}

export function bestMediaFile(model: DownloadableFilesMetadata): MediaFileMetadata {
  assertDownloads(model);
  return model.downloads.reduce((found, item) =>
    item.resolution > found.resolution ? item : found
  );
}

export function worstMediaFile(model: DownloadableFilesMetadata): MediaFileMetadata {
  assertDownloads(model);
  return model.downloads.reduce((found, item) =>
    item.resolution < found.resolution ? item : found
  );
}

export function englishSubtitleFile(
  model: DownloadableFilesMetadata
): CaptionFileMetadata | undefined {
  return model.captions.find((caption) => caption.lan === "en");
}

export function getQualityDownloadsMap(
  model: DownloadableFilesMetadata
): Map<DownloadQualitiesType, MediaFileMetadata> {
  const map = new Map<DownloadQualitiesType, MediaFileMetadata>();
  for (const item of model.downloads) {
    map.set(`${item.resolution}P` as DownloadQualitiesType, item);
  }
  return map;
}

export function getMediaFileByResolution(
  model: DownloadableFilesMetadata,
  resolution: number
): MediaFileMetadata {
  const found = model.downloads.find((item) => item.resolution === resolution);
  if (!found) {
    throw new Error(
      `No media_file matched that resolution. Available resolutions include ${model.downloads.map((item) => item.resolution)}`
    );
  }
  return found;
}

export function getLanguageSubtitleMap(
  model: DownloadableFilesMetadata
): Record<string, CaptionFileMetadata> {
  return Object.fromEntries(model.captions.map((caption) => [caption.lanName, caption]));
}

export function getLanguageShortSubtitleMap(
  model: DownloadableFilesMetadata
): Record<string, CaptionFileMetadata> {
  return Object.fromEntries(model.captions.map((caption) => [caption.lan, caption]));
}

export function getSubtitleByLanguage(
  model: DownloadableFilesMetadata,
  language: string
): CaptionFileMetadata | undefined {
  if (language.length === 2) {
    return getLanguageShortSubtitleMap(model)[language.toLowerCase()];
  }
  const normalized = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
  return getLanguageSubtitleMap(model)[normalized];
}

export interface StreamFileMetadata extends BaseFileMetadata {
  format: string;
  id: string;
  resolutions: number;
  size: number;
  duration: number;
  codecName: string;
}

export interface StreamFilesMetadata {
  streams: StreamFileMetadata[];
  freeNum: number;
  limited: boolean;
  dash: unknown[];
  hls: unknown[];
  hasResource: boolean;
}

export function bestStreamFile(model: StreamFilesMetadata): StreamFileMetadata | undefined {
  return model.streams.reduce<StreamFileMetadata | undefined>(
    (found, item) => (!found || item.resolutions > found.resolutions ? item : found),
    undefined
  );
}

export function worstStreamFile(model: StreamFilesMetadata): StreamFileMetadata | undefined {
  return model.streams.reduce<StreamFileMetadata | undefined>(
    (found, item) => (!found || item.resolutions < found.resolutions ? item : found),
    undefined
  );
}

export interface PopularSearchModel {
  title: string;
}
