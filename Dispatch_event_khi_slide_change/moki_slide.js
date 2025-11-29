const $ = (sel, doc = document) => doc.querySelector(sel);
const $$ = (sel, doc = document) => doc.querySelectorAll(sel);

const defaults = {
  autoPlay: true,
  autoPlayDelay: 3000,
  pauseOnHover: true,

  duration: 300,
  timingFunction: "ease",

  slidesPerPage: 1,
  loop: true,
  direction: "horizontal", // or vertical - v
  gap: 0,

  prevText: "←",
  nextText: "→",
  showArrows: true,
  showPagination: true,
  isPaginationInside: false,

  startIndex: 0,
  draggable: true,
  verticalThreshold: 0.12,
  horizontalThreshold: 0.12,

  onInit: null,
  onChange: null,
};

const mokiRefs = {
  slide: { sel: ".moki-slide", value: "moki-slide" },
  slideItems: { sel: ".moki-slide-item", value: "moki-slide-item" },
  pagination: { sel: ".moki-pagination", value: "moki-pagination" },
  paginationItems: {
    sel: ".moki-pagination-item",
    value: "moki-pagination-item",
  },
  prevButton: { sel: ".moki-prev", value: "moki-prev" },
  nextButton: { sel: ".moki-next", value: "moki-next" },
  container: { sel: ".moki-slide-container", value: "moki-slide-container" },
};

const STATUS = { READY: 1, MOVE: 2, PROCESSING: 3, DONE: 4 };

function MokiSlide(sel, opt = defaults) {
  this.sel = sel;
  this.opt = Object.assign({}, defaults, opt);
  this.opt = normalizeStringProps(this.opt);
  this.ignoreTargets = [];
  this._checkParams();
  this._init();
}

MokiSlide.prototype._checkParams = function () {
  if (this.totalSlideOrigin === 0) {
    console.warn("Slides cannot be empty!");
    return;
  }

  if (this.totalSlideOrigin < this.opt.slidesPerPage) {
    console.error(
      "The number of slides per view must be less than the total number of slides."
    );
    return;
  }

  if (!$(this.sel)) {
    console.error("Slide container element not found!");
    return;
  }

  if (!$(mokiRefs.slide.sel)) {
    console.error("Slide element not found!");
    return;
  } else if (!$(mokiRefs.slideItems.sel)) {
    console.error("Slide items not found!");
    return;
  } else if ($(mokiRefs.slideItems.sel).length === 0) {
    console.error("No slide items found in the container!");
    return;
  }

  if (this.opt.onInit !== null && typeof this.opt.onInit !== "function") {
    console.warn("Invalid 'onInit' callback: expected a function.");
    return;
  }

  if (this.opt.onInit !== null && typeof this.opt.onChange !== "function") {
    console.warn("Invalid 'onChange' callback: expected a function.");
  }

  if (this.opt.showArrows && (!this.opt.nextText || !this.opt.prevText)) {
    console.warn(
      '"nextText" or "prevText" is missing. Default arrows ← → will be used.'
    );
  }
};

MokiSlide.prototype._init = function () {
  this._initElements();
  this._initSlideState();
  this._cloneSlide();
  this._initStyleSlide();
  this._createPagination();
  this._createControl();
  this._initAutoPlay();
  this._initDraggable();

  if (this.currentIndex !== 0) {
    this.gotoSlide(this.currentIndex, true);
  }

  window.addEventListener("resize", this._handlerResize.bind(this));
  this._runCallback(this.opt.onInit);

  // dispatchEvent to document element
  this.slide.addEventListener("transitionend", () => {
    const oldSlide = this.slideItems[this.oldIndex];
    const currentSlide = this.slideItems[this.currentIndex];
    const event = new CustomEvent("slideshow:change", {
      detail: {
        old: oldSlide,
        current: currentSlide,
      },
    });
    document.dispatchEvent(event);
  });
};

MokiSlide.prototype._initElements = function () {
  this.container = $(this.sel);
  this.container.classList.add(mokiRefs.container.value);
  this.isClicked = false;
  this.slide = $(mokiRefs.slide.sel, this.container);
  this.slideItems = $$(mokiRefs.slideItems.sel, this.slide);
};

MokiSlide.prototype._initSlideState = function () {
  this.totalSlideOrigin = this.slideItems.length;
  this.currentIndex = this.opt.loop
    ? this.opt.startIndex + this.opt.slidesPerPage
    : this.opt.startIndex;
  this.oldIndex = this.currentIndex;
  this.shouldDisableAllControls = false;
  if (this.totalSlideOrigin === this.opt.slidesPerPage) {
    this.currentIndex = 0;
    this.shouldDisableAllControls = true;
  }
  this.dragState = {
    isDraging: false,
    start: 0,
    end: 0,
    range: 0,
    currentRange: 0,
    canMove: false,
    status: STATUS.READY,
  };
  this.isVertical =
    this.opt.direction === "v" || this.opt.direction === "vertical";
};

MokiSlide.prototype._initAutoPlay = function () {
  if (!this.opt.autoPlay) return;
  this._startAutoPlay();
  this._setupAutoPlayHoverEvents();
};

MokiSlide.prototype._startAutoPlay = function () {
  if (this.autoPlay) return;
  this.autoPlay = setInterval(
    this.nextSlide.bind(this),
    this.opt.autoPlayDelay
  );
};

MokiSlide.prototype._stopAutoPlay = function () {
  clearInterval(this.autoPlay);
  this.autoPlay = null;
};

MokiSlide.prototype._setupAutoPlayHoverEvents = function () {
  this.slide.addEventListener("pointerenter", (e) => {
    if (!this.opt.autoPlay || !this.opt.pauseOnHover) return;
    const notIgnore = !this.ignoreTargets.includes(e.target);
    if (notIgnore) {
      this._stopAutoPlay();
    }
  });

  this.slide.addEventListener("pointerleave", () => {
    if (this.autoPlay === null && this.opt.pauseOnHover && this.opt.autoPlay) {
      this._startAutoPlay();
    }
  });
};

MokiSlide.prototype._initDraggable = function () {
  if (!this.opt.draggable) return;
  const isPositive = String(this.slide.style.transform).includes("-");
  const currentRange = this.isVertical
    ? this.offsetHeightOfSlide * this.currentIndex
    : this.offsetWidthOfSlide * this.currentIndex;
  this.dragState.currentRange = isPositive ? -currentRange : currentRange;

  this.slide.addEventListener("pointerdown", (e) => {
    const isIgnore = this.ignoreTargets.includes(e.target);
    const isReady = this.dragState.status === STATUS.READY;
    const canDown = !isIgnore && isReady;
    if (!canDown) {
      return;
    }
    this.slide.setPointerCapture(e.pointerId);
    this.dragState.start = this.isVertical ? e.clientY : e.clientX;
    this.dragState.status = STATUS.MOVE;
    this.opt.autoPlay && this._stopAutoPlay();
  });

  this.slide.addEventListener("pointermove", (e) => {
    const canMove = this.dragState.status === STATUS.MOVE;
    if (!canMove) return;
    this.dragState.end = this.isVertical ? e.clientY : e.clientX;
    this.dragState.range = this.dragState.end - this.dragState.start;
    this.slide.style.transition = "none";
    this.container.style.userSelect = "none";
    this.slide.style.transform = `translate${this.isVertical ? "Y" : "X"}(${
      this.dragState.currentRange + this.dragState.range
    }px)`;
  });

  this.slide.addEventListener("pointerup", (e) => {
    if (this.dragState.status !== STATUS.MOVE) {
      return;
    }
    if (this.dragState.range === 0 && this.dragState.status === STATUS.MOVE) {
      this.slide.releasePointerCapture(e.pointerId);
      this.dragState.status = STATUS.DONE;
      this._resetStage();
      return;
    }
    this.dragState.currentRange =
      this.dragState.currentRange + (this.dragState.end - this.dragState.start);
    this.container.style.userSelect = "auto";
    this.slide.style.transition = `all ${this.opt.duration}ms ${this.opt.timingFunction}`;
    this.slide.releasePointerCapture(e.pointerId);

    this.dragState.status = STATUS.PROCESSING;
    const isNextSlide = this.dragState.range <= -this.dragDistance;
    const ispreveSlide = this.dragState.range >= this.dragDistance;
    this.oldIndex = this.currentIndex;

    if (isNextSlide) {
      this.currentIndex += this.opt.slidesPerPage;
      this._handlerMoveSlideTarget(true);
    } else if (ispreveSlide) {
      this.currentIndex -= this.opt.slidesPerPage;
      this._handlerMoveSlideTarget(false);
    } else if (this.dragState.range !== 0) {
      this.gotoSlide(this.currentIndex, false, true);
    }
  });
};

MokiSlide.prototype._initWidthSlide = function () {};

// Create Pagination
MokiSlide.prototype._createPagination = function () {
  if (!this.opt.showPagination) return;
  const pagination = document.createElement("div");
  const countPagination = Math.ceil(
    this.totalSlideOrigin / this.opt.slidesPerPage
  );
  pagination.className = mokiRefs.pagination.value;
  pagination.style.width = `100%`;
  for (let i = 1; i <= countPagination; i++) {
    const paginationItem = document.createElement("div");
    paginationItem.className = mokiRefs.paginationItems.value;
    paginationItem.style.transition = `all ${this.opt.duration}ms ${this.opt.timingFunction}`;
    if (!this.shouldDisableAllControls) {
      paginationItem.addEventListener(
        "click",
        this._onPagination.bind(this, i * this.opt.slidesPerPage)
      );
    }
    pagination.appendChild(paginationItem);
    this.ignoreTargets.push(paginationItem);
  }

  this.container.after(pagination);
  this.pagination = $(mokiRefs.pagination.sel);
  this.paginationItems = $$(mokiRefs.paginationItems.sel, this.pagination);
  this._activePagination();
  if (this.opt.isPaginationInside) {
    this.pagination.style.transform = "translateY(-100%)";
    this.pagination.style.backgroundColor = "transparent";
  }
  this.ignoreTargets.push(pagination);
};

MokiSlide.prototype._onPagination = function (slideIndex) {
  this.currentIndex = slideIndex;
  this.gotoSlide(slideIndex);
  this._activePagination();
};

// Create Control
MokiSlide.prototype._setupButtonControl = function (button, isNextSlide) {
  if (!button) return;
  const prevTextDefault = "←";
  const nextTextDefault = "→";
  if (!button.value) {
    button.value = isNextSlide ? nextTextDefault : prevTextDefault;
    button.innerText = value;
  }

  if (!this.isVertical) return;

  if (button.value === nextTextDefault) {
    button.classList.add("rotate-down");
  }

  if (button.value === prevTextDefault) {
    button.classList.add("rotate-up");
  }
};

MokiSlide.prototype._createControl = function () {
  if (!this.opt.showArrows) return;
  const prevButton = createButton(mokiRefs.prevButton.value, this.opt.prevText);
  this._setupButtonControl(prevButton, false);
  if (this.shouldDisableAllControls) {
    prevButton.disabled = true;
  } else {
    prevButton.addEventListener("click", this.prevSlide.bind(this));
  }

  const nextButton = createButton(mokiRefs.nextButton.value, this.opt.nextText);
  this._setupButtonControl(nextButton, true);
  if (this.shouldDisableAllControls) {
    nextButton.disabled = true;
  } else {
    nextButton.addEventListener("click", this.nextSlide.bind(this));
  }

  this.container.appendChild(prevButton);
  this.container.appendChild(nextButton);
  this.controls = { prevButton, nextButton };
  this.ignoreTargets.push(prevButton, nextButton);
};

MokiSlide.prototype._handlerMoveSlideTarget = function (isNextSlide) {
  const slideLastIndex = this.slideItems.length - 1;
  const shouldWrap =
    this.currentIndex + this.opt.slidesPerPage > slideLastIndex ||
    this.currentIndex <= 0;
  if (!this.opt.loop) {
    if (this.currentIndex > slideLastIndex) {
      this.currentIndex -= this.opt.slidesPerPage;
    }
    if (this.currentIndex < 0) {
      this.currentIndex = 0;
    }
  }

  this.gotoSlide(this.currentIndex);
  this._activePagination();

  if (shouldWrap && this.opt.loop) {
    this.currentIndex = isNextSlide
      ? this.currentIndex - this.totalSlideOrigin
      : this.currentIndex + this.totalSlideOrigin;
    !isNextSlide && this._activePagination();
    this.isClicked = true;
    setTimeout(() => {
      this.gotoSlide(this.currentIndex, true);
    }, this.opt.duration);
  }
};

MokiSlide.prototype._activePagination = function () {
  if (!this.opt.showPagination) return;
  let paginationIndex = Math.floor(
    (this.currentIndex - this.opt.slidesPerPage) / this.opt.slidesPerPage
  );

  if (!this.opt.loop) {
    paginationIndex += 1;
  } else {
    if (paginationIndex < 0) {
      paginationIndex = 0;
    }

    if (this.currentIndex - this.opt.slidesPerPage < 0) {
      paginationIndex = this.paginationItems.length - 1;
    }

    if (
      this.currentIndex >
      this.totalSlideOrigin - 1 + this.opt.slidesPerPage
    ) {
      paginationIndex = 0;
    }

    if (this.opt.slidesPerPage === this.totalSlideOrigin) {
      paginationIndex = 0;
    }
  }

  removesClass(this.paginationItems, "active");
  this.paginationItems[paginationIndex]?.classList.add("active");
};

MokiSlide.prototype.gotoSlide = function (
  index,
  noTransition = false,
  noWaitTransitionEnd = false
) {
  this.opt.autoPlay && this._stopAutoPlay();
  const cWidth = this.isVertical
    ? this.offsetHeightOfSlide * index
    : this.offsetWidthOfSlide * index;
  this.slide.style.transition = noTransition
    ? "none"
    : `all ${this.opt.duration}ms ${this.opt.timingFunction}`;
  this.slide.style.transform = `translate${
    this.isVertical ? "Y" : "X"
  }(-${cWidth}px)`;

  if (this.opt.draggable) {
    this.dragState.currentRange = -cWidth;
  }

  this.dragState.status = STATUS.DONE;
  if (!noTransition && !noWaitTransitionEnd) {
    setTimeout(() => {
      this._resetStage();
    }, this.opt.duration);
  } else {
    this._resetStage();
  }

  // if (!noTransition && this.oldIndex !== this.currentIndex) {
  //     this._runCallback(this.opt.onChange);
  // }
};

MokiSlide.prototype._resetStage = function () {
  this.isClicked = false;
  this.dragState.start = 0;
  this.dragState.end = 0;
  this.dragState.range = 0;
  this.opt.autoPlay && this._startAutoPlay();
  this.dragState.status === STATUS.DONE &&
    (this.dragState.status = STATUS.READY);
};

MokiSlide.prototype.nextSlide = function () {
  this._moveSlide(true);
};

MokiSlide.prototype.prevSlide = function () {
  this._moveSlide(false);
};

MokiSlide.prototype._moveSlide = function (isNextSlide) {
  if (this.isClicked) return;
  this.isClicked = true;
  this.oldIndex = this.currentIndex;
  this.currentIndex = isNextSlide
    ? this.currentIndex + this.opt.slidesPerPage
    : this.currentIndex - this.opt.slidesPerPage;
  this._handlerMoveSlideTarget(isNextSlide);
};

MokiSlide.prototype._cloneSlide = function () {
  if (this.slideItems.length < 2 || !this.opt.loop) return;
  if (this.slideItems.length === this.opt.slidesPerPage) return;
  const slideArr = Array.from(this.slideItems);
  const slidesCloneFirst = slideArr.slice(0, this.opt.slidesPerPage);
  const slidesLastClone = slideArr.slice(-this.opt.slidesPerPage);

  slidesCloneFirst.forEach((item) => {
    this.slide.appendChild(item.cloneNode(true));
  });
  slidesLastClone.reverse().forEach((item) => {
    this.slide.prepend(item.cloneNode(true));
  });
  this.slideItems = $$(mokiRefs.slideItems.sel, this.slide);
};

MokiSlide.prototype._initStyleSlide = function () {
  // Set back ground images
  this.slideItems.forEach((item) => {
    const urlImage = item.dataset.image;
    urlImage && (item.style.backgroundImage = `url(${urlImage})`);
  });

  // Set Width
  this.slideItems.forEach((item) => {
    if (this.isVertical) {
      item.style.height = `calc(100% / ${this.opt.slidesPerPage})`;
    } else {
      item.style.width = `calc(100% / ${this.opt.slidesPerPage})`;
    }
  });
  const gap = this.opt.slidesPerPage > 1 ? this.opt.gap : 0;
  this.slide.style.gap = `${gap}px`;
  this.offsetWidthOfSlide =
    this.slideItems[0].offsetWidth + gap * (this.opt.slidesPerPage - 1);
  this.offsetHeightOfSlide =
    this.slideItems[0].offsetHeight + gap * (this.opt.slidesPerPage - 1);
  this.dragDistance = this.isVertical
    ? this.offsetHeightOfSlide * this.opt.verticalThreshold
    : this.offsetWidthOfSlide * this.opt.horizontalThreshold;
  // Set Style
  if (this.isVertical) {
    this.slide.style = "flex-direction: column;";
  }
};

MokiSlide.prototype._runCallback = function (callback) {
  typeof callback === "function" && callback();
};

MokiSlide.prototype._handlerResize = function () {
  this._stopAutoPlay();
  this.offsetWidthOfSlide =
    this.slideItems[0].offsetWidth +
    this.opt.gap * (this.opt.slidesPerPage - 1);
  this.offsetHeightOfSlide =
    this.slideItems[0].offsetHeight +
    this.opt.gap * (this.opt.slidesPerPage - 1);
  this.dragDistance = this.isVertical
    ? this.offsetHeightOfSlide * this.opt.verticalThreshold
    : this.offsetWidthOfSlide * this.opt.horizontalThreshold;
  this.gotoSlide(this.currentIndex, true);
};

// ---- Utils -----
function removesClass(els, className) {
  if (els && typeof className === "string") {
    els.forEach((el) => el.classList.remove(className));
  }
}

function normalizeStringProps(target) {
  Object.keys(target).forEach((key) => {
    if (typeof target[key] === "string") {
      target[key] = target[key].trim().toLowerCase();
    }
  });
  return target;
}

function createButton(className, value) {
  const newButton = document.createElement("button");
  newButton.className = className;
  newButton.innerText = value;
  newButton.value = value;
  newButton.type = "button";
  return newButton;
}
