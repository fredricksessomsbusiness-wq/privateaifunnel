"use client";

import { FormEvent, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import BumpToggle from "@/components/BumpToggle";
import { BUMP_PRODUCTS, PRODUCT_AMOUNTS, PRODUCT_LABELS, type ProductType } from "@/lib/products";
import { pixelAddToCart, pixelInitiateCheckout, pixelLead, pixelPurchase } from "@/lib/pixel";
import { readStoredUtms } from "@/lib/utm";
import { formatUsd } from "@/lib/currency";

const bumpDescriptions: Record<(typeof BUMP_PRODUCTS)[number], string> = {
  bump1: "50 copy-paste automation prompts for professional services teams.",
  bump2: "Lifetime access to operators community and monthly drops.",
  bump3: "Security checklist to harden your private AI deployment.",
};

interface CheckoutFormProps {
  stripePromise: Promise<Stripe | null>;
}

interface PaymentPaneProps {
  email: string;
  totalCents: number;
  summaryProducts: ProductType[];
}

function PaymentPane({ email, totalCents, summaryProducts }: PaymentPaneProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError("Payment form is still loading. Please wait a moment and try again.");
      return;
    }

    setLoading(true);

    try {
      const submitResult = await elements.submit();
      if (submitResult.error) {
        throw new Error(submitResult.error.message);
      }

      const confirmResult = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          receipt_email: email,
        },
      });

      if (confirmResult.error) {
        throw new Error(confirmResult.error.message ?? "Payment failed.");
      }

      const paymentIntentId = confirmResult.paymentIntent?.id;
      if (!paymentIntentId || confirmResult.paymentIntent?.status !== "succeeded") {
        throw new Error("Payment is processing. Please wait for confirmation and refresh.");
      }

      pixelPurchase(totalCents / 100, summaryProducts, "USD", crypto.randomUUID());
      const productsParam = encodeURIComponent(summaryProducts.join(","));
      window.location.href = `/u1?session=${paymentIntentId}&products=${productsParam}`;
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unexpected error. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="rounded-lg border border-slate-300 px-4 py-3">
        <PaymentElement />
      </div>

      <p className="mt-6 text-lg font-semibold text-brand-text">Total: {formatUsd(totalCents)}</p>

      <button type="submit" className="brand-btn mt-6 w-full" disabled={loading || !stripe}>
        {loading ? "Processing Payment..." : `Complete Purchase — ${formatUsd(totalCents)}`}
      </button>

      <p className="mt-4 text-sm font-medium text-slate-700">256-bit SSL encryption</p>
      <p className="text-sm text-slate-500">30-day money-back guarantee</p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

function normalizePhone(input: string): string {
  return input.replace(/[^+\d]/g, "");
}

export default function CheckoutForm({ stripePromise }: CheckoutFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consentMarketing, setConsentMarketing] = useState(false);

  const [selectedBumps, setSelectedBumps] = useState<Record<(typeof BUMP_PRODUCTS)[number], boolean>>({
    bump1: false,
    bump2: false,
    bump3: false,
  });

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const selectedBumpList = useMemo(
    () => BUMP_PRODUCTS.filter((product) => selectedBumps[product]),
    [selectedBumps]
  );

  const totalCents = useMemo(
    () => PRODUCT_AMOUNTS.entry + selectedBumpList.reduce((sum, bump) => sum + PRODUCT_AMOUNTS[bump], 0),
    [selectedBumpList]
  );

  const summaryProducts: ProductType[] = ["entry", ...selectedBumpList];

  const toggleBump = (product: (typeof BUMP_PRODUCTS)[number], checked: boolean) => {
    setSelectedBumps((prev) => ({ ...prev, [product]: checked }));
    if (checked) {
      pixelAddToCart(product, PRODUCT_AMOUNTS[product] / 100);
    }

    if (clientSecret) {
      setClientSecret(null);
      setIntentError("Order updated. Tap continue again to refresh payment options.");
    }
  };

  const handlePreparePayment = async () => {
    setIntentError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedEmail.includes("@")) {
      setIntentError("Please enter a valid email address.");
      return;
    }

    if (normalizedPhone.length < 10) {
      setIntentError("Please enter a valid phone number.");
      return;
    }

    if (!consentMarketing) {
      setIntentError("Please confirm call/SMS consent to continue.");
      return;
    }

    setIntentLoading(true);

    try {
      const utms = readStoredUtms();
      const externalId = `${normalizedEmail}|${normalizedPhone}`;

      const leadResponse = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId,
          email: normalizedEmail,
          phone: normalizedPhone,
          consentMarketing,
          utms,
        }),
      });

      if (!leadResponse.ok) {
        const payload = (await leadResponse.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to capture lead details.");
      }

      if (!leadCaptured) {
        pixelLead();
      }

      const paymentResponse = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          phone: normalizedPhone,
          bumps: selectedBumpList,
          utms,
        }),
      });

      if (!paymentResponse.ok) {
        const payload = (await paymentResponse.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to initialize payment methods.");
      }

      const payload = (await paymentResponse.json()) as { clientSecret: string };
      setClientSecret(payload.clientSecret);
      setLeadCaptured(true);
      pixelInitiateCheckout();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to initialize checkout.";
      setClientSecret(null);
      setIntentError(message);
    } finally {
      setIntentLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <section className="card p-5 sm:p-6 md:p-8">
        <h2 className="font-heading text-2xl text-brand-text sm:text-3xl">Order Summary</h2>

        <div className="mt-5 rounded-xl border border-brand-border bg-brand-tint p-4">
          <p className="font-semibold text-brand-text">{PRODUCT_LABELS.entry}</p>
          <p className="text-sm text-slate-600">Entry Access</p>
          <p className="mt-1 font-semibold text-brand-accent">{formatUsd(PRODUCT_AMOUNTS.entry)}</p>
        </div>

        <div className="mt-5 space-y-3">
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

        <div className="mt-5 border-t border-slate-200 pt-4">
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

      <section className="card p-5 sm:p-6 md:p-8">
        <h2 className="font-heading text-2xl text-brand-text sm:text-3xl">Payment</h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (clientSecret) setClientSecret(null);
              }}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-brand-accent focus:outline-none"
              placeholder="you@company.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Phone Number</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                if (clientSecret) setClientSecret(null);
              }}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-brand-accent focus:outline-none"
              placeholder="(555) 555-5555"
            />
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(event) => setConsentMarketing(event.target.checked)}
              className="mt-1 h-4 w-4 accent-brand-accent"
            />
            <span>
              I consent to be contacted by phone/SMS about my request and understand message/data rates may apply.
            </span>
          </label>

          <button
            type="button"
            className="brand-btn w-full"
            onClick={handlePreparePayment}
            disabled={intentLoading}
          >
            {intentLoading ? "Preparing Checkout..." : "Continue to Secure Payment"}
          </button>
        </div>

        {intentError ? <p className="mt-5 text-sm text-red-600">{intentError}</p> : null}

        {clientSecret ? (
          <div className="mt-5">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                },
              }}
            >
              <PaymentPane email={email.trim().toLowerCase()} totalCents={totalCents} summaryProducts={summaryProducts} />
            </Elements>
          </div>
        ) : (
          !intentLoading &&
          !intentError && <p className="mt-5 text-sm text-slate-600">Enter your details, then continue to load payment options.</p>
        )}
      </section>
    </div>
  );
}
