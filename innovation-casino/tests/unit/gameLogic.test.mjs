import test from 'node:test';
import assert from 'node:assert/strict';

const utilsModule = await import(new URL('../../.tests-dist/lib/utils.js', import.meta.url));
const gameLogicModule = await import(new URL('../../.tests-dist/lib/gameLogic.js', import.meta.url));

const { determineTopScenario } = utilsModule;
const { buildResultsSummary } = gameLogicModule;

test('determineTopScenario picks the scenario with the most chips', () => {
  const allocations = {
    scenarioA: { time: 2, talent: 1, trust: 1 },
    scenarioB: { time: 0, talent: 4, trust: 1 },
  };

  assert.equal(determineTopScenario(allocations), 'scenarioB');
});

test('determineTopScenario breaks ties using provided randomizer', () => {
  const allocations = {
    scenarioA: { time: 1, talent: 2, trust: 1 },
    scenarioB: { time: 2, talent: 1, trust: 1 },
  };

  const rngFirst = () => 0.1;
  const rngSecond = () => 0.8;

  assert.equal(determineTopScenario(allocations, rngFirst), 'scenarioA');
  assert.equal(determineTopScenario(allocations, rngSecond), 'scenarioB');
});

test('buildResultsSummary aggregates layer stats into a summary object', () => {
  const metadata = {
    totalParticipants: 120,
    layer1Allocations: 60,
    layer2Allocations: 40,
    totalAllocations: 100,
  };

  const layer1 = {
    totalAllocations: 60,
    totalChips: 720,
    scenarios: [],
  };

  const layer2 = {
    'pain-point-a': { totalAllocations: 30, totalChips: 360, scenarios: [] },
    'pain-point-b': { totalAllocations: 10, totalChips: 120, scenarios: [] },
  };

  const summary = buildResultsSummary(metadata, layer1, layer2);

  assert.deepEqual(summary, {
    totalParticipants: 120,
    layer1Allocations: 60,
    layer2Allocations: 40,
    totalLayer1Chips: 720,
    totalLayer2Chips: 480,
  });
});
