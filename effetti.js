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
  const dots = controls.querySelector(".reviews-dots");
  let step = 0;
  let end = 0;
  let active = 0;

  function updateReviewPosition() {
    const left = reviewsSlider.scrollLeft;
    active = Math.max(0, Math.min(dots.childElementCount - 1, Math.round(left / step)));
    previous.setAttribute("aria-disabled", String(left <= 1));
    next.setAttribute("aria-disabled", String(left >= end - 1));
    for (const [index, dot] of Array.from(dots.children).entries()) {
      dot.setAttribute("aria-current", String(index === active));
    }
  }

  function measureReviews() {
    const cardWidth = reviewsSlider.firstElementChild.getBoundingClientRect().width;
    step = cardWidth + parseFloat(getComputedStyle(reviewsSlider).columnGap);
    end = reviewsSlider.scrollWidth - reviewsSlider.clientWidth;
    const count = Math.round(end / step) + 1;
    controls.hidden = count < 2;
    if (dots.childElementCount !== count) {
      dots.replaceChildren(...Array.from({ length: count }, (_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.dataset.reviewIndex = String(index);
        dot.setAttribute("aria-label", `Vai alla recensione ${index + 1}`);
        dot.setAttribute("aria-controls", reviewsSlider.id);
        return dot;
      }));
    }
    updateReviewPosition();
  }

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.getAttribute("aria-disabled") === "true") return;

    const { reviewIndex, reviewStep } = button.dataset;
    const index = reviewIndex === undefined ? active + Number(reviewStep) : Number(reviewIndex);
    reviewsSlider.scrollTo({ left: Math.min(end, index * step) });
  });

  reviewsSlider.addEventListener("scroll", updateReviewPosition, { passive: true });
  new ResizeObserver(measureReviews).observe(reviewsSlider);
  measureReviews();
}
