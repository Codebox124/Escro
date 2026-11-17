import React, { forwardRef, useId } from "react";
import { AlertCircle } from "@/components/icons";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, icon, required, className = "", id, ...props },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-semibold text-ink"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35 [&_svg]:h-[18px] [&_svg]:w-[18px]">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            className={`h-12 w-full rounded-2xl border-0 bg-white px-4 text-[15px] text-ink outline-none ring-1 transition placeholder:text-black/35 focus:ring-2 ${
              icon ? "pl-11" : ""
            } ${error ? "pr-11" : ""} ${
              error
                ? "ring-red-400 focus:ring-red-500"
                : "ring-black/10 hover:ring-black/20 focus:ring-ink"
            } ${className}`}
            {...props}
          />

          {error && (
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle size={18} />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-2 text-sm text-black/50">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
