const STORAGE_KEYS = {
  script: 'solarstatic.bazi.reference.script.v1',
};

const DEFAULT_SCRIPT = 'hans';

const root = document.documentElement;
const langToggle = document.querySelector('[data-lang-toggle]');
const translatableNodes = Array.from(document.querySelectorAll('[data-hans][data-hant]'));
const pageTitleHost = document.querySelector('[data-page-title-hans][data-page-title-hant]');
const contentHost = document.querySelector('[data-content-hans][data-content-hant]');
const markdownContent = document.querySelector('[data-markdown-content]');
const markdownStatus = document.querySelector('[data-markdown-status]');
const htmlCache = new Map();
let activeRenderId = 0;

const getStoredValue = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const setStoredValue = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures and keep the current page interactive.
  }
};

const renderLangButton = (script) => {
  if (!langToggle) {
    return;
  }

  langToggle.textContent = script === 'hans' ? '简' : '繁';
  langToggle.setAttribute(
    'aria-label',
    script === 'hans' ? 'Switch to Traditional Chinese' : 'Switch to Simplified Chinese',
  );
};

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const renderInlineMarkdown = (value) => {
  const codeSpans = [];
  const escaped = escapeHtml(value).replace(/`([^`]+)`/g, (_, code) => {
    const token = `__CODE_SPAN_${codeSpans.length}__`;
    codeSpans.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer">$1</a>',
  );

  return codeSpans.reduce(
    (result, codeSpan, index) => result.replace(`__CODE_SPAN_${index}__`, codeSpan),
    linked,
  );
};

const renderMarkdownToHtml = (markdown) => {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let index = 0;

  const isHeading = (line) => /^#{1,6}\s+/.test(line);
  const isHr = (line) => /^([-*_])\1{2,}\s*$/.test(line.trim());
  const isUnorderedList = (line) => /^\s*[-*+]\s+/.test(line);
  const isOrderedList = (line) => /^\s*\d+\.\s+/.test(line);
  const isBlockquote = (line) => /^\s*>\s?/.test(line);
  const isFence = (line) => /^\s*```/.test(line);
  const startsNewBlock = (line) =>
    !line.trim() ||
    isHeading(line) ||
    isHr(line) ||
    isUnorderedList(line) ||
    isOrderedList(line) ||
    isBlockquote(line) ||
    isFence(line);

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (isFence(line)) {
      const openingFence = line.trim();
      const language = openingFence.slice(3).trim();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !isFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      html.push(
        `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${escapeHtml(
          codeLines.join('\n'),
        )}</code></pre>`,
      );
      continue;
    }

    if (isHeading(line)) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        html.push(`<h${level}>${renderInlineMarkdown(match[2].trim())}</h${level}>`);
      }
      index += 1;
      continue;
    }

    if (isHr(line)) {
      html.push('<hr />');
      index += 1;
      continue;
    }

    if (isBlockquote(line)) {
      const quoteLines = [];
      while (index < lines.length && isBlockquote(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, '').trimEnd());
        index += 1;
      }
      html.push(`<blockquote><p>${quoteLines.map(renderInlineMarkdown).join('<br />')}</p></blockquote>`);
      continue;
    }

    if (isUnorderedList(line) || isOrderedList(line)) {
      const ordered = isOrderedList(line);
      const tagName = ordered ? 'ol' : 'ul';
      const items = [];
      const pattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;
      while (index < lines.length && (ordered ? isOrderedList(lines[index]) : isUnorderedList(lines[index]))) {
        items.push(`<li>${renderInlineMarkdown(lines[index].replace(pattern, '').trim())}</li>`);
        index += 1;
      }
      html.push(`<${tagName}>${items.join('')}</${tagName}>`);
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length && !startsNewBlock(lines[index])) {
      paragraphLines.push(lines[index].trimEnd());
      index += 1;
    }
    html.push(`<p>${paragraphLines.map(renderInlineMarkdown).join('<br />')}</p>`);
  }

  return html.join('\n');
};

const getContentPathForScript = (script) => {
  if (!contentHost) {
    return null;
  }

  return script === 'hant' ? contentHost.dataset.contentHant ?? null : contentHost.dataset.contentHans ?? null;
};

const renderContentStatus = (text) => {
  if (!markdownStatus) {
    return;
  }

  markdownStatus.hidden = false;
  markdownStatus.textContent = text;
};

const renderMarkdownContent = async (script) => {
  const contentPath = getContentPathForScript(script);
  if (!markdownContent || !contentPath) {
    return;
  }

  const renderId = ++activeRenderId;
  renderContentStatus(script === 'hant' ? '載入中…' : '载入中…');

  try {
    let html = htmlCache.get(contentPath);
    if (!html) {
      const response = await fetch(contentPath);
      if (!response.ok) {
        throw new Error(`Failed to load ${contentPath}`);
      }
      const markdown = await response.text();
      html = renderMarkdownToHtml(markdown);
      htmlCache.set(contentPath, html);
    }

    if (renderId !== activeRenderId) {
      return;
    }

    markdownContent.innerHTML = html;
    if (markdownStatus) {
      markdownStatus.hidden = true;
    }
  } catch (error) {
    if (renderId !== activeRenderId) {
      return;
    }

    console.error(error);
    markdownContent.innerHTML = '';
    renderContentStatus(script === 'hant' ? '內容載入失敗。' : '内容载入失败。');
  }
};

const applyScript = (script) => {
  const resolvedScript = script === 'hant' ? 'hant' : 'hans';
  root.dataset.script = resolvedScript;
  root.lang = resolvedScript === 'hant' ? 'zh-Hant' : 'zh-Hans';

  const textKey = resolvedScript === 'hant' ? 'hant' : 'hans';
  for (const node of translatableNodes) {
    node.textContent = node.dataset[textKey] ?? node.textContent;
  }

  if (pageTitleHost) {
    document.title =
      resolvedScript === 'hant'
        ? pageTitleHost.dataset.pageTitleHant ?? document.title
        : pageTitleHost.dataset.pageTitleHans ?? document.title;
  }

  renderLangButton(resolvedScript);
  setStoredValue(STORAGE_KEYS.script, resolvedScript);
  void renderMarkdownContent(resolvedScript);
};

langToggle?.addEventListener('click', () => {
  const currentScript = root.dataset.script === 'hant' ? 'hant' : 'hans';
  applyScript(currentScript === 'hans' ? 'hant' : 'hans');
});
applyScript(getStoredValue(STORAGE_KEYS.script, DEFAULT_SCRIPT));
