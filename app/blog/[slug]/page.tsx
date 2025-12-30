import Link from "next/link";
import { notFound } from "next/navigation";

import { Calendar, Hash, User } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";

import { SectionTitle } from "@/components/section-title";
import { badgeVariants } from "@/components/ui/badge";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/mdx";
import { rehypeCopyLinked } from "@/lib/rehype-copy-plugin";
import { formatDate } from "@/lib/utils";
import { useMDXComponents } from "@/mdx-components";

type Params = Promise<{ slug: string }>;

const options = {
  theme: {
    dark: "github-dark-dimmed",
    light: "github-light",
  },
  keepBackground: true,
};

// next js Static Site Generation
export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Not Found" };
  }

  return {
    title: post.metadata.title,
    description: post.metadata.description,
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug); // Reuses the cache from generateMetadata

  if (!post) notFound();

  const { content, metadata } = post;

  return (
    <article>
      <div className="border-border mb-10 border-b pb-10">
        <SectionTitle as="h1" className="mb-6 text-3xl wrap-break-word">
          {metadata.title}
        </SectionTitle>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* author and date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* author */}
            <div className="flex items-center gap-2">
              <User className="size-4" />
              <span className="text-foreground font-medium">
                {metadata.author}
              </span>
            </div>

            <span className="text-muted-foreground/30 hidden sm:inline-block">
              |
            </span>

            {/* date */}
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <time dateTime={metadata.publishedAt}>
                {formatDate(metadata.publishedAt)}
              </time>

              {/* conditional update date */}
              {metadata.updatedAt && (
                <div className="bg-muted flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                  <span>Last Updated: {formatDate(metadata.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
          {/* tags */}

          <div className="flex flex-wrap gap-2">
            {metadata.tags &&
              metadata.tags.map((tag: string) => (
                <Link
                  href={`/tag/${tag}`}
                  key={tag}
                  className={badgeVariants({
                    variant: "tag",
                    className: "px-2 py-0.5 text-xs font-normal capitalize",
                  })}
                >
                  <Hash className="mr-1 size-3 opacity-50" />
                  {tag}
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* MDX Content */}
      <div className="prose prose-slate prose-headings:font-semibold prose-a:text-blue-600 dark:prose-invert max-w-none pb-20 lg:pb-[80vh]">
        <MDXRemote
          source={content}
          components={useMDXComponents()}
          options={{
            mdxOptions: {
              rehypePlugins: [rehypeCopyLinked, [rehypePrettyCode, options]],
            },
          }}
        />
      </div>
    </article>
  );
}
