import Link from "next/link";
import { notFound } from "next/navigation";

import fs from "fs";
import matter from "gray-matter";
import { Globe } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import path from "path";

import { SectionTitle } from "@/components/section-title";
import { badgeVariants } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import GithubIcon from "@/public/github.svg";

const PROJECT_DIR = path.join(process.cwd(), "content/projects");

type Params = Promise<{ slug: string }>;

// next js Static Site Generation
export async function generateStaticParams() {
  const files = fs.readdirSync(PROJECT_DIR);
  return files.map((file) => ({
    slug: file.replace(".mdx", ""),
  }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const filePath = path.join(PROJECT_DIR, `${slug}.mdx`);

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

export default async function ProjectPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const filePath = path.join(PROJECT_DIR, `${slug}.mdx`);

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
          {/*date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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

          {/* repo url and live demo */}
          <div className="flex items-center gap-3">
            {data.liveUrl && (
              <Link
                href={data.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-foreground text-background hover:bg-foreground/80 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <Globe className="h-4 w-4" />
                Live Demo
              </Link>
            )}
            {data.repositoryUrl && (
              <Link
                href={data.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <GithubIcon className="h-4 w-4" />
                Repository
              </Link>
            )}
          </div>

          {/* tech stack and tags*/}

          {data.techStack && data.techStack.length > 0 && (
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
              <span className="text-foreground mr-1 font-medium">
                Built with:
              </span>
              {data.techStack.map((tech: string, index: number) => (
                <span key={tech} className="font-medium">
                  {tech}
                  {index < data.techStack.length - 1 && (
                    <span className="mx-1 opacity-30">/</span>
                  )}
                </span>
              ))}
            </div>
          )}

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
