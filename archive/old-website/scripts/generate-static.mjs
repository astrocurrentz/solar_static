import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_CSS_VARIABLES, FONT_STACKS, GOOGLE_FONT_URLS } from '../shared/design/tokens.mjs';
import { SITE_COPY } from '../shared/copy/site-copy.mjs';
import { buildReferenceUi } from './static-reference-ui.mjs';
import { REDIRECT_ROUTES, SPA_ROUTE_PATHS } from '../shared/routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const generatedHtmlMarker = '<!-- GENERATED FILE: edit shared/copy, shared/design, or shared/routes instead. -->';
const generatedCssMarker = '/* GENERATED FILE: edit shared/design/tokens.mjs instead. */';
const writeFile = async (relativePath, content) => {
  const absolutePath = path.join(rootDir, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content.replace(/[ \t]+$/gm, ''));
};

const html = (body) => `${generatedHtmlMarker}
<!doctype html>
${body.trim()}
`;

const attrs = (items) => (
  Object.entries(items)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${String(value).replaceAll('"', '&quot;')}"`)
    .join(' ')
);

const backIconSvg = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>';

const buildDocument = ({ lang = 'en', title, head = '', bodyClass = '', bodyAttrs = '', body }) => html(`
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${head}
  </head>
  <body${bodyClass ? ` class="${bodyClass}"` : ''}${bodyAttrs ? ` ${bodyAttrs}` : ''}>
    ${body}
  </body>
</html>
`);

const buildRootIndex = () => html(`
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${SITE_COPY.titles.initialDocument}</title>
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="${GOOGLE_FONT_URLS.app}" rel="stylesheet" />
  </head>
  <body class="overflow-x-hidden">
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
`);

const buildRedirectPage = (target) => buildDocument({
  title: 'Redirecting...',
  head: `<meta http-equiv="refresh" content="0; url=${target}" />
    <script>window.location.replace(${JSON.stringify(target)});</script>`,
  body: `<p>Redirecting to <a href="${target}">${target}</a>.</p>`,
});

const buildExternalLinkPage = ({ title, backHref, navLabel, links }) => buildDocument({
  title,
  head: '<link rel="stylesheet" href="/external/font.css" />',
  bodyClass: 'external-page',
  body: `
    <a class="external-back" href="${backHref}" aria-label="${SITE_COPY.external.backLabel}">${backIconSvg}</a>
    <main class="external-links-layout">
      <nav class="external-links" aria-label="${navLabel}">
        ${links.map((link) => `<p><a href="${link.href}">${link.label}</a></p>`).join('\n        ')}
      </nav>
    </main>
  `,
});

const buildPrivacyPage = () => buildDocument({
  title: SITE_COPY.titles.baziPrivacy,
  head: '<link rel="stylesheet" href="/external/font.css" />',
  bodyClass: 'external-page',
  body: `
    <a class="external-back" href="/external/bazi" aria-label="${SITE_COPY.external.backLabel}">${backIconSvg}</a>
    <main class="external-document">
      <article>
        ${SITE_COPY.external.privacyHtml.trim()}
      </article>
    </main>
  `,
});

const buildReferencePage = (page) => buildDocument({
  lang: 'zh-Hans',
  title: page.titleHans,
  head: '<link rel="stylesheet" href="/external/font.css" />',
  bodyClass: 'external-page',
  bodyAttrs: attrs({
    'data-page-title-hans': page.titleHans,
    'data-page-title-hant': page.titleHant,
    'data-content-hans': page.contentHans,
    'data-content-hant': page.contentHant,
  }),
  body: `
    <a class="external-back" href="/external/bazi" aria-label="${SITE_COPY.external.backLabel}">${backIconSvg}</a>
    <div class="external-action">
      <button type="button" data-lang-toggle aria-label="${SITE_COPY.external.languageButtonLabel}">${SITE_COPY.external.scriptHansButton}</button>
    </div>
    <main class="external-document">
      <div class="reference-status" data-markdown-status>${SITE_COPY.external.loadingHans}</div>
      <article class="reference-content" data-markdown-content></article>
    </main>
    <script src="/external/bazi/reference-ui.js"></script>
  `,
});

const buildTokenCss = () => `${generatedCssMarker}
:root {
${Object.entries(APP_CSS_VARIABLES).map(([name, value]) => `  ${name}: ${value};`).join('\n')}
  --external-display-font: ${FONT_STACKS.externalDisplay};
  --external-body-font: ${FONT_STACKS.cjk};
}
`;

const buildExternalCss = () => `${generatedCssMarker}
@import url("${GOOGLE_FONT_URLS.external}");

html,
body {
  margin: 0;
  background: var(--external-background);
  color: var(--external-foreground);
  font-family: var(--external-display-font);
}

button,
input,
select,
textarea {
  font: inherit;
}

body.external-page {
  min-height: 100vh;
  padding: 24px 20px 48px;
  font-size: clamp(16px, 1.45vw, 19px);
  line-height: 1.75;
}

.external-back,
.external-action {
  position: fixed;
  top: 18px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: inherit;
  text-decoration: none;
}

.external-back {
  left: 20px;
}

.external-action {
  right: 20px;
}

.external-back svg {
  width: 20px;
  height: 20px;
}

.external-action button {
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  cursor: pointer;
}

.external-links-layout {
  width: min(100%, 48rem);
  min-height: calc(100vh - 72px);
  margin: 0 auto;
  display: grid;
  place-items: center;
}

.external-document {
  width: min(100%, 48rem);
  margin: 0 auto;
  padding-top: 52px;
}

.external-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.15rem;
  text-align: center;
}

.external-links p {
  margin: 0;
}

.external-links a {
  color: inherit;
  font-size: clamp(1.35rem, 2.9vw, 2.35rem);
  font-weight: 700;
  line-height: 1.08;
  text-decoration: none;
}

.external-links a:hover,
.external-links a:focus-visible {
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.external-document > :first-child {
  margin-top: 0;
}

.external-document,
.reference-content,
.reference-status {
  font-family: var(--external-body-font);
}

.external-document article,
.reference-content {
  font-size: clamp(1rem, 1.18vw, 1.08rem);
  line-height: 1.95;
}

.external-document h1,
.external-document h2,
.external-document h3,
.reference-content h1,
.reference-content h2,
.reference-content h3,
.reference-content h4,
.reference-content h5,
.reference-content h6 {
  font-family: var(--external-display-font);
  font-weight: 700;
  line-height: 1.12;
}

.external-document h1,
.reference-content h1 {
  font-size: clamp(1.8rem, 4vw, 3rem);
}

.external-document h2,
.reference-content h2 {
  font-size: clamp(1.3rem, 2.4vw, 1.9rem);
}

.external-document h3,
.reference-content h3 {
  font-size: clamp(1.12rem, 1.9vw, 1.4rem);
}

.external-document p,
.external-document ul,
.external-document ol,
.reference-content p,
.reference-content ul,
.reference-content ol,
.reference-content blockquote,
.reference-content pre {
  margin-top: 0.9rem;
}

.external-document hr,
.reference-content hr {
  border: 0;
  border-top: 1px solid var(--external-rule-soft);
  margin: 1.6rem 0;
}

.external-document a,
.reference-content a {
  color: inherit;
  text-underline-offset: 0.16em;
}

.reference-content ul,
.reference-content ol,
.external-document ul,
.external-document ol {
  padding-left: 1.3rem;
}

.reference-content blockquote {
  margin-left: 0;
  padding-left: 1rem;
  border-left: 1px solid var(--external-rule-strong);
}

.reference-content pre,
.reference-content code {
  font-family: ${FONT_STACKS.monoSystem};
}

.reference-content pre {
  overflow-x: auto;
}
`;

const buildLegacyBaziCss = () => `${generatedCssMarker}
@import url("/external/font.css");
`;

const buildNotFoundPage = () => buildDocument({
  title: SITE_COPY.notFound.browserTitle,
  head: `<link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="${GOOGLE_FONT_URLS.notFound}" rel="stylesheet" />
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      body {
        min-height: 100vh;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: var(--external-background, ${APP_CSS_VARIABLES['--external-background']});
        color: var(--external-foreground, ${APP_CSS_VARIABLES['--external-foreground']});
        font-family: var(--font-display, "Syne", sans-serif);
        padding: 1.5rem;
      }
      .frame {
        width: fit-content;
        max-width: min(32rem, calc(100vw - 3rem));
        margin: 0 auto;
        text-align: center;
      }
      .glitch {
        margin: 0;
        font-size: clamp(2.4rem, 7vw, 5rem);
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        line-height: 0.92;
        text-wrap: balance;
      }
    </style>`,
  body: `
    <div class="frame"><h1 class="glitch">${SITE_COPY.notFound.heading}</h1></div>
    <script>
      const glitch = document.querySelector('.glitch');
      const text = ${JSON.stringify(SITE_COPY.notFound.heading)};
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&?!<>';
      const scrambleStepMs = 30;
      const scrambleRevealStep = 1 / 3;
      const glitchIntervalMs = 3600;
      let scrambleIntervalId = null;
      const triggerGlitch = () => {
        if (!glitch) return;
        if (scrambleIntervalId !== null) window.clearInterval(scrambleIntervalId);
        let iteration = 0;
        scrambleIntervalId = window.setInterval(() => {
          glitch.textContent = text.split('').map((character, index) => {
            if (character === ' ' || index < iteration) return text[index];
            return chars[Math.floor(Math.random() * chars.length)] ?? character;
          }).join('');
          if (iteration >= text.length) {
            glitch.textContent = text;
            window.clearInterval(scrambleIntervalId);
            scrambleIntervalId = null;
          }
          iteration += scrambleRevealStep;
        }, scrambleStepMs);
      };
      triggerGlitch();
      window.setInterval(triggerGlitch, glitchIntervalMs);
    </script>
  `,
});

const buildVercelConfig = () => {
  const redirectEntries = [
    { source: '/exteral/bazi', destination: '/external/bazi/privacy', permanent: true },
    { source: '/privacy', destination: '/external/bazi/privacy', permanent: true },
    { source: '/privacy/bazi', destination: '/external/bazi/privacy', permanent: true },
    { source: '/exteral/:path*', destination: '/external/:path*', permanent: true },
  ];

  return `${JSON.stringify({
    $schema: 'https://openapi.vercel.sh/vercel.json',
    redirects: redirectEntries,
    rewrites: SPA_ROUTE_PATHS.filter((route) => route !== '/').map((route) => ({
      source: route,
      destination: '/index.html',
    })),
  }, null, 2)}\n`;
};

const buildNetlifyConfig = () => {
  const redirects = [
    { from: '/exteral/bazi', to: '/external/bazi/privacy', status: 301 },
    { from: '/privacy', to: '/external/bazi/privacy', status: 301 },
    { from: '/privacy/bazi', to: '/external/bazi/privacy', status: 301 },
    { from: '/exteral/*', to: '/external/:splat', status: 301 },
    ...SPA_ROUTE_PATHS.filter((route) => route !== '/').map((route) => ({
      from: route,
      to: '/index.html',
      status: 200,
    })),
    { from: '/api/tools/text-to-img-post/render', to: '/.netlify/functions/text-to-img-post-render', status: 200 },
    { from: '/api/*', to: '/.netlify/functions/:splat', status: 200 },
  ];

  const redirectBlocks = redirects.map((redirect) => `[[redirects]]
from = "${redirect.from}"
to = "${redirect.to}"
status = ${redirect.status}`).join('\n\n');

  return `[build]
publish = "dist"
functions = "netlify/functions"

${redirectBlocks}
`;
};

await writeFile('shared/design/generated-token-vars.css', buildTokenCss());
await writeFile('index.html', buildRootIndex());
await writeFile('public/404.html', buildNotFoundPage());
await writeFile('public/external/font.css', buildExternalCss());
await writeFile('public/external/bazi/styles.css', buildLegacyBaziCss());
await writeFile('public/external/bazi/reference-ui.js', buildReferenceUi());
await writeFile('public/external/index.html', buildExternalLinkPage({
  title: SITE_COPY.titles.external,
  backHref: '/',
  navLabel: SITE_COPY.external.externalLinksLabel,
  links: [{ href: '/external/bazi', label: SITE_COPY.external.links.bazi }],
}));
await writeFile('public/external/bazi/index.html', buildExternalLinkPage({
  title: SITE_COPY.titles.baziExternal,
  backHref: '/external',
  navLabel: SITE_COPY.external.baziLinksLabel,
  links: [
    { href: '/external/bazi/privacy', label: SITE_COPY.external.links.privacy },
    ...SITE_COPY.external.referencePages.map((page) => ({
      href: `/external/bazi/reference/${page.slug}`,
      label: page.titleHans,
    })),
  ],
}));
await writeFile('public/external/bazi/privacy/index.html', buildPrivacyPage());

for (const page of SITE_COPY.external.referencePages) {
  await writeFile(`public/external/bazi/reference/${page.slug}/index.html`, buildReferencePage(page));
}

for (const route of REDIRECT_ROUTES) {
  await writeFile(`public${route.from}/index.html`, buildRedirectPage(route.to));
}

await writeFile('vercel.json', buildVercelConfig());
await writeFile('netlify.toml', buildNetlifyConfig());
