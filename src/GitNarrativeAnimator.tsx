import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./GitNarrativeAnimator.module.css";

const BRANCHES = [
  "feature/auth",
  "fix/memory-leak",
  "refactor/core",
  "chore/deps",
  "feature/dark-mode",
  "fix/race-condition",
  "feat/analytics",
  "hotfix/csrf",
  "feature/i18n",
  "fix/off-by-one",
];

const COMMITS = [
  "add initial implementation",
  "fix edge case in handler",
  "add unit tests",
  "update type definitions",
  "handle error state",
  "refactor for clarity",
  "remove dead code",
  "wip: rough draft",
  "address review feedback",
  "tweak styling",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function GitNarrativeAnimator({ isDark }: { isDark: boolean }) {
  const [logLines, setLogLines] = useState<{ id: number; text: string }[]>([
    { id: 0, text: "v1.2.3 published" },
  ]);
  const [stableVer, setStableVer] = useState<[number, number, number]>([
    1, 2, 3,
  ]);
  const [imagParts, setImagParts] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);

  const nextId = useRef(1);
  const narrativePhaseRef = useRef<"stable" | "committing" | "merging">(
    "stable",
  );
  const visualModeRef = useRef<"stable" | "branching" | "collapsing">("stable");
  const t0Ref = useRef(Date.now());
  const satRef = useRef(0);
  const imagRef = useRef<[number, number, number]>([0, 0, 0]);
  const hueRef = useRef(0);
  const branchNameRef = useRef("");
  const commitsDoneRef = useRef(0);
  const commitsTargetRef = useRef(0);
  const verRef = useRef<[number, number, number]>([1, 2, 3]);

  const addLine = useCallback((text: string) => {
    const id = nextId.current++;
    setLogLines((prev) => [...prev.slice(-4), { id, text }]);
  }, []);

  // Single animation ticker — drives both oscillation and the collapse decay
  useEffect(() => {
    const id = setInterval(() => {
      const mode = visualModeRef.current;
      if (mode === "stable") return;

      if (mode === "branching") {
        const t = (Date.now() - t0Ref.current) / 1000;
        imagRef.current = [
          parseFloat((Math.sin(t * 1.1) * 0.8).toFixed(2)),
          parseFloat((Math.cos(t * 0.7 + 1.0) * 0.6).toFixed(2)),
          parseFloat((Math.sin(t * 1.3 + 2.0) * 0.9).toFixed(2)),
        ];
        hueRef.current = (hueRef.current + 1) % 360;
        satRef.current = Math.min(90, satRef.current + 4);
      } else if (mode === "collapsing") {
        imagRef.current = [
          imagRef.current[0] * 0.88,
          imagRef.current[1] * 0.88,
          imagRef.current[2] * 0.88,
        ];
        satRef.current = satRef.current * 0.88;
        if (satRef.current < 0.5) {
          satRef.current = 0;
          imagRef.current = [0, 0, 0];
          visualModeRef.current = "stable";
        }
      }

      setImagParts([...imagRef.current]);
      setSaturation(satRef.current);
      setHue(hueRef.current);
    }, 50);
    return () => clearInterval(id);
  }, []);

  // Narrative stepper
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (narrativePhaseRef.current === "stable") {
        const name = pick(BRANCHES);
        branchNameRef.current = name;
        commitsDoneRef.current = 0;
        commitsTargetRef.current = 2 + Math.floor(Math.random() * 3);
        addLine(`new branch: ${name}`);
        t0Ref.current = Date.now();
        visualModeRef.current = "branching";
        narrativePhaseRef.current = "committing";
      } else if (narrativePhaseRef.current === "committing") {
        addLine(`commit → ${branchNameRef.current}: ${pick(COMMITS)}`);
        commitsDoneRef.current++;
        if (commitsDoneRef.current >= commitsTargetRef.current) {
          narrativePhaseRef.current = "merging";
        }
      } else if (narrativePhaseRef.current === "merging") {
        const [maj, min, pat] = verRef.current;
        const newVer: [number, number, number] = [maj, min, pat + 1];
        verRef.current = newVer;
        const vStr = newVer.join(".");
        addLine(`merge ${branchNameRef.current} → main`);
        setStableVer(newVer);
        visualModeRef.current = "collapsing";
        setTimeout(() => addLine(`tag: v${vStr}`), 700);
        narrativePhaseRef.current = "stable";
      }
    }, 1500);
    return () => clearInterval(intervalId);
  }, [addLine]);

  // Lightness interpolates from white/black (sat=0) to mid (sat=90)
  const baseLightness = isDark ? 100 : 0;
  const componentColors = [0, 120, 240].map((off) => {
    const h = (hue + off) % 360;
    const l = baseLightness + (saturation / 90) * (58 - baseLightness);
    return `hsl(${h}, ${saturation.toFixed(1)}%, ${l.toFixed(1)}%)`;
  });

  return (
    <div className={styles.container}>
      <div className={styles.narrative}>
        {logLines.map((line, i) => {
          const age = logLines.length - 1 - i;
          const opacity = Math.max(0.1, 1 - age * 0.18);
          return (
            <div key={line.id} className={styles.logLine} style={{ opacity }}>
              <span className={styles.prompt}>$</span>
              {line.text}
            </div>
          );
        })}
      </div>

      <div className={styles.verDisplay}>
        <div className={styles.verLabel}>e15ver</div>
        <div className={styles.verReal}>v{stableVer.join(".")}</div>
        <div className={styles.verComplex}>
          v
          {stableVer.map((v, i) => {
            const im = imagParts[i];
            const sign = im >= 0 ? "+" : "−";
            const imStr = im === 0 ? "0" : Math.abs(im).toFixed(2);
            return (
              <span key={i}>
                <span style={{ color: componentColors[i] }}>
                  ({v}
                  {sign}
                  {imStr}i)
                </span>
                {i < 2 && "."}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
