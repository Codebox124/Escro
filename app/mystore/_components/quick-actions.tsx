import { IconPlus, IconShoppingCart, IconPackage, IconArrowUpRight } from "@/components/icons";

const QuickActions = () => {
  const actions = [
    {
      label: "Add New Product",
      description: "List a new item in your store",
      icon: IconPlus,
      primary: true,
      href: "/mystore/products",
    },
    {
      label: "View Orders",
      description: "Track and fulfil customer orders",
      icon: IconShoppingCart,
      primary: false,
      href: "/mystore/orders",
    },
    {
      label: "Manage Inventory",
      description: "Update stock and pricing",
      icon: IconPackage,
      primary: false,
      href: "/mystore/products",
    },
  ];

  return (
    <div className="surface-card p-5 sm:p-7">
      {/* Header */}
      <div className="mb-5">
        <p className="eyebrow font-space text-emerald-700">Shortcuts</p>
        <h3 className="mt-1.5 text-xl font-extrabold tracking-[-0.02em] text-ink sm:text-2xl">Quick Actions</h3>
        <p className="mt-0.5 text-sm text-black/55">Frequently used shortcuts</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 sm:gap-4">
        {actions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className={`group flex min-h-[72px] items-center gap-3 rounded-2xl p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
              action.primary
                ? "bg-lime text-ink hover:bg-lime-dark"
                : "bg-cream text-ink hover:bg-cream-dark"
            }`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                action.primary ? "bg-ink text-lime" : "bg-white text-ink"
              }`}
            >
              <action.icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{action.label}</span>
              <span
                className={`block truncate text-xs ${
                  action.primary ? "text-ink/65" : "text-black/50"
                }`}
              >
                {action.description}
              </span>
            </div>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                action.primary ? "bg-ink text-lime" : "bg-white text-ink"
              }`}
            >
              <IconArrowUpRight className="h-4 w-4" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
