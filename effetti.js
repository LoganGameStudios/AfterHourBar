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
