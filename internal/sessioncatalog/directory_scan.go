package sessioncatalog

import (
	"context"
	"database/sql"
	"errors"
)

type DirectoryScanStatus struct {
	Known bool
	State string
	Error string
}

// CountDirectorySessions reports the number of non-missing rows currently
// projected for a directory. It is intentionally content-free so diagnostics
// can compare the disposable projection with authoritative file enumeration.
func (c *Catalog) CountDirectorySessions(ctx context.Context, path string) (int64, error) {
	if c == nil || c.db == nil {
		return 0, nil
	}
	var count int64
	err := c.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM catalog_sessions WHERE directory_key=? AND missing_since=0`, c.pathKey(path)).Scan(&count)
	return count, err
}

// DirectoryStatus exposes only scan completeness, never session contents.
// Desktop uses it to publish a per-workspace partial/complete projection while
// allowing already-indexed rows to remain visible during another directory's
// first scan or failure.
func (c *Catalog) DirectoryStatus(ctx context.Context, path string) DirectoryScanStatus {
	if c == nil || c.db == nil {
		return DirectoryScanStatus{}
	}
	path = cleanCatalogAccessPath(path)
	if path == "" {
		return DirectoryScanStatus{}
	}
	var status DirectoryScanStatus
	err := c.db.QueryRowContext(ctx, `SELECT state,error FROM catalog_directories WHERE path_key=?`, c.pathKey(path)).Scan(&status.State, &status.Error)
	if errors.Is(err, sql.ErrNoRows) || err != nil {
		return DirectoryScanStatus{}
	}
	status.Known = true
	return status
}

// DirectoryScanReady reports whether this directory has finished at least one
// catalog scan. An opened-but-unscanned current cache is not ready: ListTopics would
// otherwise treat "no rows yet" as "the user has no conversations".
func (c *Catalog) DirectoryScanReady(ctx context.Context, path string) bool {
	return c.DirectoryStatus(ctx, path).State == "ready"
}

// HasWorkspaceRecords reports whether any non-missing session is already
// projected for this workspace. Used so an in-progress scan that has written
// rows stays authoritative, while a brand-new empty cache does not.
func (c *Catalog) HasWorkspaceRecords(ctx context.Context, scope, workspaceRoot string) bool {
	if c == nil || c.db == nil {
		return false
	}
	scope, workspaceRoot = normalizeScope(scope, workspaceRoot)
	var n int
	err := c.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM catalog_sessions WHERE scope=? AND workspace_root_key=? AND missing_since=0`,
		scope, c.workspaceRootKey(scope, workspaceRoot)).Scan(&n)
	return err == nil && n > 0
}

// DirectoryProjectionFresh reports whether the projected directory signature
// still matches what the directory holds now. A projection that is behind the
// disk has no opinion about which topics own a conversation: it would call a
// freshly written session "missing" simply because no scan has run since.
func (c *Catalog) DirectoryProjectionFresh(ctx context.Context, path string) (bool, error) {
	if c == nil || c.db == nil {
		return false, nil
	}
	path = cleanCatalogAccessPath(path)
	if path == "" {
		return false, nil
	}
	var signature, state string
	err := c.db.QueryRowContext(ctx, `SELECT signature,state FROM catalog_directories WHERE path_key=?`,
		c.pathKey(path)).Scan(&signature, &state)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if state != "ready" {
		return false, nil
	}
	current, err := directorySignature(path)
	if err != nil {
		return false, err
	}
	return current == signature, nil
}

// TopicsWithSessions reports every topic of a workspace that still owns at
// least one projected session. Desktop uses one call per sidebar read instead
// of asking about each topic row in turn.
func (c *Catalog) TopicsWithSessions(ctx context.Context, scope, workspaceRoot string) (map[string]struct{}, error) {
	out := map[string]struct{}{}
	if c == nil || c.db == nil {
		return out, nil
	}
	scope, workspaceRoot = normalizeScope(scope, workspaceRoot)
	rows, err := c.db.QueryContext(ctx, `SELECT DISTINCT topic_id FROM catalog_sessions
		WHERE scope=? AND workspace_root_key=? AND missing_since=0 AND topic_id<>''`,
		scope, c.workspaceRootKey(scope, workspaceRoot))
	if err != nil {
		return out, err
	}
	defer rows.Close()
	for rows.Next() {
		var topicID string
		if err := rows.Scan(&topicID); err != nil {
			return out, err
		}
		out[topicID] = struct{}{}
	}
	return out, rows.Err()
}
