const $ = (sel, doc = document) => doc.querySelector(sel);
const $$ = (sel, doc = document) => doc.querySelectorAll(sel);
const DATA = `[
  {
    "id": 1,
    "name": "Rai sen",
    "age": 22,
    "gender": "female",
    "job": "Content Creator",
    "location": "Ho Chi Minh City",
    "distance": 3,
    "verified": true,
    "photos": [
      "./images/img1.png",
      "./images/img1_1.png",
      "./images/img1_2.png",
      "./images/img1_3.png"
    ],
    "tags": ["Harry poster", "Hot yoga", "Self care"],
    "bio": "Bold energy, sharp mind, and a taste for adventure. I love deep conversations, spontaneous plans, and people who match my ambition. Bring honesty, humor, and good vibes only."
  },
  {
    "id": 2,
    "name": "Linh Pham",
    "age": 24,
    "gender": "female",
    "job": "Marketing Executive",
    "location": "Ho Chi Minh City",
    "distance": 5,
    "verified": false,
    "photos": [
      "./images/img2.png",
      "./images/img2_1.png",
      "./images/img2_2.png",
      "./images/img2_3.png",
      "./images/img2_4.png"
    ],
    "tags": ["Morning runs", "Matcha lover", "Minimal life"],
    "bio": "Calm soul with an active lifestyle. I enjoy early mornings, meaningful talks, and building a life with intention. Looking for someone kind, curious, and emotionally mature."
  },
  {
    "id": 3,
    "name": "Minh Tran",
    "age": 27,
    "gender": "male",
    "job": "Photographer",
    "location": "Ho Chi Minh City",
    "distance": 2,
    "verified": true,
    "photos": [
      "./images/img3.png",
      "./images/img3_1.png",
      "./images/img3_2.png"
    ],
    "tags": ["Street photography", "Night drives", "Indie music"],
    "bio": "Creative mind, old soul. I see beauty in small details and love quiet moments mixed with random adventures. If you enjoy deep talks at 2AM, we’ll get along just fine."
  },
  {
    "id": 4,
    "name": "Thao Nguyen",
    "age": 21,
    "gender": "female",
    "job": "University Student",
    "location": "Ho Chi Minh City",
    "distance": 6,
    "verified": false,
    "photos": [
      "./images/img4.png",
      "./images/img4_4.png",
      "./images/img4_1.png",
      "./images/img4_2.png",
      "./images/img4_3.png"
    ],
    "tags": ["Pilates", "Healthy food", "Journaling"],
    "bio": "Soft but strong. I believe in growth, self-love, and positive energy. Let’s motivate each other, laugh a lot, and create memories that actually mean something."
  },
  {
    "id": 5,
    "name": "Khoa Le",
    "age": 29,
    "gender": "male",
    "job": "Startup Founder",
    "location": "Ho Chi Minh City",
    "distance": 8,
    "verified": true,
    "photos": [
      "./images/img5.png",
      "./images/img5_1.png",
      "./images/img5_2.png",
      "./images/img5_3.png",
      "./images/img5_4.png"
    ],
    "tags": ["Startups", "Gym life", "Black coffee"],
    "bio": "Driven, focused, and straightforward. I value discipline, honesty, and people who know what they want. Looking for a partner, not a distraction."
  },
  {
    "id": 6,
    "name": "Mai Vo",
    "age": 25,
    "gender": "female",
    "job": "UI/UX Designer",
    "location": "Da Nang",
    "distance": 12,
    "verified": false,
    "photos": [
      "./images/img6.png",
      "./images/img6_2.png"
    ],
    "tags": ["Sunset chasing", "Film cameras", "Slow living"],
    "bio": "Romantic at heart, adventurous by nature. I love traveling without plans, capturing moments on film, and living life a little slower than everyone else."
  }
]
`;

const refs = {
  app: ".tender",
  card: ".card",
  cardPagination: ".card__pagination",
  infoName: ".info__name",
  infoAge: ".info__age",
  infoStatus: ".info__status",
  infoMoreButton: ".info__more",
  infoHashtag: ".info__hashtag",
  infoBio: ".info__bio",
  unlikeButton: ".button__unlike",
  likeButton: ".button__like",
  startButton: ".button__start",
  navigationHome: ".tender__navigation .home",
  navigationExtension: ".tender__navigation .list_extension",
  navigationLiked: ".tender__navigation .list_liked",
  navigationChat: ".tender__navigation .chat",
  navigationProfile: ".tender__navigation .profile",
};

const refsMulti = {
  paginations: "card__pagination pagination",
};

const inits = {
  data: JSON.parse(DATA),
  currtentIndex: 0,
  threshold: 0.12, // 12%
  canMove: false,
  start: 0,
  end: 0,
  range: 0,
  photoIndex: 0,
};

function Tender() {}

Tender.prototype._loadElements = function () {
  this._mapElements(refs, $);
  this._mapElements(refsMulti, $$);
  // Continue card
  this.continueCard = this.card.cloneNode(true);
  this.continueCard.classList.add("card__continue");
  this.card.after(this.continueCard);

  const refsContinueCard = {
    continueCard: ".card.card__continue",
    continueCardPagination: ".card__continue .card__pagination",
    continueInfoName: ".card__continue .info__name",
    continueInfoAge: ".card__continue .info__age",
    continueInfoStatus: ".card__continue .info__status",
    continueInfoMoreButton: ".card__continue .info__more",
    continueInfoHashtag: ".card__continue .info__hashtag",
    continueInfoBio: ".card__continue .info__bio",
    continueUnlikeButton: ".card__continue .button__unlike",
    continueLikeButton: ".card__continue .button__like",
    continueStartButton: ".card__continue .button__start",
  };
  this._mapElements(refsContinueCard, $);
};

Tender.prototype._initValues = function () {
  this._mapValues(inits);
  this._createRandomTender(0, this.data.length - 1, true);
};

Tender.prototype._loadData = function () {
  const dataLocal = localStorage.getItem("data-tender");
  this.data = JSON.parse(dataLocal) ?? this.data;
};

Tender.prototype._loadEvents = function () {
  this.card.addEventListener("pointerdown", (e) => {
    this.canMove = true;
    this.start = e.clientX;
    this.end = this.start;
  });

  this.card.addEventListener("pointermove", (e) => {
    if (!this.canMove) return;
    this.card.style.transition = `none`;
    this.end = e.clientX;
    this.range = this.start - this.end;
    this.card.style.transform = `translateX(${this.range * -1}px)`;
  });

  this.card.addEventListener("pointerup", (e) => {
    console.log("pointerup");
    this.canMove = false;
    const isContinue =
      Math.abs(this.range / this.card.offsetWidth) >= this.threshold;
    this.card.style.transition = `all .3s ease`;
    if (isContinue) {
      this.card.style.transform = "scale(0)";
      this.card.style.opacity = "0";
      setTimeout(() => {
        this._createRandomTender();
        this._render();
      }, 300);
    } else {
      this.card.style.transform = `translateX(0px)`;
    }
    const rect = this.card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isNextPhoto = x >= this.card.offsetWidth / 2;

    if (isNextPhoto && this.range === 0) {
      this._nextOrPrevPhoto(1);
    } else if (this.range === 0) {
      this._nextOrPrevPhoto(-1);
    }
  });

  this.card.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "transform") return;

    this.card.style.transition = `none`;
    this.card.style.transform = `scale(1)`;
    this.card.style.opacity = "1";
    this.start = 0;
    this.end = 0;
    this.range = 0;
  });
};

Tender.prototype._render = function () {
  this.photoIndex = 0;
  this.tenderCurrent = this.data[this.currtentIndex];
  this.tenderContinue = this.data[this.continueIndex];
  this.infoName.textContent = this.tenderCurrent.name;
  this.infoAge.textContent = this.tenderCurrent.age;
  this.infoStatus.classList.toggle("on", this.tenderCurrent.verified);
  this.infoHashtag.innerHTML = this.tenderCurrent.tags
    .map((tag) => `<span class="hashtag"># ${tag}</span>`)
    .join("");
  this.infoBio.textContent = this.tenderCurrent.bio;
  this.card.style.backgroundImage = `url(${this.tenderCurrent.photos[0]})`;
  this.cardPagination.innerHTML = this.tenderCurrent.photos
    .map((photo, i, photos) => {
      const pWidth = 100 / photos.length;
      return `<span style="width: ${pWidth}%" class="pagination ${
        i === 0 ? "active" : ""
      }"></span>`;
    })
    .join("");

  // continue card
  this.continueInfoName.textContent = this.tenderContinue.name;
  this.continueInfoAge.textContent = this.tenderContinue.age;
  this.continueInfoStatus.classList.toggle("on", this.tenderContinue.verified);
  this.continueInfoHashtag.innerHTML = this.tenderContinue.tags
    .map((tag) => `<span class="hashtag"># ${tag}</span>`)
    .join("");
  this.infoBio.textContent = this.tenderContinue.bio;
  this.continueCard.style.backgroundImage = `url(${this.tenderContinue.photos[0]})`;
  this.continueCardPagination.innerHTML = this.tenderContinue.photos
    .map((photo, i, photos) => {
      const pWidth = 100 / photos.length;
      return `<span style="width: ${pWidth}%" class="pagination ${
        i === 0 ? "active" : ""
      }"></span>`;
    })
    .join("");
};

Tender.prototype._start = function () {
  this._loadData();
  this._initValues();
  this._loadElements();
  this._loadEvents();
  this._render();
};

// Utils

Tender.prototype._nextOrPrevPhoto = function (step) {
  const photosLength = this.tenderCurrent.photos.length;
  this.photoIndex = (this.photoIndex + step + photosLength) % photosLength;
  this.card.style.backgroundImage = `url(${
    this.tenderCurrent.photos[this.photoIndex]
  })`;
  this.cardPagination.innerHTML = this.tenderCurrent.photos
    .map((photo, i, photos) => {
      const pWidth = 100 / photos.length;
      return `<span style="width: ${pWidth}%" class="pagination ${
        i === this.photoIndex ? "active" : ""
      }"></span>`;
    })
    .join("");
};

Tender.prototype._mapElements = function (sources, fn) {
  for (key in sources) {
    this[key] = fn(sources[key]);
  }
};

Tender.prototype._mapValues = function (sources) {
  for (key in sources) {
    this[key] = sources[key];
  }
};

Tender.prototype._createRandomTender = function (
  min = 0,
  max = this.data.length - 1,
  isFirst = false
) {
  let oldsIndex = [this.currtentIndex, this.continueIndex];
  for (let i = 0; i < 2; i++) {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (oldsIndex.includes(newIndex));
    if (isFirst) {
      if (i === 0) {
        this.currtentIndex = newIndex;
        oldsIndex.push(newIndex);
      } else {
        this.continueIndex = newIndex;
      }
    } else {
      this.currtentIndex = this.continueIndex;
      this.continueIndex = newIndex;
      return;
    }
  }
};

const mokiTender = new Tender();
mokiTender._start();
