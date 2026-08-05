import { describe, expect, it } from "vitest";
import { filterCandidateUrls } from "./url-filter";

describe("filterCandidateUrls", () => {
  it("deduplicates valid allowed URLs and caps output at five", () => {
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

  it("removes invalid, blocked, and unknown domains by default", () => {
    const urls = filterCandidateUrls([
      "not-a-url",
      "ftp://digitalethiopia.tech/report",
      "https://google.com/search?q=digital+ethiopia",
      "https://x.com/example/status/1",
      "https://random-blog.example/post",
      "https://gcs.gov.et/news",
    ]);

    expect(urls).toEqual([{ url: "https://gcs.gov.et/news", hostname: "gcs.gov.et" }]);
  });

  it("lets operator configuration allow and block domains without code changes", () => {
    const urls = filterCandidateUrls(["https://example.org/report", "https://gcs.gov.et/news"], {
      allowedDomains: ["example.org"],
      blockedDomains: ["gcs.gov.et"],
    });

    expect(urls).toEqual([{ url: "https://example.org/report", hostname: "example.org" }]);
  });

  it("supports a lower max URL limit", () => {
    const urls = filterCandidateUrls(
      ["https://id.gov.et/a", "https://id.gov.et/b", "https://id.gov.et/c"],
      { maxUrls: 2 },
    );

    expect(urls).toHaveLength(2);
  });
});
