import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { buildCanonicalString, generateXClientToken } from "../src/v3/index.js";

test("generateXClientToken matches upstream timestamp hash shape", () => {
  const timestamp = 1234567890;
  const expectedHash = createHash("md5")
    .update("0987654321")
    .digest("hex");

  assert.equal(generateXClientToken(timestamp), `${timestamp},${expectedHash}`);
});

test("buildCanonicalString sorts query params and includes body hash metadata", () => {
  const body = JSON.stringify({ b: 2 });
  const bodyHash = createHash("md5").update(body).digest("hex");

  assert.equal(
    buildCanonicalString(
      "post",
      "application/json",
      "application/json; charset=utf-8",
      "https://api.example.test/resource?z=9&a=1",
      body,
      1000
    ),
    [
      "POST",
      "application/json",
      "application/json; charset=utf-8",
      String(Buffer.byteLength(body)),
      "1000",
      bodyHash,
      "/resource?a=1&z=9"
    ].join("\n")
  );
});
