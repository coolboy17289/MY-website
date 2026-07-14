// parser.js
// Converts a page's .txt source into a self-contained block of HTML.
//
// The supported source format is:
//   - Frontmatter (optional, ignored): one or more `# order: N` / `# title: X`
//     lines at the very top, before the first blank line.
//   - `# Heading` -> <h1>
//   - `## Subheading` -> <h2>
//   - `===` or `---` (alone on a line) -> <hr />
//   - `- item` -> grouped into a <ul> until the next blank line
//   - Blank lines separate paragraphs
//   - Inline: `**bold**` -> <strong>, plain http(s)/mailto -> quiet <a>,
//     `/link(Label url)` -> labeled button with the URL beside it
//   - **Literal rule:** any paragraph line that begins with whitespace marks
//     the whole paragraph as "show literally" (escape only — no auto-link,
//     no bold, no plain-URL rewrite). Used by welcome.txt to display example
//     text like ' #/link(...)' without it being interpreted as a button.
(() => {
  'use strict';

  const escapeHtml = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  // Split "/link(Label url)" into {label, url}. The label is whatever precedes
  // the last whitespace token; the last token is treated as the URL/address.
  const parseLinkCommand = (inner) => {
    const trimmed = inner.trim();
    const m = trimmed.match(/^(.*?)\s(\S+)$/);
    if (m) return { label: m[1], url: m[2] };
    return { label: trimmed, url: trimmed };
  };

  const formatInline = (text) => {
    let s = escapeHtml(text);

    // 1) /link(Label url) buttons. Process before plain URLs so a URL inside
    //    a /link(...) is captured as the link target, not auto-linked again.
    s = s.replace(/\/link\(([^)]+)\)/g, (_, inner) => {
      const { label, url } = parseLinkCommand(inner);
      return (
        '<a class="btn-link" href="' +
        escapeHtml(url) +
        '">' +
        '<span class="btn-link-label">' +
        escapeHtml(label) +
        '</span>' +
        '<span class="btn-link-tick" aria-hidden="true">-&gt;</span>' +
        '<span class="btn-link-url">' +
        escapeHtml(url) +
        '</span>' +
        '</a>'
      );
    });

    // 2) **bold**
    s = s.replace(/\*\*([^\n*]+?)\*\*/g, '<strong>$1</strong>');

    // 3) Plain http(s) / mailto URLs -> quiet inline links.
    s = s.replace(
      /(^|[\s(])((?:https?:\/\/|mailto:)[^\s<)]+)/g,
      (_, lead, url) =>
        lead + '<a class="inline-link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(url) + '</a>'
    );

    return s;
  };

  const stripFrontmatter = (text) => {
    // Consume leading `# order:` / `# title:` lines until the first non-
    // frontmatter line. The `m` flag matters: it lets the inner `^` anchor to
    // each line start so the second line is also consumed.
    const m = text.match(/^(?:^[ \t]*#\s*(?:order|title)\s*:[^\n]*\n)+/m);
    if (m) return text.slice(m[0].length).replace(/^\n+/, '');
    // Fallback: strip up to the first blank line.
    const idx = text.search(/\n[ \t]*\n/);
    return idx === -1 ? text : text.slice(idx).replace(/^\n+/, '');
  };

  const parseTxt = (raw) => {
    const text = stripFrontmatter(raw);
    const lines = text.split(/\r?\n/);

    const out = [];
    let para = [];
    const items = [];
    // Once any line in the current paragraph begins with whitespace, the whole
    // paragraph is rendered verbatim (escape only). This is the convention
    // used in welcome.txt to literally show example syntax like '#/link(...)'.
    let paraLiteral = false;

    const flushPara = () => {
      if (para.length) {
        const joined = para.join(' ');
        const inner = paraLiteral ? escapeHtml(joined) : formatInline(joined);
        out.push('<p>' + inner + '</p>');
        para = [];
        paraLiteral = false;
      }
    };
    const flushList = () => {
      if (items.length) {
        out.push(
          '<ul>' +
            items.map((i) => '<li>' + formatInline(i) + '</li>').join('') +
            '</ul>'
        );
        items.length = 0;
      }
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (line === '') {
        flushPara();
        flushList();
        paraLiteral = false;
        continue;
      }
      if (line === '===' || line === '---') {
        flushPara();
        flushList();
        out.push('<hr />');
        paraLiteral = false;
        continue;
      }
      if (line.startsWith('## ')) {
        flushPara();
        flushList();
        out.push('<h2>' + formatInline(line.slice(3)) + '</h2>');
        paraLiteral = false;
        continue;
      }
      if (line.startsWith('# ')) {
        flushPara();
        flushList();
        out.push('<h1>' + formatInline(line.slice(2)) + '</h1>');
        paraLiteral = false;
        continue;
      }
      if (line.startsWith('- ')) {
        flushPara();
        items.push(line.slice(2));
        continue;
      }
      // paragraph line. Mark the whole paragraph as literal text when the line
      // begins with whitespace OR with a `#` not followed by space. The latter
      // is the convention used in welcome.txt to display example syntax like
      // '#/link(...)' without it being interpreted as a button.
      flushList();
      if (/^[ \t]/.test(raw) || /^#[^ \t]/.test(line)) paraLiteral = true;
      para.push(line);
    }
    flushPara();
    flushList();

    return out.join('\n');
  };

  window.LihanParse = { parse: parseTxt };
})();
