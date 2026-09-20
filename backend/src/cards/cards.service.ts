import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetch pattern cards for a user with optional filter ('all' | 'due' | 'struggled')
   */
  async getUserCards(userId: string, filter?: string) {
    await this.seedDefaultCardsIfEmpty(userId);

    const now = new Date();
    const whereClause: any = { userId };

    if (filter === 'due') {
      whereClause.dueDate = { lte: now };
    } else if (filter === 'struggled') {
      whereClause.easeFactor = { lt: 2.1 };
    }

    const cards = await this.prisma.patternCard.findMany({
      where: whereClause,
      orderBy: { dueDate: 'asc' },
    });

    // Compute status metadata for client
    return cards.map((card) => ({
      ...card,
      isDue: new Date(card.dueDate) <= now,
    }));
  }

  /**
   * Create a custom pattern card
   */
  async createCard(userId: string, data: {
    problemId?: string;
    problemTitle: string;
    patternName: string;
    clues: string;
    invariants: string;
    codeSnippet: string;
    optimalTime?: string;
    optimalSpace?: string;
  }) {
    return this.prisma.patternCard.create({
      data: {
        userId,
        problemId: data.problemId,
        problemTitle: data.problemTitle,
        patternName: data.patternName,
        clues: data.clues,
        invariants: data.invariants,
        codeSnippet: data.codeSnippet,
        optimalTime: data.optimalTime || 'O(N)',
        optimalSpace: data.optimalSpace || 'O(1)',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        dueDate: new Date(),
      },
    });
  }

  /**
   * SuperMemo-2 Spaced Repetition Review Algorithm
   * Rating scale (0-5):
   * 5 = Easy (Mastered, minimal effort)
   * 3 = Good / Remembered (Correct response with slight delay)
   * 1 = Struggled (Incorrect or difficult recall)
   */
  async reviewCard(userId: string, cardId: string, rating: number) {
    const card = await this.prisma.patternCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new NotFoundException('Pattern card not found');
    }

    const q = Math.max(0, Math.min(5, Math.round(rating)));

    // SuperMemo-2 Ease Factor calculation
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    let newEaseFactor = card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }

    let newRepetitions = card.repetitions;
    let newInterval = card.interval;

    if (q < 3) {
      // Struggled / Forgotten: reset repetitions to 0 and interval to 1 day
      newRepetitions = 0;
      newInterval = 1;
    } else {
      // Successful recall
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(card.interval * newEaseFactor);
      }
      newRepetitions += 1;
    }

    // Calculate new due date
    const now = new Date();
    const nextDueDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

    return this.prisma.patternCard.update({
      where: { id: cardId },
      data: {
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        dueDate: nextDueDate,
        lastReviewed: now,
      },
    });
  }

  /**
   * Seed default pattern cards for starter curriculum if user has none
   */
  async seedDefaultCardsIfEmpty(userId: string) {
    const count = await this.prisma.patternCard.count({ where: { userId } });
    if (count > 0) return;

    const defaults = [
      {
        problemTitle: 'Two Sum',
        patternName: 'Single-Pass Hash Map Lookup',
        clues: 'Look for target - current in a single pass. Store index in complement map.',
        invariants: 'Complement hashmap maintains seen values. Target - num[i] lookup takes O(1) time.',
        codeSnippet: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []`,
        optimalTime: 'O(N)',
        optimalSpace: 'O(N)',
      },
      {
        problemTitle: 'Valid Anagram',
        patternName: 'Frequency Map Counting',
        clues: 'Compare character frequencies across strings or use a fixed 26-element array.',
        invariants: 'Strings of equal length are anagrams iff net character frequency balance is zero.',
        codeSnippet: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        if len(s) != len(t): return False\n        counts = {}\n        for char in s:\n            counts[char] = counts.get(char, 0) + 1\n        for char in t:\n            if counts.get(char, 0) == 0:\n                return False\n            counts[char] -= 1\n        return True`,
        optimalTime: 'O(N)',
        optimalSpace: 'O(1)',
      },
      {
        problemTitle: 'Group Anagrams',
        patternName: 'Categorization via Sorted Tuple Invariant',
        clues: 'Map sorted character tuples or 26-char frequency vectors as hash map keys.',
        invariants: 'Every anagram variant produces identical character frequency key.',
        codeSnippet: `from collections import defaultdict\nclass Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        groups = defaultdict(list)\n        for s in strs:\n            key = tuple(sorted(s))\n            groups[key].append(s)\n        return list(groups.values())`,
        optimalTime: 'O(N * K log K)',
        optimalSpace: 'O(N * K)',
      },
      {
        problemTitle: 'Subarray Sum Equals K',
        patternName: 'Prefix XOR / Sum Frequency Tracking',
        clues: 'Track running prefix sum. Subarray sum (i..j) equals prefix[j] - prefix[i-1].',
        invariants: 'Subarray sum equals K iff (current_prefix - K) exists in prefix frequency map.',
        codeSnippet: `class Solution:\n    def subarraySum(self, nums: list[int], k: int) -> int:\n        counts = {0: 1}\n        curr = 0\n        res = 0\n        for num in nums:\n            curr += num\n            if (curr - k) in counts:\n                res += counts[curr - k]\n            counts[curr] = counts.get(curr, 0) + 1\n        return res`,
        optimalTime: 'O(N)',
        optimalSpace: 'O(N)',
      },
    ];

    for (const d of defaults) {
      await this.prisma.patternCard.create({
        data: {
          userId,
          problemTitle: d.problemTitle,
          patternName: d.patternName,
          clues: d.clues,
          invariants: d.invariants,
          codeSnippet: d.codeSnippet,
          optimalTime: d.optimalTime,
          optimalSpace: d.optimalSpace,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          dueDate: new Date(),
        },
      });
    }
  }
}
