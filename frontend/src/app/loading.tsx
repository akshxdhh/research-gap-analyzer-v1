export default function Loading() {
  return (
    <div className="h-full w-full flex items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading interface...</p>
      </div>
    </div>
  );
}
