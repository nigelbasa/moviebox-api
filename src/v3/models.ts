import { CustomResolutionType, ResolutionType, SubjectType, TabID, TopicType } from "./constants.js";
import { ZeroMediaFileError } from "./exceptions.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type UnknownRecord = Record<string, unknown>;

export interface Gif {
  videoUrl?: string | null;
  firstFrameUrl?: string | null;
}

export interface Image {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  thumbnail: string;
  gif?: Gif | null;
  averageHueLight?: string | unknown;
  averageHueDark?: string | unknown;
}

export interface PlayUrl {
  playUrl?: string | null;
  urlType: string;
}

export interface MiniSubjectModel {
  subjectId: string;
  title: string;
  releaseDate: string;
  genre: string[] | string;
  cover: Image;
  subjectType: SubjectType;
  detailUrl?: string | null;
  playUrl?: PlayUrl | null;
  restrictKid?: number;
}

export interface SubjectModel extends MiniSubjectModel {
  rate?: number;
  imdbRate?: string;
  seconds?: number;
  description?: string;
  countryName?: string;
  seenStatus?: number;
  viewers?: number;
  hasResource?: boolean;
  dl?: unknown;
  opItemId?: string;
  ops?: unknown;
  tag?: string;
  appointmentDate?: string;
  imdbRatingValue?: string | number;
  corner?: string;
  appointmentCnt?: number;
  shortsEpisode?: number;
}

export interface BannerItem {
  image: Image;
  content: string;
  deepLink: string;
  opItemId: string;
  subjectId: string;
  hasResource: boolean;
  seenStatus: number;
  subject?: MiniSubjectModel | null;
}

export interface BannerModel {
  interval: string;
  autoPlay: boolean;
  banners: BannerItem[];
  style: string;
}

export interface CustomDataModel {
  rowCount: number;
  items?: BannerItem[] | null;
  hiddenTitle: boolean;
}

export interface HomepageItemModel {
  type: string;
  position: number;
  title: string;
  groups: unknown[];
  subjects: SubjectModel[];
  banner?: BannerModel | null;
  icons: unknown[];
  rankings: unknown[];
  opId: string;
  deepLink: string;
  filters: unknown[];
  customData?: CustomDataModel | null;
  playListData?: unknown;
  rankingData?: unknown;
  rankingListData?: unknown;
  liveList?: unknown[];
  page?: unknown;
  postData?: unknown[];
  version: string;
  enableDedup?: number;
  currentPage?: number;
}

export interface RootHomepageModel {
  tabId: number;
  items: HomepageItemModel[];
  version: string;
  trendingTitle: string;
  ops: unknown;
  groupPos: number;
}

export interface OpsModel {
  trace_id?: string;
  rid?: string;
  search_abt?: string;
  q?: string;
}

export interface VerticalRankItem {
  title: string;
  description: string;
  cover: Image;
  deeplink: string;
  count: number;
  isForceInsert: boolean;
}

export interface ResultsSubjectModel {
  subjectId: string;
  subjectType: SubjectType;
  title: string;
  description?: string;
  releaseDate?: string;
  duration?: string;
  genre?: string[] | string;
  cover?: Image | null;
  preVideoCover?: unknown;
  preVideoAddress?: unknown[];
  countryName?: string;
  language?: string[] | string;
  imdbRatingValue?: number | string;
  staffList?: unknown[];
  wantToSeeCount?: number;
  haveSeenCount?: number;
  seenStatus?: number;
  mySeeTime?: string;
  myScoreValue?: number;
  myScorePostId?: string;
  myScoreTime?: string;
  opt?: string;
  hasResource?: boolean;
  resourceDetectors?: unknown[];
  ops?: OpsModel | string | null;
  durationSeconds?: number;
  stills?: Image | null;
  trailer?: unknown;
  contentRating?: string;
  postTitle?: string;
  aka?: string;
  explains?: unknown[];
  seNum?: number;
  viewers?: number;
  category?: string;
  subtitles?: string[] | string;
  dubs?: unknown[];
  relatedApp?: unknown;
  restrictLevel?: string;
  corner?: string;
  likeStatus?: number;
  style?: unknown;
  detailUrl?: string | null;
  playUrl?: PlayUrl | null;
  restrictKid?: number;
  season?: number;
  isCam?: boolean;
}

export interface SearchResultsItem {
  topicType: TopicType;
  subjects: ResultsSubjectModel[];
  staffs: unknown[];
  groups: unknown[];
  verticalRanks: VerticalRankItem[];
  title: string;
  showMore: boolean;
  moreTabId?: TabID | null;
}

export interface PagerModel {
  hasMore: boolean;
  nextPage: number;
  page: number;
  perPage: number;
  totalCount: number;
}

export interface RootSearchResultsModelV2 {
  pager: PagerModel;
  results: SearchResultsItem[];
  tabId: TabID;
  tabs: unknown[];
  items: ResultsSubjectModel[];
}

export interface RootSearchResultsModel {
  pager: PagerModel;
  verticalRanks: VerticalRankItem[];
  items: ResultsSubjectModel[];
  counts: UnknownRecord[];
  subjectType: SubjectType;
  staffs: unknown[];
  accurate: unknown;
}

export interface StaffModel {
  staffId: string;
  staffType: number;
  name: string;
  character: string;
  avatarUrl?: string | null;
}

export interface ResolutionModel {
  episode: number;
  title: string;
  resourceLink: string;
  linkType: number;
  size: number;
  uploadBy: string;
  resourceId: string;
  postId: string;
  extCaptions: unknown[];
  se: number;
  ep: number;
  sourceUrl: string;
  resolution: ResolutionType;
  codecName: string;
  duration: number;
  requireMemberType: number;
  memberIcon: string;
}

export interface ResourceDetectorModel {
  type: number;
  totalEpisode: number;
  totalSize: number;
  uploadTime: string;
  uploadBy: string;
  resourceLink: string;
  downloadUrl?: string | null;
  source: string;
  firstSize: number;
  resourceId: string;
  postId: string;
  extCaptions: unknown[];
  resolutionList: ResolutionModel[];
  subjectId: string;
  codecName: string;
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
  bitrate: number;
  type: number;
}

export interface TrailerModel {
  VideoAddress: VideoAddressModel;
  cover: Image;
}

export interface DubModel {
  subjectId: string;
  lanName: string;
  lanCode: string;
  original: boolean;
  type: number;
}

export interface StyleModel {
  colNum: number;
  shape: string;
}

export interface ResolutionItemModel {
  resolution: ResolutionType;
  epNum: number;
}

export interface SeasonItemModel {
  se: number;
  maxEp: number;
  allEp: string;
  resolutions: ResolutionItemModel[];
}

export interface SeasonsModel {
  subjectId: string;
  subjectType: SubjectType;
  seasons: SeasonItemModel[];
}

export interface RootItemDetailsModel extends ResultsSubjectModel {
  resourceDetectors: ResourceDetectorModel[];
  style: StyleModel;
  trailer?: TrailerModel | null;
  dubs: DubModel[];
  staffList: StaffModel[];
  ops?: OpsModel | null;
  seasons?: SeasonsModel | null;
}

export interface VideoFileMetadata {
  episode: number;
  title: string;
  resourceLink: string;
  linkType: number;
  size: number;
  uploadBy: string;
  resourceId: string;
  postId: string;
  extCaptions: unknown[];
  se: number;
  ep: number;
  sourceUrl: string;
  resolution: number;
  codecName: string;
  duration: number;
  requireMemberType: number;
  memberIcon: string;
}

export interface CaptionFileMetadata {
  id: string;
  lan: string;
  lanName: string;
  url: string;
  size: number;
  delay: number;
}

export interface RootCaptionFileMetadata {
  extCaptions: CaptionFileMetadata[];
  subjectId: string;
}

export interface CollectionResolutionModel {
  resolution: ResolutionType;
  averageSize: string;
  epNum: number;
  requireMemberType: number;
  memberIcon: string;
}

export interface RootDownloadableFilesDetailModel {
  pager: PagerModel;
  list: VideoFileMetadata[];
  subjectId: string;
  subjectType: SubjectType;
  cover: Image;
  subjectTitle: string;
  totalSize: string;
  totalEpisode: number;
  position: number;
  resolution: ResolutionType;
  collectionResolutions: CollectionResolutionModel[];
  description: string;
  genre: string[] | string;
  tags: unknown[];
  favInfo: unknown;
  releaseDate: string;
  countryName: string;
  durationSeconds: number;
}

export function firstSearchItem(model: RootSearchResultsModel | RootSearchResultsModelV2): ResultsSubjectModel | undefined {
  return model.items[0];
}

export function totalSeasonEpisodes(seasons: SeasonItemModel[]): number {
  return seasons.reduce((total, season) => total + season.maxEp, 0);
}

export function getSeasonByNumber(model: SeasonsModel, number: number): SeasonItemModel {
  const season = model.seasons.find((item) => item.se === number);
  if (!season) {
    throw new Error(`The item does not have that season number ${number}`);
  }
  return season;
}

export function bestResolution(season: SeasonItemModel): ResolutionItemModel | undefined {
  return season.resolutions.at(-1);
}

export function worstResolution(season: SeasonItemModel): ResolutionItemModel | undefined {
  return season.resolutions[1] ?? season.resolutions[0];
}

export function captions(model: RootCaptionFileMetadata): CaptionFileMetadata[] {
  return model.extCaptions;
}

export function englishSubtitleFile(model: RootCaptionFileMetadata): CaptionFileMetadata | undefined {
  return model.extCaptions.find((caption) => caption.lan === "en");
}

export function getLanguageSubtitleMap(
  model: RootCaptionFileMetadata
): Record<string, CaptionFileMetadata> {
  return Object.fromEntries(model.extCaptions.map((caption) => [caption.lanName, caption]));
}

export function getLanguageShortSubtitleMap(
  model: RootCaptionFileMetadata
): Record<string, CaptionFileMetadata> {
  return Object.fromEntries(model.extCaptions.map((caption) => [caption.lan, caption]));
}

export function getSubtitleByLanguage(
  model: RootCaptionFileMetadata,
  language: string
): CaptionFileMetadata | undefined {
  if (language.length === 2) {
    return getLanguageShortSubtitleMap(model)[language.toLowerCase()];
  }

  const normalized = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
  return getLanguageSubtitleMap(model)[normalized];
}

export function downloadableTitle(model: RootDownloadableFilesDetailModel): string {
  return model.subjectTitle;
}

function assertNonSeriesDownloadList(model: RootDownloadableFilesDetailModel): void {
  if (!model.list.length) {
    throw new ZeroMediaFileError("There are no downloadable mediafiles for the targeted item");
  }
  if (model.subjectType === SubjectType.TV_SERIES) {
    throw new Error(
      "media_file shortcuts are only reserved for non-series downloadable files detail"
    );
  }
}

export function bestMediaFile(model: RootDownloadableFilesDetailModel): VideoFileMetadata {
  assertNonSeriesDownloadList(model);
  return model.list.reduce((found, item) => (item.resolution > found.resolution ? item : found));
}

export function worstMediaFile(model: RootDownloadableFilesDetailModel): VideoFileMetadata {
  assertNonSeriesDownloadList(model);
  return model.list.reduce((found, item) => (item.resolution < found.resolution ? item : found));
}

export function getQualityDownloadsMap(
  model: RootDownloadableFilesDetailModel
): Map<CustomResolutionType, VideoFileMetadata> {
  const map = new Map<CustomResolutionType, VideoFileMetadata>();
  for (const item of model.list) {
    map.set(`${item.resolution}P` as CustomResolutionType, item);
  }
  return map;
}

export function getMediaFileByResolution(
  model: RootDownloadableFilesDetailModel,
  resolution: number
): VideoFileMetadata {
  const mediaFile = model.list.find((item) => item.resolution === resolution);
  if (!mediaFile) {
    const available = model.list.map((item) => item.resolution).join(", ");
    throw new Error(`No media_file matched that resolution. Available resolutions include ${available}`);
  }
  return mediaFile;
}
