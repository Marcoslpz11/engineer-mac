
window.addEventListener('load', function () {
  const slideLength = document.querySelectorAll(".swiper-slide").length;
  const caseSwiper = new Swiper('.p-XX__slider', {
    slidesPerGroup: 1,
    slidesPerView: 3,
    spaceBetween: 45,
    centeredSlides: false,
    slideVisibleClass: 'swiper-slide-visible',
    speed: 500,
    simulateTouch: true,
    loop: slideLength > 3,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    navigation: {
      prevEl: '.c-buttonPrev',
      nextEl: '.c-buttonNext',
    },
    breakpoints: {
      1080: {
        slidesPerView: 3,
        spaceBetween: 30,
      },
      810: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      650: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      320: {
        slidesPerView: 1,
        spaceBetween: 0,
      }
    }
  })
});
