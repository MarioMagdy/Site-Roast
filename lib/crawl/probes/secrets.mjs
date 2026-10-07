// Pattern scan for credentials shipped to the browser. Matches are redacted before they are stored.
// "public" = designed to be exposed (still worth knowing about); "secret" = should never be in client code.

const PATTERNS = [
  { type: "AWS access key ID", re: /\bAKIA[0-9A-Z]{16}\b/g, kind: "secret" },
  { type: "Stripe secret key", re: /\bsk_live_[0-9a-zA-Z]{20,}\b/g, kind: "secret" },
  { type: "OpenAI API key", re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g, kind: "secret" },
  { type: "Anthropic API key", re: /\bsk-ant-[A-Za-z0-9_-]{32,}\b/g, kind: "secret" },
  { type: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{36}\b/g, kind: "secret" },
  { type: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, kind: "secret" },
  { type: "SendGrid API key", re: /\bSG\.[\w-]{22}\.[\w-]{43}\b/g, kind: "secret" },
  { type: "Private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, kind: "secret" },
  { type: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/g, kind: "public" },
  { type: "Stripe publishable key", re: /\bpk_live_[0-9a-zA-Z]{20,}\b/g, kind: "public" },
  { type: "JWT", re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, kind: "jwt" },
];

const redact = (s) => (s.length <= 12 ? s.slice(0, 3) + "…" : `${s.slice(0, 6)}…${s.slice(-4)}`);

function jwtRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return payload.role ?? payload.aud ?? null;
  } catch {
    return null;
  }
}

/** @returns [{type, kind, value (redacted), source}] */
export function scanSecrets(text, source) {
  const hits = [];
  const seen = new Set();
  for (const p of PATTERNS) {
    for (const m of text.matchAll(p.re)) {
      if (seen.has(m[0])) continue;
      seen.add(m[0]);
      let { type, kind } = p;
      if (kind === "jwt") {
        const role = jwtRole(m[0]);
        // Supabase anon keys are public by design; a service_role key in the browser is game over.
        kind = role === "service_role" ? "secret" : "public";
        type = role ? `JWT (role: ${role})` : "JWT";
      }
      hits.push({ type, kind, value: redact(m[0]), source });
      if (hits.length > 30) return hits;
    }
  }
  return hits;
}
