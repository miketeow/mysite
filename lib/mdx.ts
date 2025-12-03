import fs from "fs";
import matter from "gray-matter";
import path from "path";

export interface BaseMetadata {
  title: string;
  publishedAt: string;
  updatedAt?: string;
  description: string;
  tags: string[];
}

export interface BlogMetadata extends BaseMetadata {
  author: string;
}

export interface ProjectMetadata extends BaseMetadata {
  repositoryUrl: string;
  techStack: string[];
}

const CONTENT_DIR = path.join(process.cwd(), "content");

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return matter(rawContent);
}

export function getBlogPosts() {
  const blogDir = path.join(CONTENT_DIR, "blog");

  const files = getMDXFiles(blogDir);

  return files
    .map((file) => {
      const { data, content } = readMDXFile(path.join(blogDir, file));
      const slug = path.basename(file, ".mdx");

      return {
        slug,
        metadata: data as BlogMetadata,
        content,
      };
    })
    .sort((a, b) => {
      return (
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime()
      );
    });
}

export function getProjects() {
  const projectDir = path.join(CONTENT_DIR, "projects");
  const files = getMDXFiles(projectDir);

  return files
    .map((file) => {
      const { data, content } = readMDXFile(path.join(projectDir, file));
      const slug = path.basename(file, ".mdx");

      return {
        slug,
        metadata: data as ProjectMetadata,
        content,
      };
    })
    .sort((a, b) => {
      return (
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime()
      );
    });
}

export function getAllTags() {
  const blogPosts = getBlogPosts();
  const projects = getProjects();
  const tags = new Set<string>();

  [...blogPosts, ...projects].forEach((post) => {
    post.metadata.tags.forEach((tag) => {
      tags.add(tag);
    });
  });

  return Array.from(tags);
}

export function getPostsByTag(tag: string) {
  const blogPosts = getBlogPosts();
  const projects = getProjects();

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
}
