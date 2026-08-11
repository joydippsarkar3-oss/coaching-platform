"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, GraduationCap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHindi = pathname.startsWith("/hi");
  const toggleLocale = isHindi
    ? pathname.replace(/^\/hi/, "") || "/"
    : `/hi${pathname}`;

  const navLinks = [
    { href: "/courses", label: t("courses") },
    { href: "/centers", label: t("centers") },
    { href: "/apply", label: t("apply") },
    { href: "/results", label: t("results") },
    { href: "/verify", label: t("verify") },
    { href: "/about", label: t("about") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-brand-700 hover:text-brand-900"
          >
            <GraduationCap className="size-7" />
            <span className="text-xl font-bold">CompuTrain</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex lg:items-center lg:gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Hindi/English toggle */}
            <Link
              href={toggleLocale}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              aria-label={isHindi ? "Switch to English" : "हिंदी में देखें"}
            >
              <Globe className="size-4" />
              <span className="hidden sm:inline">{isHindi ? "EN" : "हिं"}</span>
            </Link>

            {/* CTA */}
            <Link
              href="/apply"
              className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:block"
            >
              {t("apply")}
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/franchise"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t("franchise")}
            </Link>
            <Link
              href="/apply"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-700"
            >
              {t("apply")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
