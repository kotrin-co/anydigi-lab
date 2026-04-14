export default function Loading() {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      <div>
        <div className="h-7 w-32 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 space-y-2"
          >
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-7 w-8 bg-muted rounded" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-5 space-y-3"
        >
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
