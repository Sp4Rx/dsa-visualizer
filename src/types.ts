export interface ExecutionStep {
  line: number;
  variables: Record<string, any>;
  description: string;
  action?: string; // e.g., "compare", "swap", "push", "pop"
}

export interface AIResponse {
  solution: string;
  explanation: string;
  steps: ExecutionStep[];
}

export interface ExampleProblem {
  title: string;
  problem: string;
  code: string;
}

export const EXAMPLE_PROBLEMS: ExampleProblem[] = [
  {
    title: "Bubble Sort",
    problem: "Sort an array of numbers using the Bubble Sort algorithm.",
    code: `function bubbleSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

bubbleSort([5, 3, 8, 4, 2]);`
  },
  {
    title: "Two Sum",
    problem: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    code: `function twoSum(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (complement in map) {
      return [map[complement], i];
    }
    map[nums[i]] = i;
  }
  return [];
}

twoSum([2, 7, 11, 15], 9);`
  }
];
