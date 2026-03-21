export type ParsedCitation = {
  url: string;
  canonicalUrl: string;
  rootDomain: string;
  sourceType: "owned" | "competitor" | "third-party" | "unknown";
};

export function extractRootDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function canonicalise(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function classifyDomain(
  domain: string,
  ownedDomains: string[],
  competitorDomains: string[]
): ParsedCitation["sourceType"] {
  if (ownedDomains.some((d) => domain.includes(d) || d.includes(domain))) return "owned";
  if (competitorDomains.some((d) => domain.includes(d) || d.includes(domain))) return "competitor";
  if (domain) return "third-party";
  return "unknown";
}

export function parseCitations(
  citations: Array<{ url: string; label?: string }>,
  ownedDomains: string[],
  competitorDomains: string[]
): ParsedCitation[] {
  return citations.map((c) => {
    const rootDomain = extractRootDomain(c.url);
    return {
      url: c.url,
      canonicalUrl: canonicalise(c.url),
      rootDomain,
      sourceType: classifyDomain(rootDomain, ownedDomains, competitorDomains),
    };
  });
}
