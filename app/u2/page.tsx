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
      <div className="mx-auto max-w-[820px]">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">
          Step 2 of 2 — One-Time Offer (this screen disappears when you leave)
        </p>

        <h1 className="mt-4 font-heading text-4xl leading-tight text-brand-text md:text-5xl">
          <strong>Last Step: Skip the Setup Entirely — We Build Your Entire Private AI Stack For You.</strong>
        </h1>
        <p className="mt-3 text-lg text-slate-700">
          You bought the blueprint. <strong>This is the option where you never open it.</strong>
        </p>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            The blueprint gets most professionals live in 24–48 hours. But it still takes focused work and decisions.
          </p>
          <p>
            <strong>This offer removes all of that.</strong> We map your workflows, install everything in your
            environment, harden security, and hand it over fully running.
          </p>
        </div>

        <div className="mt-8">
          <UpsellCard
            productName="Done-For-You Installation"
            heading="We Install Your Complete Private AI Automation Stack — For Your Business, Your Personal Life, or Both"
            features={[
              "Private onboarding call mapped to your real workflows",
              "Full end-to-end setup of tools, agents, and integrations",
              "Workflow customization for your specific use cases",
              "Security hardening pass included before handoff",
              "Role-based access and permissions configured",
              "30-day post-installation support included",
            ]}
            guarantee="If your automation is not live within 30 days of onboarding, you get a full refund."
            priceLine={<strong>{formatUsd(PRODUCT_AMOUNTS.upsell2)}</strong>}
            acceptText="Yes — Install It For Me ($999) →"
            declineText="No thanks — I'll handle the setup myself →"
            isLoading={loading}
            error={error}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
          <p className="mt-3 text-sm text-slate-500">
            Agencies charge $2,000–$5,000+ for this setup. This is the done-for-you version with full ownership.
          </p>
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
