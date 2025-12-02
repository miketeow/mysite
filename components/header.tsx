"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navLinks } from "@/lib/constants";
import { cn } from "@/lib/utils";

import MobileNav from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const pathname = usePathname();
  return (
    <header className="bg-background/75 fixed inset-x-0 top-0 z-50 py-4 backdrop-blur-md">
      <nav className="container flex max-w-5xl items-center justify-between">
        <div>
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-tight"
          >
            miketeow
          </Link>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-8 text-sm font-medium md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={cn(
                    "hover:text-primary transition-colors duration-200",
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4">
          <MobileNav />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

export default Header;
