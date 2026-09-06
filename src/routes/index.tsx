import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Scale, RotateCcw } from "lucide-react";
import { meterList, weigh, type WeighResult } from "@/lib/arud";
import { HemistichView } from "@/components/hemistich-view";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const EXAMPLES: { label: string; text: string; meter: string }[] = [
  {
    label: "يا ما حلا",
    text: "يا ما حلا بعد العشا شرب الفنجال",
    meter: "mashub",
  },
  {
    label: "نحمد الله",
    text: "نحمد الله جت على ما تمنى",
    meter: "auto",
  },
  {
    label: "من هجركم",
    text: "من هجركم",
    meter: "auto",
  },
  {
    label: "بيت صدر وعجز",
    text: "نحمد الله جت على ما تمنى\nمن ولي العرش جزل الوهايب",
    meter: "arda",
  },
];

const LABELS = ["الصدر", "العجز", "شطر ثالث", "شطر رابع"];

function Home() {
  const meters = useMemo(() => meterList(), []);
  const [text, setText] = useState("يا ما حلا بعد العشا شرب الفنجال");
  const [meterId, setMeterId] = useState("mashub");
  const [locks, setLocks] = useState<Array<Record<number, number>>>([]);

  const result: WeighResult = useMemo(() => weigh(text, meterId, locks), [text, meterId, locks]);

  function loadExample(ex: (typeof EXAMPLES)[number]) {
    setText(ex.text);
    setMeterId(ex.meter);
    setLocks([]);
  }

  function flip(hi: number, li: number, nextBit: number) {
    setLocks((prev) => {
      const copy = prev.map((x) => ({ ...x }));
      while (copy.length <= hi) copy.push({});
      copy[hi] = { ...copy[hi], [li]: nextBit };
      return copy;
    });
  }

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-70"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--color-surface) 80%, transparent), transparent)",
        }}
      />
      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted">شعر نبطي · من غير تشكيل</p>
              <h1 className="mt-1 font-display text-4xl font-bold leading-tight text-balance sm:text-5xl">
                ميزان النبط
              </h1>
              <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-muted">
                الصق صدراً أو عجزاً أو بيتاً. البرنامج لا يخمن سكوناً واحداً: يولّد تقطيعات
                محتملة، يقيسها على قوالب البحور، ويأخذ الأعلى مطابقة. اضغط الحرف لقلب 1 و 0.
              </p>
            </div>
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-lg bg-surface ring-1 ring-border sm:flex">
              <Scale className="size-5 text-accent" strokeWidth={1.75} />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
            <LegendItem k="1" v="متحرك" />
            <LegendItem k="0" v="ساكن" />
            <LegendItem k="لا" v="سبب 10" />
            <LegendItem k="نعم" v="وتد 110" />
          </dl>
        </header>

        <section className="rounded-xl bg-surface p-4 ring-1 ring-border sm:p-5">
          <label htmlFor="verse" className="mb-2 block text-sm font-medium text-fg">
            البيت
          </label>
          <textarea
            id="verse"
            dir="rtl"
            rows={3}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setLocks([]);
            }}
            placeholder="الصق الشطر هنا، بلا حركات. افصل الصدر عن العجز بنجمة أو سطر."
            className="w-full resize-y rounded-md bg-bg-elevated px-4 py-3 font-display text-xl leading-loose text-fg outline-none ring-1 ring-border placeholder:text-subtle focus:ring-2 focus:ring-ring"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => loadExample(ex)}
                className="rounded-full bg-bg px-3 py-1.5 text-sm text-muted ring-1 ring-border transition-colors hover:text-fg"
              >
                {ex.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="meter" className="mb-2 block text-sm font-medium text-fg">
                البحر
              </label>
              <select
                id="meter"
                value={meterId}
                onChange={(e) => setMeterId(e.target.value)}
                className="h-11 w-full rounded-md bg-bg-elevated px-3 text-sm text-fg outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
              >
                {meters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.feet.length ? ` — ${m.feet.join(" ")}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setLocks([])}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-fg px-5 text-sm font-medium text-bg",
                "transition-transform active:scale-[0.98]",
              )}
            >
              <RotateCcw className="size-4" strokeWidth={1.75} />
              أعد التخمين
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-subtle">
            الوضع {result.mode === "discover" ? "اكتشاف تلقائي لأقرب بحر" : "فحص البحر المختار"}.
            افصل الشطرين بـ *** أو سطر جديد. يعمل بعد التشغيل بلا شبكة.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          {result.hemistichs.length === 0 ? (
            <div className="rounded-xl bg-surface px-5 py-8 text-center text-sm text-muted ring-1 ring-border">
              {result.message}
            </div>
          ) : (
            result.hemistichs.map((h, i) => (
              <HemistichView
                key={`${i}-${h.cleaned}`}
                result={h}
                label={
                  result.hemistichs.length === 1 ? "الشطر" : (LABELS[i] ?? `شطر ${i + 1}`)
                }
                onFlip={(li, bit) => flip(i, li, bit)}
              />
            ))
          )}
        </section>

        {result.hemistichs.length === 2 && result.sameMeter === false ? (
          <p className="text-center text-sm text-muted">
            الشطران على بحرين مختلفين. راجع الوزن أو ثبّت بحراً واحداً للقصيدة.
          </p>
        ) : null}

        <footer className="pb-8 pt-2 text-center text-xs leading-6 text-subtle">
          القياس على النطق النجدي لا على الرسم. الله سببان لا وتد. ال الشمسية تُدغم.
        </footer>
      </div>
    </main>
  );
}

function LegendItem({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-surface px-3 py-2 ring-1 ring-border">
      <dt className="font-display text-sm font-bold text-fg">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
