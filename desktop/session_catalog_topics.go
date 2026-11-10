package main

import "os"

// metadataSessionTopics returns the topics that still own a conversation, or
// nil when the catalog cannot vouch for this workspace: no catalog, a degraded
// read, or a projection whose directory signature no longer matches the disk.
// nil means "do not filter" — a stale projection calling a freshly written
// session missing must never hide a conversation the user can still open.
func (a *App) metadataSessionTopics(scope, workspaceRoot string) map[string]struct{} {
	catalog := a.sessionCatalog.Load()
	if catalog == nil {
		return nil
	}
	ctx, cancel := a.catalogReadContext()
	defer cancel()
	targets := 0
	for _, target := range a.sessionCatalogTargets() {
		if target.Scope != scope || (scope == "project" && !sameProjectRoot(target.WorkspaceRoot, workspaceRoot)) {
			continue
		}
		if _, err := os.Stat(target.Path); err != nil {
			continue
		}
		targets++
		fresh, err := catalog.DirectoryProjectionFresh(ctx, target.Path)
		if err != nil || !fresh {
			return nil
		}
	}
	if targets == 0 {
		return nil
	}
	topics, err := catalog.TopicsWithSessions(ctx, scope, workspaceRoot)
	if err != nil {
		return nil
	}
	return topics
}
