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

      // Register fonts by name so canvas can resolve them
      const fontSpecs: [string, string, FontFaceDescriptors][] = [
        ["Pixelscript", 'url(/fonts/PFPixelscriptPro.ttf) format("truetype")', {}],
        ["Gayatri", "url(/fonts/gayatrial-italic.otf)", { style: "italic" }],
        ["Karla", "url(/fonts/Karla-Regular-S52ZIU5L.3ac28a6ac03a9f7f3d82.woff)", {}],
      ];
      await Promise.all(fontSpecs.map(async ([family, src, descriptors]) => {
        const already = [...document.fonts].find(
          (f) => f.family.replace(/['"]/g, "") === family && f.status === "loaded"
        );
        if (already) return;
        try {
          const face = new FontFace(family, src, descriptors);
          await face.load();
          document.fonts.add(face);
        } catch { /* non-blocking */ }
      }));

      // Background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      // Panel
      ctx.fillStyle = "#69B568";
      ctx.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);

      ctx.lineWidth = 20;
      ctx.strokeStyle = "#69B568";
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
      ctx.fillStyle = "#6298DB";

      const titleText = data.storyCategory.toLowerCase();
      ctx.font = `italic ${TITLE_SIZE}px Gayatri, Helvetica, Arial, sans-serif`;
      const titleLines = wrapText(ctx, titleText, TEXT_WIDTH, TITLE_SIZE, 3);

      titleLines.forEach((line, lineIndex) => {
        if (lineIndex === 0 && line.length > 0) {
          // First character in Pixelscript
          const firstChar = line[0].toUpperCase();
          const rest = line.slice(1);
          ctx.font = `${TITLE_SIZE}px Pixelscript, Helvetica, Arial, sans-serif`;
          ctx.fillText(firstChar, TEXT_LEFT, cursorY);
          const firstCharW = ctx.measureText(firstChar).width;
          ctx.font = `italic ${TITLE_SIZE}px Gayatri, Helvetica, Arial, sans-serif`;
          ctx.fillText(rest, TEXT_LEFT + firstCharW, cursorY);
        } else {
          ctx.font = `italic ${TITLE_SIZE}px Gayatri, Helvetica, Arial, sans-serif`;
          ctx.fillText(line, TEXT_LEFT, cursorY);
        }
        cursorY += TITLE_SIZE + 4;
      });

      // Title to Name Gap
      cursorY += 10;

      // Byline
      ctx.font = `bold ${BYLINE_SIZE}px Karla, Helvetica, Arial, sans-serif`;
      ctx.fillStyle = "#565656";
      ctx.fillText(`by ${data.name || "Anonymous"}`, TEXT_LEFT, cursorY);

      // Name to Body Gap
      cursorY += BYLINE_SIZE + 24;
      // Body
      ctx.font = `${BODY_SIZE}px Karla, Helvetica, Arial, sans-serif`;
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