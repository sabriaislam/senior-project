"use client";

import { useEffect, useState } from "react";
import { type FinalImageData } from "./final-image-option-1";

type FinalImageOption2Props = {
  data: FinalImageData;
  onImageReady?: (dataUrl: string) => void;
};

const CARD_WIDTH = 852;
const CARD_HEIGHT = 558;
const RENDER_SCALE = 3;
const BACKGROUND = "#d9d9d9";
const QUESTION_COLOR = "#3d6b3d";
const ANSWER_COLOR = "#1a1a1a";
const PADDING = 38;
const BOTTOM_SAFE = 38;
const PHOTO_GAP = 14;
const PHOTO_WIDTH = 184;
const PHOTO_HEIGHT = Math.floor((CARD_HEIGHT - PADDING - BOTTOM_SAFE - PHOTO_GAP * 2) / 3);
const COLUMN_GAP = 40;
// Text LEFT, photos RIGHT
const COPY_X = PADDING;
const PHOTO_X = CARD_WIDTH - PADDING - PHOTO_WIDTH;
const COPY_WIDTH = PHOTO_X - COLUMN_GAP - COPY_X;
const QUESTION_TOP = 66;
const QUESTION_FONT_SIZE = 30;
const QUESTION_MIN_FONT_SIZE = 18;
const QUESTION_MAX_LINES = 3;
const COPY_GAP = 8;
const ANSWER_MIN_FONT_SIZE = 9;
const ANSWER_MAX_FONT_SIZE = 17;
const ANSWER_MIN_TOP = 104;
const ANSWER_BOTTOM = 470;
const NAME_Y = 515;
const LOGO_TARGET_HEIGHT = 30;
const LOGO_Y = CARD_HEIGHT - 28;

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
  for (let questionFontSize = QUESTION_FONT_SIZE; questionFontSize >= QUESTION_MIN_FONT_SIZE; questionFontSize -= 2) {
    const questionLineHeight = Math.round(questionFontSize * 1.08);
    ctx.font = `700 ${questionFontSize}px "Vollkorn", Georgia, serif`;
    const questionLayout = wrapText(ctx, question, maxWidth, QUESTION_MAX_LINES, false);

    if (questionLayout.truncated) continue;

    const answerTop = Math.max(
      ANSWER_MIN_TOP,
      QUESTION_TOP + questionLayout.lines.length * questionLineHeight + COPY_GAP,
    );
    const availableHeight = ANSWER_BOTTOM - answerTop;
    if (availableHeight < ANSWER_MIN_FONT_SIZE) continue;

    for (let answerFontSize = ANSWER_MAX_FONT_SIZE; answerFontSize >= ANSWER_MIN_FONT_SIZE; answerFontSize -= 1) {
      const answerLineHeight = Math.round(answerFontSize * 1.18);
      const maxLines = Math.max(1, Math.floor(availableHeight / answerLineHeight));
      ctx.font = `${answerFontSize}px "Average", Georgia, serif`;
      const answerLayout = wrapText(ctx, answer, maxWidth, maxLines, false);

      if (!answerLayout.truncated) {
        return { questionFontSize, questionLineHeight, questionLines: questionLayout.lines, answerFontSize, answerLineHeight, answerLines: answerLayout.lines, answerTop };
      }
    }
  }

  const questionFontSize = QUESTION_MIN_FONT_SIZE;
  const questionLineHeight = Math.round(questionFontSize * 1.08);
  ctx.font = `700 ${questionFontSize}px "Vollkorn", Georgia, serif`;
  const fallbackQuestion = wrapText(ctx, question, maxWidth, QUESTION_MAX_LINES, true);
  const answerTop = Math.max(ANSWER_MIN_TOP, QUESTION_TOP + fallbackQuestion.lines.length * questionLineHeight + COPY_GAP);
  const availableHeight = Math.max(ANSWER_MIN_FONT_SIZE, ANSWER_BOTTOM - answerTop);
  const answerFontSize = ANSWER_MIN_FONT_SIZE;
  const answerLineHeight = Math.round(answerFontSize * 1.18);
  const maxLines = Math.max(1, Math.floor(availableHeight / answerLineHeight));
  ctx.font = `${answerFontSize}px "Average", Georgia, serif`;
  const fallbackAnswer = wrapText(ctx, answer, maxWidth, maxLines, true);

  return { questionFontSize, questionLineHeight, questionLines: fallbackQuestion.lines, answerFontSize, answerLineHeight, answerLines: fallbackAnswer.lines, answerTop };
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
  const imageWidth = (image as HTMLImageElement).naturalWidth || (image as HTMLImageElement).width;
  const imageHeight = (image as HTMLImageElement).naturalHeight || (image as HTMLImageElement).height;
  if (!imageWidth || !imageHeight) return;
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;
  ctx.drawImage(image, x + (width - scaledWidth) / 2, y + (height - scaledHeight) / 2, scaledWidth, scaledHeight);
}

export default function FinalImageOption2({ data, onImageReady }: FinalImageOption2Props) {
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

      // Load photos + logo in parallel
      const [logoImage, ...photoImages] = await Promise.all([
        loadImage("/GOLPO-BLACK.png"),
        ...data.pics.map((pic) => (pic ? loadImage(pic) : Promise.resolve(null))),
      ]);

      // Draw photos (right column)
      photoImages.forEach((image, index) => {
        const x = PHOTO_X;
        const y = PADDING + index * (PHOTO_HEIGHT + PHOTO_GAP);
        if (!image) {
          ctx.fillStyle = "#b8b8b8";
          ctx.fillRect(x, y, PHOTO_WIDTH, PHOTO_HEIGHT);
          return;
        }
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, PHOTO_WIDTH, PHOTO_HEIGHT);
        ctx.clip();
        drawCoverImage(ctx, image, x, y, PHOTO_WIDTH, PHOTO_HEIGHT);
        ctx.restore();
      });

      const copyLayout = fitCopyLayout(
        ctx,
        data.chosenQuestion || "No question selected yet.",
        data.answerText || "No answer saved yet.",
        COPY_WIDTH,
      );

      // Question (green, Vollkorn bold)
      ctx.fillStyle = QUESTION_COLOR;
      ctx.textBaseline = "alphabetic";
      ctx.font = `700 ${copyLayout.questionFontSize}px "Vollkorn", Georgia, serif`;
      let cursorY = QUESTION_TOP;
      for (const line of copyLayout.questionLines) {
        ctx.fillText(line, COPY_X, cursorY);
        cursorY += copyLayout.questionLineHeight;
      }

      // Answer (dark, Average)
      ctx.fillStyle = ANSWER_COLOR;
      ctx.font = `${copyLayout.answerFontSize}px "Average", Georgia, serif`;
      cursorY = copyLayout.answerTop;
      for (const line of copyLayout.answerLines) {
        ctx.fillText(line, COPY_X, cursorY);
        cursorY += copyLayout.answerLineHeight;
      }

      // Logo image (bottom-left)
      if (logoImage) {
        const logoW = Math.round(LOGO_TARGET_HEIGHT * (logoImage.naturalWidth / logoImage.naturalHeight));
        ctx.drawImage(logoImage, COPY_X, LOGO_Y - LOGO_TARGET_HEIGHT, logoW, LOGO_TARGET_HEIGHT);
      }

      // Name (bottom-right of text column)
      ctx.fillStyle = ANSWER_COLOR;
      ctx.font = `700 14px "Vollkorn", Georgia, serif`;
      ctx.textAlign = "right";
      ctx.fillText(data.name || "Anonymous", COPY_X + COPY_WIDTH, NAME_Y);
      ctx.textAlign = "left";

      if (!active) return;
      const dataUrl = canvas.toDataURL("image/png");
      setImageSrc(dataUrl);
      onImageReady?.(dataUrl);
    }

    void renderCard();
    return () => { active = false; };
  }, [data]);

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
      <img src={imageSrc} alt="Final postcard option 2" className="print-card-image" />
    </div>
  );
}
