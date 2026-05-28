import type {
  ContentCategoryModelV2,
  ContentModelV2,
  HomepageContentModel,
  SearchResultsItem
} from "./models.js";

export interface HomeRowSummary {
  type: string;
  title: string;
  subjectCount: number;
  bannerCount: number;
  filterCount: number;
  genreTopId?: string;
  detailPath?: string;
  firstPoster?: string;
}

export function getHomeRows(
  homepage: HomepageContentModel,
  options: { type?: string; withSubjects?: boolean; withDetailPath?: boolean } = {}
): ContentCategoryModelV2[] {
  return homepage.operatingList.filter((row) => {
    if (options.type && row.type !== options.type) {
      return false;
    }
    if (options.withSubjects && !(row.subjects?.length > 0)) {
      return false;
    }
    if (options.withDetailPath && !row.detailPath) {
      return false;
    }
    return true;
  });
}

export function summarizeHomeRows(homepage: HomepageContentModel): HomeRowSummary[] {
  return homepage.operatingList.map((row) => ({
    type: row.type,
    title: row.title,
    subjectCount: row.subjects?.length ?? 0,
    bannerCount: row.banner?.items?.length ?? 0,
    filterCount: row.filters?.length ?? 0,
    genreTopId: row.genreTopId || undefined,
    detailPath: row.detailPath || undefined,
    firstPoster: row.subjects?.[0]?.cover?.url ?? row.banner?.items?.[0]?.image?.url
  }));
}

export function findHomeRow(
  homepage: HomepageContentModel,
  title: string
): ContentCategoryModelV2 | undefined {
  const wanted = title.trim().toLowerCase();
  return homepage.operatingList.find((row) => row.title.trim().toLowerCase() === wanted);
}

export function getRowSubjects(row: ContentCategoryModelV2): SearchResultsItem[] {
  return row.subjects as SearchResultsItem[];
}

export function getRowBannerItems(row: ContentCategoryModelV2): ContentModelV2[] {
  return row.banner?.items ?? [];
}

export function getRowFilters(row: ContentCategoryModelV2): unknown[] {
  return row.filters ?? [];
}

export function getRowDrilldownParams(
  row: ContentCategoryModelV2
): { detailPath?: string; genreTopId?: string } {
  return {
    detailPath: row.detailPath || undefined,
    genreTopId: row.genreTopId || undefined
  };
}
