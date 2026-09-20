import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear any existing data
  await prisma.testCase.deleteMany({});
  await prisma.starterCode.deleteMany({});
  await prisma.problemConstraint.deleteMany({});
  await prisma.problemExample.deleteMany({});
  await prisma.problem.deleteMany({});

  // Seed "Two Sum"
  const twoSum = await prisma.problem.create({
    data: {
      title: 'Two Sum',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      difficulty: 'EASY',
      timeLimit: 2.0,
      memoryLimit: 256,
      optimalTime: 'O(N)',
      optimalSpace: 'O(N)',
      examples: {
        create: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
          },
        ],
      },
      constraints: {
        create: [
          { statement: '2 <= nums.length <= 10^4' },
          { statement: '-10^9 <= nums[i] <= 10^9' },
          { statement: '-10^9 <= target <= 10^9' },
        ],
      },
      starterCodes: {
        create: [
          {
            language: 'python',
            boilerplate: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your code here
        pass
`,
          },
          {
            language: 'javascript',
            boilerplate: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
};
`,
          },
          {
            language: 'java',
            boilerplate: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
}
`,
          },
          {
            language: 'cpp',
            boilerplate: `#include <vector>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        // Write your code here
        return {};
    }
};
`,
          },
        ],
      },
      testCases: {
        create: [
          {
            input: `[2, 7, 11, 15]\n9`,
            expected: `[0, 1]`,
            isPublic: true,
          },
          {
            input: `[3, 2, 4]\n6`,
            expected: `[1, 2]`,
            isPublic: true,
          },
          {
            input: `[3, 3]\n6`,
            expected: `[0, 1]`,
            isPublic: true,
          },
          {
            input: `[1, 2, 3, 4, 5]\n9`,
            expected: `[3, 4]`,
            isPublic: true,
          },
          {
            input: `[0, 4, 3, 0]\n0`,
            expected: `[0, 3]`,
            isPublic: true,
          },
        ],
      },
    },
  });

  console.log('Seeding completed. Seeded problem:', twoSum.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
