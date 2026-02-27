"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { pixelViewContent } from "@/lib/pixel";
import { PRODUCT_LABELS, type ProductType } from "@/lib/products";

function ThankYouContent() {
  const whopJoinUrl =
    process.env.NEXT_PUBLIC_WHOP_JOIN_URL ?? "https://whop.com/joined/private-ai-automation";
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const products = (searchParams.get("products") ?? "entry")
    .split(",")
    .filter((item): item is ProductType =>
      ["entry", "bump1", "bump2", "bump3", "upsell1", "upsell2"].includes(item)
    );

  useEffect(() => {
    pixelViewContent();
  }, []);

  return (
    <main className="section-wrap section-pad">
      <div className="mx-auto max-w-3xl rounded-2xl border border-brand-border bg-white p-6 shadow-soft md:p-8">
        <div className="flex items-center gap-3">
          <span className="text-4xl text-brand-accent">✓</span>
          <h1 className="font-heading text-3xl text-brand-text md:text-4xl">
            <strong>You&apos;re In. Here&apos;s What to Do Right Now.</strong>
          </h1>
        </div>
        <p className="mt-5 text-base text-slate-700 md:text-lg">
          Your order is confirmed. Use the link below to access your portal with the same email you used at checkout.
          Most professionals are fully live within <strong>24–48 hours</strong>.
        </p>

        <a href={whopJoinUrl} className="brand-btn mt-6 w-full sm:w-auto" target="_blank" rel="noreferrer">
          Access Your Portal on Whop →
        </a>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Order Confirmed</p>
          <p className="mt-2 text-slate-700">Session: {sessionId ?? "Pending"}</p>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {products.map((product) => (
              <li key={product}>• {PRODUCT_LABELS[product]}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <p className="text-lg font-semibold text-brand-text">What happens next</p>
          <ol className="mt-3 space-y-2 text-slate-700">
            <li>1. Tap "Access Your Portal on Whop".</li>
            <li>2. Log in with the exact email address used at checkout.</li>
            <li>3. Your purchases unlock automatically.</li>
            <li>4. Start with the Zero-to-Running checklist.</li>
          </ol>
        </div>

        <p className="mt-8 text-sm text-slate-600">
          Work through the blueprint in focused sessions. <strong>Do not skip the safety-first deployment steps.</strong>
        </p>
        <p className="mt-3 text-sm text-slate-500">
          If you picked up Operators Circle, introduce yourself in the community once you&apos;re live.
        </p>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<main className="section-wrap section-pad">Loading...</main>}>
      <ThankYouContent />
    </Suspense>
  );
}
