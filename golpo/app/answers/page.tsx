"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getAllResponses, ResponseEntry } from "@/lib/firebase/user-db";

const GOLPO_IMAGES = [
  "1592446274572_Original.jpg",
  "Photoroom_20260427_155621.PNG",
  "Photoroom_20260427_155638.PNG",
  "Photoroom_20260427_155648.PNG",
  "Photoroom_20260427_155655.PNG",
  "Photoroom_20260427_194306.PNG",
  "Photoroom_20260503_163631.PNG",
  "Photoroom_20260503_163712.PNG",
  "Photoroom_20260503_163720.PNG",
  "Photoroom_20260503_163727.PNG",
  "Photoroom_20260503_163733.PNG",
  "Photoroom_20260503_163740.PNG",
  "Photoroom_20260503_163749.PNG",
  "Photoroom_20260503_163755.PNG",
  "Photoroom_20260503_163803.PNG",
  "Photoroom_20260503_163811.PNG",
  "Photoroom_20260503_163819.PNG",
  "Photoroom_20260503_163826.PNG",
  "Photoroom_20260503_163833.PNG",
  "Photoroom_20260503_163840.PNG",
  "Photoroom_20260503_163847.PNG",
];

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// Stratified placement: 3 cols × 7 rows grid — one image per cell
// Runs client-side only to avoid SSR/client hydration mismatch
function buildImageLayout() {
  const COLS = 3;
  const ROWS = 7;
  return GOLPO_IMAGES.map((src, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cellW = 100 / COLS;
    const cellH = 100 / ROWS;
    // place image within its cell, leaving 10% margin on each side of the cell
    const left = col * cellW + seededRandom(i * 5) * cellW * 0.8;
    const top  = row * cellH + seededRandom(i * 5 + 1) * cellH * 0.8;
    return {
      src,
      layer: (i % 3) + 1,
      top,
      left,
      size: (120 + seededRandom(i * 5 + 2) * 140) * 1.7,
    };
  });
}

function useImageLayout() {
  const [layout, setLayout] = useState<ReturnType<typeof buildImageLayout>>([]);
  useEffect(() => { setLayout(buildImageLayout()); }, []);
  return layout;
}

// parallax speed per layer — layer 1 moves slowest (furthest back)
const PARALLAX_SPEED = [0.08, 0.18, 0.3];

const STORY_PROMPTS = [
  { category: "THE STORY OF CHANGE", label: "story of change" },
  { category: "THE STORY OF FRIENDSHIP", label: "story of friendship" },
  { category: "THE STORY OF A PLACE", label: "story of a place" },
  { category: "THE STORY OF AN OBJECT", label: "story of an object" },
  { category: "THE STORY OF LANGUAGE", label: "story of language" },
];

export default function AnswersPage() {
  const [entries, setEntries] = useState<ResponseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const imageLayout = useImageLayout();

  useEffect(() => {
    getAllResponses()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main
      className="w-screen min-h-screen flex flex-col"
      style={{ backgroundColor: "#6298DB", position: "relative" }}
    >
      {/* ── Parallax background images (fixed, shift at different rates on scroll) ── */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {imageLayout.map((img, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${img.top}%`,
              left: `${img.left}%`,
              zIndex: img.layer,
              opacity: 0.4,
              transform: `translateY(${scrollY * PARALLAX_SPEED[img.layer - 1]}px)`,
              willChange: "transform",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/golpo-images/${img.src}`}
              alt=""
              style={{ width: img.size, height: img.size, objectFit: "cover", display: "block" }}
            />
          </div>
        ))}
      </div>

      {/* ── Logo ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "6vh",
          paddingBottom: "3vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        <Image
          src="/bg/golpo-answers.svg"
          alt="Golpo Answers"
          width={450}
          height={200}
          style={{ width: "200px", height: "auto" }}
          priority
        />
      </div>

      {/* ── Buttons + Expanding Columns ── */}
      <div style={{ padding: "0 5vw", flex: 1, position: "relative", zIndex: 10 }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            minHeight: "60vh",
          }}
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "51px",
                  backgroundColor: "#F6F6F6",
                  opacity: 0.6,
                }}
              />
            ))
          ) : (
            STORY_PROMPTS.map((prompt) => {
              const isActive = activeCategory === prompt.category;
              const isSomeActive = activeCategory !== null;

              const filtered = entries.filter(
                (e) => e.storyCategory === prompt.category
              );

              return (
                <div
                  key={prompt.category}
                  style={{
                    flex: isActive
                      ? "2.5 1 0"
                      : isSomeActive
                      ? "0.8 1 0"
                      : "1 1 0",
                    display: "flex",
                    flexDirection: "column",
                    transition:
                      "flex 0.35s cubic-bezier(0.4,0,0.2,1)",
                    minWidth: isSomeActive ? "120px" : "0px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCategory(
                        isActive ? null : prompt.category
                      )
                    }
                    className="font-roboto-mono"
                    style={{
                      width: "100%",
                      height: "51px",
                      backgroundColor: isActive ? "rgba(243, 172, 209, 0.95)" : "#F6F6F6",
                      boxShadow: "0 5px 4px rgba(0,0,0,0.25)",
                      border: isActive ? "3px solid #db62a0" : "3px solid transparent",
                      cursor: "pointer",
                      fontSize: "clamp(0.75rem, 0.9vw, 1rem)",
                      fontWeight: 700,
                      color: "#000",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {prompt.label}
                  </button>

                  {/* Cards under active column */}
                  <div
                    style={{
                      overflow: "hidden",
                      maxHeight: isActive ? "none" : "0px",
                      transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                        marginTop: "16px",
                        paddingRight: "6px",
                        paddingBottom: "4vh",
                      }}
                    >
                      {filtered.length > 0 ? (
                        filtered.map((entry) => (
                          <StoryCard
                            key={entry.id}
                            entry={entry}
                          />
                        ))
                      ) : (
                        <p
                          className="font-roboto-mono"
                          style={{
                            fontSize: "0.7rem",
                            color: "#fff",
                          }}
                        >
                          No stories yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer
        className="font-gayatri"
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          padding: "3vh 0 4vh",
          fontSize: "1rem",
          color: "#fff",
          letterSpacing: "0.08em",
        }}
      >
        a project by sabria islam
      </footer>
    </main>
  );
}

function StoryCard({ entry }: { entry: ResponseEntry }) {
  return (
    <div
      style={{
        backgroundColor: "#F6F6F6",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <p
        className="font-roboto-mono"
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#555",
        }}
      >
        {entry.chosenQuestion}
      </p>

      <p
        className="font-roboto-mono"
        style={{
          fontSize: "0.8rem",
          color: "#111",
          lineHeight: 1.5,
        }}
      >
        {entry.answerText}
      </p>

      <p
        className="font-roboto-mono"
        style={{
          fontSize: "0.65rem",
          color: "#666",
        }}
      >
        — {entry.name}
      </p>
    </div>
  );
}