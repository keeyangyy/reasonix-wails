//go:build !windows

package main

// waitForUpdateRelaunchParent is a no-op off Windows: only the single-exe
// Windows install path relaunches a replacement while the old process is still
// exiting.
func waitForUpdateRelaunchParent() {}
