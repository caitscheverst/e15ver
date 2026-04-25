import { useEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

export function MathComponent({
  math,
  displayMode = false,
}: {
  math: string;
  displayMode?: boolean;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      katex.render(math, containerRef.current, {
        displayMode,
        throwOnError: false,
      });
    }
  }, [math, displayMode]);

  return <span ref={containerRef} />;
}
