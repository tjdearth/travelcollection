(function() {
  var el = document.getElementById('shared-footer');
  if (!el) return;
  el.innerHTML = '<footer class="footer">' +
    '<div class="footer-grid">' +
      '<div class="footer-brand">' +
        '<img src="https://cdn.prod.website-files.com/645dce8d3cf060ba152e3ed6/645dd0fb59b28a589dc86dba_TCL%20White%20Logo%20200.png" alt="Travel Collection">' +
        '<p>A global family of destination management companies, each led by local experts who craft deeply personal travel experiences across 22 countries.</p>' +
      '</div>' +
      '<div>' +
        '<h4>Company</h4>' +
        '<ul class="footer-links">' +
          '<li><a href="travel-collection-v1.html">About Us</a></li>' +
          '<li><a href="team-v1.html">Our Team</a></li>' +
          '<li><a href="#">Careers</a></li>' +
          '<li><a href="#">Sustainability</a></li>' +
          '<li><a href="mailto:info@travelcollection.com">Contact</a></li>' +
        '</ul>' +
      '</div>' +
      '<div>' +
        '<h4>Destinations</h4>' +
        '<div class="footer-dest-grid">' +
          '<a href="https://www.experiencemorocco.com" target="_blank">Morocco</a>' +
          '<a href="https://www.authenticusitaly.it" target="_blank">Italy</a>' +
          '<a href="https://www.unboxspainandportugal.com" target="_blank">Spain</a>' +
          '<a href="https://www.unboxspainandportugal.com" target="_blank">Portugal</a>' +
          '<a href="https://www.trulyswahili.com" target="_blank">Kenya</a>' +
          '<a href="https://www.trulyswahili.com" target="_blank">Tanzania</a>' +
          '<a href="https://www.trulyswahili.com" target="_blank">Uganda</a>' +
          '<a href="https://www.trulyswahili.com" target="_blank">Rwanda</a>' +
          '<a href="https://www.acrossmexico.com" target="_blank">Mexico</a>' +
          '<a href="https://www.kembaliasia.com" target="_blank">Indonesia</a>' +
          '<a href="https://www.kembaliasia.com" target="_blank">Singapore</a>' +
          '<a href="https://www.kembaliasia.com" target="_blank">Malaysia</a>' +
          '<a href="https://www.majlisretreats.com" target="_blank">UAE</a>' +
          '<a href="https://www.crownjourney.com" target="_blank">United Kingdom</a>' +
          '<a href="https://www.oshinobitravel.com" target="_blank">Japan</a>' +
          '<a href="https://www.essentiallyfrench.com" target="_blank">France</a>' +
          '<a href="https://www.eluraaustralia.com" target="_blank">Australia</a>' +
          '<a href="https://www.nirathailand.com" target="_blank">Thailand</a>' +
          '<a href="https://www.sarturkiye.com" target="_blank">T\u00fcrkiye</a>' +
          '<a href="https://www.nostosgreece.com" target="_blank">Greece</a>' +
          '<a href="https://www.vistacolombia.com" target="_blank">Colombia</a>' +
          '<a href="https://www.awakenperu.com" target="_blank">Peru</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-newsletter">' +
        '<h4>Stay Inspired</h4>' +
        '<p>Subscribe to receive curated travel stories, destination highlights, and exclusive offers from across the collection.</p>' +
        '<form class="footer-newsletter-form" onsubmit="event.preventDefault();">' +
          '<input type="email" placeholder="Your email address">' +
          '<button type="submit">Join</button>' +
        '</form>' +
      '</div>' +
    '</div>' +
    '<div class="footer-bottom">' +
      '&copy; 2026 Travel Collection. All rights reserved. &nbsp;|&nbsp; Privacy Policy &nbsp;|&nbsp; Terms of Service' +
    '</div>' +
  '</footer>';
})();
