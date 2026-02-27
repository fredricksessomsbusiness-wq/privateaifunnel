"use client";

import Link from "next/link";
import { useEffect } from "react";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { pixelInitiateCheckout, pixelViewContent } from "@/lib/pixel";
import { captureUtmsFromUrl, storeUtms } from "@/lib/utm";

const credibilityChips = [
  "You Control the Access. Not a Vendor.",
  "No Costly Subscriptions",
  "Works on Mac, Windows & Mobile",
  "Live in 24–48 Hours",
];

const whoThisIsFor = [
  "For estate and family law attorneys who can't afford a data breach",
  "For tax advisors and CPAs handling financials that need strict access control",
  "For independent consultants who want AI leverage without an agency invoice",
  "For financial planners and RIAs with strict client confidentiality obligations",
  "For operations managers and department heads who need AI running without IT sign-off",
  "For corporate project managers drowning in meetings, emails and reporting",
  "For HR directors and talent leads handling sensitive compensation and candidate data",
  "For any business owner or professional who wants to control how their AI runs, what it costs, and who can access it",
];

const faqItems = [
  {
    q: "Is this fully private?",
    a: "You own the infrastructure, you manage the access, and you're not subject to a vendor's terms.",
  },
  {
    q: "How long does setup take?",
    a: "Most professionals are live within 24–48 hours. The blueprint is built for focused sessions around your schedule.",
  },
  {
    q: "Do I need coding experience?",
    a: "No. Every step is plain language with copy-paste instructions.",
  },
  {
    q: "What hardware do I need?",
    a: "Any modern Mac, Windows machine, or mobile phone.",
  },
  {
    q: "Is there an ongoing subscription?",
    a: "No recurring cost for the core stack. Buy it once, own it.",
  },
  {
    q: "What if it's not right for me?",
    a: "You have a 30-day money-back guarantee.",
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
            The Step-by-Step Blueprint to <strong>Get Private AI Automation Running</strong> in 24–48 Hours.
          </h1>
          <p className="mt-4 max-w-2xl text-2xl leading-tight text-brand-text">
            <span className="decoration-2 decoration-red-500 line-through">No Code Required</span>
            <span className="mx-3 text-slate-400">•</span>
            <span className="decoration-2 decoration-red-500 line-through">No Agency Invoice</span>
          </p>
          <p className="mt-6 max-w-2xl text-lg text-slate-700">
            You have clients, deadlines, and a full calendar. <strong>This blueprint gives you a simple path to launch fast.</strong>
          </p>
          <p className="mt-3 max-w-2xl text-lg text-slate-700">
            Set it up once. Stay in control. Let it run.
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
          <p className="text-xl font-semibold text-brand-text">What You Get for $27</p>
          <ul className="mt-5 space-y-3 text-slate-700">
            <li className="flex gap-2">
              <span className="text-brand-accent">✓</span>
              The complete private AI setup blueprint — <strong>follow it once, your automation runs forever</strong>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent">✓</span>
              4 ready workflow templates: <strong>research, meeting notes, calendar management, and email filtering</strong>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent">✓</span>
              Zero-to-Running checklist for any device
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent">✓</span>
              Safety-first deployment steps to protect your clients and reputation
            </li>
          </ul>
          <Link className="brand-btn mt-6 w-full" href="/checkout" onClick={handleCtaClick}>
            Get Instant Access — $27 →
          </Link>
        </div>
      </section>

      <section className="bg-white py-10 md:py-14">
        <div className="section-wrap">
          <p className="text-lg font-semibold text-brand-text">
            <strong>487,000 individuals and businesses across the US</strong> deployed private AI setups in the last
            12 months.
          </p>
          <p className="mt-3 text-slate-700">
            The goal is not just to be early. <strong>It is to do it right.</strong>
          </p>
          <ul className="mt-6 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            {whoThisIsFor.map((item) => (
              <li key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-wrap section-pad">
        <h2 className="font-heading text-3xl text-brand-text md:text-5xl">
          <strong>Two Problems Nobody Warns You About When You Start Using AI at Work</strong>
        </h2>
        <p className="mt-5 max-w-3xl text-lg text-slate-700">
          Most people think the risk is privacy. That is real. But the first problem costs people even more.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <p className="text-lg font-semibold text-brand-text">The AI That Only Works When You Watch It</p>
            <p className="mt-2 text-slate-700">
              If your AI breaks when you step away, it is not automation. This blueprint is built for stable workflows.
            </p>
          </div>
          <div className="card p-5">
            <p className="text-lg font-semibold text-brand-text">Setup Risk Nobody Mentions</p>
            <p className="mt-2 text-slate-700">
              A private AI set up wrong becomes a liability. This guide includes a safety-first sequence to avoid that.
            </p>
          </div>
          <div className="card p-5">
            <p className="text-lg font-semibold text-brand-text">No Control Over Spend</p>
            <p className="mt-2 text-slate-700">
              Cloud bills can grow fast. With this setup, <strong>you set the limits and control the cost.</strong>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20 lg:py-24">
        <div className="section-wrap">
          <h2 className="font-heading text-3xl text-brand-text md:text-5xl">
            <strong>Own Your AI. Own Your Data. Own Your Results.</strong>
          </h2>
          <p className="mt-5 max-w-3xl text-lg text-slate-700">
            Not a course. A deployment blueprint. Follow the steps and get live while others are still stuck in
            tutorials.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Research — summarized automatically",
              "Meeting Notes — action items right after calls",
              "Calendar Management — time protected for real work",
              "Email Filtering — only high-priority messages surface",
            ].map((item) => (
              <div key={item} className="card p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">Workflow</p>
                <p className="mt-2 text-lg font-semibold text-brand-text">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrap section-pad">
        <h2 className="font-heading text-3xl text-brand-text md:text-5xl">
          <strong>Everything You Get for $27</strong>
        </h2>
        <ul className="mt-8 space-y-3 text-lg text-slate-700">
          <li className="flex gap-3">
            <span className="text-brand-accent">✓</span>
            Private AI deployment blueprint with full ownership
          </li>
          <li className="flex gap-3">
            <span className="text-brand-accent">✓</span>
            Zero-to-Running checklist for any device
          </li>
          <li className="flex gap-3">
            <span className="text-brand-accent">✓</span>
            Four pre-configured templates ready day one
          </li>
          <li className="flex gap-3">
            <span className="text-brand-accent">✓</span>
            Safety-first deployment sequence to avoid exposure
          </li>
          <li className="flex gap-3">
            <span className="text-brand-accent">✓</span>
            Works on Mac, Windows, or mobile with no coding required
          </li>
        </ul>
      </section>

      <section className="bg-white py-16 md:py-20 lg:py-24">
        <div className="section-wrap">
          <h2 className="font-heading text-3xl text-brand-text md:text-5xl">
            <strong>Agencies charge $2,000–$5,000+ for this setup.</strong>
          </h2>
          <p className="mt-5 max-w-3xl text-lg text-slate-700">
            For $27, you get the same blueprint and keep full control. No lock-in. No recurring agency bill.
          </p>
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
            <strong>Set This Up Once. Own It Forever.</strong>
          </h2>
          <p className="mt-4 text-lg text-slate-700">Instant Access — $27</p>
          <p className="mt-1 text-sm text-slate-600">
            30-day money-back guarantee · No costly subscriptions · Works on any device
          </p>
          <Link className="brand-btn mt-6" href="/checkout" onClick={handleCtaClick}>
            Get Instant Access — $27 →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
