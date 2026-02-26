"use client";

interface BumpToggleProps {
  title: string;
  description: string;
  priceLabel: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

export default function BumpToggle({
  title,
  description,
  priceLabel,
  checked,
  onToggle,
}: BumpToggleProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-brand-text">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
          <p className="mt-2 text-sm font-semibold text-brand-accent">{priceLabel}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onToggle(!checked)}
          className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-brand-accent" : "bg-slate-300"}`}
        >
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
