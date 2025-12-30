import Link from "next/link";
import { notFound } from "next/navigation";

import { transformerNotationDiff } from "@shikijs/transformers";
import { Calendar, Globe, Hash, Layers } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import path from "path";
import rehypePrettyCode from "rehype-pretty-code";

import OnThisPage from "@/components/on-this-page";
import { SectionTitle } from "@/components/section-title";
import { badgeVariants } from "@/components/ui/badge";
import { getProjectBySlug, getProjects } from "@/lib/mdx";
import { rehypeCopyLinked } from "@/lib/rehype-copy-plugin";
import { formatDate } from "@/lib/utils";
import { useMDXComponents } from "@/mdx-components";
import GithubIcon from "@/public/github.svg";

type Params = Promise<{ slug: string }>;

const options = {
  theme: {
    dark: "github-dark-dimmed",
    light: "github-light",
  },
  keepBackground: true,
  transformers: [transformerNotationDiff()],
};

// next js Static Site Generation
export async function generateStaticParams() {
  const posts = await getProjects();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getProjectBySlug(slug);

  if (!post) {
    return { title: "Not Found" };
  }

  return {
    title: post.metadata.title,
    description: post.metadata.description,
  };
}

export default async function ProjectPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getProjectBySlug(slug); // Reuses the cache from generateMetadata

  if (!post) notFound();

  const { content, metadata } = post;

  return (
    <div className="container mx-auto max-w-6xl px-4">
      {/* header section */}
      <header className="border-border mb-16 border-b pb-10">
        {/* top row */}
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <SectionTitle as="h1" className="text-2xl wrap-break-word">
            {metadata.title}
          </SectionTitle>

          {/* live url or source code */}
          <div className="flex shrink-0 gap-3">
            {metadata.repositoryUrl && (
              <Link
                href={metadata.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
              >
                <Globe className="h-4 w-4" />
                Visit Site
              </Link>
            )}
            {metadata.repositoryUrl && (
              <Link
                href={metadata.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-muted hover:bg-accent inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              >
                <GithubIcon className="h-4 w-4" />
                Source
              </Link>
            )}
          </div>
        </div>

        {/* spec grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* column a: timeline */}
          <div className="space-y-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <Calendar className="size-3" /> Timeline
            </h3>
            <div className="text-sm font-medium">
              <time dateTime={metadata.publishedAt}>
                {formatDate(metadata.publishedAt)}
              </time>
              {metadata.updatedAt && (
                <div className="text-muted-foreground mt-1 text-xs">
                  Updated: {formatDate(metadata.updatedAt)}
                </div>
              )}
            </div>
          </div>

          {/* column b: tech stack */}
          {metadata.techStack && metadata.techStack.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                <Layers className="size-3" /> Built With
              </h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                {metadata.techStack.map((tech: string, index: number) => (
                  <span key={tech} className="text-foreground">
                    {tech}
                    {index < metadata.techStack.length - 1 && (
                      <span className="text-muted-foreground/40 ml-2">/</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* column c: clickable tags */}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                <Hash className="size-3" /> Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag: string) => (
                  <Link
                    href={`/tag/${tag}`}
                    key={tag}
                    className={badgeVariants({
                      variant: "secondary",
                      className:
                        "rounded-md px-2 py-0.5 text-xs font-normal capitalize",
                    })}
                  >
                    <Hash className="mr-1 size-3 opacity-50" />
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* content grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* MDX Content */}
        <div className="order-2 lg:order-1 lg:col-span-9">
          <article className="prose prose-slate prose-headings:font-semibold prose-a:text-blue-600 dark:prose-invert max-w-none pb-20 lg:pb-[80vh]">
            <MDXRemote
              source={content}
              components={useMDXComponents()}
              options={{
                mdxOptions: {
                  rehypePlugins: [
                    rehypeCopyLinked,
                    [rehypePrettyCode, options],
                  ],
                },
              }}
            />
          </article>
        </div>

        {/* side: table of contents */}
        <aside className="order-1 lg:order-2 lg:col-span-3">
          <div className="lg:sticky lg:top-32">
            <OnThisPage />
          </div>
        </aside>
      </div>
    </div>
  );
}
