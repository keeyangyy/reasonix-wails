import type { CollaborationMode } from "../lib/types";
import { useGoalActionHandler } from "../lib/goalAction";
import { useCommittedCommand } from "../lib/useCommittedCommand";

/** Void Composer events share one error boundary; awaited send paths still reject. */
export function useComposerGoalCommands(input: {
  applyGoal: (goal: string) => Promise<void>;
  applyCollaborationMode: (mode: CollaborationMode) => Promise<void>;
  pauseGoal?: () => void;
  resumeGoal?: () => void;
  setEffort?: (level: string) => void;
}) {
  const { runGoalAction } = useGoalActionHandler();
  const clearGoalFromUi = useCommittedCommand(() => runGoalAction(() => input.applyGoal("")));
  const setCollaborationModeFromUi = useCommittedCommand((mode: CollaborationMode) => runGoalAction(() => input.applyCollaborationMode(mode)));
  const pauseGoalFromUi = useCommittedCommand(() => input.pauseGoal?.());
  const resumeGoalFromUi = useCommittedCommand(() => input.resumeGoal?.());
  const setEffortFromUi = useCommittedCommand((level: string) => input.setEffort?.(level));
  return { clearGoalFromUi, setCollaborationModeFromUi, pauseGoalFromUi, resumeGoalFromUi, setEffortFromUi };
}
