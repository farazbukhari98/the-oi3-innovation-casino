'use client';

import { useState } from 'react';
import { Session } from '@/types/session';
import { SessionResults } from '@/types/results';
import { getErrorMessage } from '@/lib/utils';

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

      csv += `Layer 1 Allocations:,${summary.layer1Allocations}\n`;
      csv += `Layer 2 Allocations:,${summary.layer2Allocations}\n`;
      csv += `Layer 1 Chips:,${layer1.totalChips}\n`;
      csv += `Layer 2 Chips:,${summary.totalLayer2Chips}\n\n`;

      csv += 'Layer 1 – Pain Point Investments\n';
      layer1.scenarios.forEach((scenario, index) => {
        csv += `Scenario ${index + 1},${escapeCsv(scenario.title)}\n`;
        csv += `Description,${escapeCsv(scenario.description)}\n`;
        csv += 'Metric,Time,Talent,Trust,Total Chips\n';
        csv += `Chips,${scenario.totals.time},${scenario.totals.talent},${scenario.totals.trust},${scenario.totals.totalChips}\n`;
        csv += `Percentages,${scenario.percentages.time}%,${scenario.percentages.talent}%,${scenario.percentages.trust}%,100%\n\n`;
      });

      csv += 'Layer 2 – Solution Investments by Pain Point\n';
      Object.entries(layer2).forEach(([painPointId, groupResults], index) => {
        const painPointTitle = session.scenarios[painPointId]?.title ?? `Pain Point ${index + 1}`;
        csv += `Pain Point,${escapeCsv(painPointTitle)}\n`;
        csv += `Allocations,${groupResults.totalAllocations}\n`;
        csv += `Total Chips,${groupResults.totalChips}\n`;
        groupResults.scenarios.forEach((scenario) => {
          csv += `Solution,${escapeCsv(scenario.title)}\n`;
          csv += `Description,${escapeCsv(scenario.description)}\n`;
          csv += 'Metric,Time,Talent,Trust,Total Chips\n';
          csv += `Chips,${scenario.totals.time},${scenario.totals.talent},${scenario.totals.trust},${scenario.totals.totalChips}\n`;
          const timePercent = scenario.percentages.time ?? 0;
          const talentPercent = scenario.percentages.talent ?? 0;
          const trustPercent = scenario.percentages.trust ?? 0;
          csv += `Percentages,${timePercent}%,${talentPercent}%,${trustPercent}%,100%\n\n`;
        });
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
