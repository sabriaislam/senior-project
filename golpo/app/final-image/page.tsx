"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FinalImageOption1, { type FinalImageData } from "@/components/final-image-option-1";
import { getUserDb } from "@/lib/firebase/user-db";

const DEFAULT_DATA: FinalImageData = {
  chosenQuestion: "No question selected yet.",
  answerText: "No answer saved yet.",
  name: "Anonymous",
  pics: [null, null, null, null],
};

export default function FinalImagePage() {
  const [data, setData] = useState<FinalImageData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);

  function printImage(dataUrl: string) {
    const style = document.createElement("style");
    style.textContent = `@media print {
      body > *:not(#_print_target) { display: none !important; }
      #_print_target { display: flex !important; position: fixed; inset: 0; align-items: center; justify-content: center; background: #fff; }
      #_print_target img { max-width: 100%; max-height: 100%; object-fit: contain; }
      @page { size: landscape; margin: 0; }
    }`;

    const div = document.createElement("div");
    div.id = "_print_target";
    div.style.display = "none";
    const img = document.createElement("img");
    img.src = dataUrl;
    div.appendChild(img);

    document.head.appendChild(style);
    document.body.appendChild(div);

    window.print();

    window.addEventListener("afterprint", () => {
      style.remove();
      div.remove();
    }, { once: true });
  }

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFinalImageData() {
      try {
        const doc = await getUserDb();
        if (!mounted) return;
        setData({
          chosenQuestion: doc?.chosenQuestion ?? DEFAULT_DATA.chosenQuestion,
          answerText: doc?.answerText ?? DEFAULT_DATA.answerText,
          name: doc?.name ?? DEFAULT_DATA.name,
          pics: [doc?.pic01 ?? null, doc?.pic02 ?? null, doc?.pic03 ?? null, doc?.pic04 ?? null],
        });
      } catch (err) {
        console.error("Failed to load final image data:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadFinalImageData();
    return () => { mounted = false; };
  }, []);

  async function handleSendEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendError(null);
    setSendSuccess(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setSendError("Please enter in the format: youremail@example.com");
      return;
    }

    if (!cardImageUrl) {
      setSendError("Image is still rendering, please wait a moment.");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: data.name, imageDataUrl: cardImageUrl }),
      });

      if (!response.ok) {
        let errorMsg = `Failed to send email (${response.status}).`;
        try {
          const body = (await response.json()) as { error?: string };
          errorMsg = body.error ?? errorMsg;
        } catch { /* response was not JSON */ }
        setSendError(errorMsg);
        return;
      }

      setSendSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("Send email failed:", err);
      setSendError("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] opacity-80">Step 6</p>
        <h1 className="font-average text-4xl leading-tight md:text-5xl">Final Image</h1>
      </div>

      <div className="space-y-4">
        <FinalImageOption1 data={data} onImageReady={setCardImageUrl} />
        <button
          type="button"
          onClick={() => { if (cardImageUrl) printImage(cardImageUrl); }}
          disabled={!cardImageUrl}
          className="inline-flex rounded-full border border-black/20 bg-black/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Print
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/photobooth"
          className="inline-flex rounded-full border border-black/20 bg-black/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/10"
        >
          Back
        </Link>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Email your postcard</p>
        <form onSubmit={(e) => void handleSendEmail(e)} className="flex items-center gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSendError(null);
              setSendSuccess(false);
            }}
            placeholder="youremail@example.com"
            className="w-full max-w-sm rounded-xl border border-black/20 bg-white/80 px-4 py-3 text-black outline-none ring-0 transition focus:border-black/50"
          />
          <button
            type="submit"
            disabled={isSending || !cardImageUrl}
            className="inline-flex rounded-full border border-black/20 bg-black/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </form>
        {sendError ? <p className="text-sm text-red-100">{sendError}</p> : null}
        {sendSuccess ? <p className="text-sm text-green-100">Postcard sent! Check your inbox.</p> : null}
      </div>

      {isLoading ? <p className="text-sm text-white/80">Loading final image...</p> : null}
    </main>
  );
}
