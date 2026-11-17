"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Shield,
  Home,
  Truck,
  Store,
  LogIn,
  UserPlus,
  ArrowRight,
} from "@/components/icons";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      if (typeof window !== "undefined") {
        const totalScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(currentProgress);
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const sections = ["home", "HowItWorks", "sellers"];
        const currentSection = sections.find((section) => {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            return rect.top <= 150 && rect.bottom >= 150;
          }
          return false;
        });

        if (currentSection) {
          setActiveLink(currentSection.toLowerCase());
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      setActiveLink(targetId.toLowerCase());

      setIsOpen(false);

      const startPosition = window.pageYOffset;
      const targetPosition =
        targetElement.getBoundingClientRect().top + startPosition - 80;
      const distance = targetPosition - startPosition;
      const duration = 800;
      let startTime: number | null = null;

      const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const easeProgress = easeInOutCubic(progress);

        window.scrollTo(0, startPosition + distance * easeProgress);

        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      };

      requestAnimationFrame(animation);
    } else {
      setActiveLink(targetId.toLowerCase());
      setIsOpen(false);
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveLink("home");
    setIsOpen(false);

    const startPosition = window.pageYOffset;
    const duration = 800;
    let startTime: number | null = null;

    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      window.scrollTo(0, startPosition * (1 - easeProgress));

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  const navLinks = [
    {
      name: "Home",
      href: "#home",
      icon: Home,
    },
    {
      name: "How It Works",
      href: "#HowItWorks",
      icon: Truck,
    },
    {
      name: "For Sellers",
      href: "#sellers",
      icon: Store,
    },
  ];

  const isActive = (href: string) =>
    activeLink === href.replace("#", "").toLowerCase();

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isOpen
            ? "opacity-0 pointer-events-none"
            : scrolled
            ? "bg-zinc-950/85 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20 py-2.5"
            : "bg-transparent border-b border-transparent py-4 sm:py-5"
        }`}
      >
        <div className="page-container">
          <div className="flex items-center justify-between gap-4">
            <a
              href="#home"
              onClick={handleLogoClick}
              className="flex items-center gap-3 rounded-xl group/logo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-emerald-500/30 blur-md transition-all duration-500 group-hover/logo:blur-lg" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-600/30 transition-transform duration-300 group-hover/logo:scale-105 sm:h-11 sm:w-11">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-mont text-lg font-bold tracking-tight text-white sm:text-xl">
                  Escro
                </span>
                <span className="mt-1 text-[11px] font-medium text-emerald-400">
                  Secure Marketplace
                </span>
              </div>
            </a>

            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.03] p-1 backdrop-blur-md lg:flex">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                    isActive(link.href)
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <a
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98]"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <a
                href="/signup"
                aria-label="Get Started"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 active:scale-[0.98]"
              >
                <span className="hidden sm:inline">Get Started</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-all hover:border-emerald-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-50 transition-all duration-300 lg:hidden ${
          isOpen
            ? "visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute right-0 top-0 flex h-dvh w-full max-w-sm flex-col border-l border-white/10 bg-zinc-950 shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <a
              href="#home"
              onClick={handleLogoClick}
              className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="leading-none">
                <div className="font-mont text-lg font-bold text-white">Escro</div>
                <div className="mt-1 text-[11px] font-medium text-emerald-400">
                  Secure Marketplace
                </div>
              </div>
            </a>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:border-emerald-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="mb-8">
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Navigation
              </div>
              <div className="space-y-1">
                {navLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`flex h-12 items-center gap-3 rounded-xl px-3 font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Learn More
              </div>
              <div className="space-y-1">
                {["Features", "For Customers", "For Couriers", "Pricing"].map(
                  (item, idx) => (
                    <a
                      key={idx}
                      href="#"
                      onClick={() => setIsOpen(false)}
                      className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {item}
                    </a>
                  )
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Support
              </div>
              <div className="space-y-1">
                {["Help Center", "Contact Us", "Privacy Policy", "Terms"].map(
                  (item, idx) => (
                    <a
                      key={idx}
                      href="#"
                      onClick={() => setIsOpen(false)}
                      className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {item}
                    </a>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/5 bg-zinc-950 px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/login"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-zinc-200 transition-colors hover:border-emerald-500/40 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </a>
              <a
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600"
              >
                <UserPlus className="h-4 w-4" />
                Sign Up
              </a>
            </div>
            <a
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-zinc-400 transition-colors hover:text-emerald-400"
            >
              Need help getting started? <span className="font-semibold">Contact Support</span>
            </a>
            <div className="text-center text-xs text-zinc-600">
              © {new Date().getFullYear()} Escro. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {isMounted && (
        <div
          className={`fixed top-0 left-0 right-0 z-[60] h-0.5 transition-opacity duration-300 ${
            isOpen ? "opacity-0" : "opacity-100"
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-150"
            style={{
              width: `${scrollProgress}%`,
            }}
          />
        </div>
      )}
    </>
  );
};

export default NavBar;
