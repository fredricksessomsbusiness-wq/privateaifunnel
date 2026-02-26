"use client";

import { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "@/components/CheckoutForm";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { pixelViewContent } from "@/lib/pixel";
import { useEffect } from "react";

export default function CheckoutPage() {
  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return key ? loadStripe(key) : null;
  }, []);

  useEffect(() => {
    pixelViewContent();
  }, []);

  return (
    <main>
      <Nav />
      <section className="section-wrap section-pad">
        <div className="mx-auto max-w-6xl">
          {stripePromise ? (
            <CheckoutForm stripePromise={stripePromise} />
          ) : (
            <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
              Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
            </p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
