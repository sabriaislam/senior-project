export function PixelAccents({ children }: { children: string }) {
  return (
    <>
      {children.split(/(o|O|e|E)/g).map((part, i) =>
        /^[oeOE]$/.test(part) ? (
          <span key={i} className="font-pixel">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

/** @deprecated use PixelAccents */
export const PixelOs = PixelAccents;
