export interface Version {
  x: number;
  y: number;
  z: number;
  scalar: number;
}

export interface GitBranch {
  name: string;
  commits: number;
  isMain: boolean;
  lastCommitHash?: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  branch: string;
  tag?: string;
  timestamp: number;
}

export interface GitRepositoryState {
  branches: GitBranch[];
  commits: GitCommit[];
  tags: Map<string, string>; // tag name -> commit hash
  totalCommits: number;
  activeVersion?: Version;
}

export interface E15verResult {
  version: Version;
  formattedVersion: string;
  confidence: number; // 0-1, how "measured" this state is
  manifoldPosition: {
    x: number;
    y: number;
    z: number;
  };
  metadata: {
    totalBranches: number;
    totalCommits: number;
    mainBranchCommits: number;
  };
}
