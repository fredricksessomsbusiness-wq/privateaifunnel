"use client";

interface BumpToggleProps {
  title: string;
  headline?: string;
  description: string;
  priceLabel: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

export default function BumpToggle({
  title,
  headline,
  description,
  priceLabel,
  checked,
  onToggle,
}: BumpToggleProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        checked ? "border-brand-border bg-brand-tint" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="pr-2">
          <h3 className="text-base font-semibold leading-snug text-brand-text">{title}</h3>
          {headline ? <p className="mt-1 text-sm font-semibold leading-snug text-brand-text">{headline}</p> : null}
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
          <p className="mt-2 text-sm font-semibold text-brand-accent">{priceLabel}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onToggle(!checked)}
          className={`inline-flex min-w-36 items-center justify-center rounded-brand px-4 py-2 text-sm font-semibold transition ${
            checked
              ? "bg-brand-accent text-white hover:bg-brand-hover"
              : "border border-brand-border bg-white text-brand-accent hover:bg-brand-tint"
          }`}
        >
          {checked ? "Added ✓" : "Add to Order"}
        </button>
      </div>
    </div>
  );
}
