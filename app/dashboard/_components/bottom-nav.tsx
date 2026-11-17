"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/ui/bottom-nav";
import { Home, IconBriefcase, IconPackage, IconShoppingBag, IconShoppingCart } from "@/components/icons";
import { useCart } from "./cart-context";

export default function BuyerBottomNav() {
  const pathname = usePathname() ?? "";
  const { count } = useCart();
  const at = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <BottomNav
      id="buyer-nav"
      items={[
        { label: "Home", icon: Home, href: "/dashboard", active: pathname === "/dashboard" },
        { label: "Shop", icon: IconShoppingBag, href: "/dashboard/shop", active: at("/dashboard/shop") || at("/dashboard/stores") },
        { label: "Services", icon: IconBriefcase, href: "/dashboard/services", active: at("/dashboard/services") },
        { label: "Orders", icon: IconPackage, href: "/dashboard/orders", active: at("/dashboard/orders") },
        {
          label: "Cart",
          icon: IconShoppingCart,
          href: "/dashboard/cart",
          active: at("/dashboard/cart") || at("/dashboard/checkout"),
          badge: count,
        },
      ]}
    />
  );
}
