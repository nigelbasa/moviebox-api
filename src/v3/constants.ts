import { randomBytes, randomInt, randomUUID } from "node:crypto";

export const SECRET_KEY_DEFAULT =
  process.env.MOVIEBOX_SECRET_KEY_DEFAULT?.trim() ||
  "76iRl07s0xSN9jqmEWAt79EBJZulIQIsV64FZr2O";

export const SECRET_KEY_ALT =
  process.env.MOVIEBOX_SECRET_KEY_ALT?.trim() ||
  "Xqn2nnO41/L92o1iuXhSLHTbXvY4Z5ZZ62m8mSLA";

export const AUTH_TOKEN = process.env.MOVIEBOX_AUTH_TOKEN?.trim() || undefined;

export const WEB_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/123.0.0.0 Safari/537.36";

export const RETRY_STATUS_CODES = new Set([403, 407, 429, 500, 502, 503, 504]);

export const BLOCKED_HOST_KEYWORDS = [
  "fzmovies",
  "vegamovies",
  "effectivegate",
  "gatecpm",
  "adsterra",
  "doubleclick"
] as const;

export const MEDIA_PATH_EXTENSIONS = [
  ".m3u8",
  ".mp4",
  ".mkv",
  ".webm",
  ".ts",
  ".mpd"
] as const;

export const MEDIA_URL_HINTS = [
  ".m3u8",
  ".mp4",
  "downloadurl=",
  "resourcelink",
  "sign=",
  "/resource/"
] as const;

export const SERIES_TRAILER_FRAGMENTS = [
  "/media/vone/",
  "-ld.mp4",
  "/trailer/"
] as const;

export const TRAILER_CONTENT_FRAGMENTS = [
  "trailer",
  "teaser",
  "clip"
] as const;

export const SIGNATURE_BODY_MAX_BYTES = 102_400;
export const SEARCH_PER_PAGE_LIMIT = 20;
export const RESULTS_PER_PAGE_AMOUNT = SEARCH_PER_PAGE_LIMIT;
export const VALID_SUBJECT_ID_PATTERN = /^\d{17,21}$/;
export const DEFAULT_DUB_LANGUAGE_NAME_OR_CODE = "Original";
export const DEFAULT_CAPTION_LANGUAGE = "English";
export const DEFAULT_CAPTION_LANGUAGE_SHORT = "en";
export const DEFAULT_CHUNK_SIZE = 1024 * 1024;
export const DEFAULT_READ_TIMEOUT_ATTEMPTS = 3;
export const DEFAULT_TASKS = 5;
export const DEFAULT_TASKS_LIMIT = 10;
export const DOWNLOAD_PART_EXTENSION = ".part";

export enum SubjectType {
  ALL = 0,
  MOVIES = 1,
  TV_SERIES = 2,
  EDUCATION = 5,
  MUSIC = 6,
  ANIME = 7,
  UNKNOWN = 9
}

export enum DownloadMode {
  AUTO = "auto",
  OVERWRITE = "overwrite",
  RESUME = "resume"
}

export enum TabID {
  ALL = "All",
  MUSIC = "Music",
  PEOPLE = "People",
  EDUCATION = "Education",
  MOVIE = "Movie",
  TV_SERIES = "TV",
  MOVIE_TV = "MovieTV",
  SHORT_TV = "ShortTV",
  FIGHTZONE = "FightZone",
  SPORTS = "Sports"
}

export enum TopicType {
  SUBJECT = "SUBJECT",
  VERTICAL_RANK = "VERTICAL_RANK"
}

export enum ResolutionType {
  _360P = 360,
  _480P = 480,
  _720P = 720,
  _1080P = 1080,
  UNSPECIFIED = 0
}

export enum CustomResolutionType {
  _360P = "360P",
  _480P = "480P",
  _720P = "720P",
  _1080P = "1080P",
  BEST = "best",
  WORST = "worst"
}

export function customResolutionToResolution(
  value: CustomResolutionType
): ResolutionType {
  switch (value) {
    case CustomResolutionType._360P:
    case CustomResolutionType.WORST:
      return ResolutionType._360P;
    case CustomResolutionType._480P:
      return ResolutionType._480P;
    case CustomResolutionType._720P:
      return ResolutionType._720P;
    case CustomResolutionType._1080P:
    case CustomResolutionType.BEST:
      return ResolutionType._1080P;
  }
}

export function normalizeResolution(
  value: ResolutionType | CustomResolutionType | number | string
): number {
  if (typeof value === "number") {
    return value;
  }

  const normalized = value.toLowerCase();
  if (normalized === "best") {
    return ResolutionType._1080P;
  }
  if (normalized === "worst") {
    return ResolutionType._360P;
  }

  const numeric = Number.parseInt(normalized.replace(/p$/, ""), 10);
  if (Number.isNaN(numeric)) {
    throw new ValueError(`Invalid resolution ${value}`);
  }
  return numeric;
}

export function subjectTypeMap(ignoreNames: string[] = []): Record<string, number> {
  const entries: Record<string, number> = {};
  for (const [name, value] of Object.entries(SubjectType)) {
    if (Number.isNaN(Number(name)) && typeof value === "number" && !ignoreNames.includes(name)) {
      entries[name] = value;
    }
  }
  return entries;
}

function randomChoice<T>(items: readonly T[]): T {
  return items[randomInt(items.length)]!;
}

function randomHex(length: number): string {
  return randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

function generateClientInfo(): { userAgent: string; clientInfo: string } {
  const androidVersions = [
    { version: "9", build: "PQ3A.190605.03081104" },
    { version: "10", build: "QP1A.191005.007.A3" },
    { version: "11", build: "RP1A.200720.011" },
    { version: "12", build: "S1B.220414.015" },
    { version: "13", build: "TQ2A.230405.003" }
  ];
  const redmiDevices = [
    { model: "23078RKD5C", brand: "Redmi" },
    { model: "2201117TY", brand: "Redmi" },
    { model: "2201117TG", brand: "Redmi" },
    { model: "22101316G", brand: "Redmi" },
    { model: "21121210G", brand: "Redmi" },
    { model: "M2012K11AG", brand: "Redmi" },
    { model: "M2007J20CG", brand: "Redmi" }
  ];
  const versionCodes = [50020042, 50020043, 50020044, 50020045, 50020046];
  const networkTypes = ["NETWORK_WIFI", "NETWORK_MOBILE"];
  const timezones = [
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "America/New_York",
    "Europe/London"
  ];

  const android = randomChoice(androidVersions);
  const device = randomChoice(redmiDevices);
  const versionCode = randomChoice(versionCodes);
  const network = randomChoice(networkTypes);
  const timezone = randomChoice(timezones);

  const userAgent =
    `com.community.oneroom/${versionCode} ` +
    `(Linux; U; Android ${android.version}; en_US; ` +
    `${device.model}; Build/${android.build}; Cronet/135.0.7012.3)`;

  const clientInfo = JSON.stringify({
    package_name: "com.community.oneroom",
    version_name: "3.0.03.0529.03",
    version_code: versionCode,
    os: "android",
    os_version: android.version,
    install_ch: "ps",
    device_id: randomHex(32),
    install_store: "ps",
    gaid: randomUUID(),
    brand: device.brand,
    model: device.model,
    system_language: "en",
    net: network,
    region: "US",
    timezone,
    sp_code: "40401",
    "X-Play-Mode": "2"
  });

  return { userAgent, clientInfo };
}

const generatedClientInfo = generateClientInfo();

export const USER_AGENT = generatedClientInfo.userAgent;
export const CLIENT_INFO = generatedClientInfo.clientInfo;

export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
  }
}
