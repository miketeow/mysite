import { cache } from "react";

import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { z } from "zod";

// 1. Define a Base Schema for shared fields
const BaseMetadataSchema = z.object({
  title: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
});

// 2. Use .extend() to compose specialized schemas
const BlogMetadataSchema = BaseMetadataSchema.extend({
  author: z.string(),
});

const ProjectMetadataSchema = BaseMetadataSchema.extend({
  repositoryUrl: z.url(),
  techStack: z.array(z.string()).default([]),
});

// 3. Export types inferred directly from the schemas
export type BlogMetadata = z.infer<typeof BlogMetadataSchema>;
export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>;

// Optional: If you still need a generic base type for shared logic
export type BaseMetadata = z.infer<typeof BaseMetadataSchema>;

const CONTENT_DIR = path.join(process.cwd(), "content");

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

// centralized file reader (internal only)
const readMDXFile = cache((filePath: string) => {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return matter(rawContent);
});

export const getBlogPosts = cache(async () => {
  const blogDir = path.join(CONTENT_DIR, "blog");

  const files = getMDXFiles(blogDir);

  return files
    .map((file) => {
      const { data, content } = readMDXFile(path.join(blogDir, file));

      return {
        slug: file.replace(/\.mdx$/, ""),
        metadata: BlogMetadataSchema.parse(data),
        content,
      };
    })
    .sort((a, b) => {
      return (
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime()
      );
    });
});

export const getProjects = cache(async () => {
  const projectDir = path.join(CONTENT_DIR, "projects");
  const files = getMDXFiles(projectDir);

  return files
    .map((file) => {
      const { data, content } = readMDXFile(path.join(projectDir, file));

      return {
        slug: file.replace(/\.mdx$/, ""),
        metadata: ProjectMetadataSchema.parse(data),
        content,
      };
    })
    .sort((a, b) => {
      return (
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime()
      );
    });
});

export const getAllTags = cache(async () => {
  const [blogPosts, projects] = await Promise.all([
    getBlogPosts(),
    getProjects(),
  ]);

  const tags = new Set<string>();

  [...blogPosts, ...projects].forEach((post) => {
    post.metadata.tags.forEach((tag) => {
      tags.add(tag);
    });
  });

  return Array.from(tags);
});

export const getPostsByTag = cache(async (tag: string) => {
  const [blogPosts, projects] = await Promise.all([
    getBlogPosts(),
    getProjects(),
  ]);

  const filteredBlogPosts = blogPosts.filter((post) => {
    return post.metadata.tags.includes(tag);
  });

  const filteredProjects = projects.filter((project) => {
    return project.metadata.tags.includes(tag);
  });

  return {
    blogs: filteredBlogPosts,
    projects: filteredProjects,
  };
});

export const getBlogPostBySlug = cache(async (slug: string) => {
  const filePath = path.join(CONTENT_DIR, "blog", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const { data, content } = readMDXFile(filePath);
  return {
    metadata: BlogMetadataSchema.parse(data), // Runtime validation
    content,
  };
});

export const getProjectBySlug = cache(async (slug: string) => {
  const filePath = path.join(CONTENT_DIR, "projects", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const { data, content } = readMDXFile(filePath);
  return {
    metadata: ProjectMetadataSchema.parse(data),
    content,
  };
});
