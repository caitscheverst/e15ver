import { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import "./App.css";
import { GitNarrativeAnimator } from "./GitNarrativeAnimator";
import { MathComponent } from "./MathComponent";
import { GitLogVisualizer } from "./GitLogVisualizer";
import type { GitBranch, GitEvent } from "./types";

function App() {
  const [isDark, setIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };
    themeQuery.addEventListener("change", handleThemeChange);
    return () => themeQuery.removeEventListener("change", handleThemeChange);
  }, []);

  const [gitEvents, setGitEvents] = useState<GitEvent[]>([
    { type: "commit", branch: "main", message: "Initial commit", tag: "1.2.0" },
    { type: "branch", name: "feature/login", parent: "main" },
    { type: "commit", branch: "feature/login", message: "Add login form" },
    { type: "merge", from: "feature/login", to: "main" },
    {
      type: "commit",
      branch: "main",
      message: "Update sidebar docs",
      tag: "1.2.1",
    },
  ]);

  const versionPath = useMemo(() => {
    const tags: string[] = [];
    gitEvents.forEach((e) => {
      if (e.type === "commit" && e.tag) tags.push(e.tag);
      if (e.type === "merge" && e.tag) tags.push(e.tag);
    });
    return Array.from(new Set(tags)).sort((a, b) => {
      const pa = a.split(".").map(Number);
      const pb = b.split(".").map(Number);
      for (let i = 0; i < 3; i++) {
        if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
      }
      return 0;
    });
  }, [gitEvents]);

  const branches = useMemo(() => {
    const bMap = new Map<string, GitBranch>();
    const branchCurrentIndex = new Map<string, number>();

    gitEvents.forEach((e, idx) => {
      if (e.type === "branch") {
        const distinctColors = [
          "#6366f1",
          "#ec4899",
          "#f59e0b",
          "#10b981",
          "#3b82f6",
          "#8b5cf6",
          "#ef4444",
          "#06b6d4",
          "#f97316",
          "#84cc16",
        ];
        const color = distinctColors[idx % distinctColors.length];

        bMap.set(e.name, {
          name: e.name,
          commits: 0,
          startScalar: idx, // Reuse as index
          endScalar: idx, // Reuse as index
          color,
        });
        branchCurrentIndex.set(e.name, idx);
      } else if (e.type === "commit") {
        const b = bMap.get(e.branch);
        if (b) {
          b.commits += 1;
          b.endScalar = idx;
        }
        branchCurrentIndex.set(e.branch, idx);
      } else if (e.type === "merge") {
        const fromB = bMap.get(e.from);
        if (fromB) {
          fromB.endScalar = idx;
        }
        branchCurrentIndex.set(e.to, idx);
        branchCurrentIndex.set(e.from, idx);
      }
    });

    return Array.from(bMap.values());
  }, [gitEvents, versionPath]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const loopLineRef = useRef<THREE.Line | null>(null);
  const orbitGroupRef = useRef<THREE.Group | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const realGroupRef = useRef<THREE.Group | null>(null);

  const parseVersion = (str: string) => {
    const parts = str.split(".").map(Number);
    const x = parts[0] || 0;
    const y = parts[1] || 0;
    const z = parts[2] || 0;
    const scalar = x * 10000 + y * 100 + z;
    return { x, y, z, scalar };
  };

  const computeLoop = (start: any, _end: any, totalCommits: number) => {
    const N = 3000;
    const positions = [];
    const colors = [];

    const fx = start.x + 1.2;
    const fy = start.y + 2.3;
    const fz = start.z + 3.4;
    const cw = totalCommits / 15;

    for (let i = 0; i < N; i++) {
      const t = (i / (N - 1)) * Math.PI * 2;
      const progress = (t / (2 * Math.PI)) * 10;

      const xr =
        4 * Math.sin(fx * t) * Math.cos(fy * t + cw) +
        1.5 * Math.sin(fz * t * 0.5);
      const yr =
        5 - progress + 2 * Math.cos(fy * t + fx * 0.2) * Math.sin(fz * t + cw);
      const zr =
        4 * Math.sin(fz * t) * Math.cos(fx * t + cw) +
        1.5 * Math.cos(fy * t * 1.5);

      positions.push(xr, yr, zr);

      const imagMag = Math.min(1, Math.sqrt(xr * xr + zr * zr) / 8);
      const intensity = isDark ? 0.5 + 0.5 * imagMag : 0.5 - 0.5 * imagMag;
      const color = new THREE.Color(intensity, intensity, intensity);
      colors.push(color.r, color.g, color.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    return new THREE.Line(geometry, material);
  };

  //  const generateBranchOrbit = (
  //    yAnchor: number,
  //    commits: number,
  //    colorStr: string,
  //  ) => {
  //    const positions = [];
  //    const material = new THREE.LineBasicMaterial({
  //      color: new THREE.Color(colorStr),
  //    });
  //
  //    for (let n = 0; n < commits * 10; n++) {
  //      const angleX = (Math.PI * n) / 10;
  //      const angleY = ((Math.PI / 2) * n) / 10;
  //      const angleZ = ((Math.PI / 3) * n) / 10;
  //
  //      const ox = Math.cos(angleX);
  //      const oy = Math.cos(angleY);
  //      const oz = Math.cos(angleZ);
  //
  //      positions.push(ox, 5 - yAnchor + oy, oz);
  //    }
  //
  //    const geom = new THREE.BufferGeometry();
  //    geom.setAttribute(
  //      "position",
  //      new THREE.Float32BufferAttribute(positions, 3),
  //    );
  //
  //    return new THREE.Line(geom, material);
  //  };

  const generate = () => {
    if (
      !sceneRef.current ||
      !orbitGroupRef.current ||
      !markerGroupRef.current ||
      !realGroupRef.current
    )
      return;

    const sortedPath = [...versionPath].sort(
      (a, b) => parseVersion(a).scalar - parseVersion(b).scalar,
    );

    if (sortedPath.length === 0) return;

    const start = parseVersion(sortedPath[0]);
    const end = parseVersion(sortedPath[sortedPath.length - 1]);
    const totalCommits = branches.reduce((sum, b) => sum + b.commits, 0);

    orbitGroupRef.current.clear();
    markerGroupRef.current.clear();
    realGroupRef.current.clear();

    if (loopLineRef.current) {
      sceneRef.current.remove(loopLineRef.current);
    }

    const loopLine = computeLoop(start, end, totalCommits);
    loopLineRef.current = loopLine;
    sceneRef.current.add(loopLine);

    // Add "Real" polyline connecting version milestones
    const realPts: THREE.Vector3[] = [];
    const totalEvents = gitEvents.length || 1;
    const fx = start.x + 1.2;
    const fy = start.y + 2.3;
    const fz = start.z + 3.4;
    const cw = totalCommits / 15;

    gitEvents.forEach((e, idx) => {
      if (e.type === "commit" && e.tag) {
        const t = (idx / (totalEvents - 1)) * Math.PI * 2;
        const progress = (t / (2 * Math.PI)) * 10;
        const xr =
          4 * Math.sin(fx * t) * Math.cos(fy * t + cw) +
          1.5 * Math.sin(fz * t * 0.5);
        const yr =
          5 -
          progress +
          2 * Math.cos(fy * t + fx * 0.2) * Math.sin(fz * t + cw);
        const zr =
          4 * Math.sin(fz * t) * Math.cos(fx * t + cw) +
          1.5 * Math.cos(fy * t * 1.5);
        realPts.push(new THREE.Vector3(xr, yr, zr));
      }
    });

    if (realPts.length > 1) {
      const realGeom = new THREE.BufferGeometry().setFromPoints(realPts);
      const realMat = new THREE.LineDashedMaterial({
        color: isDark ? 0x666666 : 0xaaaaaa,
        dashSize: 0.3,
        gapSize: 0.2,
        opacity: 0.4,
        transparent: true,
      });
      const realLine = new THREE.Line(realGeom, realMat);
      realLine.computeLineDistances();
      realGroupRef.current.add(realLine);
    }

    const sphereGeom = new THREE.SphereGeometry(0.15, 16, 16);
    const versionMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const branchMat = new THREE.MeshBasicMaterial({ color: 0xcc0000 });

    const createLabel = (text: string, color: string) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Group();

      canvas.width = 256;
      canvas.height = 64;
      ctx.fillStyle = color;
      ctx.font = "Bold 24px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 128, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(2, 1, 1);
      return sprite;
    };

    // Markers for versions
    gitEvents.forEach((e, idx) => {
      if (e.type === "commit" && e.tag) {
        const t = (idx / (totalEvents - 1)) * Math.PI * 2;
        const progress = (t / (2 * Math.PI)) * 10;
        const xr =
          4 * Math.sin(fx * t) * Math.cos(fy * t + cw) +
          1.5 * Math.sin(fz * t * 0.5);
        const yr =
          5 -
          progress +
          2 * Math.cos(fy * t + fx * 0.2) * Math.sin(fz * t + cw);
        const zr =
          4 * Math.sin(fz * t) * Math.cos(fx * t + cw) +
          1.5 * Math.cos(fy * t * 1.5);

        const sphere = new THREE.Mesh(sphereGeom, versionMat);
        sphere.position.set(xr, yr, zr);
        markerGroupRef.current?.add(sphere);

        const label = createLabel(`v${e.tag}`, isDark ? "#ffffff" : "#000000");
        label.position.set(xr + 0.5, yr + 0.3, zr);
        markerGroupRef.current?.add(label);
      }
    });

    // Markers for branches
    branches.forEach((branch) => {
      const tStart =
        (branch.startScalar / (totalEvents - 1 || 1)) * Math.PI * 2;
      const tEnd = (branch.endScalar / (totalEvents - 1 || 1)) * Math.PI * 2;

      const orbitPos = [];
      const branePos = [];
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(branch.color),
      });
      const braneMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(branch.color),
        transparent: true,
        opacity: 0.15,
      });

      const manifoldPoint = (tVal: number) => {
        const progress = (tVal / (2 * Math.PI)) * 10;
        const x =
          4 * Math.sin(fx * tVal) * Math.cos(fy * tVal + cw) +
          1.5 * Math.sin(fz * tVal * 0.5);
        const y =
          5 -
          progress +
          2 * Math.cos(fy * tVal + fx * 0.2) * Math.sin(fz * tVal + cw);
        const z =
          4 * Math.sin(fz * tVal) * Math.cos(fx * tVal + cw) +
          1.5 * Math.cos(fy * tVal * 1.5);
        return new THREE.Vector3(x, y, z);
      };

      const numPts = branch.commits * 1000; // Higher density for smooth curves
      for (let n = 0; n < numPts; n++) {
        const ratio = n / (numPts - 1 || 1);
        const t = tStart + ratio * (tEnd - tStart);

        const center = manifoldPoint(t);
        const next = manifoldPoint(t + 0.01);
        const tangent = next.clone().sub(center).normalize();

        let helper = new THREE.Vector3(0, 1, 0);
        if (Math.abs(tangent.y) > 0.9) helper = new THREE.Vector3(1, 0, 0);
        const binormal = new THREE.Vector3()
          .crossVectors(tangent, helper)
          .normalize();
        const normal = new THREE.Vector3()
          .crossVectors(tangent, binormal)
          .normalize();

        // Advance the helix angle around the normal/binormal plane (perpendicular to tangent)
        // More commits = more rotations along the branch length
        const turnsPerBranch = 1 + branch.commits * 1.5;
        const angle = (n / numPts) * turnsPerBranch * 2 * Math.PI;

        // Radius grows exponentially from 0 at branch origin to max at tip, scaled by commit count
        const maxRadius = 0.15 + branch.commits;
        const k = 5.0; // steepness of exponential curve
        const radius =
          (maxRadius * (Math.exp(k * ratio) - 1)) / (Math.exp(k) - 1);

        // Displace in the normal/binormal plane — both axes are perpendicular to the tangent,
        // so the helix wraps fully around the main curve
        const ox = Math.cos(angle) * radius;
        const oz = Math.sin(angle) * radius;

        const px = center.x + normal.x * ox + binormal.x * oz;
        const py = center.y + normal.y * ox + binormal.y * oz;
        const pz = center.z + normal.z * ox + binormal.z * oz;

        orbitPos.push(px, py, pz);
        branePos.push(center.x, center.y, center.z);
        branePos.push(px, py, pz);
      }

      const orbitGeom = new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(orbitPos, 3),
      );
      orbitGroupRef.current?.add(new THREE.Line(orbitGeom, orbitMaterial));

      const braneGeom = new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(branePos, 3),
      );
      orbitGroupRef.current?.add(
        new THREE.LineSegments(braneGeom, braneMaterial),
      );

      // Keep the marker at the "latest" point of the branch (the merge/end)
      const tFinal = tEnd;
      const progressFinal = (tFinal / (2 * Math.PI)) * 10;
      const ex =
        4 * Math.sin(fx * tFinal) * Math.cos(fy * tFinal + cw) +
        1.5 * Math.sin(fz * tFinal * 0.5);
      const ey =
        5 -
        progressFinal +
        2 * Math.cos(fy * tFinal + fx * 0.2) * Math.sin(fz * tFinal + cw);
      const ez =
        4 * Math.sin(fz * tFinal) * Math.cos(fx * tFinal + cw) +
        1.5 * Math.cos(fy * tFinal * 1.5);

      const sphere = new THREE.Mesh(sphereGeom, branchMat);
      sphere.position.set(ex, ey, ez);
      markerGroupRef.current?.add(sphere);

      const label = createLabel(branch.name, branch.color);
      label.position.set(ex + 0.5, ey + 0.3, ez);
      markerGroupRef.current?.add(label);
    });
  };

  useEffect(() => {
    generate();
  }, [versionPath, branches]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x121212 : 0xffffff);
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
    camera.position.set(5, 5, 20); // Adjusted camera for downward flow
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(canvasRef.current.clientWidth, 800);
    rendererRef.current = renderer;

    const orbitGroup = new THREE.Group();
    orbitGroupRef.current = orbitGroup;
    scene.add(orbitGroup);

    const markerGroup = new THREE.Group();
    markerGroupRef.current = markerGroup;
    scene.add(markerGroup);

    const realGroup = new THREE.Group();
    realGroupRef.current = realGroup;
    scene.add(realGroup);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (scene) {
        scene.rotation.y += 0.001;
        // scene.rotation.x += 0.001;
        // scene.rotation.z += 0.001;
      }
      renderer.render(scene, camera);
    };
    animate();

    generate(); // Initial generation

    const handleResize = () => {
      if (canvasRef.current && rendererRef.current) {
        rendererRef.current.setSize(canvasRef.current.clientWidth, 800);
      }
    };

    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeCanvasChange = (e: MediaQueryListEvent) => {
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(
          e.matches ? 0x121212 : 0xffffff,
        );
      }
    };

    window.addEventListener("resize", handleResize);
    themeQuery.addEventListener("change", handleThemeCanvasChange);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      themeQuery.removeEventListener("change", handleThemeCanvasChange);
      renderer.dispose();
    };
  }, []);

  const branchPrefixes = [
    "feature",
    "bugfix",
    "hotfix",
    "chore",
    "refactor",
    "docs",
    "style",
  ];
  const branchNouns = [
    "login",
    "auth",
    "sidebar",
    "api",
    "schema",
    "ui",
    "rendering",
    "engine",
    "manifold",
    "quantum",
    "detector",
    "bridge",
    "interface",
    "protocol",
    "database",
    "cache",
    "logger",
  ];

  const randomiseGraph = () => {
    const newEvents: GitEvent[] = [];
    let currentV = {
      x: Math.floor(Math.random() * 5),
      y: Math.floor(Math.random() * 5),
      z: Math.floor(Math.random() * 5),
    };
    const getV = () => `${currentV.x}.${currentV.y}.${currentV.z}`;

    const numSprints = Math.floor(Math.random() * 3) + 2; // 2-4 sprints

    for (let s = 0; s < numSprints; s++) {
      const tagName = getV();
      // 1. Commit vnum to main
      newEvents.push({
        type: "commit",
        branch: "main",
        message: s === 0 ? "Initial commit" : `Release ${tagName}`,
        tag: tagName,
      });

      // 2. Branch 1-3 branches
      const numBranches = Math.floor(Math.random() * 3) + 1;
      const sprintBranches: string[] = [];

      for (let b = 0; b < numBranches; b++) {
        const branchName = `${branchPrefixes[Math.floor(Math.random() * branchPrefixes.length)]}/${branchNouns[Math.floor(Math.random() * branchNouns.length)]}-${s}-${b}`;
        newEvents.push({ type: "branch", name: branchName, parent: "main" });
        sprintBranches.push(branchName);
      }

      // 3. Commit 2-4 commits to each branch
      sprintBranches.forEach((bName) => {
        const numCommits = Math.floor(Math.random() * 3) + 2;
        for (let c = 0; c < numCommits; c++) {
          newEvents.push({
            type: "commit",
            branch: bName,
            message: `Work on ${bName}`,
          });
        }
      });

      // 4. Merge all branches back to main
      sprintBranches.forEach((bName) => {
        newEvents.push({ type: "merge", from: bName, to: "main" });
      });

      // Increment version for next milestone
      const rand = Math.random();
      if (rand < 0.2) currentV.x++;
      else if (rand < 0.5) currentV.y++;
      else currentV.z++;
    }

    // Final Release tag
    const finalTag = getV();
    newEvents.push({
      type: "commit",
      branch: "main",
      message: `Final Release ${finalTag}`,
      tag: finalTag,
    });

    setGitEvents(newEvents);
  };

  const randomSubtitles = [
    "Your estimates aren't real - why should your version numbers be any different?",
    "Versioning that reflects your project's true complexity.",
    "Who said version numbers have to be integers?",
    "Source control is probabilistic - your version numbers should be too.",
    "Simultaneously released and unreleased until someone checks the changelog.",
    "Your code is in superposition between working and broken - why not your version numbers?",
    "Abandon semantic versioning, embrace mathematical chaos.",
    "MAJOR.MINOR.PATCH was a bold assumption about the nature of reality.",
    "Your CI pipeline doesn't know what version this is either.",
    "Simultaneously shipped and broken until someone checks prod.",
    "Finally, a version number that captures how you actually feel about this codebase.",
    "If your version number fits in a semver string, you're not thinking big enough.",
    "The version is defined. The branch it's on is a superposition of opinions.",
    "It's still semantic! ...technically.",
  ];

  const [randSub, setRandSub] = useState(
    Math.floor(Math.random() * randomSubtitles.length),
  );

  return (
    <div className="App">
      <header>
        <h1>e15ver: Expectation-Value Versioning</h1>
        <p className="subtitle">
          {randomSubtitles[randSub]}
          <button
            onClick={() => {
              setRandSub(Math.floor(Math.random() * randomSubtitles.length));
            }}
          >
            <img src="src/assets/icons/casino.png"></img>
          </button>
        </p>
        <section id="demo">
          <GitNarrativeAnimator isDark={isDark} />
        </section>
      </header>

      <section id="abstract">
        <h2>Abstract</h2>
        <div className="subSection">
          We introduce e15ver, a versioning paradigm based on the
          quantum-mechanical expectation value. Instead of treating version
          numbers as discrete, measured states, e15ver models each branch as a
          state vector evolving along a triple-complex manifold{" "}
          <MathComponent math="\mathbb{C}^3" />. This approach provides a
          continuous, differentiable, and scientifically rigorous representation
          of version evolution.
        </div>
        <div>
          <em>note: please do not take any of this seriously.</em>
        </div>
      </section>

      <section id="theory">
        <h2>1. Theoretical Framework</h2>

        <h3>1.1 Expectation-Value Versioning (e15ver)</h3>
        <p>
          In e15ver, a branch's version number is not a fixed integer triple but
          an expectation value derived from its evolving state vector. This
          mirrors the quantum-mechanical notion of an observable whose value is
          predicted before measurement.
        </p>

        <h3>1.2 The Version Transition Loop</h3>
        <div className="subSection">
          The manifold is parameterised by{" "}
          <MathComponent math="t \in [0, 2\pi]" />, with frequencies seeded from
          the version digits <MathComponent math="(v_x, v_y, v_z)" /> and a
          commit-count phase shift <MathComponent math="\omega_c = C/15" />:
        </div>
        <MathComponent
          displayMode={true}
          math="\mathbf{L}(t) = \begin{pmatrix} 4\sin(f_x t)\cos(f_y t + \omega_c) + \tfrac{3}{2}\sin\!\left(\tfrac{f_z t}{2}\right) \\[4pt] 5 - \tfrac{5}{\pi}t + 2\cos\!\left(f_y t + \tfrac{f_x}{5}\right)\sin(f_z t + \omega_c) \\[4pt] 4\sin(f_z t)\cos(f_x t + \omega_c) + \tfrac{3}{2}\cos\!\left(\tfrac{3 f_y t}{2}\right) \end{pmatrix}"
        />
        <p>
          where <MathComponent math="f_x = v_x + 1.2" />,{" "}
          <MathComponent math="f_y = v_y + 2.3" />,{" "}
          <MathComponent math="f_z = v_z + 3.4" />. The curve intersects real
          space only at tagged release commits, ensuring that intermediate
          states remain uncollapsed.
        </p>

        <h3>1.3 Branch Brane Helix</h3>
        <p>
          Each branch is rendered as a helix <MathComponent math="\mathbf{B}" />{" "}
          wound around <MathComponent math="\mathbf{L}" /> in the Frenet
          normal-binormal frame, with radius growing exponentially along the
          branch and scaling with commit count <MathComponent math="c" />:
        </p>
        <MathComponent
          displayMode={true}
          math="\mathbf{B}(\tau) = \mathbf{L}(t(\tau)) + r(\tau)\Bigl[\cos\theta(\tau)\,\hat{\mathbf{n}} + \sin\theta(\tau)\,\hat{\mathbf{b}}\Bigr]"
        />
        <MathComponent
          displayMode={true}
          math="r(\tau) = (0.15 + c)\,\frac{e^{5\tau}-1}{e^5-1}, \qquad \theta(\tau) = 2\pi(1 + 1.5c)\,\tau"
        />
        <p>
          The exponential envelope ensures branches hug the manifold at their
          origin and flare outward as they diverge, while{" "}
          <MathComponent math="\theta" /> advances through{" "}
          <MathComponent math="1 + 1.5c" /> full rotations — so longer branches
          wind more tightly before merging back.
        </p>
      </section>

      <section id="examples">
        <h2>Examples</h2>
        <p>
          In e15ver, each branch's displayed version is the expectation value of
          its future release state, derived from its position on the version
          manifold and its commit-phase evolution.
        </p>
      </section>

      <section id="interactive">
        <h2>Interactive e15ver Visualisation</h2>
        <div>
          The diagram below maps a randomised trivial git history onto the
          e15ver version manifold. Branches sprout and merge across the
          triple-complex state space.
        </div>

        <div id="vis-layout">
          <aside id="sidebar">
            <div className="section-header">
              <h3>
                Git History
                <br />
                <small>(reverse order)</small>
              </h3>
              <button onClick={randomiseGraph} className="random-btn">
                Randomise Tree
              </button>
            </div>

            <div
              id="gitgraph-container"
              style={{ padding: "0 10px", height: "100%", overflowY: "auto" }}
            >
              <GitLogVisualizer
                events={gitEvents}
                branchData={branches}
                isDark={isDark}
                startVersion={parseVersion(versionPath[0] || "1.0.0")}
                totalCommits={branches.reduce((sum, b) => sum + b.commits, 0)}
              />
            </div>

            <div className="metadata">
              <h4>Active Versions</h4>
              <ul className="version-list">
                {versionPath.map((v) => (
                  <li key={v}>
                    <code>v{v}</code>
                  </li>
                ))}
              </ul>
              <h4>Computed Orbits</h4>
              <ul className="branch-summary">
                {branches.map((b) => (
                  <li key={b.name}>
                    <strong>{b.name}</strong>: {b.commits} ops
                    <br />
                    <small>
                      Real Span: {b.startScalar} - {b.endScalar}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <main id="viz-main">
            <div id="vizContainer">
              <canvas id="threeCanvas" ref={canvasRef}></canvas>
              <div id="vizCaption">
                manifold expectation value
                <br />
                <i>"the downward spiral"</i>
              </div>
            </div>
          </main>
        </div>
      </section>

      <footer>
        <p>© 2026 "e15ver" (Expectation Value) Versioning Research Group</p>
        <p>Logo attributions with thanks:</p>
        <p>
          <a href="https://www.flaticon.com/free-icons/psi" title="psi icons">
            Psi icons created by Freepik - Flaticon
          </a>
        </p>
        <p>
          <a href="https://www.flaticon.com/free-icons/dice" title="dice icons">
            Dice icons created by Hilmy Abiyyu A. - Flaticon
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
