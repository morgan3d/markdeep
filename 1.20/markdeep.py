#!/usr/bin/env python3
"""
markdeep.py - Python utilities for Markdeep

Copyright (C) 2025-2026 Morgan McGuire

This program is free software: you can redistribute it and/or modify
it under the terms of the MIT License as published by
the Open Source Initiative.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
MIT License for more details.

You should have received a copy of the MIT License along with
this program.  If not, see <https://opensource.org/licenses/MIT>.
"""

import re
import html
import urllib.parse


def mangle(text: str) -> str:
    """
    Turn the argument into a legal URL anchor.

    This matches the mangle() function from markdeep.js byte-for-byte [RM47].
    The safe set reproduces JavaScript encodeURI(), which is the canonical
    encoding because the renderer's published anchors use it.

    Args:
        text: The text to mangle

    Returns:
        A URL-safe anchor string
    """
    cleaned = re.sub(r'[\s\(\)\[\]<>\{\}]', '', text)
    return urllib.parse.quote(cleaned.lower(), safe=";,/?:@&=+$!*'()#")


def mangle_code(text: str) -> str:
    """
    Code-sensitive version of mangle that separates function names from arguments.
    For example: "foo(x, y)" becomes "foo-fcn", "bar[i]" becomes "bar-array".
    
    This matches the mangleCode() function from markdeep.js.
    
    Args:
        text: The code text to mangle
        
    Returns:
        A URL-safe anchor string with code-specific handling
    """
    match = re.match(r'^([A-Za-z_][A-Za-z_\.0-9:\->]*)([\(\[<])', text)
    if match:
        identifier = match.group(1)
        delimiter = match.group(2)
        
        suffix_map = {'(': '-fcn', '[': '-array', '<': '-template'}
        suffix = suffix_map.get(delimiter, '')
        
        return mangle(identifier) + suffix
    else:
        return mangle(text)


def remove_html_tags(text: str) -> str:
    """
    Remove HTML tags from text.
    
    This matches the removeHTMLTags() function from markdeep.js.
    
    Args:
        text: Text that may contain HTML tags
        
    Returns:
        Text with HTML tags removed
    """
    return re.sub(r'<.*?>', '', text)


def header_anchor(header_array):
    """
    Takes an array of nested header titles and returns the anchor name using the full hierarchy path.
    Headers with the same name are disambiguated by their nesting.
    
    This matches the markdeep.headerAnchor() function from the JavaScript API.
    
    Example:
        header_anchor(['Introduction', 'Forms of _Being_', 'Addendum'])
        returns 'introduction/formsofbeing/addendum'
        
    Args:
        header_array: List of header titles in hierarchical order
        
    Returns:
        The anchor name using the full path, or empty string if input is invalid
    """
    if not isinstance(header_array, list) or len(header_array) == 0:
        return ''
    
    processed_headers = []
    for header in header_array:
        clean_header = remove_html_tags(header)
        clean_header = re.sub(r'⟨L:\d+⟩', '', clean_header)
        clean_header = clean_header.strip().lower()
        processed_headers.append(mangle(clean_header))
    
    return '/'.join(processed_headers)


def definition_anchor(header_array, term):
    """
    Takes an array of nested header titles and a definition term, and returns the anchor name
    for the definition. Uses code-sensitive mangling for API definitions.
    
    This matches the markdeep.definitionAnchor() function from the JavaScript API.
    
    Example:
        definition_anchor(['API Reference'], 'foo(x, y)')
        returns 'apireference/def-foo-fcn'
        
    Args:
        header_array: List of header titles in hierarchical order (may be empty)
        term: The definition term
        
    Returns:
        The anchor name for the definition, or empty string if term is invalid
    """
    if not isinstance(term, str) or len(term) == 0:
        return ''

    # The renderer HTML-escapes code content before its definition terms are
    # mangled, so escaped forms are what the published anchors contain. Apply
    # the same escaping (mirroring escapeHTMLEntities in markdeep.js) so the
    # computed anchor matches the rendered one for terms such as Foo<T>.
    clean_term = (term.replace('&', '&amp;').replace('<', '&lt;')
                      .replace('>', '&gt;').replace('"', '&quot;'))
    clean_term = re.sub(r'⟨L:\d+⟩', '', clean_term)
    clean_term = clean_term.strip()
    mangled_term = mangle_code(clean_term)
    
    if not isinstance(header_array, list) or len(header_array) == 0:
        return 'def-' + mangled_term
    
    processed_headers = []
    for header in header_array:
        clean_header = remove_html_tags(header)
        clean_header = re.sub(r'⟨L:\d+⟩', '', clean_header)
        clean_header = clean_header.strip().lower()
        processed_headers.append(mangle(clean_header))
    
    return '/'.join(processed_headers) + '/def-' + mangled_term


_TOGGLE_DELIMS = ('**', '__', '*', '_')   # try longest first; each is its own closer

# A whole link or image is atomic under truncation: either it fits or the cut
# falls before it, since a URL split at the truncation point is meaningless.
# Mirrors the hyperlink and image patterns in markdeep.js.
_LINK_ATOM_RE = re.compile(
    r'!?\[(?:[^\[\]\\]|\\[\[\]])*?\]\((?P<q>"?)[^<>\s"\)]+(?P=q)(?:\s[^)]{0,200})?\)'
)

# Known HTML void elements (no closing tag) and container elements (closed if
# left open at the cut). Any syntactically valid tag is protected from being
# split; only container tags are also auto-closed. Extend these sets as needed.
_HTML_VOID = frozenset((
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
))
_HTML_CONTAINER = frozenset((
    'a', 'abbr', 'b', 'big', 'cite', 'code', 'del', 'div', 'em', 'i', 'ins',
    'kbd', 'mark', 'pre', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub',
    'sup', 'tt', 'u', 'var',
))
_HTML_COMMENT_RE = re.compile(r'<!--[\s\S]*?-->')
_HTML_TAG_RE = re.compile(r'</?([A-Za-z][A-Za-z0-9]*)[^>]*?(/?)>')


def truncate_markdown(text, max_width, suffix="…"):
    """
    Truncate text to at most max_width characters without splitting Markdeep
    inline markup.

    Scans text tracking open inline constructs — `` `code` ``, *em*/_em_,
    **strong**/__strong__, ((stage directions)), and known HTML container tags
    (<b>, <span>, <a>, …) — and treats atomic units (whole [links](url) /
    ![images](url), HTML tags, and <!-- comments -->) as indivisible. Returns
    the longest prefix whose rendered form (kept text + closers for whatever is
    still open + suffix) fits in max_width; an atomic unit that will not fit is
    dropped whole rather than split.

    Any syntactically valid HTML tag is protected from being split; only known
    container tags (see _HTML_CONTAINER) are auto-closed, and known void tags
    (see _HTML_VOID) are never closed. Over-tracking is safe (a spurious closer
    is harmless literal text), so the scan errs toward closing rather than risk
    leaving markup open. Assumes well-formed input: the delimiters in text are
    balanced and nested, as they are in a value the table would emit untruncated.
    """
    if len(text) <= max_width:
        return text

    # Clean cut points as (kept_end, open-closer stack). A cut is recorded only
    # after real content — never right after an opener — so no span closes empty.
    candidates = [(0, ())]
    stack = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]

        # Inside code, only an unescaped closing backtick is special.
        if stack and stack[-1] == '`':
            if ch == '`' and text[i - 1] != '\\':
                stack.pop()
            i += 1
            candidates.append((i, tuple(stack)))
            continue

        # Whole link / image is atomic.
        if ch == '!' or ch == '[':
            atom = _LINK_ATOM_RE.match(text, i)
            if atom:
                i = atom.end()
                candidates.append((i, tuple(stack)))
                continue

        # HTML comment or tag: never split; close known container tags.
        if ch == '<':
            comment = _HTML_COMMENT_RE.match(text, i)
            if comment:
                i = comment.end()
                candidates.append((i, tuple(stack)))
                continue
            tag = _HTML_TAG_RE.match(text, i)
            if tag:
                name = tag.group(1).lower()
                is_close = tag.group(0)[1] == '/'
                is_self_close = tag.group(2) == '/'
                i = tag.end()
                if is_close:
                    if stack and stack[-1] == '</' + name + '>':
                        stack.pop()
                    candidates.append((i, tuple(stack)))
                elif name in _HTML_CONTAINER and not is_self_close:
                    # No candidate right after an opener, matching the delimiters.
                    stack.append('</' + name + '>')
                else:
                    # Void, self-closing, or unknown tag: atomic, nothing to close.
                    candidates.append((i, tuple(stack)))
                continue
            # Lone '<': treat as plain text.

        # Open code.
        if ch == '`' and (i == 0 or text[i - 1] != '\\'):
            stack.append('`')
            i += 1
            continue

        # Stage directions.
        if text.startswith('((', i):
            stack.append('))')
            i += 2
            continue
        if text.startswith('))', i) and stack and stack[-1] == '))':
            stack.pop()
            i += 2
            candidates.append((i, tuple(stack)))
            continue

        # Strong / emphasis (longest delimiter first). Open only when the content
        # would start with a non-space, non-delimiter char, matching markdeep's
        # flanking rule; this avoids opening on literal asterisks like "2 * 3".
        delim = next((d for d in _TOGGLE_DELIMS if text.startswith(d, i)), None)
        if delim:
            j = i + len(delim)
            if stack and stack[-1] == delim:
                stack.pop()
                i = j
                candidates.append((i, tuple(stack)))
                continue
            if j < n and text[j] not in ' \t\n' and text[j] != delim[0]:
                stack.append(delim)
                i = j
                continue
            # Not a valid delimiter here: fall through and treat as plain text.

        # Plain content character.
        i += 1
        candidates.append((i, tuple(stack)))

    # Pick the longest prefix whose closed, suffixed form fits max_width.
    best = suffix[:max_width]
    best_end = -1
    for end, snap in candidates:
        kept = text[:end].rstrip()
        # markdeep will not close a code span whose content ends in ` or \.
        if snap and snap[-1] == '`':
            kept = kept.rstrip('\\`')
        out = kept + ''.join(reversed(snap)) + suffix
        if len(out) <= max_width and end > best_end:
            best, best_end = out, end
    return best


def generate_markdown_table(rows, caption="", outer_border=False, padding=True, truncate_suffix="…"):
    """
    Generate a Markdown table from rows of data.
    
    Args:
        rows: List of rows. First row is header. Each row is a list of values or header dicts.
              value = str | int | float | bool
              header_dict = {"value": str, "max_width": int, "min_width": int, "halign": str}
              halign = "left" | "center" | "right" | None (default: None)
        caption: Markdeep caption syntax (rendered below table)
        outer_border: If True, add leading/trailing | on each row
        padding: If True, pad cells to form ASCII grid
        truncate_suffix: Suffix for truncated cells (default: "…")
    
    Returns:
        Formatted Markdown table string
    
    Raises:
        ValueError: If rows is empty, contains None, or row has more cols than header
    """
    if not rows:
        raise ValueError("rows cannot be empty")
    
    # Parse header row to extract column specs
    header_row = rows[0]
    col_specs = []
    for cell in header_row:
        if cell is None:
            raise ValueError("None values not allowed (clean data before calling)")
        if isinstance(cell, dict):
            col_specs.append({
                "value": str(cell.get("value", "")),
                "max_width": cell.get("max_width"),
                "min_width": cell.get("min_width", 0),
                "halign": cell.get("halign")
            })
        else:
            col_specs.append({
                "value": str(cell),
                "max_width": None,
                "min_width": 0,
                "halign": None
            })
    
    num_cols = len(col_specs)
    
    # Convert all rows to string values, validate, and apply truncation
    processed_rows = []
    for row_idx, row in enumerate(rows):
        if len(row) > num_cols:
            raise ValueError(f"Row {row_idx} has {len(row)} cols, but header has {num_cols}")
        
        processed_row = []
        row_has_br = False
        for col_idx, cell in enumerate(row):
            if cell is None:
                raise ValueError("None values not allowed (clean data before calling)")
            
            # For header row, use the extracted value from col_specs
            if row_idx == 0:
                cell_str = col_specs[col_idx]["value"]
            elif isinstance(cell, dict):
                cell_str = str(cell.get("value", ""))
            else:
                cell_str = str(cell)
            
            # Convert newlines to <br>
            if '\n' in cell_str:
                cell_str = cell_str.replace('\n', '<br>')
            
            if '<br>' in cell_str:
                row_has_br = True
            
            # Apply max_width truncation without splitting inline markup
            if col_idx < len(col_specs):
                max_w = col_specs[col_idx]["max_width"]
                if max_w is not None:
                    cell_str = truncate_markdown(cell_str, max_w, truncate_suffix)
            
            processed_row.append(cell_str)
        
        # Pad row to num_cols if fewer
        while len(processed_row) < num_cols:
            processed_row.append("")
        
        processed_rows.append((processed_row, row_has_br))
    
    # Calculate column widths for padding
    col_widths = [spec["min_width"] for spec in col_specs]
    if padding:
        for processed_row, row_has_br in processed_rows:
            if not row_has_br:  # <br> disables padding for that row
                for col_idx, cell in enumerate(processed_row):
                    col_widths[col_idx] = max(col_widths[col_idx], len(cell))
    
    # Build table lines
    lines = []
    
    # Header row
    header_cells = []
    for col_idx, (cell, _) in enumerate([(processed_rows[0][0][i], False) for i in range(num_cols)]):
        cell = processed_rows[0][0][col_idx]
        if padding:
            cell = _pad_cell(cell, col_widths[col_idx], col_specs[col_idx]["halign"])
        header_cells.append(cell)
    
    header_line = " | ".join(header_cells).rstrip()
    if outer_border:
        header_line = "| " + header_line + " |"
    lines.append(header_line)
    
    # Separator row
    # Header/data rows use " | " (3 chars) between cells. Separator uses "|" (1 char).
    # To align pipes, separator cells need +2 chars to compensate for missing spaces.
    # First cell: +1 (space after), middle cells: +2 (space before and after), last cell: +1 (space before)
    sep_cells = []
    num_sep_cols = len(col_specs)
    for col_idx, spec in enumerate(col_specs):
        base_width = col_widths[col_idx] if padding else 3
        # Add padding to compensate for " | " vs "|" joiner difference
        if num_sep_cols == 1:
            width = base_width  # Single column, no adjustment needed
        elif col_idx == 0:
            width = base_width + 1  # First column: add 1 for trailing space
        elif col_idx == num_sep_cols - 1:
            width = base_width + 1  # Last column: add 1 for leading space
        else:
            width = base_width + 2  # Middle columns: add 2 for both spaces
        
        halign = spec["halign"]
        if halign == "left":
            sep = ":" + "-" * (width - 1) if width > 1 else "-"
        elif halign == "right":
            sep = "-" * (width - 1) + ":" if width > 1 else "-"
        elif halign == "center":
            sep = ":" + "-" * (width - 2) + ":" if width > 2 else ":-:" if width >= 3 else "-"
        else:
            sep = "-" * width
        sep_cells.append(sep)
    
    sep_line = "|".join(sep_cells).rstrip()
    if outer_border:
        sep_line = "|" + sep_line + "|"
    lines.append(sep_line)
    
    # Data rows
    for row_idx, (processed_row, row_has_br) in enumerate(processed_rows[1:], start=1):
        row_cells = []
        for col_idx, cell in enumerate(processed_row):
            if padding and not row_has_br:
                cell = _pad_cell(cell, col_widths[col_idx], col_specs[col_idx]["halign"])
            row_cells.append(cell)
        
        row_line = " | ".join(row_cells).rstrip()
        if outer_border:
            row_line = "| " + row_line + " |"
        lines.append(row_line)
    
    result = "\n".join(lines)
    
    # Add caption if provided
    if caption:
        result += "\n" + caption
    
    return result


_TABLE_CAPTION_RE = re.compile(
    r'^[ \t]*\[Table[ \t]+\[(?P<label>[^\]\n]+)\][ \t]*:(?P<caption_body>[^\]\n]*)\][ \t]*$',
    re.MULTILINE,
)
_SEPARATOR_CELL_RE = re.compile(r'^[ \t]*:?-+:?[ \t]*$')


class TableExtractError(ValueError):
    """Raised by extract_table when the requested table cannot be returned."""


def _split_row(row_text):
    """Split a Markdeep table row on '|', tolerating leading/trailing border bars."""
    text = row_text.strip()
    if text.startswith('|'):
        text = text[1:]
    if text.endswith('|'):
        text = text[:-1]
    return [cell.strip() for cell in text.split('|')]


def _is_separator_row(row_text):
    """True iff every '|'-separated cell in row_text is an alignment marker."""
    cells = _split_row(row_text)
    if not cells:
        return False
    return all(_SEPARATOR_CELL_RE.match(cell) for cell in cells)


def _alignment_marker(cell_text):
    """Map ':---:', '---:', ':---', '---' → 'C', 'R', 'L', 'X'."""
    text = cell_text.strip()
    left = text.startswith(':')
    right = text.endswith(':')
    if left and right:
        return 'C'
    if right:
        return 'R'
    if left:
        return 'L'
    return 'X'


def extract_table(source: str, label: str) -> dict:
    """
    Extract a single labeled table from Markdeep source by its label.

    Locates the `[Table [label]: caption]` syntax (which must appear on the
    line immediately below the table per RMX2 / `replaceTables()` in
    `markdeep.js`) and returns the adjacent table parsed into headers,
    alignment, and data rows.

    Args:
        source: Markdeep source text.
        label: The label inside the inner brackets of `[Table [label]: ...]`.

    Returns:
        A dict with keys: caption, id, header_row, align_row, data,
        line_start, line_length, char_start, char_length. See RM10 in
        markdeep-requirements.md.html for full field definitions.

    Raises:
        TableExtractError: label not found, label not adjacent to a parseable
            table, table malformed, or label appears more than once.
    """
    matches = [m for m in _TABLE_CAPTION_RE.finditer(source)
               if m.group('label').strip() == label]
    if not matches:
        raise TableExtractError(f"Table label not found: [{label}]")
    if len(matches) > 1:
        raise TableExtractError(f"Table label appears more than once: [{label}]")
    match = matches[0]

    caption_start = match.start()
    caption_text = source[caption_start:match.end()].strip()
    if caption_text.startswith('['):
        caption_text = caption_text[1:]
    if caption_text.endswith(']'):
        caption_text = caption_text[:-1]
    caption_text = caption_text.strip()

    lines = source.split('\n')
    line_offsets = [0]
    for line in lines[:-1]:
        line_offsets.append(line_offsets[-1] + len(line) + 1)

    caption_line_idx = source.count('\n', 0, caption_start)

    separator_idx = None
    for idx in range(caption_line_idx - 1, -1, -1):
        line = lines[idx]
        if not line.strip():
            break
        if _is_separator_row(line):
            separator_idx = idx
            break

    if separator_idx is None or separator_idx < 1:
        raise TableExtractError(
            f"Label [{label}] is not adjacent to a parseable table"
        )

    header_idx = separator_idx - 1
    header_line = lines[header_idx]
    if not header_line.strip() or '|' not in header_line:
        raise TableExtractError(
            f"Label [{label}] is not adjacent to a parseable table "
            f"(no header row above separator)"
        )

    header_row = _split_row(header_line)
    sep_cells = _split_row(lines[separator_idx])
    if len(sep_cells) != len(header_row):
        raise TableExtractError(
            f"Table [{label}] header has {len(header_row)} cells but "
            f"alignment row has {len(sep_cells)}"
        )
    align_row = [_alignment_marker(c) for c in sep_cells]

    data = []
    for idx in range(separator_idx + 1, caption_line_idx):
        line = lines[idx]
        if not line.strip():
            break
        cells = _split_row(line)
        if len(cells) > len(header_row):
            raise TableExtractError(
                f"Table [{label}] data row {idx - separator_idx} has "
                f"{len(cells)} cells but header has {len(header_row)}"
            )
        if len(cells) < len(header_row):
            cells = cells + [''] * (len(header_row) - len(cells))
        data.append(cells)

    line_start = header_idx
    line_length = caption_line_idx - header_idx + 1
    char_start = line_offsets[header_idx]
    caption_line_end = line_offsets[caption_line_idx] + len(lines[caption_line_idx])
    char_length = caption_line_end - char_start

    return {
        'caption': caption_text,
        'id': label,
        'header_row': header_row,
        'align_row': align_row,
        'data': data,
        'line_start': line_start,
        'line_length': line_length,
        'char_start': char_start,
        'char_length': char_length,
    }


def _pad_cell(text, width, halign):
    """Pad a cell to the specified width according to alignment."""
    if len(text) >= width:
        return text
    
    padding_needed = width - len(text)
    if halign == "left":
        return text + " " * padding_needed
    elif halign == "right":
        return " " * padding_needed + text
    elif halign == "center":
        left_pad = padding_needed // 2
        right_pad = padding_needed - left_pad
        return " " * left_pad + text + " " * right_pad
    else:
        return text + " " * padding_needed


_FENCED_BLOCK_RE = re.compile(
    r'(?m)^(?P<fence>```+|~~~+)[^\n]*\n(?P<body>.*?)^(?P=fence)[ \t]*$',
    re.DOTALL,
)
_INLINE_CODE_RE = re.compile(r'(?<!`)`(?!`)(?P<body>[^`\n]+)`(?!`)')
_DANGEROUS_CODE_RE = re.compile(r'<\S')
_SCRIPT_TAG_RE = re.compile(r'<([ \u200b\\])(/?script)', re.IGNORECASE)


def _escape_script_tags(s: str) -> str:
    """Insert space after < in script/close-script tags (RM98 rule 2)."""
    return _SCRIPT_TAG_RE.sub(r'< \2', s)


def make_markdown_code_browser_safe(text: str) -> str:
    """
    Make Markdown code blocks and inline spans safe for browser rendering.

    Wraps any code fence (triple backtick or tilde) or inline backtick span
    whose body contains a less-than sign immediately followed by a
    non-whitespace character in a ``< script type="preformatted">`` …
    ``< /script>`` block so that Markdeep does not interpret HTML tags inside.

    Additionally, any ``< script`` or ``< /script`` pattern inside a wrapped
    block has a space inserted after ``<`` so the browser does not close the
    preformatted wrapper prematurely. Markdeep removes the space when rendering.

    This matches the ``markdeep.makeMarkdownCodeBrowserSafe()`` JavaScript API.

    Args:
        text: Markdown text to make browser-safe.

    Returns:
        Text with dangerous code blocks/spans wrapped and script tags escaped.
    """
    if not text or not _DANGEROUS_CODE_RE.search(text):
        return text

    def _wrap_fenced(m: re.Match) -> str:
        if not _DANGEROUS_CODE_RE.search(m.group('body')):
            return m.group(0)
        safe_block = _escape_script_tags(m.group(0))
        return f'< script type="preformatted">\n{safe_block}< /script>\n'

    def _wrap_inline(m: re.Match) -> str:
        if not _DANGEROUS_CODE_RE.search(m.group('body')):
            return m.group(0)
        return f'< script type="preformatted">`{_escape_script_tags(m.group("body"))}`< /script>'

    text = _FENCED_BLOCK_RE.sub(_wrap_fenced, text)
    text = _INLINE_CODE_RE.sub(_wrap_inline, text)
    return text


# Export the main functions
__all__ = ['header_anchor', 'definition_anchor',
           'mangle', 'mangle_code', 'remove_html_tags',
           'generate_markdown_table', 'truncate_markdown',
           'extract_table', 'TableExtractError',
           'make_markdown_code_browser_safe']


if __name__ == '__main__':
    # Example usage
    print("Header anchor examples:")
    example1 = ['Introduction', 'Forms of _Being_', 'Addendum']
    print(f"  {example1}")
    print(f"  -> {header_anchor(example1)}")
    print(f"  Expected: introduction/formsofbeing/addendum")
    
    print("\nDefinition anchor examples:")
    example2 = (['API Reference'], 'foo(x, y)')
    print(f"  {example2}")
    print(f"  -> {definition_anchor(*example2)}")
    print(f"  Expected: apireference/def-foo-fcn")
    
    example3 = ([], 'bar[i]')
    print(f"  {example3}")
    print(f"  -> {definition_anchor(*example3)}")
    print(f"  Expected: def-bar-array")
    
    print("\nTable generation examples:")
    table_rows = [
        ["Name", {"value": "Age", "halign": "right"}, "City"],
        ["Alice", 30, "New York"],
        ["Bob", 25, "San Francisco"],
    ]
    print(generate_markdown_table(table_rows))
    print()
    print("With outer border:")
    print(generate_markdown_table(table_rows, outer_border=True))
    print()
    print("With max_width truncation:")
    trunc_rows = [
        [{"value": "Name", "max_width": 10}, "Description"],
        ["Alice", "A very long description that should be truncated"],
        ["Bob", "Short"],
    ]
    print(generate_markdown_table(trunc_rows))
