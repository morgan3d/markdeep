#!/usr/bin/env python3
"""
markdeep2.py: Python utilities for Markdeep

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

# Python standard library
import html, re, urllib.parse
from typing import Iterator, List, Optional, Tuple


# Header ID prefix and alias suffix, removed before mangling so that the title
# alone gives the anchor. Same patterns as splitHeaderTitle in
# markdeep2.js. The checksum letter is a character class, because the renderer
# accepts any checksum.
_DEPRECATED_ID_PREFIX_RE = re.compile(r'^([A-Z][A-Z]{2}[0-9a-f]+[qjvz]):\s+(.+)$')
_DEPRECATED_ALIAS_SUFFIX_RE = re.compile(r'\s+\(#([a-z][a-z0-9_-]*)\)\s*$')


def mangle(text: str) -> str:
    """
    Turn the plain text of a title into a legal URL anchor.
    "The Exit Codes (all)" becomes "exit_codes_all". Keep the articles only when
    the title is all articles, so "The" anchors as "the".

    Matches mangle() in markdeep2.js byte for byte. Normalization keeps letters,
    digits, and underscores, so quote() encodes exactly what encodeURI()
    encodes.
    """
    cleaned = ''.join(c for c in text.lower() if c.isalnum() or c == '_' or c.isspace())
    without_articles = re.sub(r'(^|\s)(?:the|an|a)(?=\s|$)', r'\1', cleaned)
    if without_articles.strip():
        cleaned = without_articles
    return urllib.parse.quote(re.sub(r'\s+', '_', cleaned.strip()))


def mangle_code(text: str) -> str:
    """
    mangle() with the arguments of a function, array, or template replaced by a
    suffix: "foo(x, y)" becomes "foo-fcn" and "bar[i]" becomes "bar-array".
    Matches mangleCode() in markdeep2.js.
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


# A section enumeration at the head of a title. With its trailing dot
# it is always a section number. Without one it is a section number only when
# the enclosing section's title had one, so that '1.20 Release Notes' and
# '2025 Report' stay title text.
_SECTION_NUMBER_RE = re.compile(r'^\d+(?:\.\d+)*\.\s+')
_UNDOTTED_SECTION_NUMBER_RE = re.compile(r'^\d+(?:\.\d+)+\s+')


def strip_section_number(title: str, parent_numbered: bool) -> tuple:
    """
    Remove the section enumeration from the head of a title, if it has one
. parent_numbered is whether the enclosing section's title had one.
    Returns (title, numbered). Matches stripSectionNumber() in markdeep2.js with
    its stripSectionNumbers option at the default, true.
    """
    if _SECTION_NUMBER_RE.match(title):
        return _SECTION_NUMBER_RE.sub('', title), True
    if parent_numbered and _UNDOTTED_SECTION_NUMBER_RE.match(title):
        return _UNDOTTED_SECTION_NUMBER_RE.sub('', title), True
    return title, False


def plain_title_text(source: str) -> str:
    """
    The text a reader sees of a title in Markdeep source: a code span keeps its
    content, emphasis and a link keep their text, and an image or a tag is
    removed. mangle() removes leftover delimiters, such as
    those of math. Matches plainTitleText() in markdeep2.js, so that the anchor
    equals the one the renderer computes from the heading text.
    """
    text = re.sub(r'⟨L:\d+⟩', '', source)
    text = re.sub(r'(`+)(.+?)\1', r'\2', text)
    text = re.sub(r'!\[[^\]]*\]\([^\)]*\)', '', text)
    text = re.sub(r'\[([^\]]*)\]\([^\)]*\)', r'\1', text)
    text = re.sub(r'\[([^\]]*)\]\[[^\]]*\]', r'\1', text)
    text = re.sub(r'<[^<>]*>', '', text)
    text = re.sub(r'(?<![A-Za-z0-9_])(\*\*|__|\*|_)(?=\S)(.*?\S)\1(?![A-Za-z0-9_]|\(|\.[A-Za-z])', r'\2', text)
    return text.strip()


def remove_html_tags(text: str) -> str:
    """Matches removeHTMLTags() in markdeep2.js."""
    return re.sub(r'<.*?>', '', text)


def split_header_title(text: str) -> dict:
    """Split header title text into {'id', 'title', 'alias'}, with the empty
    string for an absent part. Matches splitHeaderTitle in
    markdeep2.js, so that the Python and JavaScript anchors agree."""
    alias = ''
    id_prefix = ''
    title = text
    alias_match = _DEPRECATED_ALIAS_SUFFIX_RE.search(title)
    if alias_match:
        alias = alias_match.group(1)
        title = title[:alias_match.start()]
    id_match = _DEPRECATED_ID_PREFIX_RE.match(title)
    if id_match:
        id_prefix = id_match.group(1)
        title = id_match.group(2)
    return {'id': id_prefix, 'title': title.strip(), 'alias': alias}


def header_anchor(header_array):
    """
    Anchor of a header from its path of titles as written in the source,
    outermost H2 first, because the H1 is the document title.
    Matches markdeep.headerAnchor() in markdeep2.js:
    ['Introduction', 'Forms of _Being_', 'Addendum'] gives
    'introduction/forms_of_being/addendum'.
    """
    if not isinstance(header_array, list) or len(header_array) == 0:
        return ''

    processed_headers = []
    parent_numbered = False
    for header in header_array:
        title = split_header_title(header)['title']
        title, parent_numbered = strip_section_number(plain_title_text(title), parent_numbered)
        processed_headers.append(mangle(title))

    return '/'.join(processed_headers)


def definition_anchor(header_array, term):
    """
    Anchor of a definition term under the header path, with code-sensitive
    mangling of the term. Matches markdeep.definitionAnchor() in markdeep2.js:
    ['API Reference'] and 'foo(x, y)' give 'api_reference/def-foo-fcn'.
    """
    if not isinstance(term, str) or len(term) == 0:
        return ''

    # Treat the term as plain text, where `<` is a character; strip only a
    # surrounding code span.
    mangled_term = mangle_code(re.sub(r'(`+)(.+?)\1', r'\2', term).strip())

    if not isinstance(header_array, list) or len(header_array) == 0:
        return 'def-' + mangled_term

    return header_anchor(header_array) + '/def-' + mangled_term


_TOGGLE_DELIMS = ('**', '__', '*', '_')   # try longest first; each is its own closer

# Keep a link or image whole under truncation, because a split URL is
# meaningless. Same patterns as markdeep2.js, where a quoted URL may contain
# parentheses.
_LINK_ATOM_RE = re.compile(
    r'!?\[(?:[^\[\]\\]|\\[\[\]])*?\]\((?P<q>"?)(?:(?<=")[^"<>\s]+|[^<>\s"\)]+)(?P=q)(?:\s[^)]{0,200})?\)'
)

# HTML void and container elements. Every valid tag stays whole, and a
# container tag left open at the cut is closed.
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

    Track the open inline constructs: `` `code` ``, *em* and _em_, **strong**
    and __strong__, ((stage directions)), and the container tags in
    _HTML_CONTAINER. Keep a whole [link](url), ![image](url), HTML tag, or
    <!-- comment --> together. Return the longest prefix whose kept text, the
    closers of the open constructs, and suffix fit in max_width, and drop a
    unit that does not fit. A spurious closer renders as literal text, so the
    scan closes whenever in doubt. The delimiters in text must be balanced and
    nested, as in a value the table emits untruncated.
    """
    if len(text) <= max_width:
        return text

    # Clean cut points as (kept_end, open-closer stack). Record a cut after
    # content and never right after an opener, so that every closed span has
    # content.
    candidates = [(0, ())]
    stack = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]

        # Inside code, an unescaped closing backtick ends the span
        if stack and stack[-1] == '`':
            if ch == '`' and text[i - 1] != '\\':
                stack.pop()
            i += 1
            candidates.append((i, tuple(stack)))
            continue

        # Keep a link or image whole
        if ch == '!' or ch == '[':
            atom = _LINK_ATOM_RE.match(text, i)
            if atom:
                i = atom.end()
                candidates.append((i, tuple(stack)))
                continue

        # Keep an HTML comment or tag whole, and track container tags to close
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
                    # Record a cut only after content, as for the delimiters
                    stack.append('</' + name + '>')
                else:
                    # Void, self-closing, or unknown tag: keep it whole
                    candidates.append((i, tuple(stack)))
                continue
            # Treat a lone '<' as plain text

        # Open code
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

        # Strong and emphasis, longest delimiter first. Open only before a
        # character that is neither space nor the delimiter, as markdeep's
        # flanking rule does, so that "2 * 3" stays literal.
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
            # Treat an invalid delimiter as plain text

        # Plain content character
        i += 1
        candidates.append((i, tuple(stack)))

    # Pick the longest prefix whose closed, suffixed form fits max_width.
    best = suffix[:max_width]
    best_end = -1
    for end, snap in candidates:
        kept = text[:end].rstrip()
        # Strip a trailing ` or \, because markdeep closes a code span only after
        # another character
        if snap and snap[-1] == '`':
            kept = kept.rstrip('\\`')
        out = kept + ''.join(reversed(snap)) + suffix
        if len(out) <= max_width and end > best_end:
            best, best_end = out, end
    return best


def generate_markdown_table(rows, caption="", outer_border=False, padding=True, truncate_suffix="…"):
    """
    Markdown table text for rows. rows[0] is the header row; each header cell
    is a value or a dict {"value", "max_width", "min_width", "halign"}, with
    halign "left", "center", "right", or None. A value is a str, int, float,
    or bool. caption is Markdeep caption syntax, placed below the table.
    outer_border adds a leading and trailing | to each row. padding pads cells
    to an ASCII grid. truncate_suffix ends each cell cut to its max_width.

    Raises ValueError when rows is empty, contains None, or has a row with
    more cells than the header.
    """
    if not rows:
        raise ValueError("rows cannot be empty")
    
    # Column specs from the header row
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
            
            if row_idx == 0:
                cell_str = col_specs[col_idx]["value"]
            elif isinstance(cell, dict):
                cell_str = str(cell.get("value", ""))
            else:
                cell_str = str(cell)
            
            if '\n' in cell_str:
                cell_str = cell_str.replace('\n', '<br>')
            
            if '<br>' in cell_str:
                row_has_br = True
            
            if col_idx < len(col_specs):
                max_w = col_specs[col_idx]["max_width"]
                if max_w is not None:
                    cell_str = truncate_markdown(cell_str, max_w, truncate_suffix)
            
            processed_row.append(cell_str)
        
        while len(processed_row) < num_cols:
            processed_row.append("")
        
        processed_rows.append((processed_row, row_has_br))
    
    # Column widths
    col_widths = [spec["min_width"] for spec in col_specs]
    if padding:
        for processed_row, row_has_br in processed_rows:
            if not row_has_br:  # leave a row with <br> unpadded
                for col_idx, cell in enumerate(processed_row):
                    col_widths[col_idx] = max(col_widths[col_idx], len(cell))
    
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
    
    # Separator row. It joins cells with "|" and the other rows with " | ", so
    # widen each edge cell by 1 and each inner cell by 2 to line up the pipes.
    sep_cells = []
    num_sep_cols = len(col_specs)
    for col_idx, spec in enumerate(col_specs):
        base_width = col_widths[col_idx] if padding else 3
        if num_sep_cols == 1:
            width = base_width
        elif col_idx == 0:
            width = base_width + 1
        elif col_idx == num_sep_cols - 1:
            width = base_width + 1
        else:
            width = base_width + 2
        
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
    """Cells of a Markdeep table row, split on '|' after one leading and one
    trailing border bar are removed."""
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
    The table whose caption is `[Table [label]: caption]` in source, parsed
    into headers, alignment, and data rows. The caption is on the line
    below the table, as replaceTables() in markdeep2.js requires.

    Returns a dict with the keys caption, id, header_row, align_row, data,
    line_start, line_length, char_start, and char_length.

    Raises TableExtractError when the label is absent, appears more than once,
    or is not below a well-formed table.
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
    """Pad text with spaces to width for halign. None pads on the right."""
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


# A list item line is indentation, then a bullet or number, a box, or both. The
# boxes are the task items and the collapsible marker.
_LIST_ITEM_RE = re.compile(r'^(?P<indent>[ \t]*)(?:(?P<marker>\d+\.|[-*+])(?:[ \t]+|$))?(?:(?P<box>\[[ xX>]\]|[☐☑▸])(?:[ \t]+|$))?(?P<rest>.*)$')
_FENCE_RE = re.compile(r'^[ \t]*(```|~~~)')
_CHECKED_BOXES = ('[x]', '[X]', '☑')
_OPEN_BOXES = ('[ ]', '☐')
_COLLAPSIBLE_BOXES = ('[>]', '▸')


class ListItem:
    """One item of a checklist and the items nested under it.

    `content` is the item's own text, multiline, without its marker, box, or
    children. `checklist` is None until a Checklist contains the item.
    An item whose fields still equal the parsed values serializes as its source
    lines; a change to any field regenerates its lines from the fields.
    """

    def __init__(self, type: str = 'ordered', marker: str = '1.', checkable: bool = True,
                 checked: bool = False, content: str = '',
                 children: Optional[List['ListItem']] = None,
                 parent: Optional['ListItem'] = None) -> None:
        self.index = 0
        self.type = type
        self.marker = marker
        self.checkable = checkable
        self.checked = checked
        self.content = content
        self.children: List['ListItem'] = children if children is not None else []
        self.parent = parent
        self.checklist: Optional[object] = None
        self._indent: Optional[str] = None
        self._source: Optional[List[str]] = None
        self._parsed: Optional[tuple] = None
        self._trailing: List[str] = []
        self._parsed_column: Optional[str] = None
        self._indent_offset: Optional[int] = None

    def _fields(self) -> tuple:
        return (self.type, self.marker, self.checkable, self.checked, self.content)


def _content_column(indent: str, marker: str) -> int:
    return len(indent) + len(marker) + (1 if marker else 0)


def find_checklist(text: str) -> Optional[Tuple[int, int]]:
    """Return the line range `(first, end)` of the checklist in `text`, or None.

    Line numbers index `text.splitlines()`, and `end` is exclusive. A top-level
    list begins at a list item in column 0. It ends at its last nonblank line
    before the next line in column 0 that is neither a list item nor inside a
    code fence. The checklist is the first top-level list whose first item is
    numbered and which contains a task item. A line inside a code fence is
    item content.
    """
    first: Optional[int] = None
    last = 0
    numbered = has_task = False
    fence: Optional[str] = None
    for number, body in enumerate(text.splitlines()):
        inside = fence
        match = None if inside else _LIST_ITEM_RE.match(body)
        if match is not None and match['marker'] is None and match['box'] is None:
            match = None
        fence_match = _FENCE_RE.match(body)
        if fence_match is not None and fence in (None, fence_match.group(1)):
            fence = None if fence else fence_match.group(1)
        if not body.strip():
            continue
        if first is not None and match is None and inside is None and body[:1] not in (' ', '\t'):
            if numbered and has_task:
                return first, last + 1
            first = None
        if first is None:
            if match is None or match['indent']:
                continue
            first, numbered, has_task = number, (match['marker'] or '')[:1].isdigit(), False
        last = number
        has_task = has_task or (match is not None and match['box'] in _CHECKED_BOXES + _OPEN_BOXES)
    if first is not None and numbered and has_task:
        return first, last + 1
    return None


def parse_checklist(text: str) -> List[ListItem]:
    """Parse the list in `text` into its top-level ListItems.

    An item's content is its first line after the box and every following line
    up to the next item, including each line inside a code fence.
    An item nests under the nearest earlier item with less indentation. Raises
    ValueError when `text` does not begin with a list item.
    """
    roots: List[ListItem] = []
    stack: List[ListItem] = []
    fence: Optional[str] = None
    for line in text.splitlines(keepends=True):
        body = line.rstrip('\r\n')
        match = None if fence else _LIST_ITEM_RE.match(body)
        if match is None or (match['marker'] is None and match['box'] is None):
            if not stack:
                raise ValueError(f'a checklist must begin with a list item: {body!r}')
            source = stack[-1]._source
            assert source is not None
            source.append(line)
            fence_match = _FENCE_RE.match(body)
            if fence_match is not None and fence in (None, fence_match.group(1)):
                fence = None if fence else fence_match.group(1)
            continue
        while stack and len(stack[-1]._indent or '') >= len(match['indent']):
            stack.pop()
        marker = match['marker'] or ''
        ordered = marker[:1].isdigit()
        # Treat a collapsible marker on an ordered item as text.
        literal_box = ordered and match['box'] in _COLLAPSIBLE_BOXES
        siblings = stack[-1].children if stack else roots
        item = ListItem(
            type='ordered' if ordered else
            'collapsable' if match['box'] in _COLLAPSIBLE_BOXES else 'unordered',
            marker=marker, checkable=match['box'] in _CHECKED_BOXES + _OPEN_BOXES,
            checked=match['box'] in _CHECKED_BOXES,
            content=body[match.start('box'):] if literal_box else match['rest'],
            parent=stack[-1] if stack else None)
        item.index = len(siblings)
        item._indent = match['indent']
        item._source = [line]
        siblings.append(item)
        stack.append(item)
        fence_match = _FENCE_RE.match(match['rest'])
        if fence_match is not None:
            fence = fence_match.group(1)
    for item in _walk(roots):
        _fold_content(item)
    return roots


def _walk(items: List[ListItem]) -> Iterator[ListItem]:
    for item in items:
        yield item
        yield from _walk(item.children)


def _record_position(item: ListItem) -> None:
    """Record the parent's content column and the indent offset at parse time.
    checklist_to_string compares them to detect a re-parented item."""
    parent = item.parent
    item._parsed_column = ('' if parent is None else
                           ' ' * _content_column(parent._indent or '', parent.marker))
    item._indent_offset = (None if parent is None else
                           len(item._indent or '') - len(parent._indent or ''))


def _fold_content(item: ListItem) -> None:
    """Join the continuation lines onto `content`, without their indentation up
    to the item's content column. Trailing blank lines stay out of `content` and
    are kept in `_trailing`, so a rewritten item keeps the gap after it."""
    continuation = (item._source or [])[1:]
    end = len(continuation)
    while end > 0 and continuation[end - 1].strip() == '':
        end -= 1
    item._trailing = continuation[end:]
    column = _content_column(item._indent or '', item.marker)
    lines = [line.rstrip('\r\n') for line in continuation[:end]]
    item.content = '\n'.join([item.content] + [line[min(column, len(line) - len(line.lstrip(' \t'))):]
                                                for line in lines])
    item._parsed = item._fields()
    _record_position(item)


def _box(item: ListItem) -> str:
    if item.type == 'collapsable':
        return '[>]'
    if not item.checkable:
        return ''
    return '[x]' if item.checked else '[ ]'


def _item_text(item: ListItem, indent: str, moved: bool = False) -> str:
    if not moved and item._source is not None and item._fields() == item._parsed:
        return ''.join(item._source)
    head = indent + ' '.join(part for part in (item.marker, _box(item)) if part)
    first, *rest = item.content.split('\n')
    pad = ' ' * _content_column(indent, item.marker)
    return ''.join([head + (' ' + first if first else '') + '\n'] +
                   [(pad + line if line else '') + '\n' for line in rest] + item._trailing)


def checklist_to_string(items: List[ListItem]) -> str:
    """Serialize ListItems from parse_checklist back to text.

    Write an item as its source lines while its fields and its parent's content column equal the
    parsed values. Write a changed or new item with a `[x]`, `[ ]`, or `[>]` box, indented like
    the previous sibling, else the next sibling, else at the parent's content column. Write a
    re-parented item at its new parent's content column, and each of its descendants at its new
    parent's indentation plus its recorded indent offset, so the indentation inside the subtree
    is unchanged.
    """
    def emit(items: List[ListItem], column: str, parent_indent: str = '',
             displaced: bool = False) -> Iterator[str]:
        in_place = [not displaced and item._parsed_column == column for item in items]
        # Indent a re-parented item with no sibling before it like the first
        # sibling that stayed
        indent = next((item._indent or '' for item, stays in zip(items, in_place) if stays), column)
        for item, stays in zip(items, in_place):
            if displaced:
                indent = (column if item._indent_offset is None else
                          parent_indent + ' ' * item._indent_offset)
            elif stays:
                indent = item._indent or ''
            yield _item_text(item, indent, displaced or not stays)
            yield from emit(item.children, ' ' * _content_column(indent, item.marker), indent,
                            displaced or not stays)
    return ''.join(emit(items, ''))


__all__ = ['header_anchor', 'definition_anchor',
           'mangle', 'mangle_code', 'remove_html_tags',
           'generate_markdown_table', 'truncate_markdown',
           'extract_table', 'TableExtractError',
           'ListItem', 'parse_checklist', 'checklist_to_string']


if __name__ == '__main__':
    print("Header anchor examples:")
    example1 = ['Introduction', 'Forms of _Being_', 'Addendum']
    print(f"  {example1}")
    print(f"  -> {header_anchor(example1)}")
    print(f"  Expected: introduction/forms_of_being/addendum")
    
    print("\nDefinition anchor examples:")
    example2 = (['API Reference'], 'foo(x, y)')
    print(f"  {example2}")
    print(f"  -> {definition_anchor(*example2)}")
    print(f"  Expected: api_reference/def-foo-fcn")
    
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
