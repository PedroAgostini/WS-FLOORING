/* WS Flooring: quote form spam guard
   No captcha and no third-party script. Runs before Web3Forms and the lead webhook:
   - trap fields people never see (bots fill every input they find)
   - a minimum time on the page and proof of a real key press, click or tap
   - no web links in any answer
   - a send limit per browser, per hour
   Web3Forms also runs its own server-side check on the `botcheck` field. */
window.WSGuard = (function () {
  'use strict';

  var MIN_MS = 6000;
  var MAX_SENDS = 4;
  var WINDOW_MS = 60 * 60 * 1000;
  var LOG_KEY = 'wsf-form-sends';
  var LINK = /(https?:\/\/|www\.|\[url|<a\s|href\s*=)/i;

  var MESSAGES = {
    fast: 'That was quick. Please check your details and send again.',
    links: 'Web links can’t be sent through this form. Please remove the link and try again, or call (843) 952-9511.',
    limit: 'We’ve already received several requests from this device. Please call (843) 952-9511 and we’ll help you right away.'
  };

  function recentSends() {
    try {
      return (JSON.parse(localStorage.getItem(LOG_KEY)) || []).filter(function (t) { return Date.now() - t < WINDOW_MS; });
    } catch (e) { return []; }
  }

  function watch(form) {
    var t0 = Date.now();
    var human = false;
    var mark = function (e) { if (e.isTrusted) human = true; };
    ['pointerdown', 'touchstart', 'keydown', 'input'].forEach(function (type) { form.addEventListener(type, mark, { passive: true }); });
    var traps = Array.prototype.slice.call(form.querySelectorAll('[data-hp]'));

    return {
      // Returns { trap: true } for a bot (show the thank-you, send nothing),
      // { message } when the visitor must fix something, or {} when the request is clean.
      // Trap fields are removed from `data`, so they never reach the inbox or the webhook.
      check: function (data) {
        var caught = traps.some(function (el) { return el.type === 'checkbox' ? el.checked : el.value.trim() !== ''; });
        traps.forEach(function (el) { delete data[el.name]; });
        if (caught) return { trap: true };
        if (!human || Date.now() - t0 < MIN_MS) return { message: MESSAGES.fast };
        var hasLink = Object.keys(data).some(function (k) { return typeof data[k] === 'string' && LINK.test(data[k]); });
        if (hasLink) return { message: MESSAGES.links };
        if (recentSends().length >= MAX_SENDS) return { message: MESSAGES.limit };
        return {};
      },
      sent: function () {
        try { localStorage.setItem(LOG_KEY, JSON.stringify(recentSends().concat(Date.now()))); } catch (e) { /* storage blocked: no send limit in this browser */ }
      }
    };
  }

  return { watch: watch };
})();
