// Classify third-party hosts. Order matters: first match wins.
export const HOST_CATEGORIES = [
  ["backend", "Supabase", /\.supabase\.co$/],
  ["backend", "Firebase", /firebaseio\.com$|firestore\.googleapis\.com$|identitytoolkit\.googleapis\.com$|\.firebaseapp\.com$/],
  ["backend", "Google Apps Script", /^script\.google(usercontent)?\.com$/],
  ["backend", "Formspree", /formspree\.io$/],
  ["backend", "Airtable", /airtable\.com$/],
  ["backend", "Netlify Functions/Forms", /\.netlify\.app$/],
  ["backend", "Make/Zapier webhook", /hook\.[a-z0-9]+\.make\.com$|hooks\.zapier\.com$/],
  ["backend", "Algolia", /algolia(net)?\.(com|net|io)$/],
  ["cms", "Sanity", /\.sanity\.io$/],
  ["cms", "Contentful", /contentful\.com$/],
  ["payments", "Stripe", /stripe\.com$|stripe\.network$/],
  ["payments", "Paymob", /paymob\.com$/],
  ["payments", "PayPal", /paypal\.com$|paypalobjects\.com$/],
  ["analytics", "Google Analytics / Tag Manager", /google-analytics\.com$|googletagmanager\.com$|analytics\.google\.com$/],
  ["analytics", "Cloudflare Web Analytics", /cloudflareinsights\.com$/],
  ["analytics", "Vercel Analytics", /vercel-insights\.com$|vercel-scripts\.com$/],
  ["analytics", "Plausible", /plausible\.io$/],
  ["analytics", "PostHog", /posthog\.com$/],
  ["analytics", "Hotjar", /hotjar\.(com|io)$/],
  ["analytics", "Microsoft Clarity", /clarity\.ms$/],
  ["analytics", "Mixpanel / Segment", /mixpanel\.com$|segment\.(com|io)$/],
  ["ads", "Meta Pixel", /connect\.facebook\.net$|facebook\.com$/],
  ["ads", "TikTok Pixel", /analytics\.tiktok\.com$/],
  ["ads", "Google Ads", /doubleclick\.net$|googleadservices\.com$|googlesyndication\.com$/],
  ["fonts", "Google Fonts", /fonts\.(googleapis|gstatic)\.com$/],
  ["fonts", "Adobe Fonts", /typekit\.net$/],
  ["cdn", "Public CDN", /cdnjs\.cloudflare\.com$|jsdelivr\.net$|unpkg\.com$|code\.jquery\.com$/],
  ["chat", "Chat widget", /intercom|crisp\.chat|tawk\.to|drift\.com|hubspot|zendesk|tidio/],
  ["media", "YouTube / Vimeo", /youtube\.com$|ytimg\.com$|vimeo\.com$|vimeocdn\.com$/],
  ["maps", "Google Maps", /maps\.googleapis\.com$|maps\.gstatic\.com$/],
  ["social", "Social link", /instagram\.com$|tiktok\.com$|linkedin\.com$|twitter\.com$|x\.com$|wa\.me$|whatsapp\.com$/],
];

export function classifyHost(host) {
  for (const [category, name, re] of HOST_CATEGORIES) if (re.test(host)) return { category, name };
  return { category: "other", name: host };
}

export const FREE_HOSTING = /\.(pages\.dev|vercel\.app|netlify\.app|github\.io|web\.app|firebaseapp\.com|herokuapp\.com|onrender\.com|wixsite\.com|framer\.(website|app)|webflow\.io|glitch\.me|replit\.app|surge\.sh)$/;

export function hostingFromHeaders(host, headers = {}) {
  if (/\.pages\.dev$/.test(host)) return "Cloudflare Pages";
  if (headers["x-vercel-id"] || /\.vercel\.app$/.test(host)) return "Vercel";
  if (headers["x-nf-request-id"] || /\.netlify\.app$/.test(host)) return "Netlify";
  if (headers["x-github-request-id"] || /\.github\.io$/.test(host)) return "GitHub Pages";
  if (headers["x-amz-cf-id"]) return "AWS CloudFront";
  if (/cloudflare/i.test(headers.server ?? "")) return "Cloudflare";
  return headers.server ?? null;
}
