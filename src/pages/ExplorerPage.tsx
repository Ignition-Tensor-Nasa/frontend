import { ExplorerVisualDeck } from "../components/ExplorerVisualDeck";
import { ScenarioAssistant } from "../components/ScenarioAssistant";
import { SpecialCasesTile } from "../components/SpecialCasesTile";
import { FilterRail } from "../components/FilterRail";
import { ResultsTable } from "../components/ResultsTable";

export function ExplorerPage() {
  return (
    <div className="space-y-5 animate-panel-in">
      <ScenarioAssistant />
      <SpecialCasesTile />

      <div className="grid grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] gap-5 items-start">
        <FilterRail />
        <div className="space-y-5 min-w-0">
          <ExplorerVisualDeck />
          <ResultsTable />
        </div>
      </div>
    </div>
  );
}
