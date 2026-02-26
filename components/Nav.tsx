import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="section-wrap flex items-center justify-between py-4">
        <p className="font-heading text-xl font-semibold text-brand-text">Private AI Automation</p>
        <Link className="brand-btn text-sm md:text-base" href="/checkout">
          Get Instant Access — $27
        </Link>
      </div>
    </header>
  );
}
