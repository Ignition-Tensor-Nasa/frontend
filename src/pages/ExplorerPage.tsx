import { ScenarioAssistant } from "../components/ScenarioAssistant";
import { FilterRail } from "../components/FilterRail";
import { ResultsTable } from "../components/ResultsTable";

export function ExplorerPage() {
  return (
    <div className="space-y-5 animate-panel-in">
      <ScenarioAssistant />

      <div className="grid grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] gap-5 items-start">
        <FilterRail />
        <ResultsTable />
      </div>
    </div>
  );
}
