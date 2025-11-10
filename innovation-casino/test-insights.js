// Test script to verify insights generation
async function testInsights() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.log("Usage: node test-insights.js <sessionId>");
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // First, trigger result calculation
    console.log("Calculating results for session:", sessionId);
    const calcResponse = await fetch(`${baseUrl}/api/vote/results?sessionId=${sessionId}&refresh=true`);

    if (!calcResponse.ok) {
      console.error("Failed to calculate results:", await calcResponse.text());
      return;
    }

    const results = await calcResponse.json();

    console.log("\n=== RESULTS SUMMARY ===");
    console.log("Total Participants:", results.results?.summary?.totalParticipants || 0);
    console.log("Layer 1 Chips:", results.results?.summary?.totalLayer1Chips || 0);
    console.log("Layer 2 Chips:", results.results?.summary?.totalLayer2Chips || 0);

    console.log("\n=== LAYER 1 RESULTS ===");
    if (results.results?.layer1) {
      console.log("Total Allocations:", results.results.layer1.totalAllocations);
      console.log("Total Chips:", results.results.layer1.totalChips);
      console.log("Scenarios:", results.results.layer1.scenarios?.length || 0);

      if (results.results.layer1.scenarios?.length > 0) {
        console.log("\nTop 3 Scenarios:");
        results.results.layer1.scenarios
          .sort((a, b) => b.totals.totalChips - a.totals.totalChips)
          .slice(0, 3)
          .forEach((s, i) => {
            console.log(`  ${i+1}. ${s.title}: ${s.totals.totalChips} chips`);
          });
      }
    }

    console.log("\n=== LAYER 2 RESULTS ===");
    if (results.results?.layer2) {
      const layer2Entries = Object.entries(results.results.layer2);
      console.log("Pain Point Groups:", layer2Entries.length);

      layer2Entries.forEach(([painPointId, groupResults]) => {
        console.log(`\n${painPointId}:`);
        console.log(`  Total Allocations: ${groupResults?.totalAllocations || 0}`);
        console.log(`  Total Chips: ${groupResults?.totalChips || 0}`);
        console.log(`  Scenarios: ${groupResults?.scenarios?.length || 0}`);

        if (groupResults?.scenarios?.length > 0) {
          const topScenario = [...groupResults.scenarios]
            .sort((a, b) => b.totals.totalChips - a.totals.totalChips)[0];
          console.log(`  Top Solution: ${topScenario.title} (${topScenario.totals.totalChips} chips)`);
        }

        if (groupResults?.boldnessTotals) {
          console.log("  Boldness Distribution:");
          Object.values(groupResults.boldnessTotals).forEach(bt => {
            console.log(`    ${bt.label}: ${bt.totals.totalChips} chips (${bt.percentageOfLayer}%)`);
          });
        }
      });
    }

    console.log("\n=== DEPARTMENTS ===");
    if (results.results?.departments) {
      console.log("Layer 1 Department Stats:");
      Object.entries(results.results.departments.layer1)
        .slice(0, 5)
        .forEach(([dept, stats]) => {
          console.log(`  ${dept}: ${stats?.totalChips || 0} chips`);
        });
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

testInsights();