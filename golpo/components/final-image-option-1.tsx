export type FinalImageData = {
  chosenQuestion: string;
  answerText: string;
  name: string;
  pics: [string | null, string | null, string | null];
};

type FinalImageOption1Props = {
  data: FinalImageData;
};

export default function FinalImageOption1({ data }: FinalImageOption1Props) {
  return (
    <section className="w-full max-w-[852px] border border-black/15 bg-[#d9d9d9] p-8 sm:p-12">
      <div className="flex min-h-[520px] flex-col gap-8">
        <div className="grid gap-8 sm:grid-cols-[169px_1fr] sm:gap-18">
          <div className="grid gap-3">
            {data.pics.map((pic, index) => (
              <div key={`final-pic-${index}`} className="aspect-[169/159] bg-black">
                {pic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pic}
                    alt={`Final photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="space-y-6 pr-3 text-[#7d3131] sm:pr-8">
            <h2 className="font-instrument text-base leading-tight sm:text-xl">{data.chosenQuestion}</h2>
            <p className="whitespace-pre-wrap text-[11px] leading-relaxed sm:text-xs">{data.answerText}</p>
            <p className="text-[11px] font-bold uppercase leading-relaxed sm:text-xs">{data.name}</p>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between pt-6 text-black/75">
          <p />
          <p className="text-[11px] uppercase tracking-[0.16em] sm:text-xs">Golpo</p>
        </div>
      </div>
    </section>
  );
}
