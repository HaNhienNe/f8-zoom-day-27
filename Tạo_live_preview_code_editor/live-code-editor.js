const $ = (sel, doc = document) => doc.querySelector(sel);
const $$ = (sel, doc = document) => doc.querySelectorAll(sel);

const refs = {
  app: ".app",
  editor: ".editor",
  codeInput: ".code",
  highlight: ".highlight",
  codeHighlight: ".highlight code",
  resize: ".resize",
  view: ".i-view",
  overlay: ".iframe-overlay",
  saveButton: ".save-button",
  modeButton: ".mode-button",
  closePreviewButton: ".close__preview-button",
  contextmenuSave: ".save-contextmenu",
  contextmenuMode: ".mode-contextmenu",
  closePreviewContextmenu: ".close__preview-contextmenu",
  contextmenuClear: ".clear-contextmenu",
  contextmenu: ".contextmenu",
  prismTheme: ".prism-theme",
  modeButton: ".mode-button",
  header: ".header",
  contentContextmenu: ".close__preview-contextmenu .contextmenu-content",
};

const inits = {
  isCodeFullwidth: false,
  currentOffsetWidth: 0,
  isDark: true,
  hrefDark: `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css`,
  hrefLigth: `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css`,
  isFirst: true,
  oldContent: "",
  isChanged: false,
  isResizing: false,
  startX: 0,
  initialLeft: 0,
};

function MokiLiveEditor() {
  this._loadInitValues();
  this._loadElements();
  this._loadEvents();
  this._loadData();
}

MokiLiveEditor.prototype._loadInitValues = function () {
  for (key in inits) {
    this[key] = inits[key];
  }
};

MokiLiveEditor.prototype._loadElements = function () {
  for (key in refs) {
    this[key] = $(refs[key]);
  }
};

MokiLiveEditor.prototype._loadEvents = function () {
  // Code input
  this.codeInput.addEventListener("input", () => {
    this._updatePreview();
  });

  this.codeInput.addEventListener("scroll", () => {
    this.highlight.scrollTop = this.codeInput.scrollTop;
    this.highlight.scrollLeft = this.codeInput.scrollLeft;
  });

  this.codeInput.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "s" && e.ctrlKey) {
      e.preventDefault();
      this._saveCode();
      this.saveButton.classList.remove("await");
    }
  });

  // resize
  this.resize.addEventListener("mousedown", (e) => {
    this.isResizing = true;
    this.startX = e.clientX;
    this.initialLeft = this.resize.offsetLeft;
    this.overlay.style.display = "block";
    this.resize.classList.add("bg-blue");
  });

  this.app.addEventListener("mousemove", (e) => {
    if (!this.isResizing) return;
    const minWidth = 100;
    const maxWidth = this.app.offsetWidth - 100;
    let delta = e.clientX - this.startX + this.initialLeft;
    delta = Math.max(minWidth, delta);
    delta = Math.min(delta, maxWidth);

    this.resize.style.left = `${delta}px`;
    const newWidth = (this.resize.offsetLeft / this.app.offsetWidth) * 100;
    this.editor.style.width = `${newWidth}%`;
  });

  document.addEventListener("mouseup", () => {
    this.isResizing = false;
    this.overlay.style.display = "none";
    this.resize.classList.remove("bg-blue");
  });

  // Save code button
  this.saveButton.addEventListener("click", () => {
    this._saveCode();
    this.saveButton.classList.remove("await");
  });

  // Change mode button
  this.modeButton.addEventListener("click", () => {
    this._changeMode();
  });

  // Toggle preview
  this.closePreviewButton.addEventListener("click", () => {
    this._togglePreview();
  });
  this.closePreviewContextmenu.addEventListener("click", () => {
    this._togglePreview();
  });

  // Context menu
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    // document content width/heidht
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    // mouse x/y
    const mouseX = e.x;
    const mouseY = e.y;
    this.contextmenu.style.display = "block";

    // contextmenu width/height
    const contextmenuWidth = this.contextmenu.offsetWidth;
    const contextmenuHeight = this.contextmenu.offsetHeight;

    let contextmenuX = mouseX;
    let contextmenuY = mouseY;

    if (mouseX + contextmenuWidth >= vw) {
      contextmenuX = vw - contextmenuWidth - 10;
    }

    if (mouseY + contextmenuHeight >= vh) {
      contextmenuY = vh - contextmenuHeight - 10;
    }

    this.contextmenu.style.top = `${contextmenuY}px`;
    this.contextmenu.style.left = `${contextmenuX}px`;
  });

  // Mouse right save
  this.contextmenuSave.addEventListener("click", () => {
    this._saveCode();
    this.saveButton.classList.remove("await");
  });

  // Mouse right clear
  this.contextmenuClear.addEventListener("click", () => {
    if (confirm("This will delete all code. Continue?")) {
      this.codeInput.value = "";
      this._updatePreview();
      this.codeInput.focus();
    }
  });

  // Mouse right change mode
  this.contextmenuMode.addEventListener("click", () => {
    this._changeMode();
  });

  document.addEventListener("click", () => {
    if (this.contextmenu.style.display === "none") return;
    this.contextmenu.style.display = "none";
  });

  document.addEventListener("mousedown", (e) => {
    if (this.contextmenu.contains(e.target)) return;
    this._hideContextMenu();
  });

  window.addEventListener(
    "scroll",
    () => {
      this._hideContextMenu();
    },
    true
  );

  window.addEventListener("beforeunload", (e) => {
    if (!this.isChanged) return;
    e.preventDefault();
    e.returnValue = "";
  });
};

MokiLiveEditor.prototype._loadData = function () {
  let srcDoc = localStorage.getItem("srcDoc");
  if (srcDoc === null) {
    srcDoc = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Say hi</title>
</head>
<body>
    <h1>Moki, Say Hi!</h1> 
</body>
</html>`;
  }
  this.codeInput.value = srcDoc;
  this.oldContent = srcDoc;
  this._updatePreview();
};

MokiLiveEditor.prototype._hideContextMenu = function () {
  if (this.contextmenu.style.display === "none") return;
  this.contextmenu.style.display = "none";
};

MokiLiveEditor.prototype._changeMode = function () {
  this.isDark = !this.isDark;
  const href = this.isDark ? this.hrefDark : this.hrefLigth;
  this.prismTheme.setAttribute("href", href);
  if (!this.isDark) {
    this.highlight.classList.remove("dark");
    this.header.classList.remove("dark");
  } else {
    this.highlight.classList.add("dark");
    this.header.classList.add("dark");
  }
};

MokiLiveEditor.prototype._togglePreview = function () {
  if (!this.isCodeFullwidth) {
    this.isCodeFullwidth = true;
    this.currentOffsetWidth = this.editor.offsetWidth;
    this.view.style.display = "none";
    this.editor.style.width = "100%";
    this.closePreviewButton.innerHTML = `<i class="ri-contract-left-line"></i>`;
    this.contentContextmenu.textContent = "Show preview";
    this.closePreviewButton.title = "Show preview";
  } else {
    this.isCodeFullwidth = false;
    this.editor.style.width = `${this.currentOffsetWidth}px`;
    this.view.style.display = "block";
    this.closePreviewButton.innerHTML = `<i class="ri-contract-right-line"></i>`;
    this.contentContextmenu.textContent = "Hide preview";
    this.closePreviewButton.title = "Hide preview";
  }
};

MokiLiveEditor.prototype._saveCode = function () {
  if (!this.isChanged) return;
  const value = this.codeInput.value;
  localStorage.setItem("srcDoc", value);
  this.isChanged = false;
};

MokiLiveEditor.prototype._updatePreview = function () {
  const value = this.codeInput.value;
  this.view.srcdoc = value;
  this.codeHighlight.textContent = value;
  Prism.highlightElement(this.codeHighlight);
  if (this.isFirst) {
    this.isFirst = false;
  } else {
    this.isChanged = true;
    this.saveButton.classList.add("await");
  }
};

const mokiLiveEditor = new MokiLiveEditor();
