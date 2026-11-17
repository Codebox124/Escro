"use client";

import React, { useState } from "react";
import {
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Shield,
  Lock,
  Globe,
  MessageSquare,
  ArrowUp,
  Award,
  CheckCircle2,
  Users,
} from "@/components/icons";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Subscribed with:", email);
    setEmail("");
    // You can add API call here
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Data-driven configuration
  const footerLinks = {
    platform: {
      title: "Platform",
      icon: Globe,
      links: [
        { name: "Marketplace", href: "#marketplace", highlight: true },
        { name: "For Sellers", href: "#sellers" },
        { name: "For Buyers", href: "#buyers" },
        { name: "For Couriers", href: "#couriers" },
        { name: "For Agencies", href: "#agencies" },
      ],
    },
    resources: {
      title: "Resources",
      icon: MessageSquare,
      links: [
        { name: "Help Center", href: "#help", highlight: true },
        { name: "Blog & Guides", href: "#blog" },
        { name: "API Documentation", href: "#api" },
        { name: "Community Forum", href: "#community" },
        { name: "Webinars", href: "#webinars" },
      ],
    },
    company: {
      title: "Company",
      icon: Users,
      links: [
        { name: "About Us", href: "#about" },
        { name: "Careers", href: "#careers", highlight: true },
        { name: "Press & Media", href: "#press" },
        { name: "Partnerships", href: "#partnerships" },
        { name: "Contact Sales", href: "#sales" },
      ],
    },
    legal: {
      title: "Legal",
      icon: Shield,
      links: [
        { name: "Privacy Policy", href: "#privacy" },
        { name: "Terms of Service", href: "#terms" },
        { name: "Cookie Policy", href: "#cookies" },
        { name: "GDPR Compliance", href: "#gdpr", highlight: true },
        { name: "Security Overview", href: "#security" },
      ],
    },
  };

  const socialLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      href: "#",
      color:
        "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/20",
      followerCount: "15.2K",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: "#",
      color:
        "hover:bg-[#4267B2]/10 hover:text-[#4267B2] hover:border-[#4267B2]/20",
      followerCount: "24.7K",
    },
    {
      name: "Instagram",
      icon: Instagram,
      href: "#",
      color:
        "hover:bg-[#E4405F]/10 hover:text-[#E4405F] hover:border-[#E4405F]/20",
      followerCount: "38.5K",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "#",
      color:
        "hover:bg-[#0077B5]/10 hover:text-[#0077B5] hover:border-[#0077B5]/20",
      followerCount: "12.1K",
    },
  ];


  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-zinc-950">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        <div className="absolute -top-40 left-1/2 h-80 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="page-container relative z-10 py-14 md:py-20">
        {/* CTA band */}
        <div className="mb-14 flex flex-col items-start gap-6 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-white/[0.03] to-transparent p-6 sm:p-8 md:mb-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h3 className="font-mont text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to trade with confidence?
            </h3>
            <p className="mt-2 font-noto text-zinc-400">
              Create a free account in minutes. Every order is escrow-protected.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            >
              Get Started
            </a>
            <a
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="mb-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Brand Section */}
          <div className="lg:col-span-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-600/30">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="leading-none">
                <h3 className="font-mont text-2xl font-bold tracking-tight text-white">
                  Escro
                </h3>
                <span className="mt-1 block text-xs font-medium text-emerald-400">
                  Secure Marketplace
                </span>
              </div>
            </div>

            <p className="mb-8 max-w-md font-noto text-sm leading-relaxed text-zinc-400 sm:text-base">
              Your trusted multi-vendor marketplace where every transaction is
              protected by escrow technology. Trade with confidence, backed by
              enterprise-grade security.
            </p>

            {/* Newsletter */}
            <div className="mb-8 max-w-md">
              <label
                htmlFor="footer-newsletter"
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"
              >
                <Mail className="h-4 w-4 text-emerald-400" />
                Stay Updated
              </label>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="footer-newsletter"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 active:scale-[0.98]"
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <a
                href="mailto:support@escro.com"
                className="group flex items-center gap-3 text-zinc-400 transition-colors hover:text-emerald-400"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs text-zinc-500">Support</div>
                  <div className="font-noto text-sm">support@escro.com</div>
                </div>
              </a>

              <a
                href="tel:+995555317927"
                className="group flex items-center gap-3 text-zinc-400 transition-colors hover:text-emerald-400"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs text-zinc-500">Sales</div>
                  <div className="font-noto text-sm">+995 555 31 79 27</div>
                </div>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
              {Object.values(footerLinks).map((section, idx) => (
                <div key={idx}>
                  <h4 className="mb-4 flex items-center gap-2 font-mont text-sm font-bold text-white">
                    <section.icon className="h-4 w-4 text-emerald-400" />
                    {section.title}
                  </h4>

                  <ul className="space-y-1">
                    {section.links.map((link, linkIdx) => (
                      <li key={linkIdx}>
                        <a
                          href={link.href}
                          className="group/link inline-flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1 py-1 font-noto text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                          {link.name}
                          {link.highlight && (
                            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/20">
                              New
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="mt-10">
              <div className="mb-4 text-sm font-semibold text-white">Follow Us</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {socialLinks.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    aria-label={social.name}
                    className={`flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-zinc-300 transition-all duration-200 ${social.color}`}
                  >
                    <social.icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-sm font-medium">
                        {social.name}
                      </span>
                      <span className="block text-[11px] text-zinc-500">
                        {social.followerCount}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:items-center">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400 sm:mt-0" />
          <span className="text-sm text-zinc-400">
            <span className="font-medium text-white">Security Notice:</span>{" "}
            All transactions are protected by our escrow system. Never share
            your password or 2FA codes.
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-6 border-t border-white/5 pt-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Copyright */}
          <div>
            <p className="mb-1 font-noto text-sm text-zinc-400">
              © {currentYear} Escro Technologies. All rights reserved.
            </p>
            <p className="text-xs text-zinc-600">
              Secure marketplace platform powered by blockchain escrow
              technology.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-zinc-400">SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-zinc-400">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <Award className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs text-zinc-400">Trusted Partner</span>
              </div>
            </div>

            {/* Back to Top */}
            <button
              onClick={scrollToTop}
              className="group inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-zinc-400 transition-all hover:border-emerald-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            >
              <span className="text-sm font-medium">Back to Top</span>
              <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
