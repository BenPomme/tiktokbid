import { describe, expect, it } from "vitest";
import { normalizeTikTokShopUrl } from "@/lib/url";

describe("normalizeTikTokShopUrl", () => {
  it("accepts shop.tiktok.com product URLs", () => {
    const result = normalizeTikTokShopUrl(
      "https://shop.tiktok.com/view/product/1731936406579351560",
    );
    expect(result.url).toBe(
      "https://shop.tiktok.com/view/product/1731936406579351560",
    );
    expect(result.urlKey).toBe(
      "shop.tiktok.com/view/product/1731936406579351560",
    );
  });

  it("accepts shop.tiktok.com US pdp URLs", () => {
    const result = normalizeTikTokShopUrl(
      "https://shop.tiktok.com/us/pdp/some-product/1730242674331521612",
    );
    expect(result.urlKey).toBe(
      "shop.tiktok.com/us/pdp/some-product/1730242674331521612",
    );
  });

  it("accepts www.tiktok.com/shop product paths", () => {
    const result = normalizeTikTokShopUrl(
      "https://www.tiktok.com/shop/pdp/1731098552908944370",
    );
    expect(result.urlKey).toBe(
      "www.tiktok.com/shop/pdp/1731098552908944370",
    );
  });

  it("rejects non–TikTok Shop hosts", () => {
    expect(() =>
      normalizeTikTokShopUrl("https://www.amazon.com/dp/B0EXAMPLE"),
    ).toThrow(/tiktok shop/i);
    expect(() =>
      normalizeTikTokShopUrl("https://www.tiktok.com/@creator/video/123"),
    ).toThrow(/tiktok shop/i);
    expect(() =>
      normalizeTikTokShopUrl("https://vm.tiktok.com/ZMabcdef/"),
    ).toThrow(/tiktok shop/i);
  });

  it("strips tracking query params and keeps a stable urlKey", () => {
    const a = normalizeTikTokShopUrl(
      "https://shop.tiktok.com/view/product/1731936406579351560?utm_source=x&utm_medium=social&ttclid=abc",
    );
    const b = normalizeTikTokShopUrl(
      "https://shop.tiktok.com/view/product/1731936406579351560?fbclid=xyz&gclid=1",
    );
    expect(a.url).toBe(
      "https://shop.tiktok.com/view/product/1731936406579351560",
    );
    expect(b.url).toBe(a.url);
    expect(a.urlKey).toBe(b.urlKey);
    expect(a.urlKey).toBe(
      "shop.tiktok.com/view/product/1731936406579351560",
    );
  });
});
