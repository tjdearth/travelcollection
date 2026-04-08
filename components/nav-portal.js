(function() {
  var navEl = document.getElementById('shared-nav');
  var drawerEl = document.getElementById('shared-drawer');
  if (!navEl) return;

  var logoSrc = 'https://cdn.prod.website-files.com/645dce8d3cf060ba152e3ed6/645dd0fb59b28a589dc86dba_TCL%20White%20Logo%20200.png';
  var logoFallback = logoSrc;
  var logoPrimary = 'https://lh7-rt.googleusercontent.com/docsz/AD_4nXcDxFTb6VtsFHv8tdDRMMDtcCtwxT8kKb4OoqXBKpvaLaG-tBr1fvwOdHGkTA2_RCMhasoBW4PHKxV6_QEtNLpfXUxP2sW6avbsbJuCc_rlgsIOebF9bRKiwRANF56d_PTMB7o8?key=5z7x5EJrcuoubrabZrlshg';

  // Detect current page for active link styling
  var page = window.location.pathname.split('/').pop() || '';

  navEl.innerHTML =
    '<a href="travel-collection-v1.html" class="nav-logo">' +
      '<img src="' + logoPrimary + '" alt="Travel Collection" onerror="this.onerror=null;this.src=\'' + logoFallback + '\';">' +
    '</a>' +
    '<ul class="nav-links">' +
      '<li>' +
        '<a href="advisor-portal.html#destinations">Destinations <span class="nav-arrow"></span></a>' +
        '<div class="nav-dropdown wide">' +
          '<div>' +
            '<div class="dropdown-group-title">Europe</div>' +
            '<a href="advisor-portal.html#destinations">Italy</a>' +
            '<a href="advisor-portal.html#destinations">Spain &amp; Portugal</a>' +
            '<a href="advisor-portal.html#destinations">France</a>' +
            '<a href="advisor-portal.html#destinations">United Kingdom</a>' +
            '<a href="advisor-portal.html#destinations">T\u00fcrkiye</a>' +
            '<a href="advisor-portal.html#destinations">Greece</a>' +
          '</div>' +
          '<div>' +
            '<div class="dropdown-group-title">Africa &amp; Middle East</div>' +
            '<a href="advisor-portal.html#destinations">Morocco</a>' +
            '<a href="advisor-portal.html#destinations">East Africa</a>' +
            '<a href="advisor-portal.html#destinations">UAE</a>' +
            '<div class="dropdown-group-title" style="margin-top:0.8rem;">Asia &amp; Pacific</div>' +
            '<a href="advisor-portal.html#destinations">Japan</a>' +
            '<a href="advisor-portal.html#destinations">Indonesia</a>' +
            '<a href="advisor-portal.html#destinations">Singapore</a>' +
            '<a href="advisor-portal.html#destinations">Malaysia</a>' +
            '<a href="advisor-portal.html#destinations">Australia</a>' +
            '<a href="advisor-portal.html#destinations">Thailand</a>' +
            '<div class="dropdown-group-title" style="margin-top:0.8rem;">Americas</div>' +
            '<a href="advisor-portal.html#destinations">Mexico</a>' +
            '<a href="advisor-portal.html#destinations">Colombia</a>' +
            '<a href="advisor-portal.html#destinations">Peru</a>' +
          '</div>' +
        '</div>' +
      '</li>' +
      '<li>' +
        '<a href="advisor-portal.html#resources">Resources <span class="nav-arrow"></span></a>' +
        '<div class="nav-dropdown">' +
          '<a href="itineraries.html">Sample Itineraries</a>' +
          '<a href="#">Training &amp; Webinars</a>' +
          '<a href="#">Booking Communications</a>' +
          '<a href="#">FAQs</a>' +
        '</div>' +
      '</li>' +
      '<li>' +
        '<a href="advisor-portal.html#resources">Marketing Hub <span class="nav-arrow"></span></a>' +
        '<div class="nav-dropdown">' +
          '<a href="#">Social Media Kit</a>' +
          '<a href="#">Email Templates</a>' +
          '<a href="culinary-guides.html">Culinary Guides</a>' +
          '<a href="#">Destination One-Pagers</a>' +
          '<a href="advisor-portal.html#compare">Destination Comparison</a>' +
        '</div>' +
      '</li>' +
      '<li><a href="advisor-portal.html#team">Meet Our Team</a></li>' +
      '<li><a href="advisor-portal.html#signup" class="nav-cta">Submit a Request</a></li>' +
    '</ul>' +
    '<button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">' +
      '<span></span><span></span><span></span>' +
    '</button>';

  if (drawerEl) {
    drawerEl.innerHTML =
      '<div class="mobile-expandable mobile-link" data-target="mob-dest">Destinations <span class="mobile-expand-icon">+</span></div>' +
      '<div class="mobile-sub" id="mob-dest">' +
        '<div class="mobile-sub-title">Europe</div>' +
        '<a href="advisor-portal.html#destinations">Italy</a><a href="advisor-portal.html#destinations">Spain &amp; Portugal</a><a href="advisor-portal.html#destinations">France</a><a href="advisor-portal.html#destinations">United Kingdom</a><a href="advisor-portal.html#destinations">T\u00fcrkiye</a><a href="advisor-portal.html#destinations">Greece</a>' +
        '<div class="mobile-sub-title">Africa &amp; Middle East</div>' +
        '<a href="advisor-portal.html#destinations">Morocco</a><a href="advisor-portal.html#destinations">East Africa</a><a href="advisor-portal.html#destinations">UAE</a>' +
        '<div class="mobile-sub-title">Asia &amp; Pacific</div>' +
        '<a href="advisor-portal.html#destinations">Japan</a><a href="advisor-portal.html#destinations">Indonesia</a><a href="advisor-portal.html#destinations">Singapore</a><a href="advisor-portal.html#destinations">Malaysia</a><a href="advisor-portal.html#destinations">Australia</a><a href="advisor-portal.html#destinations">Thailand</a>' +
        '<div class="mobile-sub-title">Americas</div>' +
        '<a href="advisor-portal.html#destinations">Mexico</a><a href="advisor-portal.html#destinations">Colombia</a><a href="advisor-portal.html#destinations">Peru</a>' +
      '</div>' +
      '<div class="mobile-expandable mobile-link" data-target="mob-resources">Resources <span class="mobile-expand-icon">+</span></div>' +
      '<div class="mobile-sub" id="mob-resources">' +
        '<a href="itineraries.html">Sample Itineraries</a><a href="#">Training &amp; Webinars</a><a href="#">Booking Communications</a><a href="#">FAQs</a>' +
      '</div>' +
      '<div class="mobile-expandable mobile-link" data-target="mob-marketing">Marketing Hub <span class="mobile-expand-icon">+</span></div>' +
      '<div class="mobile-sub" id="mob-marketing">' +
        '<a href="#">Social Media Kit</a><a href="#">Email Templates</a><a href="culinary-guides.html">Culinary Guides</a><a href="#">Destination One-Pagers</a><a href="advisor-portal.html#compare">Destination Comparison</a>' +
      '</div>' +
      '<a href="advisor-portal.html#team" class="mobile-link">Meet Our Team</a>' +
      '<a href="advisor-portal.html#signup" class="mobile-cta">Submit a Request</a>';
  }

  // ====== NAV SCROLL ======
  var nav = navEl;
  window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  });
  if (window.scrollY > 80) nav.classList.add('scrolled');

  // ====== MOBILE NAV ======
  var toggle = document.getElementById('navToggle');
  var drawer = drawerEl;
  if (toggle && drawer) {
    toggle.addEventListener('click', function() {
      var isOpen = drawer.classList.contains('open');
      drawer.classList.toggle('open');
      toggle.classList.toggle('active');
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    window.closeMobileNav = function() {
      drawer.classList.remove('open');
      toggle.classList.remove('active');
      document.body.style.overflow = '';
    };

    // Mobile expandable sections
    drawer.querySelectorAll('.mobile-expandable').forEach(function(exp) {
      exp.addEventListener('click', function() {
        var targetId = exp.getAttribute('data-target');
        var sub = document.getElementById(targetId);
        if (!sub) return;
        var isOpen = sub.classList.contains('open');
        drawer.querySelectorAll('.mobile-sub').forEach(function(s) { s.classList.remove('open'); });
        drawer.querySelectorAll('.mobile-expandable').forEach(function(e) {
          var icon = e.querySelector('.mobile-expand-icon');
          if (icon) icon.textContent = '+';
        });
        if (!isOpen) {
          sub.classList.add('open');
          var icon = exp.querySelector('.mobile-expand-icon');
          if (icon) icon.textContent = '\u2013';
        }
      });
    });
  }

  // ====== DROPDOWN NAV (touch support) ======
  if ('ontouchstart' in window) {
    navEl.querySelectorAll('.nav-links > li').forEach(function(li) {
      var dd = li.querySelector('.nav-dropdown');
      if (!dd) return;
      li.querySelector('a').addEventListener('click', function(e) {
        if (!li.classList.contains('dropdown-open')) {
          e.preventDefault();
          navEl.querySelectorAll('.nav-links > li').forEach(function(x) { x.classList.remove('dropdown-open'); });
          li.classList.add('dropdown-open');
        }
      });
    });
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.nav-links > li')) {
        navEl.querySelectorAll('.nav-links > li').forEach(function(x) { x.classList.remove('dropdown-open'); });
      }
    });
  }
})();
