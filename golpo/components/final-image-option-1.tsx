"use client";

import { useEffect, useState } from "react";

export type FinalImageData = {
  chosenQuestion: string;
  answerText: string;
  name: string;
  pics: [string | null, string | null, string | null];
};

type FinalImageOption1Props = {
  data: FinalImageData;
};

const CARD_WIDTH = 852;
const CARD_HEIGHT = 558;
const RENDER_SCALE = 3;
const BACKGROUND = "#d9d9d9";
const TEXT_COLOR = "#7d3131";
const PADDING = 38;
const BOTTOM_SAFE = 38;
const PHOTO_GAP = 14;
const PHOTO_WIDTH = 184;
const PHOTO_HEIGHT = Math.floor((CARD_HEIGHT - PADDING - BOTTOM_SAFE - PHOTO_GAP * 2) / 3);
const COLUMN_GAP = 40;
const COPY_X = PADDING + PHOTO_WIDTH + COLUMN_GAP;
const COPY_WIDTH = CARD_WIDTH - COPY_X - 40;
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
const LOGO_RIGHT = CARD_WIDTH - 33;
const LOGO_Y = CARD_HEIGHT - 33;

function wrapText(
  ctx: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number,
  withEllipsis = true,
) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return { lines: [""], truncated: false };
  }

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
    ctx.font = `700 ${questionFontSize}px "PP Mori", "Helvetica Neue", Arial, sans-serif`;
    const questionLayout = wrapText(ctx, question, maxWidth, QUESTION_MAX_LINES, false);

    if (questionLayout.truncated) {
      continue;
    }

    const answerTop = Math.max(
      ANSWER_MIN_TOP,
      QUESTION_TOP + questionLayout.lines.length * questionLineHeight + COPY_GAP,
    );
    const availableHeight = ANSWER_BOTTOM - answerTop;

    if (availableHeight < ANSWER_MIN_FONT_SIZE) {
      continue;
    }

    for (let answerFontSize = ANSWER_MAX_FONT_SIZE; answerFontSize >= ANSWER_MIN_FONT_SIZE; answerFontSize -= 1) {
      const answerLineHeight = Math.round(answerFontSize * 1.18);
      const maxLines = Math.max(1, Math.floor(availableHeight / answerLineHeight));

      ctx.font = `${answerFontSize}px "Instrument Serif", Georgia, serif`;
      const answerLayout = wrapText(ctx, answer, maxWidth, maxLines, false);

      if (!answerLayout.truncated) {
        return {
          questionFontSize,
          questionLineHeight,
          questionLines: questionLayout.lines,
          answerFontSize,
          answerLineHeight,
          answerLines: answerLayout.lines,
          answerTop,
        };
      }
    }
  }

  const questionFontSize = QUESTION_MIN_FONT_SIZE;
  const questionLineHeight = Math.round(questionFontSize * 1.08);
  ctx.font = `700 ${questionFontSize}px "PP Mori", "Helvetica Neue", Arial, sans-serif`;
  const fallbackQuestion = wrapText(ctx, question, maxWidth, QUESTION_MAX_LINES, true);
  const answerTop = Math.max(
    ANSWER_MIN_TOP,
    QUESTION_TOP + fallbackQuestion.lines.length * questionLineHeight + COPY_GAP,
  );
  const availableHeight = Math.max(ANSWER_MIN_FONT_SIZE, ANSWER_BOTTOM - answerTop);
  const answerFontSize = ANSWER_MIN_FONT_SIZE;
  const answerLineHeight = Math.round(answerFontSize * 1.18);
  const maxLines = Math.max(1, Math.floor(availableHeight / answerLineHeight));
  ctx.font = `${answerFontSize}px "Instrument Serif", Georgia, serif`;
  const fallbackAnswer = wrapText(ctx, answer, maxWidth, maxLines, true);

  return {
    questionFontSize,
    questionLineHeight,
    questionLines: fallbackQuestion.lines,
    answerFontSize,
    answerLineHeight,
    answerLines: fallbackAnswer.lines,
    answerTop,
  };
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
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageWidth = (image as HTMLImageElement).naturalWidth || (image as HTMLImageElement).width;
  const imageHeight = (image as HTMLImageElement).naturalHeight || (image as HTMLImageElement).height;

  if (!imageWidth || !imageHeight) {
    return;
  }

  const scale = Math.max(width / imageWidth, height / imageHeight);
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;
  const dx = x + (width - scaledWidth) / 2;
  const dy = y + (height - scaledHeight) / 2;

  ctx.drawImage(image, dx, dy, scaledWidth, scaledHeight);
}

export default function FinalImageOption1({ data }: FinalImageOption1Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function renderCard() {
      const canvas = document.createElement("canvas");
      canvas.width = CARD_WIDTH * RENDER_SCALE;
      canvas.height = CARD_HEIGHT * RENDER_SCALE;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          // Font loading failures should not block image generation.
        }
      }

      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      const photoImages = await Promise.all(
        data.pics.map((pic) => (pic ? loadImage(pic) : Promise.resolve(null))),
      );

      photoImages.forEach((image, index) => {
        const x = PADDING;
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

      ctx.fillStyle = TEXT_COLOR;
      ctx.textBaseline = "alphabetic";

      const copyLayout = fitCopyLayout(
        ctx,
        data.chosenQuestion || "No question selected yet.",
        data.answerText || "No answer saved yet.",
        COPY_WIDTH,
      );
      ctx.font = `700 ${copyLayout.questionFontSize}px "PP Mori", "Helvetica Neue", Arial, sans-serif`;
      let cursorY = QUESTION_TOP;
      for (const line of copyLayout.questionLines) {
        ctx.fillText(line, COPY_X, cursorY);
        cursorY += copyLayout.questionLineHeight;
      }

      ctx.font = `${copyLayout.answerFontSize}px "Instrument Serif", Georgia, serif`;
      cursorY = copyLayout.answerTop;
      for (const line of copyLayout.answerLines) {
        ctx.fillText(line, COPY_X, cursorY);
        cursorY += copyLayout.answerLineHeight;
      }

      ctx.font = '700 14px "PP Mori", "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(data.name || "Anonymous", COPY_X, NAME_Y);

      ctx.font = '15px "PP Mori", "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = "right";
      ctx.fillStyle = "#222222";
      ctx.fillText("GOLPO", LOGO_RIGHT, LOGO_Y);
      ctx.textAlign = "left";

      if (!active) {
        return;
      }

      setImageSrc(canvas.toDataURL("image/png"));
    }

    void renderCard();

    return () => {
      active = false;
    };
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
      <img src={imageSrc} alt="Final postcard" className="print-card-image" />
    </div>
  );
}
