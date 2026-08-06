export type UrlFilterConfig = {
  /** Operator override: domains that always pass, winning over every block rule. */
  allowedDomains?: string[];
  /** Operator override: domains blocked in addition to the default block patterns. */
  blockedDomains?: string[];
  maxUrls?: number;
};

export type FilteredUrl = {
  url: string;
  hostname: string;
};

const defaultMaxUrls = 5;

/**
 * Default block patterns per BRD-0002.R4.AC5, grouped by category (policy: D-0019
 * blocklist-with-default-allow — every domain not matching a block rule passes,
 * which is how AC6's open-ended source categories get through without enumeration).
 */
export const defaultBlockedDomainCategories: Readonly<Record<string, readonly string[]>> = {
  "social-media-aggregators": [
    "facebook.com",
    "flipboard.com",
    "instagram.com",
    "linkedin.com",
    "medium.com",
    "pinterest.com",
    "snapchat.com",
    "t.me",
    "telegram.me",
    "threads.net",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "youtube.com",
  ],
  "search-result-pages": [
    "baidu.com",
    "bing.com",
    "duckduckgo.com",
    "ecosia.org",
    "google.com",
    "search.brave.com",
    "search.yahoo.com",
    "startpage.com",
    "yandex.com",
  ],
  "url-shorteners": [
    "bit.ly",
    "buff.ly",
    "cutt.ly",
    "goo.gl",
    "is.gd",
    "lnkd.in",
    "ow.ly",
    "rebrand.ly",
    "t.co",
    "tinyurl.com",
  ],
  "file-sharing": [
    "4shared.com",
    "box.com",
    "drive.google.com",
    "dropbox.com",
    "mediafire.com",
    "mega.nz",
    "scribd.com",
    "slideshare.net",
    "wetransfer.com",
  ],
  "login-only-sites": [
    "accounts.google.com",
    "auth0.com",
    "login.live.com",
    "login.microsoftonline.com",
    "okta.com",
  ],
  "low-signal-forums": ["4chan.org", "quora.com", "reddit.com", "tapatalk.com"],
};

export const defaultBlockedDomains: readonly string[] = Object.values(
  defaultBlockedDomainCategories,
).flat();

export function filterCandidateUrls(candidateUrls: string[], config: UrlFilterConfig = {}) {
  const maxUrls = config.maxUrls ?? defaultMaxUrls;
  const allowedDomains = normalizeDomains(config.allowedDomains ?? []);
  const blockedDomains = normalizeDomains([
    ...(config.blockedDomains ?? []),
    ...defaultBlockedDomains,
  ]);
  const seen = new Set<string>();
  const filtered: FilteredUrl[] = [];

  for (const candidateUrl of candidateUrls) {
    const parsedUrl = parseHttpUrl(candidateUrl);
    if (!parsedUrl) {
      continue;
    }

    const canonicalUrl = canonicalizeUrl(parsedUrl);
    if (seen.has(canonicalUrl)) {
      continue;
    }

    const hostname = normalizeHostname(parsedUrl.hostname);
    const isAllowed = matchesDomain(hostname, allowedDomains);
    if (!isAllowed && matchesDomain(hostname, blockedDomains)) {
      continue;
    }

    seen.add(canonicalUrl);
    filtered.push({ url: canonicalUrl, hostname });

    if (filtered.length >= maxUrls) {
      break;
    }
  }

  return filtered;
}

function parseHttpUrl(candidateUrl: string) {
  try {
    const url = new URL(candidateUrl.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function canonicalizeUrl(url: URL) {
  url.hash = "";
  url.hostname = normalizeHostname(url.hostname);

  if (
    (url.protocol === "https:" && url.port === "443") ||
    (url.protocol === "http:" && url.port === "80")
  ) {
    url.port = "";
  }

  return url.toString();
}

function normalizeDomains(domains: string[]) {
  return domains.map(normalizeHostname).filter(Boolean);
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function matchesDomain(hostname: string, domains: string[]) {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}
