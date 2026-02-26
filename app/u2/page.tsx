"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import UpsellCard from "@/components/UpsellCard";
import { pixelPurchase, pixelUpsellDeclined, pixelViewContent } from "@/lib/pixel";
import { PRODUCT_AMOUNTS } from "@/lib/products";
import { formatUsd } from "@/lib/currency";

function UpsellTwoContent() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get("session") ?? "";
  const products = (searchParams.get("products") ?? "entry")
    .split(",")
    .filter((value) => value.length > 0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pixelViewContent();
  }, []);

  const handleAccept = async () => {
    if (!paymentIntentId) {
      setError("Missing session id. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/upsell/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId, productType: "upsell2" }),
      });

      const payload = (await response.json()) as { success?: boolean; paymentIntentId?: string; error?: string };

      if (!response.ok || !payload.success || !payload.paymentIntentId) {
        throw new Error(payload.error ?? "Unable to process upsell.");
      }

      pixelPurchase(PRODUCT_AMOUNTS.upsell2 / 100, ["upsell2"], "USD", crypto.randomUUID());
      const nextProducts = encodeURIComponent([...products, "upsell2"].join(","));
      window.location.href = `/thank-you?session=${payload.paymentIntentId}&products=${nextProducts}`;
    } catch (acceptError) {
      const message = acceptError instanceof Error ? acceptError.message : "Unexpected error.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    pixelUpsellDeclined(2);
    const nextProducts = encodeURIComponent(products.join(","));
    window.location.href = `/thank-you?session=${paymentIntentId}&products=${nextProducts}`;
  };

  return (
    <main className="section-wrap section-pad">
      <div className="mx-auto max-w-[720px]">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">Step 2 of 2 — One-Time Offer</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-brand-text md:text-5xl">
          Last Step: The Fastest Way to Get Your Private AI Running — We Do It For You
        </h1>
        <div className="mt-8">
          <UpsellCard
            productName="Done-For-You Installation"
            heading="We Install Your Private AI Automation For You — In Your Business, Your Life, or Both. You Do Nothing."
            features={[
              "Environment setup handled end-to-end",
              "Private AI stack installed in your infrastructure",
              "Workflow customization for your use cases",
              "Security and hardening pass included",
              "Role-based access and permissions setup",
              "Guided handoff and launch support",
            ]}
            guarantee="Money-back if you're not live within 30 days"
            priceLine={formatUsd(PRODUCT_AMOUNTS.upsell2)}
            acceptText="Yes — Do It For Me ($999) →"
            declineText="No thanks, I'll handle the setup myself →"
            isLoading={loading}
            error={error}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        </div>
      </div>
    </main>
  );
}

export default function UpsellTwoPage() {
  return (
    <Suspense fallback={<main className="section-wrap section-pad">Loading...</main>}>
      <UpsellTwoContent />
    </Suspense>
  );
}
