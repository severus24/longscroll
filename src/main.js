import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { toJpeg, toPng } from "html-to-image";
import {
  Bold,
  Check,
  ChevronDown,
  Code2,
  Copy,
  createIcons,
  Download,
  Eye,
  FileText,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Maximize2,
  Minus,
  Monitor,
  PencilLine,
  Plus,
  Quote,
  RotateCcw,
  SeparatorHorizontal,
  Smartphone,
  Trash2,
  Upload
} from "lucide";
import { sample } from "./sample.js";
import "./style.css";
import "./article.css";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false
});

const STORAGE_KEY = "longshot-workspace-v1";
const SAMPLE_VERSION = 2;
const DEFAULT_EDITOR_WIDTH = 600;
const MIN_EDITOR_WIDTH = 420;
const MIN_PREVIEW_WIDTH = 360;
const SPLITTER_WIDTH = 9;
const themes = new Set(["dark", "light", "paper", "blue"]);
const modes = new Set(["device", "fixed"]);
const formats = new Set(["png", "jpg"]);

function readSavedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

const saved = readSavedState();
const shouldUseSample =
  typeof saved.markdown !== "string" ||
  (
    !saved.sampleVersion &&
    saved.markdown.startsWith("# 爱情博物馆：三十年后的我们") &&
    saved.markdown.includes("| 目的地 | 爱情博物馆 |")
  );
const state = {
  markdown: shouldUseSample ? sample : saved.markdown,
  sampleVersion: SAMPLE_VERSION,
  theme: themes.has(saved.theme) ? saved.theme : "dark",
  mode: modes.has(saved.mode) ? saved.mode : "device",
  format: formats.has(saved.format) ? saved.format : "png",
  fontSize: clamp(Number(saved.fontSize) || 16, 13, 22),
  lineHeight: clamp(Number(saved.lineHeight) || 1.75, 1.35, 2.1),
  paragraphGap: clamp(Number(saved.paragraphGap) || 22, 8, 40),
  zoom: clamp(Number(saved.zoom) || 1, 0.5, 1.2),
  editorWidth: clamp(
    Number(saved.editorWidth) || DEFAULT_EDITOR_WIDTH,
    MIN_EDITOR_WIDTH,
    maxEditorWidth()
  ),
  mobileView: "preview"
};

const icons = {
  Bold,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Eye,
  FileText,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Maximize2,
  Minus,
  Monitor,
  PencilLine,
  Plus,
  Quote,
  RotateCcw,
  SeparatorHorizontal,
  Smartphone,
  Trash2,
  Upload
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function maxEditorWidth() {
  return Math.max(
    MIN_EDITOR_WIDTH,
    window.innerWidth - MIN_PREVIEW_WIDTH - SPLITTER_WIDTH
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripInlineMarkdown(value) {
  return String(value)
    .replace(/!\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_~`>#]/g, "")
    .trim();
}

function documentTitle() {
  const heading = state.markdown.match(/^#\s+(.+)$/m);
  return heading ? stripInlineMarkdown(heading[1]) || "未命名长图" : "未命名长图";
}

function safeFilename() {
  return documentTitle().replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
}

function hydrateIcons() {
  createIcons({
    icons,
    attrs: {
      "stroke-width": 1.8,
      "aria-hidden": "true"
    }
  });
}

const app = $("#app");
app.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-block" aria-label="长卷 Markdown 长图编辑器">
        <div class="brand-mark" aria-hidden="true"><span>卷</span></div>
        <div class="brand-copy">
          <strong>长卷</strong>
          <span>LONGSCROLL</span>
        </div>
        <span class="brand-tagline">把 Markdown，铺成一张长图</span>
      </div>

      <div class="header-document">
        <span class="document-title" id="documentTitle">未命名长图</span>
        <span class="save-state" id="saveState"><i></i><span id="saveText">已保存</span></span>
      </div>

      <div class="header-actions">
        <button class="button button-secondary reset-button" id="resetBtn" type="button" title="恢复示例内容">
          <i data-lucide="rotate-ccw"></i>
          <span>重置</span>
        </button>
        <button class="button button-primary" id="exportBtn" type="button">
          <i data-lucide="download"></i>
          <span>导出长图</span>
        </button>
      </div>
    </header>

    <nav class="mobile-tabs" aria-label="工作区切换">
      <button class="mobile-tab active" data-mobile-view="preview" type="button">
        <i data-lucide="eye"></i><span>预览</span>
      </button>
      <button class="mobile-tab" data-mobile-view="editor" type="button">
        <i data-lucide="pencil-line"></i><span>编辑</span>
      </button>
    </nav>

    <main
      class="studio"
      id="studio"
      data-mobile-view="preview"
      style="--editor-width: ${state.editorWidth}px"
    >
      <section class="preview-workspace" data-panel="preview" aria-label="手机阅读预览">
        <header class="workspace-header preview-header">
          <div class="workspace-title">
            <div>
              <span class="eyebrow">PREVIEW</span>
              <h1>手机阅读预览</h1>
              <div class="preview-output-facts" aria-label="长图输出尺寸">
                <span>输出宽度 <strong>1206 px</strong></span>
                <i aria-hidden="true"></i>
                <span>高度 <strong>自适应</strong></span>
              </div>
            </div>
          </div>

          <div class="preview-actions">
            <div class="segmented mode-switch" id="modeSwitch" aria-label="渲染模式">
              <button class="active" data-mode="device" type="button">
                <i data-lucide="smartphone"></i><span>iPhone</span>
              </button>
              <button data-mode="fixed" type="button">
                <i data-lucide="monitor"></i><span>固定</span>
              </button>
            </div>

            <div class="zoom-control" aria-label="预览缩放">
              <button id="zoomOutBtn" type="button" title="缩小预览"><i data-lucide="minus"></i></button>
              <span id="zoomValue">100%</span>
              <button id="zoomInBtn" type="button" title="放大预览"><i data-lucide="plus"></i></button>
              <button id="fitBtn" type="button" title="适应窗口"><i data-lucide="maximize-2"></i></button>
            </div>
          </div>
        </header>

        <div class="preview-stage" id="previewScroller">
          <div class="preview-artboard">
            <div class="preview-caption" id="previewCaption">
              <span class="live-state"><i></i> 实时排版</span>
              <span id="previewMeta">402 px · 正在计算高度</span>
            </div>

            <div class="phone-scale" id="phoneScale">
              <div class="phone-device" id="previewDevice">
                <div class="phone-button phone-button-left" aria-hidden="true"></div>
                <div class="phone-button phone-button-right" aria-hidden="true"></div>
                <div class="phone-screen theme-dark" id="previewPage">
                  <article class="article-content" id="previewContent"></article>
                  <div class="phone-home" aria-hidden="true"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        class="panel-splitter"
        id="panelSplitter"
        role="separator"
        aria-label="调整预览和编辑区域宽度"
        aria-orientation="vertical"
        aria-valuemin="${MIN_EDITOR_WIDTH}"
        aria-valuemax="${maxEditorWidth()}"
        aria-valuenow="${state.editorWidth}"
        tabindex="0"
        title="拖动调整左右宽度，双击恢复默认"
      >
        <span class="splitter-grip" aria-hidden="true"></span>
      </div>

      <section class="editor-workspace" data-panel="editor" aria-label="Markdown 编辑器">
        <header class="workspace-header editor-header">
          <div class="workspace-title">
            <div>
              <span class="eyebrow">CONTENT</span>
              <h1>Markdown 编辑</h1>
            </div>
          </div>

          <div class="editor-file-actions">
            <label class="icon-action" for="fileInput" title="导入 Markdown 文件">
              <i data-lucide="upload"></i>
              <span class="sr-only">导入 Markdown 文件</span>
            </label>
            <input id="fileInput" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden />
            <label class="icon-action" for="imageInput" title="插入本地图片">
              <i data-lucide="image-plus"></i>
              <span class="sr-only">插入本地图片</span>
            </label>
            <input id="imageInput" type="file" accept="image/*" multiple hidden />
            <button class="icon-action" id="copyBtn" type="button" title="复制 Markdown">
              <i data-lucide="copy"></i>
              <span class="sr-only">复制 Markdown</span>
            </button>
            <button class="icon-action" id="clearBtn" type="button" title="清空内容">
              <i data-lucide="trash-2"></i>
              <span class="sr-only">清空 Markdown 内容</span>
            </button>
          </div>
        </header>

        <div class="format-toolbar" aria-label="Markdown 格式工具">
          <div class="format-buttons">
            <button data-format="heading" type="button" title="二级标题"><i data-lucide="heading-2"></i></button>
            <button data-format="bold" type="button" title="粗体"><i data-lucide="bold"></i></button>
            <button data-format="italic" type="button" title="斜体"><i data-lucide="italic"></i></button>
            <button data-format="quote" type="button" title="引用"><i data-lucide="quote"></i></button>
            <button data-format="unordered-list" type="button" title="无序列表"><i data-lucide="list"></i></button>
            <button data-format="ordered-list" type="button" title="有序列表"><i data-lucide="list-ordered"></i></button>
            <button data-format="link" type="button" title="链接"><i data-lucide="link-2"></i></button>
            <button data-format="code" type="button" title="行内代码"><i data-lucide="code-2"></i></button>
            <button data-format="divider" type="button" title="分隔线"><i data-lucide="separator-horizontal"></i></button>
          </div>
          <span class="character-count" id="wordCount">0 字符</span>
        </div>

        <div class="editor-surface">
          <textarea
            id="editor"
            spellcheck="false"
            aria-label="Markdown 编辑器"
            placeholder="在这里输入 Markdown..."
          ></textarea>
        </div>

        <section class="settings-panel" aria-labelledby="settingsTitle">
          <div class="settings-heading">
            <div>
              <span class="eyebrow">APPEARANCE</span>
              <h2 id="settingsTitle">排版与导出</h2>
            </div>
            <button class="settings-toggle" id="settingsToggle" type="button" aria-expanded="true" title="展开或收起设置">
              <i data-lucide="chevron-down"></i>
            </button>
          </div>

          <div class="settings-content" id="settingsContent">
            <div class="setting-block theme-block">
              <span class="setting-label">阅读主题</span>
              <div class="theme-options">
                <button class="theme-option selected" data-theme="dark" type="button">
                  <i class="swatch swatch-dark"></i><span>暗色</span>
                </button>
                <button class="theme-option" data-theme="light" type="button">
                  <i class="swatch swatch-light"></i><span>白纸</span>
                </button>
                <button class="theme-option" data-theme="paper" type="button">
                  <i class="swatch swatch-paper"></i><span>纸张</span>
                </button>
                <button class="theme-option" data-theme="blue" type="button">
                  <i class="swatch swatch-blue"></i><span>知识</span>
                </button>
              </div>
            </div>

            <div class="type-controls">
              <label class="range-control" for="fontSize">
                <span><span>字号</span><output id="fontSizeValue">16 px</output></span>
                <input id="fontSize" type="range" min="13" max="22" step="1" />
              </label>
              <label class="range-control" for="lineHeight">
                <span><span>行高</span><output id="lineHeightValue">1.75</output></span>
                <input id="lineHeight" type="range" min="1.35" max="2.1" step="0.05" />
              </label>
              <label class="range-control" for="paragraphGap">
                <span><span>段距</span><output id="paragraphGapValue">22 px</output></span>
                <input id="paragraphGap" type="range" min="8" max="40" step="1" />
              </label>
            </div>

            <div class="export-settings-row">
              <div class="format-setting">
                <span class="setting-label">图片格式</span>
                <div class="segmented format-switch" id="formatSwitch">
                  <button class="active" data-format="png" type="button">PNG</button>
                  <button data-format="jpg" type="button">JPEG</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>

    <div class="drop-overlay" id="dropOverlay" aria-hidden="true">
      <div class="drop-target">
        <i data-lucide="upload"></i>
        <strong>松开以导入</strong>
        <span>Markdown 或图片</span>
      </div>
    </div>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
  </div>
`;

hydrateIcons();

const editor = $("#editor");
const previewContent = $("#previewContent");
const previewPage = $("#previewPage");
const previewDevice = $("#previewDevice");
const phoneScale = $("#phoneScale");
const previewScroller = $("#previewScroller");
const saveState = $("#saveState");
const saveText = $("#saveText");
const exportButton = $("#exportBtn");
const toastElement = $("#toast");

editor.value = state.markdown;

let renderFrame = 0;
let saveTimer = 0;
let toastTimer = 0;
let isDropActive = false;

function setSaveStatus(status) {
  saveState.classList.toggle("saving", status === "saving");
  saveState.classList.toggle("error", status === "error");
  saveText.textContent = status === "saving" ? "正在保存" : status === "error" ? "保存失败" : "已保存";
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      markdown: state.markdown,
      sampleVersion: state.sampleVersion,
      theme: state.theme,
      mode: state.mode,
      format: state.format,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      paragraphGap: state.paragraphGap,
      zoom: state.zoom,
      editorWidth: state.editorWidth
    }));
    setSaveStatus("saved");
  } catch {
    setSaveStatus("error");
  }
}

function schedulePersist() {
  setSaveStatus("saving");
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(persistState, 260);
}

function syncControls() {
  $("#documentTitle").textContent = documentTitle();
  $("#wordCount").textContent = `${state.markdown.replace(/\s/g, "").length.toLocaleString()} 字符`;
  $("#zoomValue").textContent = `${Math.round(state.zoom * 100)}%`;
  $("#fontSize").value = state.fontSize;
  $("#lineHeight").value = state.lineHeight;
  $("#paragraphGap").value = state.paragraphGap;
  $("#fontSizeValue").textContent = `${state.fontSize} px`;
  $("#lineHeightValue").textContent = Number(state.lineHeight).toFixed(2);
  $("#paragraphGapValue").textContent = `${state.paragraphGap} px`;
  $("#clearBtn").disabled = !state.markdown.trim();

  $$("#modeSwitch button").forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  $$("#formatSwitch button").forEach((button) => {
    const active = button.dataset.format === state.format;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  $$(".theme-option").forEach((button) => {
    const active = button.dataset.theme === state.theme;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function applyEditorWidth(value, persist = false) {
  state.editorWidth = Math.round(
    clamp(Number(value) || DEFAULT_EDITOR_WIDTH, MIN_EDITOR_WIDTH, maxEditorWidth())
  );
  $("#studio").style.setProperty("--editor-width", `${state.editorWidth}px`);

  const splitter = $("#panelSplitter");
  if (splitter) {
    splitter.setAttribute("aria-valuemax", String(Math.round(maxEditorWidth())));
    splitter.setAttribute("aria-valuenow", String(state.editorWidth));
    splitter.setAttribute("aria-valuetext", `编辑区 ${state.editorWidth} 像素`);
  }

  if (persist) schedulePersist();
  updatePreviewMetrics();
}

function updateScale() {
  const displayZoom = window.innerWidth <= 860
    ? Math.min(state.zoom, clamp((previewScroller.clientWidth - 24) / 418, 0.5, 1))
    : state.zoom;
  const deviceWidth = 418;
  const deviceHeight = previewDevice.offsetHeight;
  phoneScale.style.width = `${Math.round(deviceWidth * displayZoom)}px`;
  phoneScale.style.height = `${Math.round(deviceHeight * displayZoom)}px`;
  previewDevice.style.transform = `scale(${displayZoom})`;
  $("#previewCaption").style.width = `${Math.round(deviceWidth * displayZoom)}px`;
  $("#zoomValue").textContent = `${Math.round(displayZoom * 100)}%`;
}

function updatePreviewMetrics() {
  requestAnimationFrame(() => {
    updateScale();
    const articleHeight = Math.max(0, previewPage.scrollHeight);
    $("#previewMeta").textContent = `402 px · ${articleHeight.toLocaleString()} px`;
  });
}

function renderContent() {
  renderFrame = 0;
  const raw = md.render(state.markdown);
  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"]
  });

  previewContent.innerHTML = clean || '<p class="empty-preview">开始输入 Markdown</p>';
  $$("a", previewContent).forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noreferrer noopener");
  });

  previewPage.className = `phone-screen theme-${state.theme}`;
  previewPage.style.setProperty("--font-size", `${state.fontSize}px`);
  previewPage.style.setProperty("--line-height", state.lineHeight);
  previewPage.style.setProperty("--paragraph-gap", `${state.paragraphGap}px`);

  syncControls();
  updatePreviewMetrics();
  schedulePersist();
}

function render() {
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(renderContent);
}

function toast(message, type = "default") {
  toastElement.textContent = message;
  toastElement.dataset.type = type;
  toastElement.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastElement.classList.remove("show"), 2600);
}

function replaceSelection(insert, selectFrom = insert.length, selectTo = insert.length) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  editor.setRangeText(insert, start, end, "end");
  editor.selectionStart = start + selectFrom;
  editor.selectionEnd = start + selectTo;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  editor.focus();
}

function wrapSelection(prefix, suffix, placeholder) {
  const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd) || placeholder;
  replaceSelection(`${prefix}${selected}${suffix}`, prefix.length, prefix.length + selected.length);
}

function prefixSelectedLines(prefix) {
  const value = editor.value;
  const selectionStart = editor.selectionStart;
  const selectionEnd = editor.selectionEnd;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const nextBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const selected = value.slice(lineStart, lineEnd);
  const replacement = selected
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");

  editor.setRangeText(replacement, lineStart, lineEnd, "end");
  editor.selectionStart = lineStart;
  editor.selectionEnd = lineStart + replacement.length;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  editor.focus();
}

function applyFormat(format) {
  switch (format) {
    case "heading":
      prefixSelectedLines("## ");
      break;
    case "bold":
      wrapSelection("**", "**", "粗体文字");
      break;
    case "italic":
      wrapSelection("*", "*", "斜体文字");
      break;
    case "quote":
      prefixSelectedLines("> ");
      break;
    case "unordered-list":
      prefixSelectedLines("- ");
      break;
    case "ordered-list":
      prefixSelectedLines("1. ");
      break;
    case "link": {
      const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd) || "链接文字";
      replaceSelection(`[${selected}](https://)`, selected.length + 3, selected.length + 11);
      break;
    }
    case "code": {
      const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd);
      if (selected.includes("\n")) {
        replaceSelection(`\n\`\`\`\n${selected}\n\`\`\`\n`);
      } else {
        wrapSelection("`", "`", "代码");
      }
      break;
    }
    case "divider":
      replaceSelection("\n\n---\n\n");
      break;
  }
}

function insertMarkdownAtCursor(text) {
  const before = editor.value.slice(0, editor.selectionStart);
  const after = editor.value.slice(editor.selectionEnd);
  const leading = before && !before.endsWith("\n\n") ? "\n\n" : "";
  const trailing = after && !after.startsWith("\n\n") ? "\n\n" : "";
  replaceSelection(`${leading}${text}${trailing}`);
}

function setMobileView(view) {
  state.mobileView = view;
  $("#studio").dataset.mobileView = view;
  $$(".mobile-tab").forEach((button) => {
    const active = button.dataset.mobileView === view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  if (view === "preview") updatePreviewMetrics();
}

function fitPreview() {
  const available = Math.max(240, previewScroller.clientWidth - 54);
  state.zoom = clamp(available / 430, 0.5, 1);
  updateScale();
  schedulePersist();
}

function setZoom(next) {
  state.zoom = clamp(Math.round(next * 10) / 10, 0.5, 1.2);
  updateScale();
  schedulePersist();
}

async function readMarkdownFile(file) {
  const text = await file.text();
  editor.value = text;
  state.markdown = text;
  render();
  setMobileView("editor");
  toast(`已导入 ${file.name}`, "success");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

async function insertImageFiles(files) {
  const images = [...files].filter((file) => file.type.startsWith("image/"));
  if (!images.length) return;

  const snippets = [];
  for (const file of images) {
    if (file.size > 8 * 1024 * 1024) {
      toast(`${file.name} 超过 8 MB，已跳过`, "error");
      continue;
    }
    const dataUrl = await fileToDataUrl(file);
    const alt = file.name.replace(/\.[^.]+$/, "") || "图片";
    snippets.push(`![${alt}](${dataUrl})`);
  }

  if (snippets.length) {
    insertMarkdownAtCursor(snippets.join("\n\n"));
    toast(`已插入 ${snippets.length} 张图片`, "success");
  }
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFilename()}.${state.format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function waitForPageImages(page) {
  const images = [...page.querySelectorAll("img")];
  await Promise.all(images.map((image) => {
    if (image.complete) return image.decode().catch(() => null);
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  }));
}

async function exportInBrowser() {
  const exportPage = document.createElement("div");
  const content = DOMPurify.sanitize(md.render(state.markdown), {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"]
  });

  exportPage.className = `article client-export-page theme-${state.theme}`;
  exportPage.style.setProperty("--font-size", `${state.fontSize}px`);
  exportPage.style.setProperty("--line-height", state.lineHeight);
  exportPage.style.setProperty("--paragraph-gap", `${state.paragraphGap}px`);
  exportPage.innerHTML = content || '<p class="empty-preview">开始输入 Markdown</p>';
  document.body.appendChild(exportPage);

  try {
    await document.fonts?.ready;
    await waitForPageImages(exportPage);
    const width = 402;
    const height = Math.max(1, exportPage.scrollHeight);
    const options = {
      width,
      height,
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: getComputedStyle(exportPage).backgroundColor,
      skipAutoScale: true,
      style: {
        position: "fixed",
        top: "0",
        left: "0",
        zIndex: "1",
        opacity: "1"
      }
    };
    const dataUrl = state.format === "jpg"
      ? await toJpeg(exportPage, { ...options, quality: 0.92 })
      : await toPng(exportPage, options);
    const blob = await (await fetch(dataUrl)).blob();
    downloadBlob(blob);
  } finally {
    exportPage.remove();
  }
}

editor.addEventListener("input", () => {
  state.markdown = editor.value;
  render();
});

editor.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    replaceSelection("  ");
    return;
  }

  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();
  if (key === "b") {
    event.preventDefault();
    applyFormat("bold");
  } else if (key === "i") {
    event.preventDefault();
    applyFormat("italic");
  } else if (key === "k") {
    event.preventDefault();
    applyFormat("link");
  } else if (key === "s") {
    event.preventDefault();
    clearTimeout(saveTimer);
    persistState();
    toast("已保存到本地", "success");
  }
});

editor.addEventListener("paste", async (event) => {
  const images = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith("image/"));
  if (!images.length) return;
  event.preventDefault();
  await insertImageFiles(images);
});

$$("[data-format]").forEach((button) => {
  button.addEventListener("click", () => applyFormat(button.dataset.format));
});

$("#fileInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (file) await readMarkdownFile(file);
  event.target.value = "";
});

$("#imageInput").addEventListener("change", async (event) => {
  await insertImageFiles(event.target.files || []);
  event.target.value = "";
});

$("#copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(state.markdown);
    toast("Markdown 已复制", "success");
  } catch {
    toast("无法访问剪贴板", "error");
  }
});

$("#clearBtn").addEventListener("click", () => {
  if (!state.markdown.trim()) return;
  if (!window.confirm("清空当前 Markdown 内容？此操作无法撤销。")) return;
  editor.value = "";
  state.markdown = "";
  render();
  editor.focus();
  toast("内容已清空", "success");
});

$("#resetBtn").addEventListener("click", () => {
  if (!window.confirm("恢复示例内容？当前编辑内容会被替换。")) return;
  editor.value = sample;
  state.markdown = sample;
  render();
  toast("已恢复示例内容", "success");
});

$("#modeSwitch").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mode]");
  if (!button) return;
  state.mode = button.dataset.mode;
  syncControls();
  schedulePersist();
});

$("#formatSwitch").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-format]");
  if (!button) return;
  state.format = button.dataset.format;
  syncControls();
  schedulePersist();
});

$$(".theme-option").forEach((button) => {
  button.addEventListener("click", () => {
    state.theme = button.dataset.theme;
    previewPage.className = `phone-screen theme-${state.theme}`;
    syncControls();
    schedulePersist();
  });
});

[
  ["fontSize", "fontSize"],
  ["lineHeight", "lineHeight"],
  ["paragraphGap", "paragraphGap"]
].forEach(([id, key]) => {
  $(`#${id}`).addEventListener("input", (event) => {
    state[key] = Number(event.target.value);
    previewPage.style.setProperty(
      id === "fontSize" ? "--font-size" : id === "lineHeight" ? "--line-height" : "--paragraph-gap",
      id === "fontSize" || id === "paragraphGap" ? `${state[key]}px` : state[key]
    );
    syncControls();
    updatePreviewMetrics();
    schedulePersist();
  });
});

$("#zoomOutBtn").addEventListener("click", () => setZoom(state.zoom - 0.1));
$("#zoomInBtn").addEventListener("click", () => setZoom(state.zoom + 0.1));
$("#fitBtn").addEventListener("click", fitPreview);

$$(".mobile-tab").forEach((button) => {
  button.addEventListener("click", () => setMobileView(button.dataset.mobileView));
});

$("#settingsToggle").addEventListener("click", () => {
  const content = $("#settingsContent");
  const expanded = content.hidden;
  content.hidden = !expanded;
  $("#settingsToggle").setAttribute("aria-expanded", String(expanded));
  $("#settingsToggle").classList.toggle("collapsed", !expanded);
});

const panelSplitter = $("#panelSplitter");
let splitterDrag = null;

panelSplitter.addEventListener("pointerdown", (event) => {
  if (window.innerWidth <= 860) return;
  splitterDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startWidth: $(".editor-workspace").getBoundingClientRect().width
  };
  panelSplitter.setPointerCapture(event.pointerId);
  document.body.classList.add("is-resizing");
  event.preventDefault();
});

panelSplitter.addEventListener("pointermove", (event) => {
  if (!splitterDrag || splitterDrag.pointerId !== event.pointerId) return;
  const delta = event.clientX - splitterDrag.startX;
  applyEditorWidth(splitterDrag.startWidth - delta);
});

function endSplitterDrag(event) {
  if (!splitterDrag || splitterDrag.pointerId !== event.pointerId) return;
  splitterDrag = null;
  document.body.classList.remove("is-resizing");
  persistState();
}

panelSplitter.addEventListener("pointerup", endSplitterDrag);
panelSplitter.addEventListener("pointercancel", endSplitterDrag);

panelSplitter.addEventListener("dblclick", () => {
  applyEditorWidth(DEFAULT_EDITOR_WIDTH, true);
});

panelSplitter.addEventListener("keydown", (event) => {
  const step = event.shiftKey ? 72 : 24;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    applyEditorWidth(state.editorWidth + step, true);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    applyEditorWidth(state.editorWidth - step, true);
  } else if (event.key === "Home") {
    event.preventDefault();
    applyEditorWidth(MIN_EDITOR_WIDTH, true);
  } else if (event.key === "End") {
    event.preventDefault();
    applyEditorWidth(maxEditorWidth(), true);
  }
});

let dragDepth = 0;
window.addEventListener("dragenter", (event) => {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  dragDepth += 1;
  isDropActive = true;
  $("#dropOverlay").classList.add("visible");
  $("#dropOverlay").setAttribute("aria-hidden", "false");
});

window.addEventListener("dragover", (event) => {
  if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
});

window.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) {
    isDropActive = false;
    $("#dropOverlay").classList.remove("visible");
    $("#dropOverlay").setAttribute("aria-hidden", "true");
  }
});

window.addEventListener("drop", async (event) => {
  event.preventDefault();
  dragDepth = 0;
  isDropActive = false;
  $("#dropOverlay").classList.remove("visible");
  $("#dropOverlay").setAttribute("aria-hidden", "true");

  const files = [...(event.dataTransfer?.files || [])];
  if (!files.length) return;
  const markdownFile = files.find((file) => /\.(md|markdown|txt)$/i.test(file.name));
  if (markdownFile) {
    await readMarkdownFile(markdownFile);
    return;
  }
  await insertImageFiles(files);
});

$("#exportBtn").addEventListener("click", async () => {
  if (!state.markdown.trim()) {
    toast("请先输入内容", "error");
    return;
  }

  exportButton.disabled = true;
  exportButton.innerHTML = '<i data-lucide="loader-circle"></i><span>正在生成</span>';
  hydrateIcons();
  exportButton.classList.add("loading");

  try {
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: state.markdown,
          title: documentTitle(),
          theme: state.theme,
          fontSize: state.fontSize,
          lineHeight: state.lineHeight,
          paragraphGap: state.paragraphGap,
          mode: state.mode,
          format: state.format
        })
      });

      if (!response.ok) throw new Error("本地导出服务不可用");
      downloadBlob(await response.blob());
    } catch {
      await exportInBrowser();
    }

    toast("长图已生成", "success");
  } catch (error) {
    toast(error.message || "导出失败", "error");
  } finally {
    exportButton.disabled = false;
    exportButton.classList.remove("loading");
    exportButton.innerHTML = '<i data-lucide="download"></i><span>导出长图</span>';
    hydrateIcons();
  }
});

const resizeObserver = new ResizeObserver(() => updatePreviewMetrics());
resizeObserver.observe(previewPage);
resizeObserver.observe(previewContent);

window.addEventListener("resize", () => {
  applyEditorWidth(state.editorWidth);
  updatePreviewMetrics();
});

applyEditorWidth(state.editorWidth);
renderContent();
setSaveStatus("saved");
