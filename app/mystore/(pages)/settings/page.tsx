"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  IconSettings,
  IconBuilding,
  IconCreditCard,
  IconTruck,
} from "@/components/icons";
import GeneralSettings from "./_components/general-settings";
import PaymentSettings from "./_components/payment-settings";
import ShippingSettings from "./_components/shipping-settings";

type SettingsTab = "general" | "payment" | "shipping";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: IconBuilding },
  { id: "payment", label: "Payment", icon: IconCreditCard },
  { id: "shipping", label: "Shipping", icon: IconTruck },
];

const Page = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "payment":
        return <PaymentSettings />;
      case "shipping":
        return <ShippingSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="page-container py-6 sm:py-8">
      <div className="max-w-7xl space-y-6">
        {/* Page Header */}
        <div>
          <p className="eyebrow font-space text-emerald-700">Store config</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            Manage your store configuration and preferences
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:px-0">
          <div
            role="tablist"
            className="inline-flex min-w-max gap-1 rounded-full bg-white p-1.5 ring-1 ring-black/5"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                    isActive
                      ? "text-white"
                      : "text-black/55 hover:text-ink"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="mystore-settings-tab"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <Icon className={`relative h-4 w-4 ${isActive ? "text-lime" : ""}`} />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default Page;
