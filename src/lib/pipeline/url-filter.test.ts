import { describe, expect, it } from "vitest";
import { filterCandidateUrls } from "./url-filter";

describe("filterCandidateUrls", () => {
  it("deduplicates valid URLs and caps output at five", () => {
    const urls = filterCandidateUrls([
      "https://www.digitalethiopia.tech/path#section",
      "https://digitalethiopia.tech/path",
      "https://id.gov.et/strategies",
      "https://www.worldbank.org/en/country/ethiopia",
      "https://ethiotelecom.et/report",
      "https://statsethiopia.gov.et/publication",
      "https://ena.et/news",
    ]);

    expect(urls.map((url) => url.url)).toEqual([
      "https://digitalethiopia.tech/path",
      "https://id.gov.et/strategies",
      "https://worldbank.org/en/country/ethiopia",
      "https://ethiotelecom.et/report",
      "https://statsethiopia.gov.et/publication",
    ]);
  });

  it("allows government, regulator, telecom, development-partner, news, and statistics sources by default", () => {
    const sources = [
      "https://www.itu.int/en/mediacentre/Pages/default.aspx",
      "https://www.gsma.com/mobileeconomy/ethiopia/",
      "https://www.un.org/en/digital-cooperation",
      "https://ecc.gov.et/licensing",
      "https://addisstandard.com/telecom-report",
      "https://mint.gov.et/policy",
    ];

    const urls = filterCandidateUrls(sources, { maxUrls: 10 });

    expect(urls.map((url) => url.hostname)).toEqual([
      "itu.int",
      "gsma.com",
      "un.org",
      "ecc.gov.et",
      "addisstandard.com",
      "mint.gov.et",
    ]);
  });

  it("blocks each default category and invalid URLs", () => {
    const urls = filterCandidateUrls([
      "not-a-url",
      "ftp://digitalethiopia.tech/report",
      "https://facebook.com/digital-ethiopia",
      "https://google.com/search?q=digital+ethiopia",
      "https://bit.ly/3abc",
      "https://drive.google.com/file/d/abc/view",
      "https://login.microsoftonline.com/tenant",
      "https://reddit.com/r/ethiopia",
      "https://gcs.gov.et/news",
    ]);

    expect(urls).toEqual([{ url: "https://gcs.gov.et/news", hostname: "gcs.gov.et" }]);
  });

  it("blocks subdomains of default-blocked domains", () => {
    expect(filterCandidateUrls(["https://news.google.com/articles/x"])).toEqual([]);
    expect(filterCandidateUrls(["https://old.reddit.com/r/ethiopia"])).toEqual([]);
  });

  it("applies operator-configured blocked domains without code changes", () => {
    const config = { blockedDomains: ["example-content-farm.com"] };

    expect(filterCandidateUrls(["https://example-content-farm.com/post"], config)).toEqual([]);
    expect(filterCandidateUrls(["https://sub.example-content-farm.com/post"], config)).toEqual([]);
  });

  it("lets operator-allowed domains win over default and operator blocks", () => {
    const config = {
      allowedDomains: ["medium.com", "example-content-farm.com"],
      blockedDomains: ["example-content-farm.com"],
    };

    expect(
      filterCandidateUrls(
        ["https://medium.com/@analyst/report", "https://example-content-farm.com/post"],
        config,
      ),
    ).toEqual([
      { url: "https://medium.com/@analyst/report", hostname: "medium.com" },
      { url: "https://example-content-farm.com/post", hostname: "example-content-farm.com" },
    ]);
  });

  it("lets an operator allow a specific subdomain of a blocked domain", () => {
    const urls = filterCandidateUrls(
      ["https://scholar.google.com/citations?user=x", "https://google.com/search?q=x"],
      { allowedDomains: ["scholar.google.com"] },
    );

    expect(urls.map((url) => url.hostname)).toEqual(["scholar.google.com"]);
  });

  it("supports a lower max URL limit", () => {
    const urls = filterCandidateUrls(
      ["https://id.gov.et/a", "https://id.gov.et/b", "https://id.gov.et/c"],
      { maxUrls: 2 },
    );

    expect(urls).toHaveLength(2);
  });
});
