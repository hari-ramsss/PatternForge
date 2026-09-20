// PatternForge AI Dashboard Mock Data Placeholders
// In the future, these will be populated by live database analytics & API calls

export interface ProblemDrill {
  title: string;
  slug: string;
}

export interface PredictiveDiagnostics {
  failureRiskPct: number;
  problemTitle: string;
  reason: string;
  drillPath: ProblemDrill[];
}

export interface AICoachDirective {
  targetProblem: string;
  reason: string;
  expectedGain: string;
  estimatedTime: string;
}

export interface SpacedRepetitionItem {
  title: string;
  lastSeen: string;
  retentionPct: number;
  slug: string;
}

export interface EdgeCaseAnalysis {
  failureReason: string;
  correctionPlan: ProblemDrill[];
}

export interface DailyMission {
  title: string;
  desc: string;
  estTime: string;
  reward: string;
  slug: string;
  objectives: string[];
}

export interface WeaknessCategory {
  code: string;
  title: string;
  desc: string;
}

export const MOCK_PREDICTIVE_DIAGNOSTICS: PredictiveDiagnostics = {
  failureRiskPct: 81,
  problemTitle: "Top K Frequent Elements",
  reason: "Heap implementation speed. Based on your last 80 submissions, heap setup overhead and priority queue selections have shown higher lookup/push latencies.",
  drillPath: [
    { title: "Top K Frequent", slug: "top-k-frequent-elements" },
    { title: "K Closest Points", slug: "k-closest-points-to-origin" },
    { title: "Task Scheduler", slug: "task-scheduler" }
  ]
};

export const MOCK_AI_COACH_DIRECTIVE: AICoachDirective = {
  targetProblem: "Contains Duplicate",
  reason: "You correctly identify lookup problems, but hesitate during duplicate detection.",
  expectedGain: "+6 Observation",
  estimatedTime: "7 minutes"
};

export const MOCK_SPACED_REPETITION: SpacedRepetitionItem[] = [
  {
    title: "Binary Search on Answer",
    lastSeen: "14d ago",
    retentionPct: 42,
    slug: "binary-search"
  },
  {
    title: "Prefix Sum Invariants",
    lastSeen: "8d ago",
    retentionPct: 58,
    slug: "product-of-array-except-self"
  }
];

export const MOCK_EDGE_CASE_ANALYSIS: EdgeCaseAnalysis = {
  failureReason: "You failed 4 single-element arrays during the last 12 submissions.",
  correctionPlan: [
    { title: "Contains Duplicate", slug: "contains-duplicate" },
    { title: "Move Zeroes", slug: "move-zeroes" },
    { title: "Merge Sorted Array", slug: "merge-sorted-array" }
  ]
};

export const MOCK_DAILY_MISSION: DailyMission = {
  title: "Sliding Window Observation Drill",
  desc: "Train your eyes to capture variable boundaries on contiguous sequences. Standard O(N) sliding constraints are required.",
  estTime: "25 min",
  reward: "+320 XP | Unlock Dynamic Window",
  slug: "maximum-subarray",
  objectives: [
    "Identify contiguous target bounds",
    "Optimize nested loops to dynamic O(N)",
    "Verify prefix & suffix boundary cases"
  ]
};

export const MOCK_WEAKNESSES: WeaknessCategory[] = [
  {
    code: "TC",
    title: "Time Complexity",
    desc: "Tended to submit brute-force paths before lookup mapping."
  },
  {
    code: "EC",
    title: "Boundary Cases",
    desc: "Crashed on empty arrays or single-element inputs."
  },
  {
    code: "PC",
    title: "Pattern Confusion",
    desc: "Struggled separating Two Pointers from Sliding Windows."
  }
];
