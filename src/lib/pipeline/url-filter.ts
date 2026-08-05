export type UrlFilterConfig = {
  allowedDomains?: string[];
  blockedDomains?: string[];
  maxUrls?: number;
};

export type FilteredUrl = {
  url: string;
  hostname: string;
};

const defaultMaxUrls = 5;

const defaultBlockedDomains = [
  "bit.ly",
  "facebook.com",
  "drive.google.com",
  "dropbox.com",
  "google.com",
  "instagram.com",
  "linkedin.com",
  "medium.com",
  "reddit.com",
  "t.co",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "youtube.com",
];

const defaultAllowedDomains = [
  "afdb.org",
  "capitalethiopia.com",
  "digitalethiopia.tech",
  "ena.et",
  "ethiotelecom.et",
  "gcs.gov.et",
  "id.gov.et",
  "mofed.gov.et",
  "nbebank.com",
  "statsethiopia.gov.et",
  "worldbank.org",
];

export function filterCandidateUrls(candidateUrls: string[], config: UrlFilterConfig = {}) {
  const maxUrls = config.maxUrls ?? defaultMaxUrls;
  const allowedDomains = normalizeDomains([
    ...(config.allowedDomains ?? []),
    ...defaultAllowedDomains,
  ]);
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
    if (matchesDomain(hostname, blockedDomains) || !matchesDomain(hostname, allowedDomains)) {
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
