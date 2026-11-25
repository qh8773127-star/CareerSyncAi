import { GOLDEN_DATASET } from "./dataset";
import { evaluateRetrieval } from "./judge";
import { retrieveRelevantJobs } from "../rag";

const TEST_USER_ID = "21f323fb-9e96-414b-b226-32681c356a50";

export async function runEvals() {
  console.log("🚀 Starting RAG Evaluation Harness...\n");

  let totalScore = 0;
  let passedCases = 0;
  const results = [];

  for (const testCase of GOLDEN_DATASET) {
    console.log(`⏳ Testing: "${testCase.query}"`);

    try {
      const retrievedJobs = await retrieveRelevantJobs(
        TEST_USER_ID,
        testCase.query,
      );

      const evalResult = await evaluateRetrieval(testCase.query, retrievedJobs);

      totalScore += evalResult.score;

      const isPass = evalResult.score >= 0.7;
      if (isPass) passedCases++;

      results.push({
        query: testCase.query,
        score: evalResult.score,
        jobsFound: retrievedJobs.length,
        relevantCount: evalResult.relevantJobsCount,
        status: isPass ? "✅ PASS" : "❌ FAIL",
        reasoning: evalResult.reasoning,
      });

      console.log(
        `   ${isPass ? "✅ PASS" : "❌ FAIL"} - Score: ${(evalResult.score * 100).toFixed(1)}%`,
      );
      // ✅ NAYA: Judge ki reasoning print karo
      console.log(`   🧠 Judge says: ${evalResult.reasoning}`);
    } catch (error) {
      console.error(`   ❌ ERROR:`, error);
      results.push({ query: testCase.query, score: 0, status: "❌ ERROR" });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const averageScore = totalScore / GOLDEN_DATASET.length;
  const passRate = (passedCases / GOLDEN_DATASET.length) * 100;

  console.log("\n=========================================");
  console.log("📊 EVAL SUMMARY");
  console.log("=========================================");
  console.table(
    results.map((r) => ({
      Query: r.query.substring(0, 30) + "...",
      Score: `${(r.score * 100).toFixed(1)}%`,
      Status: r.status,
    })),
  );

  console.log(
    `\n🏆 Overall Average Score: ${(averageScore * 100).toFixed(1)}%`,
  );
  console.log(
    `✅ Pass Rate (>=70%): ${passRate.toFixed(1)}% (${passedCases}/${GOLDEN_DATASET.length})`,
  );

  if (averageScore >= 0.85) {
    console.log("🎉 EXCELLENT! Your RAG pipeline is production-ready.");
  } else if (averageScore >= 0.7) {
    console.log("⚠️ GOOD, but needs optimization. Check the failed cases.");
  } else {
    console.log("🚨 POOR! Your retrieval pipeline needs serious fixing.");
  }
}

runEvals();
