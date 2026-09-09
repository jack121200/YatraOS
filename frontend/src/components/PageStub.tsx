// Placeholder shell for screens not yet wired to real logic — keeps routing
// and visual language consistent while backend endpoints land.
export function PageStub({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-bold text-polar">{title}</h1>
      <p className="text-slate">{description}</p>
    </div>
  );
}
