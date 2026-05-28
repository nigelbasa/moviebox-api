import { SubjectType } from "../v1/constants.js";

export { SubjectType };

export const MIRROR_HOSTS = ["h5-api.aoneroom.com"] as const;
export const ENVIRONMENT_HOST_KEY = "MOVIEBOX_API_HOST_V2";
export const SELECTED_HOST =
  process.env[ENVIRONMENT_HOST_KEY] || MIRROR_HOSTS[0];
export const HOST_PROTOCOL = "https";
export const HOST_URL = `${HOST_PROTOCOL}://${SELECTED_HOST}/`;
export const REFERER = "https://videodownloader.site/";

export const DEFAULT_REQUEST_HEADERS: Record<string, string> = {
  "X-Client-Info": '{"timezone":"Africa/Nairobi"}',
  "Accept-Language": "en-US,en;q=0.5",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
  Referer: REFERER
};

export const DOWNLOAD_REQUEST_REFERER = REFERER;
export const DOWNLOAD_REQUEST_HEADERS: Record<string, string> = {
  Accept: "*/*",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
  Origin: REFERER,
  Referer: DOWNLOAD_REQUEST_REFERER
};

export const SINGLE_ITEM_SUBJECT_TYPES = new Set([
  SubjectType.MUSIC,
  SubjectType.MOVIES,
  SubjectType.ANIME,
  SubjectType.EDUCATION
]);
