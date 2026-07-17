import { PostLayout } from "@/components/post-layout";

export default function ProjectPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PostLayout>{children}</PostLayout>;
}
