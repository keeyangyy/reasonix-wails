package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func readTestFile(t *testing.T, path string) string {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}
func TestWindowsWebView2SmokeUsesExternalProductionBinaryContract(t *testing.T) {
	script := readTestFile(t, "../scripts/test-webview2-native-smoke.ps1")
	for _, want := range []string{
		`Resolve-Path $ExecutablePath`,
		`$env:REASONIX_HOME = $smokeHome`,
		`$env:REASONIX_STATE_HOME = $smokeState`,
		`$env:REASONIX_CACHE_HOME = $smokeCache`,
		`close_behavior = "quit"`,
		`$Process.MainWindowHandle`,
		`$_.Name -ieq "msedgewebview2.exe"`,
		`$_.CommandLine -match "--type=renderer"`,
		`UIAutomationClient`,
		`[System.Windows.Automation.ControlType]::Document`,
		`[System.Windows.Automation.ControlType]::Edit`,
		`[System.Windows.Automation.AutomationElement]::AutomationIdProperty`,
		`"composer-input"`,
		`[System.Windows.Automation.AndCondition]::new`,
		`[System.Windows.Automation.Condition[]]@($composerTypeCondition, $composerIdCondition)`,
		`$root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $composerCondition)`,
		`Update-NativeSmokeStability`,
		`a transient renderer handoff must reset without failing`,
		`$HealthySeconds consecutive seconds`,
		`$process.CloseMainWindow()`,
		`$process.WaitForExit(10000)`,
		`taskkill.exe /PID $process.Id /T /F`,
		`[IO.Directory]::Delete($deletePath, $true)`,
		`cleanup must remove a tree beyond MAX_PATH`,
	} {
		if !strings.Contains(script, want) {
			t.Errorf("Windows WebView2 smoke is missing production-binary contract %q", want)
		}
	}
	for _, forbidden := range []string{
		"REASONIX_WEBVIEW2_APPROVAL_SMOKE",
		"mock-tool-approval",
		"Element.prototype.animate",
		"WebView2ApprovalSmokeBridge",
		"Reasonix lost its main window or WebView2 renderer during the health window",
	} {
		if strings.Contains(script, forbidden) {
			t.Errorf("Windows WebView2 smoke still contains production instrumentation %q", forbidden)
		}
	}
}

func TestWindowsPackagerRejectsMissingOrPartialRequiredPayloadManifest(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("packaging script requires a POSIX shell with GNU find")
	}
	for _, tc := range []struct {
		name      string
		manifest  bool
		signature bool
		want      string
	}{
		{name: "missing", want: "signed Windows packaging requires"},
		{name: "manifest only", manifest: true, want: "must be provided together"},
		{name: "signature only", signature: true, want: "must be provided together"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			payload := t.TempDir()
			for _, name := range []string{
				"reasonix-wails.exe",
				"reasonix-guard.exe",
				"reasonix-launcher.exe",
				"reasonix-update-helper.exe",
				"reasonix-uninstall.exe",
			} {
				if err := os.WriteFile(filepath.Join(payload, name), []byte(name), 0o600); err != nil {
					t.Fatal(err)
				}
			}
			if tc.manifest {
				if err := os.WriteFile(filepath.Join(payload, "reasonix-payload.json"), []byte("{}"), 0o600); err != nil {
					t.Fatal(err)
				}
			}
			if tc.signature {
				if err := os.WriteFile(filepath.Join(payload, "reasonix-payload.json.minisig"), []byte("sig"), 0o600); err != nil {
					t.Fatal(err)
				}
			}
			cmd := exec.Command("bash", "../scripts/package-windows-desktop.sh", "amd64", payload)
			cmd.Env = append(os.Environ(), "REASONIX_REQUIRE_PAYLOAD_MANIFEST=1")
			output, err := cmd.CombinedOutput()
			if err == nil || !strings.Contains(string(output), tc.want) {
				t.Fatalf("packager error = %v, output = %q, want %q", err, output, tc.want)
			}
		})
	}
}

