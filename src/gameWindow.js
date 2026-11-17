// Position de la fenêtre de Minecraft (Windows), pour coller le petit menu de sauvegarde en haut à
// gauche du JEU, sur le bon écran, comme l'overlay de Discord.
// Electron ne voit pas les fenêtres des autres programmes : un petit PowerShell lit toutes les
// 1,5 s le rectangle de la fenêtre principale du processus Java du jeu (GetWindowRect) et l'écrit
// sur une ligne. Rien n'est injecté dans le jeu. Ailleurs que sous Windows : pas de suivi (null).
const { spawn } = require("node:child_process");

const SCRIPT = (pid) => `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type @"
using System; using System.Runtime.InteropServices;
public class OmniWin {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
}
"@
while ($true) {
  $p = Get-Process -Id ${pid}
  if (-not $p) { break }
  $h = $p.MainWindowHandle
  if ($h -ne [IntPtr]::Zero -and -not [OmniWin]::IsIconic($h)) {
    $r = New-Object OmniWin+RECT
    if ([OmniWin]::GetWindowRect($h, [ref]$r)) { [Console]::Out.WriteLine("$($r.L),$($r.T),$($r.R),$($r.B)"); [Console]::Out.Flush() }
  }
  Start-Sleep -Milliseconds 1500
}
`;

// Linux (X11) : xprop et xwininfo donnent la fenêtre du jeu et sa position. Rien n'est injecté dans
// le jeu. Sous Wayland ou sans ces outils : pas de suivi.
const { execFile } = require("node:child_process");
function run(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 2000, windowsHide: true }, (error, stdout) => resolve(error ? null : String(stdout)));
  });
}
async function linuxWindowRect(pid, cache) {
  if (!cache.id) {
    const list = await run("xprop", ["-root", "_NET_CLIENT_LIST"]);
    const ids = (list || "").match(/0x[0-9a-f]+/gi) || [];
    for (const id of ids) {
      const p = await run("xprop", ["-id", id, "_NET_WM_PID"]);
      if (p && new RegExp(`=\\s*${Number(pid)}\\b`).test(p)) {
        cache.id = id;
        break;
      }
    }
    if (!cache.id) return null;
  }
  const info = await run("xwininfo", ["-id", cache.id]);
  if (!info) {
    cache.id = null; // fenêtre fermée ou recréée : on la recherche au prochain tour
    return null;
  }
  if (/Map State:\s*IsUnMapped/i.test(info)) return null;
  const num = (re) => Number(re.exec(info)?.[1]);
  const l = num(/Absolute upper-left X:\s*(-?\d+)/);
  const t = num(/Absolute upper-left Y:\s*(-?\d+)/);
  const w = num(/Width:\s*(\d+)/);
  const h = num(/Height:\s*(\d+)/);
  if (![l, t, w, h].every(Number.isFinite) || w < 50 || h < 50) return null;
  return { l, t, r: l + w, b: t + h };
}
function trackLinuxWindow(pid, { onRect, log }) {
  if (!process.env.DISPLAY) return { stop() {}, rect: () => null };
  let last = null;
  let stopped = false;
  let warned = false;
  const cache = { id: null };
  const tick = async () => {
    if (stopped) return;
    const rect = await linuxWindowRect(pid, cache).catch(() => null);
    if (rect) {
      const changed = !last || last.l !== rect.l || last.t !== rect.t || last.r !== rect.r || last.b !== rect.b;
      if (!last) log?.(`fenêtre du jeu trouvée en ${rect.l},${rect.t} (${rect.r - rect.l}×${rect.b - rect.t}).`);
      last = rect;
      if (changed) onRect?.(last);
    } else if (!last && !warned && !cache.id) {
      warned = true;
      log?.("fenêtre du jeu pas encore trouvée (xprop/xwininfo absents ou session Wayland ?)");
    }
    if (!stopped) timer = setTimeout(tick, 1500);
  };
  let timer = setTimeout(tick, 1500);
  return {
    rect: () => last,
    stop() {
      stopped = true;
      clearTimeout(timer);
    },
  };
}

function trackGameWindow(pid, { onRect, log } = {}) {
  if (process.platform === "linux" && pid) return trackLinuxWindow(pid, { onRect, log });
  if (process.platform !== "win32" || !pid) return { stop() {}, rect: () => null };
  let last = null;
  let buf = "";
  let child;
  try {
    child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", SCRIPT(Number(pid))], { windowsHide: true });
  } catch (error) {
    log?.(`suivi de la fenêtre du jeu impossible (${error.message})`);
    return { stop() {}, rect: () => null };
  }
  child.stdout.on("data", (chunk) => {
    buf += chunk.toString();
    const lines = buf.split(/\r?\n/);
    buf = lines.pop();
    for (const line of lines) {
      const m = /^(-?\d+),(-?\d+),(-?\d+),(-?\d+)$/.exec(line.trim());
      if (!m) continue;
      const [l, t, r, b] = m.slice(1).map(Number);
      const changed = !last || last.l !== l || last.t !== t || last.r !== r || last.b !== b;
      if (!last) log?.(`fenêtre du jeu trouvée en ${l},${t} (${r - l}×${b - t}).`);
      last = { l, t, r, b };
      if (changed) onRect?.(last);
    }
  });
  child.on("error", (error) => log?.(`suivi de la fenêtre du jeu arrêté (${error.message})`));
  return {
    rect: () => last,
    stop() {
      try {
        child.kill();
      } catch {}
    },
  };
}

module.exports = { trackGameWindow };
