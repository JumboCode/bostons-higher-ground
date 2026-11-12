// Server-rendered SVG heat map of where BHG has helped families.
// Town shapes: MassGIS Census 2020 Towns, simplified (src/lib/ma-towns.json).
// Rings are wound clockwise for d3-geo; ArcGIS/RFC 7946 GeoJSON is the reverse and
// renders as "whole globe minus town". Rewind if this file is ever regenerated.
// Only path strings reach the browser; hover = native <title>, click = filter link.
import {
    geoCentroid,
    geoMercator,
    geoPath,
    type ExtendedFeature,
    type ExtendedFeatureCollection,
    type GeoGeometryObjects,
} from "d3";

import MapZoom from "@/components/MapZoom";
import towns from "@/lib/ma-towns.json";

const TOWNS = towns as unknown as ExtendedFeatureCollection<
    ExtendedFeature<GeoGeometryObjects, { name: string }>
>;

// Boston neighborhoods aren't separate polygons, so they get hand-placed points.
// Anything else is matched to a town polygon by name.
const NEIGHBORHOODS: Record<string, [number, number]> = {
    Dorchester: [-71.064, 42.3],
    Roxbury: [-71.088, 42.317],
    Mattapan: [-71.092, 42.274],
    "East Boston": [-71.032, 42.375],
    "Hyde Park": [-71.124, 42.256],
    "Jamaica Plain": [-71.114, 42.31],
    // "Boston" with no neighborhood: downtown, not the polygon centroid
    Boston: [-71.058, 42.358],
    Brighton: [-71.156, 42.35],
    Roslindale: [-71.13, 42.283],
    "South Boston": [-71.047, 42.335],
};
const CENTROIDS = new Map<string, [number, number]>([
    ...TOWNS.features.map(
        (f) => [f.properties.name, geoCentroid(f)] as [string, [number, number]]
    ),
    ...Object.entries(NEIGHBORHOODS),
]);

const W = 640;
const H = 480;
const projection = geoMercator().fitExtent(
    [
        [8, 8],
        [W - 8, H - 8],
    ],
    TOWNS
);
const path = geoPath(projection);
const TOWN_PATHS = TOWNS.features.map((f) => ({
    name: f.properties.name,
    d: path(f) ?? "",
}));

export type PlaceShare = { place: string; pct: number };

export default function ImpactMap({
    shares,
    selected,
    hrefFor,
}: {
    shares: PlaceShare[];
    selected?: string;
    hrefFor: (place: string) => string;
}) {
    // ponytail: places with no known coordinates are skipped on the map (still listed beside it)
    const points = shares.flatMap((s) => {
        const c = CENTROIDS.get(s.place);
        const xy = c && projection(c);
        return xy ? [{ ...s, x: xy[0], y: xy[1] }] : [];
    });
    const max = Math.max(1, ...points.map((p) => p.pct));
    const r = (pct: number) => 4 + 16 * Math.sqrt(pct / max);

    return (
        <MapZoom>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto w-full"
                role="img"
                aria-label="Map of families helped by town"
            >
                <defs>
                    <filter
                        id="heat-blur"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                    >
                        <feGaussianBlur stdDeviation="8" />
                    </filter>
                </defs>
                <g
                    fill="#FAFAFA"
                    stroke="#D9D9D9"
                    strokeWidth={0.6}
                    vectorEffect="non-scaling-stroke"
                >
                    {TOWN_PATHS.map((t) => (
                        <path
                            key={t.name}
                            d={t.d}
                            fill={t.name === "Boston" ? "#F0F0F0" : undefined}
                        >
                            <title>{t.name}</title>
                        </path>
                    ))}
                </g>
                {/* heat glow */}
                <g filter="url(#heat-blur)" fill="#E76C82">
                    {points.map((p) => (
                        <circle
                            key={p.place}
                            cx={p.x}
                            cy={p.y}
                            r={r(p.pct) * 1.4}
                            opacity={0.25 + 0.6 * (p.pct / max)}
                        />
                    ))}
                </g>
                {points.map((p) => (
                    <a key={p.place} href={hrefFor(p.place)} target="_self">
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={r(p.pct) * 0.4}
                            fill="#E76C82"
                            stroke={p.place === selected ? "#2D2D2D" : "#fff"}
                            strokeWidth={p.place === selected ? 3 : 1.5}
                        >
                            <title>{`${p.place}: ${p.pct}% of families we've helped`}</title>
                        </circle>
                    </a>
                ))}
            </svg>
        </MapZoom>
    );
}
