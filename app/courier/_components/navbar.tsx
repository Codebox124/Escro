"use client";

import { useEffect, useState } from "react";
import { IconSearch, IconPower } from "@/components/icons";
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
import { Logo } from "@/app/components/landing/Logo";
import { authService } from "@/services/auth";
import {
  errorMessage,
  initials,
  setAvailability,
  useCourier,
} from "./courier-shared";

const iconBtn =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink ring-1 ring-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

const Navbar = () => {
  const { profile, isAvailable, saving } = useCourier();
  const [toggleError, setToggleError] = useState<string | null>(null);
  const userName = profile?.name || "Courier";
  const loaded = isAvailable !== null;
  const online = isAvailable === true;

  useEffect(() => {
    if (!toggleError) return;
    const t = setTimeout(() => setToggleError(null), 5000);
    return () => clearTimeout(t);
  }, [toggleError]);

  const toggle = async () => {
    if (!loaded || saving) return;
    setToggleError(null);
    try {
      await setAvailability(!online);
    } catch (err) {
      setToggleError(errorMessage(err, "Couldn't update your status"));
    }
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-black/5 bg-cream/80 px-3 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger
            className={`${iconBtn} hidden cursor-pointer hover:bg-ink hover:text-white lg:inline-flex`}
            size={"lg"}
          />
          <div className="flex items-center gap-2 md:hidden">
            <Logo />
            <span className="hidden rounded-full bg-lime px-2 py-0.5 font-space text-[10px] font-bold uppercase tracking-widest text-ink min-[400px]:inline">
              Courier
            </span>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          {/* Search Bar */}
          <div className="hidden w-64 sm:block lg:w-80">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                placeholder="Search deliveries..."
                className="h-11 w-full rounded-full bg-white pl-11 pr-4 text-sm text-ink ring-1 ring-black/5 transition-all placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-lime-dark/60"
              />
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={online}
            aria-label={online ? "You are online. Go offline" : "You are offline. Go online"}
            title={online ? "Online — tap to go offline" : "Offline — tap to go online"}
            onClick={toggle}
            disabled={!loaded || saving}
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full pl-3 pr-3.5 text-xs font-bold ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-wait sm:text-sm ${
              !loaded
                ? "bg-white text-black/40 ring-black/5"
                : online
                ? "bg-lime text-ink ring-lime-dark hover:bg-lime-dark"
                : "bg-white text-black/60 ring-black/10 hover:bg-cream-dark"
            } ${saving ? "opacity-70" : ""}`}
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <IconPower className="h-5 w-5" />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${
                  !loaded ? "bg-black/20" : online ? "bg-emerald-600" : "bg-black/30"
                }`}
              />
              {!loaded ? "…" : online ? "Online" : "Offline"}
            </span>
          </button>

          {/* User Section */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full bg-white p-1 ring-1 ring-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink lg:pr-4">
                <Avatar className="h-9 w-9 cursor-pointer">
                  {profile?.avatar && (
                    <AvatarImage src={profile.avatar} alt={userName} />
                  )}
                  <AvatarFallback className="bg-ink text-xs font-semibold text-lime">
                    {initials(profile?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left leading-tight lg:block">
                  <span className="block max-w-[10rem] truncate text-sm font-bold text-ink">
                    {userName}
                  </span>
                  <span className="block font-space text-[10px] uppercase tracking-widest text-black/45">
                    Courier
                  </span>
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-60 rounded-2xl border-black/5 bg-white p-1.5 text-ink shadow-xl shadow-black/10"
              >
                <DropdownMenuLabel className="px-2.5 py-2">
                  <div>
                    <p className="truncate font-bold text-ink">{userName}</p>
                    {profile?.email && (
                      <p className="truncate font-space text-xs font-normal text-black/50">
                        {profile.email}
                      </p>
                    )}
                    {loaded && (
                      <p
                        className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-space text-[10px] font-bold uppercase tracking-widest ${
                          online ? "bg-lime text-ink" : "bg-cream text-black/55"
                        }`}
                      >
                        {online ? "Online" : "Offline"}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-black/5" />

                <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-2.5 py-2.5 focus:bg-cream focus:text-ink">
                  <a href="/courier/settings" className="w-full">
                    Settings
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-2.5 py-2.5 focus:bg-cream focus:text-ink">
                  <a href="/courier/earnings" className="w-full">
                    Earnings & payouts
                  </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-black/5" />

                <DropdownMenuItem
                  onClick={() => authService.logout()}
                  className="cursor-pointer rounded-xl px-2.5 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {toggleError && (
        <div
          role="alert"
          className="absolute inset-x-3 top-full mt-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg sm:left-auto sm:right-6 sm:max-w-sm"
        >
          {toggleError}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
