"use strict";

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove("reveal-pending");
      revealObserver.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -48px 0px", threshold: 0.08 });

  for (const element of document.querySelectorAll(".reveal")) {
    element.classList.add("reveal-pending");
    revealObserver.observe(element);
  }
}

const reviewsSlider = document.querySelector("#reviews-slider");

if (reviewsSlider) {
  const controls = document.querySelector(".reviews-controls");
  const [previous, next] = controls.querySelectorAll("button");

  function updateReviewControls() {
    const end = reviewsSlider.scrollWidth - reviewsSlider.clientWidth;
    controls.hidden = end <= 1;
    previous.setAttribute("aria-disabled", String(reviewsSlider.scrollLeft <= 1));
    next.setAttribute("aria-disabled", String(reviewsSlider.scrollLeft >= end - 1));
  }

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.getAttribute("aria-disabled") === "true") return;

    const cardWidth = reviewsSlider.firstElementChild.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(reviewsSlider).columnGap);
    reviewsSlider.scrollBy({ left: (cardWidth + gap) * Number(button.dataset.reviewStep) });
  });

  reviewsSlider.addEventListener("scroll", updateReviewControls, { passive: true });
  new ResizeObserver(updateReviewControls).observe(reviewsSlider);
  updateReviewControls();
}
