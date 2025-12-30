import Link from "next/link";

import { SectionTitle } from "@/components/section-title";
import { getProjects } from "@/lib/mdx";
import { formatDate } from "@/lib/utils";

export default async function ProjectListPage() {
  const posts = await getProjects();

  return (
    <section className="container mx-auto max-w-3xl px-4 pt-32 pb-20">
      {/* header */}
      <div className="mb-12">
        <SectionTitle>Project</SectionTitle>
      </div>

      <div className="flex flex-col gap-10">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group relative pl-4 transition-all hover:pl-6"
          >
            <div className="bg-primary absolute top-0 left-0 h-full w-1 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100" />
            <Link href={`/project/${post.slug}`} className="block">
              <div className="flex flex-col gap-1">
                <h2 className="text-foreground decoration-foreground/30 font-mono text-2xl font-semibold tracking-tight underline-offset-4 transition-all group-hover:underline">
                  {post.metadata.title}
                </h2>

                {/* Metadata Row */}
                <div className="text-muted-foreground font-mono text-sm">
                  <time dateTime={post.metadata.publishedAt}>
                    {formatDate(post.metadata.publishedAt)}
                  </time>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
