"use client";

import {
  IconLogout,
  IconMenu2,
  IconShoppingCart,
  IconX,
} from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { authService } from "@/services/auth";
import { motion } from "motion/react";
import { Logo } from "@/app/components/landing/Logo";
import { useCart } from "./cart-context";
import SearchBox from "./search-box";

const menuItemCls =
  "h-10 cursor-pointer rounded-full px-3 font-medium text-black/70 focus:bg-cream focus:text-ink";

interface User {
  full_name?: string;
  email?: string;
  role?: 'customer' | 'seller' | 'admin';
}

const Navbar = () => {
  const pathname = usePathname() ?? "";
  const { user, loading } = useCurrentUser() as { user: User | null; loading: boolean };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count: cartCount } = useCart();

  const handleLogout = async () => {
    try {
      // Call logout service (clears localStorage and cookies)
      authService.logout();

      // The authService.logout() already redirects to /login
      // But you can also manually redirect if needed:
      // router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation links based on user role
  const getNavLinks = () => {
    if (!user) return [];

    const baseLinks = [
      { href: "/dashboard/shop", label: "Shop" },
      { href: "/dashboard/services", label: "Services" },
    ];

    // Add role-specific links
    if (user.role === 'customer') {
      return [
        ...baseLinks,
        { href: "/dashboard/stores", label: "Stores" },
        { href: "/dashboard/orders", label: "My Orders" },
      ];
    } else if (user.role === 'seller') {
      return [
        ...baseLinks,
        { href: "/mystore", label: "My Store" },
        { href: "/mystore/products", label: "Products" },
        { href: "/mystore/orders", label: "Orders" },
      ];
    } else if (user.role === 'admin') {
      return [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/products", label: "Products" },
        { href: "/admin/orders", label: "Orders" },
      ];
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  const isActive = (href: string) =>
    !!pathname && (pathname === href || pathname.startsWith(`${href}/`));

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    const names = user.full_name.split(' ');
    if (names.length >= 2) {
      return names[0][0].toUpperCase() + names[1][0].toUpperCase();
    }
    return user.full_name[0].toUpperCase();
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const avatar = (size: string) => (
    <Avatar className={size}>
      <AvatarImage
        src={`https://api.dicebear.com/9.x/glass/svg?seed=${user?.full_name || 'User'}`}
        alt={user?.full_name || 'User'}
      />
      <AvatarFallback className="bg-ink text-sm font-bold text-lime">
        {getUserInitials()}
      </AvatarFallback>
    </Avatar>
  );

  // Show skeleton while loading
  if (loading) {
    return (
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
        <nav className="mx-auto flex h-14 max-w-[96rem] items-center justify-between gap-4 rounded-full bg-white/70 pl-4 pr-2 ring-1 ring-black/5 backdrop-blur-md sm:h-16 sm:pl-6">
          <Logo />
          <div className="hidden h-10 w-full max-w-sm animate-pulse rounded-full bg-black/5 lg:block" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 animate-pulse rounded-full bg-black/5" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-black/5" />
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        className={`mx-auto flex h-14 max-w-[96rem] items-center justify-between gap-2 rounded-full pl-4 pr-2 transition-all duration-500 sm:h-16 sm:pl-6 md:gap-4 ${
          scrolled
            ? "bg-ink/90 text-white shadow-2xl shadow-black/20 backdrop-blur-xl"
            : "bg-white/70 text-ink ring-1 ring-black/5 backdrop-blur-md"
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="Escro home"
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
        >
          <Logo dark={scrolled} />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden min-w-0 md:flex md:items-center">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={`relative inline-flex h-10 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 lg:px-4 ${
                      active
                        ? scrolled
                          ? "text-ink"
                          : "text-white"
                        : scrolled
                        ? "text-white/70 hover:bg-white/10 hover:text-white"
                        : "text-black/60 hover:bg-black/5 hover:text-black"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="buyer-nav-pill"
                        className={`absolute inset-0 rounded-full ${scrolled ? "bg-lime" : "bg-ink"}`}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden flex-1 justify-end lg:flex">
          <div className="relative w-full max-w-xs">
            <Suspense fallback={null}>
              <SearchBox dark={scrolled} />
            </Suspense>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Cart - Only show for customers */}
          {user?.role === 'customer' && (
            <Link
              href="/dashboard/cart"
              aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-[1.05] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:h-11 sm:w-11 ${
                scrolled ? "bg-lime text-ink" : "bg-ink text-white"
              }`}
            >
              <IconShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span
                  className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-space text-[10px] font-bold ring-2 ${
                    scrolled ? "bg-white text-ink ring-ink" : "bg-lime text-ink ring-white"
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account menu"
                className={`rounded-full ring-2 transition-all focus:outline-none focus-visible:ring-lime-dark ${
                  scrolled ? "ring-white/15 hover:ring-lime" : "ring-black/5 hover:ring-ink/30"
                }`}
              >
                {avatar("h-10 w-10 cursor-pointer sm:h-11 sm:w-11")}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="mt-2 w-64 rounded-3xl border-0 bg-white p-2 font-mont shadow-2xl shadow-black/10 ring-1 ring-black/5"
            >
              <DropdownMenuLabel className="rounded-2xl bg-cream px-3 py-3">
                <div className="space-y-0.5">
                  <p className="truncate font-bold text-ink">{user?.full_name || 'User'}</p>
                  <p className="truncate font-space text-[11px] font-normal text-black/50">{user?.email || ''}</p>
                  {user?.role && (
                    <span className="mt-2 inline-flex items-center rounded-full bg-lime px-2.5 py-0.5 font-space text-[10px] font-bold uppercase tracking-wider text-ink">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-2 bg-black/5" />

              {/* Role-specific menu items */}
              {user?.role === 'seller' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/mystore" className={menuItemCls}>
                      My Store
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mystore/settings" className={menuItemCls}>
                      Store Settings
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {user?.role === 'customer' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/orders" className={menuItemCls}>
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/stores" className={menuItemCls}>
                      Stores
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/services?tab=requests" className={menuItemCls}>
                      My Service Requests
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/cart" className={menuItemCls}>
                      Cart
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {user?.role === 'admin' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className={menuItemCls}>
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className={menuItemCls}>
                      System Settings
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {/* Common menu items */}
              <DropdownMenuItem asChild>
                <Link href="/profile" className={menuItemCls}>
                  Profile Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/settings" className={menuItemCls}>
                  Account Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2 bg-black/5" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="h-10 cursor-pointer rounded-full px-3 font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <IconLogout className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle — replaced by the bottom navigation on small screens */}
          <button
            hidden
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 md:hidden ${
              scrolled ? "text-white hover:bg-white/10" : "text-ink hover:bg-black/5"
            }`}
          >
            {mobileMenuOpen ? (
              <IconX className="h-5 w-5" />
            ) : (
              <IconMenu2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu - full-screen ink panel */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="flex h-[100dvh] w-full max-w-none flex-col gap-0 border-0 bg-ink p-0 font-mont text-white sm:max-w-none md:hidden [&>button:last-child]:hidden"
        >
          <div className="flex h-[68px] shrink-0 items-center justify-between px-6 pt-3">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <SheetDescription className="sr-only">
              Browse Escro and manage your account
            </SheetDescription>
            <Logo dark />
            <SheetClose
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/15"
            >
              <IconX className="h-5 w-5" />
            </SheetClose>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 pt-4">
            {/* User Info in Mobile */}
            <div className="flex items-center gap-3 rounded-3xl bg-white/[0.06] p-3 ring-1 ring-white/10">
              {avatar("h-12 w-12")}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{user?.full_name || 'User'}</p>
                <p className="truncate font-space text-[11px] text-white/50">{user?.email || ''}</p>
              </div>
              {user?.role && (
                <span className="shrink-0 rounded-full bg-lime px-2.5 py-1 font-space text-[10px] font-bold uppercase tracking-wider text-ink">
                  {user.role}
                </span>
              )}
            </div>

            {/* Mobile Search */}
            <div className="relative mt-4">
              <Suspense fallback={null}>
                <SearchBox dark size="lg" placeholder="Search..." onNavigate={() => setMobileMenuOpen(false)} />
              </Suspense>
            </div>

            {/* Mobile Nav Links */}
            <p className="eyebrow mt-8 font-space text-lime">Menu</p>
            <ul className="mt-3 space-y-1">
              {navLinks.map((link, i) => {
                const active = isActive(link.href);
                return (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-baseline gap-4 rounded-2xl px-3 py-2.5 text-3xl font-bold tracking-tight transition-colors ${
                        active ? "bg-lime text-ink" : "text-white hover:bg-white/5"
                      }`}
                    >
                      <span className={`font-space text-sm ${active ? "text-ink/60" : "text-lime"}`}>
                        0{i + 1}
                      </span>
                      {link.label}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          {/* Mobile Footer */}
          <div className="grid shrink-0 grid-cols-1 gap-3 p-6 pb-10">
            {user?.role === 'customer' && (
              <Link
                href="/dashboard/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-14 items-center justify-center gap-2 rounded-full bg-lime font-bold text-ink"
              >
                <IconShoppingCart className="h-5 w-5" />
                Cart
                {cartCount > 0 && (
                  <span className="rounded-full bg-ink px-2 py-0.5 font-space text-[11px] text-lime">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex h-14 items-center justify-center gap-2 rounded-full border border-white/20 font-semibold text-white transition-colors hover:border-red-400 hover:text-red-300"
            >
              <IconLogout className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Navbar;
