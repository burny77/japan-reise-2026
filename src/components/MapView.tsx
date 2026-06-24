type Stop = { n: string; c: [number, number] };

/**
 * Keyless Google Maps embed (output=embed).
 *
 * We deliberately do NOT use saddr/daddr (no route line). Instead we drop a
 * single pin on the primary stop and rely on the numbered stop list below
 * the map. An "Alle Stopps öffnen" link lets the user explore the full set
 * of waypoints in google.com/maps.
 */
export function MapView({
  center,
  zoom,
  stops,
  height = "220px",
}: {
  center: [number, number];
  zoom: number;
  stops: Stop[];
  height?: string;
}) {
  // User feedback: maps were a touch too zoomed in.
  const z = Math.max(4, zoom - 1);
  const src = buildSrc(center, z, stops);
  const openUrl = buildOpenAllUrl(stops, center);

  return (
    <div className="relative w-full" style={{ height }}>
      <iframe
        title="Karte"
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full rounded-2xl"
        style={{ border: 0 }}
        allowFullScreen
      />
      <a
        href={openUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-wider text-foreground hairline shadow-soft hover:bg-background transition"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
        Google Maps
      </a>
    </div>
  );
}

function buildSrc(
  center: [number, number],
  zoom: number,
  stops: Stop[]
): string {
  // Multi-pin display is only available with an API key. As a keyless
  // fallback we render a directions route through every stop in order —
  // that's the only way Google Maps Embed will draw a marker for each
  // waypoint. The day's array already starts and ends at the hotel.
  if (stops.length >= 2) {
    const [a, ...rest] = stops;
    const saddr = `${a.c[0]},${a.c[1]}`;
    const daddr = rest.map((s) => `${s.c[0]},${s.c[1]}`).join("+to:");
    return `https://www.google.com/maps?saddr=${saddr}&daddr=${daddr}&hl=de&z=${zoom}&output=embed`;
  }
  if (stops.length === 1) {
    const [lat, lng] = stops[0].c;
    const label = encodeURIComponent(stops[0].n);
    return `https://www.google.com/maps?q=${lat},${lng}(${label})&hl=de&z=${zoom}&output=embed`;
  }
  return `https://www.google.com/maps?q=${center[0]},${center[1]}&hl=de&z=${zoom}&output=embed`;
}

function buildOpenAllUrl(stops: Stop[], center: [number, number]): string {
  if (stops.length === 0) {
    return `https://www.google.com/maps/search/?api=1&query=${center[0]},${center[1]}`;
  }
  // search/?api=1 with the joined names gives a multi-result view in Google Maps.
  const query = stops.map((s) => s.n).join(" | ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
