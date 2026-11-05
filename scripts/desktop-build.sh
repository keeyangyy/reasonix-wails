#!/usr/bin/env bash
# Build and package the Wails desktop app. This fork ships Windows x64 only;
# Wails cannot cross-compile a CGO+webview binary, so the script runs on a
# Windows host (see .github/workflows/release-windows.yml).
#
# Output lands in <repo>/dist/ with stable, platform-keyed names that
# desktop/cmd/sign's `manifest` subcommand maps back to update.PlatformKey:
#   Windows: Reasonix-windows-<arch>-installer.exe       (NSIS per-user installer; updater channel)
#            Reasonix-windows-<arch>.zip                 (portable human download)
#
# Usage: scripts/desktop-build.sh windows/<arch> <version> [channel]
#   e.g. scripts/desktop-build.sh windows/amd64 v0.1.0
#        scripts/desktop-build.sh windows/amd64 v0.1.0-preview.1 preview
#
# Requirements:
#   - Go toolchain matching desktop/go.mod (>= 1.25; the `toolchain` directive
#     auto-downloads when GOTOOLCHAIN=auto)
#   - Node >= 24 and pnpm 10 (the same major versions used by CI and releases)
#   - Wails CLI matching the shared .wails-version pin (`make wails-install`)
set -euo pipefail

PLATFORM="${1:?usage: desktop-build.sh <os/arch> <version> [channel]}"
VERSION="${2:?usage: desktop-build.sh <os/arch> <version> [channel]}"
CHANNEL="${3:-stable}"

os="${PLATFORM%/*}"
arch="${PLATFORM#*/}"

# This fork ships Windows x64 only. Fail fast instead of silently building a
# desktop variant the release pipeline does not publish.
if [ "$os" != "windows" ]; then
	echo "desktop-build.sh: only windows targets are supported, got $PLATFORM" >&2
	exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPNAME="Reasonix"            # wails.json productName -> Reasonix.app
BINNAME="reasonix-wails"    # wails.json outputfilename -> Windows binary name
GUARDNAME="reasonix-guard"
LAUNCHERNAME="reasonix-launcher"
windows_resource_tool_dir=""
windows_host_include=""

# desktop/ is a nested Go module, so the Go toolchain cannot discover the
# repository VCS revision for the Wails binary. Link the same source identity
# into both Desktop and its CLI sidecar before this script mutates packaging
# metadata such as wails.json.
SOURCE_REVISION="$(git -C "$ROOT" rev-parse --verify HEAD)"
if ! git -C "$ROOT" diff-index --quiet HEAD --; then
	SOURCE_REVISION="$SOURCE_REVISION+dirty"
fi
# Short commit + real UTC build clock for CLI `version --verbose/--json`.
GIT_COMMIT="$(git -C "$ROOT" rev-parse --short=12 HEAD 2>/dev/null || echo unknown)"
BUILD_TIME_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
# The remote protocol source-revision ldflag was removed with Remote Workbench.
product_docs_ldflags="-X reasonix/internal/productdocs.linkedVersion=$VERSION -X reasonix/internal/productdocs.linkedRevision=$SOURCE_REVISION"
cli_identity_ldflags="-X main.version=$VERSION -X main.gitCommit=$GIT_COMMIT -X main.buildTimeUTC=$BUILD_TIME_UTC $product_docs_ldflags"

cleanup() {
	if [ -n "$windows_resource_tool_dir" ]; then
		rm -rf "$windows_resource_tool_dir"
	fi
	if [ -n "$windows_host_include" ]; then
		rm -f "$windows_host_include"
	fi
}
trap cleanup EXIT

cd "$ROOT/desktop"

# build_guard produces the one-shot legacy migrator still named reasonix-guard
# in compatibility payloads for 1.18–1.19.1 updaters. Source is intentionally
# separate from the removed Guard recovery product.
build_guard() {
	echo "==> go build Reasonix legacy migrator (compat name reasonix-guard)"
	mkdir -p "$(dirname "$guard_out")"
	(cd "$ROOT" && GOOS="$os" GOARCH="$arch" CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.version=$VERSION" -o "$guard_out" ./cmd/reasonix-legacy-migrator)
}


stamp_windows_executable() {
	local target="$1"
	local description="$2"
	local internal_name="$3"
	local original_filename="$4"
	"$windows_resource_tool" \
		-exe "$target" \
		-icon "$ROOT/desktop/build/windows/icon.ico" \
		-version "$numver" \
		-description "$description" \
		-internal-name "$internal_name" \
		-original-filename "$original_filename"
}

# Stamp the version resource (Windows file properties, macOS CFBundleVersion) from
# the tag. Wails feeds info.productVersion into goversioninfo and NSIS's
# VIFileVersion, both of which demand a strictly numeric X.X.X, so strip the
# leading "v" AND any prerelease suffix (a `-rc1` tag would otherwise abort the
# installer build). The full tag still rides in ldflags for the in-app version.
numver="${VERSION#v}"; numver="${numver%%-*}"
node -e 'const fs=require("fs"),f="wails.json",j=JSON.parse(fs.readFileSync(f,"utf8"));j.info.productVersion=process.argv[1];fs.writeFileSync(f,JSON.stringify(j,null,2)+"\n")' "$numver"

# NSIS installer is Windows-only (Wails requires a single windows target for -nsis).
ldflags="-X main.version=$VERSION -X main.channel=$CHANNEL $product_docs_ldflags"
UPDATE_HELPER="reasonix-update-helper.exe"
if [ "$os" = windows ]; then
	windows_resource_tool_dir=$(mktemp -d)
	windows_host_include="$ROOT/desktop/build/windows/installer/reasonix_host.nsh"
	case "$(uname -s 2>/dev/null || printf '%s' unknown)" in
		Darwin* | Linux* | FreeBSD*)
			printf '%s\n' '!define REASONIX_UNINST_FINALIZE '\''/bin/cp -f "%1" "reasonix-uninstall.exe"'\''' >"$windows_host_include"
			;;
		*)
			printf '%s\n' '!define REASONIX_UNINST_FINALIZE '\''cmd.exe /C copy /Y "%1" "reasonix-uninstall.exe" >NUL'\''' >"$windows_host_include"
			;;
	esac
	windows_resource_tool="$windows_resource_tool_dir/reasonix-windows-resource.exe"
	echo "==> build Windows resource stamper"
	go build -trimpath -o "$windows_resource_tool" ./cmd/windows-resource
	guard_out="$ROOT/desktop/build/windows/installer/$GUARDNAME.exe"
	build_guard
	stamp_windows_executable "$guard_out" "Reasonix Legacy Migrator" "$GUARDNAME" "$GUARDNAME.exe"
	launcher_out="$ROOT/desktop/build/windows/installer/$LAUNCHERNAME.exe"
	echo "==> go build Windows GUI thin launcher"
	(cd "$ROOT" && GOOS=windows GOARCH="$arch" CGO_ENABLED=0 go build -trimpath \
		-ldflags="-s -w -H windowsgui -X main.version=$VERSION" -o "$launcher_out" ./cmd/reasonix-launcher)
	stamp_windows_executable "$launcher_out" "Reasonix Launcher" "$LAUNCHERNAME" "$LAUNCHERNAME.exe"
	echo "==> go build Windows update helper"
	GOOS=windows GOARCH="$arch" go build -trimpath -ldflags="-s -w" \
		-o "build/windows/installer/$UPDATE_HELPER" ./cmd/update-helper
	stamp_windows_executable "build/windows/installer/$UPDATE_HELPER" "Reasonix Update Helper" "reasonix-update-helper" "$UPDATE_HELPER"
	# The first NSIS pass must regenerate this release's uninstaller; a stale
	# preserved file must never enter the signing payload.
	rm -f "build/windows/installer/reasonix-uninstall.exe"
fi
build_args=()
[ "${DESKTOP_BUILD_CLEAN:-1}" != "0" ] && build_args+=(-clean)
build_args+=(-platform "$PLATFORM" -ldflags "$ldflags")
[ "$os" = windows ] && build_args+=(-nsis -webview2 embed)

echo "==> wails build ${build_args[*]}"
# Vite receives the channel through the environment, while the Go shell gets it
# through ldflags. Keep both identities aligned so preview/canary test packages
# expose test-only frontend diagnostics instead of silently compiling as stable.
REASONIX_CHANNEL="$CHANNEL" wails build "${build_args[@]}"

mkdir -p "$ROOT/dist"

case "$os" in
windows)
	# Keep one canonical flat payload for SignPath. The release workflow signs
	# these files, then calls package-windows-desktop.sh again so both the
	# portable archive and the files embedded by NSIS carry Authenticode.
	payload_dir="$ROOT/desktop/build/windows/signing-payload"
	rm -rf -- "$payload_dir"
	mkdir -p "$payload_dir"
	cp "build/bin/$BINNAME.exe" "$payload_dir/$BINNAME.exe"
	cp "build/windows/installer/$UPDATE_HELPER" "$payload_dir/$UPDATE_HELPER"
	cp "$launcher_out" "$payload_dir/$LAUNCHERNAME.exe"
	cp "$guard_out" "$payload_dir/$GUARDNAME.exe"
	cp "build/windows/installer/reasonix-uninstall.exe" "$payload_dir/reasonix-uninstall.exe"
	"$ROOT/scripts/package-windows-desktop.sh" "$arch" "$payload_dir"
	;;
esac

echo "==> packaged into dist/:"
ls -la "$ROOT/dist"
