"use client";

import {
  IconLayoutDashboard,
  IconPackage,
  IconShoppingCart,
  IconSettings,
  IconUser,
  IconLogout,
  IconShieldCheck,
} from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Logo } from "@/app/components/landing/Logo";
import { authService } from "@/services/auth";

// Menu items with Tabler icons
const items = [
  {
    title: "Dashboard",
    url: "/mystore",
    icon: IconLayoutDashboard,
  },
  {
    title: "Products",
    url: "/mystore/products",
    icon: IconPackage,
  },
  {
    title: "Orders",
    url: "/mystore/orders",
    icon: IconShoppingCart,
  },

  {
    title: "Settings",
    url: "/mystore/settings",
    icon: IconSettings,
  },
];

const menuButtonBase =
  "relative h-11 rounded-full px-4 text-sm font-semibold text-white/60 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white active:bg-white/10 active:text-white focus-visible:ring-2 focus-visible:ring-lime/60 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:mx-auto";

const menuButtonActive =
  "bg-lime! text-ink! font-bold hover:bg-lime! hover:text-ink! shadow-[0_8px_24px_-12px_rgb(200_241_105/0.6)]";

const StoreSidebar = () => {
  const pathname = usePathname() ?? "";

  const isActive = (url: string) => {
    // Exact match for dashboard
    if (url === "/mystore") {
      return pathname === "/mystore";
    }
    // Starts with for other routes
    return pathname.startsWith(url);
  };

  const profileActive = pathname.startsWith("/mystore/profile");

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex h-full w-full flex-col bg-ink text-white/70">
        {/* Brand */}
        <SidebarHeader className="px-5 pt-6 pb-5 group-data-[collapsible=icon]:px-0">
          <a
            href="/mystore"
            className="flex flex-col gap-1.5 rounded-xl group-data-[collapsible=icon]:items-center"
          >
            <Logo dark />
            <span className="eyebrow font-space text-[10px] text-lime/80 group-data-[collapsible=icon]:hidden">
              Seller Center
            </span>
          </a>
        </SidebarHeader>

        <div className="mx-5 h-px bg-white/[0.08] group-data-[collapsible=icon]:mx-3" />

        {/* Menu Items */}
        <SidebarContent className="flex-1 bg-transparent">
          <SidebarGroup className="px-3 py-5">
            <SidebarGroupLabel className="eyebrow mb-1 px-4 font-space text-[10px] text-white/35">
              Store
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`${menuButtonBase} ${active ? menuButtonActive : ""}`}
                        tooltip={item.title}
                      >
                        <a
                          href={item.url}
                          aria-current={active ? "page" : undefined}
                          className="flex items-center gap-3"
                        >
                          <item.icon
                            className={`size-[18px]! shrink-0 ${active ? "text-ink" : "text-white/45"}`}
                            stroke={active ? 2.25 : 1.75}
                          />
                          <span className="group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Escrow promo */}
          <div className="relative mx-4 mt-auto mb-3 overflow-hidden rounded-3xl bg-white/[0.06] p-4 ring-1 ring-white/10 group-data-[collapsible=icon]:hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full border-[14px] border-lime/10" />
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime text-ink">
                <IconShieldCheck className="h-4 w-4" stroke={2.25} />
              </span>
              <span className="text-xs font-bold text-white">Escrow protected</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/55">
              Payments are held securely until buyers confirm delivery.
            </p>
          </div>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/[0.08] px-3 py-3">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={`${menuButtonBase} ${profileActive ? menuButtonActive : ""}`}
                tooltip="Profile"
              >
                <a href="/mystore/profile" className="flex items-center gap-3">
                  <IconUser
                    className={`size-[18px]! shrink-0 ${profileActive ? "text-ink" : "text-white/45"}`}
                    stroke={1.75}
                  />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Profile
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={`${menuButtonBase} hover:bg-red-500/10 hover:text-red-300`}
                tooltip="Logout"
              >
                <button type="button" onClick={() => authService.logout()} className="flex w-full items-center gap-3">
                  <IconLogout className="size-[18px]! shrink-0 text-white/45" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Logout
                  </span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default StoreSidebar;
