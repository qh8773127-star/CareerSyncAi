export type EvalCase = {
  id: string;
  query: string;
  expectedKeywords: string[];
};

export const GOLDEN_DATASET: EvalCase[] = [
  {
    id: "eval-1",
    query: "Show me the AI Engineer job at Google",
    expectedKeywords: ["Ai engineer", "Google"],
  },
  {
    id: "eval-2",
    query: "Do I have any remote Full-Stack roles?",
    expectedKeywords: ["Full-Stack Software Engineer", "Remote"],
  },
  {
    id: "eval-3",
    query: "Which jobs require Docker and AWS?",
    expectedKeywords: ["Docker", "AWS", "Full-Stack Software Engineer"],
  },
  {
    id: "eval-4",
    query: "Find frontend developer positions in the US",
    expectedKeywords: ["Frontend developer", "Microsoft", "US"],
  },
  {
    id: "eval-5",
    query: "Show me jobs that require C++ and React",
    expectedKeywords: ["C++", "React", "Ai engineer", "Frontend developer"],
  }
];