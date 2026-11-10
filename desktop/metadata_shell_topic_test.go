package main

import (
	"context"
	"os"
	"testing"
)

// A topic ID left in desktop-projects.json by a legacy Studio fork has no
// session file in this client. The sidebar must not resurrect it as an
// untitled row, while a topic that still owns a conversation stays.
func TestMetadataTopicsHideShellWithoutConversation(t *testing.T) {
	isolateDesktopUserDirs(t)
	root := t.TempDir()
	if err := addProject(root, "Project"); err != nil {
		t.Fatal(err)
	}
	sessionDir := desktopSessionDir(root)
	if err := os.MkdirAll(sessionDir, 0o755); err != nil {
		t.Fatal(err)
	}
	// The shell keeps the placeholder title, exactly like a Studio-era fork.
	if err := setTopicTitle(root, "shell-topic", defaultTopicTitle); err != nil {
		t.Fatal(err)
	}
	if err := setTopicTitle(root, "real-topic", "Real conversation"); err != nil {
		t.Fatal(err)
	}
	if err := updateProjectsFile(func(f *desktopProjectFile) (bool, error) {
		i := projectIndexByRoot(f.Projects, root)
		f.Projects[i].Topics = []string{"shell-topic", "real-topic"}
		return true, nil
	}); err != nil {
		t.Fatal(err)
	}
	writeTopicSession(t, sessionDir, "real.jsonl", "real-topic", "Real conversation", root)

	app := NewApp()
	installSessionCatalogForTest(t, app, sessionDir, "project", root)
	catalog := app.sessionCatalog.Load()
	if catalog == nil {
		t.Fatal("session catalog is not installed")
	}
	if err := app.syncSessionCatalogMetadata(context.Background(), catalog); err != nil {
		t.Fatal(err)
	}

	topics := app.metadataProjectTopics("project", root)
	if len(topics) != 1 || topics[0].TopicID != "real-topic" {
		t.Fatalf("metadata topics = %+v, want only the real conversation", topics)
	}
}

// Without a catalog (or a catalog that has never seen the topic) the metadata
// row is the only source, so it must stay visible.
func TestMetadataTopicsKeepShellWhenCatalogCannotAnswer(t *testing.T) {
	isolateDesktopUserDirs(t)
	root := t.TempDir()
	if err := addProject(root, "Project"); err != nil {
		t.Fatal(err)
	}
	if err := setTopicTitle(root, "shell-topic", defaultTopicTitle); err != nil {
		t.Fatal(err)
	}
	if err := updateProjectsFile(func(f *desktopProjectFile) (bool, error) {
		i := projectIndexByRoot(f.Projects, root)
		f.Projects[i].Topics = []string{"shell-topic"}
		return true, nil
	}); err != nil {
		t.Fatal(err)
	}

	app := NewApp()
	topics := app.metadataProjectTopics("project", root)
	if len(topics) != 1 || topics[0].TopicID != "shell-topic" {
		t.Fatalf("metadata topics = %+v, want the shell kept without a catalog", topics)
	}
}

// A projection that no longer matches the directory on disk says nothing about
// whether a topic owns a conversation — a session written since the last scan
// is simply not indexed yet. The shell must survive that case.
func TestMetadataTopicsKeepShellWhenProjectionStale(t *testing.T) {
	isolateDesktopUserDirs(t)
	root := t.TempDir()
	if err := addProject(root, "Project"); err != nil {
		t.Fatal(err)
	}
	sessionDir := desktopSessionDir(root)
	if err := os.MkdirAll(sessionDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := setTopicTitle(root, "shell-topic", defaultTopicTitle); err != nil {
		t.Fatal(err)
	}
	if err := updateProjectsFile(func(f *desktopProjectFile) (bool, error) {
		i := projectIndexByRoot(f.Projects, root)
		f.Projects[i].Topics = []string{"shell-topic"}
		return true, nil
	}); err != nil {
		t.Fatal(err)
	}

	app := NewApp()
	installSessionCatalogForTest(t, app, sessionDir, "project", root)
	catalog := app.sessionCatalog.Load()
	if err := app.syncSessionCatalogMetadata(context.Background(), catalog); err != nil {
		t.Fatal(err)
	}
	// Write a session after the scan: the catalog signature no longer matches.
	writeTopicSession(t, sessionDir, "late.jsonl", "late-topic", "Late conversation", root)

	topics := app.metadataProjectTopics("project", root)
	if len(topics) != 1 || topics[0].TopicID != "shell-topic" {
		t.Fatalf("metadata topics = %+v, want the shell kept while the projection is stale", topics)
	}
}
