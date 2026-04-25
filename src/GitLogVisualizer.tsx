import type { GitBranch, GitEvent } from "./types";
import styles from "./GitLogVisualizer.module.css";

export function GitLogVisualizer({
  events,
  branchData,
  isDark,
  startVersion,
  totalCommits,
}: {
  events: GitEvent[];
  branchData: GitBranch[];
  isDark: boolean;
  startVersion: { x: number; y: number; z: number };
  totalCommits: number;
}) {
  const rowHeight = 60;
  const padding = 20;
  const branchSpacing = 25;

  const branchColumns: Record<string, number> = { main: 0 };
  let nextCol = 1;
  const activeBranchY: Record<string, number> = { main: padding };

  const nodes: any[] = [];
  const lines: any[] = [];

  let currentY = padding;
  let branchesOnCurrentY = new Set<string>();

  // Frequency seeds for coord calculation (must match App)
  const fx = startVersion.x + 1.2;
  const fy = startVersion.y + 2.3;
  const fz = startVersion.z + 3.4;
  const cw = totalCommits / 15;

  events.forEach((e, i) => {
    const bName =
      e.type === "commit" ? e.branch : e.type === "branch" ? e.name : e.to;
    const isMainline =
      bName === "main" ||
      (e.type === "merge" && e.to === "main") ||
      (e.type === "commit" && e.tag);

    if (isMainline || branchesOnCurrentY.has(bName)) {
      currentY += rowHeight;
      branchesOnCurrentY = new Set();
    }

    branchesOnCurrentY.add(bName);
    const y = currentY;

    const t = (i / (events.length - 1 || 1)) * Math.PI * 2;
    const xr =
      4 * Math.sin(fx * t) * Math.cos(fy * t + cw) +
      1.5 * Math.sin(fz * t * 0.5);
    const yr = 2 * Math.cos(fy * t + fx * 0.2) * Math.sin(fz * t + cw);
    const zr =
      4 * Math.sin(fz * t) * Math.cos(fx * t + cw) +
      1.5 * Math.cos(fy * t * 1.5);
    const coordString = `(${xr.toFixed(2)}i, ${yr.toFixed(2)}i, ${zr.toFixed(2)}i)`;

    if (e.type === "branch") {
      const parentCol = branchColumns[e.parent] ?? 0;
      branchColumns[e.name] = nextCol++;
      const col = branchColumns[e.name];
      const parentY = activeBranchY[e.parent];
      lines.push({
        x1: parentCol * branchSpacing + padding,
        y1: parentY,
        x2: col * branchSpacing + padding,
        y2: y,
        color:
          branchData.find((b) => b.name === e.name)?.color ||
          (isDark ? "#555" : "#ccc"),
      });
      activeBranchY[e.name] = y;
    } else if (e.type === "commit") {
      const col = branchColumns[e.branch] ?? 0;
      const prevY = activeBranchY[e.branch];
      if (prevY !== undefined && prevY !== y) {
        lines.push({
          x1: col * branchSpacing + padding,
          y1: prevY,
          x2: col * branchSpacing + padding,
          y2: y,
          color:
            branchData.find((b) => b.name === e.branch)?.color ||
            (isDark ? "#555" : "#ccc"),
        });
      }
      nodes.push({
        x: col * branchSpacing + padding,
        y,
        tag: e.tag,
        color:
          branchData.find((b) => b.name === e.branch)?.color ||
          (isDark ? "#eee" : "#333"),
        coord: coordString,
      });
      activeBranchY[e.branch] = y;
    } else if (e.type === "merge") {
      const fromCol = branchColumns[e.from] ?? 0;
      const toCol = branchColumns[e.to] ?? 0;
      const prevFromY = activeBranchY[e.from];
      const prevToY = activeBranchY[e.to];
      if (prevFromY !== undefined) {
        lines.push({
          x1: fromCol * branchSpacing + padding,
          y1: prevFromY,
          x2: toCol * branchSpacing + padding,
          y2: y,
          color:
            branchData.find((b) => b.name === e.from)?.color ||
            (isDark ? "#eee" : "#333"),
        });
      }
      if (prevToY !== undefined && prevToY !== y) {
        lines.push({
          x1: toCol * branchSpacing + padding,
          y1: prevToY,
          x2: toCol * branchSpacing + padding,
          y2: y,
          color:
            branchData.find((b) => b.name === e.to)?.color ||
            (isDark ? "#555" : "#ccc"),
        });
      }
      nodes.push({
        x: toCol * branchSpacing + padding,
        y,
        tag: e.tag,
        color:
          branchData.find((b) => b.name === e.to)?.color ||
          (isDark ? "#eee" : "#333"),
        isMerge: true,
        coord: coordString,
      });
      activeBranchY[e.to] = y;
      activeBranchY[e.from] = y;
    }
  });

  const height = currentY + padding * 2;

  return (
    <svg width="100%" height={height} className={styles.svg}>
      <g>
        {lines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={l.color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.isMerge ? 4 : 5}
              fill={isDark ? "#121212" : "#fff"}
              stroke={node.color}
              strokeWidth="2"
            />
            <text
              x="100%"
              y={node.y + 4}
              textAnchor="end"
              fill={isDark ? "#555" : "#bbb"}
              className={styles.coordText}
            >
              {node.coord}
            </text>
            {node.tag && (
              <g transform={`translate(${node.x + 12}, ${node.y - 12})`}>
                <rect
                  x="0"
                  y="-14"
                  width={node.tag.length * 8 + 8}
                  height="18"
                  rx="4"
                  fill={isDark ? "#333" : "#eee"}
                />
                <text
                  x="4"
                  y="0"
                  fill={isDark ? "#eee" : "#333"}
                  className={styles.tagText}
                >
                  v{node.tag}
                </text>
              </g>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}
