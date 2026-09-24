"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
};

/**
 * Password field with a Show / Hide button so people can check what they
 * typed. Shown text is only ever in the browser; nothing extra is sent or stored.
 */
export default function PasswordInput({ value, onChange, required, minLength, autoComplete }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1">
      <input
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-sand px-3 py-2 pr-16"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-charcoal/60 hover:text-charcoal"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
