import * as d3 from "d3";

export type Margin = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

export const DEFAULT_COLORS = [
    "#F4A6B0",
    "#20B2AA",
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
];
export const DEFAULT_GRID = "#E5E7EB";
export const DEFAULT_TEXT = "#6B6B6B";
export const DEFAULT_FONT = "Manrope";

export function computeInnerDimensions(
    svgEl: SVGSVGElement,
    width: number | undefined,
    height: number | undefined,
    margin: Margin
) {
    const outerWidth = width ?? (svgEl.clientWidth || 900);
    const outerHeight = height ?? (svgEl.clientHeight || 380);
    return {
        width: outerWidth - margin.left - margin.right,
        height: outerHeight - margin.top - margin.bottom,
        outerWidth,
        outerHeight,
    };
}

export { d3 };
