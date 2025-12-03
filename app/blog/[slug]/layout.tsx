export default function BlogPostLayout({
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
            {/* placeholder for component */}
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold tracking-wider text-gray-900 uppercase">
                On This Page
              </h3>
              <p className="text-sm text-gray-500 italic">
                (Table of contents coming soon...)
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
