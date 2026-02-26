export type ProductType = "entry" | "bump1" | "bump2" | "bump3" | "upsell1" | "upsell2";

export const PRODUCT_AMOUNTS: Record<ProductType, number> = {
  entry: 2700,
  bump1: 1700,
  bump2: 1999,
  bump3: 1700,
  upsell1: 25300,
  upsell2: 99900,
};

export const PRODUCT_LABELS: Record<ProductType, string> = {
  entry: "How to Get Your AI Running Privately in 60 Minutes",
  bump1: "Private AI Prompt Vault",
  bump2: "Private AI Operators Circle",
  bump3: "The Private AI Security Checklist",
  upsell1: "Private Agent OS Dashboard",
  upsell2: "Done-For-You Installation",
};

export const PRODUCT_PRICE_IDS: Record<ProductType, string> = {
  entry: process.env.STRIPE_PRICE_ENTRY ?? "",
  bump1: process.env.STRIPE_PRICE_BUMP1 ?? "",
  bump2: process.env.STRIPE_PRICE_BUMP2 ?? "",
  bump3: process.env.STRIPE_PRICE_BUMP3 ?? "",
  upsell1: process.env.STRIPE_PRICE_UPSELL1 ?? "",
  upsell2: process.env.STRIPE_PRICE_UPSELL2 ?? "",
};

export const PRODUCT_WHOP_PRODUCT_IDS: Record<ProductType, string> = {
  entry: process.env.WHOP_PRODUCT_ENTRY ?? process.env.WHOP_PRODUCT_ID ?? "",
  bump1: process.env.WHOP_PRODUCT_BUMP1 ?? "",
  bump2: process.env.WHOP_PRODUCT_BUMP2 ?? "",
  bump3: process.env.WHOP_PRODUCT_BUMP3 ?? "",
  upsell1: process.env.WHOP_PRODUCT_UPSELL1 ?? "",
  upsell2: process.env.WHOP_PRODUCT_UPSELL2 ?? "",
};

export const BUMP_PRODUCTS = ["bump1", "bump2", "bump3"] as const;

export const ACCESS_COLUMN_BY_PRODUCT: Record<ProductType, keyof AccessColumns> = {
  entry: "entry_unlocked",
  bump1: "bump1_unlocked",
  bump2: "bump2_unlocked",
  bump3: "bump3_unlocked",
  upsell1: "upsell1_unlocked",
  upsell2: "upsell2_unlocked",
};

export interface AccessColumns {
  entry_unlocked: boolean;
  bump1_unlocked: boolean;
  bump2_unlocked: boolean;
  bump3_unlocked: boolean;
  upsell1_unlocked: boolean;
  upsell2_unlocked: boolean;
}
