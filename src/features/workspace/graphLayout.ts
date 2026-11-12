// Geometry for the Knowledge Graph diagram: where each node box sits and how the elbow connectors between them run.
// Pure functions, no React, so the layout can be tuned (sizes, spacing, routing) without touching the component.
import type { KgNode } from "../../types";

export type Point = [number, number];
export type Box = { x: number; y: number; w: number; node: KgNode };

/** Column headings, left to right (KgNode.col indexes into this). */
export const columns = ["สิ่งที่เกิดขึ้น", "ภายในใจ", "การตอบสนอง", "ผลที่ตามมา"];
/** Rows per column (KgNode.row is 0 to ROWS - 1); STAGE_H is sized to fit them. */
export const ROWS = 3;
export const NODE_H = 56;
export const ROW_TOP = 58;
export const ROW_PITCH = 96;
export const STAGE_H = 350;
export const MIN_WIDTH = 600;

// Nodes sit on a 4-column grid that stretches with the canvas; node boxes keep a fixed height so edges can attach to their sides.
export function gridLayout(width: number) {
  const margin = 18;
  const nodeW = Math.max(96, Math.min(132, (width - 2 * margin) / 4 - 56));
  const gap = (width - 2 * margin - 4 * nodeW) / 3;
  return { nodeW, gap, left: (col: number) => margin + col * (nodeW + gap), top: (row: number) => ROW_TOP + row * ROW_PITCH };
}

// Elbow connector (like Canva's "elbowed" line): leave the source side, turn in the gutter between columns, enter the target side.
export function route(source: Box, target: Box, gap: number): { points: Point[]; label: Point } {
  const sy = source.y + NODE_H / 2;
  const ty = target.y + NODE_H / 2;
  if (target.node.col !== source.node.col) {
    const forward = target.node.col > source.node.col;
    const x1 = forward ? source.x + source.w : source.x;
    const x2 = forward ? target.x : target.x + target.w;
    if (Math.abs(sy - ty) < 1) return { points: [[x1, sy], [x2, ty]], label: [(x1 + x2) / 2, sy] };
    const turn = forward ? x1 + gap / 2 : x1 - gap / 2;
    return { points: [[x1, sy], [turn, sy], [turn, ty], [x2, ty]], label: [turn, (sy + ty) / 2] };
  }
  const down = target.node.row > source.node.row;
  const x = source.x + source.w / 2;
  const y1 = down ? source.y + NODE_H : source.y;
  const y2 = down ? target.y : target.y + NODE_H;
  return { points: [[x, y1], [x, y2]], label: [x, (y1 + y2) / 2] };
}

export function roundedPath(points: Point[], radius = 10) {
  let path = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const r = Math.min(radius, Math.hypot(cx - px, cy - py) / 2, Math.hypot(nx - cx, ny - cy) / 2);
    path += ` L${cx - Math.sign(cx - px) * r},${cy - Math.sign(cy - py) * r} Q${cx},${cy} ${cx + Math.sign(nx - cx) * r},${cy + Math.sign(ny - cy) * r}`;
  }
  const [lx, ly] = points[points.length - 1];
  return `${path} L${lx},${ly}`;
}
