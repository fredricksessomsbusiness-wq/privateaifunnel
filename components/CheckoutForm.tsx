"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import BumpToggle from "@/components/BumpToggle";
import { BUMP_PRODUCTS, PRODUCT_AMOUNTS, PRODUCT_LABELS, type ProductType } from "@/lib/products";
import { pixelAddToCart, pixelLead, pixelPurchase } from "@/lib/pixel";
import { readStoredUtms } from "@/lib/utm";
import { formatUsd } from "@/lib/currency";

const bumpDescriptions: Record<(typeof BUMP_PRODUCTS)[number], string> = {
  bump1:
    "Once your setup is live, these 50 prompts make it immediately useful for real work: research, meeting prep, email drafting, calendar management, and document review.",
  bump2:
    "A private community with monthly automation template drops, weekly office hours, and early access to new products. One payment. In forever.",
  bump3:
    "A one-page checklist showing common setup exposure points so your private AI is safe before it goes live.",
};

const bumpHeadlines: Record<(typeof BUMP_PRODUCTS)[number], string> = {
  bump1: "Add 50 Done-For-You Prompts for $17",
  bump2: "Lock In Lifetime Access Now — Never Pay Monthly",
  bump3: "Run This 10-Minute AI Security Audit for $17",
};

interface CheckoutFormProps {
  stripePromise: Promise<Stripe | null>;
}

interface PaymentPaneProps {
  firstName: string;
  email: string;
  phone: string;
  consentMarketing: boolean;
  totalCents: number;
  summaryProducts: ProductType[];
}

function normalizePhone(input: string): string {
  return input.replace(/[^+\d]/g, "");
}

function PaymentPane({
  firstName,
  email,
  phone,
  consentMarketing,
  totalCents,
  summaryProducts,
}: PaymentPaneProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadTracked, setLeadTracked] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError("Payment form is still loading. Please wait a moment and try again.");
      return;
    }

    setLoading(true);

    try {
      const utms = readStoredUtms();
      const leadResponse = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: `${email}|${phone}`,
          firstName,
          email,
          phone,
          consentMarketing,
          utms,
        }),
      });

      if (!leadResponse.ok) {
        const payload = (await leadResponse.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to capture lead details.");
      }

      if (!leadTracked) {
        pixelLead();
        setLeadTracked(true);
      }

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
      <p className="text-sm text-slate-500">
        <strong>30-day money-back guarantee — no questions asked</strong>
      </p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

export default function CheckoutForm({ stripePromise }: CheckoutFormProps) {
  const [firstName, setFirstName] = useState("");
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
  const [capturedLeadId, setCapturedLeadId] = useState<string | null>(null);

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
  };

  const normalizedFirstName = firstName.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = normalizePhone(phone);
  const leadExternalId = `${normalizedEmail}|${normalizedPhone}`;
  const readyForPaymentMethods =
    normalizedFirstName.length > 0 &&
    normalizedEmail.includes("@") &&
    normalizedPhone.length >= 10 &&
    consentMarketing;

  useEffect(() => {
    if (!readyForPaymentMethods) {
      return;
    }

    if (capturedLeadId === leadExternalId) {
      return;
    }

    let isCanceled = false;

    const captureLead = async () => {
      try {
        const utms = readStoredUtms();
        const response = await fetch("/api/leads/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            externalId: leadExternalId,
            firstName: normalizedFirstName,
            email: normalizedEmail,
            phone: normalizedPhone,
            consentMarketing,
            utms,
          }),
        });

        if (!response.ok) {
          return;
        }

        if (!isCanceled) {
          setCapturedLeadId(leadExternalId);
        }
      } catch {
        // Non-blocking: checkout can continue even if lead notification fails.
      }
    };

    void captureLead();

    return () => {
      isCanceled = true;
    };
  }, [
    readyForPaymentMethods,
    capturedLeadId,
    leadExternalId,
    normalizedFirstName,
    normalizedEmail,
    normalizedPhone,
    consentMarketing,
  ]);

  useEffect(() => {
    if (!readyForPaymentMethods) {
      setClientSecret(null);
      setIntentError(null);
      return;
    }

    setIntentLoading(true);
    setIntentError(null);

    const timer = window.setTimeout(async () => {
      try {
        const utms = readStoredUtms();
        const response = await fetch("/api/checkout/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: normalizedFirstName,
            email: normalizedEmail,
            phone: normalizedPhone,
            bumps: selectedBumpList,
            utms,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Unable to initialize payment methods.");
        }

        const payload = (await response.json()) as { clientSecret: string };
        setClientSecret(payload.clientSecret);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to initialize payment methods.";
        setClientSecret(null);
        setIntentError(message);
      } finally {
        setIntentLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [readyForPaymentMethods, normalizedFirstName, normalizedEmail, normalizedPhone, selectedBumpList]);

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <section className="card p-5 sm:p-6 md:p-8">
        <h2 className="font-heading text-2xl text-brand-text sm:text-3xl">Your Order</h2>

        <div className="mt-5 rounded-xl border border-brand-border bg-brand-tint p-4">
          <p className="font-semibold text-brand-text">Private AI Automation — The Self-Install Blueprint</p>
          <p className="text-sm text-slate-600">
            Complete setup blueprint + 4 workflow templates + Zero-to-Running checklist + safety-first deployment
            sequence
          </p>
          <p className="mt-1 font-semibold text-brand-accent">{formatUsd(PRODUCT_AMOUNTS.entry)}</p>
        </div>

        <div className="mt-5 space-y-3">
          <BumpToggle
            title="Private AI Prompt Vault"
            headline={bumpHeadlines.bump1}
            description={bumpDescriptions.bump1}
            priceLabel={formatUsd(PRODUCT_AMOUNTS.bump1)}
            checked={selectedBumps.bump1}
            onToggle={(checked) => toggleBump("bump1", checked)}
          />
          <BumpToggle
            title="Operators Circle — Lifetime Access"
            headline={bumpHeadlines.bump2}
            description={bumpDescriptions.bump2}
            priceLabel={formatUsd(PRODUCT_AMOUNTS.bump2)}
            checked={selectedBumps.bump2}
            onToggle={(checked) => toggleBump("bump2", checked)}
          />
          <BumpToggle
            title="Private AI Security Checklist"
            headline={bumpHeadlines.bump3}
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
          <p className="mt-4 text-sm text-slate-600">Everything in your order:</p>
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
        <h2 className="font-heading text-2xl text-brand-text sm:text-3xl">Complete Your Order</h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">First Name</span>
            <input
              type="text"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-brand-accent focus:outline-none"
              placeholder="John"
            />
          </label>

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
            <span className="mb-2 block text-sm font-medium text-slate-700">Phone Number</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
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
            <span>I consent to be contacted by phone/SMS and understand message/data rates may apply.</span>
          </label>
        </div>

        {!readyForPaymentMethods ? (
          <p className="mt-5 text-sm text-slate-600">Enter your details above to load secure payment options.</p>
        ) : null}

        {intentLoading ? <p className="mt-5 text-sm text-slate-600">Loading payment options...</p> : null}
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
              <PaymentPane
                firstName={normalizedFirstName}
                email={normalizedEmail}
                phone={normalizedPhone}
                consentMarketing={consentMarketing}
                totalCents={totalCents}
                summaryProducts={summaryProducts}
              />
            </Elements>
          </div>
        ) : null}
      </section>
    </div>
  );
}
