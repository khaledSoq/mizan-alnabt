import { cn } from "@/lib/utils";
import type { HemistichResult, LetterOut } from "@/lib/arud";

type Props = {
  result: HemistichResult;
  label: string;
  onFlip: (letterIndex: number, nextBit: number) => void;
};

function groupLetters(letters: LetterOut[]) {
  const words: LetterOut[][] = [];
  let cur: LetterOut[] = [];
  let wi = letters[0]?.wordI ?? 0;
  for (const L of letters) {
    if (L.wordI !== wi) {
      if (cur.length) words.push(cur);
      cur = [L];
      wi = L.wordI;
    } else cur.push(L);
  }
  if (cur.length) words.push(cur);
  return words;
}

export function HemistichView({ result, label, onFlip }: Props) {
  const words = groupLetters(result.letters);
  const accepted = result.accepted;
  const status = !result.ok
    ? "empty"
    : accepted
      ? "ok"
      : "break";

  return (
    <article className="rounded-xl bg-paper text-ink shadow-paper ring-1 ring-paper-edge">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-edge px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tracking-wide text-ink-soft/70">{label}</span>
          {result.meterName ? (
            <span className="font-display text-lg font-bold text-ink">{result.meterName}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {result.ok ? (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                status === "ok" && "bg-ok text-ok-fg",
                status === "break" && "bg-break text-break-fg",
              )}
            >
              {result.message}
              {Number.isFinite(result.score) ? ` · ${Math.round(result.score * 100)}٪` : ""}
            </span>
          ) : (
            <span className="rounded-full bg-ink/8 px-3 py-1 text-xs text-ink-soft">{result.message}</span>
          )}
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6">
        {result.letters.length === 0 ? (
          <p className="text-sm text-ink-soft">{result.message || "أدخل شطراً ليظهر التقطيع."}</p>
        ) : (
          <div className="flex flex-wrap justify-start gap-x-5 gap-y-4">
            {words.map((word, wi) => (
              <div key={wi} className="flex gap-1">
                {word.map((L, li) => {
                  const global = letterOffset(wi, li, words);
                  return (
                    <LetterTile
                      key={`${wi}-${li}-${L.char}-${global}`}
                      letter={L}
                      onClick={() => {
                        const next = L.bit === 1 ? 0 : 1;
                        onFlip(global, next);
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {result.ok && result.laNaam.length > 0 ? (
          <p className="mt-5 font-display text-xl leading-relaxed text-ink-soft" dir="rtl">
            {result.laNaam.join(" · ")}
          </p>
        ) : null}

        {result.ok && result.bits ? (
          <p className="mt-1 font-mono text-xs tracking-widest text-subtle" dir="ltr">
            {result.bits}
          </p>
        ) : null}
      </div>

      {result.boxes.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 border-t border-paper-edge p-4 sm:grid-cols-3 md:grid-cols-4">
          {result.boxes.map((box) => (
            <div
              key={box.index}
              className={cn(
                "rounded-md px-3 py-3 ring-1",
                box.broken
                  ? "bg-break/10 ring-break"
                  : "bg-ink/[0.03] ring-ink/10",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-base font-bold text-ink">{box.name}</span>
                {box.zihaf ? (
                  <span className="text-xs text-ink-soft">{box.zihaf}</span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {box.laNaam.map((ln, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-sm px-2 py-0.5 text-xs font-medium",
                      ln === "نعم" ? "bg-one text-ok-fg" : "bg-ink/80 text-paper",
                    )}
                  >
                    {ln}
                  </span>
                ))}
              </div>
              {box.broken ? (
                <p className="mt-2 text-xs font-medium text-break">موضع الكسر</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {result.alts.length > 0 ? (
        <div className="border-t border-paper-edge px-5 py-3">
          <p className="mb-2 text-xs font-medium text-ink-soft">أوجه أخرى قريبة</p>
          <ul className="space-y-1.5">
            {result.alts.map((a) => (
              <li key={a.bits} className="text-sm text-ink">
                <span className="font-medium">{a.meterName}</span>
                {a.note ? <span className="text-ink-soft"> — {a.note}</span> : null}
                <span className="ms-2 font-mono text-xs tracking-wider text-subtle" dir="ltr">
                  {a.bits}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.fasih && result.ok ? (
        <p className="border-t border-paper-edge px-5 py-2 text-xs text-subtle">
          مقابله في الفصيح: {result.fasih}
        </p>
      ) : null}
    </article>
  );
}

function letterOffset(wi: number, li: number, words: LetterOut[][]): number {
  let n = 0;
  for (let i = 0; i < wi; i++) n += words[i]!.length;
  return n + li;
}

function LetterTile({ letter, onClick }: { letter: LetterOut; onClick: () => void }) {
  const bit = letter.bit;
  return (
    <button
      type="button"
      onClick={onClick}
      title="اضغط لقلب المتحرك/الساكن"
      className={cn(
        "flex min-h-11 min-w-9 flex-col items-center justify-center rounded-sm px-1.5 py-1 transition-colors duration-150",
        letter.skipped ? "opacity-45" : "hover:bg-ink/6",
        letter.locked && !letter.skipped ? "ring-1 ring-ink/15" : "",
      )}
    >
      <span className="font-display text-2xl leading-none text-ink">{letter.char}</span>
      <span
        className={cn(
          "mt-1 font-mono text-xs font-semibold tabular-nums",
          bit === 1 && "text-one",
          bit === 0 && "text-zero",
          bit === null && "text-subtle",
        )}
      >
        {bit === null ? "—" : bit}
      </span>
    </button>
  );
}
