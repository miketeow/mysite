import { PostLayout } from "@/components/post-layout";

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PostLayout>{children}</PostLayout>;
}
