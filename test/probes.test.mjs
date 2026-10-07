import assert from "node:assert/strict";
import { test } from "node:test";
import { scanSecrets } from "../lib/crawl/probes/secrets.mjs";
import { referencedHosts } from "../lib/crawl/probes/network.mjs";
import { classifyHost, FREE_HOSTING } from "../lib/crawl/site/known-hosts.mjs";

const jwt = (payload) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.c2lnbmF0dXJlc2lnbmF0dXJl`;

test("secrets are redacted and classified; Supabase anon keys are public, service_role is secret", () => {
  // Fixtures are assembled at runtime so secret scanners don't flag this test file itself.
  const fakeAws = ["AKIA", "ABCDEFGHIJKLMNOP"].join("");
  const hits = scanSecrets(`const a="${fakeAws}"; const anon="${jwt({ role: "anon", iss: "supabase" })}"; const svc="${jwt({ role: "service_role" })}"`, "app.js");
  const byType = Object.fromEntries(hits.map((h) => [h.type, h]));
  assert.equal(byType["AWS access key ID"].kind, "secret");
  assert.ok(!byType["AWS access key ID"].value.includes("ABCDEFGHIJKL")); // redacted
  assert.equal(byType["JWT (role: anon)"].kind, "public");
  assert.equal(byType["JWT (role: service_role)"].kind, "secret");
});

test("referenced hosts are pulled from code", () => {
  assert.deepEqual(referencedHosts(`fetch("https://script.google.com/macros/s/x/exec"); const u='https://abc.supabase.co/rest'`).sort(), ["abc.supabase.co", "script.google.com"]);
});

test("hosts are classified and free hosting is detected", () => {
  assert.equal(classifyHost("abc.supabase.co").name, "Supabase");
  assert.equal(classifyHost("fonts.gstatic.com").category, "fonts");
  assert.ok(FREE_HOSTING.test("example-academy.pages.dev"));
  assert.ok(!FREE_HOSTING.test("example.com"));
});
