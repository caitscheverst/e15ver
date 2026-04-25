import { SimpleGit, simpleGit } from "simple-git";
import type { GitRepositoryState, GitCommit, GitBranch } from "./types.js";

export class GitRepository {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string = ".") {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  /**
   * Get the current state of the git repository
   */
  async getState(): Promise<GitRepositoryState> {
    const [branches, commits, tags] = await Promise.all([
      this.getBranches(),
      this.getCommits(),
      this.getTags(),
    ]);

    const totalCommits = commits.length;

    return {
      branches,
      commits,
      tags,
      totalCommits,
    };
  }

  /**
   * Get all branches with their commit counts
   */
  private async getBranches(): Promise<GitBranch[]> {
    const branchSummary = await this.git.branch();
    const branches: GitBranch[] = [];

    for (const branch of Object.keys(branchSummary.branches)) {
      const branchInfo = branchSummary.branches[branch];
      const isMain = branch === "main" || branch === "master";

      // Count commits on this branch
      const log = await this.git.log([branch, "--oneline"]);
      const commits = log.total || 0;

      branches.push({
        name: branch,
        commits,
        isMain,
        lastCommitHash: branchInfo.commit,
      });
    }

    return branches.sort((a) => (a.isMain ? -1 : 1)); // Main first
  }

  /**
   * Get all commits in the repository
   */
  private async getCommits(): Promise<GitCommit[]> {
    const log = await this.git.log(["--all"]);
    const commits: GitCommit[] = [];

    for (const entry of log.all) {
      const hash = entry.hash?.slice(0, 7) || "unknown";
      const message = entry.message || "";
      const timestamp = entry.date ? new Date(entry.date).getTime() : 0;

      // Try to determine which branch this commit is on
      try {
        const branches = await this.git.branch([
          "--contains",
          entry.hash,
        ]);
        const branch = Object.keys(branches.branches)[0] || "unknown";

        commits.push({
          hash,
          message,
          branch,
          timestamp,
        });
      } catch {
        // Skip commits we can't determine branch for
      }
    }

    return commits;
  }

  /**
   * Get all tags with their associated commits
   */
  private async getTags(): Promise<Map<string, string>> {
    const tags = new Map<string, string>();

    const tagList = await this.git.tags();
    for (const tag of tagList.all) {
      try {
        const commit = await this.git.revparse([tag]);
        tags.set(tag, commit);
      } catch {
        // Skip tags we can't resolve
      }
    }

    return tags;
  }
}

/**
 * Convenience function to get repository state
 */
export async function getRepositoryState(
  repoPath: string = ".",
): Promise<GitRepositoryState> {
  const repo = new GitRepository(repoPath);
  return repo.getState();
}
