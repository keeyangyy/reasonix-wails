package main

import (
	"bytes"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func writePortableFixture(t *testing.T, dir, name, content string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o755); err != nil {
		t.Fatal(err)
	}
}

func TestVerifyWindowsPortableSingleExeLayout(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("portable verification script requires a POSIX shell")
	}
	verify := filepath.Join("..", "scripts", "verify-windows-portable.sh")

	// A plausible desktop build: PE magic and a size above the sanity floor.
	dir := t.TempDir()
	good := filepath.Join(dir, "Reasonix-windows-amd64.exe")
	body := make([]byte, 11<<20)
	body[0], body[1] = 'M', 'Z'
	if err := os.WriteFile(good, body, 0o755); err != nil {
		t.Fatal(err)
	}
	if out, err := exec.Command("bash", verify, good).CombinedOutput(); err != nil {
		t.Fatalf("valid single-exe portable failed: %v\n%s", err, out)
	}

	// The old versioned tree must be rejected.
	tree := t.TempDir()
	treeExe := filepath.Join(tree, "Reasonix-windows-amd64.exe")
	if err := os.WriteFile(treeExe, body, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tree, "versions", "v1.20.0"), 0o755); err != nil {
		t.Fatal(err)
	}
	if out, err := exec.Command("bash", verify, treeExe).CombinedOutput(); err == nil {
		t.Fatalf("a versioned portable tree must fail, output=%s", out)
	}

	// A text stub is not a packaged build.
	stub := filepath.Join(t.TempDir(), "Reasonix-windows-amd64.exe")
	if err := os.WriteFile(stub, []byte("not a build"), 0o755); err != nil {
		t.Fatal(err)
	}
	if out, err := exec.Command("bash", verify, stub).CombinedOutput(); err == nil {
		t.Fatalf("a stub executable must fail, output=%s", out)
	}
}

func TestDesktopPackagesPreserveNativePlatformLaunchers(t *testing.T) {
	buildData, err := os.ReadFile("../scripts/desktop-build.sh")
	if err != nil {
		t.Fatal(err)
	}
	build := string(buildData)
	for _, want := range []string{
		`./cmd/reasonix-legacy-migrator`,
		`./cmd/reasonix-launcher`,
		`-H windowsgui`,
		`stamp_windows_executable "$guard_out" "Reasonix Legacy Migrator"`,
		`stamp_windows_executable "$launcher_out" "Reasonix Launcher"`,
		`stamp_windows_executable "build/windows/installer/$UPDATE_HELPER" "Reasonix Update Helper"`,
		`payload_dir="$ROOT/desktop/build/windows/signing-payload"`,
		`cp "build/bin/$BINNAME.exe" "$payload_dir/$BINNAME.exe"`,
		`cp "$launcher_out" "$payload_dir/$LAUNCHERNAME.exe"`,
		`cp "$guard_out" "$payload_dir/$GUARDNAME.exe"`,
		`cp "build/windows/installer/reasonix-uninstall.exe" "$payload_dir/reasonix-uninstall.exe"`,
		`"$ROOT/scripts/package-windows-desktop.sh" "$arch" "$payload_dir"`,
	} {
		if !strings.Contains(build, want) {
			t.Errorf("desktop-build.sh missing packaging contract %q", want)
		}
	}
	launcherStamp := strings.Index(build, `stamp_windows_executable "$launcher_out" "Reasonix Launcher"`)
	payloadCopy := strings.Index(build, `cp "$launcher_out" "$payload_dir/$LAUNCHERNAME.exe"`)
	if launcherStamp < 0 || payloadCopy < 0 || launcherStamp > payloadCopy {
		t.Fatalf("Windows payload must copy the already-stamped launcher (stamp=%d copy=%d)", launcherStamp, payloadCopy)
	}

	windowsData, err := os.ReadFile("build/windows/installer/project.nsi")
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.HasPrefix(windowsData, []byte{0xef, 0xbb, 0xbf}) {
		t.Fatal("Windows installer script must have a UTF-8 BOM so native makensis accepts localized strings")
	}
	windows := string(windowsData)
	for _, want := range []string{
		`!define REASONIX_UNINST_FINALIZE 'cmd.exe /C copy /Y "%1" "reasonix-uninstall.exe" >NUL'`,
		`!uninstfinalize '${REASONIX_UNINST_FINALIZE}'`,
		`File "/oname=uninstall.exe" "${ARG_REASONIX_SIGNED_UNINSTALLER}"`,
		`Rename "$INSTDIR\${PRODUCT_EXECUTABLE}" "$INSTDIR\${REASONIX_PORTABLE_ENTRY}"`,
		`CreateShortCut "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${REASONIX_PORTABLE_ENTRY}" "" "$INSTDIR\${REASONIX_PORTABLE_ENTRY}" 0`,
		`CreateShortCut "$DESKTOP\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${REASONIX_PORTABLE_ENTRY}" "" "$INSTDIR\${REASONIX_PORTABLE_ENTRY}" 0`,
		`StrCmp $ReasonixStageMode "1" reasonix_stage_payload`,
		`WriteRegStr HKCU "${UNINST_KEY}" "DisplayIcon" "$INSTDIR\${REASONIX_PORTABLE_ENTRY}"`,
	} {
		if !strings.Contains(windows, want) {
			t.Errorf("Windows installer missing single-exe contract %q", want)
		}
	}
	// The single-exe install must not resurrect the versioned layout it replaces.
	for _, unwanted := range []string{
		`FileOpen $0 "$INSTDIR\current.json" w`,
		`SetOutPath "$INSTDIR\versions\v${INFO_PRODUCTVERSION}"`,
		`StrCpy $R9 "$INSTDIR\versions\.installer-v${INFO_PRODUCTVERSION}-$R8"`,
		`--activate-staging "$R9" --no-relaunch`,
		`nsExec::ExecToLog /OEM`,
	} {
		if strings.Contains(windows, unwanted) {
			t.Errorf("Windows installer still publishes the versioned layout: %q", unwanted)
		}
	}
	if strings.Contains(windows, `CreateShortcut "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${REASONIX_LAUNCHER}"`) ||
		strings.Contains(windows, `CreateShortCut "$DESKTOP\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${REASONIX_LAUNCHER}"`) {
		t.Fatal("Windows shortcuts must target the single installed exe, not a launcher")
	}
}
