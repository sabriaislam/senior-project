"use client";

import { useEffect, useState } from "react";
import FinalImageOption1, { type FinalImageData } from "@/components/final-image-option-1";
import FinalImageOption2 from "@/components/final-image-option-2";
import { FilmGrain } from "@/components/film-grain";
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
    <main className="relative min-h-screen w-full overflow-hidden" style={{ background: "black" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/design2.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3)", zIndex: 1 }}
      />
      <FilmGrain />
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ zIndex: 20, padding: "0 20vw" }}
      >
        {/* Headings — mirrors /answer structure */}
        <div className="flex flex-col gap-1 mb-10">
          <span className="text-5xl"><span className="font-pixel">C</span><span className="font-gayatri" style={{ fontStyle: "italic" }}>hoose your layout</span></span>
          <p className="font-karla leading-tight text-lg" style={{ color: "#ede4e6" }}>
            Pick the format for your postcard
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {options.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className="group relative flex flex-col gap-2 transition overflow-hidden w-full"
              style={{
                backgroundColor: selected === id ? "rgba(98,152,219,0.85)" : "rgba(98,152,219,0.35)",
                border: selected === id ? "1px solid rgba(98,152,219,1)" : "1px solid rgba(98,152,219,0.4)",
                padding: "0.75rem 0.75rem 0.6rem",
              }}
            >
              <div className="w-full">
                {id === 1 && <FinalImageOption1 data={data} onImageReady={(url) => setCardImageUrls((p) => ({ ...p, 1: url }))} />}
                {id === 2 && <FinalImageOption2 data={data} onImageReady={(url) => setCardImageUrls((p) => ({ ...p, 2: url }))} />}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/buttons/choice-${id}.svg`} alt={label} className="h-10 mx-auto" />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => { if (cardImageUrl) printImage(cardImageUrl); }}
            disabled={!cardImageUrl}
            className="mr-auto disabled:opacity-40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/buttons/print-button.svg" alt="Print" className="h-10" />
          </button>
          <a href={`/share?layout=${selected}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/buttons/next-button.svg" alt="Next" className="h-10" />
          </a>
        </div>

        {isLoading ? <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>Loading...</p> : null}
      </div>
    </main>
  );
}
