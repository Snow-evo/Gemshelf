const gemGrid = document.getElementById("gem-grid");
const gemTemplate = document.getElementById("gem-template");
const listTemplate = document.getElementById("gem-list-item-template");
const gemList = document.getElementById("gem-list");
const gemForm = document.getElementById("gem-form");
const editorPanel = document.getElementById("editor-panel");
const toggleEditor = document.getElementById("toggle-editor");
const closeEditor = document.getElementById("close-editor");
const resetButton = document.getElementById("reset-button");
const currentYear = document.getElementById("current-year");
const paletteButtons = Array.from(document.querySelectorAll(".palette-swatch"));
const colorInput = document.getElementById("gem-color");

if (editorPanel.hasAttribute("hidden")) {
  editorPanel.setAttribute("aria-hidden", "true");
}

const STORAGE_KEY = "gemshelf-collection";

const createId = () =>
  (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `gem-${Math.random().toString(36).slice(2, 10)}`);

const cloneCollection = (source) => source.map((gem) => ({ ...gem }));

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

function normalizeGem(rawGem) {
  if (!rawGem) return null;
  const title = (rawGem.title || "").toString().trim();
  const url = (rawGem.url || "").toString().trim();
  if (!title || !url) {
    return null;
  }

  const description = (rawGem.description || "").toString().trim();
  const color = (rawGem.color || "").toString();
  const size = rawGem.size === "large" ? "large" : "medium";

  return {
    id: (rawGem.id || createId()).toString(),
    title,
    description,
    url,
    color: HEX_COLOR_REGEX.test(color) ? color : "#7b6cff",
    size,
  };
}

function normalizeCollection(rawCollection) {
  return rawCollection
    .map((gem) => normalizeGem(gem))
    .filter((gem) => gem !== null);
}

const defaultCollection = [
  {
    id: createId(),
    title: "魔法工房ブログ",
    description: "制作記録や学びの呟き",
    url: "https://example.com/blog",
    color: "#7b6cff",
    size: "medium",
  },
  {
    id: createId(),
    title: "星霜のシンセ",
    description: "幻想的なシンセポップ楽曲",
    url: "https://example.com/music",
    color: "#ff8adc",
    size: "large",
  },
  {
    id: createId(),
    title: "ポートフォリオ",
    description: "これまでの作品ギャラリー",
    url: "https://example.com/portfolio",
    color: "#00d1ff",
    size: "medium",
  },
  {
    id: createId(),
    title: "インディーゲーム",
    description: "ドット絵の魔法冒険譚",
    url: "https://example.com/game",
    color: "#ffe066",
    size: "medium",
  },
];

function loadCollection() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return cloneCollection(defaultCollection);
  }

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      const normalized = normalizeCollection(parsed);
      return normalized.length ? normalized : cloneCollection(defaultCollection);
    }
  } catch (error) {
    console.warn("Failed to parse stored collection", error);
  }
  return cloneCollection(defaultCollection);
}

function persistCollection(collection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

function setGemColors(element, color) {
  element.style.setProperty("--gem-color", color);
  element.querySelector(".gem-glow").style.background = `radial-gradient(circle at 30% 30%, ${color}90, transparent 70%)`;
  element.querySelector(".gem-core").style.background = `linear-gradient(135deg, ${color}, ${shadeColor(color, -20)})`;
}

function highlightPalette(color) {
  const normalized = color.toLowerCase();
  paletteButtons.forEach((button) => {
    const isActive = button.dataset.color.toLowerCase() === normalized;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function shadeColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const r = (num >> 16) + percent;
  const g = ((num >> 8) & 0x00ff) + percent;
  const b = (num & 0x0000ff) + percent;
  const clamp = (value) => Math.max(Math.min(value, 255), 0);
  const newColor = (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
  return `#${newColor.toString(16).padStart(6, "0")}`;
}

function renderGem(gem) {
  const fragment = gemTemplate.content.cloneNode(true);
  const anchor = fragment.querySelector(".gem");
  anchor.href = gem.url;
  anchor.setAttribute("role", "listitem");
  anchor.setAttribute(
    "aria-label",
    gem.description ? `${gem.title} — ${gem.description}` : gem.title
  );
  anchor.dataset.id = gem.id;
  if (gem.size === "large") {
    anchor.classList.add("large");
  }

  anchor.querySelector(".gem-title").textContent = gem.title;
  const descriptionEl = anchor.querySelector(".gem-description");
  if (gem.description) {
    descriptionEl.textContent = gem.description;
    descriptionEl.hidden = false;
  } else {
    descriptionEl.textContent = "";
    descriptionEl.hidden = true;
  }

  setGemColors(anchor, gem.color);

  return fragment;
}

function renderListItem(gem) {
  const fragment = listTemplate.content.cloneNode(true);
  const item = fragment.querySelector(".gem-list-item");
  item.dataset.id = gem.id;
  const color = fragment.querySelector(".gem-list-color");
  color.style.background = gem.color;
  fragment.querySelector(".gem-list-text").textContent = `${gem.title} — ${gem.description || gem.url}`;
  return fragment;
}

function renderCollection(collection) {
  gemGrid.innerHTML = "";
  gemList.innerHTML = "";

  for (const gem of collection) {
    gemGrid.appendChild(renderGem(gem));
    gemList.appendChild(renderListItem(gem));
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(gemForm);
  const title = (formData.get("title") || "").toString().trim();
  const description = (formData.get("description") || "").toString().trim();
  const url = (formData.get("url") || "").toString().trim();
  const color = (formData.get("color") || colorInput.value).toString();
  const size = (formData.get("size") || "medium").toString();
  const gem = {
    id: createId(),
    title,
    description,
    url,
    color,
    size,
  };

  if (!title || !url) {
    return;
  }

  collection.push(gem);
  persistCollection(collection);
  renderCollection(collection);
  gemForm.reset();
  colorInput.value = "#7b6cff";
  highlightPalette(colorInput.value);
}

function handleDelete(event) {
  const button = event.target.closest("button[data-action='delete']");
  if (!button) return;
  const item = button.closest(".gem-list-item");
  const id = item?.dataset.id;
  if (!id) return;

  const index = collection.findIndex((gem) => gem.id === id);
  if (index > -1) {
    collection.splice(index, 1);
    persistCollection(collection);
    renderCollection(collection);
  }
}

function resetCollection() {
  collection = cloneCollection(defaultCollection);
  persistCollection(collection);
  renderCollection(collection);
  colorInput.value = "#7b6cff";
  highlightPalette(colorInput.value);
}

function toggleEditorPanel(forceState) {
  const isOpen = forceState ?? editorPanel.hasAttribute("hidden");
  if (isOpen) {
    editorPanel.removeAttribute("hidden");
    editorPanel.setAttribute("aria-hidden", "false");
  } else {
    editorPanel.setAttribute("hidden", "");
    editorPanel.setAttribute("aria-hidden", "true");
  }
  toggleEditor.setAttribute("aria-expanded", String(isOpen));
  toggleEditor.textContent = isOpen ? "編集パネルを閉じる" : "コレクションを編集する";
}

function setupPalette() {
  paletteButtons.forEach((button) => {
    const color = button.dataset.color;
    button.style.color = color;
    button.addEventListener("click", () => {
      colorInput.value = color;
      colorInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  highlightPalette(colorInput.value);
}

function syncCurrentYear() {
  const year = new Date().getFullYear();
  currentYear.textContent = year;
}

let collection = loadCollection();
renderCollection(collection);
syncCurrentYear();
setupPalette();

const editorMediaQuery = window.matchMedia("(max-width: 960px)");

function applyEditorResponsiveVisibility() {
  if (editorMediaQuery.matches) {
    toggleEditorPanel(false);
  } else {
    toggleEditorPanel(true);
  }
}

applyEditorResponsiveVisibility();

if (typeof editorMediaQuery.addEventListener === "function") {
  editorMediaQuery.addEventListener("change", applyEditorResponsiveVisibility);
} else {
  editorMediaQuery.addListener(applyEditorResponsiveVisibility);
}

colorInput.addEventListener("input", (event) => {
  const color = event.target.value;
  gemForm.elements.color.value = color;
  highlightPalette(color);
});

gemForm.addEventListener("submit", handleFormSubmit);

toggleEditor.addEventListener("click", () => toggleEditorPanel());
closeEditor.addEventListener("click", () => toggleEditorPanel(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !editorPanel.hasAttribute("hidden")) {
    toggleEditorPanel(false);
  }
});

resetButton.addEventListener("click", () => {
  if (confirm("初期コレクションに戻しますか？")) {
    resetCollection();
  }
});

gemList.addEventListener("click", handleDelete);

window.addEventListener("beforeunload", () => {
  persistCollection(collection);
});
