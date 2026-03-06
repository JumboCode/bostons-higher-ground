import {
  Svg,
  G,
  Path,
  Text as SvgText,
  Rect,
} from "@react-pdf/renderer";
import type { DonutDatum } from "./donut-chart";

export type DonutChartPdfProps = {
  data: DonutDatum[];
  width?: number;
  height?: number;
  colors?: string[];
  centerLabel?: string;
};

const DEFAULT_COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

const DEFAULT_FONT = "Helvetica";

export function DonutChartPdf({
  data,
  width = 500,
  height = 420,
  colors = DEFAULT_COLORS,
  centerLabel = "Total",
}: DonutChartPdfProps) {
  if (!data.length) return null;

  const legendSpace = 100;
  const outerHeight = height + legendSpace;

  const margin = 40;
  const radius = Math.min(width, height) / 2 - margin;
  const innerRadius = radius * 0.6;

  const cx = width / 2;
  const cy = height / 2;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const palette = colors.length ? colors : DEFAULT_COLORS;

  // ---- Helpers ----

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    r: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    x: number,
    y: number,
    outerR: number,
    innerR: number,
    startAngle: number,
    endAngle: number
  ) => {
    const startOuter = polarToCartesian(x, y, outerR, endAngle);
    const endOuter = polarToCartesian(x, y, outerR, startAngle);

    const startInner = polarToCartesian(x, y, innerR, endAngle);
    const endInner = polarToCartesian(x, y, innerR, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `
      M ${startOuter.x} ${startOuter.y}
      A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}
      L ${endInner.x} ${endInner.y}
      A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}
      Z
    `;
  };

  // ---- Build slices ----

  let cumulativeAngle = 0;

  const slices = data.map((d, index) => {
    const valueAngle = total === 0 ? 0 : (d.value / total) * 360;

    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + valueAngle;

    cumulativeAngle += valueAngle;

    const midAngle = startAngle + valueAngle / 2;
    const labelPos = polarToCartesian(cx, cy, radius * 0.8, midAngle);

    const pct = total === 0 ? 0 : (d.value / total) * 100;

    return {
      path: describeArc(cx, cy, radius, innerRadius, startAngle, endAngle),
      fill: d.color ?? palette[index % palette.length],
      label: pct >= 5 ? `${Math.round(pct)}%` : "",
      labelX: labelPos.x,
      labelY: labelPos.y,
    };
  });

  return (
    <Svg width="100%" height={outerHeight} viewBox={`0 0 ${width} ${outerHeight}`}>
      {/* ---- Donut ---- */}
      <G>
        {slices.map((slice, i) => (
          <G key={i}>
            <Path d={slice.path} fill={slice.fill} />
            {slice.label && (
              <SvgText
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                style={{
                  fontSize: 14,
                  fontFamily: DEFAULT_FONT,
                  fontWeight: 600,
                  fill: "white",
                }}
              >
                {slice.label}
              </SvgText>
            )}
          </G>
        ))}
      </G>

      {/* ---- Center Text ---- */}
      <G>
        <SvgText
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          style={{
            fontSize: 28,
            fontFamily: DEFAULT_FONT,
            fontWeight: 700,
            fill: "#374151",
          }}
        >
          {total}
        </SvgText>

        <SvgText
          x={cx}
          y={cy + 15}
          textAnchor="middle"
          style={{
            fontSize: 14,
            fontFamily: DEFAULT_FONT,
            fill: "#767676",
          }}
        >
          {centerLabel}
        </SvgText>
      </G>

      {/* ---- Legend (3 per row) ---- */}
      <G transform={`translate(${width / 2 - 150}, ${height + 20})`}>
        {data.map((d, i) => {
          const x = (i % 3) * 120;
          const y = Math.floor(i / 3) * 25;

          return (
            <G key={i} transform={`translate(${x}, ${y})`}>
              <Rect
                width={14}
                height={14}
                rx={3}
                fill={d.color ?? palette[i % palette.length]}
              />
              <SvgText
                x={20}
                y={11}
                style={{
                  fontSize: 11,
                  fontFamily: DEFAULT_FONT,
                  fill: "#4A5565",
                }}
              >
                {d.label.length > 15
                  ? `${d.label.substring(0, 15)}...`
                  : d.label}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}
