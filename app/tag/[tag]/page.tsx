import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionTitle } from "@/components/section-title";
import { getAllTags, getPostsByTag } from "@/lib/mdx";
import { formatDate } from "@/lib/utils";

type Params = Promise<{ tag: string }>;

// next js Static Site Generation
export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({
    tag,
  }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { tag } = await params;
  return {
    title: `Tag: ${tag}`,
    description: `Posts and projects about  ${tag}`,
  };
}

export default async function TagPage({ params }: { params: Params }) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const { blogs, projects } = await getPostsByTag(decodedTag);

  if (blogs.length === 0 && projects.length === 0) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-32 pb-20">
      {/* header */}
      <div className="mb-12 pb-8">
        <SectionTitle as="h1">{decodedTag}</SectionTitle>
      </div>

      {/* projects */}
      {projects.length > 0 && (
        <div className="mb-16">
          <SectionTitle as="h2" className="mb-8">
            Projects
          </SectionTitle>
          <div className="grid-cols-1 gap-8">
            {projects.map((project) => (
              <Link
                href={`/project/${project.slug}`}
                key={project.slug}
                className="group hover:bg-muted/50 mb-5 block rounded-lg border p-6 transition-colors"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="group-hover:text-primary font-mono text-xl font-bold transition-colors">
                    {project.metadata.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2">
                    {project.metadata.description}
                  </p>
                  {project.metadata.techStack && (
                    <div className="text-muted-foreground mt-2 font-mono text-xs">
                      {project.metadata.techStack.join(" / ")}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* blogs */}
      {blogs.length > 0 && (
        <div>
          <SectionTitle as="h2" className="mb-8">
            Blog Posts
          </SectionTitle>
          <div className="flex flex-col gap-8">
            {blogs.map((post) => (
              <article key={post.slug} className="group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-foreground group-hover:text-primary group-hover:decoration-primary/30 font-mono text-2xl font-semibold transition-colors group-hover:underline group-hover:underline-offset-4">
                      {post.metadata.title}
                    </h2>
                    <div className="text-muted-foreground flex items-center gap-2 font-mono text-sm">
                      <time>{formatDate(post.metadata.publishedAt)}</time>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
