"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/ui/bottom-nav";
import { IconLayoutDashboard, IconPackage, IconSettings, IconShoppingCart, IconUser } from "@/components/icons";

export default function SellerBottomNav() {
  const pathname = usePathname() ?? "";
  const at = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <BottomNav
      id="seller-nav"
      items={[
        { label: "Dashboard", icon: IconLayoutDashboard, href: "/mystore", active: pathname === "/mystore" },
        { label: "Products", icon: IconPackage, href: "/mystore/products", active: at("/mystore/products") },
        { label: "Orders", icon: IconShoppingCart, href: "/mystore/orders", active: at("/mystore/orders") },
        { label: "Settings", icon: IconSettings, href: "/mystore/settings", active: at("/mystore/settings") },
        { label: "Profile", icon: IconUser, href: "/mystore/profile", active: at("/mystore/profile") },
      ]}
    />
  );
}
