import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import fontkit from '@pdf-lib/fontkit';
import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  rgb,
  type PDFFont,
} from 'pdf-lib';
import {
  freewillCopy as copy,
  getProgress,
  groups,
  groupStatuses,
  statuses,
  type Album,
} from '../../data/freewill';

const require = createRequire(import.meta.url);
const ink = rgb(0.09, 0.13, 0.14);
const muted = rgb(0.31, 0.35, 0.36);
const rule = rgb(0.78, 0.81, 0.81);
const stripe = rgb(0.96, 0.97, 0.97);
const checked = rgb(0.05, 0.41, 0.31);
const margin = 28;
const rowHeight = 45;
const small = 8;
const body = 9;

function fit(value: string, font: PDFFont, size: number, width: number) {
  const text = value.replace(/[\s\p{C}]+/gu, ' ').trim();
  if (font.widthOfTextAtSize(text, size) <= width) return text;
  let result = '';
  for (const character of text) {
    if (font.widthOfTextAtSize(`${result}${character}…`, size) > width) break;
    result += character;
  }
  return `${result.trimEnd()}…`;
}

export async function createPdf(album: Album): Promise<ArrayBuffer> {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const [wide, tall] = PageSizes.Letter.toReversed();
  const page = document.addPage([wide, tall]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const unicode = await document.embedFont(
    await readFile(require.resolve('@fontpkg/unifont/unifont-15.0.01.ttf')),
    { subset: true },
  );
  const regularGlyphs = new Set(regular.getCharacterSet());
  const unicodeGlyphs = new Set(unicode.getCharacterSet());

  function text(
    value: string,
    x: number,
    y: number,
    size: number,
    width: number,
    heading = false,
    color = ink,
  ) {
    const normalized = value.replace(/[\s\p{C}]+/gu, ' ').trim();
    const font = [...normalized].every((character) =>
      regularGlyphs.has(character.codePointAt(0)!),
    )
      ? heading
        ? bold
        : regular
      : unicode;
    const printable =
      font === unicode
        ? [...normalized]
            .map((character) =>
              unicodeGlyphs.has(character.codePointAt(0)!) ? character : '�',
            )
            .join('')
        : normalized;
    page.drawText(fit(printable, font, size, width), {
      x,
      y,
      size,
      font,
      color,
    });
  }

  const tableWidth = wide - margin * 2;
  const trackWidth = 138;
  const groupWidth = (tableWidth - trackWidth) / groups.length;
  const headerTop = tall - 82;
  const firstRowTop = headerTop - 24;

  document.setTitle(copy.title);
  text(copy.title, margin, tall - 45, 22, tableWidth, true);
  text(copy.subtitle, margin, tall - 62, body, tableWidth, false, muted);
  page.drawRectangle({
    x: margin,
    y: firstRowTop,
    width: tableWidth,
    height: 24,
    color: stripe,
  });
  text(copy.track, margin + 8, headerTop - 15, body, trackWidth - 16, true);
  groups.forEach((group, index) => {
    text(
      copy.groups[group],
      margin + trackWidth + index * groupWidth + 8,
      headerTop - 15,
      body,
      groupWidth - 16,
      true,
    );
  });

  album.tracks.forEach((track, index) => {
    const top = firstRowTop - rowHeight * index;
    if (index % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: top - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: stripe,
      });
    }
    text(
      `${track.order}. ${track.title}`,
      margin + 8,
      top - 15,
      body,
      trackWidth - 16,
      true,
    );
    groups.forEach((group, column) => {
      const x = margin + trackWidth + column * groupWidth + 8;
      groupStatuses[group].forEach((status, slot) => {
        const item = getProgress(track, group, status);
        const y = top - 12 - slot * 20;
        const color = item.completed ? checked : muted;
        page.drawRectangle({
          x,
          y,
          width: 7,
          height: 7,
          borderWidth: 0.8,
          borderColor: color,
        });
        if (item.completed) {
          page.drawLine({
            start: { x: x + 1, y: y + 3 },
            end: { x: x + 3, y: y + 1 },
            thickness: 1,
            color,
          });
          page.drawLine({
            start: { x: x + 3, y: y + 1 },
            end: { x: x + 6, y: y + 6 },
            thickness: 1,
            color,
          });
        }
        text(
          [status.toUpperCase(), item.date].filter(Boolean).join('  '),
          x + 11,
          y,
          small,
          groupWidth - 27,
          true,
          color,
        );
        if (item.note)
          text(
            item.note,
            x + 11,
            y - 8,
            small - 1,
            groupWidth - 27,
            false,
            muted,
          );
      });
    });
    page.drawLine({
      start: { x: margin, y: top - rowHeight },
      end: { x: wide - margin, y: top - rowHeight },
      thickness: 0.5,
      color: rule,
    });
  });
  text(
    statuses
      .map((status) => `${status.toUpperCase()} · ${copy.statuses[status]}`)
      .join('    '),
    margin,
    41,
    small,
    tableWidth,
    true,
  );
  text(copy.printNote, margin, 28, small, tableWidth, false, muted);
  return new Uint8Array(await document.save()).buffer;
}
