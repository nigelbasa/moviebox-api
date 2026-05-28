import { getAbsoluteUrl as getV1AbsoluteUrl } from "../v1/helpers.js";
import { HOST_URL } from "./constants.js";

const VALID_DETAIL_PATH_PATTERN = /^[\w-]+-\w{9,13}$/;

export function getAbsoluteUrl(relativeUrl: string, baseUrl = HOST_URL): string {
  return getV1AbsoluteUrl(relativeUrl, baseUrl);
}

export function validateDetailPath(path: string): boolean {
  return VALID_DETAIL_PATH_PATTERN.test(path);
}
