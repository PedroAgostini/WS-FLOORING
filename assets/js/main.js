/* WS Flooring: page interactions
   Header and menu, hero sheen, portfolio viewer, the pinned 3D steps,
   the quote form and the mobile dock. No dependencies; Three.js loads
   on its own, only when the How It Works section comes near. */
(function () {
  'use strict';

  var SELF = document.currentScript ? document.currentScript.src : location.href;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Conversion events for GA4 / Google Ads / Meta. IDs are added later; until then this only fills dataLayer.
  function track(name, detail) {
    window.dataLayer = window.dataLayer || [];
    var e = { event: name };
    for (var k in detail) if (Object.prototype.hasOwnProperty.call(detail, k)) e[k] = detail[k];
    window.dataLayer.push(e);
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('[data-track]');
    if (!a) return;
    var id = a.getAttribute('data-track');
    track(id.indexOf('call') === 0 ? 'click_call' : 'click_email', { placement: id });
  });

  /* Header: compact once the page moves */
  var header = $('#site-header');
  function onScrollHeader() { if (header) header.classList.toggle('is-stuck', window.scrollY > 24); }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* Mobile menu */
  var toggle = $('.menu-toggle');
  var menu = $('#menu');
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) header.classList.add('is-stuck'); else onScrollHeader();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
    window.matchMedia('(min-width: 1181px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* Current section in the pill nav */
  var navLinks = $$('.pill-nav a');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = byId[en.target.id];
        if (link && en.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        } else if (link && link.getAttribute('aria-current') === 'true' && en.boundingClientRect.top > 0) {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* Hero: the polish on the slab follows the pointer */
  var hero = $('.hero');
  if (hero && !reduced.matches && window.matchMedia('(hover: hover)').matches) {
    var sheen = $('.hero__sheen', hero);
    var pending = false, sx = 44;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      sx = 12 + ((e.clientX - r.left) / r.width) * 76;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { sheen.style.setProperty('--sx', sx.toFixed(1) + '%'); pending = false; });
    });
  }

  /* Services: one slab open at a time on desktop. Hover, click or keyboard focus opens a slab;
     it stays open when the pointer leaves, so the row never snaps back. Below 981px every slab is open. */
  var slabs = $$('.slabset .slab');
  if (slabs.length) {
    var wide = window.matchMedia('(min-width: 981px)');
    var openSlab = function (s) { slabs.forEach(function (x) { x.classList.toggle('is-open', x === s); }); };
    slabs.forEach(function (s) {
      s.addEventListener('pointerenter', function (e) { if (wide.matches && e.pointerType === 'mouse') openSlab(s); });
      s.addEventListener('click', function () { if (wide.matches) openSlab(s); });
      s.addEventListener('focusin', function () { openSlab(s); });
    });
  }

  /* Service links pre-select that service in the quote form */
  $$('[data-service]').forEach(function (link) {
    link.addEventListener('click', function () {
      var v = link.getAttribute('data-service');
      $$('#quote-form input[name="service"]').forEach(function (i) { i.checked = i.value === v; });
      var f = $('#f-service'); if (f) f.classList.remove('is-bad');
    });
  });

  /* Portfolio reel: clone the real photos to close the loop, then let it run.
     Clones are aria-hidden and out of the tab order; clicking one opens the original. */
  (function () {
    var reel = $('.reel'), track = reel && $('.reel__track', reel);
    if (!reel || !track || reduced.matches) return;
    var originals = $$(':scope > li', track);
    for (var run = 1; run < 6; run++) {
      originals.forEach(function (li, i) {
        var copy = li.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        var shot = $('.shot', copy);
        shot.setAttribute('tabindex', '-1');
        shot.setAttribute('data-clone', String(i));
        track.appendChild(copy);
      });
    }
    function pace() { reel.style.setProperty('--reel-dur', Math.max(40, Math.round(track.scrollWidth / 2 / 42)) + 's'); }
    reel.classList.add('is-live');
    pace();
    window.addEventListener('resize', pace, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { reel.classList.toggle('is-off', !en[0].isIntersecting); }).observe(reel);
    }
  })();

  /* Portfolio viewer */
  (function () {
    var box = $('#lightbox');
    var shots = $$('.shot:not([data-clone])');
    if (!box || !shots.length || typeof box.showModal !== 'function') return;
    var stage = $('#lightbox-stage'), count = $('#lightbox-count'), strip = $('#lightbox-thumbs');
    var at = 0, opener = null, pad = function (n) { return (n < 10 ? '0' : '') + n; };

    // One thumbnail per real photo, reusing the small file the page already loaded
    var thumbs = shots.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + shots.length);
      var t = document.createElement('img');
      t.src = $('img', s).getAttribute('src'); t.alt = ''; t.width = 64; t.height = 64;
      b.appendChild(t);
      b.addEventListener('click', function () { show(i); });
      if (strip) strip.appendChild(b);
      return b;
    });

    function show(i) {
      at = (i + shots.length) % shots.length;
      var s = shots[at], base = s.getAttribute('data-full'), thumb = $('img', s);
      var pic = document.createElement('picture');
      pic.className = 'lightbox__pic';
      var src = document.createElement('source');
      src.type = 'image/avif'; src.srcset = base + '.avif';
      var img = document.createElement('img');
      img.src = base + '.jpg'; img.alt = thumb.alt; img.decoding = 'async';
      img.width = +s.getAttribute('data-w'); img.height = +s.getAttribute('data-h');
      pic.appendChild(src); pic.appendChild(img);
      stage.replaceChildren(pic);
      count.textContent = pad(at + 1) + ' / ' + pad(shots.length);
      thumbs.forEach(function (b, k) { b.setAttribute('aria-current', String(k === at)); });
    }
    function open(i, from) {
      opener = from; show(i);
      document.documentElement.style.overflow = 'hidden';
      box.showModal();
    }
    shots.forEach(function (s, i) { s.addEventListener('click', function () { open(i, s); }); });
    $$('.shot[data-clone]').forEach(function (c) {
      var i = +c.getAttribute('data-clone');
      c.addEventListener('click', function () { open(i, shots[i]); });
    });
    $('[data-close]', box).addEventListener('click', function () { box.close(); });
    $('[data-prev]', box).addEventListener('click', function () { show(at - 1); });
    $('[data-next]', box).addEventListener('click', function () { show(at + 1); });
    // A click on the empty dark area closes; a click on the photo does not
    box.addEventListener('click', function (e) { if (e.target === box || e.target === stage || e.target.classList.contains('lightbox__pic')) box.close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(at - 1);
      if (e.key === 'ArrowRight') show(at + 1);
    });
    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 48) show(at + (dx < 0 ? 1 : -1));
    });
    box.addEventListener('close', function () {
      stage.replaceChildren();
      document.documentElement.style.overflow = '';
      if (opener) opener.focus({ preventScroll: true });
    });
  })();

  /* How It Works: a floor laid in 3D as the visitor scrolls. The section stays a plain,
     readable list until WebGL is confirmed, so nothing is hidden if the 3D cannot run. */
  (function () {
    var how = $('#how');
    var canvas = how && $('.how__canvas', how);
    if (!how || !canvas || reduced.matches || !('IntersectionObserver' in window)) return;
    try {
      var probe = document.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;
    } catch (e) { return; }

    var steps = $$('.step', how), dots = $$('.how__dots i', how), stages = $$('.how__process li', how);
    var scene = null, current = -1, loading = false;

    function setStep(i) {
      if (i === current) return;
      current = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k <= i); });
      if (scene) scene.setStep(i);
    }
    function progress() {
      var r = how.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setStep(Math.min(2, Math.floor(p * 3)));
      if (scene) scene.setProgress(p);
    }

    function load() {
      if (loading) return;
      loading = true;
      import(new URL('steps3d.js?v=20261113q', SELF).href).then(function (mod) {
        return mod.mount(canvas, {
          texture: new URL('../img/slab-white-2000.jpg', SELF).href,
          onStage: function (i) { stages.forEach(function (s, k) { s.classList.toggle('is-on', k === i); }); }
        });
      }).then(function (api) {
        scene = api;
        how.classList.add('is-live');
        current = -1;
        progress();
        window.addEventListener('scroll', progress, { passive: true });
        window.addEventListener('resize', progress);
        new IntersectionObserver(function (en) { scene.setVisible(en[0].isIntersecting); }, { rootMargin: '10% 0px' }).observe(how);
      }).catch(function (err) {
        if (window.console) console.warn('3D steps unavailable, showing the still instead.', err);
      });
    }
    var near = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { near.disconnect(); load(); }
    }, { rootMargin: '900px 0px' });
    near.observe(how);
  })();

  /* Mobile dock: appears after the hero, steps aside while the form is on screen */
  (function () {
    var dock = $('#dock'), form = $('#quote-form');
    if (!dock || !hero || !('IntersectionObserver' in window)) return;
    var pastHero = false, onForm = false;
    function sync() { dock.classList.toggle('is-on', pastHero && !onForm); }
    new IntersectionObserver(function (en) { pastHero = !en[0].isIntersecting; sync(); }).observe(hero);
    if (form) new IntersectionObserver(function (en) { onForm = en[0].isIntersecting; sync(); }, { rootMargin: '-10% 0px' }).observe(form);
  })();

  /* Quote form */
  (function () {
    var form = $('#quote-form');
    if (!form) return;
    var guard = window.WSGuard ? window.WSGuard.watch(form) : null;
    var button = $('button[type="submit"]', form);
    var alertBox = $('#quote-alert');
    var phone = $('#f-phone');
    var label = button.firstChild;
    var idle = label.textContent;

    // US phone mask: (843) 952-9511. Accepts a pasted +1.
    function digits(v) { var d = v.replace(/\D/g, ''); return d.length === 11 && d[0] === '1' ? d.slice(1) : d.slice(0, 10); }
    function mask(v) {
      var d = digits(v);
      if (d.length < 4) return d;
      if (d.length < 7) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
      return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
    }
    phone.addEventListener('input', function () { phone.value = mask(phone.value); });

    var rules = {
      name: function (v) { return v.trim().length >= 2; },
      phone: function (v) { return digits(v).length === 10; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      location: function (v) { return v.trim().length >= 3; }
    };
    function fieldOf(el) { return el.closest('.field'); }
    function flag(el, bad) {
      var f = fieldOf(el);
      if (f) f.classList.toggle('is-bad', bad);
      if (el.setAttribute) el.setAttribute('aria-invalid', String(bad));
    }
    function check(name) {
      var el = form.elements[name];
      var ok = rules[name](el.value);
      flag(el, !ok);
      return ok;
    }
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      el.addEventListener('blur', function () { if (el.value) check(name); });
      el.addEventListener('input', function () { if (fieldOf(el).classList.contains('is-bad')) check(name); });
    });
    /* Steps: one screen at a time. Clicking a service moves on by itself; arrow keys only select. */
    var steps = $$('.qstep', form), at = 0, byPointer = false;
    var count = $('.qform__count b', form), bar = $$('.qform__bar li', form);
    function stepValid(i) {
      if (i === 0) {
        var ok = !!$('input[name="service"]:checked', form);
        $('#f-service').classList.toggle('is-bad', !ok);
        if (!ok) $('input[name="service"]', form).focus();
        return ok;
      }
      if (i === 1) { if (!check('location')) { form.elements.location.focus(); return false; } }
      return true;
    }
    function goTo(i, focus) {
      at = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) { s.classList.toggle('is-current', k === at); });
      bar.forEach(function (b, k) { b.classList.toggle('is-on', k <= at); });
      if (count) count.textContent = String(at + 1);
      var top = form.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 100, behavior: reduced.matches ? 'auto' : 'smooth' });
      if (focus !== false) {
        var target = $('input:not([type="hidden"]):not([data-hp]), textarea', steps[at]);
        if (target && at > 0) target.focus({ preventScroll: true });
      }
    }
    form.classList.add('is-stepped');
    $('.qform__progress', form).hidden = false;
    $$('.qnav, .qnav__back', form).forEach(function (n) { n.hidden = false; });
    $$('[data-next-step]', form).forEach(function (b) { b.addEventListener('click', function () { if (stepValid(at)) goTo(at + 1); }); });
    $$('[data-prev-step]', form).forEach(function (b) { b.addEventListener('click', function () { goTo(at - 1); }); });
    // Enter in a field on step 2 moves on instead of submitting
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && at < steps.length - 1 && e.target.tagName === 'INPUT') { e.preventDefault(); if (stepValid(at)) goTo(at + 1); }
    });
    $$('input[name="service"]', form).forEach(function (r) {
      r.addEventListener('pointerdown', function () { byPointer = true; });
      r.addEventListener('change', function () {
        $('#f-service').classList.remove('is-bad');
        if (byPointer && at === 0) setTimeout(function () { goTo(1); }, 280);
        byPointer = false;
      });
    });
    // "Get a quote" links in Services pre-select the service and open step 2
    $$('[data-service]').forEach(function (link) { link.addEventListener('click', function () { setTimeout(function () { goTo(1, false); }, 0); }); });
    goTo(0, false);

    function say(text, html) {
      var span = $('span', alertBox);
      if (html) span.innerHTML = text; else span.textContent = text;
      alertBox.classList.toggle('is-on', !!text);
    }
    function collect() {
      var out = {};
      new FormData(form).forEach(function (value, key) { out[key] = out[key] ? out[key] + ', ' + value : String(value); });
      return out;
    }
    // Copy of the lead for the agency's lead platform. Best effort: it never blocks or fails the visitor's request.
    function sendLead(data) {
      var url = form.getAttribute('data-lead-webhook');
      if (!url) return;
      var zip = (data.location || '').match(/\b\d{5}\b/);
      var lead = {
        form_id: form.getAttribute('data-form-id'),
        source: location.hostname,
        page: location.href.split('#')[0],
        submitted_at: new Date().toISOString(),
        service: data.service || '',
        town: data.location || '',
        zip: zip ? zip[0] : '',
        message: data.message || '',
        name: data.name,
        phone: data.phone,
        email: data.email || ''
      };
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead), keepalive: true, credentials: 'omit' }).catch(function () {});
    }
    function done(first) {
      $('#quote-done-title').textContent = 'Thanks' + (first ? ', ' + first : '') + '.';
      form.classList.add('is-sent');
      $('#quote-done').focus({ preventScroll: true });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      say('');
      var firstBad = null;
      Object.keys(rules).forEach(function (name) { if (!check(name) && !firstBad) firstBad = form.elements[name]; });
      var service = $('input[name="service"]:checked', form);
      $('#f-service').classList.toggle('is-bad', !service);
      if (!service && !firstBad) firstBad = $('input[name="service"]', form);
      if (firstBad) {
        var home = firstBad.closest('.qstep');
        if (home) goTo(steps.indexOf(home), false);
        firstBad.focus();
        return;
      }

      var data = collect();
      var first = String(data.name || '').trim().split(' ')[0];

      // Spam guard (antispam.js): bots see the same thank-you and nothing is sent
      var verdict = guard ? guard.check(data) : {};
      if (verdict.trap) { done(first); return; }
      if (verdict.message) { say(verdict.message); return; }

      if (!data.access_key) {
        if (window.console) console.warn('Quote form: the Web3Forms access_key is not set in index.html, so nothing was sent.');
        say('This form is not connected yet. Please call <a href="tel:+18439529511">(843) 952-9511</a> or email <a href="mailto:wsflooringtile@gmail.com">wsflooringtile@gmail.com</a>.', true);
        return;
      }

      button.disabled = true;
      label.textContent = 'SENDING ';

      // Web3Forms is the delivery of record (email to the business)
      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().then(function (res) { if (!r.ok || !res.success) throw new Error(res.message || 'send failed'); });
      }).then(function () {
        if (guard) guard.sent();
        delete data.access_key;
        sendLead(data);
        track('generate_lead', { form_id: form.getAttribute('data-form-id'), service: data.service });
        done(first);
      }).catch(function () {
        button.disabled = false;
        label.textContent = idle;
        say('We could not send your request. Please try again, or call <a href="tel:+18439529511">(843) 952-9511</a>.', true);
      });
    });
  })();
})();
