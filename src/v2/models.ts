import type {
  ContentCategoryModel,
  ContentImageModel,
  ContentModel,
  PlatformsModel,
  SearchResultsItem as SearchResultsItemV1,
  SearchResultsModel as SearchResultsModelV1
} from "../v1/models.js";
import { getAbsoluteUrl } from "./helpers.js";

export type { ContentImageModel, ContentModel, PlatformsModel };

export interface ContentModelV2 extends Omit<ContentModel, "subject" | "url"> {
  subject?: SearchResultsItem | null;
  detailPath: string;
  url?: string | null;
}

export interface ContentCategoryBannerModelV2 {
  items: ContentModelV2[];
}

export interface ContentCategoryModelV2 extends Omit<ContentCategoryModel, "banner"> {
  banner?: ContentCategoryBannerModelV2 | null;
  filters: unknown[];
  customData: unknown;
  genreTopId: string;
  detailPath: string;
}

export interface HomepageContentModel {
  platformList: PlatformsModel[];
  operatingList: ContentCategoryModelV2[];
}

export interface OPS {
  trace_id: string;
  search_abt: string;
  q: string;
}

export interface DubModel {
  subjectId: string;
  lanName: string;
  lanCode: string;
  original: boolean;
  type: number;
  detailPath: string;
}

export interface SearchResultsItem extends Omit<SearchResultsItemV1, "ops" | "subtitles"> {
  subtitles?: string[] | string | null;
  ops?: OPS | string | null;
  imdbRatingCount?: number | null;
  stills?: ContentImageModel | null;
  postTitle?: string;
  season?: number;
  dubs?: DubModel[] | null;
}

export function pageUrl(item: SearchResultsItem): string {
  return getAbsoluteUrl(`/wefeed-h5api-bff/detail?detailPath=${item.detailPath}`);
}

export interface SearchResultsModel extends Omit<SearchResultsModelV1, "items"> {
  items: SearchResultsItem[];
}

export function firstItem(model: SearchResultsModel): SearchResultsItem | undefined {
  return model.items[0];
}

export interface SpecificItemDetailsModel {
  subject: SearchResultsItem;
  stars: unknown[];
  resource: unknown;
  metadata: unknown;
  isForbid: boolean;
  watchTimeLimit: number;
  postList: unknown;
}
