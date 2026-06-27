export default function ProjectsPage() {
  return (
    <div className="p-8 h-full flex flex-col space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Manage your research gap analysis projects.</p>
      </div>
      <div className="flex-1 flex items-center justify-center border border-dashed rounded-lg border-border">
        <p className="text-muted-foreground">Project management will render here.</p>
      </div>
    </div>
  );
}
