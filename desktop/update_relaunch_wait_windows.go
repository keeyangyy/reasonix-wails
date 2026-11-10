//go:build windows

package main

import (
	"os"
	"strconv"
	"strings"
	"time"

	"golang.org/x/sys/windows"
)

// updateRelaunchParentWait bounds how long a freshly replaced single exe waits
// for the process it replaced to exit. The old image normally exits within a
// second; the bound only keeps a stuck parent from blocking startup forever.
const updateRelaunchParentWait = 30 * time.Second

// waitForUpdateRelaunchParent blocks a self-updated single-exe instance until
// the process it replaced has exited. Without this the new process would start
// while the old one still holds Wails' single-instance lock, be treated as a
// second instance, and quit.
func waitForUpdateRelaunchParent() {
	raw := strings.TrimSpace(os.Getenv(updateRelaunchParentPIDEnv))
	if raw == "" {
		return
	}
	// The variable is for this launch only; do not leak it into children.
	_ = os.Unsetenv(updateRelaunchParentPIDEnv)
	pid, err := strconv.Atoi(raw)
	if err != nil || pid <= 0 || pid == os.Getpid() {
		return
	}
	handle, err := windows.OpenProcess(windows.SYNCHRONIZE, false, uint32(pid))
	if err != nil {
		return
	}
	defer windows.CloseHandle(handle)
	deadline := time.Now().Add(updateRelaunchParentWait)
	for {
		status, err := windows.WaitForSingleObject(handle, 200)
		if err != nil || status == windows.WAIT_OBJECT_0 {
			return
		}
		if time.Now().After(deadline) {
			return
		}
	}
}
