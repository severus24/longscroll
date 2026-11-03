import express from "express";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { chromium } from "playwright";
import sharp from "sharp";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const articleCss = readFileSync(path.join(rootDir, "src/article.css"), "utf8");
const app = express();
const PORT = Number(process.env.LONGSHOT_API_PORT) || 4174;

app.use(express.json({ limit: "60mb" }));

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false
});

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "del",
  "details",
  "summary"
]);

const allowedAttributes = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  code: ["class"],
  th: ["colspan", "rowspan", "align"],
  td: ["colspan", "rowspan", "align"]
};

const palettes = {
  dark: {
    bg: "#191b1d",
    fg: "#f3f4f6",
    muted: "#959ba7",
    accent: "#759df1",
    border: "#30343a",
    quote: "#22262c"
  },
  light: {
    bg: "#ffffff",
    fg: "#1d2024",
    muted: "#747b85",
    accent: "#2d61bd",
    border: "#e2e5e8",
    quote: "#f3f5f7"
  },
  paper: {
    bg: "#f3eee4",
    fg: "#2f2b25",
    muted: "#7d7467",
    accent: "#7b5b3d",
    border: "#dbd1c2",
    quote: "#e8dfd1"
  },
  blue: {
    bg: "#f5f8ff",
    fg: "#1d2940",
    muted: "#71809a",
    accent: "#245eca",
    border: "#d9e3f5",
    quote: "#e9f0fc"
  }
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildDocument({
  markdown,
  title,
  theme = "dark",
  fontSize = 16,
  lineHeight = 1.75,
  paragraphGap = 22
}) {
  const rendered = md.render(String(markdown || ""));
  const content = sanitizeHtml(rendered, {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ["http", "https", "mailto", "data"],
    disallowedTagsMode: "discard"
  });
  const palette = palettes[theme] || palettes.dark;
  const safeTitle = escapeHtml(title || "未命名长图");
  const size = clamp(Number(fontSize) || 16, 13, 22);
  const leading = clamp(Number(lineHeight) || 1.75, 1.35, 2.1);
  const gap = clamp(Number(paragraphGap) || 22, 8, 40);

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <title>${safeTitle}</title>
    <style>
      *{box-sizing:border-box}
      :root{
        --bg:${palette.bg};
        --fg:${palette.fg};
        --muted:${palette.muted};
        --accent:${palette.accent};
        --border:${palette.border};
        --quote:${palette.quote};
        --font-size:${size}px;
        --line-height:${leading};
        --paragraph-gap:${gap}px;
      }
      html,body{margin:0;padding:0;width:100%;background:var(--bg);color:var(--fg);-webkit-text-size-adjust:100%}
      body{width:402px;overflow-x:hidden}
      .article{width:402px;min-height:100vh;margin:0 auto;padding:32px 20px 64px}
      ${articleCss}
    </style>
  </head>
  <body>
    <main class="article">${content}</main>
  </body>
</html>`;
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/export", async (request, response) => {
  let browser;

  try {
    const {
      markdown = "",
      title = "未命名长图",
      theme = "dark",
      fontSize = 16,
      lineHeight = 1.75,
      paragraphGap = 22,
      mode = "device",
      format = "png"
    } = request.body || {};

    if (!String(markdown).trim()) {
      response.status(400).json({ error: "没有可导出的内容。" });
      return;
    }

    const html = buildDocument({
      markdown,
      title,
      theme,
      fontSize,
      lineHeight,
      paragraphGap
    });
    const isDevice = mode === "device";
    const width = 402;
    const viewportHeight = 874;
    const deviceScaleFactor = 3;

    browser = await chromium.launch({
      headless: true,
      ...(process.env.LONGSHOT_CHROMIUM_PATH
        ? { executablePath: process.env.LONGSHOT_CHROMIUM_PATH }
        : {})
    });
    const context = await browser.newContext({
      viewport: { width, height: viewportHeight },
      deviceScaleFactor,
      isMobile: isDevice,
      hasTouch: isDevice,
      userAgent: isDevice
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
        : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    });

    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "networkidle", timeout: 45_000 });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      const images = Array.from(document.images);
      await Promise.all(images.map((image) => image.decode().catch(() => null)));
    });
    await page.waitForTimeout(120);

    const totalHeight = await page.evaluate(() =>
      Math.max(
        874,
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      )
    );
    const chunks = [];
    const maxScroll = Math.max(0, totalHeight - viewportHeight);

    for (let offset = 0; offset < totalHeight; offset += viewportHeight) {
      const actualScroll = Math.min(offset, maxScroll);
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), actualScroll);
      await page.waitForTimeout(80);

      const viewportBuffer = await page.screenshot({
        type: "png",
        fullPage: false,
        animations: "disabled"
      });
      const remaining = Math.min(viewportHeight, totalHeight - offset);
      const visibleOffset = offset - actualScroll;
      const cropped = await sharp(viewportBuffer)
        .extract({
          left: 0,
          top: visibleOffset * deviceScaleFactor,
          width: width * deviceScaleFactor,
          height: remaining * deviceScaleFactor
        })
        .png()
        .toBuffer();

      chunks.push({
        input: cropped,
        left: 0,
        top: offset * deviceScaleFactor
      });
    }

    const palette = palettes[theme] || palettes.dark;
    const pngBuffer = await sharp({
      create: {
        width: width * deviceScaleFactor,
        height: totalHeight * deviceScaleFactor,
        channels: 4,
        background: palette.bg
      }
    })
      .composite(chunks)
      .png()
      .toBuffer();

    const safeName = String(title || "longshot")
      .replace(/[\\/:*?"<>|]/g, "_")
      .slice(0, 60);
    const extension = format === "jpg" ? "jpg" : "png";
    const output = extension === "jpg"
      ? await sharp(pngBuffer).jpeg({ quality: 92, mozjpeg: true }).toBuffer()
      : pngBuffer;

    response.setHeader("Content-Type", extension === "jpg" ? "image/jpeg" : "image/png");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}.${extension}`
    );
    response.setHeader("X-Image-Width", String(width * deviceScaleFactor));
    response.setHeader("X-Image-Height", String(totalHeight * deviceScaleFactor));
    response.setHeader("X-Export-Mode", isDevice ? "iphone" : "fixed");
    response.send(output);

    await context.close();
  } catch (error) {
    console.error(error);
    const message = error?.message || "";
    response.status(500).json({
      error: message.includes("Executable doesn't exist")
        ? "尚未安装 Playwright Chromium，请运行：npx playwright install chromium"
        : `导出失败：${message || "未知错误"}`
    });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      next();
      return;
    }
    response.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, "127.0.0.1", () => {
  console.log(`长卷 LONGSCROLL 导出服务: http://127.0.0.1:${PORT}`);
});
