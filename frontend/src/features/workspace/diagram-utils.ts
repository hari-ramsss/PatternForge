export type DiagramKind = 'tree' | 'graph' | 'array' | 'height-map' | 'matrix';

export interface DiagramDefinition {
  kind: DiagramKind;
  label: string;
  mermaid: string;
  visualData?: Record<string, unknown>;
}

const toNumberList = (value: string): number[] => {
  const matches = value.match(/-?\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
};

const escapeLabel = (value: string): string => value.replace(/(["\\])/g, '\\$1');

const firstArray = (input: string): number[] => {
  const match = input.match(/\[[^\]]*\]/);
  return match ? toNumberList(match[0]) : toNumberList(input);
};

const buildLineGraph = (values: number[]): DiagramDefinition => {
  if (values.length === 0) {
    return {
      kind: 'array',
      label: 'Array Snapshot',
      mermaid: 'flowchart LR\n  empty["No numeric data found"]',
      visualData: { values: [] },
    };
  }

  const nodes = values.map((value, index) => `  n${index}["${escapeLabel(String(value))}"]`).join('\n');
  const links = values.slice(1).map((_, index) => `  n${index} --> n${index + 1}`).join('\n');
  return {
    kind: 'array',
    label: 'Array Walk',
    mermaid: `flowchart LR\n${nodes}${links ? `\n${links}` : ''}`,
    visualData: { values },
  };
};

const buildHeightMap = (values: number[]): DiagramDefinition => {
  const maxHeight = Math.max(...values, 0);
  const rows = Array.from({ length: maxHeight + 1 }, (_, row) => {
    const cells = values.map((height, index) => {
      const filled = height >= maxHeight - row;
      return filled ? `c${row}_${index}["${height}"]` : `e${row}_${index}[" "]`;
    });
    return `  ${cells.join(' --> ')}`;
  });

  return {
    kind: 'height-map',
    label: 'Height Map',
    mermaid: `flowchart TB\n${rows.join('\n')}`,
    visualData: { heights: values, maxHeight },
  };
};

const buildRainWater = (values: number[]): DiagramDefinition => {
  const leftMax: number[] = [];
  const rightMax: number[] = Array(values.length).fill(0);
  const trapped = values.map((height, index) => {
    leftMax[index] = Math.max(height, leftMax[index - 1] ?? 0);
    return 0;
  });

  for (let index = values.length - 1; index >= 0; index -= 1) {
    rightMax[index] = Math.max(values[index], rightMax[index + 1] ?? 0);
    trapped[index] = Math.max(0, Math.min(leftMax[index], rightMax[index]) - values[index]);
  }

  const nodes = values.map((height, index) => {
    const water = trapped[index];
    return `  i${index}["i=${index}\\nbar=${height}\\nwater=${water}"]`;
  }).join('\n');
  const links = values.slice(1).map((_, index) => `  i${index} --> i${index + 1}`).join('\n');

  return {
    kind: 'height-map',
    label: 'Trapped Water: boundary scan',
    mermaid: `flowchart LR\n${nodes}\n${links}`,
    visualData: {
      mode: 'rain-water',
      heights: values,
      leftMax,
      rightMax,
      trapped,
      total: trapped.reduce((sum, amount) => sum + amount, 0),
      explanation: 'At each index, water is limited by the shorter boundary: min(leftMax, rightMax) - height.',
    },
  };
};

const buildTwoPointer = (values: number[], context: string): DiagramDefinition => {
  const right = Math.max(0, values.length - 1);
  return {
    kind: 'array',
    label: /container|water/.test(context) ? 'Two pointers: narrowing boundary' : 'Two pointers: search space',
    mermaid: `flowchart LR\n  left["left = 0"] --> scan["compare current pair"] --> right["right = ${right}"]`,
    visualData: {
      mode: 'two-pointer',
      values,
      pointers: { left: 0, right },
      explanation: 'The pointers define the current search space. Move the pointer that cannot improve the answer.',
    },
  };
};

const buildSlidingWindow = (values: number[]): DiagramDefinition => ({
  kind: 'array',
  label: 'Sliding window: expand and contract',
  mermaid: `flowchart LR\n  expand["expand right"] --> valid["window valid?"] --> contract["contract left when needed"]`,
  visualData: {
    mode: 'sliding-window',
    values,
    window: { left: 0, right: Math.min(values.length - 1, 2) },
    explanation: 'Maintain one valid contiguous window instead of recomputing every subarray.',
  },
});

const buildMatrix = (input: string): DiagramDefinition | null => {
  const rows = [...input.matchAll(/\[([^\[\]]+)\]/g)]
    .map((match) => toNumberList(match[1]))
    .filter((row) => row.length > 0);
  if (rows.length < 2) return null;

  const nodes = rows.flatMap((row, rowIndex) =>
    row.map((value, columnIndex) => `  r${rowIndex}c${columnIndex}["${value}"]`),
  );
  return {
    kind: 'matrix',
    label: 'Matrix View',
    mermaid: `flowchart TB\n${nodes.join('\n')}`,
    visualData: { rows },
  };
};

const buildTree = (input: string): DiagramDefinition | null => {
  const values = firstArray(input);
  if (values.length < 2) return null;
  const nodes = values.map((value, index) => `  n${index}["${value}"]`).join('\n');
  const links = values.flatMap((_, index) => {
    const left = index * 2 + 1;
    const right = left + 1;
    return [
      left < values.length ? `  n${index} --> n${left}` : '',
      right < values.length ? `  n${index} --> n${right}` : '',
    ].filter(Boolean);
  }).join('\n');
  return {
    kind: 'tree',
    label: 'Binary Tree',
    mermaid: `flowchart TB\n${nodes}\n${links}`,
    visualData: { levelOrder: values },
  };
};

const buildGraph = (input: string): DiagramDefinition | null => {
  const edgePairs = [...input.matchAll(/\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/g)]
    .map((match) => [Number(match[1]), Number(match[2])] as const);
  if (edgePairs.length === 0) return null;

  const nodes = [...new Set(edgePairs.flat())].map((value) => `  n${value}["${value}"]`).join('\n');
  const links = edgePairs.map(([from, to]) => `  n${from} --- n${to}`).join('\n');
  return {
    kind: 'graph',
    label: 'Graph Connections',
    mermaid: `flowchart LR\n${nodes}\n${links}`,
    visualData: { edges: edgePairs },
  };
};

export function createDiagramDefinition(title: string, input: string, explanation = ''): DiagramDefinition {
  const context = `${title} ${input} ${explanation}`.toLowerCase();
  const values = firstArray(input);

  if (/trapping rain water|trap.*water|rain water/.test(context) && values.length > 0) {
    return buildRainWater(values);
  }

  if (/two sum|two.?pointer|container with most water|3sum|four sum/.test(context) && values.length > 0) {
    return buildTwoPointer(values, context);
  }

  if (/sliding window|longest substring|minimum window|subarray/.test(context) && values.length > 0) {
    return buildSlidingWindow(values);
  }

  const matrix = buildMatrix(input);
  if (matrix) return matrix;

  if (/tree|binary tree|level.?order|root/.test(context)) {
    const tree = buildTree(input);
    if (tree) return tree;
  }

  if (/graph|edge|vertex|vertices|adjacen/.test(context)) {
    const graph = buildGraph(input);
    if (graph) return graph;
  }

  if (/rain|water|height|histogram|bar/.test(context) && values.length > 0) {
    return buildHeightMap(values);
  }
  return buildLineGraph(values);
}