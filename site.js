/* Shared interactions. Degrades gracefully: with JS off, all content is visible. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  // hero intro — reveal only once the tab is visible so it can't freeze faded
  var hero = document.querySelector('.hero');
  if (hero) {
    var reveal = function () { hero.classList.add('ready'); };
    if (document.visibilityState === 'hidden') {
      var onVis = function () {
        if (document.visibilityState !== 'hidden') { document.removeEventListener('visibilitychange', onVis); requestAnimationFrame(reveal); }
      };
      document.addEventListener('visibilitychange', onVis);
      setTimeout(reveal, 5000);
    } else {
      requestAnimationFrame(function () { requestAnimationFrame(reveal); });
    }
  }

  if (!reduce && 'IntersectionObserver' in window) {
    var els = Array.prototype.slice.call(document.querySelectorAll(
      '.section-head, .explainer > *, .feature-card, .stop, .checks li, .person, .audience-card, .prose, .grid-2 > *, .spot-card, .cta-inner, .logo-tile'
    ));
    els.forEach(function (el, i) { el.classList.add('reveal'); el.style.transitionDelay = ((i % 5) * 55) + 'ms'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // session timeline: light the nearest stop, fill the connector
  var stops = document.querySelectorAll('.journey .stop');
  if (stops.length && 'IntersectionObserver' in window) {
    var jo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('on', en.isIntersecting); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    stops.forEach(function (s) { jo.observe(s); });
  }
  var journey = document.querySelector('.journey');
  var jfill = journey && journey.querySelector('.j-fill');
  if (journey && jfill && !reduce) {
    var updateFill = function () {
      var r = journey.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      var prog = Math.max(0, Math.min(1, (vh * 0.5 - r.top) / (r.height || 1)));
      var maxH = journey.clientHeight - 14 - 40;
      jfill.style.height = Math.max(0, prog * maxH) + 'px';
    };
    window.addEventListener('scroll', updateFill, { passive: true });
    window.addEventListener('resize', updateFill);
    updateFill();
  }
})();
