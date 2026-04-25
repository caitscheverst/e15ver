#!/usr/bin/env node

import { calculateE15verForRepo } from "./index.js";

async function main() {
  const repoPath = process.argv[2] || ".";

  try {
    const result = await calculateE15verForRepo(repoPath);

    console.log("+===================================+");
    console.log("| e15ver: Expectation Value Version |");
    console.log("+===================================+");

    console.log(`| 📦 Version: ${result.formattedVersion}`);

    let totalX: string = result.version.x.toString();
    let totalY: string = result.version.y.toString();
    let totalZ: string = result.version.z.toString();

    if (result.manifoldPosition.x > 0) {
      totalX += "+";
    }
    if (result.manifoldPosition.y > 0) {
      totalY += "+";
    }
    if (result.manifoldPosition.z > 0) {
      totalZ += "+";
    }

    totalX += result.manifoldPosition.x.toFixed(3) + "i";
    totalY += result.manifoldPosition.y.toFixed(3) + "i";
    totalZ += result.manifoldPosition.z.toFixed(3) + "i";

    console.log(`|   v(${totalX}).(${totalY}).(${totalZ})`);

    console.log(
      `| 🎯 State Confidence: ${(result.confidence * 100).toFixed(1)}%`,
    );
    console.log(
      `|   (${result.confidence === 1 ? "fully measured" : "in superposition"})`,
    );

    console.log("| 📊 Repository State:");
    console.log(`|   Total Commits: ${result.metadata.totalCommits}`);
    console.log(`|   Active Branches: ${result.metadata.totalBranches}`);
    console.log(
      `|   Main Branch Commits: ${result.metadata.mainBranchCommits}`,
    );

    console.log("| 🌀 Manifold Position:");
    console.log(
      `|   x: ${result.manifoldPosition.x.toFixed(3)}, y: ${result.manifoldPosition.y.toFixed(3)}, z: ${result.manifoldPosition.z.toFixed(3)}`,
    );

    console.log("+===================================+");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`| ❌ Error: ${error.message}`);
    } else {
      console.error("| ❌ Unknown error occurred");
    }
    process.exit(1);
  }
}

main();
