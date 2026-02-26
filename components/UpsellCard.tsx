import type { ReactNode } from "react";

interface UpsellCardProps {
  productName: string;
  heading: string;
  features: string[];
  priceLine: ReactNode;
  guarantee?: string;
  acceptText: string;
  declineText: string;
  isLoading: boolean;
  error: string | null;
  onAccept: () => void;
  onDecline: () => void;
}

export default function UpsellCard({
  productName,
  heading,
  features,
  priceLine,
  guarantee,
  acceptText,
  declineText,
  isLoading,
  error,
  onAccept,
  onDecline,
}: UpsellCardProps) {
  return (
    <div className="card p-6 md:p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">{productName}</p>
      <h2 className="mt-3 font-heading text-3xl leading-tight text-brand-text">{heading}</h2>
      <ul className="mt-6 space-y-2 text-slate-700">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-1 text-brand-accent">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {guarantee ? (
        <p className="mt-6 inline-flex rounded-full border border-brand-border bg-brand-tint px-3 py-1 text-sm font-semibold text-brand-accent">
          {guarantee}
        </p>
      ) : null}
      <p className="mt-6 text-2xl font-bold text-brand-text">{priceLine}</p>
      <button type="button" className="brand-btn mt-6 w-full" disabled={isLoading} onClick={onAccept}>
        {isLoading ? "Processing..." : acceptText}
      </button>
      <button
        type="button"
        className="mt-4 w-full text-sm text-slate-500 underline underline-offset-4"
        onClick={onDecline}
        disabled={isLoading}
      >
        {declineText}
      </button>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
