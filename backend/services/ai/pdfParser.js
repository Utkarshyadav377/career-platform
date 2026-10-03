// PDF text extraction using pdfjs-dist (maintained; handles a wider range of PDF producers
// than the older pdf-parse). pdfjs-dist is ESM-only, so it's loaded with dynamic import().
let pdfjsPromise = null;
const loadPdfjs = () => (pdfjsPromise ||= import('pdfjs-dist/legacy/build/pdf.mjs'));

async function extractText(buffer) {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;

  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let line = '';
    let lastY = null;
    for (const item of content.items) {
      if (typeof item.str !== 'string') continue;
      const y = item.transform ? item.transform[5] : null;
      // a change in vertical position starts a new line
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && line) {
        lines.push(line);
        line = '';
      }
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
      }
      if (y !== null) lastY = y;
    }
    if (line) lines.push(line);
  }
  await doc.destroy();

  // normalise whitespace but keep line breaks (useful for section detection)
  return lines
    .map((l) => l.split(/\s+/).filter(Boolean).join(' '))
    .filter(Boolean)
    .join('\n');
}

module.exports = { extractText };
