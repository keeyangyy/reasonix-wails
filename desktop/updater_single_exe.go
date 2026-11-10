package main

import (
	"os"
	"path/filepath"

	"reasonix/internal/installlayout"
)

// singleExeInstall reports whether this install is one executable in one
// directory: no launcher, no update helper, no versioned pointer. That is the
// layout both the single-exe portable archive and the single-exe NSIS install
// create.
func singleExeInstall() bool {
	return isSingleExeInstall(currentExecutablePath())
}

func isSingleExeInstall(exe string) bool {
	if exe == "" {
		return false
	}
	dir := filepath.Dir(exe)
	present := 0
	for _, name := range []string{
		installlayout.DesktopBinaryName(),
		installlayout.LauncherBinaryName(),
		installlayout.PortableAliasName(),
		installlayout.UpdateHelperBinaryName(),
		"reasonix-guard.exe",
	} {
		if name == "" {
			continue
		}
		info, err := os.Lstat(filepath.Join(dir, name))
		if err == nil && info.Mode().IsRegular() {
			present++
		}
	}
	return present <= 1
}
