# e15ver-calc

**Reference implementation** of e15ver (Expectation Value Versioning) that automatically calculates version numbers from your git repository state.

## What is e15ver?

e15ver is a versioning scheme that treats version numbers as quantum mechanical expectation values. Instead of manually choosing MAJOR.MINOR.PATCH, e15ver derives your version from the mathematical properties of your git history, branch structure, and commit count.

See the [e15ver visualization](https://caitscheverst.github.io/e15ver/) for the full theory.

## Usage

### As a CLI Tool

```bash
# In the e15ver-calc directory
npm install
npm run build
npm run cli                    # Analyze current repo
npm run cli /path/to/repo     # Analyze a specific repo
```

Output:
```
═══════════════════════════════════════════
     e15ver: Expectation Value Version
═══════════════════════════════════════════

📦 Version: 1.2.1
   (v1.2.1)

🎯 State Confidence: 42.5%
   (in superposition)

📊 Repository State:
   Total Commits: 47
   Active Branches: 3
   Main Branch Commits: 23

🌀 Manifold Position:
   x: 2.341, y: 1.823, z: -0.567

═══════════════════════════════════════════
```

### As a Library

```typescript
import { calculateE15verForRepo } from 'e15ver-calc';

const result = await calculateE15verForRepo('.');
console.log(result.formattedVersion); // "1.2.1"
console.log(result.confidence);       // 0.425
console.log(result.manifoldPosition); // { x, y, z }
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
- `manifoldPoint(t, fx, fy, fz, commitPhaseShift)` — Calculate position on version manifold

## How It Works

1. **Parse Git State**: Reads branches, commits, and tags from the repository
2. **Seed Version**: Uses the most recent tag if available, otherwise derives base version from commit count
   - With tags: Uses last tag as reference (80% confidence = "measured")
   - Without tags: Derives version from `commits/20` for major, `(commits%20)/5` for minor, etc. (40% confidence = "in superposition")
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

This is a reference/example implementation. The actual algorithm is intentionally whimsical and not suitable for production versioning! 😄

For serious use, stick with semver. For fun: embrace the quantum!
