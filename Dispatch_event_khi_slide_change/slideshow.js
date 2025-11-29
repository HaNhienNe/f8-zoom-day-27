const slider = new MokiSlide("#demo-slide", {
  direction: "vertical",
  isPaginationInside: true,
});

document.addEventListener("slideshow:change", function (e) {
  console.log("old:", e.detail.old);
  console.log("current:", e.detail.current);
});
