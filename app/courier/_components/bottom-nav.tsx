"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/ui/bottom-nav";
import { IconLayoutDashboard, IconMap, IconRoute, IconRoute2, Wallet } from "@/components/icons";

/** Settings stays reachable from the menu (☰) and the avatar dropdown. */
export default function CourierBottomNav() {
  const pathname = usePathname() ?? "";
  const at = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <BottomNav
      id="courier-nav"
      items={[
        { label: "Home", icon: IconLayoutDashboard, href: "/courier", active: pathname === "/courier" },
        { label: "Jobs", icon: IconRoute, href: "/courier/deliveries", active: at("/courier/deliveries") },
        { label: "My trips", icon: IconRoute2, href: "/courier/mydeliveries", active: at("/courier/mydeliveries") },
        { label: "Map", icon: IconMap, href: "/courier/map", active: at("/courier/map") },
        { label: "Earnings", icon: Wallet, href: "/courier/earnings", active: at("/courier/earnings") },
      ]}
    />
  );
}
