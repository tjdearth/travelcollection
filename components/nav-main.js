(function() {
  var navEl = document.getElementById('shared-nav');
  var drawerEl = document.getElementById('shared-drawer');
  if (!navEl) return;

  var logoFallback = 'https://cdn.prod.website-files.com/645dce8d3cf060ba152e3ed6/645dd0fb59b28a589dc86dba_TCL%20White%20Logo%20200.png';
  var logoPrimary = 'https://lh7-rt.googleusercontent.com/docsz/AD_4nXcDxFTb6VtsFHv8tdDRMMDtcCtwxT8kKb4OoqXBKpvaLaG-tBr1fvwOdHGkTA2_RCMhasoBW4PHKxV6_QEtNLpfXUxP2sW6avbsbJuCc_rlgsIOebF9bRKiwRANF56d_PTMB7o8?key=5z7x5EJrcuoubrabZrlshg';

  navEl.innerHTML =
    '<a href="travel-collection-v1.html" class="nav-logo">' +
      '<img src="' + logoPrimary + '" alt="Travel Collection" onerror="this.onerror=null;this.src=\'' + logoFallback + '\';">' +
    '</a>' +
    '<ul class="nav-links">' +
      '<li><a href="travel-collection-v1.html#destinations">Destinations</a></li>' +
      '<li><a href="travel-collection-v1.html#services">Services</a></li>' +
      '<li><a href="travel-collection-v1.html#philosophy">About</a></li>' +
      '<li><a href="team-v1.html">Our Team</a></li>' +
      '<li><a href="advisor-portal.html" class="nav-cta">Advisor Portal</a></li>' +
    '</ul>' +
    '<button class="nav-toggle" id="navToggle" aria-label="Menu">' +
      '<span></span><span></span><span></span>' +
    '</button>';

  if (drawerEl) {
    drawerEl.innerHTML =
      '<a href="travel-collection-v1.html#destinations" onclick="closeMobileNav()">Destinations</a>' +
      '<a href="travel-collection-v1.html#services" onclick="closeMobileNav()">Services</a>' +
      '<a href="travel-collection-v1.html#philosophy" onclick="closeMobileNav()">About</a>' +
      '<a href="team-v1.html">Our Team</a>' +
      '<a href="advisor-portal.html">Advisor Portal</a>';
  }

  // ====== NAV SCROLL ======
  window.addEventListener('scroll', function() {
    navEl.classList.toggle('scrolled', window.scrollY > 80);
  });
  if (window.scrollY > 80) navEl.classList.add('scrolled');

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
  }
})();
