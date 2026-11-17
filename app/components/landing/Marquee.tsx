const items = [
  "Fashion",
  "Electronics",
  "Home & living",
  "Beauty",
  "Phones",
  "Sneakers",
  "Groceries",
  "Services",
  "Handmade",
  "Gaming",
];

export default function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="relative -rotate-1 overflow-hidden bg-[#0C110E] py-4 sm:py-5">
      <div className="flex w-max animate-[escro-marquee_160s_linear_infinite] hover:[animation-play-state:paused] gap-8 pr-8">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 whitespace-nowrap text-xl font-extrabold uppercase tracking-tight text-white sm:text-3xl"
          >
            {item}
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#C8F169] sm:h-6 sm:w-6" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z"
              />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
