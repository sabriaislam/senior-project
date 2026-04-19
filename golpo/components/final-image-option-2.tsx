"use client";

import { useEffect, useState } from "react";
import { type FinalImageData } from "./final-image-option-1";

type Props = {
  data: FinalImageData;
  onImageReady?: (dataUrl: string) => void;
  isSelected?: boolean; // ← for print selection
};

const CARD_W = 916;
const CARD_H = 600;
const RENDER_SCALE = 2;

const BG = "#F0F0F0";

// Panel
const PANEL_X = 517.5;
const PANEL_Y = 100;
const PANEL_W = 330;
const PANEL_H = 407;

// Photos
const PHOTOS = [
  { x: 526.5, y: 133.5, w: 147, h: 147 },
  { x: 691.5, y: 133.5, w: 147, h: 147 },
  { x: 526.5, y: 299.5, w: 147, h: 147 },
  { x: 691.5, y: 299.5, w: 147, h: 147 },
];

// Text
const TEXT_LEFT = 59;
const TEXT_RIGHT_MARGIN = 32;
const TEXT_WIDTH = PANEL_X - TEXT_RIGHT_MARGIN - TEXT_LEFT;

const TITLE_SIZE = 36;
const BYLINE_SIZE = 14;
const BODY_SIZE = 13;
const BODY_LINE_H = 18;

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

export default function FinalImageOption2({
  data,
  onImageReady,
  isSelected,
}: Props) {
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

      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {}
      }

      // Background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      // Panel
      ctx.fillStyle = "#000";
      ctx.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);

      ctx.lineWidth = 20;
      ctx.strokeStyle = "#000";
      ctx.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);

      // Load images
      const [logo, ...imgs] = await Promise.all([
        loadImage("/GOLPO-WHITE.svg"),
        ...data.pics.map((p) => (p ? loadImage(p) : Promise.resolve(null))),
      ]);

      // Draw photos
      PHOTOS.forEach((pos, i) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(pos.x, pos.y, pos.w, pos.h);
        ctx.clip();

        if (imgs[i]) {
          drawCover(ctx, imgs[i]!, pos.x, pos.y, pos.w, pos.h);
        } else {
          ctx.fillStyle = "#646464";
          ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
        }

        ctx.restore();
      });

      // Logo
      if (logo) {
        const logoW = 50;
        // Calculate height based on natural aspect ratio to prevent stretching
        const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;

        // 1. Horizontal Center: 
        // Middle of the black panel minus half the logo width
        const logoX = PANEL_X + (PANEL_W - logoW) / 2;

        // 2. Vertical Alignment:
        // We want it centered in the gap between the bottom of the last photo and the bottom of the panel.
        const bottomPhotoY = PHOTOS[2].y; // Y of the bottom row
        const bottomPhotoH = PHOTOS[2].h;
        const bottomOfPhotos = bottomPhotoY + bottomPhotoH;
        const bottomOfPanel = PANEL_Y + PANEL_H;
        
        const availableGap = bottomOfPanel - bottomOfPhotos;
        
        // Center the logo inside that specific gap
        const logoY = bottomOfPhotos + (availableGap - logoH) / 2;

        ctx.drawImage(logo, logoX, logoY, logoW, logoH);
      }

      // TEXT
      // --- TEXT RENDERING SECTION ---
      // --- Standardized Text Section for Option 02 ---
      let cursorY = PANEL_Y; // Should be 100

      ctx.textBaseline = "top";
      ctx.font = `800 ${TITLE_SIZE}px Helvetica, Arial, sans-serif`;

      const titleLines = wrapText(ctx, data.storyCategory.toLowerCase(), TEXT_WIDTH, TITLE_SIZE, 3);
      titleLines.forEach((line) => {
        ctx.fillText(line, TEXT_LEFT, cursorY);
        cursorY += TITLE_SIZE + 4; 
      });

      // Title to Name Gap
      cursorY += 10; 

      // Byline
      ctx.font = `${BYLINE_SIZE}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = "#555";
      ctx.fillText(`by ${data.name || "Anonymous"}`, TEXT_LEFT, cursorY);

      // Name to Body Gap
      cursorY += BYLINE_SIZE + 24;
      // Body
      ctx.font = `${BODY_SIZE}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = "#333";

      // Recalculate max lines based on remaining space
      const remainingHeight = (PANEL_Y + PANEL_H) - cursorY;
      const maxLines = Math.floor(remainingHeight / BODY_LINE_H);

      const bodyLines = wrapText(
        ctx,
        data.answerText || "",
        TEXT_WIDTH,
        BODY_LINE_H,
        maxLines
      );

      bodyLines.forEach((line) => {
        ctx.fillText(line, TEXT_LEFT, cursorY);
        cursorY += BODY_LINE_H;
      });

      if (!active) return;

      const url = canvas.toDataURL("image/png");
      setImageSrc(url);
      onImageReady?.(url);
    }

    render();

    return () => {
      active = false;
    };
  }, [data, onImageReady]);

  if (!imageSrc) {
    return (
      <div className="print-card-wrap">
        <div className="print-card-placeholder" />
      </div>
    );
  }

  return (
    <div
      className={`print-card-wrap ${
        isSelected ? "print-selected" : ""
      }`}
    >
      <img
        src={imageSrc}
        alt="Postcard layout 2"
        className="print-card-image"
      />
    </div>
  );
}