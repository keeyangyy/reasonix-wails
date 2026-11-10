#!/usr/bin/env bash
# Rebuild the Windows portable archive and NSIS installer from one canonical
# payload directory. The release workflow calls this once with unsigned files
# after compilation, then again with Authenticode-signed files returned by
# SignPath. Re-running makensis after payload signing is what makes the
# installed executables signed too; signing only the finished NSIS file signs
# the container, not the files that Defender scans after installation.
set -euo pipefail

arch="${1:?usage: package-windows-desktop.sh <amd64|arm64> <payload-dir>}"
payload_input="${2:?usage: package-windows-desktop.sh <amd64|arm64> <payload-dir>}"

case "$arch" in
amd64 | arm64) ;;
*)
	echo "unsupported Windows architecture: $arch" >&2
	exit 1
	;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP="$ROOT/desktop"
INSTALLER_DIR="$DESKTOP/build/windows/installer"
BIN_DIR="$DESKTOP/build/bin"
DIST="$ROOT/dist"
APPNAME="Reasonix"
BINNAME="reasonix-wails"
GUARDNAME="reasonix-guard"
LAUNCHERNAME="reasonix-launcher"
UPDATE_HELPER="reasonix-update-helper.exe"
PAYLOAD_MANIFEST="reasonix-payload.json"
PAYLOAD_SIGNATURE="$PAYLOAD_MANIFEST.minisig"

[ -d "$payload_input" ] || { echo "Windows payload directory is missing: $payload_input" >&2; exit 1; }
PAYLOAD="$(cd "$payload_input" && pwd)"

required_payload=(
	"$BINNAME.exe"
	"$GUARDNAME.exe"
	"$LAUNCHERNAME.exe"
	"$UPDATE_HELPER"
	"reasonix-uninstall.exe"
)
for name in "${required_payload[@]}"; do
	[ -s "$PAYLOAD/$name" ] || { echo "Windows payload file is missing or empty: $name" >&2; exit 1; }
done

payload_exe_count=$(cd "$PAYLOAD" && ls -1 *.exe 2>/dev/null | wc -l | tr -d '[:space:]')
[ "$payload_exe_count" = "${#required_payload[@]}" ] || {
	echo "Windows payload must contain exactly ${#required_payload[@]} executables, found $payload_exe_count" >&2
	exit 1
}

manifest_present=0
signature_present=0
[ -s "$PAYLOAD/$PAYLOAD_MANIFEST" ] && manifest_present=1
[ -s "$PAYLOAD/$PAYLOAD_SIGNATURE" ] && signature_present=1
if [ "$manifest_present" != "$signature_present" ]; then
	echo "Windows payload manifest and signature must be provided together" >&2
	exit 1
fi
if [ "${REASONIX_REQUIRE_PAYLOAD_MANIFEST:-0}" = "1" ] && [ "$manifest_present" != "1" ]; then
	echo "signed Windows packaging requires $PAYLOAD_MANIFEST and $PAYLOAD_SIGNATURE" >&2
	exit 1
fi

# Replace every source consumed by project.nsi before compiling the installer.
# Copying preserves the Authenticode certificate table returned by SignPath.
cp "$PAYLOAD/$BINNAME.exe" "$BIN_DIR/$BINNAME.exe"
cp "$PAYLOAD/$GUARDNAME.exe" "$INSTALLER_DIR/$GUARDNAME.exe"
cp "$PAYLOAD/$LAUNCHERNAME.exe" "$INSTALLER_DIR/$LAUNCHERNAME.exe"
cp "$PAYLOAD/$UPDATE_HELPER" "$INSTALLER_DIR/$UPDATE_HELPER"
rm -f -- "$INSTALLER_DIR/$PAYLOAD_MANIFEST" "$INSTALLER_DIR/$PAYLOAD_SIGNATURE"
if [ "$manifest_present" = "1" ]; then
	cp "$PAYLOAD/$PAYLOAD_MANIFEST" "$INSTALLER_DIR/$PAYLOAD_MANIFEST"
	cp "$PAYLOAD/$PAYLOAD_SIGNATURE" "$INSTALLER_DIR/$PAYLOAD_SIGNATURE"
fi

[ -s "$INSTALLER_DIR/wails_tools.nsh" ] || {
	echo "wails_tools.nsh is missing; run the initial Wails -nsis build first" >&2
	exit 1
}
[ -s "$INSTALLER_DIR/tmp/MicrosoftEdgeWebview2Setup.exe" ] || {
	echo "embedded WebView2 bootstrapper is missing; run the initial Wails -nsis build first" >&2
	exit 1
}

# Wails documents project.nsi as manually invokable with the architecture
# binary define. Delete only generated installers so a stale first-pass package
# cannot be mistaken for the rebuilt payload-signed installer.
rm -f "$BIN_DIR"/*installer*.exe
binary_path="$BIN_DIR/$BINNAME.exe"
if command -v cygpath >/dev/null 2>&1; then
	binary_path="$(cygpath -w "$binary_path")"
fi
binary_define="ARG_WAILS_AMD64_BINARY"
[ "$arch" = arm64 ] && binary_define="ARG_WAILS_ARM64_BINARY"
uninstaller_path="$PAYLOAD/reasonix-uninstall.exe"
if command -v cygpath >/dev/null 2>&1; then
	uninstaller_path="$(cygpath -w "$uninstaller_path")"
fi
(
	cd "$INSTALLER_DIR"
	makensis \
		"-D${binary_define}=${binary_path}" \
		"-DARG_REASONIX_SIGNED_UNINSTALLER=${uninstaller_path}" \
		project.nsi
)

installer=$(ls -1 "$BIN_DIR"/*installer*.exe 2>/dev/null | head -n 1)
[ -n "$installer" ] && [ -s "$installer" ] || { echo "makensis did not produce a Windows installer" >&2; exit 1; }

mkdir -p "$DIST"
dist_installer="$DIST/${APPNAME}-windows-${arch}-installer.exe"
dist_exe="$DIST/${APPNAME}-windows-${arch}.exe"
cp "$installer" "$dist_installer"

# Portable release is one executable: the desktop binary under its product
# name. It carries the embedded frontend, updates itself in place, and needs no
# launcher, version directory or pointer file.
cp "$PAYLOAD/$BINNAME.exe" "$dist_exe"
"$ROOT/scripts/verify-windows-portable.sh" "$dist_exe"

# The second SignPath request signs the outer installer only after verifying
# these already-signed payload files. Keeping one flat, exact bundle makes the
# artifact configuration fail closed if a required installed executable is
# missing.
installer_bundle="$DESKTOP/build/windows/installer-signing-bundle"
rm -rf -- "$installer_bundle"
mkdir -p "$installer_bundle"
cp "$dist_installer" "$installer_bundle/"
for name in "${required_payload[@]}"; do
	cp "$PAYLOAD/$name" "$installer_bundle/$name"
done

echo "==> rebuilt Windows $arch installer and portable archive from $PAYLOAD"
