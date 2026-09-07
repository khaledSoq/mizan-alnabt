import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Scale, RotateCcw } from "lucide-react";
import { meterList, weigh, type WeighResult } from "@/lib/arud";
import { HemistichView } from "@/components/hemistich-view";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const DEFAULT_SADR = "يا ما حلا الفنجال مع سيحة البال";
const DEFAULT_AJZ = "في مجلس ما فيه نفس ثقيلة";

const EXAMPLES: { label: string; sadr: string; ajz: string; meter: string }[] = [
  {
    label: "المسحوب",
    sadr: "يا ما حلا الفنجال مع سيحة البال",
    ajz: "في مجلس ما فيه نفس ثقيلة",
    meter: "mashub",
  },
  {
    label: "المسحوب — عابرة سبيل",
    sadr: "العيد باكر أسعد الله ممساك",
    ajz: "والله مادري وين حدٍ جلسته",
    meter: "mashub",
  },
  {
    label: "العرضة",
    sadr: "نحمد الله جت على ما تمنى",
    ajz: "من ولي العرش جزل الوهايب",
    meter: "arda",
  },
  {
    label: "الهجيني التام",
    sadr: "غريب الدار ومناي التسلي",
    ajz: "أسلي خاطري عن حب خلي",
    meter: "hajini_tamm",
  },
  {
    label: "الهلالي",
    sadr: "على ما يفوت القلب لا تشمت العدا",
    ajz: "ولا تشمت اللي ما درى بالذي جرى",
    meter: "hilali",
  },
];

const LABELS = ["الصدر", "العجز", "شطر ثالث", "شطر رابع"];

function joinBayt(sadr: string, ajz: string) {
  return sadr + "\n" + ajz;
}

function Home() {
  const meters = useMemo(() => meterList(), []);
  const [sadr, setSadr] = useState(DEFAULT_SADR);
  const [ajz, setAjz] = useState(DEFAULT_AJZ);
  const [meterId, setMeterId] = useState("mashub");
  const [locks, setLocks] = useState<Array<Record<number, number>>>([]);

  const verse = joinBayt(sadr, ajz);
  const result: WeighResult = useMemo(() => weigh(verse, meterId, locks), [verse, meterId, locks]);

  function loadExample(ex: (typeof EXAMPLES)[number]) {
    setSadr(ex.sadr);
    setAjz(ex.ajz);
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

  function hemistichLabel(i: number) {
    if (result.hemistichs.length === 1) {
      return sadr.trim() ? "الصدر" : "العجز";
    }
    return LABELS[i] ?? `شطر ${i + 1}`;
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
                اكتب الصدر، وإن أحببت العجز. بلا حركات. البرنامج يولّد تقطيعات محتملة
                ويقيسها على قوالب البحور. اضغط الحرف: حركة ثم سكون ثم شدة.
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
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="sadr" className="mb-2 block text-sm font-medium text-fg">
                الصدر
              </label>
              <textarea
                id="sadr"
                dir="rtl"
                rows={2}
                value={sadr}
                onChange={(e) => {
                  setSadr(e.target.value);
                  setLocks([]);
                }}
                placeholder="الصدر، بلا حركات"
                className="w-full resize-y rounded-md bg-bg-elevated px-4 py-3 font-display text-xl leading-loose text-fg outline-none ring-1 ring-border placeholder:text-subtle focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="ajz" className="mb-2 block text-sm font-medium text-fg">
                العجز
              </label>
              <textarea
                id="ajz"
                dir="rtl"
                rows={2}
                value={ajz}
                onChange={(e) => {
                  setAjz(e.target.value);
                  setLocks([]);
                }}
                placeholder="العجز، بلا حركات — اتركه فارغاً لوزن الصدر وحده"
                className="w-full resize-y rounded-md bg-bg-elevated px-4 py-3 font-display text-xl leading-loose text-fg outline-none ring-1 ring-border placeholder:text-subtle focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-fg">البحر</p>
            <div className="flex flex-wrap gap-2">
              {meters.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMeterId(m.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm ring-1 transition-colors",
                    meterId === m.id
                      ? "bg-paper text-ink ring-paper"
                      : "bg-bg-elevated text-fg ring-border",
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setLocks((x) => x.slice())}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-paper px-5 text-sm font-bold text-ink"
            >
              زِن البيت
            </button>
            <button
              type="button"
              onClick={() => setLocks([])}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-bg-elevated px-4 text-sm text-fg ring-1 ring-border"
            >
              <RotateCcw className="size-4" strokeWidth={1.75} />
              صفّر
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-subtle">يمسح تعديلك على الحروف</p>
          <p className="mt-2 text-xs leading-5 text-subtle">
            الوضع {result.mode === "discover" ? "اكتشاف تلقائي لأقرب بحر" : "فحص البحر المختار"}.
            اضغط الحرف: حركة ثم سكون ثم شدة.
          </p>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-fg">أمثلة</p>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => loadExample(ex)}
                  className="w-full rounded-md bg-bg px-3 py-3 text-right ring-1 ring-border transition-colors hover:bg-bg-elevated"
                >
                  <span className="block text-sm font-medium text-fg">{ex.label}</span>
                  <span className="mt-1 block whitespace-normal break-words font-display text-base leading-7 text-muted">
                    {ex.sadr}
                  </span>
                  {ex.ajz ? (
                    <span className="block whitespace-normal break-words font-display text-base leading-7 text-muted">
                      {ex.ajz}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
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
                label={hemistichLabel(i)}
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
