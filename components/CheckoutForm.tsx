"use client";

import { FormEvent, useMemo, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import BumpToggle from "@/components/BumpToggle";
import { BUMP_PRODUCTS, PRODUCT_AMOUNTS, PRODUCT_LABELS, type ProductType } from "@/lib/products";
import { pixelAddToCart, pixelPurchase } from "@/lib/pixel";
import { readStoredUtms } from "@/lib/utm";
import { formatUsd } from "@/lib/currency";

const bumpDescriptions: Record<(typeof BUMP_PRODUCTS)[number], string> = {
  bump1: "50 copy-paste automation prompts for professional services teams.",
  bump2: "Lifetime access to operators community and monthly drops.",
  bump3: "Security checklist to harden your private AI deployment.",
};

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#222222",
      "::placeholder": { color: "#94a3b8" },
    },
  },
};

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = useState("");
  const [selectedBumps, setSelectedBumps] = useState<Record<(typeof BUMP_PRODUCTS)[number], boolean>>({
    bump1: false,
    bump2: false,
    bump3: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBumpList = useMemo(
    () => BUMP_PRODUCTS.filter((product) => selectedBumps[product]),
    [selectedBumps]
  );

  const totalCents = useMemo(
    () => PRODUCT_AMOUNTS.entry + selectedBumpList.reduce((sum, bump) => sum + PRODUCT_AMOUNTS[bump], 0),
    [selectedBumpList]
  );

  const toggleBump = (product: (typeof BUMP_PRODUCTS)[number], checked: boolean) => {
    setSelectedBumps((prev) => ({ ...prev, [product]: checked }));
    if (checked) {
      pixelAddToCart(product, PRODUCT_AMOUNTS[product] / 100);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError("Payment form is still loading. Please wait a moment and try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card field failed to load. Please refresh and try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          bumps: selectedBumpList,
          utms: readStoredUtms(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to initialize payment.");
      }

      const payload = (await response.json()) as { clientSecret: string };

      const confirmResult = await stripe.confirmCardPayment(payload.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { email },
        },
      });

      if (confirmResult.error) {
        throw new Error(confirmResult.error.message ?? "Payment failed.");
      }

      const paymentIntentId = confirmResult.paymentIntent?.id;
      if (!paymentIntentId) {
        throw new Error("Missing payment confirmation id.");
      }

      pixelPurchase(
        totalCents / 100,
        ["entry", ...selectedBumpList],
        "USD",
        crypto.randomUUID()
      );

      const productsParam = encodeURIComponent(summaryProducts.join(","));
      window.location.href = `/u1?session=${paymentIntentId}&products=${productsParam}`;
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unexpected error. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const summaryProducts: ProductType[] = ["entry", ...selectedBumpList];

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-2">
      <section className="card p-6 md:p-8">
        <h2 className="font-heading text-3xl text-brand-text">Order Summary</h2>

        <div className="mt-6 rounded-xl border border-brand-border bg-brand-tint p-4">
          <p className="font-semibold text-brand-text">{PRODUCT_LABELS.entry}</p>
          <p className="text-sm text-slate-600">Entry Access</p>
          <p className="mt-1 font-semibold text-brand-accent">{formatUsd(PRODUCT_AMOUNTS.entry)}</p>
        </div>

        <div className="mt-6 space-y-4">
          <BumpToggle
            title="Private AI Prompt Vault"
            description={bumpDescriptions.bump1}
            priceLabel={formatUsd(PRODUCT_AMOUNTS.bump1)}
            checked={selectedBumps.bump1}
            onToggle={(checked) => toggleBump("bump1", checked)}
          />
          <BumpToggle
            title="Operators Circle Lifetime Access"
            description={bumpDescriptions.bump2}
            priceLabel={formatUsd(PRODUCT_AMOUNTS.bump2)}
            checked={selectedBumps.bump2}
            onToggle={(checked) => toggleBump("bump2", checked)}
          />
          <BumpToggle
            title="Private AI Security Checklist"
            description={bumpDescriptions.bump3}
            priceLabel={formatUsd(PRODUCT_AMOUNTS.bump3)}
            checked={selectedBumps.bump3}
            onToggle={(checked) => toggleBump("bump3", checked)}
          />
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="flex items-center justify-between text-lg font-semibold text-brand-text">
            <span>Total</span>
            <span>{formatUsd(totalCents)}</span>
          </p>
          <p className="mt-4 text-sm text-slate-600">What you&apos;re getting:</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {summaryProducts.map((product) => (
              <li key={product} className="flex gap-2">
                <span className="text-brand-accent">✓</span>
                {PRODUCT_LABELS[product]}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="font-heading text-3xl text-brand-text">Payment</h2>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-brand-accent focus:outline-none"
              placeholder="you@company.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Card Details</span>
            <div className="rounded-lg border border-slate-300 px-4 py-3">
              <CardElement options={cardElementOptions} />
            </div>
          </label>
        </div>

        <p className="mt-6 text-lg font-semibold text-brand-text">Total: {formatUsd(totalCents)}</p>

        <button type="submit" className="brand-btn mt-6 w-full" disabled={loading || !stripe}>
          {loading ? "Processing Payment..." : `Complete Purchase — ${formatUsd(totalCents)}`}
        </button>

        <p className="mt-4 text-sm font-medium text-slate-700">256-bit SSL encryption</p>
        <p className="text-sm text-slate-500">30-day money-back guarantee</p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>
    </form>
  );
}
