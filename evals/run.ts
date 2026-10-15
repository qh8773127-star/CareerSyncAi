import "dotenv/config";
import fs from "fs";
import path from "path";
import { extractJobData } from "../src/app/actions/extract-job-core";
import type { JobAnalysisResult } from "../src/app/lib/validations";

const RUNS_PER_CASE = 3;              
const DELAY_BETWEEN_RUNS_MS = 1500;   
const DELAY_BETWEEN_CASES_MS = 3000;

type Field = "role" | "company" | "location" | "jobType" | "experienceLevel";
const FIELDS_TO_CHECK: Field[] = [
  "role",
  "company",
  "location",
  "jobType",
  "experienceLevel",
];


const SKILL_ALIASES: Record<string, string> = {
  "gcp": "google cloud platform",
  "amazon web services": "aws",
  "rest apis": "rest api",
  "restful api": "rest api",
  "restful apis": "rest api",
  "js": "javascript",
  "ts": "typescript",
  "nextjs": "next.js",
  "nodejs": "node.js",
  "reactjs": "react",
  "ci cd": "ci/cd",
  "cicd": "ci/cd",
};

function normalizeSkill(s: string): string {
  const normalized = s.toLowerCase().trim().replace(/\s+/g, " ");
  return SKILL_ALIASES[normalized] ?? normalized;
}

function compareSkills(expected: string[], actual: string[]): boolean {
  const norm = (arr: string[]) =>
    [...new Set(arr.map(normalizeSkill))].sort();
  return JSON.stringify(norm(expected)) === JSON.stringify(norm(actual));
}

function diffSkills(
  expected: string[],
  actual: string[],
): { missing: string[]; extra: string[] } {
  const eSet = new Set(expected.map(normalizeSkill));
  const aSet = new Set(actual.map(normalizeSkill));
  return {
    missing: [...eSet].filter((s) => !aSet.has(s)),
    extra: [...aSet].filter((s) => !eSet.has(s)),
  };
}

type CaseResult = {
  name: string;
  runs: number;
  passed: number;
  failed: number;
  errors: number;
  fieldFailures: Map<Field, number>;
  status: "stable-pass" | "flaky" | "stable-fail" | "error";
  details: string[];
};

async function runCase(
  file: string,
  casesDir: string,
): Promise<CaseResult> {
  const base = file.replace(".txt", "");
  const jd = fs.readFileSync(path.join(casesDir, file), "utf-8");
  const expected: JobAnalysisResult = JSON.parse(
    fs.readFileSync(path.join(casesDir, `${base}.expected.json`), "utf-8"),
  );

  const result: CaseResult = {
    name: base,
    runs: RUNS_PER_CASE,
    passed: 0,
    failed: 0,
    errors: 0,
    fieldFailures: new Map(),
    status: "stable-fail",
    details: [],
  };

  for (let run = 0; run < RUNS_PER_CASE; run++) {
    try {
      const actual = await extractJobData(jd);

      let runFailed = false;

      // Field comparisons
      for (const field of FIELDS_TO_CHECK) {
        if (expected[field] !== actual[field]) {
          runFailed = true;
          result.fieldFailures.set(
            field,
            (result.fieldFailures.get(field) ?? 0) + 1,
          );
          if (run === 0) {
            result.details.push(
              `  ❌ ${field}: expected "${expected[field]}", got "${actual[field]}"`,
            );
          }
        }
      }

      // Skills comparison
      if (!compareSkills(expected.skills, actual.skills)) {
        runFailed = true;
        const { missing, extra } = diffSkills(expected.skills, actual.skills);
        if (run === 0) {
          result.details.push(
            `  ❌ skills mismatch` +
              (missing.length ? `\n     missing: ${missing.join(", ")}` : "") +
              (extra.length ? `\n     extra:   ${extra.join(", ")}` : ""),
          );
        }
      }

      if (runFailed) result.failed++;
      else result.passed++;
    } catch (err) {
      result.errors++;
      if (run === 0) {
        result.details.push(`  💥 ERROR: ${(err as Error).message}`);
      }
    }

    // Rate limit guard between runs
    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_RUNS_MS));
  }

  // Classify case
  if (result.errors > 0 && result.passed === 0) {
    result.status = "error";
  } else if (result.passed === result.runs) {
    result.status = "stable-pass";
  } else if (result.passed > 0) {
    result.status = "flaky";
  } else {
    result.status = "stable-fail";
  }

  return result;
}

async function runEvals() {
  const casesDir = path.join(__dirname, "cases");
  const files = fs
    .readdirSync(casesDir)
    .filter((f) => f.endsWith(".txt"))
    .sort();

  const startTime = Date.now();

  console.log(`\n🚀 Running ${files.length} eval cases × ${RUNS_PER_CASE} runs each...\n`);

  const results: CaseResult[] = [];

  for (const file of files) {
    const base = file.replace(".txt", "");
    process.stdout.write(`🧪 ${base}... `);

    const result = await runCase(file, casesDir);
    results.push(result);

    // Status badge
    if (result.status === "stable-pass") {
      console.log(`✅ STABLE PASS (${result.passed}/${result.runs})`);
    } else if (result.status === "flaky") {
      console.log(`⚠️  FLAKY (${result.passed}/${result.runs})`);
      result.details.forEach((d) => console.log(d));
    } else if (result.status === "error") {
      console.log(`💥 ERROR (${result.errors}/${result.runs})`);
      result.details.forEach((d) => console.log(d));
    } else {
      console.log(`❌ STABLE FAIL (${result.failed}/${result.runs} failed)`);
      result.details.forEach((d) => console.log(d));
    }

    // Rate limit guard between cases
    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CASES_MS));
  }

  const stablePass = results.filter((r) => r.status === "stable-pass").length;
  const flaky = results.filter((r) => r.status === "flaky").length;
  const stableFail = results.filter((r) => r.status === "stable-fail").length;
  const errored = results.filter((r) => r.status === "error").length;

  const totalRuns = files.length * RUNS_PER_CASE;
  const totalPassed = results.reduce((s, r) => s + r.passed, 0);
  const overallScore = ((totalPassed / totalRuns) * 100).toFixed(1);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`📊 EVAL SUMMARY`);
  console.log(`${"─".repeat(60)}`);
  console.log(`  Total cases:      ${files.length}`);
  console.log(`  Runs per case:    ${RUNS_PER_CASE}`);
  console.log(`  Total runs:       ${totalRuns}`);
  console.log(`  Passed runs:      ${totalPassed}`);
  console.log(`  Overall score:    ${overallScore}%`);
  console.log(`  Elapsed:          ${elapsed}s`);
  console.log(`${"─".repeat(60)}`);
  console.log(`  ✅ Stable pass:   ${stablePass}`);
  console.log(`  ⚠️  Flaky:         ${flaky}`);
  console.log(`  ❌ Stable fail:   ${stableFail}`);
  console.log(`  💥 Errors:        ${errored}`);
  console.log(`${"─".repeat(60)}`);

  // Field failure heatmap
  const fieldTotals = new Map<Field, number>();
  for (const r of results) {
    for (const [field, count] of r.fieldFailures) {
      fieldTotals.set(field, (fieldTotals.get(field) ?? 0) + count);
    }
  }
  if (fieldTotals.size > 0) {
    console.log(`\n🔥 FIELD FAILURE HEATMAP`);
    console.log(`${"─".repeat(60)}`);
    [...fieldTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([field, count]) => {
        console.log(`  ${field.padEnd(20)} ${count} failures`);
      });
  }

  // Flaky cases list
  if (flaky > 0) {
    console.log(`\n⚠️  FLAKY CASES (non-deterministic output)`);
    console.log(`${"─".repeat(60)}`);
    results
      .filter((r) => r.status === "flaky")
      .forEach((r) => {
        console.log(`  • ${r.name}: ${r.passed}/${r.runs} passed`);
      });
  }

  // CI gate
  const threshold = 80;
  const pass = parseFloat(overallScore) >= threshold && flaky === 0;

  console.log(`${"─".repeat(60)}\n`);

  if (pass) {
    console.log(`✅ CI GATE PASSED (threshold: ${threshold}%, flaky: 0)\n`);
    process.exit(0);
  } else {
    console.log(`❌ CI GATE FAILED (score: ${overallScore}%, threshold: ${threshold}%, flaky: ${flaky})\n`);
    process.exit(1);
  }
}

runEvals();