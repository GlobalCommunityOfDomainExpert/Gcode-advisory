export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-start justify-center gap-4 px-4 sm:px-6 lg:px-8">
      <p className="text-small font-bold tracking-widest text-text-secondary uppercase">GCODE</p>
      <h1 className="text-display font-extrabold text-primary">Advisory platform</h1>
      <p className="text-body text-text-secondary">Next.js + Tailwind CSS v4 foundation is ready.</p>
      <button className="min-h-11 rounded-sm bg-primary px-6 text-body font-bold text-white hover:bg-primary-hover">
        Get started
      </button>
    </main>
  );
}
