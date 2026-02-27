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
      <div className="mx-auto max-w-[820px]">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">
          Step 1 of 2 — One-Time Offer (this screen disappears when you leave)
        </p>

        <h1 className="mt-4 font-heading text-4xl leading-tight text-brand-text md:text-5xl">
          <strong>Before You Go — There&apos;s Something Most People Don&apos;t Understand Until It&apos;s Too Late.</strong>
        </h1>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            There&apos;s a difference between automation and agents. <strong>Automation</strong> does one task. An
            <strong> agent</strong> can run many automations in sequence and make decisions.
          </p>
          <p>
            If you run research, email filtering, meeting notes, calendar management, and data workflows, that means
            multiple agents running at once. If you cannot see what each one is doing, you lose control.
          </p>
          <p>
            <strong>The dashboard below solves that.</strong>
          </p>
        </div>

        <h2 className="mt-8 font-heading text-3xl leading-tight text-brand-text md:text-4xl">
          <strong>
            One Dashboard to See, Control and Manage Every Agent, Every Automation and Every Piece of Data in Your
            Private AI Stack
          </strong>
        </h2>
        <p className="mt-3 text-lg text-slate-700">
          The blueprint gets you live. <strong>This keeps you in control of everything after.</strong>
        </p>

        <div className="mt-8">
          <UpsellCard
            productName="Private Agent OS Dashboard"
            heading="Your Private Agent OS: One Screen for Every Agent, Every Automation and Every Data Flow You Own"
            features={[
              "See every agent status in one place: live, paused, or stalled",
              "View and control every automation each agent is running",
              "Track data flow by agent and stop risky behavior fast",
              "Update prompts and modules without digging through files",
              "Add pre-built modules so new agents go live in minutes",
              "Nothing runs in your system without your knowledge",
            ]}
            priceLine={
              <span>
                <span className="mr-2 text-slate-500 line-through">{formatUsd(49700)}</span>
                <strong>Today Only: {formatUsd(PRODUCT_AMOUNTS.upsell1)}</strong>
              </span>
            }
            acceptText="Yes — Add the Agent OS Dashboard for $253 →"
            declineText="No thanks — I'll manage my agents manually →"
            isLoading={loading}
            error={error}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
          <p className="mt-3 text-sm text-slate-500">This offer is only available on this page.</p>
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
