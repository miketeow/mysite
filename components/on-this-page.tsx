"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface LinkType {
  id: string;
  text: string;
  level: "h2" | "h3";
}

export default function OnThisPage() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // state for sliding marker
  const [markerStyle, setMarkerStyle] = useState({
    top: 0,
    height: 0,
    opacity: 0,
  });
  const navRef = useRef<HTMLElement>(null);

  // lock to prevent observer from firing during click-scroll
  const isClicking = useRef(false);

  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // extract headings

  useEffect(() => {
    const extractHeadings = () => {
      const content = document.querySelector("article");
      if (!content) return;

      const headings = content.querySelectorAll("h2, h3");
      const generatedLinks: LinkType[] = [];

      headings.forEach((heading) => {
        if (heading.id) {
          generatedLinks.push({
            id: heading.id,
            text: heading.textContent || "",
            level: heading.tagName.toLowerCase() as "h2" | "h3",
          });
        }
      });

      setLinks(generatedLinks);
      // set first item active initially if exists
      if (generatedLinks.length > 0) setActiveId(generatedLinks[0].id);
    };

    extractHeadings();

    // intersection observer to track scrolling
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // check if user is clicking, ignore observer
          if (isClicking.current) return;
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    const headings = document.querySelectorAll("article h2, article h3");
    headings.forEach((heading) => {
      observer.observe(heading);
    });
    return () => observer.disconnect();
  }, []);

  // global scroll listener
  useEffect(() => {
    const handleScroll = () => {
      // if user is scrolling, do nothing
      // if user is clicking the link, need to know when to turn off
      if (isClicking.current) {
        // clear previous timeout
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }

        // set new timer. If no new scroll event happens within 100ms
        // assume scrolling or clicking is over
        scrollTimeout.current = setTimeout(() => {
          isClicking.current = false;
        }, 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // marker logic
  // whenever activeId changes, update marker position

  useEffect(() => {
    if (!activeId || !navRef.current) return;

    // find the link inside navigation
    const activeLink = navRef.current.querySelector(`a[href="#${activeId}"]`);

    if (activeLink instanceof HTMLElement) {
      setMarkerStyle({
        top: activeLink.offsetTop,
        height: activeLink.offsetHeight,
        opacity: 1,
      });
    }
  }, [activeId, links]);

  if (links.length === 0) return null;

  return (
    <div className="hidden lg:block">
      <div className="sticky top-32">
        <h4 className="text-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
          On This Page
        </h4>

        {/* navigation container */}
        <div className="custom-scrollbar max-h-[75vh] overflow-y-auto pr-4">
          <nav className="relative" ref={navRef}>
            {/* the track - gray line on the left */}
            <div className="absolute top-0 left-0 h-full w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* the marker - sliding color line */}
            <div
              className="bg-primary absolute left-0 w-0.5 transition-all duration-300 ease-in-out"
              style={{
                top: markerStyle.top,
                height: markerStyle.height,
                opacity: markerStyle.opacity,
              }}
            />

            <ul className="flex flex-col text-sm">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    className={cn(
                      "hover:text-foreground block py-2 pr-2 transition-colors duration-300",
                      // indentation
                      link.level === "h3" ? "pl-8" : "pl-4",

                      // active state text color
                      link.id === activeId
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                    onClick={(e) => {
                      // lock observer immediately if clicked
                      isClicking.current = true;
                      setActiveId(link.id);
                    }}
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
