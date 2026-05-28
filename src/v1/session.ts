import { DOWNLOAD_REQUEST_HEADERS } from "./constants.js";
import { EmptyResponseError } from "./exceptions.js";
import { getAbsoluteUrl, processApiResponse } from "./helpers.js";
import type { MovieboxAppInfo } from "./models.js";

export interface SessionOptions {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  timeout?: number;
  fetch?: typeof fetch;
}

export class Session {
  protected movieboxAppInfoUrl = getAbsoluteUrl(
    "/wefeed-h5-bff/app/get-latest-app-pkgs?app_name=moviebox"
  );
  protected readonly headers: Record<string, string>;
  protected readonly timeout: number;
  protected readonly fetchImpl: typeof fetch;
  protected readonly cookies = new Map<string, string>();
  movieboxAppInfo?: MovieboxAppInfo;
  private movieboxAppInfoFetched = false;

  constructor(options: SessionOptions = {}) {
    this.headers = options.headers ?? DOWNLOAD_REQUEST_HEADERS;
    this.timeout = options.timeout ?? 20_000;
    this.fetchImpl = options.fetch ?? fetch;
    for (const [key, value] of Object.entries(options.cookies ?? {})) {
      this.cookies.set(key, value);
    }
  }

  protected cookieHeader(): string | undefined {
    const serialized = [...this.cookies.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
    return serialized || undefined;
  }

  protected absorbCookies(headers: Headers): void {
    const setCookie = headers.get("set-cookie");
    if (!setCookie) {
      return;
    }

    for (const part of setCookie.split(/,(?=\s*[^;=]+=[^;]+)/)) {
      const [pair] = part.trim().split(";");
      const [key, value] = pair?.split("=") ?? [];
      if (key && value) {
        this.cookies.set(key, value);
      }
    }
  }

  protected validateResponse(response: Response): Response {
    if (!response.body) {
      throw new EmptyResponseError(response, "Server returned an empty body response.");
    }
    return response;
  }

  protected async request(
    url: string,
    init: RequestInit = {},
    includeCookies = false
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const headers = new Headers(this.headers);

    if (includeCookies) {
      const cookie = this.cookieHeader();
      if (cookie) {
        headers.set("Cookie", cookie);
      }
    }

    if (init.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    try {
      const response = await this.fetchImpl(url, {
        ...init,
        headers,
        signal: init.signal
          ? AbortSignal.any([init.signal, controller.signal])
          : controller.signal
      });
      this.absorbCookies(response.headers);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return this.validateResponse(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get(
    url: string,
    params: Record<string, string | number | boolean | undefined | null> = {}
  ): Promise<Response> {
    const fullUrl = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        fullUrl.searchParams.set(key, String(value));
      }
    }
    return this.request(fullUrl.toString());
  }

  async getFromApi<T = unknown>(
    url: string,
    params: Record<string, string | number | boolean | undefined | null> = {}
  ): Promise<T> {
    return processApiResponse<T>(await this.get(url, params));
  }

  async getWithCookies(
    url: string,
    params: Record<string, string | number | boolean | undefined | null> = {}
  ): Promise<Response> {
    await this.ensureCookiesAreAssigned();
    const fullUrl = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        fullUrl.searchParams.set(key, String(value));
      }
    }
    return this.request(fullUrl.toString(), {}, true);
  }

  async getWithCookiesFromApi<T = unknown>(
    url: string,
    params: Record<string, string | number | boolean | undefined | null> = {}
  ): Promise<T> {
    return processApiResponse<T>(await this.getWithCookies(url, params));
  }

  async post(url: string, json: Record<string, unknown>): Promise<Response> {
    await this.ensureCookiesAreAssigned();
    return this.request(
      url,
      {
        method: "POST",
        body: JSON.stringify(json),
        headers: { "Content-Type": "application/json" }
      },
      true
    );
  }

  async postToApi<T = unknown>(
    url: string,
    json: Record<string, unknown>
  ): Promise<T> {
    return processApiResponse<T>(await this.post(url, json));
  }

  async ensureCookiesAreAssigned(): Promise<boolean> {
    if (!this.movieboxAppInfoFetched) {
      await this.fetchAppInfo();
      this.movieboxAppInfoFetched = true;
    }
    return this.cookies.has("account");
  }

  async fetchAppInfo(): Promise<MovieboxAppInfo> {
    const response = await this.request(this.movieboxAppInfoUrl, {}, true);
    const data = await processApiResponse<MovieboxAppInfo | MovieboxAppInfo[]>(response);
    const appInfo = Array.isArray(data) ? data[0] : data;
    if (!appInfo) {
      throw new EmptyResponseError(response, "Server returned no app package info.");
    }
    this.movieboxAppInfo = appInfo;
    return this.movieboxAppInfo;
  }

  updateSessionCookies = this.fetchAppInfo;
}
