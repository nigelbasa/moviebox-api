import { AUTH_TOKEN, CLIENT_INFO, RETRY_STATUS_CODES, USER_AGENT } from "./constants.js";
import { buildSignedHeaders } from "./crypto.js";
import { combineUrlPathWithParams, processApiResponse } from "./helpers.js";
import { DEFAULT_API_BASE, HOST_POOL } from "./urls.js";

type FetchLike = typeof fetch;

export interface MovieBoxHttpClientOptions {
  hostPool?: readonly string[];
  timeout?: number;
  followRedirects?: boolean;
  fetch?: FetchLike;
}

export interface RequestOptions {
  accept?: string;
  contentType?: string;
  includePlayMode?: boolean;
  signal?: AbortSignal;
}

export interface GetOptions extends RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: HeadersInit;
}

export interface PostOptions extends RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class MovieBoxHttpClient {
  private readonly hostPool: readonly string[];
  private readonly timeout: number;
  private readonly followRedirects: boolean;
  private readonly fetchImpl: FetchLike;
  private runtimeToken?: string;
  private activeBaseUrl: string;

  constructor(options: MovieBoxHttpClientOptions = {}) {
    this.hostPool = options.hostPool ?? HOST_POOL;
    this.timeout = options.timeout ?? 20_000;
    this.followRedirects = options.followRedirects ?? true;
    this.fetchImpl = options.fetch ?? fetch;
    this.activeBaseUrl = DEFAULT_API_BASE;
  }

  get activeBase(): string {
    return this.activeBaseUrl;
  }

  private get effectiveToken(): string | undefined {
    return this.runtimeToken ?? AUTH_TOKEN;
  }

  private absorbXUser(headers: Headers): void {
    const xUser = headers.get("x-user");
    if (!xUser) {
      return;
    }

    try {
      const payload = JSON.parse(xUser) as { token?: string };
      if (payload.token) {
        this.runtimeToken = payload.token;
      }
    } catch {
      // Best effort token refresh, matching the Python client's quiet fallback.
    }
  }

  private signedHeaders(
    method: string,
    url: string,
    accept = "application/json",
    contentType = "application/json",
    body?: string,
    includePlayMode = false
  ): Record<string, string> {
    return buildSignedHeaders({
      method,
      url,
      accept,
      contentType,
      body,
      includePlayMode,
      authToken: this.effectiveToken,
      clientInfo: CLIENT_INFO,
      userAgent: USER_AGENT
    });
  }

  private async request(
    method: "GET" | "POST",
    pathAndQuery: string,
    options: RequestOptions & { body?: string } = {}
  ): Promise<[string, Response]> {
    let lastResponse: Response | undefined;
    let lastException: unknown;
    let lastBase = this.activeBaseUrl;

    for (const base of this.hostPool) {
      const url = `${base}${pathAndQuery}`;
      const headers = this.signedHeaders(
        method,
        url,
        options.accept,
        options.contentType,
        options.body,
        options.includePlayMode
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      const signal = options.signal
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal;

      try {
        const response = await this.fetchImpl(url, {
          method,
          headers,
          body: method === "POST" ? options.body ?? "" : undefined,
          redirect: this.followRedirects ? "follow" : "manual",
        signal
        });

        this.absorbXUser(response.headers);
        lastResponse = response;
        lastBase = base;

        if (!RETRY_STATUS_CODES.has(response.status)) {
          this.activeBaseUrl = base;
          return [base, response];
        }
      } catch (error) {
        lastException = error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    this.activeBaseUrl = lastBase;
    if (!lastResponse) {
      throw new Error(`All hosts exhausted for ${pathAndQuery}.`, {
        cause: lastException
      });
    }
    return [lastBase, lastResponse];
  }

  async get(path: string, options: GetOptions = {}): Promise<[string, Response]> {
    const pathAndQuery = options.params
      ? combineUrlPathWithParams(path, options.params)
      : path;

    return this.request("GET", pathAndQuery, {
      accept: options.accept,
      contentType: options.contentType,
      includePlayMode: options.includePlayMode,
      signal: options.signal
    });
  }

  async post(
    path: string,
    json: Record<string, unknown>,
    options: PostOptions = {}
  ): Promise<[string, Response]> {
    const pathAndQuery = options.params
      ? combineUrlPathWithParams(path, options.params)
      : path;

    return this.request("POST", pathAndQuery, {
      accept: options.accept ?? "application/json",
      contentType: options.contentType ?? "application/json; charset=utf-8",
      body: JSON.stringify(json),
      includePlayMode: options.includePlayMode,
      signal: options.signal
    });
  }

  async getRaw(
    fullUrl: string,
    options: {
      params?: Record<string, string | number | boolean | undefined | null>;
      headers?: HeadersInit;
      signal?: AbortSignal;
    } = {}
  ): Promise<Response> {
    const url = options.params
      ? combineUrlPathWithParams(fullUrl, options.params)
      : fullUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const signal = options.signal
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal;

      return await this.fetchImpl(url, {
        headers: options.headers ?? {},
        redirect: this.followRedirects ? "follow" : "manual",
        signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getFromApi<T = unknown>(path: string, options: GetOptions = {}): Promise<T> {
    const [, response] = await this.get(path, options);
    return processApiResponse<T>(response);
  }

  async postToApi<T = unknown>(
    path: string,
    json: Record<string, unknown>,
    options: PostOptions = {}
  ): Promise<T> {
    const [, response] = await this.post(path, json, options);
    return processApiResponse<T>(response);
  }
}
