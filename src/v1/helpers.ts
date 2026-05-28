import { HOST_URL, ITEM_DETAILS_PATH } from "./constants.js";
import { UnsuccessfulResponseError } from "./exceptions.js";

const FILE_EXT_PATTERN = /.+\.(\w+)\?.+/;
const VALID_ITEM_PAGE_URL_PATTERN = new RegExp(
  `^.*${ITEM_DETAILS_PATH}/[\\w-]+(?:\\?id=\\d{17,}.*)?$`
);
const SCHEME_HOST_PATTERN = /^https?:\/\/[-_.\w]+/;
const SERIES_NAME_WITH_SEASON_NUMBER_PATTERN = /^.*\sS\d{1,}$/;
const SERIES_NAME_WITH_SEASON_NUMBER_ONE_PATTERN = /^.*\sS1$/;
const UNWANTED_ITEM_NAME_PATTERN = /(\sS\d{1,}|\sS\d{1,}-S\d{1,}|-S\d{1,})/g;

export function getAbsoluteUrl(relativeUrl: string, baseUrl = HOST_URL): string {
  const normalized = relativeUrl.replace(SCHEME_HOST_PATTERN, "");
  return new URL(normalized, baseUrl).toString();
}

export async function processApiResponse<T = unknown>(response: Response): Promise<T> {
  const bodyText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Unexpected content type ${JSON.stringify(contentType)} encountered. Expected "application/json" - BODY ${JSON.stringify(bodyText)}`
    );
  }

  const payload = JSON.parse(bodyText) as {
    code?: number;
    message?: string;
    data?: T;
  };

  if (payload.code === 0 && payload.message === "ok") {
    return payload.data as T;
  }

  throw new UnsuccessfulResponseError(
    response,
    `Unsuccessful response received from server - STATUS ${response.status} - BODY: ${bodyText}`
  );
}

export const extractDataFieldValue = processApiResponse;

export function getFileExtension(url: string): string | undefined {
  return FILE_EXT_PATTERN.exec(String(url))?.[1];
}

export function validateItemPageUrl(url: string): string {
  if (VALID_ITEM_PAGE_URL_PATTERN.test(url)) {
    return url;
  }
  throw new Error(`Invalid url for a specific item page - ${JSON.stringify(url)}`);
}

export function isValidSearchItem(itemName: string): boolean {
  if (SERIES_NAME_WITH_SEASON_NUMBER_PATTERN.test(itemName)) {
    return SERIES_NAME_WITH_SEASON_NUMBER_ONE_PATTERN.test(itemName);
  }
  return true;
}

export function sanitizeItemName(itemName: string): string {
  return itemName.replace(UNWANTED_ITEM_NAME_PATTERN, "");
}
