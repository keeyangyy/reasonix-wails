package agent

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

// A sidecar written by the Studio line carries fields this build does not
// model (archived, pinned, auto_archived_at, ...). Saving here must not erase
// them: one line writing a session the other archived would otherwise make it
// reappear in the everyday list.
func TestSaveBranchMetaKeepsUnmodeledStudioFields(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "20261109-084157.415334100-deepseek-flash.jsonl")
	if err := os.WriteFile(path, []byte(`{"role":"user","content":"hi"}`+"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	// As the Studio line leaves it: archived plus fields this build never models.
	original := `{
  "id": "20261109-084157.415334100-deepseek-flash",
  "created_at": "2026-11-09T08:41:57Z",
  "updated_at": "2026-11-09T08:42:03Z",
  "scope": "global",
  "archived": true,
  "pinned": true,
  "auto_archived_at": "2026-11-10T00:00:00Z",
  "finished_at": "2026-11-09T08:42:03Z",
  "viewed_at": "2026-11-09T09:00:00Z",
  "superseded": false,
  "recovery_root_id": "root-1"
}
`
	if err := os.WriteFile(BranchMetaPath(path), []byte(original), 0o600); err != nil {
		t.Fatal(err)
	}

	// This line saves a title change, exactly like a rename or an auto-title.
	if err := SaveBranchMeta(path, BranchMeta{
		CustomTitle: "renamed here",
		Scope:       "global",
	}); err != nil {
		t.Fatal(err)
	}

	raw, err := os.ReadFile(BranchMetaPath(path))
	if err != nil {
		t.Fatal(err)
	}
	var saved map[string]json.RawMessage
	if err := json.Unmarshal(raw, &saved); err != nil {
		t.Fatalf("saved sidecar is not valid JSON: %v\n%s", err, raw)
	}
	for _, key := range []string{
		"archived", "pinned", "auto_archived_at", "finished_at",
		"viewed_at", "superseded", "recovery_root_id",
	} {
		if _, ok := saved[key]; !ok {
			t.Errorf("save dropped Studio field %q\n%s", key, raw)
		}
	}
	var archived bool
	if err := json.Unmarshal(saved["archived"], &archived); err != nil || !archived {
		t.Fatalf("archived = %s, want true", saved["archived"])
	}
	// This line's own change still landed.
	var title string
	if err := json.Unmarshal(saved["custom_title"], &title); err != nil || title != "renamed here" {
		t.Fatalf("custom_title = %s, want the rename", saved["custom_title"])
	}
}

// When this build owns the sidecar from the start there is nothing to preserve;
// the encoding must stay byte-stable (no stray commas or reordering).
func TestSaveBranchMetaWithoutUnmodeledFieldsKeepsPlainEncoding(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "plain.jsonl")
	if err := os.WriteFile(path, []byte(`{"role":"user","content":"hi"}`+"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := SaveBranchMeta(path, BranchMeta{Scope: "project", WorkspaceRoot: dir}); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(BranchMetaPath(path))
	if err != nil {
		t.Fatal(err)
	}
	var saved map[string]json.RawMessage
	if err := json.Unmarshal(raw, &saved); err != nil {
		t.Fatalf("saved sidecar is not valid JSON: %v\n%s", err, raw)
	}
	if _, ok := saved["scope"]; !ok {
		t.Fatalf("scope missing from saved sidecar\n%s", raw)
	}
}
