"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function IntroPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10">
      <Image
        src="/GOLPO-WHITE.svg"
        alt="golpo logo"
        width={600}
        height={300}
        className="transition-all duration-1000"
        style={{
          filter: visible ? "blur(0px)" : "blur(20px)",
          opacity: visible ? 1 : 0,
        }}
      />
      <div
        className="transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transitionDelay: "600ms",
        }}
      >
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
