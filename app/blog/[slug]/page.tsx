import Link from "next/link";
import { notFound } from "next/navigation";

import fs from "fs";
import matter from "gray-matter";
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
      <div className="mb-8 border-b border-gray-200 pb-8">
        <SectionTitle as="h1" className="mb-4">
          {data.title}
        </SectionTitle>
        <div className="flex flex-col gap-4">
          {/* author and date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{data.author}</span>
            <span>•</span>
            <time dateTime={data.publishedAt}>
              {formatDate(data.publishedAt)}
            </time>

            {/* conditional update date */}
            {data.updatedAt && (
              <>
                <span className="hidden sm:inline">•</span>
                <time dateTime={data.updatedAt}>
                  Last Updated: {formatDate(data.updatedAt)}
                </time>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {data.tags &&
              data.tags.map((tag: string) => (
                <Link
                  href={`/tag/${tag}`}
                  key={tag}
                  className={badgeVariants({
                    variant: "tag",
                  })}
                >
                  {tag}
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* MDX Content */}
      <div className="prose prose-slate prose-headings:font-semibold prose-a:text-blue-600 dark:prose-invert max-w-none">
        <MDXRemote source={content} />
      </div>
    </article>
  );
}
