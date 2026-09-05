import assert from "node:assert/strict";
import { test } from "node:test";

async function config(value) {
  if (value === undefined) delete process.env.NEXT_ALLOWED_DEV_ORIGINS;
  else process.env.NEXT_ALLOWED_DEV_ORIGINS = value;
  return (await import(`../next.config.ts?value=${encodeURIComponent(value)}`)).default;
}

test("local development does not trust additional origins by default", async () => {
  assert.deepEqual((await config(undefined)).allowedDevOrigins, []);
});

test("preview hostnames are trimmed and empty entries are ignored", async () => {
  assert.deepEqual((await config(" demo.preview.example.com, , second.example.com ")).allowedDevOrigins,
    ["demo.preview.example.com", "second.example.com"]);
});
