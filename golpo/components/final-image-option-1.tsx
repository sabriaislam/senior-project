"use client";

import { useEffect, useState } from "react";

export type FinalImageData = {
  chosenQuestion: string;
  answerText: string;
  name: string;
  pics: [string | null, string | null, string | null, string | null];
};

type FinalImageOption1Props = {
  data: FinalImageData;
  onImageReady?: (dataUrl: string) => void;
};

const CARD_WIDTH = 852;
const CARD_HEIGHT = 558;
const RENDER_SCALE = 3;
const BACKGROUND = "#d9d9d9";
const QUESTION_COLOR = "#3d6b3d";
const ANSWER_COLOR = "#1a1a1a";
const FRAME_COLOR = "#c49a6c";
const FRAME_THICKNESS = 10;

// Left panel (2x2 square photos)
const PADDING = 36;
const PHOTO_GAP = 16;
const PHOTO_CELL = 200; // square
const GRID_W = PHOTO_CELL * 2 + PHOTO_GAP;
const GRID_H = PHOTO_CELL * 2 + PHOTO_GAP;
const PHOTO_ORIGIN_X = PADDING;
const PHOTO_ORIGIN_Y = Math.floor((CARD_HEIGHT - GRID_H) / 2);
const LEFT_PANEL_W = PADDING + GRID_W;

// Right panel (text)
const COLUMN_GAP = 28;
const COPY_X = LEFT_PANEL_W + COLUMN_GAP;
const COPY_WIDTH = CARD_WIDTH - COPY_X - PADDING;

// Text positions anchored to photo grid edges
// PHOTO_ORIGIN_Y = 71, grid bottom = PHOTO_ORIGIN_Y + GRID_H = 487
const CAP_HEIGHT_OFFSET = 19;   // approx cap-top offset for Vollkorn 700 26px
const QUESTION_TOP = PHOTO_ORIGIN_Y + CAP_HEIGHT_OFFSET;   // = 90 (cap top aligns with photo top)
const QUESTION_FONT_SIZE = 26;
const QUESTION_MIN_FONT_SIZE = 16;
const QUESTION_MAX_LINES = 3;
const COPY_GAP = 14;
const ANSWER_MIN_FONT_SIZE = 9;
const ANSWER_MAX_FONT_SIZE = 14;
const ANSWER_MIN_TOP = QUESTION_TOP + 50;                   // = 140
const ANSWER_BOTTOM = PHOTO_ORIGIN_Y + GRID_H - 35;        // = 452, clears name/logo
const LOGO_TARGET_HEIGHT = 28;
const LOGO_Y = PHOTO_ORIGIN_Y + GRID_H;                    // = 487, logo bottom = grid bottom
const NAME_Y = LOGO_Y;                                      // = 487, name baseline = grid bottom

function wrapText(
  ctx: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number,
  withEllipsis = true,
) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [""], truncated: false };

  const lines: string[] = [];
  let current = "";
  let truncated = false;

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
      current = "";
    }
    if (lines.length === maxLines) {
      truncated = true;
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  } else if (current) {
    truncated = true;
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
    truncated = true;
  }

  if (withEllipsis && truncated && lines.length) {
    let lastLine = lines[maxLines - 1] ?? "";
    while (lastLine && ctx.measureText(`${lastLine}...`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }
    lines[maxLines - 1] = lastLine ? `${lastLine}...` : "...";
  }

  return { lines, truncated };
}

function fitCopyLayout(
  ctx: CanvasRenderingContext2D,
  question: string,
  answer: string,
  maxWidth: number,
) {
  for (let qSize = QUESTION_FONT_SIZE; qSize >= QUESTION_MIN_FONT_SIZE; qSize -= 2) {
    const qLineH = Math.round(qSize * 1.1);
    ctx.font = `700 ${qSize}px "Vollkorn", Georgia, serif`;
    const qLayout = wrapText(ctx, question, maxWidth, QUESTION_MAX_LINES, false);
    if (qLayout.truncated) continue;

    const answerTop = Math.max(
      ANSWER_MIN_TOP,
      QUESTION_TOP + qLayout.lines.length * qLineH + COPY_GAP,
    );
    const availH = ANSWER_BOTTOM - answerTop;
    if (availH < ANSWER_MIN_FONT_SIZE) continue;

    for (let aSize = ANSWER_MAX_FONT_SIZE; aSize >= ANSWER_MIN_FONT_SIZE; aSize -= 1) {
      const aLineH = Math.round(aSize * 1.2);
      const maxLines = Math.max(1, Math.floor(availH / aLineH));
      ctx.font = `${aSize}px "Average", Georgia, serif`;
      const aLayout = wrapText(ctx, answer, maxWidth, maxLines, false);
      if (!aLayout.truncated) {
        return { qSize, qLineH, qLines: qLayout.lines, aSize, aLineH, aLines: aLayout.lines, answerTop };
      }
    }
  }

  const qSize = QUESTION_MIN_FONT_SIZE;
  const qLineH = Math.round(qSize * 1.1);
  ctx.font = `700 ${qSize}px "Vollkorn", Georgia, serif`;
  const fbQ = wrapText(ctx, question, maxWidth, QUESTION_MAX_LINES, true);
  const answerTop = Math.max(ANSWER_MIN_TOP, QUESTION_TOP + fbQ.lines.length * qLineH + COPY_GAP);
  const availH = Math.max(ANSWER_MIN_FONT_SIZE, ANSWER_BOTTOM - answerTop);
  const aSize = ANSWER_MIN_FONT_SIZE;
  const aLineH = Math.round(aSize * 1.2);
  const maxLines = Math.max(1, Math.floor(availH / aLineH));
  ctx.font = `${aSize}px "Average", Georgia, serif`;
  const fbA = wrapText(ctx, answer, maxWidth, maxLines, true);

  return { qSize, qLineH, qLines: fbQ.lines, aSize, aLineH, aLines: fbA.lines, answerTop };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number, y: number, width: number, height: number,
) {
  const iw = (image as HTMLImageElement).naturalWidth || (image as HTMLImageElement).width;
  const ih = (image as HTMLImageElement).naturalHeight || (image as HTMLImageElement).height;
  if (!iw || !ih) return;
  const scale = Math.max(width / iw, height / ih);
  ctx.drawImage(image, x + (width - iw * scale) / 2, y + (height - ih * scale) / 2, iw * scale, ih * scale);
}

export default function FinalImageOption1({ data, onImageReady }: FinalImageOption1Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function renderCard() {
      const canvas = document.createElement("canvas");
      canvas.width = CARD_WIDTH * RENDER_SCALE;
      canvas.height = CARD_HEIGHT * RENDER_SCALE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (document.fonts) {
        try { await document.fonts.ready; } catch { /* non-blocking */ }
      }

      // Background
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      // Load all assets
      const [logoImage, ...photoImages] = await Promise.all([
        loadImage("/GOLPO-BLACK.svg"),
        ...data.pics.map((pic) => (pic ? loadImage(pic) : Promise.resolve(null))),
      ]);

      // Draw 2x2 grid of photos
      const grid = [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 0, row: 1 },
        { col: 1, row: 1 },
      ];

      grid.forEach(({ col, row }, index) => {
        const cellX = PHOTO_ORIGIN_X + col * (PHOTO_CELL + PHOTO_GAP);
        const cellY = PHOTO_ORIGIN_Y + row * (PHOTO_CELL + PHOTO_GAP);

        // Draw frame (tan border)
        ctx.fillStyle = FRAME_COLOR;
        ctx.fillRect(cellX, cellY, PHOTO_CELL, PHOTO_CELL);

        // Inner photo area
        const innerX = cellX + FRAME_THICKNESS;
        const innerY = cellY + FRAME_THICKNESS;
        const innerW = PHOTO_CELL - FRAME_THICKNESS * 2;
        const innerH = PHOTO_CELL - FRAME_THICKNESS * 2;

        const image = photoImages[index];
        if (!image) {
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(innerX, innerY, innerW, innerH);
          return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, innerY, innerW, innerH);
        ctx.clip();
        drawCoverImage(ctx, image, innerX, innerY, innerW, innerH);
        ctx.restore();
      });

      // Fit question + answer text
      const layout = fitCopyLayout(
        ctx,
        data.chosenQuestion || "No question selected yet.",
        data.answerText || "No answer saved yet.",
        COPY_WIDTH,
      );

      // Question (green, Vollkorn bold)
      ctx.fillStyle = QUESTION_COLOR;
      ctx.textBaseline = "alphabetic";
      ctx.font = `700 ${layout.qSize}px "Vollkorn", Georgia, serif`;
      let cursorY = QUESTION_TOP;
      for (const line of layout.qLines) {
        ctx.fillText(line, COPY_X, cursorY);
        cursorY += layout.qLineH;
      }

      // Answer body (dark, Average)
      ctx.fillStyle = ANSWER_COLOR;
      ctx.font = `${layout.aSize}px "Average", Georgia, serif`;
      cursorY = layout.answerTop;
      for (const line of layout.aLines) {
        ctx.fillText(line, COPY_X, cursorY);
        cursorY += layout.aLineH;
      }

      // Name (bottom-left of text column)
      ctx.fillStyle = ANSWER_COLOR;
      ctx.font = `700 13px "Vollkorn", Georgia, serif`;
      ctx.textAlign = "left";
      ctx.fillText(data.name || "Anonymous", COPY_X, NAME_Y);

      // Logo (bottom-right)
      if (logoImage) {
        const logoW = Math.round(LOGO_TARGET_HEIGHT * (logoImage.naturalWidth / logoImage.naturalHeight));
        const logoX = CARD_WIDTH - PADDING - logoW;
        ctx.drawImage(logoImage, logoX, LOGO_Y - LOGO_TARGET_HEIGHT, logoW, LOGO_TARGET_HEIGHT);
      }

      if (!active) return;
      const dataUrl = canvas.toDataURL("image/png");
      setImageSrc(dataUrl);
      onImageReady?.(dataUrl);
    }

    void renderCard();
    return () => { active = false; };
  }, [data, onImageReady]);

  if (!imageSrc) {
    return (
      <div className="print-card-wrap">
        <div className="print-card-placeholder" />
      </div>
    );
  }

  return (
    <div className="print-card-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="Final postcard" className="print-card-image" />
    </div>
  );
}
