import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

type SeedRow = { topic: string; topicKey: string; title: string; seedTitle: string; sortOrder: number };

const TOPIC_KEYS: Record<string, string> = {
    arrays: 'arrays', hashing: 'hashing', strings: 'strings', sorting: 'sorting',
    'prefix sum': 'prefix-sum', 'two pointers': 'two-pointers', 'binary search': 'binary-search',
    'sliding window': 'sliding-window', stack: 'stack', 'queue / deque': 'queue-deque',
    'linked list': 'linked-list', heap: 'heap', intervals: 'intervals', recursion: 'recursion',
    trees: 'trees', backtracking: 'backtracking', graphs: 'graphs', greedy: 'greedy',
    'union find': 'union-find', 'dynamic programming': 'dynamic-programming', trie: 'trie',
    'bit manipulation': 'bit-manipulation', 'advanced patterns & sums': 'advanced-patterns',
};

const SLUG_OVERRIDES: Record<string, string> = {
    '3sum': '3sum',
    '4sum': '4sum',
    'two sum ii': 'two-sum-ii-input-array-is-sorted',
    'two sum ii - input array is sorted': 'two-sum-ii-input-array-is-sorted',
    'binary tree traversals': 'binary-tree-preorder-traversal',
    'merge k sorted arrays': 'merge-k-sorted-lists',
};

const normalize = (value: string) => value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const slugify = (value: string) => normalize(value).replace(/ /g, '-');

function parseCatalog(sourcePath: string): SeedRow[] {
    const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);
    const rows: SeedRow[] = [];
    let topic = '';
    let topicKey = '';
    let sortOrder = 0;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        const mainHeading = line.match(/^##\s+(.+)$/);
        if (mainHeading) {
            topic = mainHeading[1].trim();
            topicKey = TOPIC_KEYS[normalize(topic)] || slugify(topic);
            sortOrder = 0;
            continue;
        }

        if (line.startsWith('### ') || !topicKey || !line.startsWith('|')) continue;
        if (line === '| Subtopic | Seed Problem |' || line === '| Subtopic | Seed |' || /^\|\s*-+\s*\|/.test(line)) continue;

        const cells = line.slice(1, -1).split('|').map((cell) => cell.trim());
        if (cells.length !== 2 || !cells[0] || !cells[1]) continue;
        rows.push({ topic, topicKey, title: cells[0], seedTitle: cells[1], sortOrder });
        sortOrder += 1;
    }
    return rows;
}

async function findExistingProblem(seedTitle: string) {
    const normalizedTitle = normalize(seedTitle);
    const slug = SLUG_OVERRIDES[normalizedTitle] || slugify(seedTitle);
    return prisma.problem.findFirst({
        where: { OR: [{ title: { equals: seedTitle, mode: 'insensitive' } }, { id: slug }] },
        select: { id: true, title: true },
    });
}

async function main() {
    const sourcePath = path.resolve(__dirname, '../../problemseeding.md');
    const rows = parseCatalog(sourcePath);
    const topicKeys = new Set(rows.map((row) => row.topicKey));
    if (topicKeys.size !== 23 || rows.length === 0) {
        throw new Error(`Catalog validation failed: found ${topicKeys.size} topics and ${rows.length} rows.`);
    }

    const duplicateRows: SeedRow[] = [];
    const uniqueRows = rows.filter((row, index) => {
        const firstIndex = rows.findIndex((candidate) => candidate.topicKey === row.topicKey && candidate.title.toLowerCase() === row.title.toLowerCase());
        if (firstIndex !== index) duplicateRows.push(row);
        return firstIndex === index;
    });

    await prisma.curriculumProblemAssignment.deleteMany({});
    await prisma.curriculumSubtopic.deleteMany({});

    const unresolved: Array<{ topic: string; subtopic: string; seedTitle: string }> = [];
    let assignments = 0;
    for (const row of uniqueRows) {
        const existingProblem = await findExistingProblem(row.seedTitle);
        const subtopic = await prisma.curriculumSubtopic.create({
            data: {
                topicKey: row.topicKey,
                topic: row.topic,
                title: row.title,
                sortOrder: row.sortOrder,
                canonicalSlug: SLUG_OVERRIDES[normalize(row.seedTitle)] || slugify(row.seedTitle),
                canonicalTitle: row.seedTitle,
                canonicalProblemId: existingProblem?.id,
            },
        });

        if (existingProblem) {
            await prisma.curriculumProblemAssignment.create({
                data: { curriculumSubtopicId: subtopic.id, problemId: existingProblem.id, role: 'CANONICAL_SEED', sortOrder: 0 },
            });
            assignments += 1;
        } else {
            unresolved.push({ topic: row.topic, subtopic: row.title, seedTitle: row.seedTitle });
        }
    }

    console.log(`Validated ${topicKeys.size} topics and seeded ${uniqueRows.length} unique curriculum subtopics.`);
    console.log(`Duplicate source rows skipped: ${duplicateRows.length}.`);
    console.log(`Created ${assignments} canonical database assignments.`);
    console.log(`Unresolved canonical problems: ${unresolved.length}.`);
    unresolved.slice(0, 25).forEach((item) => console.warn(`- ${item.topic} / ${item.subtopic} -> ${item.seedTitle}`));
    if (unresolved.length > 25) console.warn(`...and ${unresolved.length - 25} more.`);
}

main()
    .catch((error) => { console.error(error); process.exit(1); })
    .finally(async () => prisma.$disconnect());
