#!/usr/bin/env bash
# TRU Quantum Wallet Aurora theme installer (fixed + reversible).
# Usage: bash tru-aurora-theme-fixed.sh [check|apply|revert|status] [TRU-SDK-QPOC directory]
# Changes ONLY apps/quantum-wallet/public/style.css.
set -euo pipefail

cmd="${1:-status}"
root="${2:-.}"
css="$root/apps/quantum-wallet/public/style.css"
if [[ ! -f "$css" ]]; then
  echo "ERROR: Not found: $css" >&2
  echo "Supply the TRU-SDK-QPOC root containing apps/quantum-wallet/public/style.css" >&2
  exit 1
fi
backup="$css.pre-aurora"
marker='TRU AURORA THEME LAYER'

layer() {
  cat <<'TRU_AURORA_CSS'
/* ===== TRU AURORA THEME LAYER — visual only; appended after the original rules ===== */
@property --ang{syntax:"<angle>";inherits:false;initial-value:0deg}
:root{--void:#05061a;--ink:#e9edff;--mute:#8a94c8;--ion:#2ff3dc;--photon:#8f6bff;--flux:#ff4fa8;--sol:#ffd27a;--sans:"Avenir Next","SF Pro Display","Segoe UI Variable Display","Segoe UI",Inter,system-ui,sans-serif;--mono:ui-monospace,SFMono-Regular,"JetBrains Mono",Menlo,Consolas,monospace;font-family:var(--sans);color:var(--ink);background:var(--void)}
body{-webkit-font-smoothing:antialiased}
*{scrollbar-width:thin;scrollbar-color:#2ff3dc66 transparent}
::selection{background:#8f6bff99;color:#fff}
:focus-visible{outline:2px solid var(--ion);outline-offset:3px}
::placeholder{color:#5f6aa0}

/* living backdrop: aurora + drifting lattice + stars */
.backdrop{overflow:hidden;background:radial-gradient(120% 80% at 50% -10%,#15124a,transparent 62%),var(--void)}
.backdrop::before{content:"";position:absolute;inset:-25%;background:radial-gradient(38% 34% at 22% 28%,#2ff3dc44,transparent 70%),radial-gradient(34% 38% at 78% 22%,#8f6bff55,transparent 70%),radial-gradient(40% 36% at 62% 82%,#ff4fa83a,transparent 70%);filter:blur(34px);animation:drift 28s ease-in-out infinite alternate}
.backdrop::after{content:"";position:absolute;inset:0;background-image:linear-gradient(#ffffff09 1px,transparent 1px),linear-gradient(90deg,#ffffff09 1px,transparent 1px);background-size:56px 56px;-webkit-mask-image:radial-gradient(75% 65% at 50% 30%,#000,transparent 88%);mask-image:radial-gradient(75% 65% at 50% 30%,#000,transparent 88%);animation:lattice 40s linear infinite}
body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(1.6px 1.6px at 12% 18%,#fff,transparent),radial-gradient(1.2px 1.2px at 34% 72%,#bfe,transparent),radial-gradient(1.8px 1.8px at 58% 12%,#fff,transparent),radial-gradient(1.2px 1.2px at 81% 44%,#cdf,transparent),radial-gradient(1.6px 1.6px at 90% 86%,#fff,transparent),radial-gradient(1.2px 1.2px at 6% 60%,#cdf,transparent),radial-gradient(1.4px 1.4px at 67% 91%,#bfe,transparent);animation:twinkle 5s ease-in-out infinite alternate}

/* sidebar: glass rail with a signal pulse travelling down the divider */
.sidebar{position:relative;background:linear-gradient(180deg,#0b0d2acc,#07081acc);-webkit-backdrop-filter:blur(18px) saturate(140%);backdrop-filter:blur(18px) saturate(140%);border-image:linear-gradient(180deg,#2ff3dc77,#8f6bff33 45%,#ffffff08) 1}
.sidebar::after{content:"";position:absolute;right:-1px;top:0;width:2px;height:160px;background:linear-gradient(transparent,var(--ion),transparent);animation:travel 7s ease-in-out infinite}
.mark-icon{position:relative;border-color:#2ff3dc99;background:radial-gradient(circle at 35% 30%,#2ff3dc33,#8f6bff22);color:var(--ion);text-shadow:0 0 14px var(--ion);box-shadow:0 0 30px #2ff3dc55,inset 0 0 14px #8f6bff55}
.mark-icon::before,.mark-icon::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1px solid transparent;border-top-color:var(--ion);border-right-color:#8f6bff88;animation:spin 6s linear infinite}
.mark-icon::after{inset:-11px;border-top-color:var(--flux);border-right-color:transparent;border-bottom-color:#8f6bff77;animation-duration:11s;animation-direction:reverse}
.mark strong,.mark strong span,.top h1,.top h1 span,.section-intro h2,.panel.highlight h2,.tile strong{-webkit-background-clip:text;background-clip:text;color:transparent}
.mark strong{background-image:linear-gradient(90deg,#fff,#c3ccff)}
.mark strong span{background-image:linear-gradient(90deg,var(--ion),var(--photon))}
.mark small{color:var(--mute)}
.sidebar nav button{color:var(--mute);border-radius:12px;padding:15px 16px;transition:color .25s,background .25s,transform .25s,box-shadow .25s}
.sidebar nav button:hover{color:#fff;background:linear-gradient(90deg,#2ff3dc22,transparent);transform:translateX(4px)}
.sidebar nav button.selected{color:#fff;border-left:0;background:linear-gradient(90deg,#2ff3dc30,#8f6bff1f 70%,transparent);box-shadow:inset 2px 0 0 var(--ion),0 0 34px #2ff3dc1c}
.side-foot{border-top-color:#ffffff14;color:#c9d3ff}.side-foot small{color:var(--mute)}
.pulse{background:var(--ion);animation:ping 2.2s ease-out infinite}

/* header */
.eyebrow{color:var(--ion);letter-spacing:.28em;font-weight:700}
.top h1{font-weight:800;letter-spacing:-.045em;background-image:linear-gradient(100deg,#fff 25%,#b5c1ff 60%,#fff)}
.top h1 span{font-weight:300;background-image:linear-gradient(100deg,var(--ion),var(--photon),var(--flux),var(--ion));background-size:300% 100%;animation:flow 9s linear infinite}
.top p,.section-intro p{color:#9aa5d6}
.network{border-color:#2ff3dc66;color:#c9fff7;background:linear-gradient(135deg,#2ff3dc1c,#8f6bff1c);box-shadow:0 0 24px #2ff3dc26,inset 0 0 12px #2ff3dc14;animation:breathe 3.6s ease-in-out infinite}

/* glass panels with light-catch borders */
.tile,.panel{position:relative;border:1px solid #ffffff14;border-radius:20px;background:linear-gradient(150deg,#161a4a78,#0a0c2bc9 60%);-webkit-backdrop-filter:blur(16px) saturate(150%);backdrop-filter:blur(16px) saturate(150%);box-shadow:0 20px 50px -24px #000c,inset 0 1px 0 #ffffff14}
.tile::before,.panel::before,.modal-box::before{content:"";position:absolute;inset:-1px;padding:1px;border-radius:inherit;pointer-events:none;background:conic-gradient(from var(--ang),transparent 0 60%,#2ff3dcaa 74%,#8f6bffcc 86%,#ff4fa8 94%,transparent);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;opacity:.5}
.tile::before,.panel.highlight::before,.modal-box::before{opacity:1;animation:turn 7s linear infinite}
.tile{--c:47 243 220;background:radial-gradient(90% 130% at 100% 0,rgb(var(--c)/.2),transparent 60%),linear-gradient(150deg,#161a4a78,#0a0c2bc9 60%)}
.tile:nth-child(2){--c:165 139 255;animation-delay:.07s}.tile:nth-child(3){--c:255 124 192;animation-delay:.14s}
.tile small{color:var(--mute);letter-spacing:.2em}
.tile strong{font-size:42px;font-weight:800;font-variant-numeric:tabular-nums;background-image:linear-gradient(180deg,#fff 15%,rgb(var(--c)));filter:drop-shadow(0 0 14px rgb(var(--c)/.45))}
.tile span{color:#8590c4}
.panel h2,.panel h3{letter-spacing:-.03em}
.panel p{color:#b3bde6}
.panel.highlight{border-color:#ffffff1f;background:radial-gradient(60% 120% at 100% 0,#8f6bff44,transparent 60%),radial-gradient(50% 100% at 0 100%,#2ff3dc2e,transparent 60%),linear-gradient(150deg,#141a52e6,#0a0c2bf2);box-shadow:0 0 80px -24px #8f6bffaa,0 30px 60px -30px #000}
.panel.highlight h2{font-size:30px;letter-spacing:-.04em;background-image:linear-gradient(90deg,#fff,#c8d2ff 55%,#9ff8ec)}
.section-intro h2{font-weight:800;letter-spacing:-.04em;background-image:linear-gradient(90deg,#fff,#b5c1ff)}
code{font-family:var(--mono);background:#2a2f78aa;border:1px solid #ffffff14;border-radius:6px;color:#8ff7ea}
.content,.mono{font-family:var(--mono);color:#aeb9ea}

/* buttons */
button{position:relative;overflow:hidden;color:var(--ink);letter-spacing:.03em;border:1px solid #ffffff26;border-radius:12px;padding:12px 20px;background:linear-gradient(180deg,#ffffff14,#ffffff06);transition:transform .2s,border-color .2s,box-shadow .2s,background-position .4s}
button:hover:not(:disabled){border-color:#2ff3dccc;box-shadow:0 0 0 1px #2ff3dc44,0 10px 30px -8px #2ff3dc88;transform:translateY(-2px)}
button:active:not(:disabled){transform:scale(.97)}
button:disabled{filter:grayscale(.7)}
.primary,.primary:hover{color:#05061a;border-color:transparent;background:linear-gradient(110deg,var(--ion),#6fb6ff 45%,var(--photon));background-size:200% 100%;box-shadow:0 10px 34px -10px #2ff3dcaa,inset 0 1px 0 #ffffff66}
.primary:hover{background-position:100% 0}
.primary::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 35%,#ffffff88 50%,transparent 65%);transform:translateX(-120%);animation:sheen 4.2s ease-in-out infinite}

/* alerts, forms, results */
.alert{border-radius:14px;color:#ffc2cf;border-color:#ff6b8a66;background:linear-gradient(90deg,#ff4f6a26,#ff4f6a0d);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);animation:pop .45s cubic-bezier(.2,1.2,.3,1)}
.alert.ok{color:#b5fff4;border-color:#2ff3dc66;background:linear-gradient(90deg,#2ff3dc24,#2ff3dc08)}
label{color:#aab4e6;letter-spacing:.16em}
input:not([type=radio]),textarea{background:#05061acc;border:1px solid #ffffff1f;border-radius:12px;color:#eaf0ff;transition:border-color .2s,box-shadow .2s,background .2s}
input:focus,textarea:focus{border-color:var(--ion);background:#080a2a;box-shadow:0 0 0 3px #2ff3dc22,0 0 28px -4px #2ff3dc66}
.selector label{border-color:#ffffff1f;border-radius:12px;background:#ffffff08;color:#cfd7ff;font-weight:600;letter-spacing:.04em;transition:border-color .2s,box-shadow .2s,background .2s}
.selector label:hover{border-color:#2ff3dc88}
.selector label:has(input:checked){color:#fff;border-color:var(--ion);background:linear-gradient(135deg,#2ff3dc24,#8f6bff24);box-shadow:0 0 24px -6px #2ff3dc99}
.output{font-family:var(--mono);color:#a8ffef;border-color:#ffffff17;border-radius:12px;background:#030410a8;box-shadow:inset 0 0 40px #00000088}
.item{border-color:#ffffff17;border-radius:14px;background:linear-gradient(135deg,#ffffff0d,#ffffff05);transition:border-color .2s}
.item:hover{border-color:#2ff3dc66}
.item b{color:var(--ion);letter-spacing:.06em}.item p{color:#9fb0ee}
.result small{color:var(--ion)}.muted{color:#7f8abf}
.warning{color:var(--sol)!important;border-left-color:var(--sol);padding:10px 14px;border-radius:0 10px 10px 0;background:linear-gradient(90deg,#ffd27a16,transparent)}

/* confirmation modal */
.modal{background:#02030fcc;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.modal:not(.hidden){animation:fade .25s}
.modal-box{position:relative;border:1px solid #ffffff1a;border-radius:22px;background:linear-gradient(160deg,#1a1d5acc,#0a0c2bf5);box-shadow:0 0 90px -20px #8f6bffaa,0 40px 80px -30px #000;animation:pop .4s cubic-bezier(.2,1.2,.3,1)}
.modal-box p{color:#c3cdf2}
footer{color:#6a75ad;letter-spacing:.2em}

/* tab-switch entrance (replays each time a page is shown) */
.tile,.page .panel,.section-intro{animation:rise .6s cubic-bezier(.2,.8,.2,1) backwards}
.tile{animation:rise .6s cubic-bezier(.2,.8,.2,1) backwards}
.cols>.panel:nth-child(2){animation-delay:.1s}
.tile::before,.panel.highlight::before{animation:turn 7s linear infinite}

@keyframes drift{to{transform:translate3d(5%,4%,0) rotate(14deg) scale(1.18)}}
@keyframes lattice{to{background-position:56px 56px,56px 56px}}
@keyframes twinkle{from{opacity:.35}to{opacity:.95}}
@keyframes travel{0%{transform:translateY(-160px);opacity:0}15%,85%{opacity:1}100%{transform:translateY(100vh);opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes ping{0%{box-shadow:0 0 0 0 #2ff3dccc,0 0 12px var(--ion)}80%,100%{box-shadow:0 0 0 12px #2ff3dc00,0 0 12px var(--ion)}}
@keyframes flow{to{background-position:300% 0}}
@keyframes breathe{50%{box-shadow:0 0 36px #2ff3dc48,inset 0 0 18px #8f6bff30}}
@keyframes turn{to{--ang:360deg}}
@keyframes sheen{0%,55%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
@keyframes pop{from{opacity:0;transform:translateY(-10px) scale(.97)}}
@keyframes fade{from{opacity:0}}
@keyframes rise{from{opacity:0;transform:translateY(16px) scale(.985)}}

@media(max-width:850px){.sidebar{border-image:none;border-right:0;border-bottom:1px solid #ffffff1a}.sidebar::after{display:none}.sidebar nav button:hover{transform:none}.tile strong{font-size:34px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
TRU_AURORA_CSS
}

case "$cmd" in
  check)
    if grep -Fq "$marker" "$css"; then
      echo "ALREADY_APPLIED: $css"
    elif [[ -e "$backup" ]]; then
      echo "ERROR: Existing backup but theme missing; inspect before applying: $backup" >&2
      exit 1
    else
      echo "CHECK=PASS: Can apply to $css"
    fi
    ;;
  apply)
    if grep -Fq "$marker" "$css"; then
      echo "ALREADY_APPLIED: Skipping duplicate installation."
      exit 0
    fi
    if [[ -e "$backup" ]]; then
      echo "ERROR: Existing backup $backup, but theme missing; refusing to overwrite it." >&2
      exit 1
    fi
    cp -p -- "$css" "$backup"
    tmp="$(mktemp "${css}.tmp.XXXXXX")"
    trap 'rm -f -- "$tmp"' EXIT
    cp -p -- "$css" "$tmp"
    printf '\n' >> "$tmp"
    layer >> "$tmp"
    mv -f -- "$tmp" "$css"
    trap - EXIT
    echo "APPLY=PASS: $css (backup: $backup)"
    ;;
  revert)
    if [[ ! -f "$backup" ]]; then
      echo "ERROR: No backup exists: $backup" >&2
      exit 1
    fi
    if ! grep -Fq "$marker" "$css"; then
      echo "ERROR: Theme marker missing; refusing to overwrite modified stylesheet." >&2
      exit 1
    fi
    expected="$(mktemp "${css}.expected.XXXXXX")"
    trap 'rm -f -- "$expected"' EXIT
    cat -- "$backup" > "$expected"
    printf '\n' >> "$expected"
    layer >> "$expected"
    if ! cmp -s -- "$expected" "$css"; then
      echo "ERROR: Stylesheet changed since Aurora installation. Back up custom edits before reverting." >&2
      exit 1
    fi
    mv -f -- "$backup" "$css"
    rm -f -- "$expected"
    trap - EXIT
    echo "REVERT=PASS: Original style.css restored byte-for-byte."
    ;;
  status)
    if grep -Fq "$marker" "$css"; then
      echo "AURORA=ON: $css"
    else
      echo "AURORA=OFF: $css"
    fi
    [[ ! -f "$backup" ]] || echo "BACKUP_PRESENT: $backup"
    ;;
  *)
    echo "Usage: bash $0 [check|apply|revert|status] [TRU-SDK-QPOC directory]" >&2
    exit 2
    ;;
esac
