// A 0-100 progress ring for the /impact stats column. Pure SVG, no hooks.
//
// The arc uses pathLength=100, so the dash offset is just 100 - value. It
// fills from empty when it mounts (the impact-ring-fill keyframe has only a
// `from`, so it runs to whatever offset the value sets) and slides to a new
// value when filters change (the transition). Reduced motion turns both off
// via the .impact-anim rule in globals.css.

import type { CSSProperties, ReactNode } from "react";

const SIZES = {
    lg: { px: 96, stroke: 9 },
    md: { px: 80, stroke: 8 },
    sm: { px: 46, stroke: 5 },
} as const;

export type RingSize = keyof typeof SIZES;

export default function Ring({
    value,
    color,
    size = "md",
    refValue,
    delay = 0,
    children,
}: {
    /** 0-100, or null for an empty track (suppressed / unknown). */
    value: number | null;
    color: string;
    size?: RingSize;
    /** A comparison tick on the ring, e.g. the average town. */
    refValue?: number;
    /** Fill animation delay in ms, to stagger rings in a strip. */
    delay?: number;
    /** The number in the middle. */
    children?: ReactNode;
}) {
    const { px, stroke } = SIZES[size];
    const c = px / 2;
    // Leave room for the tick to stick out past the track.
    const r = c - stroke / 2 - 3;
    // 2% floor so a published "<1%" still shows a sliver.
    const shown = value === null ? 0 : Math.min(100, Math.max(2, value));

    let tick: { x1: number; y1: number; x2: number; y2: number } | null = null;
    if (refValue !== undefined) {
        const a = (Math.min(100, Math.max(0, refValue)) / 100) * 2 * Math.PI;
        const inner = r - stroke / 2 - 2;
        const outer = r + stroke / 2 + 2;
        tick = {
            x1: c + inner * Math.sin(a),
            y1: c - inner * Math.cos(a),
            x2: c + outer * Math.sin(a),
            y2: c - outer * Math.cos(a),
        };
    }

    return (
        <span
            className="relative inline-grid shrink-0 place-items-center"
            style={{ width: px, height: px }}
        >
            <svg
                aria-hidden
                width={px}
                height={px}
                viewBox={`0 0 ${px} ${px}`}
                className="absolute inset-0"
            >
                <circle
                    cx={c}
                    cy={c}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-bhg-gray-100"
                />
                {value !== null && (
                    <circle
                        cx={c}
                        cy={c}
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        pathLength={100}
                        strokeDasharray="100 100"
                        transform={`rotate(-90 ${c} ${c})`}
                        className="impact-ring"
                        style={
                            {
                                strokeDashoffset: 100 - shown,
                                animationDelay: `${delay}ms`,
                            } as CSSProperties
                        }
                    />
                )}
                {tick && (
                    <>
                        <line
                            {...tick}
                            stroke="#fff"
                            strokeWidth={4}
                            strokeLinecap="round"
                        />
                        <line
                            {...tick}
                            strokeWidth={2}
                            strokeLinecap="round"
                            className="stroke-bhg-gray-300"
                        />
                    </>
                )}
            </svg>
            <span className="relative leading-none">{children}</span>
        </span>
    );
}
