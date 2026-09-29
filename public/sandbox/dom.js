// Runs one lesson example per page load and reports its console output to the parent page.
// Protocol (all messages carry source tags and are checked against the sending window):
//   sandbox -> parent  { source: 'zykit-dom-sandbox', type: 'ready' }
//                      { source: 'zykit-dom-sandbox', type: 'log', level, text }
//                      { source: 'zykit-dom-sandbox', type: 'done', ok, ms }
//                      { source: 'zykit-dom-sandbox', type: 'truncated' }
//   parent -> sandbox  { source: 'zykit-learn', type: 'run', code, formatter }
// The parent removes the iframe to stop a run (Stop, time limit, next run).
(function () {
  'use strict';
  var TAG = 'zykit-dom-sandbox';
  var MAX_ENTRIES = 500;
  var MAX_CHARS = 200000;
  var parentWindow = window.parent;
  var fmt = null;
  var entries = 0;
  var chars = 0;
  var truncated = false;
  var started = false;
  var depth = 0;

  function post(message) {
    message.source = TAG;
    // The parent's origin can't be read from an opaque-origin frame; the payload is only console text.
    parentWindow.postMessage(message, '*');
  }

  function describe(value) {
    if (typeof Node !== 'undefined' && value instanceof Node) {
      var html = value.nodeType === 1 ? value.outerHTML : value.nodeType === 9 ? '#document' : String(value.textContent);
      return html.length > 300 ? html.slice(0, 299) + '…' : html;
    }
    if ((typeof NodeList !== 'undefined' && value instanceof NodeList) || (typeof HTMLCollection !== 'undefined' && value instanceof HTMLCollection)) {
      return Array.prototype.map.call(value, describe);
    }
    if (value === window) return '[Window]';
    return value;
  }

  function format(args) {
    var list = Array.prototype.map.call(args, describe);
    try {
      if (fmt) return fmt.formatArgs(list);
    } catch {
      /* fall through */
    }
    return list.map(String).join(' ');
  }

  function emit(level, args) {
    if (truncated) return;
    if (entries >= MAX_ENTRIES || chars >= MAX_CHARS) {
      truncated = true;
      post({ type: 'truncated' });
      return;
    }
    var text = typeof args === 'string' ? args : format(args);
    if (text.length > MAX_CHARS - chars) text = text.slice(0, MAX_CHARS - chars) + '…';
    entries++;
    chars += text.length;
    post({ type: 'log', level: level, text: text, depth: depth });
  }

  function errorText(error) {
    if (error && typeof error === 'object' && 'message' in error) return (error.name || 'Error') + ': ' + error.message;
    return String(error);
  }

  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
    console[level] = function () {
      emit(level, arguments);
    };
  });
  console.dir = console.log;
  console.table = console.log;
  console.trace = console.log;
  console.assert = function (condition) {
    if (!condition) emit('error', ['Assertion failed'].concat(Array.prototype.slice.call(arguments, 1)));
  };
  console.group = function () {
    if (arguments.length) emit('log', arguments);
    depth++;
  };
  console.groupCollapsed = console.group;
  console.groupEnd = function () {
    if (depth > 0) depth--;
  };
  console.clear = function () {};

  // Dialogs still open (allow-modals); what they showed and returned is logged as well.
  var nativeAlert = window.alert;
  var nativeConfirm = window.confirm;
  var nativePrompt = window.prompt;
  window.alert = function (message) {
    emit('info', 'alert: ' + (message === undefined ? '' : String(message)));
    try {
      nativeAlert.call(window, message);
    } catch {
      /* dialogs blocked */
    }
  };
  window.confirm = function (message) {
    var answer = false;
    try {
      answer = nativeConfirm.call(window, message);
    } catch {
      /* dialogs blocked */
    }
    emit('info', 'confirm: ' + String(message) + ' → ' + answer);
    return answer;
  };
  window.prompt = function (message, value) {
    var answer = null;
    try {
      answer = nativePrompt.call(window, message, value);
    } catch {
      /* dialogs blocked */
    }
    emit('info', 'prompt: ' + String(message) + ' → ' + JSON.stringify(answer));
    return answer;
  };

  window.addEventListener('error', function (event) {
    event.preventDefault();
    emit('error', 'Uncaught ' + (event.error !== undefined && event.error !== null ? errorText(event.error) : String(event.message)));
  });
  window.addEventListener('unhandledrejection', function (event) {
    event.preventDefault();
    emit('error', 'Uncaught (in promise) ' + errorText(event.reason));
  });

  function clickButtons() {
    // There's no one to click the sample button, so click every button once the code has run.
    document.querySelectorAll('button').forEach(function (button) {
      try {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      } catch (e) {
        emit('error', 'Uncaught ' + errorText(e));
      }
    });
  }

  window.addEventListener('message', function (event) {
    if (event.source !== parentWindow || started) return;
    var data = event.data;
    if (!data || data.source !== 'zykit-learn' || data.type !== 'run' || typeof data.code !== 'string') return;
    started = true;

    if (typeof data.formatter === 'string') {
      try {
        // oxlint-disable-next-line no-eval -- the sandbox exists to evaluate lesson code
        fmt = (0, eval)('(' + data.formatter + ')')({});
      } catch {
        fmt = null;
      }
    }

    var t0 = performance.now();
    var finish = function (ok) {
      post({ type: 'done', ok: ok, ms: Math.round((performance.now() - t0) * 10) / 10 });
    };
    var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    var body;
    try {
      body = new AsyncFunction(data.code);
    } catch (e) {
      emit('error', errorText(e));
      finish(false);
      return;
    }
    var ok = true;
    Promise.resolve()
      .then(function () {
        return body.call(window);
      })
      .catch(function (e) {
        ok = false;
        emit('error', 'Uncaught ' + errorText(e));
      })
      .then(function () {
        clickButtons();
        finish(ok);
      });
  });

  post({ type: 'ready' });
})();
