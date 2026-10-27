import { createHash, createHmac } from "node:crypto";
import {
  CLIENT_INFO,
  SECRET_KEY_ALT,
  SECRET_KEY_DEFAULT,
  SIGNATURE_BODY_MAX_BYTES,
  USER_AGENT
} from "./constants.js";

export function md5Hex(data: Buffer | string): string {
  return createHash("md5").update(data).digest("hex");
}

export function b64Decode(value: string): Buffer {
  const padding = (4 - (value.length % 4)) % 4;
  return Buffer.from(value + "=".repeat(padding), "base64");
}

export function b64Encode(data: Buffer): string {
  return data.toString("base64");
}

export function generateXClientToken(timestampMs = Date.now()): string {
  const timestamp = String(timestampMs);
  const reversedTimestamp = [...timestamp].reverse().join("");
  return `${timestamp},${md5Hex(reversedTimestamp)}`;
}

function sortedQueryString(url: string): string {
  const parsed = new URL(url);
  const groups = new Map<string, string[]>();

  for (const [key, value] of parsed.searchParams.entries()) {
    const existing = groups.get(key) ?? [];
    existing.push(value);
    groups.set(key, existing);
  }

  const parts: string[] = [];
  for (const key of [...groups.keys()].sort()) {
    for (const value of groups.get(key) ?? []) {
      parts.push(`${key}=${value}`);
    }
  }

  return parts.join("&");
}

export function buildCanonicalString(
  method: string,
  accept: string | undefined,
  contentType: string | undefined,
  url: string,
  body: string | undefined,
  timestampMs: number
): string {
  const parsed = new URL(url);
  const query = sortedQueryString(url);
  const canonicalUrl = query ? `${parsed.pathname}?${query}` : parsed.pathname;

  let bodyHash = "";
  let bodyLength = "";
  if (body !== undefined) {
    const bodyBytes = Buffer.from(body, "utf8");
    bodyHash = md5Hex(bodyBytes.subarray(0, SIGNATURE_BODY_MAX_BYTES));
    bodyLength = String(bodyBytes.length);
  }

  return [
    method.toUpperCase(),
    accept ?? "",
    contentType ?? "",
    bodyLength,
    String(timestampMs),
    bodyHash,
    canonicalUrl
  ].join("\n");
}

export function generateXTrSignature(
  method: string,
  accept: string | undefined,
  contentType: string | undefined,
  url: string,
  body?: string,
  useAltKey = false,
  timestampMs = Date.now()
): string {
  const canonical = buildCanonicalString(
    method,
    accept,
    contentType,
    url,
    body,
    timestampMs
  );
  const secret = b64Decode(useAltKey ? SECRET_KEY_ALT : SECRET_KEY_DEFAULT);
  const signature = createHmac("md5", secret).update(canonical, "utf8").digest();
  return `${timestampMs}|2|${b64Encode(signature)}`;
}

export interface SignedHeaderOptions {
  method: string;
  url: string;
  accept?: string;
  contentType?: string;
  body?: string;
  includePlayMode?: boolean;
  authToken?: string;
  clientInfo?: string;
  userAgent?: string;
}

export function buildSignedHeaders({
  method,
  url,
  accept = "application/json",
  contentType = "application/json",
  body,
  includePlayMode = true,
  authToken,
  clientInfo = CLIENT_INFO,
  userAgent = USER_AGENT
}: SignedHeaderOptions): Record<string, string> {
  const timestamp = Date.now();
  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: accept,
    "Content-Type": contentType,
    Connection: "keep-alive",
    "X-Client-Token": generateXClientToken(timestamp),
    "x-tr-signature": generateXTrSignature(
      method,
      accept,
      contentType,
      url,
      body,
      false,
      timestamp
    ),
    "X-Client-Info": clientInfo,
    "X-Client-Status": "0"
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  if (includePlayMode) {
    headers["X-Play-Mode"] = "2";
  }

  return headers;
}
