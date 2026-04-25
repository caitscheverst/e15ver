import type { Version, GitRepositoryState, E15verResult } from './types.js';

/**
 * Parse a semver-like string into version components
 * Handles "1.2.3", "v1.2.3", "1.2", etc.
 */
export function parseVersion(str: string): Version {
  const cleaned = str.replace(/^v/, '').split('.');
  const x = parseInt(cleaned[0]) || 0;
  const y = parseInt(cleaned[1]) || 0;
  const z = parseInt(cleaned[2]) || 0;
  const scalar = x * 10000 + y * 100 + z;
  return { x, y, z, scalar };
}

/**
 * Format a version object back to string
 */
export function formatVersion(v: Version): string {
  return `${v.x}.${v.y}.${v.z}`;
}

/**
 * Calculate the manifold position at parameter t
 * This is the parametric curve that branches orbit around
 */
export function manifoldPoint(
  t: number,
  fx: number,
  fy: number,
  fz: number,
  commitPhaseShift: number,
): { x: number; y: number; z: number } {
  const progress = (t / (2 * Math.PI)) * 10;

  const x =
    4 * Math.sin(fx * t) * Math.cos(fy * t + commitPhaseShift) +
    1.5 * Math.sin((fz * t) / 2);

  const y =
    5 -
    progress +
    2 * Math.cos(fy * t + fx * 0.2) * Math.sin(fz * t + commitPhaseShift);

  const z =
    4 * Math.sin(fz * t) * Math.cos(fx * t + commitPhaseShift) +
    1.5 * Math.cos((3 * fy * t) / 2);

  return { x, y, z };
}

/**
 * Calculate expectation value for current git state
 * This derives a version number from the repository's current state
 */
export function calculateE15ver(
  repoState: GitRepositoryState,
): E15verResult {
  const mainBranch = repoState.branches.find((b) => b.isMain);
  const mainCommits = mainBranch?.commits || 0;
  const totalBranches = repoState.branches.length;
  const totalCommits = repoState.totalCommits;

  // If there are tags, use the most recent one as a seed
  // Otherwise, derive the version purely from commit structure
  const tags = Array.from(repoState.tags.keys());
  let baseVersion: Version;

  if (tags.length > 0) {
    // Use most recent tag as reference
    baseVersion = parseVersion(tags[tags.length - 1]);
  } else {
    // No tags: derive base version from commit/branch structure
    // This makes untagged repos still produce meaningful versions
    const vx = Math.floor(totalCommits / 20); // Major bump every ~20 commits
    const vy = Math.floor((totalCommits % 20) / 5); // Minor bump every ~5 commits
    const vz = totalCommits % 5; // Patch increments with each commit batch
    baseVersion = { x: Math.max(vx, 1), y: vy, z: vz, scalar: 0 };
    baseVersion.scalar =
      baseVersion.x * 10000 + baseVersion.y * 100 + baseVersion.z;
  }

  // Calculate frequency components from version
  const fx = baseVersion.x + 1.2;
  const fy = baseVersion.y + 2.3;
  const fz = baseVersion.z + 3.4;

  // Commit count phase shift
  const commitPhaseShift = totalCommits / 15;

  // Parameter t represents where we are in the version cycle
  const t = (totalCommits % 100) * 0.1; // Keep in [0, 10]

  // Get manifold position
  const manifold = manifoldPoint(t, fx, fy, fz, commitPhaseShift);

  // Derive version delta from manifold state and branch activity
  const deltaX =
    Math.floor(Math.abs(manifold.x * 10) % 3) === 0 &&
    mainCommits > 3 &&
    totalBranches > 2
      ? 1
      : 0;
  const deltaY =
    Math.floor(Math.abs(manifold.y * 10) % 5) === 0 && mainCommits > 5
      ? 1
      : 0;
  const deltaZ = (totalCommits % 10 >= 5) ? 1 : 0; // Patch increments by activity

  // Calculate the expectation value version
  const expectedVersion: Version = {
    x: baseVersion.x + deltaX,
    y: baseVersion.y + deltaY,
    z: baseVersion.z + deltaZ,
    scalar: 0,
  };
  expectedVersion.scalar =
    expectedVersion.x * 10000 + expectedVersion.y * 100 + expectedVersion.z;

  // Confidence: how "measured" is this state?
  // If tagged: high confidence. If untagged: lower, indicates "superposition"
  const confidence = tags.length > 0 ? 0.8 : 0.4 + Math.random() * 0.2; // Untagged = quantum

  return {
    version: expectedVersion,
    formattedVersion: formatVersion(expectedVersion),
    confidence,
    manifoldPosition: manifold,
    metadata: {
      totalBranches,
      totalCommits,
      mainBranchCommits: mainCommits,
    },
  };
}

/**
 * Alias for compatibility - get expectation value
 */
export function getExpectationValue(repoState: GitRepositoryState): Version {
  return calculateE15ver(repoState).version;
}
