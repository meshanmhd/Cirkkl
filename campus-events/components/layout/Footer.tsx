import Link from "next/link";
import { Github, Twitter, Instagram, Linkedin } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Events", href: "/events" },
    { label: "Clubs", href: "#clubs" },
    { label: "Calendar", href: "#" },
    { label: "Notifications", href: "#" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

const SOCIALS = [
  { Icon: Twitter, href: "#", label: "Twitter" },
  { Icon: Instagram, href: "#", label: "Instagram" },
  { Icon: Linkedin, href: "#", label: "LinkedIn" },
  { Icon: Github, href: "#", label: "GitHub" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E5EA] bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#111111]">
              Cirkkl
            </Link>
            <p className="mt-4 text-[#6E6E73] text-sm leading-relaxed max-w-xs">
              The all-in-one platform for discovering and registering for events happening across your campus.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="-full border border-[#E5E5EA] flex items-center justify-center text-[#6E6E73] hover:text-[#cfe467] hover:border-[#cfe467] transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold text-[#111111] uppercase tracking-widest mb-4">
                {heading}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#6E6E73] hover:text-[#111111] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[#E5E5EA] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6E6E73]">
            © {new Date().getFullYear()} Campus Events. All rights reserved.
          </p>
          <p className="text-xs text-[#6E6E73]">
            Made with ❤️ for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
