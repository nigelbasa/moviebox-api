import {
  DEFAULT_DUB_LANGUAGE_NAME_OR_CODE,
  SEARCH_PER_PAGE_LIMIT,
  VALID_SUBJECT_ID_PATTERN
} from "./constants.js";
import { MissingDubError } from "./exceptions.js";
import type { DubModel, RootItemDetailsModel, SeasonItemModel } from "./models.js";

const FILE_EXT_PATTERN = /.+\.(\w+)\?.+/;
const SERIES_NAME_WITH_SEASON_NUMBER_PATTERN = /^.*\sS\d{1,}$/;
const SERIES_NAME_WITH_SEASON_NUMBER_ONE_PATTERN = /^.*\sS1$/;
const UNWANTED_ITEM_NAME_PATTERN = /(\sS\d{1,}|\sS\d{1,}-S\d{1,}|-S\d{1,})/g;

export function combineUrlPathWithParams(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = new URL(path, "https://moviebox.local");

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  if (isAbsolute) {
    return url.toString();
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function validateSubjectId(subjectId: string): boolean {
  return VALID_SUBJECT_ID_PATTERN.test(subjectId);
}

export function validateSubjectIdOrThrow(subjectId: string): void {
  if (!validateSubjectId(subjectId)) {
    throw new Error(`Invalid subject id passed ${JSON.stringify(subjectId)}`);
  }
}

export function validatePerPageAndThrow(perPage: number): void {
  if (!(perPage > 0 && perPage <= SEARCH_PER_PAGE_LIMIT)) {
    throw new Error(
      `perPage value ${perPage} is NOT between 0 and ${SEARCH_PER_PAGE_LIMIT}`
    );
  }
}

export function getFileExtension(url: string): string | undefined {
  return FILE_EXT_PATTERN.exec(url)?.[1];
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

export interface RequestParams {
  offset: number;
  page: number;
  perPage: number;
  limit: number;
}

export interface PaginationDetails {
  totalEpisodes: number;
  requestParams: RequestParams[];
}

export function getEpisodesAmount(seasons: SeasonItemModel[]): number {
  return seasons.reduce((total, season) => total + season.maxEp, 0);
}

export function getDownloadTvSeriesRequestParams(
  seasons: SeasonItemModel[],
  options: {
    episode?: number;
    season?: number;
    perPage?: number;
    limit?: number;
  } = {}
): PaginationDetails {
  const episode = options.episode ?? 1;
  const season = options.season ?? 1;
  const perPage = options.perPage ?? 20;
  const limit = options.limit ?? -1;
  const params: RequestParams[] = [];
  const seasonNumbers = seasons.map((item) => item.se);

  if (!seasonNumbers.includes(season)) {
    throw new Error(`Season ${season} does not exist. Available seasons: ${seasonNumbers}`);
  }

  const targetSeason = seasons.find((item) => item.se === season)!;
  if (episode > targetSeason.maxEp) {
    throw new Error(
      `Episode ${episode} exceeds season ${season} total episodes (${targetSeason.maxEp}).`
    );
  }

  let totalEpisodes = getEpisodesAmount(seasons);
  const seasonsBefore = seasons.filter((item) => item.se < season);
  const offsetEpisodes = getEpisodesAmount(seasonsBefore) + (episode - 1);
  const availableEpisodes = totalEpisodes - offsetEpisodes;

  if (limit !== -1 && limit > availableEpisodes) {
    throw new Error(
      `Limit ${limit} exceeds available episodes (${availableEpisodes}) from season ${season}, episode ${episode}.`
    );
  }

  const noOffset = episode === 1 && season === seasonNumbers[0];
  const noLimit = limit === -1;

  if (noOffset && noLimit) {
    const numberOfPages = Math.ceil(totalEpisodes / perPage);
    for (let index = 0; index < numberOfPages; index += 1) {
      const pageNumber = index + 1;
      const loadedEpisodes = perPage * index;
      const pageLimit = Math.min(perPage, totalEpisodes - loadedEpisodes);
      params.push({ offset: 0, page: pageNumber, perPage, limit: pageLimit });
    }
  } else {
    const wantedEpisodes = noLimit ? availableEpisodes : limit;
    const offsetPage = Math.floor(offsetEpisodes / perPage);
    const offsetInPage = offsetEpisodes % perPage;
    let loaded = 0;

    if (offsetInPage > 0) {
      const pageLimit = Math.min(perPage - offsetInPage, wantedEpisodes);
      params.push({
        offset: offsetInPage,
        page: offsetPage + 1,
        perPage,
        limit: pageLimit
      });
      loaded += pageLimit;
    }

    while (loaded < wantedEpisodes) {
      const remaining = wantedEpisodes - loaded;
      const currentPage =
        offsetPage +
        Math.ceil((loaded + 1) / perPage) +
        (offsetInPage > 0 ? 1 : 0);
      const pageLimit = Math.min(perPage, remaining);
      params.push({ offset: 0, page: currentPage, perPage, limit: pageLimit });
      loaded += pageLimit;
    }

    totalEpisodes = wantedEpisodes;
  }

  return { totalEpisodes, requestParams: params };
}

export function getDubOrThrow(
  itemDetails: RootItemDetailsModel,
  languageNameOrCode = DEFAULT_DUB_LANGUAGE_NAME_OR_CODE
): DubModel {
  const languageNames: string[] = [];
  const languageCodes: string[] = [];
  const wanted = normalizeDubName(languageNameOrCode);

  for (const dub of itemDetails.dubs) {
    if (
      normalizeDubName(dub.lanName) === wanted ||
      dub.lanCode.toLowerCase() === languageNameOrCode.toLowerCase()
    ) {
      return dub;
    }
    languageNames.push(dub.lanName);
    languageCodes.push(dub.lanCode);
  }

  throw new MissingDubError(
    `No dub matched that language name or language code ${JSON.stringify(languageNameOrCode)}. ` +
      `Available ones include language_names: ${languageNames}, language_codes: ${languageCodes}`
  );
}

export function normalizeDubName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith("original")) {
    return "original";
  }
  return trimmed.replace(/\b(dub|sub)\b/gi, "").trim().toLowerCase();
}

export async function processApiResponse<T = unknown>(response: Response): Promise<T> {
  const bodyText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Unexpected content type ${JSON.stringify(contentType)} encountered. ` +
        `Expected "application/json" - BODY ${JSON.stringify(bodyText)}`
    );
  }

  let json: { code?: number; message?: string; data?: T };
  try {
    json = JSON.parse(bodyText) as { code?: number; message?: string; data?: T };
  } catch (error) {
    throw new Error(`Unable to parse JSON response body: ${bodyText}`, { cause: error });
  }

  if (response.ok && json.code === 0 && json.message === "ok") {
    return json.data as T;
  }

  throw new Error(
    `Unsuccessful response received from server - STATUS ${response.status} - BODY: ${bodyText}`
  );
}
