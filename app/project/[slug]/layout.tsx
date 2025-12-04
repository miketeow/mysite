import OnThisPage from "@/components/on-this-page";

export default function ProjectPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Wrapper
    <div className="container mx-auto max-w-6xl px-4 pt-32 pb-20">
      {/* Grid, 1 col on Mobile, 12 col on Desktop */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Main Content */}
        <div className="order-2 lg:order-1 lg:col-span-9">{children}</div>
        {/* On this page */}
        <aside className="order-1 lg:order-2 lg:col-span-3">
          <div className="lg:sticky lg:top-32">
            <OnThisPage />
          </div>
        </aside>
      </div>
    </div>
  );
}
