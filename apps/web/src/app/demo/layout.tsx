export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            AnyDigi Lab
          </span>
          <span className="text-xs text-muted-foreground">Demo</span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs text-muted-foreground">
          © AnyDigi LLC
        </div>
      </footer>
    </div>
  );
}
