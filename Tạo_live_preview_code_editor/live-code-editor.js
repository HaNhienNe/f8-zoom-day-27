const codeInput = document.querySelector(".code");
const codeHighlight = document.querySelector(".highlight code");
const highlight = document.querySelector(".highlight");
const view = document.querySelector(".i-view");
const resize = document.querySelector(".resize");
const editor = document.querySelector(".editor");
const app = document.querySelector(".app");
const overlay = document.querySelector(".iframe-overlay");
const saveButton = document.querySelector(".save-button");
let isDark = true;
const hrefDark = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css`;
const hrefLigth = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css`;
let isFirst = true;

let oldContent = "";
let isChanged = false;
let isResizing = false;
let startX = 0;
let initialLeft = 0;

resize.addEventListener("mousedown", (e) => {
  isResizing = true;
  startX = e.clientX;
  initialLeft = resize.offsetLeft;
  overlay.style.display = "block";
  resize.classList.add("bg-blue");
});

app.addEventListener("mousemove", (e) => {
  if (!isResizing) return;

  const minWidth = 100;
  const maxWidth = app.offsetWidth - 100;
  let delta = e.clientX - startX + initialLeft;
  delta = Math.max(minWidth, delta);
  delta = Math.min(delta, maxWidth);

  resize.style.left = `${delta}px`;
  const newWidth = (resize.offsetLeft / app.offsetWidth) * 100;
  editor.style.width = `${newWidth}%`;
});

document.addEventListener("mouseup", (e) => {
  isResizing = false;
  overlay.style.display = "none";
  resize.classList.remove("bg-blue");
});

codeInput.addEventListener("input", updatePreview);

codeInput.addEventListener("scroll", () => {
  highlight.scrollTop = codeInput.scrollTop;
  highlight.scrollLeft = codeInput.scrollLeft;
});

function updatePreview() {
  const value = codeInput.value;
  view.srcdoc = value;
  codeHighlight.textContent = value;
  Prism.highlightElement(codeHighlight);
  if (isFirst) {
    isFirst = false;
  } else {
    isChanged = true;
    saveButton.classList.add("await");
  }
}

saveButton.addEventListener("click", () => {
  saveCode();
  saveButton.classList.remove("await");
});

function saveCode() {
  if (!isChanged) return;
  const value = codeInput.value;
  localStorage.setItem("srcDoc", value);
}

function loadPreview() {
  const srcDoc = localStorage.getItem("srcDoc") ?? "";
  codeInput.value = srcDoc;
  oldContent = srcDoc;
  updatePreview();
}

loadPreview();

codeInput.addEventListener("keydown", function (e) {
  if (e.key.toLowerCase() === "s" && e.ctrlKey) {
    e.preventDefault();
    saveCode();
    saveButton.classList.remove("await");
    return;
  }
});

const prismTheme = document.querySelector(".prism-theme");
const modeButton = document.querySelector(".mode-button");
modeButton.addEventListener("click", () => {
  isDark = !isDark;
  const href = isDark ? hrefDark : hrefLigth;
  prismTheme.setAttribute("href", href);
  if (!isDark) {
    highlight.classList.remove("dark");
  } else {
    highlight.classList.remove("dark");
  }
});

// window.addEventListener("beforeunload", function (e) {
//   if (!isChanged) return;
//   e.preventDefault();
//   e.returnValue = ""; // bắt buộc phải có để bật popup
// });
