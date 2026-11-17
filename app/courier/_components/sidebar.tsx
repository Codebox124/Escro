"use client";

import {
  IconLayoutDashboard,
  IconSettings,
  IconUser,
  IconLogout,
  IconCurrencyDollar,
  IconMap,
  IconRoute,
  IconRoute2,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Logo } from "@/app/components/landing/Logo";
import { authService } from "@/services/auth";

// Menu items with Tabler icons
const items = [
  {
    title: "Dashboard",
    url: "/courier",
    icon: IconLayoutDashboard,
  },
  {
    title: "Available Deliveries",
    url: "/courier/deliveries",
    icon: IconRoute,
  },
  {
    title: "My Deliveries",
    url: "/courier/mydeliveries",
    icon: IconRoute2,
  },
  {
    title: "Earnings",
    url: "/courier/earnings",
    icon: IconCurrencyDollar,
  },
  {
    title: "Map",
    url: "/courier/map",
    icon: IconMap,
  },

  {
    title: "Settings",
    url: "/courier/settings",
    icon: IconSettings,
  },
];

const baseItem =
  "relative h-11 rounded-full px-4 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-lime/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:mx-auto";
const activeItem =
  "bg-lime text-ink font-bold hover:bg-lime hover:text-ink data-[active=true]:bg-lime";
const idleItem = "text-white/60 hover:bg-white/10 hover:text-white";

const CourierSidebar = () => {
  const pathname = usePathname() ?? "";
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (url: string) => {
    // Exact match for dashboard
    if (url === "/courier") {
      return pathname === "/courier";
    }
    // Starts with for other routes
    return pathname.startsWith(url);
  };
  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="flex h-full flex-col gap-0 bg-ink text-white">
        <SidebarHeader className="flex flex-row items-center px-5 pb-4 pt-6 group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
            <Logo dark />
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-space text-[10px] uppercase tracking-widest text-lime group-data-[collapsible=icon]:hidden">
              Courier
            </span>
          </div>
        </SidebarHeader>

        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="eyebrow px-4 font-space text-[10px] text-white/35">
            Menu
          </SidebarGroupLabel>
          {/* Menu Items */}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`${baseItem} ${active ? activeItem : idleItem}`}
                      tooltip={item.title}
                    >
                      <a
                        href={item.url}
                        onClick={closeOnMobile}
                        aria-current={active ? "page" : undefined}
                        className="flex items-center gap-3"
                      >
                        <item.icon
                          className="h-5! w-5! shrink-0"
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

        <SidebarFooter className="mt-auto px-3 py-4">
          <div className="mb-2 rounded-3xl bg-ink-soft p-4 group-data-[collapsible=icon]:hidden">
            <p className="eyebrow font-space text-[10px] text-lime">On the road</p>
            <p className="mt-1.5 text-sm font-semibold leading-snug text-white">
              Every drop-off is escrow-protected.
            </p>
          </div>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={`${baseItem} ${
                  pathname.startsWith("/mystore/profile") ? activeItem : idleItem
                }`}
                tooltip="Profile"
              >
                <a href="/mystore/profile" onClick={closeOnMobile} className="flex items-center gap-3">
                  <IconUser className="h-5! w-5! shrink-0" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Profile
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={`${baseItem} text-white/60 hover:bg-red-500/15 hover:text-red-300`}
                tooltip="Logout"
              >
                <button type="button" onClick={() => authService.logout()} className="flex w-full items-center gap-3">
                  <IconLogout className="h-5! w-5! shrink-0" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Logout
                  </span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
};

export default CourierSidebar;
