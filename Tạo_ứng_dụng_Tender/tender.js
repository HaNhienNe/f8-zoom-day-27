console.log("tender.js");
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
      "./images/img3_2.png",
      "./images/img3_3.png"
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
      "./images/img6_1.png",
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
  currtentIndex: 2,
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
};

Tender.prototype._loadData = function () {
  const dataLocal = localStorage.getItem("data-tender");
  this.data = JSON.parse(dataLocal) ?? this.data;
};

Tender.prototype._loadEvents = function () {};
Tender.prototype._render = function () {
  this.infoName.textContent = this.tenderCurent.name;
  this.infoAge.textContent = this.tenderCurent.age;
  this.infoStatus.classList.toggle("on", this.tenderCurent.verified);
  this.infoHashtag.innerHTML = this.tenderCurent.tags
    .map((tag) => `<span class="hashtag"># ${tag}</span>`)
    .join("");
  this.infoBio.textContent = this.tenderCurent.bio;
  this.card.style.backgroundImage = `url(${this.tenderCurent.photos[0]})`;
  this.cardPagination.innerHTML = this.tenderCurent.photos
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
  this._initValues();
  this._loadData();
  this._loadElements();
  this._loadEvents();
  this.tenderCurent = this.data[this.currtentIndex];
  this.tenderContinue = this.data[this.currtentIndex + 1];
  this._render();
};

// Utils
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

new Tender()._start();
