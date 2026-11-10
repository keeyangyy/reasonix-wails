package main

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"reasonix/internal/installlayout"
)

// writeReleaseMember creates one packaged executable name in dir.
func writeReleaseMember(t *testing.T, dir, name string) string {
	t.Helper()
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, []byte("MZ"), 0o755); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestIsSingleExeInstallOnlyCurrentExecutable(t *testing.T) {
	if runtime.GOOS != "windows" {
		t.Skip("single-exe layout is the Windows install path")
	}
	dir := t.TempDir()
	exe := writeReleaseMember(t, dir, installlayout.PortableAliasName())
	if !isSingleExeInstall(exe) {
		t.Fatalf("a directory holding only %s must count as a single-exe install", filepath.Base(exe))
	}
}

func TestIsSingleExeInstallRejectsReleaseUnitSiblings(t *testing.T) {
	if runtime.GOOS != "windows" {
		t.Skip("single-exe layout is the Windows install path")
	}
	for _, sibling := range []string{
		installlayout.LauncherBinaryName(),
		installlayout.UpdateHelperBinaryName(),
		installlayout.DesktopBinaryName(),
	} {
		dir := t.TempDir()
		exe := writeReleaseMember(t, dir, installlayout.PortableAliasName())
		writeReleaseMember(t, dir, sibling)
		if isSingleExeInstall(exe) {
			t.Fatalf("a directory holding %s beside the desktop is not a single-exe install", sibling)
		}
	}
}

func TestIsSingleExeInstallRejectsEmptyPath(t *testing.T) {
	if isSingleExeInstall("") {
		t.Fatal("an empty executable path is not a single-exe install")
	}
}
