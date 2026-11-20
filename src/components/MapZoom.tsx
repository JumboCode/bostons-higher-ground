"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN = 1;
const MAX = 8;

// Zoom = widen the inner box; pan = native scroll on the overflow container.
// Pinch: trackpad (ctrl+wheel) and two-finger touch, anchored under the fingers/cursor.
// ponytail: Safari desktop trackpad pinch sends GestureEvents, not ctrl+wheel; add if needed.
export default function MapZoom({ children }: { children: React.ReactNode }) {
    const [z, setZ] = useState(MIN);
    const zRef = useRef(MIN);
    const ref = useRef<HTMLDivElement>(null);
    const inner = useRef<HTMLDivElement>(null);

    // px/py: anchor point relative to the visible container
    const zoomAt = useCallback((next: number, px: number, py: number) => {
        const el = ref.current;
        if (!el || !inner.current) return;
        next = Math.min(MAX, Math.max(MIN, next));
        const k = next / zRef.current;
        if (k === 1) return;
        const x = el.scrollLeft + px;
        const y = el.scrollTop + py;
        zRef.current = next;
        inner.current.style.width = `${next * 100}%`; // sync, so scroll math sees new size
        el.scrollLeft = x * k - px;
        el.scrollTop = y * k - py;
        setZ(next);
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let dist = 0;
        const local = (x: number, y: number) => {
            const r = el.getBoundingClientRect();
            return [x - r.left, y - r.top] as const;
        };
        const pinch = (e: TouchEvent) => {
            const [a, b] = [e.touches[0], e.touches[1]];
            const [x, y] = local((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
            return { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), x, y };
        };

        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return; // plain wheel = normal scroll/pan
            e.preventDefault();
            zoomAt(zRef.current * Math.exp(-e.deltaY * 0.01), ...local(e.clientX, e.clientY));
        };
        const onStart = (e: TouchEvent) => {
            if (e.touches.length === 2) dist = pinch(e).d;
        };
        const onMove = (e: TouchEvent) => {
            if (e.touches.length !== 2 || !dist) return;
            e.preventDefault();
            const p = pinch(e);
            zoomAt((zRef.current * p.d) / dist, p.x, p.y);
            dist = p.d;
        };
        const onEnd = () => {
            dist = 0;
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        el.addEventListener("touchstart", onStart, { passive: true });
        el.addEventListener("touchmove", onMove, { passive: false });
        el.addEventListener("touchend", onEnd);
        return () => {
            el.removeEventListener("wheel", onWheel);
            el.removeEventListener("touchstart", onStart);
            el.removeEventListener("touchmove", onMove);
            el.removeEventListener("touchend", onEnd);
        };
    }, [zoomAt]);

    const center = (next: number) => {
        const el = ref.current;
        if (el) zoomAt(next, el.clientWidth / 2, el.clientHeight / 2);
    };

    const btn =
        "rounded-md border border-bhg-gray-200 bg-white p-1.5 shadow-sm disabled:opacity-40";
    return (
        <div className="relative">
            {/* pan-x pan-y: keep one-finger scroll, stop the browser zooming the whole page */}
            <div ref={ref} className="aspect-[4/3] touch-pan-x touch-pan-y overflow-auto">
                <div ref={inner} style={{ width: `${z * 100}%` }}>
                    {children}
                </div>
            </div>
            <div className="absolute right-2 top-2 flex flex-col gap-1">
                <button
                    type="button"
                    aria-label="Zoom in"
                    className={btn}
                    disabled={z >= MAX}
                    onClick={() => center(z * 2)}
                >
                    <Plus size={16} />
                </button>
                <button
                    type="button"
                    aria-label="Zoom out"
                    className={btn}
                    disabled={z <= MIN}
                    onClick={() => center(z / 2)}
                >
                    <Minus size={16} />
                </button>
            </div>
        </div>
    );
}
