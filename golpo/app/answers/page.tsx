"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getAllResponses, type ResponseEntry } from "@/lib/firebase/user-db";

export default function AnswersPage() {
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  useEffect(() => {
    getAllResponses()
      .then((data) => {
        setResponses(data);
        if (data.length > 0) setOpenQuestion(data[0]?.chosenQuestion ?? null);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const grouped = responses.reduce<Record<string, ResponseEntry[]>>((acc, r) => {
    (acc[r.chosenQuestion] ??= []).push(r);
    return acc;
  }, {});

  const questions = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      {/* Logo */}
      <div className="flex justify-center">
        <Image src="/GOLPO-BLACK.svg" alt="Golpo" width={120} height={50} style={{ objectFit: "contain" }} />
      </div>

      {isLoading && <p className="text-center text-sm opacity-60">Loading responses...</p>}
      {!isLoading && questions.length === 0 && (
        <p className="text-center text-sm opacity-60">No responses yet.</p>
      )}

      {/* Accordion list */}
      <div className="flex flex-col gap-2">
        {questions.map((question) => {
          const isOpen = openQuestion === question;
          const entries = grouped[question] ?? [];
          return (
            <div key={question} className="rounded-2xl overflow-hidden bg-black/10">
              {/* Question header / toggle */}
              <button
                type="button"
                onClick={() => setOpenQuestion(isOpen ? null : question)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-black/10"
              >
                <span className="font-average text-lg leading-snug">{question}</span>
                <span className="shrink-0 text-sm opacity-50">{entries.length} {entries.length === 1 ? "response" : "responses"}</span>
                <svg
                  className={`shrink-0 w-4 h-4 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Responses grid */}
              {isOpen && (
                <div className="grid grid-cols-3 gap-3 px-5 pb-5">
                  {entries.map((r) => (
                    <div key={r.id} className="rounded-xl bg-white/20 px-4 py-3 space-y-1">
                      <p className="text-xs font-semibold opacity-60 uppercase tracking-wide">{r.name}</p>
                      <p className="text-sm leading-relaxed">{r.answerText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
