import Link from "next/link";

export default function IntroPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-12">
      <p className="text-sm uppercase tracking-[0.18em] opacity-80">Installation Intake</p>
      <h1 className="font-instrument text-5xl leading-tight md:text-6xl">Welcome</h1>
      <p className="max-w-xl text-base opacity-90 md:text-lg">
        This flow collects basic info before the installation. Click next to start.
      </p>
      <div className="pt-4">
        <Link
          href="/name"
          className="inline-flex rounded-full border border-black/20 bg-black/10 px-6 py-3 text-sm font-semibold transition hover:bg-black/20"
        >
          Next
        </Link>
      </div>
    </main>
  );
}

