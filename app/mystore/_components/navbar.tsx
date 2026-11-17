"use client";

import { useState } from "react";
import { IconSearch, IconMenu2, IconBell, IconChevronDown } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { authService } from "@/services/auth"; // Make sure you have a logout function here

const Navbar = () => {
  type User = {
    name?: string;
    email?: string;
    // add other properties if needed
  };

  const { user, loading } = useCurrentUser() as { user: User | null; loading: boolean };

  const handleLogout = async () => {
    try {
      authService.logout(); // clears token/cookies and redirects to /login
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-black/5 bg-cream/80 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/70">
      <div className="flex h-16 items-center gap-2 px-3 sm:h-[72px] sm:gap-4 sm:px-6 lg:px-8">
        {/* Sidebar Toggle (off-canvas on mobile, collapse on desktop) */}
        <SidebarTrigger className="hidden lg:inline-flex size-11 shrink-0 cursor-pointer rounded-full bg-white text-ink ring-1 ring-black/5 transition-colors hover:bg-ink hover:text-white focus-visible:ring-2 focus-visible:ring-lime-dark/60" />

        {/* Search Bar */}
        <div className="min-w-0 flex-1 max-w-xl">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              placeholder="Search..."
              className="h-11 w-full rounded-full bg-white pl-10 pr-4 text-sm text-ink ring-1 ring-black/5 placeholder:text-black/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
            />
          </div>
        </div>

        {/* User Section */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative hidden size-11 items-center justify-center rounded-full bg-white text-ink ring-1 ring-black/5 transition-colors hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:inline-flex"
          >
            <IconBell className="h-5 w-5" stroke={1.75} />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-lime ring-2 ring-white" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-11 items-center gap-2 rounded-full bg-white p-1 pr-1 ring-1 ring-black/5 transition-colors hover:ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 md:pr-3">
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage
                  src={`https://api.dicebear.com/9.x/glass/svg?seed=${user?.name || "User"}`}
                />
                <AvatarFallback className="bg-ink font-bold text-lime">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[10rem] truncate text-sm font-bold text-ink md:block">
                {user?.name || "User"}
              </span>
              <IconChevronDown className="hidden h-4 w-4 text-black/40 md:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 rounded-3xl border-black/5 bg-white p-2 font-mont text-black/70 shadow-xl shadow-black/10"
            >
              <DropdownMenuLabel className="mb-1 rounded-2xl bg-cream px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{user?.name || "User"}</p>
                  <p className="truncate font-space text-[11px] font-normal text-black/50">
                    {user?.email || "email@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuItem className="cursor-pointer rounded-full px-3 py-2.5 font-medium text-black/70 focus:bg-cream focus:text-ink">
                <a href="/mystore/profile" className="w-full">
                  Profile Settings
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer rounded-full px-3 py-2.5 font-medium text-black/70 focus:bg-cream focus:text-ink">
                <a href="/mystore/settings" className="w-full">
                  Store Settings
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer rounded-full px-3 py-2.5 font-medium text-black/70 focus:bg-cream focus:text-ink">
                <a href="#" className="w-full">
                  Billing
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-black/5" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer rounded-full px-3 py-2.5 font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
