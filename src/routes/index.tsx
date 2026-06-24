import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapView } from "@/components/MapView";
import {
  DAYS,
  DM,
  HOTELS,
  OVERVIEW,
  TODOS,
  TRIP_START,
  getTripDay,
  type Day,
} from "@/lib/japan-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Japan 2026 — 21 Tage Reiseplan" },
      {
        name: "description",
        content:
          "Ein redaktionelles Reise-Logbuch: Tokio, Kamakura, Hakone, Kyoto, Nara, Osaka — Tag für Tag, mit Karten, Hotels und Todos.",
      },
      { property: "og:title", content: "Japan 2026 — 21 Tage Reiseplan" },
      {
        property: "og:description",
        content: "Tokio · Hakone · Kyoto · Osaka — 2.–22. September 2026.",
      },
    ],
  }),
  component: Index,
});

type TabId = "uebersicht" | "tage" | "bericht" | "hotels" | "todos";

const TABS: { id: TabId; lb: string }[] = [
  { id: "uebersicht", lb: "Überblick" },
  { id: "tage", lb: "Tage" },
  { id: "bericht", lb: "Reisebericht" },
  { id: "hotels", lb: "Hotels" },
  { id: "todos", lb: "Todos" },
];

// Pure visual coding by city — NO status meaning. Stays consistent so a
// reader can spot "ah, Kyoto-Tage" across the calendar at a glance.
const ORT_DOT: Record<string, string> = {
  Tokio: "var(--ink)",
  Kamakura: "var(--matcha)",
  Hakone: "var(--vermilion)",
  Kyoto: "var(--clay)",
  Osaka: "var(--sumi)",
  "Tokio → Narita": "var(--matcha)",
};

const ORT_LEGEND: { ort: string; color: string }[] = [
  { ort: "Tokio", color: "var(--ink)" },
  { ort: "Kamakura", color: "var(--matcha)" },
  { ort: "Hakone", color: "var(--vermilion)" },
  { ort: "Kyoto", color: "var(--clay)" },
  { ort: "Osaka", color: "var(--sumi)" },
];

const REPORT_STORAGE_KEY = "japan2026-reisebericht-v1";

function fmtCountdown(days: number) {
  if (days <= 0) return null;
  return days;
}

function Index() {
  const [tab, setTab] = useState<TabId>("uebersicht");
  const [exp, setExp] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [printMode, setPrintMode] = useState(false);
  const [exporting, setExporting] = useState(false);

  const cd = useMemo(() => getTripDay(), []);
  const isTrip = cd >= 1 && cd <= 21;
  const daysLeft = Math.ceil(
    (TRIP_START.getTime() - Date.now()) / 86400000
  );

  useEffect(() => {
    if (isTrip && exp === null) setExp(cd);
  }, [isTrip, cd, exp]);

  const toggle = (nr: number) => setExp(exp === nr ? null : nr);
  const gotoDay = (nr: number) => {
    setTab("tage");
    setExp(nr);
    setTimeout(
      () =>
        document
          .getElementById(`d${nr}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      80
    );
  };

  const exportPdf = async () => {
    setExporting(true);
    setTab("tage");
    setQuery("");
    setPrintMode(true);
    // Allow React to render all expanded cards + maps to mount + tiles to load
    await new Promise((r) => setTimeout(r, 2600));
    try {
      window.print();
    } finally {
      // Restore UI after print dialog closes
      setTimeout(() => {
        setPrintMode(false);
        setExporting(false);
      }, 300);
    }
  };

  // Listen for print finish to also restore state if user cancels
  useEffect(() => {
    const onAfter = () => {
      setPrintMode(false);
      setExporting(false);
    };
    window.addEventListener("afterprint", onAfter);
    return () => window.removeEventListener("afterprint", onAfter);
  }, []);

  return (
    <div
      className={
        "min-h-screen bg-background text-foreground " +
        (printMode ? "print-open" : "")
      }
    >
      <Header
        tab={tab}
        setTab={setTab}
        daysLeft={daysLeft}
        isTrip={isTrip}
        cd={cd}
        onExport={exportPdf}
        exporting={exporting}
      />

      <main className="mx-auto w-full max-w-3xl md:max-w-4xl px-5 sm:px-8 md:px-10 pb-32">
        {tab === "uebersicht" && !printMode && (
          <Overview
            cd={cd}
            daysLeft={daysLeft}
            gotoDay={gotoDay}
            isTrip={isTrip}
          />
        )}
        {(tab === "tage" || printMode) && (
          <DaysList
            cd={cd}
            isTrip={isTrip}
            daysLeft={daysLeft}
            exp={exp}
            toggle={toggle}
            query={query}
            setQuery={setQuery}
            printMode={printMode}
          />
        )}
        {tab === "bericht" && !printMode && <Bericht cd={cd} isTrip={isTrip} />}
        {tab === "hotels" && !printMode && <Hotels />}
        {tab === "todos" && !printMode && <Todos />}
      </main>

      <footer className="mx-auto max-w-3xl md:max-w-4xl px-5 sm:px-8 md:px-10 pb-12 pt-4 text-xs text-muted-foreground no-print">
        <div className="hairline-t border-t pt-6 flex items-center justify-between">
          <span className="font-display italic text-sm">Japan, im September.</span>
          <span>2.–22.9.2026</span>
        </div>
      </footer>
    </div>
  );
}

function Header({
  tab,
  setTab,
  daysLeft,
  isTrip,
  cd,
  onExport,
  exporting,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  daysLeft: number;
  isTrip: boolean;
  cd: number;
  onExport: () => void;
  exporting: boolean;
}) {
  const countdown = fmtCountdown(daysLeft);
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
      <div className="mx-auto max-w-3xl md:max-w-4xl px-5 sm:px-8 md:px-10 pt-5 sm:pt-7 pb-3 sm:pb-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
              Reise-Logbuch · No. 01
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium leading-[0.95]">
              Japan
              <span className="text-accent">.</span>{" "}
              <span className="italic font-normal text-sumi">2026</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              21 Tage · 2 Erw. + Baby · Tokio → Hakone → Kyoto → Osaka
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onExport}
              disabled={exporting}
              className="no-print inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
              aria-label="Als PDF exportieren"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="hidden xs:inline sm:inline">
                {exporting ? "Wird erstellt…" : "PDF"}
              </span>
            </button>
            {(isTrip || countdown) && (
              <div className="text-right leading-tight">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {isTrip ? "Heute" : "Noch"}
                </div>
                <div className="font-display text-xl sm:text-2xl md:text-3xl tabular-nums">
                  {isTrip ? (
                    <>Tag {cd}</>
                  ) : (
                    <>
                      {countdown}
                      <span className="text-xs sm:text-sm text-muted-foreground ml-1">
                        Tage
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="mt-5 sm:mt-6 -mx-5 sm:mx-0 px-5 sm:px-0 flex gap-1 overflow-x-auto no-scrollbar no-print">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  "relative shrink-0 px-3 py-2 text-sm transition-colors rounded-md " +
                  (active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {t.lb}
                {active && (
                  <span className="absolute left-3 right-3 -bottom-[9px] h-[2px] bg-accent rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function StatInline({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span
        className={
          "font-display text-base sm:text-lg tabular-nums leading-none " +
          (accent ? "text-accent" : "text-foreground")
        }
      >
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground truncate">
        {label}
      </span>
    </div>
  );
}

function Overview({
  cd,
  daysLeft,
  gotoDay,
  isTrip,
}: {
  cd: number;
  daysLeft: number;
  gotoDay: (nr: number) => void;
  isTrip: boolean;
}) {
  return (
    <div className="pt-6 sm:pt-8 space-y-10 sm:space-y-12">
      <section>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-full hairline bg-card px-5 py-3 text-sm shadow-soft">
          <StatInline value="21" label="Tage" />
          <span className="h-3 w-px bg-border" aria-hidden />
          <StatInline value="4" label="Stationen" />
          <span className="h-3 w-px bg-border" aria-hidden />
          <StatInline
            accent
            value={daysLeft > 0 ? String(daysLeft) : isTrip ? `Tag ${cd}` : "Los"}
            label={daysLeft > 0 ? "Tage bis Abflug" : isTrip ? "läuft" : "es geht los"}
          />
        </div>
      </section>

      <section>
        <SectionLabel kicker="Route" title="Durch Japan." />
        <div className="rounded-2xl overflow-hidden hairline shadow-soft">
          <MapView
            center={OVERVIEW.c}
            zoom={OVERVIEW.z}
            stops={OVERVIEW.s}
            height="320px"
          />
        </div>
        <ol className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
          {OVERVIEW.s.map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-sm border-b border-border/70 py-2"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-medium shrink-0">
                {i + 1}
              </span>
              <span className="flex-1">{s.n}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <SectionLabel kicker="Kalender" title="21 Tage auf einen Blick." />
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
          <span className="uppercase tracking-[0.18em] text-[10px]">Stationen</span>
          {ORT_LEGEND.map((l) => (
            <span key={l.ort} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: l.color }}
                aria-hidden
              />
              {l.ort}
            </span>
          ))}
        </div>
        <div className="rounded-2xl hairline bg-card overflow-hidden shadow-soft">
          {DAYS.map((day, i) => {
            const today = day.nr === cd;
            return (
              <button
                key={day.nr}
                onClick={() => gotoDay(day.nr)}
                className={
                  "w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 text-left transition-colors hover:bg-secondary/60 " +
                  (today ? "bg-accent/10 " : "") +
                  (i < DAYS.length - 1 ? "border-b border-border/70" : "")
                }
              >
                <span className="font-display text-lg sm:text-xl w-7 sm:w-8 tabular-nums text-foreground/80">
                  {String(day.nr).padStart(2, "0")}
                </span>
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground w-14 sm:w-16 shrink-0">
                  {day.datum}
                </span>
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: ORT_DOT[day.ort] ?? "var(--ink)" }}
                  aria-label={`Station: ${day.ort}`}
                />
                <span className="text-sm font-medium truncate flex-1 sm:flex-none sm:w-24 md:w-28">
                  {day.ort}
                </span>
                <span className="hidden sm:block text-sm text-muted-foreground truncate flex-1">
                  {day.top3[0].replace("⭐ ", "")}
                </span>
                {today && (
                  <span className="text-[10px] uppercase tracking-widest font-medium text-accent shrink-0">
                    heute
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SectionLabel({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <div className="mb-5">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
        {kicker}
      </div>
      <h2 className="font-display text-2xl sm:text-3xl font-medium leading-tight">
        {title}
      </h2>
    </div>
  );
}

function matchesQuery(day: Day, q: string) {
  const hay = [
    day.datum,
    day.ort,
    day.strecke,
    day.hotel,
    ...day.top3,
    ...day.info,
    ...day.ablauf.flat(),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function DaysList({
  cd,
  isTrip,
  daysLeft,
  exp,
  toggle,
  query,
  setQuery,
  printMode,
}: {
  cd: number;
  isTrip: boolean;
  daysLeft: number;
  exp: number | null;
  toggle: (nr: number) => void;
  query: string;
  setQuery: (q: string) => void;
  printMode: boolean;
}) {
  const q = query.trim().toLowerCase();
  const filtered = q ? DAYS.filter((d) => matchesQuery(d, q)) : DAYS;
  const days = printMode ? DAYS : filtered;

  return (
    <div className="pt-8">
      {printMode && (
        <div className="mb-6 text-center">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Reise-Logbuch
          </div>
          <h2 className="font-display text-3xl mt-1">
            Japan 2026 · 21 Tage
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            2.–22. September · Tokio · Hakone · Kyoto · Osaka
          </p>
        </div>
      )}

      {isTrip && !printMode && (
        <Banner tone="accent">
          Heute ist Tag {cd} — {DAYS[cd - 1]?.ort}
        </Banner>
      )}
      {!isTrip && daysLeft > 0 && !printMode && (
        <Banner tone="soft">Noch {daysLeft} Tage bis zur Reise</Banner>
      )}

      {!printMode && (
        <div className="mb-5 no-print">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tage durchsuchen — Ort, Sehenswürdigkeit, Hotel…"
              className="w-full rounded-full hairline bg-card pl-10 pr-10 py-2.5 text-sm placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Suche zurücksetzen"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
          {q && (
            <div className="mt-2 text-xs text-muted-foreground px-1">
              {filtered.length === 0
                ? "Keine Treffer."
                : `${filtered.length} von 21 Tagen`}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {days.map((day) => (
          <DayCard
            key={day.nr}
            day={day}
            today={day.nr === cd}
            open={printMode ? true : exp === day.nr}
            onToggle={() => toggle(day.nr)}
            printMode={printMode}
          />
        ))}
      </div>
    </div>
  );
}

function Banner({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "accent" | "soft";
}) {
  return (
    <div
      className={
        "mb-6 rounded-xl px-5 py-3 text-sm hairline " +
        (tone === "accent"
          ? "bg-accent text-accent-foreground border-transparent"
          : "bg-card text-foreground")
      }
    >
      {children}
    </div>
  );
}

function DayCard({
  day,
  today,
  open,
  onToggle,
  printMode,
}: {
  day: Day;
  today: boolean;
  open: boolean;
  onToggle: () => void;
  printMode: boolean;
}) {
  const dm = DM[day.nr];
  return (
    <article
      id={`d${day.nr}`}
      className={
        "day-card rounded-2xl bg-card overflow-hidden transition-shadow " +
        (today
          ? "today-ring border border-transparent "
          : "hairline ") +
        (open ? "shadow-lift" : "shadow-soft")
      }
    >
      {today && (
        <div className="px-5 pt-3 pb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-accent font-medium">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Heute · {day.datum}
        </div>
      )}
      <button
        onClick={onToggle}
        disabled={printMode}
        className="w-full flex items-start gap-5 p-5 text-left hover:bg-secondary/40 transition-colors disabled:cursor-default disabled:hover:bg-transparent"
      >
        <div
          className={
            "font-display text-4xl tabular-nums leading-none w-14 shrink-0 " +
            (today ? "text-accent" : "text-foreground/85")
          }
        >
          {String(day.nr).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground flex-wrap">
            <span>{day.datum}</span>
            <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: ORT_DOT[day.ort] ?? "var(--ink)" }}
              />
              {day.ort}
            </span>
            {today && (
              <span className="ml-1 inline-flex items-center rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[9px] font-semibold">
                Heute
              </span>
            )}
          </div>
          <h3 className="mt-1.5 font-display text-lg sm:text-xl leading-snug">
            {day.top3[0].replace("⭐ ", "")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{day.strecke}</p>
        </div>
        <span
          className={
            "day-toggle-icon shrink-0 mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full hairline text-sm transition-transform " +
            (open ? "rotate-45" : "")
          }
          aria-hidden
        >
          +
        </span>
      </button>

      {open && (
        <div className="day-panel px-5 pb-6 pt-1 space-y-7 border-t border-border/70">
          <div className="pt-4 text-xs text-muted-foreground">
            <span className="uppercase tracking-[0.18em] mr-2">Unterkunft</span>
            {day.hotel}
          </div>

          {dm && (
            <div className="map-block">
              <Kicker>Karte</Kicker>
              <div className="rounded-2xl overflow-hidden hairline shadow-soft">
                <MapView
                  center={dm.c}
                  zoom={dm.z}
                  stops={dm.s}
                  height="220px"
                />
              </div>
              <ul className="mt-3 space-y-1.5">
                {dm.s.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-foreground/85"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-medium">
                      {i + 1}
                    </span>
                    {s.n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <Kicker>Highlights</Kicker>
            <ol className="space-y-2">
              {day.top3.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="font-display text-lg text-accent leading-none w-5 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="flex-1">{t.replace("⭐ ", "")}</span>
                </li>
              ))}
            </ol>
          </div>

          {day.ablauf.length > 0 && (
            <div>
              <Kicker>Tagesablauf</Kicker>
              <ol className="divide-y divide-border/70">
                {day.ablauf.map((r, i) => (
                  <li key={i} className="flex gap-4 py-3">
                    <span className="text-xs font-medium text-accent w-24 shrink-0 pt-0.5 tabular-nums">
                      {r[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-snug">{r[1]}</div>
                      {r[3] && (
                        <div className="mt-1 text-xs text-muted-foreground italic">
                          {r[3]}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                      {r[2]}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {day.info && day.info.length > 0 && (
            <div>
              <Kicker>Notizen</Kicker>
              <ul className="space-y-2">
                {day.info.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm rounded-lg px-3.5 py-2.5 bg-background hairline"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {day.foodtours && (
            <div>
              <Kicker>Food Tour Optionen</Kicker>
              <ul className="space-y-2">
                {day.foodtours.map((f, i) => (
                  <li
                    key={i}
                    className="rounded-xl p-4 bg-background hairline"
                  >
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {f.detail}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {day.ryokans && (
            <div>
              <Kicker>Ryokan Gora</Kicker>
              <ul className="space-y-2">
                {day.ryokans.map((r, i) => (
                  <li
                    key={i}
                    className="rounded-xl p-4 bg-background hairline"
                  >
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Anreise · {r.anreise}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Baby · {r.baby}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
      {children}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ok: "bg-[oklch(0.55_0.08_145_/_0.12)] text-[oklch(0.4_0.08_145)]",
  warn: "bg-[oklch(0.85_0.1_85_/_0.35)] text-[oklch(0.4_0.08_70)]",
  error: "bg-[oklch(0.58_0.16_32_/_0.14)] text-accent",
  todo: "bg-secondary text-foreground/70",
  info: "bg-[oklch(0.6_0.08_240_/_0.14)] text-[oklch(0.4_0.08_240)]",
};

function Hotels() {
  return (
    <div className="pt-8 space-y-10">
      <section>
        <SectionLabel kicker="Unterkünfte" title="Buchungsstatus." />
        <div className="space-y-3">
          {HOTELS.map((h, i) => (
            <article
              key={i}
              className="rounded-2xl hairline bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {h.s}
                  </div>
                  <h3 className="font-display text-lg mt-1 leading-snug">
                    {h.n}
                  </h3>
                </div>
                <span
                  className={
                    "text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full " +
                    (STATUS_STYLES[h.b] ?? "bg-secondary")
                  }
                >
                  {h.st}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-4 text-xs">
                <Pair k="Daten" v={h.d} />
                <Pair k="Nächte" v={`${h.nt}`} />
                <Pair k="Preis" v={h.k} />
                <Pair k="Stornofrist" v={h.sto} />
                <Pair k="Babybett" v={h.bb} />
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl hairline bg-foreground text-background p-6 shadow-lift">
        <div className="text-[10px] uppercase tracking-[0.22em] text-background/60 mb-2">
          Strategie · Empfehlung Isabelle
        </div>
        <p className="font-display text-lg leading-snug">
          Airbnb mit Küche und separatem Schlafzimmer — Baby kann früh ins Bett,
          ihr bleibt noch auf. Viel Platz zum Krabbeln ist wichtig.
        </p>
      </section>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="uppercase tracking-[0.18em] text-[10px] text-muted-foreground">
        {k}
      </dt>
      <dd className="mt-0.5 text-foreground/90">{v}</dd>
    </div>
  );
}

function Todos() {
  const sections: { key: keyof typeof TODOS; lb: string; tone: string }[] = [
    { key: "kritisch", lb: "Kritisch", tone: "text-accent" },
    { key: "wichtig", lb: "Wichtig", tone: "text-foreground" },
    { key: "empfohlen", lb: "Empfohlen", tone: "text-sumi" },
    { key: "besprechen", lb: "Zu besprechen", tone: "text-sumi" },
  ];
  return (
    <div className="pt-8 space-y-10">
      <SectionLabel kicker="Offene Punkte" title="Was noch zu tun ist." />
      {sections.map((sec) => (
        <section key={sec.key}>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className={"font-display text-xl " + sec.tone}>{sec.lb}</h3>
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {TODOS[sec.key].length} Punkte
            </span>
          </div>
          <ul className="rounded-2xl hairline bg-card divide-y divide-border/70 overflow-hidden shadow-soft">
            {TODOS[sec.key].map((item: { t: string; f?: string }, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-1 inline-block h-3.5 w-3.5 rounded border border-foreground/40 shrink-0" />
                <span className="text-sm flex-1">{item.t}</span>
                {item.f && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground shrink-0">
                    {item.f}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// =========================================================================
// Reisebericht — per-day journal, persisted to localStorage.
// =========================================================================

type ReportMap = Record<number, string>;

function loadReports(): ReportMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REPORT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReportMap) : {};
  } catch {
    return {};
  }
}

function Bericht({ cd, isTrip }: { cd: number; isTrip: boolean }) {
  const [reports, setReports] = useState<ReportMap>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [expand, setExpand] = useState<number | null>(isTrip ? cd : null);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const update = (nr: number, value: string) => {
    setReports((prev) => {
      const next = { ...prev, [nr]: value };
      try {
        window.localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(next));
        setSavedAt(Date.now());
      } catch {
        // ignore quota errors
      }
      return next;
    });
  };

  const totalWritten = Object.values(reports).filter((v) => v && v.trim().length > 0).length;

  const exportText = () => {
    const lines: string[] = ["Japan 2026 — Reisebericht", ""];
    DAYS.forEach((d) => {
      const text = reports[d.nr]?.trim();
      if (!text) return;
      lines.push(`Tag ${d.nr} · ${d.datum} · ${d.ort}`);
      lines.push("─".repeat(40));
      lines.push(text);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "japan-2026-reisebericht.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-8 space-y-8">
      <div>
        <SectionLabel kicker="Reisebericht" title="Deine Erinnerungen." />
        <div className="rounded-2xl hairline bg-card p-5 shadow-soft flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="text-muted-foreground">
            {totalWritten} von 21 Tagen festgehalten · automatisch gespeichert
            {savedAt && (
              <span className="ml-2 text-[11px] text-accent">
                ✓ gespeichert
              </span>
            )}
          </span>
          <button
            onClick={exportText}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/85 transition-colors"
          >
            Als Text exportieren
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {DAYS.map((day) => {
          const today = day.nr === cd;
          const text = reports[day.nr] ?? "";
          const filled = text.trim().length > 0;
          const open = expand === day.nr || filled || today;
          return (
            <article
              key={day.nr}
              className={
                "rounded-2xl bg-card overflow-hidden transition-shadow " +
                (today ? "today-ring border border-transparent " : "hairline ") +
                "shadow-soft"
              }
            >
              <button
                type="button"
                onClick={() => setExpand(expand === day.nr ? null : day.nr)}
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-secondary/40 transition-colors"
              >
                <div
                  className={
                    "font-display text-2xl sm:text-3xl tabular-nums leading-none w-10 sm:w-12 shrink-0 " +
                    (today ? "text-accent" : "text-foreground/85")
                  }
                >
                  {String(day.nr).padStart(2, "0")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{day.datum}</span>
                    <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: ORT_DOT[day.ort] ?? "var(--ink)" }}
                      />
                      {day.ort}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-base sm:text-lg leading-snug truncate">
                    {day.top3[0].replace("⭐ ", "")}
                  </h3>
                </div>
                <span
                  className={
                    "shrink-0 inline-flex items-center justify-center rounded-full text-[10px] uppercase tracking-wider px-2.5 py-1 " +
                    (filled
                      ? "bg-accent text-accent-foreground"
                      : "hairline text-muted-foreground")
                  }
                >
                  {filled ? "geschrieben" : "leer"}
                </span>
              </button>
              {open && (
                <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-border/70">
                  <textarea
                    value={text}
                    onChange={(e) => update(day.nr, e.target.value)}
                    placeholder={`Was war heute besonders? Eindrücke, Begegnungen, was ${day.ort} dir gegeben hat…`}
                    rows={6}
                    className="w-full mt-3 rounded-xl bg-background hairline px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition resize-y"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{text.length} Zeichen</span>
                    {text && (
                      <button
                        onClick={() => update(day.nr, "")}
                        className="hover:text-foreground transition"
                      >
                        Eintrag löschen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
