'use client';

import { useState } from 'react';
import { Session } from '@/types/session';
import { SessionResults } from '@/types/results';
import { Vote } from '@/types/vote';
import { getErrorMessage, sumChipAllocation } from '@/lib/utils';
import { getSessionAllocations, getSessionParticipants } from '@/lib/database';

interface ExportButtonProps {
  sessionId: string;
}

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

export function ExportButton({ sessionId }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const sessionRes = await fetch(`/api/session/${sessionId}`);

      if (!sessionRes.ok) {
        throw new Error('Failed to fetch session details for export');
      }

      const { session } = (await sessionRes.json()) as { session: Session };

      let csv = 'Innovation Casino Session Export\n\n';
      csv += `Session ID:,${sessionId}\n`;
      csv += `Created:,${new Date(session.createdAt).toLocaleString()}\n`;
      csv += `Total Participants:,${session.metadata.totalParticipants}\n`;
      const resultsRes = await fetch(`/api/vote/results?sessionId=${sessionId}`);
      if (!resultsRes.ok) {
        throw new Error('Failed to fetch allocation results');
      }
      const { results } = (await resultsRes.json()) as { results: SessionResults };

      if (!results) {
        throw new Error('No results have been generated for this session yet.');
      }

      const layer1 = results.layer1;
      const layer2 = results.layer2;
      const summary = results.summary;

      const participants = await getSessionParticipants(sessionId);
      const votes = await getSessionAllocations(sessionId);

      const focusAreaLookup = session.scenarioOrder.reduce<Record<string, string>>((acc, id) => {
        const scenario = session.scenarios[id];
        if (scenario) {
          acc[id] = scenario.title;
        }
        return acc;
      }, {});

      const solutionLookup = Object.entries(session.solutionsByPainPoint).reduce<
        Record<string, { title: string; boldness?: string; innovationLabel?: string; painPointId: string }>
      >((acc, [painPointId, solutions]) => {
        solutions.forEach((solution) => {
          acc[solution.id] = {
            title: solution.title,
            boldness: solution.boldness,
            innovationLabel: solution.innovationLabel,
            painPointId,
          };
        });
        return acc;
      }, {});

      const layer1VoteMap = new Map<string, Vote>();
      const layer2VoteMap = new Map<string, Vote>();
      votes.forEach((vote) => {
        if (vote.layer === 'layer1') {
          layer1VoteMap.set(vote.participantId, vote);
        } else if (vote.layer === 'layer2') {
          layer2VoteMap.set(vote.participantId, vote);
        }
      });

      csv += `Member Access Allocations:,${summary.layer1Allocations}\n`;
      csv += `High Roller Allocations:,${summary.layer2Allocations}\n`;
      csv += `Member Access Chips:,${layer1.totalChips}\n`;
      csv += `High Roller Chips:,${summary.totalLayer2Chips}\n\n`;

      csv += 'Member Access – Pain Point Investments\n';
      layer1.scenarios.forEach((scenario, index) => {
        csv += `Scenario ${index + 1},${escapeCsv(scenario.title)}\n`;
        csv += `Description,${escapeCsv(scenario.description)}\n`;
        csv += 'Metric,Time,Talent,Trust,Total Chips\n';
        csv += `Chips,${scenario.totals.time},${scenario.totals.talent},${scenario.totals.trust},${scenario.totals.totalChips}\n`;
        csv += `Percentages,${scenario.percentages.time}%,${scenario.percentages.talent}%,${scenario.percentages.trust}%,100%\n\n`;
      });

      csv += 'High Roller – Personalized Solution Investments\n';
      Object.entries(layer2).forEach(([painPointId, groupResults], index) => {
        const painPointTitle = session.scenarios[painPointId]?.title ?? `Pain Point ${index + 1}`;
        csv += `Pain Point,${escapeCsv(painPointTitle)}\n`;
        csv += `Allocations,${groupResults.totalAllocations}\n`;
        csv += `Total Chips,${groupResults.totalChips}\n`;
        if (groupResults.boldnessTotals) {
          csv += 'Boldness,Innovation Label,Total Chips,Share of Chips,Participants Touching\n';
          Object.values(groupResults.boldnessTotals).forEach((tier) => {
            csv += `${escapeCsv(tier.label)},${escapeCsv(tier.innovationLabel)},${tier.totals.totalChips},${tier.percentageOfLayer}%,${tier.allocationCount}\n`;
          });
          csv += '\n';
        }
        groupResults.scenarios.forEach((scenario) => {
          csv += `Solution,${escapeCsv(scenario.title)}\n`;
          csv += `Description,${escapeCsv(scenario.description)}\n`;
          if (scenario.boldness) {
            csv += `Boldness,${escapeCsv(scenario.innovationLabel ?? scenario.boldness)}\n`;
          }
          csv += 'Metric,Time,Talent,Trust,Total Chips\n';
          csv += `Chips,${scenario.totals.time},${scenario.totals.talent},${scenario.totals.trust},${scenario.totals.totalChips}\n`;
          const timePercent = scenario.percentages.time ?? 0;
          const talentPercent = scenario.percentages.talent ?? 0;
          const trustPercent = scenario.percentages.trust ?? 0;
          csv += `Percentages,${timePercent}%,${talentPercent}%,${trustPercent}%,100%\n\n`;
        });
      });

      csv += 'Participant Allocations – Member Access Level\n';
      csv += 'Participant,Department,Focus Area,Time,Talent,Trust,Total Chips\n';
      participants.forEach((participantRecord) => {
        const participantName = participantRecord.name || 'Anonymous Player';
        const participantDepartment = participantRecord.department || 'Unspecified Department';
        const vote = layer1VoteMap.get(participantRecord.id);
        if (!vote) {
          csv += `${escapeCsv(participantName)},${escapeCsv(participantDepartment)},No submission,,,,\n`;
          return;
        }

        let hasContribution = false;
        (Object.entries(vote.allocations) as Array<[string, Vote['allocations'][string]]>).forEach(
          ([scenarioId, allocation]) => {
            const total = sumChipAllocation(allocation);
            if (total <= 0) {
              return;
            }
            hasContribution = true;
            const focusArea = focusAreaLookup[scenarioId] ?? scenarioId;
            csv += `${escapeCsv(participantName)},${escapeCsv(participantDepartment)},${escapeCsv(focusArea)},${allocation.time},${allocation.talent},${allocation.trust},${total}\n`;
          }
        );

        if (!hasContribution) {
          csv += `${escapeCsv(participantName)},${escapeCsv(participantDepartment)},No chips placed,,,,\n`;
        }
      });

      csv += '\nParticipant Allocations – High Roller Level\n';
      csv += 'Participant,Department,Focus Area,Solution,Boldness,Time,Talent,Trust,Total Chips\n';
      participants.forEach((participantRecord) => {
        const participantName = participantRecord.name || 'Anonymous Player';
        const participantDepartment = participantRecord.department || 'Unspecified Department';
        const vote = layer2VoteMap.get(participantRecord.id);
        const routedPainPoint = vote?.painPointId || participantRecord.layer1Selection;
        const focusArea = routedPainPoint ? focusAreaLookup[routedPainPoint] ?? routedPainPoint : 'Not routed';

        if (!vote || !vote.painPointId) {
          csv += `${escapeCsv(participantName)},${escapeCsv(participantDepartment)},${escapeCsv(focusArea)},No submission,,,,,\n`;
          return;
        }

        let hasContribution = false;
        (Object.entries(vote.allocations) as Array<[string, Vote['allocations'][string]]>).forEach(
          ([solutionId, allocation]) => {
            const total = sumChipAllocation(allocation);
            if (total <= 0) {
              return;
            }
            hasContribution = true;
            const solutionMeta = solutionLookup[solutionId];
            csv += `${escapeCsv(participantName)},${escapeCsv(participantDepartment)},${escapeCsv(focusArea)},${escapeCsv(solutionMeta?.title ?? solutionId)},${escapeCsv(solutionMeta?.innovationLabel ?? solutionMeta?.boldness ?? '')},${allocation.time},${allocation.talent},${allocation.trust},${total}\n`;
          }
        );

        if (!hasContribution) {
          csv += `${escapeCsv(participantName)},${escapeCsv(participantDepartment)},${escapeCsv(focusArea)},No chips placed,,,,,\n`;
        }
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `innovation-casino-${sessionId}-${Date.now()}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      alert(`Failed to export data: ${getErrorMessage(error)}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`
        btn-casino inline-flex items-center justify-center gap-2 px-8 py-3 text-sm
        ${exporting ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      {exporting ? 'Exporting...' : '📊 Export Session CSV'}
    </button>
  );
}
