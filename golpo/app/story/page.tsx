"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLastEntry, type ResponseEntry } from "@/lib/firebase/user-db";
import { PageShell } from "@/components/page-shell";

export default function StoryPage() {
  const [entry, setEntry] = useState<ResponseEntry | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    void getLastEntry().then((e) => {
      if (mounted) {
        setEntry(e);
        setLoaded(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  if (!loaded) {
    return <main className="relative w-screen h-screen overflow-hidden bg-black" />;
  }

  if (!entry) {
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
        <Link href="/name" className="text-white text-lg opacity-60 hover:opacity-100 transition-opacity">
          Begin →
        </Link>
      </main>
    );
  }

  return (
    <PageShell videoSrc="/cat.MOV" brightness={0.35}>
      {/* Content */}
      <div
        className="absolute inset-0 flex items-center"
        style={{ zIndex: 20, padding: "0 6vw" }}
      >
        {/* Left — label */}
        <div className="flex-1 pr-12">
          <p
            className="text-white leading-tight"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
          >
            this is{" "}
            <strong style={{ fontWeight: 700 }}>{entry.name}&apos;s</strong>{" "}
            story
          </p>
        </div>

        {/* Right — entry card */}
        <div
          className="flex-1"
          style={{
            background: "rgba(50,50,50,0.85)",
            borderRadius: "1.5rem",
            padding: "2.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {entry.storyCategory ? (
            <p
              className="text-white/40 text-xs uppercase tracking-widest"
              style={{ letterSpacing: "0.18em" }}
            >
              {entry.storyCategory}
            </p>
          ) : null}
          <p
            className="text-white/60 text-sm"
            style={{ fontStyle: "italic" }}
          >
            {entry.chosenQuestion}
          </p>
          <p
            className="text-white leading-relaxed"
            style={{ fontSize: "1.1rem" }}
          >
            {entry.answerText}
          </p>
        </div>
      </div>

      {/* Next arrow */}
      <div
        className="absolute"
        style={{ bottom: "2.5rem", right: "3rem", zIndex: 30 }}
      >
        <Link
          href="/name"
          className="glass-nav flex items-center justify-center w-12 h-12 rounded-full transition-all hover:scale-105"
        >
          <Image src="/arrow.svg" alt="Next" width={18} height={16} style={{ opacity: 0.7 }} />
        </Link>
      </div>
    </PageShell>
  );
}
