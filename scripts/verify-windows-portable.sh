#!/usr/bin/env bash
# Verify the Windows portable release unit before publishing: it must be one
# self-contained executable, not a directory tree. The artifact is the same
# binary the NSIS installer places at InstallRoot, and it replaces itself in
# place on update, so a stray companion file would silently become a second
# release member.
set -euo pipefail

artifact="${1:?usage: verify-windows-portable.sh PATH_TO_EXE}"
[ -f "$artifact" ] || { echo "Windows portable executable is missing: $artifact" >&2; exit 1; }
[ -s "$artifact" ] || { echo "Windows portable executable is empty: $artifact" >&2; exit 1; }

# A packaged desktop build is tens of megabytes; a few kilobytes means the
# build step copied the wrong file (a text stub or a leftover marker).
size=$(wc -c <"$artifact" | tr -d '[:space:]')
if [ "$size" -lt 10485760 ]; then
	echo "Windows portable executable is implausibly small: $size bytes" >&2
	exit 1
fi

# Windows PE images start with 'MZ'. Checking it here catches an archive, a
# launcher stub or a corrupted copy before it reaches users.
magic=$(od -An -tx1 -N2 "$artifact" | tr -d '[:space:]')
if [ "$magic" != "4d5a" ]; then # "MZ"
	echo "Windows portable executable is not a PE image (magic=$magic)" >&2
	exit 1
fi

# The layout is one file. Refuse an artifact that sits in a versioned tree, so
# a stale packaging pass cannot publish the old multi-file structure under the
# new name.
dir=$(dirname "$artifact")
if [ -f "$dir/current.json" ] || [ -d "$dir/versions" ]; then
	echo "Windows portable executable must not ship beside current.json/versions" >&2
	exit 1
fi

base=$(basename "$artifact")
case "$base" in
*.exe) ;;
*)
	echo "Windows portable executable must use an .exe name, got $base" >&2
	exit 1
	;;
esac

echo "==> Windows portable executable verified: $base ($size bytes)"
