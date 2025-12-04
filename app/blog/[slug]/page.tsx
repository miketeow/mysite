import Link from "next/link";
import { notFound } from "next/navigation";

import fs from "fs";
import matter from "gray-matter";
import { Calendar, Hash, User } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import path from "path";

import { SectionTitle } from "@/components/section-title";
import { badgeVariants } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

type Params = Promise<{ slug: string }>;

// next js Static Site Generation
export async function generateStaticParams() {
  const files = fs.readdirSync(BLOG_DIR);
  return files.map((file) => ({
    slug: file.replace(".mdx", ""),
  }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return { title: "Post Not Found" };
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(fileContent);

  return {
    title: data.title,
    description: data.description,
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(fileContent);

  return (
    <article>
      <div className="border-border mb-10 border-b pb-10">
        <SectionTitle as="h1" className="mb-6 text-2xl wrap-break-word">
          {data.title}
        </SectionTitle>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* author and date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* author */}
            <div className="flex items-center gap-2">
              <User className="size-4" />
              <span className="text-foreground font-medium">{data.author}</span>
            </div>

            <span className="text-muted-foreground/30 hidden sm:inline-block">
              |
            </span>

            {/* date */}
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <time dateTime={data.publishedAt}>
                {formatDate(data.publishedAt)}
              </time>

              {/* conditional update date */}
              {data.updatedAt && (
                <div className="bg-muted flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                  <span>Last Updated: {formatDate(data.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
          {/* tags */}

          <div className="flex flex-wrap gap-2">
            {data.tags &&
              data.tags.map((tag: string) => (
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
        <MDXRemote source={content} />
      </div>
    </article>
  );
}
