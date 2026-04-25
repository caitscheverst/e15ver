export interface GitBranch {
  name: string;
  commits: number;
  startScalar: number;
  endScalar: number;
  color: string;
}

export type GitEvent =
  | { type: "commit"; branch: string; message: string; tag?: string }
  | { type: "branch"; name: string; parent: string }
  | { type: "merge"; from: string; to: string; tag?: string };
