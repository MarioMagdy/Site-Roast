import assert from "node:assert/strict";
import { test } from "node:test";
import { makeNormalizer, slugFor } from "../lib/crawl/urls.mjs";

test("normalizer keeps same-origin pages and strips hash/query/trailing slash", () => {
  const n = makeNormalizer("https://ex.com");
  assert.equal(n("/pricing/?ref=x#top"), "https://ex.com/pricing");
  assert.equal(n("https://other.com/a"), null);
  assert.equal(n("/brochure.pdf"), null);
});

test("normalizer skips app/auth pages unless includeApp", () => {
  assert.equal(makeNormalizer("https://ex.com")("/login"), null);
  assert.equal(makeNormalizer("https://ex.com", { includeApp: true })("/login"), "https://ex.com/login");
  assert.equal(makeNormalizer("https://ex.com")("/apply"), "https://ex.com/apply"); // not /app
});

test("slugs are stable and filesystem-safe", () => {
  assert.equal(slugFor("https://ex.com"), "index");
  assert.equal(slugFor("https://ex.com/blog/post-1/"), "blog_post-1");
});
