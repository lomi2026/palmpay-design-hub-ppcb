#!/bin/sh
set -eu

repo_root="$(git rev-parse --show-toplevel)"
revision="$(git -C "$repo_root" rev-parse --short=12 HEAD)"
output_path="${1:-/private/tmp/palmpay-ppcb-${revision}.zip}"

case "$output_path" in
  /*) ;;
  *) output_path="$PWD/$output_path" ;;
esac

release_paths="Dockerfile .dockerignore package.json pnpm-lock.yaml pnpm-workspace.yaml apps packages deployment/ppcb"

if ! git -C "$repo_root" diff --quiet -- $release_paths || \
   ! git -C "$repo_root" diff --cached --quiet -- $release_paths; then
  echo "PPCB release files contain uncommitted changes. Commit the verified changes before packaging." >&2
  exit 1
fi

mkdir -p "$(dirname "$output_path")"
temporary_path="${output_path}.tmp.$$"
trap 'rm -f "$temporary_path"' EXIT HUP INT TERM

git -C "$repo_root" archive \
  --format=zip \
  --output="$temporary_path" \
  HEAD \
  Dockerfile \
  .dockerignore \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  apps \
  packages \
  deployment/ppcb

unzip -tq "$temporary_path" >/dev/null
mv "$temporary_path" "$output_path"
trap - EXIT HUP INT TERM

archive_size="$(wc -c < "$output_path" | tr -d ' ')"
archive_sha="$(shasum -a 256 "$output_path" | awk '{print $1}')"

printf 'PPCB source archive: %s\n' "$output_path"
printf 'Git revision: %s\n' "$revision"
printf 'Size: %s bytes\n' "$archive_size"
printf 'SHA-256: %s\n' "$archive_sha"
