export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`relative flex h-8 w-8 items-center justify-center rounded-[10px] ${
          dark ? "bg-[#C8F169]" : "bg-[#0C110E]"
        }`}
      >
        {/* lock-shaped "e" mark */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            d="M7 10V8a5 5 0 0 1 10 0v2"
            fill="none"
            stroke={dark ? "#0C110E" : "#C8F169"}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <rect x="4" y="10" width="16" height="11" rx="3" fill={dark ? "#0C110E" : "#C8F169"} />
        </svg>
      </span>
      <span
        className={`text-lg font-extrabold tracking-tight group-data-[collapsible=icon]:hidden ${dark ? "text-white" : "text-[#0C110E]"}`}
      >
        escro
      </span>
    </span>
  );
}
