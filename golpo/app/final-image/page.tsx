"use client";

import { useEffect, useState } from "react";
import FinalImageOption1, { type FinalImageData } from "@/components/final-image-option-1";
import FinalImageOption2 from "@/components/final-image-option-2";
import { GlassButton } from "@/components/glass-button";
import { getUserDb } from "@/lib/firebase/user-db";

const DEFAULT_DATA: FinalImageData = {
  storyCategory: "",
  chosenQuestion: "No question selected yet.",
  answerText: "No answer saved yet.",
  name: "Anonymous",
  pics: [null, null, null, null],
};

export default function FinalImagePage() {
  const [data, setData] = useState<FinalImageData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<1 | 2 | 3>(1);
  const [cardImageUrls, setCardImageUrls] = useState<Record<1 | 2 | 3, string | null>>({ 1: null, 2: null, 3: null });

  const cardImageUrl = cardImageUrls[selected];

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
    window.addEventListener("afterprint", () => { style.remove(); div.remove(); }, { once: true });
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const doc = await getUserDb();
        if (!mounted) return;
        setData({
          storyCategory: doc?.storyCategory ?? "",
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
    void load();
    return () => { mounted = false; };
  }, []);


  const options: { id: 1 | 2 ; label: string }[] = [
    { id: 1, label: "Layout 1" },
    { id: 2, label: "Layout 2" },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-3 px-6 py-10">
      <h1 className="text-3xl font-semibold text-white pb-5">choose your layout</h1>

      <div className="grid grid-cols-2 gap-6 pb-4">
        {options.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelected(id)}
            className="group relative flex flex-col items-center gap-3 rounded-2xl p-6 transition"
            style={{
              outline: selected === id ? "3px solid white" : "3px solid transparent",
              background: selected === id ? "rgba(255,255,255,0.08)" : "transparent",
            }}
          >
            {id === 1 && <FinalImageOption1 data={data} onImageReady={(url) => setCardImageUrls((p) => ({ ...p, 1: url }))} />}
            {id === 2 && <FinalImageOption2 data={data} onImageReady={(url) => setCardImageUrls((p) => ({ ...p, 2: url }))} />}
            <span className="text-sm font-semibold" style={{ color: selected === id ? "white" : "rgba(255,255,255,0.45)" }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <GlassButton
          onClick={() => { if (cardImageUrl) printImage(cardImageUrl); }}
          disabled={!cardImageUrl}
        >
          Print
        </GlassButton>
        <GlassButton href={`/share?layout=${selected}`} style={{ marginLeft: "auto" }}>
          Next
        </GlassButton>
      </div>

      {isLoading ? <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Loading...</p> : null}
    </main>
  );
}
