#!/usr/bin/env bash
# shoot.sh - screenshot a URL with Playwright, at one or three viewports.
# Black-box usable: run `shoot.sh --help`.
set -uo pipefail

SELF="$(basename "$0")"

usage() {
  cat <<'EOF'
NAME
    shoot.sh - screenshot a URL with Playwright at one or three viewports

USAGE
    shoot.sh <url> <outdir> [--tier quick|full] [--selector <sel>] [--channel <name>]
    shoot.sh --help

ARGUMENTS
    <url>       Page to shoot. Any URL playwright can open (http://localhost:3000, file:///..., https://...).
    <outdir>    Directory for the PNGs. Created if it does not exist.

FLAGS
    --tier quick        (default) One full-page shot at viewport 1440x900 -> desktop.png
    --tier full         Three shots:
                            1440x900  --full-page  -> desktop.png
                            768x1024               -> tablet.png
                            375x812                -> mobile.png
    --selector <sel>    CSS selector to wait for before shooting, passed to
                        playwright as --wait-for-selector. Default: body
                        Use this to beat hydration on dev servers, e.g. --selector "main[data-hydrated]"
    --channel <name>    Browser channel. Default: chrome  <-- IMPORTANT, see BROWSER CHANNEL
                        Any playwright channel works: chrome, msedge, chrome-beta, ...
                        --channel none  = use Playwright's own bundled chromium instead of a
                                          system browser (often broken on this machine, see below).
    --help              Print this text and exit 0.

OUTPUT
    --tier quick ->  <outdir>/desktop.png
    --tier full  ->  <outdir>/desktop.png
                     <outdir>/tablet.png
                     <outdir>/mobile.png
    The absolute path of every PNG written is printed to stdout, one per line.

BROWSER CHANNEL (why the default is chrome)
    Bare `npx playwright` resolves to Playwright CLI 1.62.0, which hunts for
    chromium_headless_shell-1234, but this machine's browser cache holds build 1228.
    An unqualified call dies with "Executable doesn't exist" and writes NO PNG.
    Google Chrome is installed, so --channel chrome is used by default and works.
    Pass --channel none only if you have installed matching bundled binaries:
        npx playwright install chromium

EXIT CODES
    0   all requested screenshots written
    1   bad usage (missing url/outdir, unknown flag, bad --tier)
    2   no usable browser binary found (message tells you the install command)
    3   playwright failed, or a screenshot produced no / empty PNG

EXAMPLE
    # Dev server on :3000, all three viewports, wait for the app shell to hydrate:
    shoot.sh http://localhost:3000 /tmp/shots --tier full --selector "#app"
    # -> /tmp/shots/desktop.png
    #    /tmp/shots/tablet.png
    #    /tmp/shots/mobile.png
EOF
}

die() { printf '%s: %s\n' "$SELF" "$*" >&2; }

# ---- args -------------------------------------------------------------------
for a in "$@"; do
  if [ "$a" = "--help" ] || [ "$a" = "-h" ]; then usage; exit 0; fi
done

URL=""
OUTDIR=""
TIER="quick"
SELECTOR="body"
CHANNEL="chrome"

while [ $# -gt 0 ]; do
  case "$1" in
    --tier)
      [ $# -ge 2 ] || { die "--tier needs a value (quick|full)"; exit 1; }
      TIER="$2"; shift 2 ;;
    --selector)
      [ $# -ge 2 ] || { die "--selector needs a value"; exit 1; }
      SELECTOR="$2"; shift 2 ;;
    --channel)
      [ $# -ge 2 ] || { die "--channel needs a value (chrome|msedge|none|...)"; exit 1; }
      CHANNEL="$2"; shift 2 ;;
    --*)
      die "unknown flag: $1"; echo >&2; usage >&2; exit 1 ;;
    *)
      if   [ -z "$URL" ];    then URL="$1"
      elif [ -z "$OUTDIR" ]; then OUTDIR="$1"
      else die "unexpected extra argument: $1"; exit 1; fi
      shift ;;
  esac
done

if [ -z "$URL" ] || [ -z "$OUTDIR" ]; then
  die "missing <url> and/or <outdir>"; echo >&2; usage >&2; exit 1
fi
case "$TIER" in
  quick|full) ;;
  *) die "--tier must be 'quick' or 'full' (got: $TIER)"; exit 1 ;;
esac

# ---- browser probe (degrade loudly, never silently skip) ---------------------
PW_CACHE="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/Library/Caches/ms-playwright}"
have_bundled_chromium() {
  [ -d "$PW_CACHE" ] || return 1
  ls -d "$PW_CACHE"/chromium-* "$PW_CACHE"/chromium_headless_shell-* >/dev/null 2>&1
}
have_system_channel() {
  case "$1" in
    chrome|chrome-beta|chrome-dev|chrome-canary|chromium)
      [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ] ||
      [ -x "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta" ] ||
      [ -x "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev" ] ||
      [ -x "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary" ] ||
      [ -x "/Applications/Chromium.app/Contents/MacOS/Chromium" ] ||
      command -v google-chrome >/dev/null 2>&1 ||
      command -v chromium >/dev/null 2>&1 ;;
    msedge|msedge-beta|msedge-dev)
      [ -x "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" ] ||
      command -v microsoft-edge >/dev/null 2>&1 ;;
    *) return 0 ;;  # unknown channel: let playwright be the judge
  esac
}

MISSING_MSG="Playwright browser binaries missing. Run: npx playwright install chromium"

if [ "$CHANNEL" = "none" ]; then
  if ! have_bundled_chromium; then
    echo "$MISSING_MSG" >&2
    die "no bundled chromium in $PW_CACHE (you passed --channel none)"
    exit 2
  fi
else
  if ! have_system_channel "$CHANNEL"; then
    if have_bundled_chromium; then
      die "channel '$CHANNEL' not installed; falling back to bundled chromium (--channel none)"
      CHANNEL="none"
    else
      echo "$MISSING_MSG" >&2
      die "no system browser for channel '$CHANNEL' and no bundled chromium in $PW_CACHE"
      exit 2
    fi
  fi
fi

# ---- shoot ------------------------------------------------------------------
mkdir -p "$OUTDIR" || { die "cannot create outdir: $OUTDIR"; exit 1; }
ABS_OUTDIR="$(cd "$OUTDIR" && pwd)"

CHANNEL_ARGS=()
[ "$CHANNEL" != "none" ] && CHANNEL_ARGS=(--channel "$CHANNEL")

RC=0
# shoot <file> <WxH viewport> <fullpage:yes|no>
shoot() {
  local out="$ABS_OUTDIR/$1" vp="$2" full="$3"
  local args=(playwright screenshot
              --viewport-size="$vp"
              --wait-for-selector="$SELECTOR"
              "${CHANNEL_ARGS[@]}")
  [ "$full" = "yes" ] && args+=(--full-page)
  args+=("$URL" "$out")

  rm -f "$out"
  if ! npx --yes "${args[@]}" >/dev/null 2>"$ABS_OUTDIR/.shoot.err"; then
    die "playwright failed for $1 (viewport $vp):"
    cat "$ABS_OUTDIR/.shoot.err" >&2
    RC=3
    return
  fi
  if [ ! -s "$out" ]; then
    die "no PNG written for $1 (viewport $vp) - playwright exited 0 but produced nothing:"
    cat "$ABS_OUTDIR/.shoot.err" >&2
    RC=3
    return
  fi
  echo "$out"
}

if [ "$TIER" = "quick" ]; then
  shoot desktop.png 1440,900 yes
else
  shoot desktop.png 1440,900 yes
  shoot tablet.png  768,1024 no
  shoot mobile.png  375,812  no
fi

rm -f "$ABS_OUTDIR/.shoot.err"
exit $RC
