"use client";

import { useEffect, useState } from "react";

export type FinalImageData = {
  storyCategory: string;
  chosenQuestion: string;
  answerText: string;
  name: string;
  pics: [string | null, string | null, string | null, string | null];
};

type Props = {
  data: FinalImageData;
  onImageReady?: (dataUrl: string) => void;
};

const CARD_W = 916;
const CARD_H = 600;
const RENDER_SCALE = 2;
const BG = "#F0F0F0";
const TEXT_COLOR = "#1a1a1a";
const SUBTEXT_COLOR = "#5B5B5B";

// Top strip dimensions (matches SVG)
const STRIP_Y = 100;
const STRIP_H = 166;
const STRIP_X = 70;
const STRIP_W = 778;

// Photos inside the strip
const PHOTO_COUNT = 4;
const PHOTO_INNER_PAD = 10; // gap between strip edge and photos, and between photos
const PHOTO_INNER_TOP = STRIP_Y + PHOTO_INNER_PAD;
const PHOTO_H = STRIP_H - PHOTO_INNER_PAD * 2;
// Each photo width: reserve right portion for logo text (~120px)
const LOGO_RESERVE = 130;
const PHOTOS_TOTAL_W = STRIP_W - LOGO_RESERVE - PHOTO_INNER_PAD;
const PHOTO_GAP = PHOTO_INNER_PAD;
const PHOTO_W = Math.floor(
  (PHOTOS_TOTAL_W - PHOTO_GAP * (PHOTO_COUNT - 1) - PHOTO_INNER_PAD) / PHOTO_COUNT
);

// Content area below strip
const CONTENT_X = STRIP_X;
const CONTENT_Y = STRIP_Y + STRIP_H + 28;
const CONTENT_W = STRIP_W;

const HEADING_SIZE = 28;
const SUBHEADING_SIZE = 13;
const BODY_SIZE = 11;
const BODY_LINE_H = 16;
const LOGO_H = 40;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length >= maxLines) {
        line = "";
        break;
      }
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  ctx.drawImage(
    img,
    x + (w - iw * scale) / 2,
    y + (h - ih * scale) / 2,
    iw * scale,
    ih * scale
  );
}

export default function FinalImageOption1({ data, onImageReady }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function render() {
      const canvas = document.createElement("canvas");
      canvas.width = CARD_W * RENDER_SCALE;
      canvas.height = CARD_H * RENDER_SCALE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          /* non-blocking */
        }
      }

      // ── Background ──────────────────────────────────────────────
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      // ── Top black strip ─────────────────────────────────────────
      ctx.fillStyle = "#111";
      ctx.fillRect(STRIP_X, STRIP_Y, STRIP_W, STRIP_H);

      // ── Load images ─────────────────────────────────────────────
      const [logoImg, ...photoImgs] = await Promise.all([
        loadImage("/GOLPO-WHITE.svg"),
        ...data.pics.map((p) => (p ? loadImage(p) : Promise.resolve(null))),
      ]);

      // ── Draw 4 photos horizontally inside the strip ──────────────
      for (let i = 0; i < PHOTO_COUNT; i++) {
        const x = STRIP_X + PHOTO_INNER_PAD + i * (PHOTO_W + PHOTO_GAP);
        const y = PHOTO_INNER_TOP;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, PHOTO_W, PHOTO_H);
        ctx.clip();

        if (photoImgs[i]) {
          drawCover(ctx, photoImgs[i]!, x, y, PHOTO_W, PHOTO_H);
        } else {
          ctx.fillStyle = "#555";
          ctx.fillRect(x, y, PHOTO_W, PHOTO_H);
        }
        ctx.restore();
      }

      // ── Logo (white) centered in gap between last photo and strip right edge ──
      if (logoImg) {
        const logoW = Math.round(
          LOGO_H * (logoImg.naturalWidth / logoImg.naturalHeight)
        );
        const lastPhotoRight = STRIP_X + PHOTO_INNER_PAD + PHOTO_COUNT * (PHOTO_W + PHOTO_GAP) - PHOTO_GAP;
        const gapLeft = lastPhotoRight + PHOTO_GAP;
        const gapRight = STRIP_X + STRIP_W;
        const logoX = Math.round(gapLeft + (gapRight - gapLeft - logoW) / 2);
        const logoY = STRIP_Y + Math.floor((STRIP_H - LOGO_H) / 2);
        ctx.drawImage(logoImg, logoX, logoY, logoW, LOGO_H);
      }

      // ── Content area ─────────────────────────────────────────────
  let cursorY = CONTENT_Y; // Ensure CONTENT_Y is now 100 for cohesion

  ctx.textBaseline = "top"; // Change from "alphabetic" to match Option 02
  ctx.textAlign = "left";

  // 1. Heading (Title)
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `700 ${HEADING_SIZE}px Helvetica, Arial, sans-serif`;

  const headingLines = wrapText(ctx, (data.storyCategory || "").toLowerCase(), CONTENT_W * 0.6, 2);
  headingLines.forEach((line) => {
    ctx.fillText(line, CONTENT_X, cursorY);
    cursorY += HEADING_SIZE + 4; // Title line height + small gap
  });

  // 2. "by name" (Standardize gap: 10px)
  cursorY += 10; 
  ctx.font = `${SUBHEADING_SIZE}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = "#888";
  ctx.fillText(`by ${data.name || "Anonymous"}`, CONTENT_X, cursorY);

  // 3. Body text (Standardize gap: 24px)
  cursorY += SUBHEADING_SIZE + 24; 
  ctx.font = `${BODY_SIZE}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = SUBTEXT_COLOR;

  const remainingH = CARD_H - 40 - cursorY;
  const maxBodyLines = Math.floor(remainingH / BODY_LINE_H);
  const bodyLines = wrapText(ctx, data.answerText || "", CONTENT_W, maxBodyLines);

  bodyLines.forEach((line) => {
    ctx.fillText(line, CONTENT_X, cursorY);
    cursorY += BODY_LINE_H;
  });
      if (!active) return;
      const dataUrl = canvas.toDataURL("image/png");
      setImageSrc(dataUrl);
      onImageReady?.(dataUrl);
    }

    void render();
    return () => {
      active = false;
    };
  }, [data, onImageReady]);

  if (!imageSrc)
    return (
      <div className="print-card-wrap">
        <div className="print-card-placeholder" />
      </div>
    );

  return (
    <div className="print-card-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="Postcard layout 1" className="print-card-image" />
    </div>
  );
}