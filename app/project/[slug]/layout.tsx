export default function ProjectPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Wrapper
    <main className="min-h-screen pt-32 pb-20">{children}</main>
  );
}
