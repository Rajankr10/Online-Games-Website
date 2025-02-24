// Initialize Swiper
var TrandingSlider = new Swiper('.tranding-slider', {
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  loop: true,
  slidesPerView: 'auto',
  coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: 100,
      modifier: 2.5,
  },
  pagination: {
      el: '.swiper-pagination',
      clickable: true,
  },
  navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
  },
});

// URL map for redirection
const urlMap = {
  'rick-and-morty-card': 'rick-and-morty-search.html',
  'disney-card': 'disney.html',
  'marvel-card': 'marvel.html',
  'pokemon-card': 'pokemon.html'
};

// Delegated click event on the Swiper wrapper
document.querySelector('.tranding-slider .swiper-wrapper').addEventListener('click', (e) => {
  const slide = e.target.closest('.swiper-slide'); // Get the closest slide element
  if (!slide) return;

  const targetId = slide.getAttribute('data-target'); // Get the data-target attribute
  if (urlMap[targetId]) {
      window.location.href = urlMap[targetId]; // Redirect if the ID matches
  }
});
