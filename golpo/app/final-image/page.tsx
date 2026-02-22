"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FinalImageOption1, { type FinalImageData } from "@/components/final-image-option-1";
import { getUserDb } from "@/lib/firebase/user-db";

const DEFAULT_DATA: FinalImageData = {
  chosenQuestion: "No question selected yet.",
  answerText: "No answer saved yet.",
  name: "Anonymous",
  pics: [null, null, null],
};

export default function FinalImagePage() {
  const [data, setData] = useState<FinalImageData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFinalImageData() {
      try {
        const doc = await getUserDb();
        if (!mounted) {
          return;
        }

        setData({
          chosenQuestion: doc?.chosenQuestion ?? DEFAULT_DATA.chosenQuestion,
          answerText: doc?.answerText ?? DEFAULT_DATA.answerText,
          name: doc?.name ?? DEFAULT_DATA.name,
          pics: [doc?.pic01 ?? null, doc?.pic02 ?? null, doc?.pic03 ?? null],
        });
      } catch (err) {
        console.error("Failed to load final image data:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFinalImageData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] opacity-80">Step 6</p>
        <h1 className="font-instrument text-4xl leading-tight md:text-5xl">Final Image</h1>
      </div>

      <FinalImageOption1 data={data} />

      <div className="flex items-center gap-3">
        <Link
          href="/photobooth"
          className="inline-flex rounded-full border border-black/20 bg-black/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/10"
        >
          Back
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-white/80">Loading final image...</p> : null}
    </main>
  );
}
