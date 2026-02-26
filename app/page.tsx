"use client";

import Link from "next/link";
import { useEffect } from "react";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { pixelInitiateCheckout, pixelViewContent } from "@/lib/pixel";
import { captureUtmsFromUrl, storeUtms } from "@/lib/utm";

const credibilityChips = ["Zero Cloud Leaks", "No Subscriptions", "Any Machine, Any OS", "60-Minute Setup"];

const faqItems = [
  {
    q: "Is this fully private?",
    a: "Yes. The framework is designed for local/private execution so sensitive client data stays under your control.",
  },
  {
    q: "How long does setup take?",
    a: "Most professionals complete setup in about 60 minutes using the included walkthrough.",
  },
  {
    q: "Do I need coding experience?",
    a: "No coding required. Everything is documented in plain language with copy-paste implementation steps.",
  },
  {
    q: "What kind of hardware is needed?",
    a: "Any modern Mac or Windows machine works. Optional performance upgrades are outlined in the guide.",
  },
  {
    q: "Is there ongoing subscription cost?",
    a: "No recurring software subscription is required for the core stack described in this offer.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. You are covered by a 30-day money-back guarantee if this is not the right fit for your use case.",
  },
];

export default function SalesPage() {
  useEffect(() => {
    pixelViewContent();
    const params = new URLSearchParams(window.location.search);
    storeUtms(captureUtmsFromUrl(params));
  }, []);

  const handleCtaClick = () => {
    pixelInitiateCheckout();
  };

  return (
    <main>
      <Nav />

      <section className="section-wrap section-pad grid items-start gap-10 lg:grid-cols-2">
        <div>
          <h1 className="font-heading text-4xl leading-tight text-brand-text md:text-5xl lg:text-6xl">
            How to Get Your AI Running Privately in 60 Minutes — Without Touching a Single Line of Code
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-700">
            The step-by-step blueprint for lawyers, consultants and accountants who want owned AI automation:
            zero cloud exposure, zero subscriptions, zero IT team required.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {credibilityChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-brand-border bg-brand-tint px-4 py-2 text-sm font-semibold text-brand-accent"
              >
                {chip}
              </span>
            ))}
          </div>
          <Link className="brand-btn mt-8" href="/checkout" onClick={handleCtaClick}>
            Get Instant Access — $27 →
          </Link>
        </div>

        <div className="card p-6 md:p-8">
          <p className="text-xl font-semibold text-brand-text">Start Today for $27</p>
          <ul className="mt-5 space-y-3 text-slate-700">
            <li className="flex gap-2">
              <span className="text-brand-accent">✓</span>
              Private AI 60-minute setup blueprint
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent">✓</span>
              Local workflow templates for legal, finance and consulting
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent">✓</span>
              Tool stack and environment checklist
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent">✓</span>
              Deployment sequence with security controls
            </li>
          </ul>
          <Link className="brand-btn mt-6 w-full" href="/checkout" onClick={handleCtaClick}>
            Get Instant Access — $27 →
          </Link>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="section-wrap">
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
            Trusted by professionals in legal, finance & consulting
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {["Jordan P. — Attorney", "Nina C. — CPA", "Arman D. — Consultant", "Claire K. — Advisor", "Luis T. — Partner"].map(
              (quote) => (
                <div key={quote} className="card p-4 text-sm text-slate-700">
                  {quote}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="section-wrap section-pad">
        <h2 className="font-heading text-3xl text-brand-text md:text-5xl">Every AI Tool You&apos;re Using Is Leaking Your Data</h2>
        <p className="mt-5 max-w-3xl text-lg text-slate-700">
          Professionals handling sensitive records are exposing private documents to third-party platforms every
          time they paste confidential text into cloud AI products.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Client communications are processed on external infrastructure",
            "Uncontrolled plugins and app integrations copy your data",
            "Policy violations create legal and compliance risk",
          ].map((point) => (
            <div key={point} className="card p-5">
              <p className="text-2xl">⚠</p>
              <p className="mt-3 text-slate-700">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20 lg:py-24">
        <div className="section-wrap">
          <h2 className="font-heading text-3xl text-brand-text md:text-5xl">Your AI. Your Data. Your Infrastructure.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {["Research Workflow", "Meeting Notes Workflow", "Calendar Workflow", "Inbox Workflow"].map((item) => (
              <div key={item} className="card p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">Template</p>
                <p className="mt-2 text-lg font-semibold text-brand-text">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrap section-pad">
        <h2 className="font-heading text-3xl text-brand-text md:text-5xl">Everything You Get for $27</h2>
        <ul className="mt-8 space-y-3 text-lg text-slate-700">
          <li className="flex gap-3"><span className="text-brand-accent">✓</span>Step-by-step private setup framework</li>
          <li className="flex gap-3"><span className="text-brand-accent">✓</span>Tool installation checklist for any OS</li>
          <li className="flex gap-3"><span className="text-brand-accent">✓</span>Four ready-to-use automation templates</li>
          <li className="flex gap-3"><span className="text-brand-accent">✓</span>Security-first deployment sequence</li>
        </ul>
      </section>

      <section className="bg-white py-16 md:py-20 lg:py-24">
        <div className="section-wrap grid gap-4 md:grid-cols-3">
          {[
            "I replaced scattered AI tools with one controlled system and cut setup time dramatically. — Maria L., Estate Lawyer",
            "The privacy structure was exactly what our finance practice needed. — Peter A., Tax Advisor",
            "Implementation was direct and practical. We were live the same day. — Dana R., Consulting Founder",
          ].map((testimonial) => (
            <blockquote key={testimonial} className="card p-5 text-slate-700">
              {testimonial}
            </blockquote>
          ))}
        </div>
      </section>

      <section className="section-wrap section-pad">
        <h2 className="font-heading text-3xl text-brand-text md:text-5xl">Frequently Asked Questions</h2>
        <div className="mt-8 space-y-4">
          {faqItems.map((item) => (
            <div key={item.q} className="card p-5">
              <p className="font-semibold text-brand-text">{item.q}</p>
              <p className="mt-2 text-slate-700">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20 lg:py-24">
        <div className="section-wrap text-center">
          <h2 className="font-heading text-3xl text-brand-text md:text-5xl">
            Build Your Private AI Stack Without the Guesswork
          </h2>
          <p className="mt-4 text-lg text-slate-700">Instant Access — $27</p>
          <Link className="brand-btn mt-6" href="/checkout" onClick={handleCtaClick}>
            Get Instant Access — $27 →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
