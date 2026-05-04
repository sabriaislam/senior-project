"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getAllResponses, type ResponseEntry } from "@/lib/firebase/user-db";

const STORY_PROMPTS = [
  {
    category: "THE STORY OF CHANGE",
    question: "When did you first feel like the person you always suspected you could be?",
  },
  {
    category: "THE STORY OF FRIENDSHIP",
    question: "Tell me about a friend who makes you feel like home",
  },
  {
    category: "THE STORY OF A PLACE",
    question:
      "Tell me about a place you carry with you, one you could close your eyes and still be inside.",
  },
  {
    category: "THE STORY OF AN OBJECT",
    question: "What's an object that carries a story only you understand?",
  },
  {
    category: "THE STORY OF LANGUAGE",
    question:
      "Tell me a phrase from your native language that doesn't quite translate in English. who taught it to you and when did you learn it?",
  },
];

export default function AnswersPage() {
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    getAllResponses()
      .then(setResponses)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const displayIdx = hoveredIdx ?? activeIdx;

  return (
    <main
      style={{
        backgroundColor: "#6298DB",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "2rem",
          paddingBottom: "1.5rem",
        }}
      >
        <Image
          src="/GOLPO-WHITE.svg"
          alt="GOLPO"
          width={200}
          height={340}
          priority
          style={{ filter: "drop-shadow(0px 6px 40px rgba(0,0,0,0.8))" }}
        />
      </div>

      {/* Nav + cards: one flex row where each column owns its button + cards below */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          padding: "0 2rem 2rem",
          flex: 1,
          alignItems: "flex-start",
        }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {STORY_PROMPTS.map((prompt, idx) => {
          const isExpanded = idx === displayIdx;
          const columnResponses = responses.filter(
            (r) => r.chosenQuestion === prompt.question
          );

          return (
            <div
              key={prompt.category}
              style={{
                flex: isExpanded ? "4 1 0" : "1 1 0",
                transition: "flex 0.35s cubic-bezier(0.34,1.2,0.64,1)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                minWidth: 0,
              }}
            >
              {/* Tab button */}
              <button
                type="button"
                onClick={() => setActiveIdx(idx)}
                onMouseEnter={() => setHoveredIdx(idx)}
                style={{
                  height: "51px",
                  width: "100%",
                  borderRadius: "18px",
                  background: "#F6F6F6",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 1rem",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-roboto-mono), monospace",
                  fontSize: "clamp(0.5rem, 0.8vw, 0.78rem)",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  letterSpacing: "0.02em",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    opacity: isExpanded ? 1 : 0.45,
                    transition: "opacity 0.25s ease",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    pointerEvents: "none",
                  }}
                >
                  {prompt.category.toLowerCase()}
                </span>
              </button>

              {/* Cards — only rendered for the expanded column */}
              {isExpanded && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    overflow: "hidden",
                  }}
                >
                  {isLoading ? (
                    <p
                      style={{
                        color: "white",
                        opacity: 0.6,
                        fontSize: "0.875rem",
                        textAlign: "center",
                        marginTop: "1rem",
                      }}
                    >
                      Loading responses…
                    </p>
                  ) : columnResponses.length === 0 ? (
                    <p
                      style={{
                        color: "white",
                        opacity: 0.6,
                        fontSize: "0.875rem",
                        textAlign: "center",
                        marginTop: "1rem",
                      }}
                    >
                      No responses yet for this story.
                    </p>
                  ) : (
                    columnResponses.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: "rgba(217,217,217,0.22)",
                          borderRadius: "20px",
                          padding: "1.5rem 1.75rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.85rem",
                        }}
                      >
                        <h3
                          className="font-average"
                          style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "white",
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          {prompt.question}
                        </h3>

                        <p
                          style={{
                            fontSize: "0.9rem",
                            color: "white",
                            opacity: 0.88,
                            margin: 0,
                            lineHeight: 1.65,
                          }}
                        >
                          {r.answerText}
                        </p>

                        <p
                          style={{
                            fontSize: "0.78rem",
                            color: "white",
                            opacity: 0.65,
                            fontStyle: "italic",
                            margin: 0,
                            textAlign: "right",
                          }}
                        >
                          — {r.name}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
