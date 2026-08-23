/**
 * TikTok Shop URL normalization (US-first allowlist).
 *
 * Allowed hosts / patterns (documented US TikTok Shop product & shop surfaces):
 * - shop.tiktok.com — primary storefront (e.g. /view/product/{id}, /us/pdp/{slug}/{id}, /us/c/..., shop pages)
 * - www.tiktok.com with pathname under /shop/ — alternate shop entry (e.g. /shop/pdp/{id}, /shop/store/...)
 * - tiktok.com with pathname under /shop/ — same as www without the prefix
 *
 * Rejected: short links (vm.tiktok.com), creator video pages, chat invites, any non–TikTok Shop host.
 * Tracking query params are stripped so urlKey is stable for the same product.
 */

export type NormalizedTikTokShopUrl = {
  /** Canonical https URL without tracking params */
  url: string;
  /** Stable key: lowercase host + pathname (no trailing slash, no query/hash) */
  urlKey: string;
};

const TRACKING_PARAM_EXACT = new Set([
  "ttclid",
  "msclkid",
  "gclid",
  "fbclid",
  "mc_eid",
  "igshid",
  "si",
  "_r",
  "enter_method",
  "enter_from",
  "is_copy_url",
  "is_from_webapp",
  "sender_device",
  "share_app_id",
  "share_author_id",
  "share_link_id",
  "share_item_id",
]);

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  if (TRACKING_PARAM_EXACT.has(lower)) return true;
  if (lower.startsWith("utm_")) return true;
  return false;
}

function isAllowedTikTokShop(hostname: string, pathname: string): boolean {
  const host = hostname.toLowerCase();
  const path = pathname.toLowerCase();

  if (host === "shop.tiktok.com") {
    return true;
  }

  if (host === "www.tiktok.com" || host === "tiktok.com") {
    return path === "/shop" || path.startsWith("/shop/");
  }

  return false;
}

/**
 * Normalize a TikTok Shop product/shop URL.
 * @throws Error when the host/path is not an allowed TikTok Shop surface
 */
export function normalizeTikTokShopUrl(input: string): NormalizedTikTokShopUrl {
  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new Error("Invalid URL: not a valid absolute URL for TikTok Shop");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid URL: TikTok Shop links must use http(s)");
  }

  const hostname = parsed.hostname.toLowerCase();
  // Drop trailing slash except for root
  let pathname = parsed.pathname.replace(/\/+$/, "") || "/";

  if (!isAllowedTikTokShop(hostname, pathname)) {
    throw new Error(
      "URL must be a TikTok Shop product or shop link (shop.tiktok.com or tiktok.com/shop/...)",
    );
  }

  const kept = new URLSearchParams();
  parsed.searchParams.forEach((value, key) => {
    if (!isTrackingParam(key)) {
      kept.append(key, value);
    }
  });

  const search = kept.toString();
  const url = `https://${hostname}${pathname}${search ? `?${search}` : ""}`;
  // urlKey ignores remaining query so product identity stays stable
  const urlKey = `${hostname}${pathname === "/" ? "" : pathname}`.toLowerCase();

  return { url, urlKey };
}
