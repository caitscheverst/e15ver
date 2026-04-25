export * from './types.js';
export * from './math.js';
export { GitRepository, getRepositoryState } from './git.js';

import { calculateE15ver } from './math.js';
import { getRepositoryState } from './git.js';

/**
 * Main entry point: calculate e15ver for a given repository
 * @param repoPath Path to the git repository (default: current directory)
 * @returns E15verResult with calculated version and metadata
 */
export async function calculateE15verForRepo(repoPath: string = '.') {
  const state = await getRepositoryState(repoPath);
  return calculateE15ver(state);
}
