# e15ver-calc

**Reference implementation** of e15ver (Expectation Value Versioning) that automatically calculates version numbers from your git repository state.

## What is e15ver?

e15ver is a versioning scheme that treats version numbers as quantum mechanical expectation values. Instead of manually choosing MAJOR.MINOR.PATCH, e15ver derives your version from the mathematical properties of your git history, branch structure, and commit count.

See the [e15ver visualization](https://caitscheverst.github.io/e15ver/) for the full theory.

## Usage

### As a CLI Tool

```bash
npm install
npm run build
npm run cli                   # Analyze current repo
npm run cli /path/to/repo     # Analyze a specific repo
```

Output:

```
+===================================+
| e15ver: Expectation Value Version |
+===================================+
| 📦 Version: 1.2.3
|   v(1-0.182i).(2+3.388i).(3-3.739i)
| 🎯 State Confidence: 42.8%
|   (in superposition)
| 📊 Repository State:
|   Total Commits: 13
|   Active Branches: 2
|   Main Branch Commits: 1
| 🌀 Manifold Position:
|   x: -0.182, y: 3.388, z: -3.739
+===================================+
```

### As a Library

```typescript
import { calculateE15verForRepo, formatComplexVersion } from "e15ver-calc";

const result = await calculateE15verForRepo(".");
console.log(result.formattedVersion);     // "1.2.1"
console.log(formatComplexVersion(result)); // "v(1+0.44i).(2-1.23i).(3+0.89i)"
console.log(result.confidence);            // 0.425
console.log(result.manifoldPosition);      // { x: 0.44, y: -1.23, z: 0.89 }
```

## API

### `calculateE15verForRepo(repoPath?: string): Promise<E15verResult>`

Calculate the e15ver for a repository.

**Parameters:**

- `repoPath` (optional): Path to git repository, defaults to current directory

**Returns:** `E15verResult` object containing:

- `version`: Version object with x, y, z components
- `formattedVersion`: String like "1.2.3"
- `confidence`: Number 0-1 indicating how "measured" the state is
- `manifoldPosition`: Current position on the version manifold
- `metadata`: Repository statistics

### `getRepositoryState(repoPath?: string): Promise<GitRepositoryState>`

Get the raw git state without calculating e15ver.

### `calculateE15ver(repoState: GitRepositoryState): E15verResult`

Calculate e15ver from an already-parsed repository state.

### Math Functions

- `parseVersion(str): Version` — Parse "1.2.3" to version components
- `formatVersion(v): string` — Format version components back to string
- `formatComplexVersion(result): string` — Format result as complex number: `v(1+0.44i).(2-1.23i).(3+0.89i)`
- `manifoldPoint(t, fx, fy, fz, commitPhaseShift)` — Calculate position on version manifold

## How It Works

1. **Parse Git State**: Reads branches, commits, and tags from the repository
2. **Seed Version**: Uses the most recent tag if available, otherwise starts from v0.0.0
   - With tags: Uses last tag as reference (80% confidence = "measured")
   - Without tags: Starts from v0.0.0 (80% confidence = "in superposition")
3. **Calculate Manifold**: Uses the version digits and commit count to parameterize a 3D manifold curve
4. **Derive Expectation**: Maps the current git state onto the manifold to determine version increments
5. **Confidence**: Reflects how "measured" the state is — tagged repos are more definite, untagged ones are quantum fuzzy

## Mathematical Foundation

The version manifold is parameterized by git repository properties:

- **Frequencies**: `fx = vx + 1.2`, `fy = vy + 2.3`, `fz = vz + 3.4` (from current version)
- **Phase Shift**: `ω = C/15` (from commit count C)
- **Manifold Curve**: 3D parametric curve based on trigonometric functions of t ∈ [0, 2π]

Version increments are derived from the manifold position when:

- The manifold reaches certain harmonic points, AND
- The repository has accumulated sufficient commits or branches

## Notes

This is a reference/example implementation. The algorithm is intentionally silly and not suitable for production versioning! ... or is it?
