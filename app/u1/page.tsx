"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import UpsellCard from "@/components/UpsellCard";
import { pixelPurchase, pixelUpsellDeclined, pixelViewContent } from "@/lib/pixel";
import { PRODUCT_AMOUNTS } from "@/lib/products";
import { formatUsd } from "@/lib/currency";

function UpsellOneContent() {
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
        body: JSON.stringify({ paymentIntentId, productType: "upsell1" }),
      });

      const payload = (await response.json()) as { success?: boolean; paymentIntentId?: string; error?: string };

      if (!response.ok || !payload.success || !payload.paymentIntentId) {
        throw new Error(payload.error ?? "Unable to process upsell.");
      }

      pixelPurchase(PRODUCT_AMOUNTS.upsell1 / 100, ["upsell1"], "USD", crypto.randomUUID());
      const nextProducts = encodeURIComponent([...products, "upsell1"].join(","));
      window.location.href = `/u2?session=${payload.paymentIntentId}&products=${nextProducts}`;
    } catch (acceptError) {
      const message = acceptError instanceof Error ? acceptError.message : "Unexpected error.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    pixelUpsellDeclined(1);
    const nextProducts = encodeURIComponent(products.join(","));
    window.location.href = `/u2?session=${paymentIntentId}&products=${nextProducts}`;
  };

  return (
    <main className="section-wrap section-pad">
      <div className="mx-auto max-w-[720px]">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">Step 1 of 2 — One-Time Offer</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-brand-text md:text-5xl">
          Wait — Your Order Is Being Processed. Add This One-Time Upgrade Before You Go:
        </h1>
        <div className="mt-8">
          <UpsellCard
            productName="Private Agent OS Dashboard"
            heading="Your Private Agent OS: One Dashboard to Run, Manage & Control Every AI Automation You Own"
            features={[
              "Centralized dashboard for all automations",
              "Pipeline visibility across tasks and agents",
              "Execution controls with role-based visibility",
              "Prebuilt automation modules for fast launch",
              "Operational reporting and performance tracking",
            ]}
            priceLine={
              <span>
                <span className="mr-2 text-slate-500 line-through">{formatUsd(49700)}</span>
                Today Only: {formatUsd(PRODUCT_AMOUNTS.upsell1)}
              </span>
            }
            acceptText="Yes — Add the Agent OS for $253 →"
            declineText="No thanks, I'll manage my automations manually →"
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

export default function UpsellOnePage() {
  return (
    <Suspense fallback={<main className="section-wrap section-pad">Loading...</main>}>
      <UpsellOneContent />
    </Suspense>
  );
}
