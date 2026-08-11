import Link from "next/link";
import { useTranslations } from "next-intl";
import { Facebook, Twitter, Youtube, Instagram, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-brand-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">CompuTrain</span>
            </div>
            <p className="text-sm leading-relaxed">{t("footer.tagline")}</p>
            <div className="flex gap-4">
              <a href="https://facebook.com" aria-label="Facebook" className="hover:text-white transition-colors">
                <Facebook className="size-5" />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="hover:text-white transition-colors">
                <Twitter className="size-5" />
              </a>
              <a href="https://youtube.com" aria-label="YouTube" className="hover:text-white transition-colors">
                <Youtube className="size-5" />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="hover:text-white transition-colors">
                <Instagram className="size-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/courses", label: t("footer.courses") },
                { href: "/centers", label: t("footer.centers") },
                { href: "/apply", label: t("nav.apply") },
                { href: "/results", label: t("nav.results") },
                { href: "/verify", label: t("footer.verify") },
                { href: "/student-corner", label: t("nav.studentCorner") },
                { href: "/blog", label: t("nav.blog") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/about", label: t("nav.about") },
                { href: "/franchise", label: t("footer.franchise") },
                { href: "/contact", label: t("nav.contact") },
                { href: "/legal/terms", label: t("footer.terms") },
                { href: "/legal/privacy", label: t("footer.privacy") },
                { href: "/legal/refund", label: t("footer.refund") },
                { href: "/status", label: "System Status" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.connect")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" />
                <a href="tel:+911800000000" className="hover:text-white transition-colors">
                  1800-000-0000 (Toll Free)
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0" />
                <a href="mailto:info@computrain.in" className="hover:text-white transition-colors">
                  info@computrain.in
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>Head Office, New Delhi, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-brand-800 pt-6 text-center text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} CompuTrain. {t("footer.allRightsReserved")}
          </p>
          <p className="mt-1">{t("footer.poweredBy")}</p>
        </div>
      </div>
    </footer>
  );
}
