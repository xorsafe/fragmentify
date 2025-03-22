# Fragmentify

A TypeScript library for managing CRUD operations on abstract linear sections. These sections represent contiguous stretches of data that can be split, expanded, merged, and moved contiguously.

**Think of it like this:**

Imagine a video editing software where the timeline is a series of contiguous sections, each holding different video clips or audio tracks.  These sections are constantly being edited: trimmed, split, moved around, and merged together. Fragmentify provides the tools to efficiently manage these operations in a generic and abstract way.

The library is also applicable to scenarios like animation timelines, where each section represents an interpolation between keyframes. The boundaries of the sections define the keyframe points, and the section's data represents the interpolation data within those boundaries.

## Key Features

*   **Split:** Divide a section into multiple smaller sections.
*   **Expand:** Increase the length of a section.
*   **Merge:** Combine multiple contiguous sections into a single section.
*   **Move:**  Shift a section's position along the linear axis, maintaining contiguity.
*   **CRUD Operations:**  Provides basic Create, Read, Update, and Delete operations for managing sections.
*   **Abstract:** Designed to be adaptable to various data types and linear section representations.

## Installation

```bash
npm install fragmentify
```

## Usage

```typescript
import { SplitDistribution, Block, BaseCloner } from 'fragmentify';

// Create a new instance
const splitDistribution = new SplitDistribution();

// Create blocks from splits
const blocks = splitDistribution.fromSplitsToContiguousBlocks(0, 10, 20, 30, 40);

// Change block size
const modifiedBlock = splitDistribution.changeBlockSize(blocks[0], true, 5, BaseCloner, 0, 100);

// Merge blocks
const mergedBlocks = splitDistribution.merge(1, true, blocks);

// Remove a block
const remainingBlocks = splitDistribution.remove(blocks[0], blocks);

// Apply a new block
const newBlock: Block = { start: 15, end: 25, index: -1 };
const updatedBlocks = splitDistribution.apply(newBlock, blocks);
```

## API

### Block Interface

```typescript
interface Block {
    start: number;  // Starting value on the range
    end: number;    // Ending value on the range
    index: number;  // Index in the main array that holds it
}
```

### Main Methods

- `fromSplitsToContiguousBlocks(start: number, ...splits: number[]): Block[]`
- `constructContiguousBlocksFrom(totalSplits: number, low: number = 0, high: number = 100): Block[]`
- `changeBlockSize(block: Block, fromStart: boolean, by: number, clone: CloneBlock, low: number, high: number): Block`
- `apply(block: Block, array: Block[]): Block[]`
- `remove(block: Block, array: Block[], replaceRatio: number = 0.5): Block[] | null`
- `merge(index: number, withPrevious: boolean, array: Block[]): Block[]`
- `move(picker: number, delta: number, current: Block, array: Block[]): [number, Block]`
- `areOverlapping(a: Block, b: Block): boolean`
- `isValid(block: Block): boolean`

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test
npm run test:watch

# Build
npm run build
```

## License

ISC
