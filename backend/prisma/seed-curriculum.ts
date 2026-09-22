import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

const canonicalProblems: Record<string, { slug: string; title: string }> = {
  'arrays|two sum': { slug: 'two-sum', title: 'Two Sum' },
  'arrays|maximum subarray': { slug: 'maximum-subarray', title: 'Maximum Subarray' },
  'arrays|product except self': { slug: 'product-of-array-except-self', title: 'Product of Array Except Self' },
  'arrays|majority element': { slug: 'majority-element', title: 'Majority Element' },
  'arrays|first missing positive': { slug: 'first-missing-positive', title: 'First Missing Positive' },
  'arrays|stock buy/sell': { slug: 'best-time-to-buy-and-sell-stock', title: 'Best Time to Buy and Sell Stock' },
  'hashing|duplicate detection': { slug: 'contains-duplicate', title: 'Contains Duplicate' },
  'hashing|anagram hashing': { slug: 'valid-anagram', title: 'Valid Anagram' },
  'strings|palindrome': { slug: 'valid-palindrome', title: 'Valid Palindrome' },
  'strings|longest common prefix': { slug: 'longest-common-prefix', title: 'Longest Common Prefix' },
  'sorting|merge sort + inversions': { slug: 'count-of-smaller-numbers-after-self', title: 'Count of Smaller Numbers After Self' },
  'prefix sum|range sum query': { slug: 'range-sum-query-immutable', title: 'Range Sum Query - Immutable' },
  'two pointers|two sum': { slug: 'two-sum-ii-input-array-is-sorted', title: 'Two Sum II - Input Array Is Sorted' },
  'two pointers|palindrome checking': { slug: 'valid-palindrome', title: 'Valid Palindrome' },
  'binary search|basic binary search': { slug: 'binary-search', title: 'Binary Search' },
  'binary search|rotated sorted array': { slug: 'search-in-rotated-sorted-array', title: 'Search in Rotated Sorted Array' },
  'sliding window|longest substring without repeating characters': { slug: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating Characters' },
  'sliding window|minimum window substring': { slug: 'minimum-window-substring', title: 'Minimum Window Substring' },
  'stack|valid parentheses': { slug: 'valid-parentheses', title: 'Valid Parentheses' },
  'stack|largest rectangle histogram': { slug: 'largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram' },
  'queue / deque|bfs': { slug: 'binary-tree-level-order-traversal', title: 'Binary Tree Level Order Traversal' },
  'linked list|reversal': { slug: 'reverse-linked-list', title: 'Reverse Linked List' },
  'linked list|cycle detection': { slug: 'linked-list-cycle', title: 'Linked List Cycle' },
  'heap|kth largest': { slug: 'kth-largest-element-in-an-array', title: 'Kth Largest Element in an Array' },
  'intervals|merge intervals': { slug: 'merge-intervals', title: 'Merge Intervals' },
  'recursion|divide and conquer': { slug: 'fibonacci-number', title: 'Fibonacci Number' },
  'trees|preorder': { slug: 'binary-tree-preorder-traversal', title: 'Binary Tree Preorder Traversal' },
  'trees|inorder': { slug: 'binary-tree-inorder-traversal', title: 'Binary Tree Inorder Traversal' },
  'trees|lowest common ancestor': { slug: 'lowest-common-ancestor-of-a-binary-tree', title: 'Lowest Common Ancestor of a Binary Tree' },
  'trees|binary tree lca': { slug: 'lowest-common-ancestor-of-a-binary-tree', title: 'Lowest Common Ancestor of a Binary Tree' },
  'trees|validate bst': { slug: 'validate-binary-search-tree', title: 'Validate Binary Search Tree' },
  'trees|tree diameter': { slug: 'diameter-of-binary-tree', title: 'Diameter of Binary Tree' },
  'backtracking|subsets': { slug: 'subsets', title: 'Subsets' },
  'backtracking|permutations': { slug: 'permutations', title: 'Permutations' },
  'graphs|number of islands': { slug: 'number-of-islands', title: 'Number of Islands' },
  'graphs|cycle detection': { slug: 'course-schedule', title: 'Course Schedule' },
  'graphs|topological sort': { slug: 'course-schedule-ii', title: 'Course Schedule II' },
  'greedy|jump game': { slug: 'jump-game', title: 'Jump Game' },
  'greedy|gas station': { slug: 'gas-station', title: 'Gas Station' },
  'union find|number of islands': { slug: 'number-of-islands', title: 'Number of Islands' },
  'dynamic programming|climbing stairs': { slug: 'climbing-stairs', title: 'Climbing Stairs' },
  'dynamic programming|coin change': { slug: 'coin-change', title: 'Coin Change' },
  'dynamic programming|longest increasing subsequence': { slug: 'longest-increasing-subsequence', title: 'Longest Increasing Subsequence' },
  'trie|longest common prefix': { slug: 'longest-common-prefix', title: 'Longest Common Prefix' },
  'bit manipulation|single number': { slug: 'single-number', title: 'Single Number' },
  'advanced patterns & sums|lca': { slug: 'lowest-common-ancestor-of-a-binary-tree', title: 'Lowest Common Ancestor of a Binary Tree' },
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

async function main() {
  const sourcePath = path.resolve(__dirname, '../../subtopicseeding.md');
  const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);
  let topic = '';
  let sortOrder = 0;
  let count = 0;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      topic = heading[1].trim();
      sortOrder = 0;
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (!bullet || !topic) continue;

    const title = bullet[1].trim();
    const canonical = canonicalProblems[`${normalize(topic)}|${normalize(title)}`];
    await prisma.curriculumSubtopic.upsert({
      where: { topic_title: { topic, title } },
      create: { topic, title, sortOrder, canonicalSlug: canonical?.slug, canonicalTitle: canonical?.title },
      update: { sortOrder, canonicalSlug: canonical?.slug, canonicalTitle: canonical?.title },
    });
    sortOrder += 1;
    count += 1;
  }

  console.log(`Seeded ${count} shared curriculum subtopics.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
