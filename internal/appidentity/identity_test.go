package appidentity

import (
	"strings"
	"testing"
)

func TestAppUserModelIDIsStableAndVersionIndependent(t *testing.T) {
	if AppUserModelID != "Reasonix.Wails" {
		t.Fatalf("AppUserModelID = %q, want stable current-generation identity %q", AppUserModelID, "Reasonix.Wails")
	}
	if strings.ContainsAny(AppUserModelID, " \t\r\n") || len(AppUserModelID) > 128 {
		t.Fatalf("invalid AppUserModelID %q", AppUserModelID)
	}
}

func TestAppUserModelIDDoesNotMergeLegacyTauriDesktop(t *testing.T) {
	if AppUserModelID == legacyTauriAppUserModelID {
		t.Fatalf("current AppUserModelID %q must remain distinct from Reasonix Desktop 0.53", AppUserModelID)
	}
}

func TestAppUserModelIDDoesNotMergeUpstreamReasonix(t *testing.T) {
	if AppUserModelID == legacyWailsAppUserModelID {
		t.Fatalf("current AppUserModelID %q must remain distinct from upstream Reasonix", AppUserModelID)
	}
}
