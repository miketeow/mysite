import Link from "next/link";

import { getBlogPosts, getProjects } from "@/lib/mdx";

import MainNav from "./main-nav";
import MobileNav from "./mobile-nav";
import SiteSearch from "./site-search";
import { ThemeToggle } from "./theme-toggle";

export async function Header() {
  // fetch data
  const [blogPosts, projects] = await Promise.all([
    getBlogPosts(),
    getProjects(),
  ]);

  // transform data (lightweight payload for client)
  // don't pass the entire mdx content to search bar

  const searchIndex = [
    ...blogPosts.map((post) => ({
      title: post.metadata.title,
      slug: `/blog/${post.slug}`,
      description: post.metadata.description,
      type: "Blog" as const,
    })),
    ...projects.map((project) => ({
      title: project.metadata.title,
      slug: `/project/${project.slug}`,
      description: project.metadata.description,
      type: "Project" as const,
    })),
  ];

  return (
    <header className="bg-background/75 fixed inset-x-0 top-0 z-50 py-4 backdrop-blur-md">
      <div className="container flex max-w-6xl items-center justify-between">
        {/* left side: logo and main nav */}
        <MainNav />
        {/* mobile logo fallback */}
        <div className="md:hidden">
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-tight"
          >
            miketeow
          </Link>
        </div>

        {/* right side: search, theme, mobile menu */}
        <div className="flex items-center gap-2 md:gap-4">
          <SiteSearch data={searchIndex} />
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
