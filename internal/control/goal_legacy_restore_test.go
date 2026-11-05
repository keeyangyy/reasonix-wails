package control

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"reasonix/internal/agent"
	"reasonix/internal/event"
)

func writeLegacyGoalArchive(t *testing.T, root, taskID, goal string) string {
	t.Helper()
	taskRoot := filepath.Join(root, ".reasonix", "autoresearch", taskID)
	if err := os.MkdirAll(filepath.Join(taskRoot, "state"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(taskRoot, "logs"), 0o755); err != nil {
		t.Fatal(err)
	}
	for name, body := range map[string]string{
		"state/task_spec.json":        `{"task_id":"` + taskID + `","goal":"` + goal + `","allowed_operations":{"write":true},"success_criteria":[]}`,
		"state/progress.json":         `{"status":"running","updated_at":"2026-06-30T10:00:00Z"}`,
		"state/directions_tried.json": "[]\n",
		"state/findings.jsonl":        "",
		"state/iteration_log.jsonl":   "",
		"logs/heartbeat.jsonl":        "",
	} {
		if err := os.WriteFile(filepath.Join(taskRoot, name), []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return taskRoot
}

func TestUnknownPersistedBudgetClassFallsBackToGoalClassification(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "session.jsonl")
	raw, err := json.Marshal(goalState{Goal: "fix the crash in settings", Status: GoalStatusRunning, BudgetClass: "future-budget-class", TurnsLimit: 99})
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(goalStatePath(path), raw, 0o644); err != nil {
		t.Fatal(err)
	}
	g := &goalMachine{}
	g.setStatePath(goalStatePath(path))
	_, _, migrated, _ := g.restoreFromState(path)
	if !migrated || g.budgetClass != budgetClassWrite || g.turnsLimit != unlimitedGoalTurns {
		t.Fatalf("unknown budget restore = migrated:%v class:%q turns:%d", migrated, g.budgetClass, g.turnsLimit)
	}
}

func TestGoalSidecarWriterFencesLegacyAutoResearchForEveryBudget(t *testing.T) {
	tests := []struct {
		name  string
		goal  string
		class string
	}{
		{name: "simple", goal: "summarize the current status", class: budgetClassSimple},
		{name: "write", goal: "fix the settings crash", class: budgetClassWrite},
		{name: "research", goal: "investigate the latency regression thoroughly", class: budgetClassResearch},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			sessionPath := filepath.Join(dir, "session.jsonl")
			g := &goalMachine{statePath: goalStatePath(sessionPath)}
			path, raw, ok := g.set(tt.goal, tt.class, nil)
			if !ok {
				t.Fatal("set did not produce sidecar data")
			}
			var state goalState
			if err := json.Unmarshal(raw, &state); err != nil {
				t.Fatal(err)
			}
			if state.ResearchMode != GoalResearchOff || state.AutoResearchTaskID != "" {
				t.Fatalf("legacy reader fence missing: %+v", state)
			}
			if state.BudgetClass != tt.class || state.TurnsLimit != unlimitedGoalTurns {
				t.Fatalf("compatibility state = %+v, want class %s with unlimited turns", state, tt.class)
			}
			// Frozen previous readers treated any non-Off mode or retained task id
			// as an AutoResearch activation signal.
			var legacyReader struct {
				ResearchMode       GoalResearchMode `json:"researchMode"`
				AutoResearchTaskID string           `json:"autoResearchTaskID"`
			}
			if err := json.Unmarshal(raw, &legacyReader); err != nil {
				t.Fatal(err)
			}
			if legacyReader.ResearchMode != GoalResearchOff || strings.TrimSpace(legacyReader.AutoResearchTaskID) != "" {
				t.Fatal("frozen previous reader would reactivate AutoResearch")
			}
			if err := g.writeStateErr(path, raw); err != nil {
				t.Fatal(err)
			}
			reloaded := &goalMachine{}
			reloaded.restoreFromState(sessionPath)
			if reloaded.budgetClass != tt.class || reloaded.turnsLimit != unlimitedGoalTurns {
				t.Fatalf("reloaded compatibility state = %q/%d, want %q/unlimited", reloaded.budgetClass, reloaded.turnsLimit, tt.class)
			}
		})
	}
}

func TestEmptyGoalSidecarStillFencesLegacyAutoResearch(t *testing.T) {
	g := &goalMachine{statePath: filepath.Join(t.TempDir(), "goal.json")}
	_, raw, ok := g.set("", "", nil)
	if !ok {
		t.Fatal("empty Goal did not produce stopped sidecar state")
	}
	var state goalState
	if err := json.Unmarshal(raw, &state); err != nil {
		t.Fatal(err)
	}
	if state.ResearchMode != GoalResearchOff || state.AutoResearchTaskID != "" || state.BudgetClass != "" {
		t.Fatalf("empty Goal downgrade fence = %+v", state)
	}
}

func TestGoalSetIdempotencyUsesEffectiveBudgetClass(t *testing.T) {
	g := &goalMachine{statePath: filepath.Join(t.TempDir(), "goal.json")}
	if _, _, ok := g.set("same goal", budgetClassSimple, nil); !ok {
		t.Fatal("initial set did not persist")
	}
	if _, _, ok := g.set("same goal", budgetClassSimple, nil); ok {
		t.Fatal("same Goal and budget class was not idempotent")
	}
	if _, _, ok := g.set("same goal", budgetClassResearch, nil); !ok {
		t.Fatal("budget class change was incorrectly treated as idempotent")
	}
	if g.budgetClass != budgetClassResearch || g.turnsLimit != unlimitedGoalTurns {
		t.Fatalf("budget upgrade = class:%q turns:%d", g.budgetClass, g.turnsLimit)
	}
}

func TestLegacySidecarInvalidArchivesRemainRetryableAndReadOnly(t *testing.T) {
	tests := []struct {
		name   string
		file   string
		mutate func(taskID string) string
	}{
		{name: "corrupt json", file: "state/progress.json", mutate: func(string) string { return "{not-json" }},
		{name: "invalid schema", file: "state/task_spec.json", mutate: func(string) string {
			return `{"task_id":"different-task","goal":"schema mismatch","allowed_operations":{"write":true},"success_criteria":[]}`
		}},
		{name: "empty goal", file: "state/task_spec.json", mutate: func(taskID string) string {
			return `{"task_id":"` + taskID + `","goal":"","allowed_operations":{"write":true},"success_criteria":[]}`
		}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			root := t.TempDir()
			taskID := "invalid-" + strings.ReplaceAll(tt.name, " ", "-")
			taskRoot := writeLegacyGoalArchive(t, root, taskID, "recover only from a valid archive")
			target := filepath.Join(taskRoot, tt.file)
			if err := os.WriteFile(target, []byte(tt.mutate(taskID)), 0o644); err != nil {
				t.Fatal(err)
			}
			archiveBefore, err := os.ReadFile(target)
			if err != nil {
				t.Fatal(err)
			}
			sessionPath := filepath.Join(root, "sessions", "s.jsonl")
			if err := os.MkdirAll(filepath.Dir(sessionPath), 0o755); err != nil {
				t.Fatal(err)
			}
			raw, err := json.Marshal(goalState{
				Status: GoalStatusRunning, ResearchMode: GoalResearchOn,
				AutoResearchTaskID: taskID, BudgetClass: budgetClassResearch, TurnsLimit: 40,
			})
			if err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(goalStatePath(sessionPath), raw, 0o644); err != nil {
				t.Fatal(err)
			}

			sess := agent.NewSession("sys")
			exec := agent.New(nil, nil, sess, agent.Options{}, event.Discard)
			c := New(Options{WorkspaceRoot: root, SessionDir: root, Executor: exec})
			c.Resume(sess, sessionPath)
			defer c.Close()
			if c.GoalStatus() != GoalStatusBlocked || c.ResumeGoal() {
				t.Fatalf("invalid archive status=%q resumed unexpectedly", c.GoalStatus())
			}
			persistedRaw, err := os.ReadFile(goalStatePath(sessionPath))
			if err != nil {
				t.Fatal(err)
			}
			var persisted goalState
			if err := json.Unmarshal(persistedRaw, &persisted); err != nil {
				t.Fatal(err)
			}
			if persisted.AutoResearchTaskID != taskID || persisted.ResearchMode != GoalResearchOn || persisted.StopCause != stopCauseLegacyArchive {
				t.Fatalf("retry state = %+v", persisted)
			}
			archiveAfter, err := os.ReadFile(target)
			if err != nil {
				t.Fatal(err)
			}
			if string(archiveAfter) != string(archiveBefore) {
				t.Fatal("invalid legacy archive changed during failed restore")
			}
		})
	}
}

func TestStaleLegacyArchiveRetryCannotReplaceNewGoal(t *testing.T) {
	var g goalMachine
	g.setLegacyArchiveBlocked("resume .reasonix/autoresearch/old/", budgetClassResearch, "missing", nil)
	_, epoch, ok := g.legacyArchiveBlockedState()
	if !ok {
		t.Fatal("legacy archive block state unavailable")
	}
	g.set("new goal", budgetClassWrite, nil)
	if _, resumed := g.resumeLegacyArchive(epoch, "stale archive goal"); resumed {
		t.Fatal("stale archive retry replaced a newer Goal")
	}
	if got := g.goalText(); got != "new goal" {
		t.Fatalf("Goal() = %q, want concurrent replacement", got)
	}
}

func TestStaleInitialLegacyFailureCannotBlockNewGoal(t *testing.T) {
	var g goalMachine
	g.set("legacy goal", budgetClassResearch, nil)
	epoch := g.continuationToken()
	g.set("new goal", budgetClassWrite, nil)

	if _, blocked := g.blockLegacyRestore(epoch, "archive disappeared"); blocked {
		t.Fatal("stale archive failure blocked a newer Goal")
	}
	if got := g.goalText(); got != "new goal" || g.statusForDisplay() != GoalStatusRunning {
		t.Fatalf("Goal = %q status=%q, want newer running Goal", got, g.statusForDisplay())
	}
}

func TestStaleLegacyMigrationCannotRewriteNewGoalSidecar(t *testing.T) {
	statePath := filepath.Join(t.TempDir(), "goal.json")
	g := &goalMachine{statePath: statePath}
	g.set("legacy goal", budgetClassResearch, nil)
	legacyEpoch := g.continuationToken()
	path, data, ok := g.set("new goal", budgetClassWrite, nil)
	if !ok {
		t.Fatal("new Goal did not build sidecar state")
	}
	if err := g.writeStateErr(path, data); err != nil {
		t.Fatal(err)
	}
	if applied, err := g.writeStateAtEpoch(legacyEpoch, nil); err != nil || applied {
		t.Fatalf("stale migration write = applied:%v err:%v", applied, err)
	}
	raw, err := os.ReadFile(statePath)
	if err != nil {
		t.Fatal(err)
	}
	var state goalState
	if err := json.Unmarshal(raw, &state); err != nil {
		t.Fatal(err)
	}
	if state.Goal != "new goal" {
		t.Fatalf("sidecar Goal = %q, want new goal", state.Goal)
	}
}

func TestLegacySidecarWithGoalMigratesWithoutArchive(t *testing.T) {
	root := t.TempDir()
	sessionPath := filepath.Join(root, "sessions", "s.jsonl")
	if err := os.MkdirAll(filepath.Dir(sessionPath), 0o755); err != nil {
		t.Fatal(err)
	}
	legacy := goalState{
		Goal: "preserve the original goal", Status: GoalStatusRunning,
		AutoResearchTaskID: "missing-archive", ResearchMode: GoalResearchOn,
		TurnsUsed: 2, TurnsLimit: 40,
	}
	raw, err := json.Marshal(legacy)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(goalStatePath(sessionPath), raw, 0o644); err != nil {
		t.Fatal(err)
	}

	sess := agent.NewSession("sys")
	exec := agent.New(nil, nil, sess, agent.Options{}, event.Discard)
	c := New(Options{WorkspaceRoot: root, SessionDir: root, Executor: exec})
	c.Resume(sess, sessionPath)
	defer c.Close()
	if got := c.Goal(); got != legacy.Goal {
		t.Fatalf("Goal() = %q, want %q", got, legacy.Goal)
	}
	if got := c.GoalStatus(); got != GoalStatusRunning {
		t.Fatalf("status = %q, want running", got)
	}
	if runtime := c.GoalRuntime(); runtime.TurnsUsed != 2 || runtime.TurnsLimit != 0 {
		t.Fatalf("runtime = %+v, want preserved research budget", runtime)
	}
	persistedRaw, err := os.ReadFile(goalStatePath(sessionPath))
	if err != nil {
		t.Fatal(err)
	}
	var persisted goalState
	if err := json.Unmarshal(persistedRaw, &persisted); err != nil {
		t.Fatal(err)
	}
	if persisted.AutoResearchTaskID != "" || persisted.ResearchMode != GoalResearchOff || persisted.BudgetClass != budgetClassResearch {
		t.Fatalf("migrated sidecar = %+v, want Goal-only research state", persisted)
	}
}

func TestMalformedLegacyArchivePathCannotResumeAsGoalText(t *testing.T) {
	c := New(Options{WorkspaceRoot: t.TempDir()})
	defer c.Close()

	c.SetGoal("resume .reasonix/autoresearch/../escape")
	if c.GoalStatus() != GoalStatusBlocked {
		t.Fatalf("status = %q, want blocked", c.GoalStatus())
	}
	if c.ResumeGoal() {
		t.Fatal("malformed archive path resumed as an ordinary Goal")
	}
	if c.GoalStatus() != GoalStatusBlocked {
		t.Fatalf("status after resume = %q, want blocked", c.GoalStatus())
	}
}

func TestMalformedExplicitLegacyGoalStaysBlockedAfterRestart(t *testing.T) {
	root := t.TempDir()
	sessionPath := filepath.Join(root, "sessions", "s.jsonl")
	rawGoal := "resume .reasonix/autoresearch/bad-task/../../escape"

	exec1 := agent.New(nil, nil, agent.NewSession("sys"), agent.Options{}, event.Discard)
	c1 := New(Options{WorkspaceRoot: root, SessionDir: root, Executor: exec1})
	c1.Resume(agent.NewSession("sys"), sessionPath)
	c1.SetGoal(rawGoal)
	if got := c1.GoalStatus(); got != GoalStatusBlocked {
		t.Fatalf("initial status = %q, want blocked", got)
	}
	c1.Close()

	c2 := New(Options{WorkspaceRoot: root, SessionDir: root})
	c2.Resume(agent.NewSession("sys"), sessionPath)
	defer c2.Close()
	if got := c2.GoalStatus(); got != GoalStatusBlocked {
		t.Fatalf("restart status = %q, want blocked", got)
	}
	if c2.ResumeGoal() {
		t.Fatal("malformed explicit archive resumed after restart")
	}
	if got := c2.Goal(); got != rawGoal {
		t.Fatalf("restart retry changed Goal = %q, want %q", got, rawGoal)
	}
}

func TestMissingLegacyGoalCommandDoesNotStartProviderTurn(t *testing.T) {
	runner := &gatedTurnRunner{started: make(chan struct{}), release: make(chan struct{})}
	c := New(Options{WorkspaceRoot: t.TempDir(), Runner: runner})
	t.Cleanup(c.Close)

	if !c.applyGoalCommand("/goal resume .reasonix/autoresearch/missing-task/", "") {
		t.Fatal("legacy Goal command was not parsed")
	}
	if c.Running() {
		t.Fatal("missing legacy archive started a provider turn")
	}
	if got := c.GoalStatus(); got != GoalStatusBlocked {
		t.Fatalf("GoalStatus() = %q, want blocked", got)
	}
}

func TestUnreadableExplicitLegacyArchiveBlocks(t *testing.T) {
	root := t.TempDir()
	const taskID = "unreadable-explicit-archive"
	taskRoot := writeLegacyGoalArchive(t, root, taskID, "never run an unreadable archive")
	specPath := filepath.Join(taskRoot, "state", "task_spec.json")
	if err := os.Remove(specPath); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(specPath, 0o755); err != nil {
		t.Fatal(err)
	}
	c := New(Options{WorkspaceRoot: root})
	t.Cleanup(c.Close)

	c.SetGoal("resume .reasonix/autoresearch/" + taskID + "/")
	if got := c.GoalStatus(); got != GoalStatusBlocked {
		t.Fatalf("GoalStatus() = %q, want blocked", got)
	}
	if got := c.Goal(); got != "resume .reasonix/autoresearch/"+taskID+"/" {
		t.Fatalf("Goal() = %q, archive goal must not be trusted", got)
	}
}
