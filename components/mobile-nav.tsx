"use client";

import Link from "next/link";

import { MenuIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { navLinks } from "@/lib/constants";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const MobileNav = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Sheet>
      <SheetTrigger className="block md:hidden">
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>miketeow</SheetTitle>
        </SheetHeader>
        <div className="mt-10 flex h-screen flex-col items-center justify-start gap-10 p-4">
          {navLinks.map((link) => (
            <Link href={link.href} className="mobile-nav" key={link.name}>
              {link.name}
            </Link>
          ))}

          <div
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="mobile-nav"
          >
            {theme === "dark" ? (
              <span>Dark Mode</span>
            ) : (
              <span>Light Mode</span>
            )}
          </div>
        </div>
        <SheetFooter></SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
