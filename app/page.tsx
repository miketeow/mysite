import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Hero } from "@/components/hero";
import { SectionTitle } from "@/components/section-title";
import { badgeVariants } from "@/components/ui/badge";
import { getBlogPosts, getProjects } from "@/lib/mdx";
import { formatDate } from "@/lib/utils";

export default function Home() {
  const latestBlogPosts = getBlogPosts().slice(0, 4);
  const featuredProjects = getProjects().slice(0, 2);
  return (
    <div className="py-20">
      <div className="container max-w-6xl space-y-28">
        <Hero />

        {/* featured projects */}
        <section>
          <div className="mb-8 flex items-center justify-between">
            <SectionTitle>Featured Projects</SectionTitle>
            <Link
              href="/project"
              className="group text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
            >
              View All
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {featuredProjects.map((project) => (
              <Link
                key={project.slug}
                href={`/project/${project.slug}`}
                className="group hover:bg-muted/50 relative flex flex-col gap-3 rounded-lg border p-6 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="group-hover:text-primary text-xl font-semibold transition-colors">
                    {project.metadata.title}
                  </h3>
                </div>
                <p className="text-muted-foreground line-clamp-2">
                  {project.metadata.description}
                </p>
                {project.metadata.techStack && (
                  <div className="text-muted-foreground mt-auto flex gap-2 pt-4 font-mono text-xs">
                    {project.metadata.techStack.join(" / ")}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* latest blog posts */}
        <section>
          <div className="mb-8 flex items-center justify-between">
            <SectionTitle>Latest Blog Posts</SectionTitle>
            <Link
              href="/blog"
              className="group text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
            >
              Read More
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="flex flex-col gap-8">
            {latestBlogPosts.map((post) => (
              <article
                key={post.slug}
                className="group relative pl-4 transition-all hover:pl-6"
              >
                <div className="bg-primary absolute top-0 left-0 h-full w-1 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100" />
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="group-hover:text-primary text-lg font-medium underline-offset-4 transition-colors group-hover:underline">
                      {post.metadata.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-1 text-sm sm:hidden">
                      {post.metadata.description}
                    </p>
                  </div>

                  {/* date and tags */}
                  <div className="text-muted-foreground flex shrink-0 items-center gap-4 font-mono text-sm">
                    {/* Show only the first tag to keep it clean */}
                    <div
                      className={badgeVariants({
                        variant: "secondary",
                        className: "hidden sm:inline-flex",
                      })}
                    >
                      {post.metadata.tags[0]}
                    </div>
                    <time>{formatDate(post.metadata.publishedAt)}</time>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
