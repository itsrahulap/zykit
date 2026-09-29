// A small toast + polite live region for feedback from keyboard shortcuts ("Output copied").

const CLASSES =
  'pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-opacity dark:bg-white dark:text-slate-900';

let timer: ReturnType<typeof setTimeout> | undefined;

export function announce(message: string) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('zykit-announcer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'zykit-announcer';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.className = `${CLASSES} opacity-0`;
    document.body.append(el);
  }
  el.textContent = message;
  el.className = `${CLASSES} opacity-100`;
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (el) el.className = `${CLASSES} opacity-0`;
  }, 1800);
}
