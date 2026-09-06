/**
 * Applies the stored theme before first paint.
 *
 * Without this the page renders with the default light tokens and then snaps
 * to the visitor's choice once React hydrates — a visible flash. Runs
 * synchronously in <head>, so it must be plain ES5-ish JS with no imports.
 *
 * The maths here mirrors `tokensFor` in lib/theme.tsx; if you change the token
 * derivation there, change it here too.
 */
const SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem('te_theme');
    if (!raw) return;
    var saved = JSON.parse(raw);
    var mode = saved && saved.mode;
    if (mode !== 'light' && mode !== 'dark' && mode !== 'custom') return;

    var bg = mode === 'custom' ? saved.customColor : (mode === 'dark' ? '#0a0d0c' : '#ffffff');
    if (!/^#[0-9a-fA-F]{6}$/.test(bg)) return;

    function rgb(h) {
      return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    }
    function hex(r, g, b) {
      return '#' + [r, g, b].map(function (c) {
        return Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
      }).join('');
    }
    function shift(h, amt, toward) {
      var c = rgb(h), t = toward === 'light' ? 255 : 0;
      return hex(c[0] + (t - c[0]) * amt, c[1] + (t - c[1]) * amt, c[2] + (t - c[2]) * amt);
    }
    function mix(h, o, amt) {
      var a = rgb(h), b = rgb(o);
      return hex(a[0] + (b[0] - a[0]) * amt, a[1] + (b[1] - a[1]) * amt, a[2] + (b[2] - a[2]) * amt);
    }
    function lum(h) {
      var c = rgb(h).map(function (v) {
        var s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }

    var isDark = lum(bg) < 0.4;
    var away = isDark ? 'light' : 'dark';
    var root = document.documentElement;
    var set = function (k, v) { root.style.setProperty(k, v); };

    set('--bg-page', bg);
    set('--bg-surface', isDark ? shift(bg, 0.08, 'light') : mix(bg, '#ffffff', 0.65));
    set('--bg-subtle', shift(bg, isDark ? 0.04 : 0.03, away));
    set('--bg-inset', shift(bg, isDark ? 0.11 : 0.06, away));
    set('--fg', isDark ? '#f4f7f6' : '#0a0d0c');
    set('--fg-muted', isDark ? mix(bg, '#ffffff', 0.62) : mix(bg, '#000000', 0.55));
    set('--fg-subtle', isDark ? mix(bg, '#ffffff', 0.42) : mix(bg, '#000000', 0.38));
    set('--border', shift(bg, isDark ? 0.16 : 0.1, away));
    set('--border-strong', shift(bg, isDark ? 0.28 : 0.18, away));

    root.dataset.scheme = isDark ? 'dark' : 'light';
    root.dataset.theme = mode;
    root.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {
    /* storage blocked or malformed - fall back to the CSS defaults */
  }
})();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
