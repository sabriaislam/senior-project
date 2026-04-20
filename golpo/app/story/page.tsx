"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLastEntry, type ResponseEntry } from "@/lib/firebase/user-db";
import { PageShell } from "@/components/page-shell";

export default function StoryPage() {
  const [entry, setEntry] = useState<ResponseEntry | null>(null);
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    let mounted = true;
    void getLastEntry().then((e) => {
      if (!mounted) return;
      setEntry(e);
      setTimeout(() => { if (mounted) setShowNav(true); }, 1000);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <PageShell videoSrc="/cat.MOV" brightness={0.35}>
      {/* Content */}
      <div
        className="absolute inset-0 flex items-center"
        style={{ zIndex: 20, padding: "0 6vw", opacity: entry ? 1 : 0, transition: "opacity 0.4s ease" }}
      >
        {/* Left — label */}
        <div className="flex-1 pr-12">
          <p
            className="text-white leading-tight"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
          >
            this is{" "}
            <strong style={{ fontWeight: 700 }}>{entry?.name}&apos;s</strong>{" "}
            story
          </p>
        </div>

        {/* Right — entry card */}
        <div
          className="flex-1"
          style={{
            backgroundColor: "rgba(90,90,90,0.75)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "1.25rem",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {entry?.storyCategory ? (
            <p
              className="font-average text-3xl leading-tight"
              style={{ color: "#ede4e6" }}
            >
              {entry.storyCategory.toLowerCase()}
            </p>
          ) : null}
          <p
            className="font-light leading-tight"
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "#ede4e6" }}
          >
            {entry?.chosenQuestion}
          </p>
          <p
            className="leading-relaxed"
            style={{ fontSize: "1rem", color: "#ede4e6" }}
          >
            {entry?.answerText}
          </p>
        </div>
      </div>

      {/* Next arrow */}
      <div
        className="absolute transition-opacity duration-1000"
        style={{ bottom: "2.5rem", right: "6vw", zIndex: 30, opacity: showNav ? 1 : 0, pointerEvents: showNav ? "auto" : "none" }}
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
