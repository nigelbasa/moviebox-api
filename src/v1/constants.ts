import { DownloadMode, SubjectType } from "../v3/constants.js";

export { DownloadMode, SubjectType };

export const MIRROR_HOSTS = ["h5.aoneroom.com"] as const;
export const ENVIRONMENT_HOST_KEY = "MOVIEBOX_API_HOST";
export const SELECTED_HOST =
  process.env[ENVIRONMENT_HOST_KEY] || MIRROR_HOSTS[0];
export const HOST_PROTOCOL = "https";
export const HOST_URL = `${HOST_PROTOCOL}://${SELECTED_HOST}/`;

export const DEFAULT_REQUEST_HEADERS: Record<string, string> = {
  "X-Client-Info": '{"timezone":"Africa/Nairobi"}',
  "Accept-Language": "en-US,en;q=0.5",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
  Referer: HOST_URL,
  Host: SELECTED_HOST
};

export const DOWNLOAD_REQUEST_REFERER = "https://fmoviesunblocked.net/";
export const DOWNLOAD_REQUEST_HEADERS: Record<string, string> = {
  Accept: "*/*",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
  Origin: SELECTED_HOST,
  Referer: DOWNLOAD_REQUEST_REFERER
};

export type DownloadQualitiesType =
  | "WORST"
  | "BEST"
  | "360P"
  | "480P"
  | "720P"
  | "1080P";

export const DOWNLOAD_QUALITIES: DownloadQualitiesType[] = [
  "WORST",
  "BEST",
  "360P",
  "480P",
  "720P",
  "1080P"
];

export const DEFAULT_CAPTION_LANGUAGE = "English";
export const DEFAULT_CAPTION_LANGUAGE_SHORT = "en";
export const ITEM_DETAILS_PATH = "/detail";
export const DEFAULT_TASKS = 5;
