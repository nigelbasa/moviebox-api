export const HOST_POOL = [
  "https://api6.aoneroom.com",
  "https://api5.aoneroom.com",
  "https://api4.aoneroom.com",
  "https://api4sg.aoneroom.com",
  "https://api3.aoneroom.com",
  "https://api6sg.aoneroom.com",
  "https://api.inmoviebox.com"
] as const;

export const DEFAULT_API_BASE = HOST_POOL[0];

export const WEB_API_BASE = "https://h5-api.aoneroom.com";
export const WEB_HOME_PATH = "/wefeed-h5api-bff/page-api/home";

export const WEB_DETAIL_PATHS = [
  "/wefeed-h5api-bff/page-api/subject/detail",
  "/wefeed-h5api-bff/page-api/subject/get",
  "/wefeed-h5api-bff/subject-api/get"
] as const;

export const MAIN_PAGE_PATH = "/wefeed-mobile-bff/tab-operating";
export const SEARCH_PATH = "/wefeed-mobile-bff/subject-api/search";
export const SEARCH_PATH_V2 = "/wefeed-mobile-bff/subject-api/search/v2";
export const SUBJECT_GET_PATH = "/wefeed-mobile-bff/subject-api/get";
export const SEASON_INFO_PATH = "/wefeed-mobile-bff/subject-api/season-info";
export const PLAY_INFO_PATH = "/wefeed-mobile-bff/subject-api/play-info";
export const RESOURCE_PATH = "/wefeed-mobile-bff/subject-api/resource";
export const RESOURCE_POSITION_V2_PATH = "/wefeed-mobile-bff/subject-api/resource-position/v2";
export const EXT_CAPTIONS_PATH = "/wefeed-mobile-bff/subject-api/get-ext-captions";

export function mainPageUrl(base: string, page = 1, tabId: string | number = 0): string {
  return `${base}${MAIN_PAGE_PATH}?page=${page}&tabId=${tabId}&version=`;
}

export function subjectUrl(base: string, subjectId: string): string {
  return `${base}${SUBJECT_GET_PATH}?subjectId=${subjectId}`;
}

export function seasonInfoUrl(base: string, subjectId: string): string {
  return `${base}${SEASON_INFO_PATH}?subjectId=${subjectId}`;
}

export function playInfoUrl(
  base: string,
  subjectId: string,
  season = 0,
  episode = 0
): string {
  return `${base}${PLAY_INFO_PATH}?subjectId=${subjectId}&se=${season}&ep=${episode}`;
}

export function resourceUrl(
  base: string,
  subjectId: string,
  season: number,
  episode: number
): string {
  return `${base}${RESOURCE_PATH}?subjectId=${subjectId}&se=${season}&ep=${episode}`;
}

export function webDetailUrl(subjectId: string, path: string): string {
  return `${WEB_API_BASE}${path}?subjectId=${subjectId}`;
}
