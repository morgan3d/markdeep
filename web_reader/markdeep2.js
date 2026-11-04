// (Note: invisible BOM on this line!)
/** 

  Markdeep2.js
  Version 2.01

  Copyright 2015-2026, Morgan McGuire, https://casual-effects.com
  All rights reserved.

  -------------------------------------------------------------

  See https://casual-effects.com/markdeep for documentation on how to
  use this script make your plain text documents render beautifully
  in web browsers.

  Markdeep was created by Morgan McGuire. It extends the work of:

   - John Gruber's original Markdown
   - Ben Hollis' Maruku Markdown dialect
   - Michel Fortin's Markdown Extras dialect
   - Ivan Sagalaev's highlight.js
   - Contributors to the above open source projects

  -------------------------------------------------------------
 
  You may use, extend, and redistribute this code under the terms of
  the BSD license at https://opensource.org/licenses/BSD-2-Clause.

  Contains highlight.js (https://github.com/isagalaev/highlight.js) by Ivan
  Sagalaev, which is used for code highlighting. (BSD 3-clause license)

  There is an invisible Byte-Order-Marker at the start of this file to
  ensure that it is processed as UTF-8. Do not remove this character or it
  will break the regular expressions in highlight.js.
*/
/**See https://casual-effects.com/markdeep for @license and documentation.
markdeep2.min.js 2.01 (C) 2015-2026 Morgan McGuire
highlight.min.js 11.11.1 (C) 2025 Ivan Sagalaev https://highlightjs.org */
// The public API object under node, and undefined in a browser.
const MARKDEEP_NODE_API = (function() {
'use strict';

// Test this before any read of document or window at load.
const IN_BROWSER = (typeof document !== 'undefined');

const MARKDEEP_FOOTER = '<div id="markdeep_footer" class="markdeepFooter">formatted by <a href="https://casual-effects.com/markdeep" style="color:#999">Markdeep&nbsp;2.01&nbsp;&nbsp;</a><div style="display:inline-block;font-size:13px;font-family:\'Times New Roman\',serif;vertical-align:middle;transform:translate(-3px,-1px)rotate(135deg);">&#x2712;</div></div>';

{
// For minification. This is admittedly scary.
const _ = String.prototype;
_.rp = _.replace;
_.ss = _.substring;
if (!_.endsWith) {
    // For IE11
    _.endsWith = function(S, L) {
        if (L === undefined || L > this.length) {
            L = this.length;
        }
        return this.ss(L - S.length, L) === S;
    };
}

}

/** Enable for debugging to view character bounds in diagrams */
const DEBUG_SHOW_GRID = false;

/** Overlay the non-empty characters of the original source in diagrams */
const DEBUG_SHOW_SOURCE = DEBUG_SHOW_GRID;

/** Use to suppress passing through text in diagrams */
const DEBUG_HIDE_PASSTHROUGH = DEBUG_SHOW_SOURCE;

/** In pixels of lines in diagrams */
const STROKE_WIDTH = 1.25;

const DEBUG_VIEW_SOURCE_MENU = false;

/** attribs are optional */
function entag(tag, content, attribs) {
    return '<' + tag + (attribs ? ' ' + attribs : '') + '>' + content + '</' + tag + '>';
}


function measureFontSize(fontStack) {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '10pt ' + fontStack;
        return ctx.measureText("M").width;
    } catch (e) {
        // Needed for Firefox include...canvas doesn't work for some reason
        return 10;
    }
}
 
// Lucida Console on Windows has capital V's that look like lower case, so don't use it
const codeFontStack = "Menlo,Consolas,monospace";
const codeFontSize  = Math.round(6.5 * 105.1316178 / measureFontSize(codeFontStack)) + '%';

// The content widths include the article padding.
const NAV_WIDTH_PX         = 224;
const ARTICLE_PADDING_PX   = 32;
const CONTENT_MIN_WIDTH_PX = 760;
const CONTENT_MAX_WIDTH_PX = 810;

const BODY_STYLESHEET = entag('style', `@layer md.base{
body{
    margin:0;
    padding:0;
    text-align:justify;
    line-height:150%;
    -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-smoothing:antialiased;
    color:var(--body-color);
    background:var(--page-color);
    font-family:var(--body-font);
    font-size:var(--body-size);
    font-weight:var(--body-weight)
}
}`);

const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1 && navigator.userAgent.indexOf('Seamonkey') === -1;

// CSS cannot derive a dark color from a light one, so each light-dark() lists both.
const ROOT_STYLESHEET = entag('style', `@layer md.base, md.group, md.element;
@layer md.base{
:root{
    color-scheme:light dark;

    --body-font:Tahoma,Arial,sans-serif;
    --heading-font:Georgia,serif;
    --code-font:${codeFontStack};
    --diagram-font:Helvetica,Arial,Roboto,sans-serif;
    --ui-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,"Helvetica Neue",sans-serif;

    --body-size:15px;
    --body-weight:300;
    --heading-weight:600;
    --code-size:${codeFontSize};
    --h1-size:30px;
    --h2-size:26px;
    --h3-size:18px;
    --h4-size:15px;
    --heading-margin:13.4px;
    --heading-padding-top:15px;
    --title-padding-top:15px;

    --page-color:light-dark(#FFF,#202020);
    --body-color:light-dark(#5D5D5D,#B9B9B9);
    --heading-color:light-dark(#000,#FFF);
    --link-color:light-dark(#60a0ce,#99c3ff);

    --overview-mark-width:4px;
    --checkbox-width:1.2em;
    --checkbox-scale:1.5;

    --rule-color:light-dark(#999,#7c7c7c);
    --table-shade:light-dark(#F2F2F2,#2B2B2B);

    --code-background:light-dark(#F8F8F8,#000);
    --inline-code-background:var(--code-background);
    --listing-background:var(--code-background);
    --listing-line:light-dark(#CCC,#4b4b4b);
    --line-number-color:light-dark(#ccc,#4b4b4b);
    --quiet-color:light-dark(#999,#9b9b9b);
    --quote-mark:light-dark(#DDD,#3d3d3d);
    --quote-text:light-dark(#777,#9b9b9b);
    --diagram-stroke:light-dark(#000,#B9B9B9);
    --diagram-open:light-dark(#fff,#1f2126);
    --diagram-shade:light-dark(#CCC,#4b4b4b);
    --region-fill:light-dark(#F0F0F0,#303030);
    --table-line:light-dark(#888,#7a7a7a);
    --syntax-text:light-dark(#000000,#D4D4D4);         /* editor.foreground */
    --syntax-comment:light-dark(#008000,#6A9955);      /* comment */
    --syntax-keyword:light-dark(#0000FF,#569CD6);      /* keyword */
    --syntax-literal:light-dark(#0000FF,#569CD6);      /* constant.language */
    --syntax-constant:light-dark(#0070C1,#4FC1FF);     /* variable.other.constant */
    --syntax-number:light-dark(#098658,#B5CEA8);       /* constant.numeric */
    --syntax-string:light-dark(#A31515,#CE9178);       /* string */
    --syntax-escape:light-dark(#EE0000,#D7BA7D);       /* constant.character.escape */
    --syntax-regexp:light-dark(#811F3F,#D16969);       /* string.regexp */
    --syntax-type:light-dark(#267F99,#4EC9B0);         /* entity.name.type */
    --syntax-function:light-dark(#795E26,#DCDCAA);     /* entity.name.function */
    --syntax-variable:light-dark(#001080,#9CDCFE);     /* variable */
    --syntax-key:light-dark(#0451A5,#9CDCFE);          /* support.type.property-name.json */
    --syntax-property:light-dark(#E50000,#9CDCFE);     /* support.type.property-name */
    --syntax-tag:light-dark(#800000,#569CD6);          /* entity.name.tag */
    --syntax-tag-bracket:light-dark(#800000,#808080);  /* punctuation.definition.tag */
    --syntax-selector:light-dark(#800000,#D7BA7D);     /* entity.other.attribute-name.class.css */
    --syntax-meta:light-dark(#0000FF,#569CD6);         /* meta.preprocessor */
    --syntax-section:light-dark(#800000,#569CD6);      /* markup.heading */
    --syntax-bullet:light-dark(#0451A5,#6796E6);       /* punctuation.definition.list.begin.markdown */
    --syntax-quote:light-dark(#0451A5,#6A9955);        /* punctuation.definition.quote.begin.markdown */
    --syntax-strong:light-dark(#000080,#569CD6);       /* markup.bold */
    --syntax-emphasis:light-dark(#800080,#C586C0);     /* markup.italic */
    --syntax-code:light-dark(#800000,#CE9178);         /* markup.inline.raw */

    --table-line-width:1px;
    --table-column-gap:36px;
    --table-edge-padding:15px;
    --admonition-icon:light-dark(black,white);

    --today-background:light-dark(#ECF8FA,#233034);
    --inset-background:light-dark(#f5f5f4,#26282c);
    --menu-background:light-dark(#383838,#101114);
    --menu-line:light-dark(#999,#4a4d55);
    --menu-text:light-dark(#fff,#e6e8ec);
    --menu-hover:light-dark(#1659d1,#3f7ae6);
    --preview-line:light-dark(#a2a9b1,#5c626b);
    --preview-text:light-dark(#54595d,#a8adb4);
    --preview-url-background:light-dark(#f5f5f5,#1b1b1b);
    --preview-width:450px;
    --preview-height:169px;
    --preview-page-width:450px;
    --preview-page-height:300px;
    --preview-block-width:300px;
    --preview-block-height:300px;
    --preview-url-height:20px;
    --preview-frame-height:calc(var(--preview-height) - var(--preview-url-height));
    --preview-viewport-height:450px;
    --preview-scale:0.75;
    --beak-size:8px;
    --attribution-text:light-dark(#FFF,#FFF);
    --code-radius:8px;
    --menu-shadow:0px 3px 10px rgba(0,0,0,35%);

    --content-max-width:${CONTENT_MAX_WIDTH_PX}px;
    --content-min-width:${CONTENT_MIN_WIDTH_PX}px;
    --nav-size:${NAV_WIDTH_PX}px;
    --article-padding:${ARTICLE_PADDING_PX}px
}

@media (orientation:landscape) and (max-height:500px){
    :root{
        --body-size:18px;
        --article-padding:48px;
        --content-max-width:100%
    }
}

@media print{:root{color-scheme:only light}}
}`);

/** You can embed your own stylesheet AFTER the <script> tags in your
    file to override these defaults. These rules are in cascade layers, so
    any unlayered author rule overrides them. */
const STYLESHEET = entag('style', `
@layer md.base{

@media print{*{print-color-adjust:exact;-webkit-print-color-adjust:exact;text-shadow:none !important}}

body{counter-reset: h2 paragraph line item list-item}

@page{margin:0;size:auto}

#mdContextMenu{position:absolute;top:0;left:0;background:var(--menu-background);cursor:default;border:1px solid var(--menu-line);color:var(--menu-text);padding:4px 0px;font-family:var(--ui-font);font-size:85%;font-weight:600;border-radius:4px;box-shadow:var(--menu-shadow)}
#mdContextMenu div{padding:0px 20px}
#mdContextMenu div:hover{background:var(--menu-hover)}

#mdLinkPreview{position:fixed;display:none;box-sizing:border-box;
    background:var(--page-color);
    border:1px solid var(--preview-line);border-radius:var(--code-radius);
    box-shadow:var(--menu-shadow);z-index:999999;
    width:var(--preview-width);height:var(--preview-height);
    overflow:visible;opacity:0;cursor:pointer}
#mdLinkPreview[data-visible]{display:block}
#mdLinkPreview[data-kind=page]{--preview-width:var(--preview-page-width);
    --preview-height:var(--preview-page-height)}
#mdLinkPreview[data-kind=block]{--preview-width:var(--preview-block-width);
    --preview-height:var(--preview-block-height)}
@keyframes mdPreviewInDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
@keyframes mdPreviewInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
#mdLinkPreview[data-side=below]{animation:mdPreviewInUp 0.3s ease forwards}
#mdLinkPreview[data-side=above]{animation:mdPreviewInDown 0.3s ease forwards}
@media (prefers-reduced-motion:reduce){
    #mdLinkPreview[data-side]{animation-name:none;opacity:1}
}

#mdLinkPreview::before,#mdLinkPreview::after{content:'';position:absolute;
    border:var(--beak-size) solid transparent;pointer-events:none}
#mdLinkPreview::after{border-width:calc(var(--beak-size) - 1px)}
#mdLinkPreview[data-side=below]::before{border-top:0;
    border-bottom:var(--beak-size) solid var(--preview-line);
    top:calc(0px - var(--beak-size));left:var(--beak-left)}
#mdLinkPreview[data-side=below]::after{border-top:0;
    border-bottom:calc(var(--beak-size) - 1px) solid var(--preview-url-background);
    top:calc(1px - var(--beak-size));left:calc(var(--beak-left) + 1px)}
#mdLinkPreview[data-side=above]::before{border-bottom:0;
    border-top:var(--beak-size) solid var(--preview-line);
    bottom:calc(0px - var(--beak-size));left:var(--beak-left)}
#mdLinkPreview[data-side=above]::after{border-bottom:0;
    border-top:calc(var(--beak-size) - 1px) solid var(--preview-url-background);
    bottom:calc(1px - var(--beak-size));left:calc(var(--beak-left) + 1px)}

#mdLinkPreview .md-preview-frame{position:relative;overflow:hidden;flex:1 1 0;min-height:0}
#mdLinkPreview[data-side=below] .md-preview-frame{
    border-bottom-left-radius:calc(var(--code-radius) - 1px);
    border-bottom-right-radius:calc(var(--code-radius) - 1px)}
#mdLinkPreview[data-side=above] .md-preview-frame{
    border-top-left-radius:calc(var(--code-radius) - 1px);
    border-top-right-radius:calc(var(--code-radius) - 1px)}
#mdLinkPreview iframe{width:calc(var(--preview-width) / var(--preview-scale));
    height:var(--preview-viewport-height);border:none;display:block;
    transform:scale(var(--preview-scale));transform-origin:0 0;pointer-events:none}
#mdLinkPreview img{max-width:100%;max-height:var(--preview-frame-height);
    object-fit:contain;display:block;margin:auto;padding-top:8px}

#mdLinkPreview{display:none;flex-direction:column}
#mdLinkPreview[data-visible]{display:flex}
#mdLinkPreview[data-side=above]{flex-direction:column-reverse}
#mdLinkPreview .md-preview-url{flex:0 0 auto;height:var(--preview-url-height);
    box-sizing:border-box;background:var(--preview-url-background);
    color:var(--preview-text);font-family:Arial,Helvetica,sans-serif;font-size:9px;
    line-height:14px;padding:3px 6px;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;direction:rtl;text-align:left}
#mdLinkPreview .md-preview-url span{direction:ltr;unicode-bidi:isolate}
#mdLinkPreview[data-side=below] .md-preview-url{border-bottom:1px solid var(--preview-line);
    border-top-left-radius:var(--code-radius);border-top-right-radius:var(--code-radius)}
#mdLinkPreview[data-side=above] .md-preview-url{border-top:1px solid var(--preview-line);
    border-bottom-left-radius:var(--code-radius);border-bottom-right-radius:var(--code-radius)}

.md code,.md pre{
    font-family:var(--code-font);
    font-size:var(--code-size);
    text-align:left;
    line-height:normal;
    white-space:pre
}

.md pre{overflow-x:auto}

.md :not(pre)>code{background:var(--inline-code-background);border-radius:4px;padding:0 4px;white-space:pre-wrap;overflow-wrap:break-word}

.md table.table code{background:none}

.md .longTOC code,.md h1 code,.md h2 code,.md h3 code,.md h4 code,.md h5 code,.md h6 code{font-size:unset}

.md .longTOC a:link:hover,
.md .longTOC a:visited:hover {
    text-decoration: none;
}
.md div.afterTitles{height:10px}

.md iframe.textinsert, .md object.textinsert,.md iframe:not(.markdeep){display:block;margin-top:10px;margin-bottom:10px;width:100%;height:75vh;border:1px solid var(--heading-color);border-radius:4px;background:var(--inset-background)}

.md .image{display:inline-block}

/* Center a captioned image block in the content area, and wrap its caption at the text column width */
.md center.wide{width:100cqi;margin-inline:calc((100% - 100cqi) / 2)}
.md center.wide .imagecaption{max-width:calc(min(100cqi, var(--content-max-width)) - 2 * var(--article-padding))}

.md img,.md video{max-width:100%;page-break-inside:avoid}

.md li{text-align:left;text-indent:0}

/* Center with left and translate, because a margin cannot use the element's own width */
.md pre.listing {width:max-content;min-width:100%;max-width:100cqi;position:relative;left:50%;translate:-50%;box-sizing:border-box;tab-size:4;-moz-tab-size:4;-o-tab-size:4;counter-reset:line;overflow-x:auto;resize:vertical;color:var(--syntax-text)}

.md .scrollable{width:100cqi;margin-inline:calc((100% - 100cqi) / 2);overflow-x:auto}
/* installScrollBars() clips the box and adds a sticky bar, so that a sticky table heading inside it sticks to the window */
.md .scrollable.barred{overflow:clip}
.md .scrollable.barred>:first-child{translate:var(--scroll-x,0px) 0}
/* Chrome ignores ::-webkit-scrollbar when scrollbar-color is set; reset it */
.md .scrollable>.scrollbar{display:none;position:sticky;bottom:0;overflow-x:auto;overflow-y:hidden;scrollbar-color:auto;background:var(--page-color)}
.md .scrollable.overflowing>.scrollbar{display:block}
.md .scrollable>.scrollbar>div{height:1px}
.md .scrollable>.scrollbar::-webkit-scrollbar{height:12px}
.md .scrollable>.scrollbar::-webkit-scrollbar-thumb{background:var(--line-number-color);border-radius:6px}
@media print{.md .scrollable{width:auto;margin-inline:0;overflow-x:visible}.md .scrollable.barred{overflow:visible}.md .scrollable.barred>:first-child{translate:none}.md .scrollable>.scrollbar{display:none}}

.md pre.listing .linenumbers span.line:before{width:30px;margin-left:-28px;font-size:80%;text-align:right;counter-increment:line;content:counter(line);display:inline-block;padding-right:13px;margin-right:8px;color:var(--line-number-color)}

.md div.tilde{margin:20px 0 -10px;text-align:center}

.md .imagecaption,.md .tablecaption,.md .listingcaption{
    display:inline-block;
    margin:7px 5px 12px;
    text-align:justify;
    font-style:italic
}

.md img.pixel{image-rendering:-moz-crisp-edges;image-rendering:pixelated}

.md blockquote.fancyquote{margin:25px 0 25px;text-align:left;line-height:160%}

.md blockquote.fancyquote::before{
    content:"“";
    color:var(--quote-mark);
    font-family:Times New Roman;
    font-size:45px;
    line-height:0;
    margin-right:6px;
    vertical-align:-0.3em
}

.md span.fancyquote{font-size:118%;color:var(--quote-text);font-style:italic}

.md span.fancyquote::after{
    content:"”";
    font-style:normal;
    color:var(--quote-mark);
    font-family:Times New Roman;
    font-size:45px;
    line-height:0;
    margin-left:6px;
    vertical-align:-0.3em
}

.md blockquote.fancyquote .author{width:100%;margin-top:10px;display:inline-block;text-align:right}

.md small{font-size:60%}
.md big{font-size:150%}

/* Single asterisks are bold and double asterisks italic. Use weight 600: bolder than light text at 300 gives 400, which looks regular. */
.md em.asterisk{font-style:normal;font-weight:600}
.md strong.underscore{font-weight:600}
.md strong.asterisk{font-style:italic;font-weight:inherit}

.md contents,.md .tocHeader,.md h1,.md h2,.md h3,.md h4,.md h5,.md h6,.md .nonumberh1,.md .nonumberh2,.md .nonumberh3,.md .nonumberh4,.md .nonumberh5,.md .nonumberh6{
    text-align:left;
    line-height:100%;
    font-family:var(--heading-font);
    font-weight:var(--heading-weight);
    color:var(--heading-color);
    margin:var(--heading-margin) 0;
    padding:var(--heading-padding-top) 0 3px;
    border-top:none;
    clear:both
}


.md h1,.md h2,.md h3,.md h4,.md h5,.md h6,.md .nonumberh1,.md .nonumberh2,.md .nonumberh3,.md .nonumberh4,.md .nonumberh5,.md .nonumberh6{
    page-break-after:avoid;break-after:avoid
}

.md svg.diagram{
    display:block;
    font-family:var(--code-font);
    font-size:var(--code-size);
    text-align:center;
    stroke-linecap:round;
    stroke-width:${STROKE_WIDTH}px;
    page-break-inside:avoid;
    stroke:var(--diagram-stroke);
    fill:var(--diagram-stroke)
}

.md svg.diagram .opendot{fill:var(--diagram-open)}
.md svg.diagram .shadeddot{fill:var(--diagram-shade)}
.md svg.diagram .dotteddot{stroke:var(--diagram-stroke);stroke-dasharray:4;fill:none}
.md svg.diagram text{stroke:none}

.md svg.diagram path.diagram-region{fill:var(--region-fill);stroke:none}

.md svg.diagram.no-region path.diagram-region,
.md .no-region svg.diagram path.diagram-region{visibility:hidden}

.md svg.diagram text.diagram-text{font-family:var(--diagram-font);font-size:108%}
.md svg.diagram text.diagram-text.left{text-anchor:start}
.md svg.diagram text.diagram-text.center{text-anchor:middle}
.md svg.diagram text.diagram-text.right{text-anchor:end}

@media print{@page{margin:1in 5mm;transform: scale(150%)}}

/* pagebreak hr */
@media print{.md .pagebreak{page-break-after:always;visibility:hidden}}

.md h1,.md .nonumberh1{font-size:var(--h1-size);padding-top:var(--title-padding-top);counter-reset:h2 h3 h4 h5 h6}

.md .tocHeader{border-bottom:3px solid;font-size:var(--h2-size)}

.md h2,.md .nonumberh2{counter-reset:h3 h4 h5 h6;padding-bottom: 4px;border-bottom:2px solid;font-size:var(--h2-size)}

.md h3,.md .nonumberh3{font-size:var(--h3-size)}
.md h4,.md h5,.md h6,.md .nonumberh4,.md .nonumberh5,.md .nonumberh6{font-size:var(--h4-size)}

.md h3{counter-reset:h4 h5 h6}
.md h4{counter-reset:h5 h6}
.md h5{counter-reset:h6}

.md dl.metadata{
    display:grid;
    grid-template-columns:max-content 1fr;
    column-gap:1em;
    row-gap:2px;
    margin:0 0 1.2em;
    text-align:left
}
.md dl.metadata>dt{font-weight:var(--heading-weight);color:var(--body-color)}
.md dl.metadata>dd{margin:0}

.md div.table{margin:16px 0 16px 0}

.md table{border-collapse:collapse;line-height:140%}
.md table.table{margin:auto}
.md table:not(.longtable){break-inside:avoid-page}
.md table.longtable th{top:0;position:sticky;background:var(--page-color)}
@media print{.md table.longtable th{position:static;top:auto}}

.md table.calendar{width:100%;margin:auto;font-size:11px;font-family:var(--body-font)}
.md table.calendar th{font-size:16px}
.md .today{background:var(--today-background)}
.md .calendar .parenthesized{color:var(--quiet-color);font-style:italic}

.md table.table th{
    border-bottom:var(--table-line-width) solid var(--table-line);
    padding:8px calc(var(--table-column-gap) / 2)
}

.md table.table td{padding:5px calc(var(--table-column-gap) / 2)}

.md table.table th:first-child,.md table.table td:first-child{padding-left:var(--table-edge-padding)}
.md table.table th:last-child,.md table.table td:last-child{padding-right:var(--table-edge-padding)}

.md table.table tr:nth-child(even){background:var(--table-shade)}

.md pre.tilde{
    border: 1px solid var(--listing-line);
    border-radius: var(--code-radius);
    padding: 5px 0 5px 20px;
    margin:0 0 0 0;
    background:var(--listing-background);
    page-break-inside:avoid
}

.md a.target{font-size:0px;line-height:0;visibility:hidden;position:relative;top:-20px}
.md .deprecated-id-definition::after{content:":"}
.md .deprecated-alias-definition::before{content:" (#"}
.md .deprecated-alias-definition::after{content:")"}
.md a:link, .md a:visited,.md [data-layout=menu] summary{color:var(--link-color);text-decoration:none}
.md a:link:hover{text-decoration:underline}

.md a{overflow-wrap:break-word}

.md dt{font-weight:700}

.md dl>dd{margin-top:-8px; margin-bottom:8px}

.md dl>table{margin:35px 0 30px}
.md dl>table dd,.md dl>table dd>p:first-child{margin-top:0}

.md code{page-break-inside:avoid}
@media print{.md .listing code{white-space:pre-wrap}.md pre.listing{resize:none;width:auto;max-width:none;left:auto;translate:none}.md center.wide{width:auto;margin-inline:0}}

.md .endnote{font-size:13px;line-height:15px;padding-left:10px;text-indent:-10px}

.md .bib{padding-left:80px;text-indent:-80px;text-align:left}

.markdeepFooter{font-size:9px;text-align:right;padding-top:2px;color:var(--quiet-color);clear:both}

.md :is(.longTOC,.insetTOC) a {
    gap: 0;
}

.md :is(.longTOC,.insetTOC) a::before {
    margin-right: 0.5em;
}
    
.md :is(.longTOC,.insetTOC) ol{list-style:none;margin:0;padding:0}
.md :is(.longTOC,.insetTOC) li.level4{--overview-indent:1.2em}
.md :is(.longTOC,.insetTOC) li.level5{--overview-indent:2.4em}
.md :is(.longTOC,.insetTOC) li.level6{--overview-indent:3.6em}
.md :is(.longTOC,.insetTOC) a{
    display:flex;
    width: fit-content;
    max-width: 100%
    align-items:baseline;
    border-left:var(--overview-mark-width) solid transparent;
    padding-left:calc(6px + var(--overview-indent,0em))
}
.md :is(.longTOC,.insetTOC) a[aria-current=location]{border-left-color:var(--link-color)}
.md .longTOC li.level2>a{font-weight:600;padding-top:12px}

.md .longTOC li:not(.level2)>a{font-size:85%;line-height:115%;padding-bottom:3px}
.md .longTOC code,.md .insetTOC code{background:none}

.md .insetTOC{float:right;font-size:12px;line-height:15px;border-left:1px solid var(--listing-line);padding-left:15px;margin:15px 0px 15px 25px;max-width:180px;text-align:left}
.md .insetTOC li.level2>a{font-weight:600}
.md .insetTOC li.level4{display:none}

body.md,#main{display:grid;min-height:0;min-width:0}
body.md>*,#main>*{min-height:0;min-width:0}
body.md,#main{grid-template-columns:auto minmax(0,1fr) auto}

body.md{grid-template-rows:auto auto minmax(0,1fr) auto auto}
#main{grid-template-rows:auto minmax(0,1fr) auto}
body.md>#site_header{grid-column:1/4;grid-row:1}
body.md>#main{grid-column:2;grid-row:3}
body.md>#site_footer{grid-column:1/4;grid-row:5}
#main>#content{grid-column:2;grid-row:2}

body.md>[data-align=top]{grid-column:1/4;grid-row:2}
body.md>[data-align=bottom]{grid-column:1/4;grid-row:4}
body.md>[data-align=left]{grid-column:1;grid-row:3;width:var(--nav-size)}
body.md>[data-align=right]{grid-column:3;grid-row:3;width:var(--nav-size)}
#main>[data-align=left]{grid-column:1;grid-row:2;width:var(--nav-size)}
#main>[data-align=right]{grid-column:3;grid-row:2;width:var(--nav-size)}


.md [data-align=none]{display:none}

#main_nav{
    font-family:var(--body-font);
    font-size:var(--body-size);
    text-align:left;
    padding:calc(var(--article-padding) + var(--heading-margin) + var(--title-padding-top)) 0 0 var(--article-padding)
}
#main_nav a:link,#main_nav a:visited{color:var(--heading-color)}
#main_nav p{margin:0}
#main_nav .longTOC>ol>li:first-child>a{padding-top:0}
#article>p:first-child{margin:0}

#site_header, #site_footer, #site_nav {
padding: 8px var(--article-padding);
}

#site_header{background-color:inherit}

#site_header>:first-child,#site_nav>:first-child,#site_footer>:first-child,
#main_nav>:first-child,#main_header>:first-child,#main_footer>:first-child{margin-top:0}
#site_header>:last-child,#site_nav>:last-child,#site_footer>:last-child,
#main_nav>:last-child,#main_header>:last-child,#main_footer>:last-child{margin-bottom:0}

#article{box-sizing:border-box;margin:0 auto;width:100%;max-width:var(--content-max-width);padding:0 var(--article-padding)}

#main_header,#main_footer{box-sizing:border-box;width:100%;padding:0 max(var(--article-padding),calc((100% - var(--content-max-width))/2 + var(--article-padding)))}
#main_header{padding-top:var(--article-padding)}
#main_footer{padding-bottom:var(--article-padding)}

#content{display:flex;flex-direction:column;container-type:inline-size}
#article{flex:1 0 auto}

.md [data-layout=cols]>ul:first-child,.md [data-layout=menu]>ul:first-child{margin:0;padding:0}
.md [data-layout=cols]>ul:first-child li,.md [data-layout=menu]>ul:first-child li{list-style:none;text-align:left;text-indent:0}
.md [data-layout=cols]>ul:first-child>li,.md [data-layout=menu]>ul:first-child>li{display:inline-block;vertical-align:top}

.md [data-layout=menu]>ul:first-child>li{padding-right:1.5em}
.md [data-layout=cols]>ul:first-child>li{width:var(--nav-size)}
.md [data-layout=cols]>ul:first-child ul{margin:0;padding:0}

.md [data-layout=menu] li.collapsible>details>summary:before{display:none}
.md [data-layout=menu]>ul:first-child li{position:relative}
.md [data-layout=menu]>ul:first-child details>ul{position:absolute;top:100%;left:0;z-index:1;min-width:100%;width:max-content;background:Canvas;color:CanvasText;padding:4px 12px;border:1px solid rgba(128,128,128,.4);border-radius:4px;box-shadow:0px 3px 12px 6px rgba(0,0,0,.2)}
.md [data-layout=menu]>ul:first-child details details>ul{top:0;left:100%}

.md .img-attrib-container .img-attrib{font-size:50%;line-height:120%;writing-mode:vertical-rl;position:absolute;bottom:0;right:0;padding:8px 4px;color:var(--attribution-text);background-color:rgba(0,0,0,.3)}
.md .img-attrib-container .img-attrib a{color:var(--attribution-text);text-decoration:none}

.md .admonition{
    position:relative;
    margin:1em 0;
    padding:.4rem 1rem;
    border-radius:.2rem;
    border-left:2.5rem solid rgba(68,138,255,.4);
    background-color:rgba(68,138,255,.15)
}

.md .admonition-title{
    font-weight:bold;
    border-bottom:solid 1px rgba(68,138,255,.4);
    padding-bottom:4px;
    margin-bottom:4px;
    margin-left: -1rem;
    padding-left:1rem;
    margin-right:-1rem;
    border-color:rgba(68,138,255,.4)
}

.md .admonition.tip{border-left:2.5rem solid rgba(50,255,90,.4);background-color:rgba(50,255,90,.15)}

.md .admonition.tip::before{
    content:"ⓘ";
    font-weight:bold;
    font-size:${isFirefox ? '200%' : '150%'};
    position:relative;
    top:3px;
    color:var(--admonition-icon);
    left:-2.95rem;
    display:block;
    width:0;
    height:0
}

.md .admonition.tip>.admonition-title{border-color:rgba(50,255,90,.4)}

.md .admonition.warn,.md .admonition.warning{border-left:2.5rem solid rgba(255,145,0,.4);background-color:rgba(255,145,0,.15)}

.md .admonition.warn::before,.md .admonition.warning::before{
    content:"⚠";
    font-weight:bold;
    ${isFirefox ? '' : 'font-size:150%;'}
    position:relative;
    top:2px;
    color:var(--admonition-icon);
    left:-2.95rem;
    display:block;
    width:0;
    height:0
}

.md .admonition.warn>.admonition-title,.md .admonition.warning>.admonition-title{border-color:rgba(255,145,0,.4)}

.md .admonition.error{border-left: 2.5rem solid rgba(255,23,68,.4);background-color:rgba(255,23,68,.15)}

.md .admonition.error>.admonition-title{border-color:rgba(255,23,68,.4)}

.md .admonition.error::before{
    content: "☒";
    font-family:"Arial";
    font-size:${isFirefox ? '150%' : '200%'};
    position:relative;
    color:var(--admonition-icon);
    top:-2px;
    left:-3rem;
    display:block;
    width:0;
    height:0
}

.md .admonition p:last-child{margin-bottom:0}

.md li.checked_box,.md li.unchecked_box{overflow:visible}
.md li.checked_box{opacity:50%}
.md li.unchecked_box{opacity:100%}
.md ul>li.checked_box,.md ul>li.unchecked_box{list-style:none}
.md ol>li.checked_box,.md ol>li.unchecked_box{padding-left:calc(var(--checkbox-scale) * var(--checkbox-width))}

.md li.checked_box:before,.md li.unchecked_box:before{content:"☑";display:inline-block;width:var(--checkbox-width);margin-left:calc(-1 * var(--checkbox-width));font-size:calc(var(--checkbox-scale) * 1em);font-weight:600;line-height:0;position:relative;top:0.9px;}

.md li.unchecked_box:before{content:"☐"}

.md li.collapsible{list-style:none;overflow:visible;text-indent:-1.2em}
.md li.collapsible>details>summary{list-style:none;cursor:pointer}

.md li.collapsible>details>summary:before{
    content:"▸";
    display:block;
    float:left;
    width:1em;
    font-size:120%
}

.md li.collapsible>details[open]>summary:before{content:"▾"}

@media print{
    .md li.collapsible>details::details-content{content-visibility:visible;display:block}
    .md li.collapsible>details:not([open])>*{display:block}
    .md li.collapsible>details>summary:before{content:"▾"}
}

.md .stage-direction{opacity:0.6;display:block;font-style:italic;margin:0.5em 0 0.5em 64px}

.md span.stage-direction{display:inline;margin:0}
#mdColorScheme{
    position:fixed;
    top:8px;
    right:24px;
    z-index:1000;
    width:22px;
    height:22px;
    padding:0;
    border-radius:50%;
    border:1px solid var(--listing-line);
    background:var(--page-color);
    color:var(--body-color);
    font-family:Arial,Helvetica,sans-serif;
    font-size:15px;
    line-height:1;
    cursor:pointer;
    display:grid;
    place-items:center
}
#mdColorScheme:hover{border-color:var(--rule-color);color:var(--heading-color)}
#mdColorScheme[data-scheme=auto]{font-size:17px}
@media print{#mdColorScheme{display:none}}

.md .stage-direction:before{content:"⸨";font-style:normal}
.md .stage-direction:after{content:"⸩";font-style:normal}

}`);


// Language options:
const FRENCH = {
    name: 'French',
    keyword: {
        table:     'tableau',
        figure:    'figure',
        listing:   'liste',
        diagram:   'diagramme',
        contents:  'Table des matières',

        sec:       'sec',
        section:   'section',
        subsection: 'paragraphe',
        chapter:   'chapitre',

        Monday:    'lundi',
        Tuesday:   'mardi',
        Wednesday: 'mercredi',
        Thursday:  'jeudi',
        Friday:    'vendredi',
        Saturday:  'samedi',
        Sunday:    'dimanche',

        January:   'Janvier',
        February:  'Février',
        March:     'Mars',
        April:     'Avril',
        May:       'Mai',
        June:      'Juin', 
        July:      'Juillet',
        August:    'Août', 
        September: 'Septembre', 
        October:   'Octobre', 
        November:  'Novembre',
        December:  'Décembre',

        jan: 'janv.',
        feb: 'févr.',
        mar: 'mars',
        apr: 'avril',
        may: 'mai',
        jun: 'juin',
        jul: 'juil.',
        aug: 'août',
        sep: 'sept.',
        oct: 'oct.',
        nov: 'nov.',
        dec: 'déc.',

        '&ldquo;': '&laquo;&nbsp;',
        '&rdquo;': '&nbsp;&raquo;'
    }
};

// Translated by "Warmist"
const LITHUANIAN = {
    name: 'Lithuanian',
    keyword: {
        table:     'lentelė',
        figure:    'paveikslėlis',
        listing:   'sąrašas',
        diagram:   'diagrama',
        contents:  'Turinys',

        sec:       'sk',
        section:   'skyrius',
        subsection: 'poskyris',
        chapter:   'skyrius',

        Monday:    'pirmadienis',
        Tuesday:   'antradienis',
        Wednesday: 'trečiadienis',
        Thursday:  'ketvirtadienis',
        Friday:    'penktadienis',
        Saturday:  'šeštadienis',
        Sunday:    'sekmadienis',

        January:   'Sausis',
        February:  'Vasaris',
        March:     'Kovas',
        April:     'Balandis',
        May:       'Gegužė',
        June:      'Birželis',
        July:      'Liepa',
        August:    'Rugpjūtis',
        September: 'Rugsėjis',
        October:   'Spalis',
        November:  'Lapkritis',
        December:  'Gruodis',

        jan: 'saus',
        feb: 'vas',
        mar: 'kov',
        apr: 'bal',
        may: 'geg',
        jun: 'birž',
        jul: 'liep',
        aug: 'rugpj',
        sep: 'rugs',
        oct: 'spal',
        nov: 'lapkr',
        dec: 'gruod',

        '&ldquo;': '&bdquo;',
        '&rdquo;': '&ldquo;'
    }
};

    
// Translated by Zdravko Velinov
const BULGARIAN = {
    name: 'Bulgarian',
    keyword: {
        table:     'таблица',
        figure:    'фигура',
        listing:   'списък',
        diagram:   'диаграма',

        contents:  'cъдържание',

        sec:       'сек',
        section:   'раздел',
        subsection: 'подраздел',
        chapter:   'глава',

        Monday:    'понеделник',
        Tuesday:   'вторник',
        Wednesday: 'сряда',
        Thursday:  'четвъртък',
        Friday:    'петък',
        Saturday:  'събота',
        Sunday:    'неделя',

        January:   'януари',
        February:  'февруари',
        March:     'март',
        April:     'април',
        May:       'май',
        June:      'юни', 
        July:      'юли',
        August:    'август', 
        September: 'септември', 
        October:   'октомври', 
        November:  'ноември',
        December:  'декември',

        jan: 'ян',
        feb: 'февр',
        mar: 'март',
        apr: 'апр',
        may: 'май',
        jun: 'юни',
        jul: 'юли',
        aug: 'авг',
        sep: 'септ',
        oct: 'окт',
        nov: 'ноем',
        dec: 'дек',

        '&ldquo;': '&bdquo;',
        '&rdquo;': '&rdquo;'
    }
};


// Translated by Tiago Antão
const PORTUGUESE = {
    name: 'Portuguese',
    keyword: {
        table:     'tabela',
        figure:    'figura',
        listing:   'lista',
        diagram:   'diagrama',
        contents:  'conteúdo',

        sec:       'sec',
        section:   'secção',
        subsection: 'subsecção',
        chapter:   'capítulo',

        Monday:    'Segunda-feira',
        Tuesday:   'Terça-feira',
        Wednesday: 'Quarta-feira',
        Thursday:  'Quinta-feira',
        Friday:    'Sexta-feira',
        Saturday:  'Sábado',
        Sunday:    'Domingo',

        January:   'Janeiro',
        February:  'Fevereiro',
        March:     'Março',
        April:     'Abril',
        May:       'Maio',
        June:      'Junho', 
        July:      'Julho',
        August:    'Agosto', 
        September: 'Setembro', 
        October:   'Outubro', 
        November:  'Novembro',
        December:  'Dezembro',

        jan: 'jan',
        feb: 'fev',
        mar: 'mar',
        apr: 'abr',
        may: 'mai',
        jun: 'jun',
        jul: 'jul',
        aug: 'ago',
        sep: 'set',
        oct: 'oct',
        nov: 'nov',
        dec: 'dez',

        '&ldquo;': '&laquo;',
        '&rdquo;': '&raquo;'
    }
};


// Translated by Jan Toušek
const CZECH = {
    name: 'Czech',
    keyword: {
        table:     'Tabulka',
        figure:    'Obrázek',
        listing:   'Seznam',
        diagram:   'Diagram',

        contents:  'Obsah',

        sec:       'kap.',  // Abbreviation for section
        section:   'kapitola',
        subsection:'podkapitola',
        chapter:   'kapitola',

        Monday:    'pondělí',
        Tuesday:   'úterý',
        Wednesday: 'středa',
        Thursday:  'čtvrtek',
        Friday:    'pátek',
        Saturday:  'sobota',
        Sunday:    'neděle',

        January:   'leden',
        February:  'únor',
        March:     'březen',
        April:     'duben',
        May:       'květen',
        June:      'červen',
        July:      'červenec',
        August:    'srpen',
        September: 'září',
        October:   'říjen',
        November:  'listopad',
        December:  'prosinec',

        jan: 'led',
        feb: 'úno',
        mar: 'bře',
        apr: 'dub',
        may: 'kvě',
        jun: 'čvn',
        jul: 'čvc',
        aug: 'srp',
        sep: 'zář',
        oct: 'říj',
        nov: 'lis',
        dec: 'pro',

        '&ldquo;': '&bdquo;',
        '&rdquo;': '&ldquo;'
    }
};


const ITALIAN = {
    name: 'Italian',
    keyword: {
        table:     'tabella',
        figure:    'figura',
        listing:   'lista',
        diagram:   'diagramma',
        contents:  'indice',

        sec:       'sez',
        section:   'sezione',
        subsection: 'paragrafo',
        chapter:   'capitolo',

        Monday:    'lunedì',
        Tuesday:   'martedì',
        Wednesday: 'mercoledì',
        Thursday:  'giovedì',
        Friday:    'venerdì',
        Saturday:  'sabato',
        Sunday:    'domenica',

        January:   'Gennaio',
        February:  'Febbraio',
        March:     'Marzo',
        April:     'Aprile',
        May:       'Maggio',
        June:      'Giugno', 
        July:      'Luglio',
        August:    'Agosto', 
        September: 'Settembre', 
        October:   'Ottobre', 
        November:  'Novembre',
        December:  'Dicembre',

        jan: 'gen',
        feb: 'feb',
        mar: 'mar',
        apr: 'apr',
        may: 'mag',
        jun: 'giu',
        jul: 'lug',
        aug: 'ago',
        sep: 'set',
        oct: 'ott',
        nov: 'nov',
        dec: 'dic',

        '&ldquo;': '&ldquo;',
        '&rdquo;': '&rdquo;'
    }
};

const RUSSIAN = {
    name: 'Russian',
    keyword: {
        table:     'таблица',
        figure:    'рисунок',
        listing:   'листинг',
        diagram:   'диаграмма',

        contents:  'Содержание',

        sec:       'сек',
        section:   'раздел',
        subsection: 'подраздел',
        chapter:   'глава',

        Monday:    'понедельник',
        Tuesday:   'вторник',
        Wednesday: 'среда',
        Thursday:  'четверг',
        Friday:    'пятница',
        Saturday:  'суббота',
        Sunday:    'воскресенье',

        January:   'январьr',
        February:  'февраль',
        March:     'март',
        April:     'апрель',
        May:       'май',
        June:      'июнь', 
        July:      'июль',
        August:    'август', 
        September: 'сентябрь', 
        October:   'октябрь', 
        November:  'ноябрь',
        December:  'декабрь',

        jan: 'янв',
        feb: 'февр',
        mar: 'март',
        apr: 'апр',
        may: 'май',
        jun: 'июнь',
        jul: 'июль',
        aug: 'авг',
        sep: 'сент',
        oct: 'окт',
        nov: 'ноябрь',
        dec: 'дек',
        
        '&ldquo;': '«',
        '&rdquo;': '»'
    }
};

// Translated by Dariusz Kuśnierek 
const POLISH = {
    name: 'Polish',
    keyword: {
        table:     'tabela',
        figure:    'ilustracja',
        listing:   'wykaz',
        diagram:   'diagram',
        contents:  'Spis treści',

        sec:       'rozdz.',
        section:   'rozdział',
        subsection: 'podrozdział',
        chapter:   'kapituła',

        Monday:    'Poniedziałek',
        Tuesday:   'Wtorek',
        Wednesday: 'Środa',
        Thursday:  'Czwartek',
        Friday:    'Piątek',
        Saturday:  'Sobota',
        Sunday:    'Niedziela',

        January:   'Styczeń',
        February:  'Luty',
        March:     'Marzec',
        April:     'Kwiecień',
        May:       'Maj',
        June:      'Czerwiec', 
        July:      'Lipiec',
        August:    'Sierpień', 
        September: 'Wrzesień', 
        October:   'Październik', 
        November:  'Listopad',
        December:  'Grudzień',

        jan: 'sty',
        feb: 'lut',
        mar: 'mar',
        apr: 'kwi',
        may: 'maj',
        jun: 'cze',
        jul: 'lip',
        aug: 'sie',
        sep: 'wrz',
        oct: 'paź',
        nov: 'lis',
        dec: 'gru',
        
        '&ldquo;': '&bdquo;',
        '&rdquo;': '&rdquo;'
    }
};

// Translated by Sandor Berczi
const HUNGARIAN = {
    name: 'Hungarian',
    keyword: {
        table:     'táblázat',
        figure:    'ábra',
        listing:   'lista',
        diagram:   'diagramm',

        contents:  'Tartalomjegyzék',

        sec:       'fej',  // Abbreviation for section
        section:   'fejezet',
        subsection:'alfejezet',
        chapter:   'fejezet',

        Monday:    'hétfő',
        Tuesday:   'kedd',
        Wednesday: 'szerda',
        Thursday:  'csütörtök',
        Friday:    'péntek',
        Saturday:  'szombat',
        Sunday:    'vasárnap',

        January:   'január',
        February:  'február',
        March:     'március',
        April:     'április',
        May:       'május',
        June:      'június',
        July:      'július',
        August:    'augusztus',
        September: 'szeptember',
        October:   'október',
        November:  'november',
        December:  'december',

        jan: 'jan',
        feb: 'febr',
        mar: 'márc',
        apr: 'ápr',
        may: 'máj',
        jun: 'jún',
        jul: 'júl',
        aug: 'aug',
        sep: 'szept',
        oct: 'okt',
        nov: 'nov',
        dec: 'dec',

        '&ldquo;': '&bdquo;',
        '&rdquo;': '&rdquo;'
    }
};

// Translated by Takashi Masuyama
const JAPANESE = {
    name: 'Japanese',
    keyword: {
        table:     '表',
        figure:    '図',
        listing:   '一覧',
        diagram:   '図',
        contents:  '目次',

        sec:       '節',
        section:   '節',
        subsection: '項',
        chapter:   '章',

        Monday:    '月',
        Tuesday:   '火',
        Wednesday: '水',
        Thursday:  '木',
        Friday:    '金',
        Saturday:  '土',
        Sunday:    '日',

        January:   '1月',
        February:  '2月',
        March:     '3月',
        April:     '4月',
        May:       '5月',
        June:      '6月',
        July:      '7月',
        August:    '8月',
        September: '9月',
        October:   '10月',
        November:  '11月',
        December:  '12月',

        jan: '1月',
        feb: '2月',
        mar: '3月',
        apr: '4月',
        may: '5月',
        jun: '6月',
        jul: '7月',
        aug: '8月',
        sep: '9月',
        oct: '10月',
        nov: '11月',
        dec: '12月',

        '&ldquo;': '「',
        '&rdquo;': '」'
    }
};    
    
// Translated by Sandor Berczi
const GERMAN = {
    name: 'German',
    keyword: {
        table:     'Tabelle',
        figure:    'Abbildung',
        listing:   'Auflistung',
        diagram:   'Diagramm',

        contents:  'Inhaltsverzeichnis',

        sec:       'Kap',
        section:   'Kapitel',
        subsection:'Unterabschnitt',
        chapter:   'Kapitel',

        Monday:    'Montag',
        Tuesday:   'Dienstag',
        Wednesday: 'Mittwoch',
        Thursday:  'Donnerstag',
        Friday:    'Freitag',
        Saturday:  'Samstag',
        Sunday:    'Sonntag',

        January:   'Januar',
        February:  'Februar',
        March:     'März',
        April:     'April',
        May:       'Mai',
        June:      'Juni',
        July:      'Juli',
        August:    'August',
        September: 'September',
        October:   'Oktober',
        November:  'November',
        December:  'Dezember',

        jan: 'Jan',
        feb: 'Feb',
        mar: 'Mär',
        apr: 'Apr',
        may: 'Mai',
        jun: 'Jun',
        jul: 'Jul',
        aug: 'Aug',
        sep: 'Sep',
        oct: 'Okt',
        nov: 'Nov',
        dec: 'Dez',
        
        '&ldquo;': '&bdquo;',
        '&rdquo;': '&ldquo;'
    }
};

// Translated by Marcelo Arroyo
const SPANISH = {
    name: 'Spanish',
    keyword: {
        table:     'Tabla',
        figure:    'Figura',
        listing:   'Listado',
        diagram:   'Diagrama',
        contents:  'Tabla de Contenidos',

        sec:       'sec',
        section:   'Sección',
        subsection: 'Subsección',
        chapter:    'Capítulo',

        Monday:    'Lunes',
        Tuesday:   'Martes',
        Wednesday: 'Miércoles',
        Thursday:  'Jueves',
        Friday:    'Viernes',
        Saturday:  'Sábado',
        Sunday:    'Domingo',

        January:   'Enero',
        February:  'Febrero',
        March:     'Marzo',
        April:     'Abril',
        May:       'Mayo',
        June:      'Junio',
        July:      'Julio',
        August:    'Agosto',
        September: 'Septiembre',
        October:   'Octubre',
        November:  'Noviembre',
        December:  'Diciembre',

        jan: 'ene',
        feb: 'feb',
        mar: 'mar',
        apr: 'abr',
        may: 'may',
        jun: 'jun',
        jul: 'jul',
        aug: 'ago',
        sep: 'sept',
        oct: 'oct',
        nov: 'nov',
        dec: 'dic',

        '&ldquo;': '&laquo;&nbsp;',
        '&rdquo;': '&nbsp;&raquo;'
    }
};

// Translated by Nils Nilsson
const SWEDISH = {
    name: 'Swedish',
    keyword: {
        table:     'tabell',
        figure:    'figur',
        listing:   'lista',
        diagram:   'diagram',

        contents:  'Innehållsförteckning',
        sec:       'sek',
        section:   'sektion',
        subsection:'sektion',
        chapter:   'kapitel',

        Monday:    'måndag',
        Tuesday:   'tisdag',
        Wednesday: 'onsdag',
        Thursday:  'torsdag',
        Friday:    'fredag',
        Saturday:  'lördag',
        Sunday:    'söndag',

        January:   'januari',
        February:  'februari',
        March:     'mars',
        April:     'april',
        May:       'maj',
        June:      'juni',
        July:      'juli',
        August:    'augusti',
        September: 'september',
        October:   'oktober',
        November:  'november',
        December:  'december',

        jan: 'jan',
        feb: 'feb',
        mar: 'mar',
        apr: 'apr',
        may: 'maj',
        jun: 'jun',
        jul: 'jul',
        aug: 'aug',
        sep: 'sep',
        oct: 'okt',
        nov: 'nov',
        dec: 'dec',
        
        '&ldquo;': '&rdquo;',
        '&rdquo;': '&rdquo;'
    }
};


// Translated by Marc Izquierdo and Orestes Mas
const CATALAN = {
    name: 'Catalan',
    keyword: {
        table:     'Taula',
        figure:    'Figura',
        listing:   'Llistat',
        diagram:   'Diagrama',
        contents:  'Taula de Continguts',

        sec:        'sec',
        section:    'Secció',
        subsection: 'Subsecció',
        chapter:    'Capítol',

        Monday:    'Dilluns',
        Tuesday:   'Dimarts',
        Wednesday: 'Dimecres',
        Thursday:  'Dijous',
        Friday:    'Divendres',
        Saturday:  'Dissabte',
        Sunday:    'Diumenge',

        January:   'Gener',
        February:  'Febrer',
        March:     'Març',
        April:     'Abril',
        May:       'Maig',
        June:      'Juny',
        July:      'Juliol',
        August:    'Agost',
        September: 'Setembre',
        October:   'Octubre',
        November:  'Novembre',
        December:  'Desembre',

        jan: 'gen',
        feb: 'feb',
        mar: 'mar',
        apr: 'abr',
        may: 'mai',
        jun: 'jun',
        jul: 'jul',
        aug: 'ago',
        sep: 'set',
        oct: 'oct',
        nov: 'nov',
        dec: 'des',

        '&ldquo;': '&laquo;&nbsp;',
        '&rdquo;': '&nbsp;&raquo;'
    }
};
 
const DEFAULT_OPTIONS = {
    mode:               'markdeep',
    detectMath:         true,
    lang:               {keyword:{}}, // English
    tocDepth:           4,

    // Keyed by output id. 'auto' places each element from its content.
    site_header:        {               content: '', layout: 'auto', style: {}},
    site_nav:           {align: 'auto', content: '', layout: 'auto', style: {}},
    site_footer:        {               content: '', layout: 'auto', style: {}},
    main_nav:           {align: 'auto',              layout: 'auto', style: {}},
    main_header:        {               content: '', layout: 'auto', style: {}},
    main_footer:        {               content: '', layout: 'auto', style: {}},

    // Theme file paths are relative to docToThemePath.
    stylesheets:        {},
    favicon:            '',
    docToThemePath:     '',
    // Names that a link or image address can start with as $name.
    variables:          {},
    hideEmptyWeekends:  true,
    autoLinkImages:     true,
    showLabels:         false,
    sortScheduleLists:  true,
    definitionStyle:    'auto',
    linkAPIDefinitions: true,
    contextMenu:        true,
    showLinkPreviews:   true,
    inlineCodeLang:     false,
    scrollThreshold:    90,
    captionAbove:       {diagram: false,
                         image:   false,
                         table:   true,
                         listing: false},
    smartQuotes:        true,
    style:              {},
    fontStylesheets:    [],
    fontFaces:          [],
    initialColorScheme: 'auto',
    enableColorSchemeChoice: true,
    enableMetadataFormatting: true,
    stripSectionNumbers: true,
    showSectionNumbers: true,
    enableStageDirections: true,
    enableHiddenLineBreak: true,
    enableBackslashLineBreak: true
};


// document.currentScript is set only while this script first runs, so read these at load.
// RENDERER_DIRECTORY is the value of `$markdeep`, with no trailing '/'.
const RENDERER_DIRECTORY = (IN_BROWSER && document.currentScript) ? new URL('.', document.currentScript.src).href.slice(0, -1) : '';
const THEME_SRC = (IN_BROWSER && document.currentScript) ? document.currentScript.dataset.theme : undefined;


// See http://www.i18nguy.com/unicode/language-identifiers.html and
// https://www.loc.gov/standards/iso639-2/php/code_list.php for keys.
const ENGLISH = {name: 'English', keyword:{}};
const LANG_TABLE = {
    en: ENGLISH,        
    ru: RUSSIAN,
    fr: FRENCH,
    'fr-AD': FRENCH,
    'fr-BE': FRENCH,
    'fr-CA': FRENCH,
    'en-CA': ENGLISH,
    'en-VI': ENGLISH,
    pl: POLISH,
    bg: BULGARIAN,
    de: GERMAN,
    hu: HUNGARIAN,
    sv: SWEDISH,
    pt: PORTUGUESE,
    ja: JAPANESE,
    it: ITALIAN,
    lt: LITHUANIAN,
    cs: CZECH,
    es: SPANISH,
    'es-ES': SPANISH,
    'ca-ES': CATALAN,
    'es-CO': SPANISH,
    'es-US': SPANISH,
    'en-US': ENGLISH,    
    ca: CATALAN
    // Contribute your language here! I only accept translations
    // from native speakers.
};

if (IN_BROWSER) {
    [].slice.call(document.getElementsByTagName('meta')).forEach(function(elt) {
        const att = elt.getAttribute('lang');
        if (att) {
            const lang = LANG_TABLE[att];
            if (lang) {
                DEFAULT_OPTIONS.lang = lang;
            }
        }
    });
}


/** JSON Merge Patch (RFC 7396) of `patch` onto `target`, which it changes and returns. A
    plain object merges key by key at every depth, any other value replaces, and null
    removes the key.
    @param {*} target
    @param {*} patch
    @returns {*} */
function mergePatch(target, patch) {
    if ((patch === null) || (typeof patch !== 'object') || Array.isArray(patch)) {
        return patch;
    }
    const result = ((target !== null) && (typeof target === 'object') && ! Array.isArray(target)) ? target : {};
    for (const key in patch) {
        if (patch[key] === null) {
            delete result[key];
        } else {
            result[key] = mergePatch(result[key], patch[key]);
        }
    }
    return result;
}


// Merge the entries from last to first, so that earlier entries win, then merge the
// result onto the defaults, so that null restores a default. Write the result onto the
// array. Under node there are no entries.
/** @type {*} */
const NODE_OPTIONS = [];
{
    const layers = IN_BROWSER ? (window.markdeepOptions ||= []) : NODE_OPTIONS;
    if (! Array.isArray(layers)) {
        throw new Error('markdeepOptions must be an array: write ( window.markdeepOptions ||=[] ).push({...})');
    }
    const computed = mergePatch(mergePatch({}, DEFAULT_OPTIONS), layers.reduceRight(mergePatch, {}));
    if (THEME_SRC) {
        // Ends in '/' so that a theme can append its own file names
        computed.docToThemePath = new URL('.', THEME_SRC).href;

        // Assume the theme is at the repository root unless it sets docToDeprecatedPath
        computed.docToDeprecatedPath = computed.docToDeprecatedPath || computed.docToThemePath;
    }
    // Fall back to the default language, because a lang that is not a language table
    // stops the render at the first localized word.
    if ((typeof computed.lang !== 'object') || (computed.lang === null) || (typeof computed.lang.keyword !== 'object')) {
        console.error('markdeepOptions.lang must be a language table such as markdeep.langTable.fr; got', computed.lang);
        computed.lang = DEFAULT_OPTIONS.lang;
    }
    Object.assign(layers, computed);
}


const max = Math.max;
const min = Math.min;
const abs = Math.abs;
const sign = Math.sign || function (x) {
    return ( +x === x ) ? ((x === 0) ? x : (x > 0) ? 1 : -1) : NaN;
};


/** The merged options: the page's markdeepOptions array in the browser, the defaults under node */
function optionsStore() {
    return IN_BROWSER ? window.markdeepOptions : NODE_OPTIONS;
}


/** Get an option, or return the corresponding value from DEFAULT_OPTIONS */
function option(key, key2) {
    const store = optionsStore();
    if (store && (store[key] !== undefined)) {
        let val = store[key];
        if (key2) {
            val = val[key2]
            if (val !== undefined) {
                return val;
            } else {
                return DEFAULT_OPTIONS[key][key2];
            }
        } else {
            return store[key];
        }
    } else if (DEFAULT_OPTIONS[key] !== undefined) {
        if (key2) {
            return DEFAULT_OPTIONS[key][key2];
        } else {
            return DEFAULT_OPTIONS[key];
        }
    } else {
        console.warn('Illegal option: "' + key + '"');
        return undefined;
    }
}


/** The URL of `name` in the theme directory */
function themeFileURL(name) {
    return new URL(name, option('docToThemePath') || location.href).href;
}


/** Write the `markdeep` and `theme` entries into `markdeepOptions.variables` before any generator
    runs. Keep an entry that a theme or the document set. */
function setURLVariables() {
    const variables = optionsStore().variables;
    if (RENDERER_DIRECTORY && variables.markdeep === undefined) {
        variables.markdeep = RENDERER_DIRECTORY;
    }
    const themePath = option('docToThemePath');
    if (themePath && variables.theme === undefined) {
        variables.theme = themePath.rp(/\/$/, '');
    }
}


/** Expand `$name` directly after each `](` in `line`, except inside inline code. `lineNumber`
    is the document line for the error on an unknown `name`. */
function expandURLVariables(line, table, lineNumber) {
    return line.rp(/(`+)[^`\n]*?\1|\]\(\$([^\/)#?\s]*)/g, function (match, ticks, name) {
        if (ticks !== undefined) {
            return match;
        }
        if (Object.prototype.hasOwnProperty.call(table, name)) {
            return '](' + table[name];
        }
        console.error('Markdeep: unknown URL variable $' + name + ' on line ' + lineNumber);
        return match;
    });
}


/** One link per entry of `stylesheets`, in key order, so that a child theme's sheet follows its parent's */
function themeStylesheetLinks() {
    return Object.values(option('stylesheets')).map(function (name) {
        return '<link rel="stylesheet" href="' + themeFileURL(name) + '">';
    }).join('');
}


// For an unlisted extension, omit the type and let the browser detect it.
const FAVICON_TYPE_TABLE = {
    ico:  'image/x-icon',
    png:  'image/png',
    svg:  'image/svg+xml',
    gif:  'image/gif',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp'
};


/** The favicon link, or '' when the favicon option is empty */
function faviconLink() {
    const name = option('favicon');
    if (! name) { return ''; }

    const extension = name.rp(/[?#].*$/, '').rp(/^.*\./, '').toLowerCase();
    const type = FAVICON_TYPE_TABLE[extension];

    return '<link rel="icon"' + (type ? ' type="' + type + '"' : '') +
        ' href="' + themeFileURL(name) + '">';
}


/** An empty div for a theme to style. `place` is 'before', 'after', 'start', or 'end'. */
function decoration(place) {
    return "<div class='decoration " + place + "'></div>";
}

const DECORATION_REGEXP = /<div class='decoration [a-z]+'><\/div>/g;


// The 'auto' alignment of a site element that has content
const AUTO_ALIGN = {site_nav: 'left'};


// pageStructure() sets this from the converted article before the main_nav alignment is read.
let overviewHasEntries = true;


/** Show a site element with content at its alignment, and hide it otherwise. 'auto' puts
    main_nav on the side that site_nav does not use, and hides it when the overview has
    no entries. */
function alignment(id) {
    // Show the site header and footer, which have fixed positions, only when they have content
    if ((id === 'site_header') || (id === 'site_footer')) {
        return option(id, 'content') ? 'fixed' : 'none';
    }

    const align = option(id, 'align');
    if (align !== 'auto') { return align; }

    if (id === 'main_nav') {
        if (! overviewHasEntries) { return 'none'; }
        return (alignment('site_nav') === 'none') ? 'left' : 'right';
    }

    return option(id, 'content') ? AUTO_ALIGN[id] : 'none';
}


// The 'auto' layout of a leading list at each alignment
const AUTO_LAYOUT = {top: 'menu', bottom: 'cols', left: 'tree', right: 'tree'};


// The 'auto' layout of the site header and footer, which have no alignment
const FIXED_POSITION_LAYOUT = {site_header: 'menu', site_footer: 'cols'};


/** Lay out an element with no alignment as a tree */
function listLayout(id) {
    const layout = option(id, 'layout');
    if (layout !== 'auto') { return layout; }
    return FIXED_POSITION_LAYOUT[id] || AUTO_LAYOUT[alignment(id)] || 'tree';
}


function maybeShowLabel(url, tag) {
    if (option('showLabels')) {
        // Escape the no-break spaces so that they are visible in the source
        const text = ' {\u00A0' + url + '\u00A0}';
        return tag ? entag(tag, text) : text;
    } else {
        return '';
    }
}


// Returns the localized version of word, defaulting to the word itself
function keyword(word) {
    return option('lang').keyword[word] || option('lang').keyword[word.toLowerCase()] || word;
}


/** Converts <>&" to their HTML escape sequences */
function escapeHTMLEntities(str) {
    return String(str).rp(/&/g, '&amp;').rp(/</g, '&lt;').rp(/>/g, '&gt;').rp(/"/g, '&quot;');
}


/** Restores the original source string's '<' and '>' as entered in
    the document, before the browser processed it as HTML. There is no
    way in an HTML document to distinguish an entity that was entered
    as an entity. */
function unescapeHTMLEntities(str) {
    // Process &amp; last so that we don't recursively unescape
    // escaped escape sequences.
    return str.
        rp(/&lt;/g, '<').
        rp(/&gt;/g, '>').
        rp(/&quot;/g, '"').
        rp(/&#39;/g, "'").
        rp(/&ndash;/g, '–').
        rp(/&mdash;/g, '---').
        rp(/&amp;/g, '&');
}


function removeHTMLTags(str) {
    return str.rp(/<.*?>/g, '');
}



/** "The Exit Codes (all)" becomes "exit_codes_all". Drop the articles unless the text is
    only articles. markdeep2.py has the same function. */
function mangle(text) {
    let s = text.toLowerCase().rp(/[^\p{L}\p{N}_\s]/gu, '');
    const withoutArticles = s.rp(/(^|\s)(?:the|an|a)(?=\s|$)/g, '$1');
    if (withoutArticles.trim()) { s = withoutArticles; }
    return encodeURI(s.trim().rp(/\s+/g, '_'));
}

/** "foo(x, y)" becomes "foo-fcn" and "bar[i]" becomes "bar-array", so that the anchor
    does not change with the arguments */
function mangleCode(text) {
    // Extract just the identifier part and what follows
    const match = text.match(/^([A-Za-z_][A-Za-z_\.0-9:\->]*)([\(\[<])/);
    if (match) {
        const name = match[1];
        const next = match[2];
        const suffix = next === '<' ? '-template' : next === '(' ? '-fcn' : next === '[' ? '-array' : next;
        return mangle(name) + suffix;
    }
    // No special syntax, just mangle normally
    return mangle(text);
}


/** The visible text of a heading's source. It equals the heading's textContent in the
    browser, so headerAnchor() matches the rendered document. mangle() removes the math
    delimiters that remain. */
function plainTitleText(source) {
    return source.
        rp(/⟨L:\d+⟩/g, '').
        rp(/(`+)(.+?)\1/g, '$2').
        rp(/!\[[^\]]*\]\([^\)]*\)/g, '').
        rp(/\[([^\]]*)\]\([^\)]*\)/g, '$1').
        rp(/\[([^\]]*)\]\[[^\]]*\]/g, '$1').
        rp(/<[^<>]*>/g, '').
        rp(/(?<![A-Za-z0-9_])(\*\*|__|\*|_)(?=\S)(.*?\S)\1(?![A-Za-z0-9_]|\(|\.[A-Za-z])/g, '$2').
        trim();
}

// A theme `style` key is one of these names, so that the DOM can change without breaking
// themes. STYLE_GROUPS rules go in an earlier cascade layer, so a STYLE_ELEMENTS rule
// overrides its group.
const STYLE_GROUPS = {
    heading: '.md h1,.md h2,.md h3,.md h4,.md h5,.md h6,' +
             '.md .nonumberh1,.md .nonumberh2,.md .nonumberh3,' +
             '.md .nonumberh4,.md .nonumberh5,.md .nonumberh6'
};

const STYLE_ELEMENTS = {
    // Prose
    body:            'body.md',
    p:               '.md p',
    // Separate selectors, so that a theme can set either one without overriding the other
    a:               '.md a:link',
    a_visited:       '.md a:visited',
    strong:          '.md strong',
    em:              '.md em',
    blockquote:      '.md blockquote',
    hr:              '.md hr',

    // Headings. h1 is the document title.
    h1:              '.md h1',
    h2:              '.md h2',
    h3:              '.md h3',
    h4:              '.md h4',
    h5:              '.md h5',
    h6:              '.md h6',

    // Lists
    ul:              '.md ul',
    ol:              '.md ol',
    li:              '.md li',
    dl:              '.md dl',
    dt:              '.md dt',
    dd:              '.md dd',

    // Code
    code:            '.md code',
    listing:         '.md pre.listing',
    line_number:     '.md pre.listing .linenumbers span.line:before',

    // Blocks
    table:           '.md table.table',
    th:              '.md table.table th',
    td:              '.md table.table td',
    table_stripe:    '.md table.table tr:nth-child(even)',
    caption:         '.md .imagecaption,.md .tablecaption,.md .listingcaption',
    diagram:         '.md svg.diagram',
    diagram_region:  '.md svg.diagram path.diagram-region',
    admonition:      '.md .admonition',
    admonition_tip:  '.md .admonition.tip',
    admonition_warn: '.md .admonition.warn,.md .admonition.warning',
    admonition_error:'.md .admonition.error',

    // Markdeep constructs
    metadata:        '.md dl.metadata',
    endnote:         '.md .endnote',
    fancyquote:      '.md blockquote.fancyquote',
    footer:          '.markdeepFooter',

    // Page structure
    site_header:     '#site_header',
    site_nav:        '#site_nav',
    site_footer:     '#site_footer',
    main:            '#main',
    main_nav:        '#main_nav',
    main_header:     '#main_header',
    content:         '#content',
    article:         '#article',
    main_footer:     '#main_footer'
};

// A shorthand resets the longhands it omits and undoes the default stylesheet, so reject
// it and suggest these longhands.
const STYLE_SHORTHANDS = {
    font:            'fontFamily, fontSize, fontWeight, fontStyle, or lineHeight',
    border:          'borderColor, borderWidth, or borderStyle',
    borderTop:       'borderTopColor, borderTopWidth, or borderTopStyle',
    borderRight:     'borderRightColor, borderRightWidth, or borderRightStyle',
    borderBottom:    'borderBottomColor, borderBottomWidth, or borderBottomStyle',
    borderLeft:      'borderLeftColor, borderLeftWidth, or borderLeftStyle',
    background:      'backgroundColor or backgroundImage',
    margin:          'marginTop, marginRight, marginBottom, or marginLeft',
    padding:         'paddingTop, paddingRight, paddingBottom, or paddingLeft',
    outline:         'outlineColor, outlineWidth, or outlineStyle',
    listStyle:       'listStyleType or listStyleImage',
    textDecoration:  'textDecorationLine or textDecorationColor',
    transition:      'transitionProperty and transitionDuration',
    animation:       'animationName and animationDuration',
    flex:            'flexGrow, flexShrink, and flexBasis'
};


// COLOR SCHEME DERIVATION
// Compute the other arm of a color from the arm that a theme gives. The constants are
// tuned by eye, so do not depend on a derived value.

// The mirror interval in normalized CIE L*. It is asymmetric because the light
// background is white and the dark background is dark gray.
const MIRROR_INTERVAL_LOW  = 0.14;
const MIRROR_INTERVAL_HIGH = 1.00;

// Mirror resistance by OKLCH hue angle. A hue is saturated only in its own band of
// lightness, and the same mirror for every hue moves a saturated yellow out of its band.
const HUE_RESISTANCE = [{degrees:  30, resistance: 0.68},   // red
                        {degrees:  70, resistance: 0.74},   // orange
                        {degrees: 110, resistance: 0.80},   // yellow
                        {degrees: 145, resistance: 0.67},   // green
                        {degrees: 195, resistance: 0.48},   // cyan
                        {degrees: 230, resistance: 0.35},   // azure
                        {degrees: 265, resistance: 0.44},   // blue
                        {degrees: 315, resistance: 0.57}];  // purple


function srgbToLinear(channel) {
    return (channel <= 0.04045) ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}


function linearToSrgb(channel) {
    return (channel <= 0.0031308) ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}


/** Ottosson's published matrices */
function rgbToOklch(rgb) {
    const red = srgbToLinear(rgb[0]), green = srgbToLinear(rgb[1]), blue = srgbToLinear(rgb[2]);
    const long   = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
    const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
    const short  = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);

    const lightness = 0.2104542553 * long + 0.7936177850 * medium - 0.0040720468 * short;
    const a         = 1.9779984951 * long - 2.4285922050 * medium + 0.4505937099 * short;
    const b         = 0.0259040371 * long + 0.7827717662 * medium - 0.8086757660 * short;

    return {lightness: lightness, chroma: Math.hypot(a, b), hue: Math.atan2(b, a)};
}


/** OKLCH to sRGB in [0,1], unclamped so that the caller can test the gamut. */
function oklchToRgb(lch) {
    const a = lch.chroma * Math.cos(lch.hue);
    const b = lch.chroma * Math.sin(lch.hue);
    const long   = Math.pow(lch.lightness + 0.3963377774 * a + 0.2158037573 * b, 3);
    const medium = Math.pow(lch.lightness - 0.1055613458 * a - 0.0638541728 * b, 3);
    const short  = Math.pow(lch.lightness - 0.0894841775 * a - 1.2914855480 * b, 3);

    return [linearToSrgb( 4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short),
            linearToSrgb(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short),
            linearToSrgb(-0.0041960863 * long - 0.7034186147 * medium + 1.7076147010 * short)];
}


/** The largest in-gamut chroma at this lightness and hue, by binary search. The sRGB
    gamut boundary has no closed form in OKLCH. */
function maxChroma(lightness, hue) {
    let low = 0, high = 0.45;
    for (let i = 0; i < 24; ++i) {
        const middle = (low + high) / 2;
        const rgb = oklchToRgb({lightness: lightness, chroma: middle, hue: hue});
        const inside = rgb.every(function (channel) { return (channel >= -0.0005) && (channel <= 1.0005); });
        if (inside) { low = middle; } else { high = middle; }
    }
    return low;
}


function relativeLuminance(rgb) {
    return 0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2]);
}


/** Normalized CIE L*, the coordinate of the mirror */
function cieLightness(rgb) {
    const luminance = relativeLuminance(rgb);
    return ((luminance > 0.008856) ? 116 * Math.cbrt(luminance) - 16 : 903.3 * luminance) / 100;
}


/** Clamp the chroma at each lightness, so that CIE L* increases with lightness and the
    search in deriveColor() converges */
function colorAtLightness(lightness, source) {
    const chroma = Math.min(source.chroma, maxChroma(lightness, source.hue));
    return oklchToRgb({lightness: lightness, chroma: chroma, hue: source.hue}).
        map(function (channel) { return Math.max(0, Math.min(1, channel)); });
}


/** Interpolate between the two HUE_RESISTANCE entries on either side of `hue` */
function hueResistance(hue) {
    const degrees = ((hue * 180 / Math.PI) % 360 + 360) % 360;
    for (let i = 0; i < HUE_RESISTANCE.length; ++i) {
        const here = HUE_RESISTANCE[i], next = HUE_RESISTANCE[(i + 1) % HUE_RESISTANCE.length];
        const span  = ((next.degrees - here.degrees) + 360) % 360;
        const along = ((degrees - here.degrees) + 360) % 360;
        if (along <= span) {
            return here.resistance + (next.resistance - here.resistance) * (along / span);
        }
    }
    return HUE_RESISTANCE[0].resistance;
}


/** Parse with a canvas, which accepts every CSS color syntax that the browser does.
    Return null when the two fill colors differ, which means `text` is invalid. */
function parseCSSColor(text) {
    const context = document.createElement('canvas').getContext('2d');
    context.fillStyle = '#000';
    context.fillStyle = text;
    const black = context.fillStyle;

    context.fillStyle = '#fff';
    context.fillStyle = text;
    if (context.fillStyle !== black) { return null; }

    const match = black.match(/^#([0-9a-f]{6})$/i);
    if (match) {
        return [0, 2, 4].map(function (i) { return parseInt(match[1].substr(i, 2), 16) / 255; });
    }

    const parts = black.match(/^rgba?\(([^)]*)\)$/);
    if (! parts) { return null; }
    return parts[1].split(',').slice(0, 3).map(function (channel) { return parseFloat(channel) / 255; });
}


function formatHex(rgb) {
    return '#' + rgb.map(function (channel) {
        return Math.max(0, Math.min(255, Math.round(channel * 255))).toString(16).padStart(2, '0');
    }).join('');
}


/** The color for the other scheme, or null for an unrecognized color */
function deriveColor(text) {
    const rgb = parseCSSColor(text);
    if (! rgb) { return null; }

    const source = rgbToOklch(rgb);

    const coordinate = Math.max(MIRROR_INTERVAL_LOW, Math.min(MIRROR_INTERVAL_HIGH, cieLightness(rgb)));
    const mirrored = MIRROR_INTERVAL_LOW + MIRROR_INTERVAL_HIGH - coordinate;

    // Scale down the mirror by the saturation and the resistance of the hue
    const saturation = Math.min(1, source.chroma / Math.max(maxChroma(source.lightness, source.hue), 1e-6));
    const target = coordinate + (mirrored - coordinate) * (1 - hueResistance(source.hue) * saturation);

    // The OKLCH lightness whose color has that CIE L*.
    let low = 0, high = 1;
    for (let i = 0; i < 22; ++i) {
        const middle = (low + high) / 2;
        if (cieLightness(colorAtLightness(middle, source)) < target) { low = middle; }
        else { high = middle; }
    }

    return formatHex(colorAtLightness((low + high) / 2, source));
}


/** Replace each `auto` arm of a light-dark() with the color derived from the other arm.
    `auto` is invalid CSS, so the browser discards an unprocessed value. */
function resolveColorSchemePairs(value, name) {
    if (typeof value !== 'string') { return value; }

    let result = '';
    let index = 0;
    while (true) {
        const start = value.indexOf('light-dark(', index);
        if (start === -1) { return result + value.ss(index); }

        // The comma and closing parenthesis are found at depth zero so that an
        // arm may be a function such as rgb()
        let depth = 0, comma = -1, end = -1;
        for (let i = start + 'light-dark('.length - 1; i < value.length; ++i) {
            const character = value[i];
            if (character === '(') { ++depth; }
            else if (character === ')') { --depth; if (depth === 0) { end = i; break; } }
            else if ((character === ',') && (depth === 1) && (comma === -1)) { comma = i; }
        }
        if ((end === -1) || (comma === -1)) { return result + value.ss(index); }

        const light = value.ss(start + 'light-dark('.length, comma).trim();
        const dark = value.ss(comma + 1, end).trim();
        let replacement = value.ss(start, end + 1);

        if ((light === 'auto') !== (dark === 'auto')) {
            const stated = (light === 'auto') ? dark : light;
            const derived = deriveColor(stated);
            if (derived === null) {
                console.error('markdeepOptions.style.' + name + ': `' + stated +
                              '` is not a color the browser recognizes, so the other scheme ' +
                              'cannot be derived from it.');
            } else {
                replacement = 'light-dark(' + ((light === 'auto') ? derived : light) + ',' +
                    ((dark === 'auto') ? derived : dark) + ')';
            }
        }

        result += value.ss(index, start) + replacement;
        index = end + 1;
    }
}


/** camelCase to dashed. A key that starts with `--` is a custom property and stays as written. */
function cssPropertyName(key) {
    return key.startsWith('--') ? key : key.rp(/[A-Z]/g, function (letter) {
        return '-' + letter.toLowerCase();
    });
}


/** Report and skip each shorthand property */
function styleDeclarations(block, name) {
    let text = '';

    for (const key in block) {
        if (STYLE_SHORTHANDS.hasOwnProperty(key)) {
            console.error('markdeepOptions.style.' + name + ': `' + key +
                          '` is a CSS shorthand, which would reset the longhands it does not ' +
                          'mention. Use ' + STYLE_SHORTHANDS[key] + ' instead.');
            continue;
        }
        text += cssPropertyName(key) + ':' + resolveColorSchemePairs(block[key], name) + ';';
    }

    return text;
}


/** Two cascade layers: the STYLE_GROUPS rules, then the STYLE_ELEMENTS rules and the
    `style` of each page structure option */
function styleStylesheet() {
    const style = option('style') || {};
    let groupText = '';
    let elementText = '';

    for (const name in style) {
        const declarations = styleDeclarations(style[name], name);
        if (declarations.length === 0) { continue; }

        if (STYLE_GROUPS.hasOwnProperty(name)) {
            groupText += STYLE_GROUPS[name] + '{' + declarations + '}\n';
        } else if (STYLE_ELEMENTS.hasOwnProperty(name)) {
            elementText += STYLE_ELEMENTS[name] + '{' + declarations + '}\n';
        } else {
            // Report an unknown name, because its rule would be invisible to the author
            console.error('markdeepOptions.style: `' + name + '` is not a style name. ' +
                          'The names are: ' + Object.keys(STYLE_GROUPS).
                          concat(Object.keys(STYLE_ELEMENTS)).join(', ') + '.');
        }
    }

    // The page structure elements that have an option object
    ['site_header', 'site_nav', 'site_footer', 'main_nav', 'main_header', 'main_footer'].
        forEach(function (id) {
            const declarations = styleDeclarations(option(id, 'style'), id);
            if (declarations.length > 0) {
                elementText += STYLE_ELEMENTS[id] + '{' + declarations + '}\n';
            }
        });

    return (groupText ? entag('style', '@layer md.group{\n' + groupText + '}') : '') +
        (elementText ? entag('style', '@layer md.element{\n' + elementText + '}') : '');
}


/** Make each of `fontStylesheets` a <link>, because a CSS import rule must come first in
    its stylesheet. Resolve each `fontFaces` src against the theme directory, because the
    browser resolves an injected <style> against the document. */
function fontStylesheet() {
    const sheets = option('fontStylesheets') || [];
    const faces = option('fontFaces') || [];

    const links = sheets.map(function (href) {
        return '<link rel="stylesheet" href="' + href + '">';
    }).join('');

    const faceText = faces.map(function (face) {
        let text = '';
        for (const key in face) {
            const value = (key === 'src') ? 'url("' + themeFileURL(face[key]) + '")' : face[key];
            text += cssPropertyName(key) + ':' + value + ';';
        }
        return '@font-face{' + text + '}\n';
    }).join('');

    return links + (faceText ? entag('style', faceText) : '');
}


/** A media query cannot read a CSS variable, so compute the pane widths here. A theme
    that changes --nav-size must restate these rules. */
function pageStructureStylesheet() {
    const siteAlign = alignment('site_nav');
    const mainAlign = alignment('main_nav');
    const sitePane = (siteAlign === 'left') || (siteAlign === 'right');
    const mainPane = (mainAlign === 'left') || (mainAlign === 'right');

    const used = ['site_header', 'site_nav', 'site_footer', 'main_nav'].some(function (id) {
        const align = alignment(id);
        return (align !== 'none') && (align !== 'inset');
    });

    // A document with no page structure elements scrolls as one page
    if (! used) { return ''; }

    // Hide a pane below the window width at which #content would be narrower than its
    // minimum. Left and right elements take width from #content.
    const stackWidth = CONTENT_MIN_WIDTH_PX + NAV_WIDTH_PX;
    const mainNavWidth = CONTENT_MIN_WIDTH_PX + (sitePane ? 2 : 1) * NAV_WIDTH_PX;

    let css = '';
    if (mainPane) { css += '@media (max-width:' + (mainNavWidth - 1) + 'px){#main_nav{display:none}}'; }
    if (sitePane) { css += '@media (max-width:' + (stackWidth - 1) + 'px){#site_nav{display:none}}'; }

    // On screen, make the header sticky and pin each pane below it with its own scrolling.
    // installPaneInsetMeasurement() sets --pane-top and --pane-bottom from the measured
    // header and footer heights. Put the screen rules in md.base so that a theme can
    // override them. Print in DOM order with unlayered rules, which outrank every theme layer.
    return entag('style', '@layer md.base{' + css +
        'body.md{min-height:100dvh}' +
        // Override the base min-height:0, which collapses the article row while the
        // document scrolls. Name #main because the base rule selects it by ID.
        'body.md>*,#main,#main>*{min-height:auto}' +
        'body.md{grid-template-rows:auto auto minmax(auto,1fr) auto auto}' +
        '#main{grid-template-rows:auto minmax(auto,1fr) auto}' +
        '#site_header{position:sticky;top:0;z-index:1}' +
        // Scroll a link target to below the sticky header
        'html{scroll-padding-top:var(--pane-top,0px)}' +
        // A table heading in a clipped box sticks to the window
        'body.md .scrollable.barred table.longtable th{top:var(--pane-top,0px)}' +
        'body.md>[data-align=left]:not([data-layout=menu]),' +
        'body.md>[data-align=right]:not([data-layout=menu]),' +
        '#main>[data-align=left]:not([data-layout=menu]),' +
        '#main>[data-align=right]:not([data-layout=menu])' +
        '{position:sticky;top:var(--pane-top,0px);' +
        'max-height:calc(100dvh - var(--pane-top,0px));overflow-y:auto}' +
        // A sticky box stays inside its parent's content box, so stop a body pane at the
        // footer with a bottom margin. #main ends at the footer.
        'body.md>[data-align=left]:not([data-layout=menu]),' +
        'body.md>[data-align=right]:not([data-layout=menu])' +
        '{margin-bottom:var(--pane-bottom,0px)}' +
        '}' +
        '@media print{' +
        'body.md,#main{display:block}' +
        '.md [data-align=left],.md [data-align=right]{width:auto;position:static;max-height:none;overflow:visible;margin-bottom:0}' +
        '#site_header{position:static}' +
        '}');
}


function sectionNumberingStylesheet() {
    if (! option('showSectionNumbers')) { return ''; }

    let s = '';

    // Start the header counters at h2, because h1 is the unnumbered document title
    for (let i = 2; i <= 6; ++i) {
        s += '.md h' + i + '::before {\ncontent:';
        for (let j = 2; j <= i; ++j) {
            s += 'counter(h' + j + ') "' + ((j < i) ? '.' : ' ') + '"';
        }
        s += ';\ncounter-increment: h' + i + ';margin-right:10px}\n\n';
        s += '.md section.h' + i + '-section > h' + i + '::before {' +
            'content:attr(data-section-number) " ";counter-increment:none}\n\n';
    }

    // Number the overview with separate counters: toc{n} pairs with h{n} and li.level{n}.
    // Increment on the link, so that a skipped level, which has no link, prints 0 as the
    // headers do
    const overview = '.md :is(.longTOC,.insetTOC)';
    s += overview + '{counter-reset:toc2 toc3 toc4 toc5 toc6}\n\n';

    for (let i = 2; i <= 6; ++i) {
        if (i < 6) {
            s += overview + ' li.level' + i + '{counter-reset:';
            for (let j = i + 1; j <= 6; ++j) { s += ((j > i + 1) ? ' ' : '') + 'toc' + j; }
            s += '}\n\n';
        }

        s += overview + ' li.level' + i + '>a::before {\ncontent:';
        for (let j = 2; j <= i; ++j) {
            s += 'counter(toc' + j + ') "' + ((j < i) ? '.' : ' ') + '"';
        }
        s += ';\ncounter-increment: toc' + i + '}\n\n';
    }

    return entag('style', s);
}

/** Return the text of the <plaintext> element that ends the Markdeep line. The HTML
    parser keeps the rest of the file in it as raw text, with entities and tags
    unparsed. */
function documentSource() {
    const carrierArray = document.getElementsByTagName('plaintext');

    if (carrierArray.length === 0) {
        throw new Error('The Markdeep line must end in <plaintext>, which is where the document source begins.');
    }

    return carrierArray[0].textContent;
}


const GENERATOR_REGEXP = /<script\b[^>]*\btype\s*=\s*(['"])generator\1[^>]*>([\s\S]*?)<\/script\s*>/gi;

/** Run generators before every other pass, so that their output is source and a
    heading they write appears in the table of contents. markdeep_write is global and
    each block runs as a script element, so a helper defined in one generator is
    available to later ones. Keep the text that a generator wrote before it threw, and
    render the rest of the document. */
function runGenerators(str) {
    let textArray = null;

    // Treat a generator in a code fence or code span as text. Match against the
    // fence-blanked source and skip a match that starts in a span, because a generator
    // body may contain template-literal backticks that span blanking would corrupt.
    const fenceBlanked = blankCodeFences(str);
    const spanBlanked  = str.rp(/`[^`\n]*`/g, blankLine);
    const regexp       = RegExp(GENERATOR_REGEXP.source, 'gi');
    const partArray    = [];
    let lastIndex    = 0;
    let match;

    // Define markdeep_write in a browser, which runs generators as script elements
    if (IN_BROWSER) {
        window.markdeep_write = function (text) {
            if (textArray === null) {
                throw new Error('markdeep_write was called outside a <script type="generator"> block');
            }
            textArray.push(text);
        };
    }

    while ((match = regexp.exec(fenceBlanked)) !== null) {
        if (spanBlanked.charAt(match.index) === ' ') {
            regexp.lastIndex = match.index + 1;
            continue;
        }

        partArray.push(str.ss(lastIndex, match.index));

        const whole = str.ss(match.index, regexp.lastIndex);
        const body  = /^<script[^>]*>([\s\S]*)<\/script\s*>$/i.exec(whole)[1];

        textArray = [];

        // Run the body as a script element, which keeps top-level declarations in the
        // global scope and reports an exception to the console while processing continues
        const scriptElement = document.createElement('script');
        scriptElement.textContent = body;
        document.head.appendChild(scriptElement);
        scriptElement.parentNode.removeChild(scriptElement);

        partArray.push(textArray.join(''));
        textArray = null;
        lastIndex = regexp.lastIndex;
    }

    partArray.push(str.ss(lastIndex));

    return partArray.join('');
}


/** Escape each plaintext tag outside code, because the browser would render the rest
    of the page as raw text. Leave a tag in code for the listing escape. */
function escapePlaintextTags(str) {
    const codeBlanked = blankCodeText(str);

    return str.rp(/<\/?plaintext\b[^>]*>/gi, function (match, offset) {
        // A blank range is code
        if (! /[^ \n]/.test(codeBlanked.ss(offset, offset + match.length))) { return match; }

        return escapeHTMLEntities(match);
    });
}


/** Replace each script under `root` with a created copy, because the browser runs a
    created script element and skips one inserted through innerHTML */
function activateScripts(root) {
    toArray(root.getElementsByTagName('script')).forEach(function (inertScript) {
        const liveScript = document.createElement('script');

        toArray(inertScript.attributes).forEach(function (attribute) {
            liveScript.setAttribute(attribute.name, attribute.value);
        });
        liveScript.textContent = inertScript.textContent;

        inertScript.parentNode.replaceChild(liveScript, inertScript);
    });
}


/** 
    Find the specified delimiterRegExp used as a quote (e.g., *foo*)
    and replace it with the HTML tag and optional attributes.
*/
function replaceMatched(string, delimiterRegExp, tag, attribs, skipCallback) {
    // The replace callback receives the match, groups 1 through 4, the offset, and the
    // string. Group 4 is the last continuation line of the content.
    const delimiter = delimiterRegExp.source;
    const flanking = '[^ \\t\\n' + delimiter + ']';
    const pattern  = '([^A-Za-z0-9])(' + delimiter + ')' +
        '(' + flanking + '.*?(\\n.+?)*?)' +
        delimiter + '(?![A-Za-z0-9])';

    if (skipCallback) {
        return string.rp(new RegExp(pattern, 'g'), function() {
            const match = arguments[0];
            const before = arguments[1];
            const delim = arguments[2];
            const content = arguments[3];
            const offset = arguments[5];
            const fullString = arguments[6];

            const afterOffset = offset + match.length;
            if (skipCallback(fullString, afterOffset, content, delim, offset, match)) {
                return match;
            }
            return before + '<' + tag + (attribs ? ' ' + attribs : '') + '>' + content + '</' + tag + '>';
        });
    } else {
        return string.rp(new RegExp(pattern, 'g'),
                              '$1<' + tag + (attribs ? ' ' + attribs : '') +
                              '>$3</' + tag + '>');
    }
}
    


// TABLE, LISTING, and FIGURE LABEL NUMBERING: Figure [symbol]: Table [symbol]: Listing [symbol]: Diagram [symbol]:

// This data structure maps caption types [by localized name] to a count of how many of
// that type of object exist.
const refCounter = {};

// refTable['type_symbolicName'] = {number: number to link to}
/** @type {Record<string, {number: number}>} */
const refTable = {};

// Processes Figure|Diagram|Table|Listing captions and returns the anchor tag with the numbered caption
function createTarget(caption, protect){
    const pattern = RegExp("\\[?(?<type>"+ keyword('figure') + '|' + keyword('table') + '|' + keyword('listing') + '|' + keyword('diagram') + ')' + /\s+\[(?<ref>.+?)\]:(?<text>[\s\S]*[^\]])\]?/.source, 'im');
    const match = caption.match(pattern);
    if (match) {
        const type = match.groups['type'].toLowerCase();
        const _ref = match.groups['ref'];
        // Increment the counter
        const count = refCounter[type] = (refCounter[type] | 0) + 1;
        const ref = type + '_' + mangle(_ref.toLowerCase().trim());

        // Store the reference number
        refTable[ref] = {number: count};

        return  {
            target: protect(entag('a', '&nbsp;', protect('class="target" name="' + ref + '"'))),
            caption: entag('b', type[0].toUpperCase() + type.ss(1) + '&nbsp;' + count + ':', protect('style="font-style:normal;"') +
            maybeShowLabel(_ref)) + match.groups['text']
        };
        
    } else {
        return {
            target: '',
            caption: caption
        };
    }
}

// Table region grammar, shared by the transformation pass and parseTable
const TABLE_ROW_SOURCE       = /(?:\n[ \t]*(?:(?:\|?[^\n|]+?(?:\|[^\n|]+?)+\|?)|\|[^\n|]+\|)(?=\n))/.source;
const TABLE_SEPARATOR_SOURCE = /\n[ \t]*(?:(?:\|? *\:?-+\:?(?: *\| *\:?-+\:?)+ *\|?|)|\|[\:-]+\|)(?=\n)/.source;
const TABLE_CAPTION_SOURCE   = /\n[ \t]*\[[^\n\|]+\][ \t]*(?=\n)/.source;

function trimTableRowEnds(row) {
    // Keep a trailing \|, which is an escaped pipe in the last cell
    return row.trim().rp(/^\||(?<!\\)\|$/g, '');
}

/** Split a table row at its column bars. A pipe written \| is cell content; keep the
    escape so that a round trip through generateMarkdownTable is lossless. */
function splitTableRow(row) {
    return trimTableRowEnds(row).split(/ *(?<!\\)\| */);
}

/** Public API (window.markdeep.parseTable). The result is
    undefined for a malformed table, else {headerRow, alignRow, data, caption,
    sourceRowCount}, the field vocabulary of extractTable. Rows are arrays of
    cell source text. Each alignRow entry is 'L', 'C', 'R', or 'X' (unspecified,
    rendered left). An edge cell implied by a bar the separator row lacks is
    '&nbsp;'. caption is bracket-stripped. sourceRowCount includes the
    separator and sizes longtable. */
function parseTable(tableSource) {
    if (tableSource[0] !== '\n') { tableSource = '\n' + tableSource; }
    if (tableSource[tableSource.length - 1] !== '\n') { tableSource += '\n'; }
    const wholeTable = new RegExp('^' + TABLE_ROW_SOURCE + TABLE_SEPARATOR_SOURCE +
                                TABLE_ROW_SOURCE + '+(' + TABLE_CAPTION_SOURCE + ')?');
    const match = tableSource.match(wholeTable);
    if (! match || tableSource.ss(match[0].length).trim() !== '') {
        return undefined;
    }

    const rowArray = match[0].split('\n');

    // Skip the bogus leading row
    const startRow = (rowArray[0] === '') ? 1 : 0;

    let caption = rowArray[rowArray.length - 1].trim();
    // Reject a caption with a bar, as TABLE_CAPTION_SOURCE does, so that a data row that
    // opens with a link and closes with a bracketed reference stays a row
    if ((caption.length > 3) && /^\[[^\n|]+\]$/.test(caption)) {
        // Remove the caption from the row array
        rowArray.pop();
        caption = caption.ss(1, caption.length - 1);
    } else {
        caption = undefined;
    }

    // Parse the separator row for left/center/right-indicating colons
    const alignRow = [];
    trimTableRowEnds(rowArray[startRow + 1]).rp(/:?-+:?/g, function (colonMatch) {
        const left = (colonMatch[0] === ':');
        const right = (colonMatch[colonMatch.length - 1] === ':');
        alignRow.push((left && right) ? 'C' : (right ? 'R' : (left ? 'L' : 'X')));
        return colonMatch;
    });

    const separator = rowArray[startRow + 1].trim();
    const hasLeadingBar  = separator[0] === '|';
    const hasTrailingBar = separator[separator.length - 1] === '|';

    function splitCells(rowText) {
        let row = rowText.trim();

        if (! hasLeadingBar && (row[0] === '|')) {
            // Empty first column
            row = '&nbsp;' + row;
        }

        if (! hasTrailingBar && (row[row.length - 1] === '|') && (row[row.length - 2] !== '\\')) {
            // Append an empty last cell after an unescaped trailing bar that the separator lacks
            row += '&nbsp;';
        }

        // Unescape \| to a literal pipe
        return splitTableRow(row).map(function (cell) {
            return cell.rp(/\\\|/g, '|');
        });
    }

    const headerRow = splitCells(rowArray[startRow]);
    const data = [];
    for (let r = startRow + 2; r < rowArray.length; ++r) {
        data.push(splitCells(rowArray[r]));
    }

    return {
        headerRow:      headerRow,
        alignRow:       alignRow,
        data:           data,
        caption:        caption,
        sourceRowCount: rowArray.length
    };
}

function tableToHTML(table, protect) {
    const columnStyle = [];
    for (let c = 0; c < table.alignRow.length; ++c) {
        const align = table.alignRow[c];
        columnStyle.push(protect(' style="text-align:' +
            ((align === 'C') ? 'center' : ((align === 'R') ? 'right' : 'left')) + '"'));
    }

    function rowToHTML(cellArray, tag) {
        let content = '<' + tag + ' ' + columnStyle[0] + '> ';
        for (let i = 0; i < cellArray.length; ++i) {
            if (i > 0) {
                content += ' </' + tag + '><' + tag + ' ' + (columnStyle[i] || '') + '> ';
            }
            content += cellArray[i];
        }
        return entag('tr', content + ' </' + tag + '>') + '\n';
    }

    let result = rowToHTML(table.headerRow, 'th');
    for (let r = 0; r < table.data.length; ++r) {
        result += rowToHTML(table.data[r], 'td');
    }

    result = entag('table', result, protect('class="table' + (table.sourceRowCount >= 15 ? ' longtable' : '') + '"'));

    // Scroll the table without its caption, so that the caption centers on the column
    result = entag('div', result, protect('class="scrollable"'));

    if (table.caption) {
        const processedCaption = createTarget(table.caption, protect);
        const caption = entag('center', entag('div', processedCaption.caption, protect('class="tablecaption"')));
        if (option('captionAbove', 'table')) {
            result = processedCaption.target + caption + result;
        } else {
            result = '\n' + processedCaption.target + result + caption;
        }
    }

    return entag('div', decoration('start') + result + decoration('end'), "class='table'");
}

/** Maruku ("github")-style tables */
function replaceTables(s, protect) {
    const TABLE_REGEXP = new RegExp(TABLE_ROW_SOURCE + TABLE_SEPARATOR_SOURCE +
                                  TABLE_ROW_SOURCE + '+(' + TABLE_CAPTION_SOURCE + ')?', 'g');

    s = s.rp(TABLE_REGEXP, function (match) {
        const table = parseTable(match);
        // parseTable rejects a match only when it disagrees with TABLE_REGEXP
        return table ? tableToHTML(table, protect) : match;
    });

    return s;
}


function replaceLists(s, protect) {
    // Identify task list bullets in a few patterns and reformat them to a standard format for
    // easier processing.
    s = s.rp(/^(\s*)(?:[-*+]\s*)?(?:\[ \]|☐)(\s+)/mg, '$1☐$2');
    s = s.rp(/^(\s*)(?:[-*+]\s*)?(?:\[[xX]\]|☑)(\s+)/mg, '$1☑$2');
    s = s.rp(/^(\s*\d+\.\s+)(?:\[ \]|☐)(\s+)/mg, '$1☐$2');
    s = s.rp(/^(\s*\d+\.\s+)(?:\[[xX]\]|☑)(\s+)/mg, '$1☑$2');
    s = s.rp(/^(\s*)(?:[-*+]\s*)?(?:\[>\]|▸)(\s+)/mg, '$1▸$2');

    // A list block starts after a blank line or after a line with a colon or comma, and
    // runs to the next blank line
    const BLANK_LINES = /\n\s*\n/.source;

    // From a colon or comma to the end of its line
    const PREFIX     = /[:,][^\n]*\n/.source;
    
    // Pattern for a line that starts a list item (with optional indentation)
    const LIST_ITEM_START = /[ \t]*(?:\d+\.|-|\+|\*|☑|☐|▸)[ \t]+/.source;

    // Insert LIST_MARKER, which matches as a blank line, before two consecutive list
    // items so that a list can start without a blank or colon line before it.
    // U+2029 is invisible, and editors break the line at it.
    const LIST_MARKER = '\n\u2029LISTSTART\u2029\n';
    const lines = s.split('\n');
    const processedLines = [];
    const listItemRegex = new RegExp('^' + LIST_ITEM_START);
    const blankLineRegex = /^\s*$/;
    const colonEndRegex = /[:,]\s*$/;
    
    // inListBlock stays true on indented continuation lines
    let inListBlock = false;
    
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        
        // Check if current line starts with a list marker
        const currentIsListItem = listItemRegex.test(line);
        // Check if next line starts with a list marker (accounting for indentation)
        const nextIsListItem = listItemRegex.test(nextLine);
        const currentIsBlank = blankLineRegex.test(line);
        const currentIsIndented = /^[ \t]+/.test(line);

        if (currentIsListItem) {
            inListBlock = true;
        } else if (currentIsBlank && ! nextIsListItem) {
            // A blank line before a non-list line ends the block
            inListBlock = false;
        }

        // Mark the first of two consecutive items outside a list block when the line
        // before it is text that ends without a colon or comma
        if (! inListBlock && currentIsListItem && nextIsListItem && i > 0) {
            const prevLine = lines[i - 1];
            const prevIsBlank = blankLineRegex.test(prevLine);
            const prevEndsWithColon = colonEndRegex.test(prevLine);
            
            if (! prevIsBlank && ! prevEndsWithColon) {
                processedLines.push(LIST_MARKER);
            }
        }
        
        processedLines.push(line);
    }
    
    s = processedLines.join('\n');
    
    const LIST_BLOCK_REGEXP = 
        new RegExp('(' + PREFIX + '|' + BLANK_LINES + '|<p>\\s*\n|<br>\\s*\n?|' + LIST_MARKER + ')' +
                    /((?:[ \t]*(?:\d+\.|-|\+|\*|☑|☐|▸)(?:[ \t]+.+\n(?:(?![ \t]*(?:\d+\.|-|\+|\*|☑|☐|▸))[ \t]*\n)?)+)+)/.source, 'gm');

    let keepGoing = true;

    const ATTRIBS = {'+': protect('class="plus"'), '-': protect('class="minus"'), '*': protect('class="asterisk"'),
                    '☑': protect('class="checked_box"'), '☐': protect('class="unchecked_box"'),
                    '▸': protect('class="collapsible"')};
    const NUMBER_ATTRIBS = {'': protect('class="number"'),
                            '☑': protect('class="number checked_box"'), '☐': protect('class="number unchecked_box"')};

    // Sometimes the list regexp grabs too much because subsequent lines are indented *less*
    // than the first line. So, if that case is found, re-run the regexp.
    while (keepGoing) {
        keepGoing = false;
        s = s.rp(LIST_BLOCK_REGEXP, function (match, prefix, block) {
            let result = prefix;
            
            // Contains {indentLevel, tag}
            const stack = [];
            let current = {indentLevel: -1};

            // <summary> closes before the nested list it discloses, and the
            // browser closes the <details> at </li>
            let openSummary = false;
            function endSummary() {
                const end = openSummary ? '</summary>' : '';
                openSummary = false;
                return end;
            }
            
            /* function logStack(stack) {
               var s = '[';
               stack.forEach(function(v) { s += v.indentLevel + ', '; });
               } */
            block.split('\n').forEach(function (line) {
                const trimmed     = line.rp(/^\s*/, '');
                
                let indentLevel = line.length - trimmed.length;
                
                // Add a CSS class based on the type of list bullet
                let attribs = ATTRIBS[trimmed[0]];
                const isUnordered = !! attribs; // JavaScript for: attribs !== undefined
                attribs = attribs || NUMBER_ATTRIBS[trimmed.rp(/^\d+\.[ \t]+([☑☐]?).*/, '$1')];
                const isOrdered   = /^\d+\.[ \t]/.test(trimmed);
                const isBlank     = trimmed === '';
                const start       = isOrdered ? ' ' + protect('start=' + trimmed.match(/^\d+/)[0]) : '';

                if (isOrdered || isUnordered) {
                    // Add the indentation for the bullet itself
                    indentLevel += 2;
                }

                if (! current) {
                    // Went below top-level indent
                    result += '\n' + line;
                } else if (! isOrdered && ! isUnordered && (isBlank || (indentLevel >= current.indentLevel))) {
                    // Continue the item with a blank or unmarked line
                    result += '\n' + current.indentChars + line;
                } else {
                    //console.log(indentLevel + ":" + line);
                    if (indentLevel !== current.indentLevel) {
                        // Enter or leave indentation level
                        if ((current.indentLevel !== -1) && (indentLevel < current.indentLevel)) {
                            while (current && (indentLevel < current.indentLevel)) {
                                stack.pop();
                                // End the current list and decrease indentation
                                result += endSummary() + '\n</li></' + current.tag + '>' +
                                    (current.disclosure ? '</details>' : '');
                                current = stack[stack.length - 1];
                            }
                        } else {
                            // Start a new list that is more indented
                            current = {indentLevel: indentLevel,
                                       tag:         isOrdered ? 'ol' : 'ul',
                                       disclosure:  openSummary,
                                       // Subtract off the two indent characters we added above
                                       indentChars: line.ss(0, indentLevel - 2)};
                            stack.push(current);
                            result += endSummary() + '\n<' + current.tag + start + '>';
                        }
                    } else if (current.indentLevel !== -1) {
                        const newTag = isOrdered ? 'ol' : 'ul';
                        if (current.tag !== newTag) {
                            // Close the list and open one of the new type at the same indent
                            stack.pop();
                            result += endSummary() + '\n</li></' + current.tag + '>' +
                                    (current.disclosure ? '</details>' : '');
                            current = {indentLevel: indentLevel,
                                       tag:         newTag,
                                       indentChars: line.ss(0, indentLevel - 2)};
                            stack.push(current);
                            result += endSummary() + '\n<' + current.tag + start + '>';
                        } else {
                            result += endSummary() + '\n</li>';
                        }
                    } // Indent level changed

                    if (current) {
                        // Add the list item
                        openSummary = (trimmed[0] === '▸');
                        result += '\n' + current.indentChars + '<li ' + attribs + '>' +
                            (openSummary ? '<details><summary>' : '') +
                            trimmed.rp(/^(\d+\.( [☑☐])?|-|\+|\*|☑|☐|▸) /, '');
                    } else {
                        // Just reached something that is *less* indented than the root--
                        // copy forward and then re-process that list
                        result += '\n' + line;
                        keepGoing = true;
                    }
                }
            }); // For each line

            // Remove trailing whitespace
            result = result.replace(/\s+$/,'');
            
            // Finish the last item and anything else on the stack (if needed)
            for (current = stack.pop(); current; current = stack.pop()) {
                result += endSummary() + '</li></' + current.tag + '>' +
                    (current.disclosure ? '</details>' : '');
            }

            return result + '\n\n';
        });
    } // while keep going

    // Clean up any remaining list markers
    s = s.rp(RegExp(LIST_MARKER, 'g'), '\n\n');

    // Replace a blank line before </li> with an empty paragraph, as CommonMark does
    s = s.rp(/\n\s*\n<\/li>/g, '<p> </p></li>')

    return s;
}


/** 
    Identifies schedule lists, which look like:

  date: title
    events

  Where date must contain a day, month, and four-number year and may
  also contain a day of the week.  Note that the date must not be
  indented and the events must be indented.

  Multiple events per date are permitted.
*/
function replaceScheduleLists(str, protect) {
    // Must open with something other than indentation or a list
    // marker.  There must be a four-digit number somewhere on the
    // line. Exclude lines that begin with an HTML tag...this will
    // avoid parsing headers that have dates in them.
    const BEGINNING = /^(?:[^\|<>\s-\+\*\d].*[12]\d{3}(?!\d).*?|(?:[12]\d{3}(?!\.).*\d.*?)|(?:\d{1,3}(?!\.).*[12]\d{3}(?!\d).*?))/.source;

    // There must be at least one more number in a date, a colon, and then some more text
    const DATE_AND_TITLE = '(' + BEGINNING + '):' + /[ \t]+([^ \t\n].*)\n/.source;

    // The body of the schedule item. It may begin with a blank line and contain
    // multiple paragraphs separated by blank lines...as long as there is indenting
    const EVENTS = /(?:[ \t]*\n)?((?:[ \t]+.+\n(?:[ \t]*\n){0,3})*)/.source;
    const ENTRY = DATE_AND_TITLE + EVENTS;

    const BLANK_LINE = '\n[ \t]*\n';
    const ENTRY_REGEXP = new RegExp(ENTRY, 'gm');

    const rowAttribs = protect('valign="top"');
    const dateTDAttribs = protect('style="width:100px;padding-right:15px" rowspan="2"');
    const eventTDAttribs = protect('style="padding-bottom:25px"');

    const DAY_NAME   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(keyword);
    const MONTH_NAME = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map(keyword);
    const MONTH_FULL_NAME = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(keyword);

    function clean(s) { return s.toLowerCase().rp('.', ''); }
    const LOWERCASE_MONTH_NAME = MONTH_NAME.map(clean);
    const LOWERCASE_MONTH_FULL_NAME = MONTH_FULL_NAME.map(clean);

    // Allow a period (and capture it) after each word, but eliminate
    // the periods that are in abbreviations so that they do not appear
    // in the regexp as wildcards or word breaks
    const MONTH_NAME_LIST = '\\b' + MONTH_NAME.concat(MONTH_FULL_NAME).join('(?:\\.|\\b)|\\b').rp(/([^\\])\./g, '$1') + '(?:\\.|\\b)';

    // Used to mark the center of each day. Not close to midnight to avoid daylight
    // savings problems.
    const standardHour = 9;

    try {
        let scheduleNumber = 0;
        str = str.rp(new RegExp(BLANK_LINE + '(' + ENTRY + '){2,}', 'gm'),
                     function (schedule) {
                       ++scheduleNumber;
                       // Each entry has the form {date:date, title:string, text:string}
                       const entryArray = [];

                       // Now parse the schedule into individual day entries

                       let anyWeekendEvents = false;

                       schedule.rp
                         (ENTRY_REGEXP,
                          function (entry, date, title, events) {
                              // Unnecessary because the parser ignores extra characters; kept for debugging:
                              // date = date.rp(/(?:(?:sun|mon|tues|wednes|thurs|fri|satur)day|(?:sun|mon|tue|wed|thu|fri|sat)\.?|(?:su|mo|tu|we|th|fr|sa)),?/gi, '');
                              
                              // Parse the date. The Javascript Date class's parser is useless because it
                              // is locale dependent, so we do this with a regexp.
                              
                              let year = '', month = '', day = '', parenthesized = false;
                              
                              date = date.trim();
                              
                              if ((date[0] === '(') && (date.slice(-1) === ')')) {
                                  // This is a parenthesized entry
                                  date = date.slice(1, -1);
                                  parenthesized = true;
                              }
                              
                              // DD MONTH YYYY
                              const DD_MONTH_YYYY = RegExp('([0123]?\\d)\\D+([01]?\\d|' + MONTH_NAME_LIST + ')\\D+([12]\\d{3})', 'i')
                              let match = date.match(DD_MONTH_YYYY);
                              
                              if (match) {
                                  day = match[1]; month = match[2]; year = match[3];
                              } else {
                                  // YYYY MONTH DD
                                  match = date.match(RegExp('([12]\\d{3})\\D+([01]?\\d|' + MONTH_NAME_LIST + ')\\D+([0123]?\\d)', 'i')); 
                                  if (match) {
                                      day = match[3]; month = match[2]; year = match[1];
                                  } else {
                                      // MONTH DD YYYY
                                      match = date.match(RegExp('(' + MONTH_NAME_LIST + ')\\D+([0123]?\\d)\\D+([12]\\d{3})', 'i'));
                                      if (match) {
                                          day = match[2]; month = match[1]; year = match[3];
                                      } else {
                                          throw "Could not parse date";
                                      }
                                  }
                              }
                              
                              // Reconstruct standardized date format
                              date = day + '&nbsp;' + keyword(month) + '&nbsp;' + year;

                              // Detect the month
                              let monthNumber = parseInt(month) - 1;
                              if (isNaN(monthNumber)) {
                                  const target = clean(month);
                                  monthNumber = LOWERCASE_MONTH_NAME.indexOf(target);
                                  if (monthNumber === -1) {
                                      monthNumber = LOWERCASE_MONTH_FULL_NAME.indexOf(target);
                                  }
                              }

                              const dateVal = new Date(Date.UTC(parseInt(year), monthNumber, parseInt(day), standardHour));
                              // Reconstruct the day of the week
                              const dayOfWeek = dateVal.getUTCDay();
                              date = DAY_NAME[dayOfWeek] + '<br>' + date;
                              
                              anyWeekendEvents = anyWeekendEvents || (dayOfWeek === 0) || (dayOfWeek === 6);
                              
                              entryArray.push({date: dateVal, 
                                               title: title,
                                               sourceOrder: entryArray.length,
                                               parenthesized: parenthesized,
                                               
                                               // Don't show text if parenthesized with no body
                                               text: parenthesized ? '' :
                                               entag('tr',
                                                     entag('td', 
                                                           '<a ' + protect('class="target" name="schedule' + scheduleNumber + '_' + dateVal.getUTCFullYear() + '-' + (dateVal.getUTCMonth() + 1) + '-' + dateVal.getUTCDate() + '"') + '>&nbsp;</a>' +
                                                           date, dateTDAttribs) + 
                                                     entag('td', entag('b', title)), rowAttribs) + 
                                               entag('tr', entag('td', '\n\n' + events, eventTDAttribs), rowAttribs)});
                              
                              return '';
                          });
                         
                         // Shallow copy the entries to bypass sorting if needed
                         const sourceEntryArray = option('sortScheduleLists') ? entryArray : entryArray.slice(0);

                         // Sort by date
                         entryArray.sort(function (a, b) {
                             // Javascript's sort is not specified to be
                             // stable, so we have to preserve
                             // sourceOrder in ties.
                             const ta = a.date.getTime();
                             const tb = b.date.getTime();
                             return (ta === tb) ? (a.sourceOrder - b.sourceOrder) : (ta - tb);
                         });
                         
                         const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
                         
                         // May be slightly off due to daylight savings time
                         const approximateDaySpan = (entryArray[entryArray.length - 1].date.getTime() - entryArray[0].date.getTime()) / MILLISECONDS_PER_DAY;
                         
                         let today = new Date();
                         // Move back to midnight
                         today = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), standardHour));
                         
                         let calendar = '';
                         // Make a calendar view with links, if suitable
                         if ((approximateDaySpan > 14) && (approximateDaySpan / entryArray.length < 16)) {
                             const DAY_HEADER_ATTRIBS = protect('colspan="2" width="14%" style="padding-top:5px;text-align:center;font-style:italic"');
                             const DATE_ATTRIBS       = protect('width="1%" height="30px" style="text-align:right;border:1px solid #EEE;border-right:none;"');
                             const FADED_ATTRIBS      = protect('width="1%" height="30px" style="color:#BBB;text-align:right;"');
                             const ENTRY_ATTRIBS      = protect('width="14%" style="border:1px solid #EEE;border-left:none;"');
                             const PARENTHESIZED_ATTRIBS = protect('class="parenthesized"');
                             
                             // Find the first day of the first month
                             let date = entryArray[0].date;
                             let index = 0;
                             
                             const hideWeekends = ! anyWeekendEvents && option('hideEmptyWeekends');
                             const showDate = hideWeekends ? function(date) { return (date.getUTCDay() > 0) && (date.getUTCDay() < 6);} : function() { return true; };
                             
                             const sameDay = function (d1, d2) {
                                 // Account for daylight savings time
                                 return (abs(d1.getTime() - d2.getTime()) < MILLISECONDS_PER_DAY / 2);
                             }
                             
                             // Go to the first of the month
                             date = new Date(date.getUTCFullYear(), date.getUTCMonth(), 1, standardHour);
                             
                             while (date.getTime() < entryArray[entryArray.length - 1].date.getTime()) {
                                 
                                 // Create the calendar header
                                 calendar += '<table ' + protect('class="calendar"') + '>\n' +
                                     entag('tr', entag('th', MONTH_FULL_NAME[date.getUTCMonth()] + ' ' + date.getUTCFullYear(), protect('colspan="14"'))) + '<tr>';
                                 
                                 (hideWeekends ? DAY_NAME.slice(1, 6) : DAY_NAME).forEach(function (name) {
                                     calendar += entag('td', name, DAY_HEADER_ATTRIBS);
                                 });
                                 calendar += '</tr>';
                                 
                                 // Go back into the previous month to reach a Sunday. Check the time at noon
                                 // to avoid problems with daylight saving time occuring early in the morning
                                 while (date.getUTCDay() !== 0) { 
                                     date = new Date(date.getTime() - MILLISECONDS_PER_DAY); 
                                 }
                                 
                                 // Insert the days from the previous month
                                 if (date.getDate() !== 1) {
                                     calendar += '<tr ' + rowAttribs + '>';
                                     while (date.getDate() !== 1) {
                                         if (showDate(date)) { calendar += '<td ' + FADED_ATTRIBS + '>' + date.getUTCDate() + '</td><td>&nbsp;</td>'; }
                                         date = new Date(date.getTime() + MILLISECONDS_PER_DAY);
                                     }
                                 }
                                 
                                 // Run until the end of the month
                                 do {
                                     if (date.getUTCDay() === 0) {
                                         // Sunday, start a row
                                         calendar += '<tr ' + rowAttribs + '>';
                                     }
                                     
                                     if (showDate(date)) {
                                         let attribs = '';
                                         if (sameDay(date, today)) {
                                             attribs = protect('class="today"');
                                         }
                                         
                                         // Insert links as needed from entries
                                         let contents = '';
                                         
                                         for (let entry = entryArray[index]; entry && sameDay(entry.date, date); ++index, entry = entryArray[index]) {
                                             if (contents) { contents += '<br>'; }
                                             if (entry.parenthesized) {
                                                 // Parenthesized with no body, no need for a link
                                                 contents += entag('span', entry.title, PARENTHESIZED_ATTRIBS);
                                             } else {
                                                 contents += entag('a', entry.title, protect('href="#schedule' + scheduleNumber + '_' + date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate() + '"'));
                                             }
                                         }
                                         
                                         if (contents) {
                                             calendar += entag('td', entag('b', date.getUTCDate()), DATE_ATTRIBS + attribs) + entag('td', contents, ENTRY_ATTRIBS + attribs);
                                         } else {
                                             calendar += '<td ' + DATE_ATTRIBS + attribs + '>' + date.getUTCDate() + '</td><td ' + ENTRY_ATTRIBS + attribs + '> &nbsp; </td>';
                                         }
                                     }                                   
                                     
                                     if (date.getUTCDay() === 6) {
                                         // Saturday, end a row
                                         calendar += '</tr>';
                                     }
                                     
                                     // Go to (approximately) the next day
                                     date = new Date(date.getTime() + MILLISECONDS_PER_DAY);
                                 } while (date.getUTCDate() > 1);
                                 
                               // Finish out the week after the end of the month
                               if (date.getUTCDay() !== 0) {
                                   while (date.getUTCDay() !== 0) {
                                       if (showDate(date)) { calendar += '<td ' + FADED_ATTRIBS + '>' + date.getUTCDate() + '</td><td>&nbsp</td>'; }
                                       date = new Date(date.getTime() + MILLISECONDS_PER_DAY);
                                   }
                                   
                                   calendar += '</tr>';
                               }

                               calendar += '</table><br>\n';

                               // Go to the first of the (new) month
                               date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, standardHour));
                               
                           } // Until all days covered
                       } // if add calendar

                       // Construct the schedule
                       schedule = '';
                       sourceEntryArray.forEach(function (entry) {
                           schedule += entry.text;
                       });

                       return '\n\n' + calendar + entag('table', schedule, protect('class="schedule"')) + '\n\n';
                     });
    } catch (ignore) {
        // Maybe this wasn't a schedule after all, since we couldn't parse a date. Don't alarm
        // the user, though
    }

    return str;
}


// Key forms *Key*: **Key**: *Key:* **Key:**. A key is a letter followed by letters
// and digits, or 'Deprecated ', an optional '@', and such a key
const METADATA_LINE_REGEXP = /^(\*{1,2})(?:Deprecated @?[A-Za-z][A-Za-z0-9]*|[A-Za-z][A-Za-z0-9]*)(?::\1|\1:)/;

// A numbered (# Foo) or unnumbered ((#) Foo) header, or an HTML header element, opens
// a metadata block on the line below
const METADATA_ATX_HEADER_REGEXP = /^[ \t]*(?:#{1,6}|\(#{1,6}\))[ \t]|^[ \t]*<h[1-6][\s>]/i;

// A Setext underline, which puts the header on the line above it.
const METADATA_SETEXT_UNDERLINE_REGEXP = /^[ \t]*(?:={3,}|-{3,})[ \t]*$/;


// Split each of the four key forms into the same key
const METADATA_SPLIT_REGEXP = /^(\*{1,2})(Deprecated @?[A-Za-z][A-Za-z0-9]*|[A-Za-z][A-Za-z0-9]*)(?::\1|\1:)(.*)$/;

/** Format each metadata block as one <dl>, so that every value starts at one left
    edge. A block is the run of blank and metadata lines below a header, and ends at
    the first other line. Move a trailing protected marker that trailingMarkerRegexp
    matches, such as a source line number, to the end of the value. structureSections
    later copies the fields onto the heading as data-meta-* attributes. */
function formatMetadataBlocks(str, trailingMarkerRegexp, protect) {
    if (! option('enableMetadataFormatting')) { return str; }

    const lines = str.split('\n');
    const out = [];
    let block = [];

    function flush() {
        if (block.length > 0) {
            out.push('\n</p>\n' + entag('dl', block.join(''), protect('class="metadata"')) + '\n<p>\n');
            block = [];
        }
    }

    let inMetadataBlock = false;
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];

        if ((i + 1 < lines.length) && (line.trim().length > 0) &&
            METADATA_SETEXT_UNDERLINE_REGEXP.test(lines[i + 1])) {
            // Keep a Setext header line; its underline opens the block
            flush();
            inMetadataBlock = false;
            out.push(line);
        } else if (METADATA_SETEXT_UNDERLINE_REGEXP.test(line) ||
                   METADATA_ATX_HEADER_REGEXP.test(line)) {
            flush();
            inMetadataBlock = true;
            out.push(line);
        } else if (inMetadataBlock && (line.trim().length === 0)) {
            // Keep a blank line in the block
            out.push(line);
        } else if (inMetadataBlock && METADATA_LINE_REGEXP.test(line)) {
            const markerMatch = line.match(trailingMarkerRegexp);
            const marker = markerMatch ? markerMatch[0] : '';
            const text = marker ? line.ss(0, line.length - marker.length) : line;
            const parts = text.match(METADATA_SPLIT_REGEXP);

            // Put the key on both cells, because a wrapper around the pair would break
            // the <dl> grid column. METADATA_SPLIT_REGEXP matches only characters that
            // are safe in an attribute. Authors choose the capitalization, so a theme
            // matches case-insensitively, as in `[data-key="published" i]`
            const keyAttribute = protect('data-key="' + parts[2] + '"');
            block.push(entag('dt', parts[2], keyAttribute) +
                       entag('dd', parts[3].trim() + marker, keyAttribute));
        } else {
            flush();
            inMetadataBlock = false;
            out.push(line);
        }
    }
    flush();

    return out.join('\n');
}


/**
 Term
 :     description, which might be multiple
       lines and include blanks.

 Next Term

becomes

<dl>
  <dt>Term</dt>
  <dd> description, which might be multiple 
       lines and include blanks.</dd>
  <dt>Next Term</dt>
</dl>

... unless it is very short, in which case it becomes a table.

*/
function replaceDefinitionLists(s, protect) {
    const TERM       = /^[^\s:].*\n:(?=[ \t])/.source;

    // Definition can contain multiple paragraphs
    const DEFINITION = '(\\s*\n|[: \t].+\n)+';

    s = s.rp(new RegExp('(' + TERM + DEFINITION + ')+', 'gm'),
             function (block) {
                 
                 const list = [];

                 // Parse the block
                 let currentEntry = null;
 
                 block.split('\n').forEach(function (line, i) {
                     // What kind of line is this?
                     if (line.trim().length === 0) {
                         if (currentEntry) {
                             // Empty line
                             currentEntry.definition += '\n';
                         }
                     } else if (! /\s/.test(line[0]) && (line[0] !== ':')) {
                         currentEntry = {term: line, definition: ''};
                         list.push(currentEntry);
                     } else {
                         // Add the line to the current definition, stripping any single leading ':'
                         if (line[0] === ':') { line = ' ' + line.ss(1); }
                         currentEntry.definition += line + '\n';
                     }
                 });

                 let longestDefinition = 0;
                 list.forEach(function (entry) {
                     if (/\n\s*\n/.test(entry.definition.trim())) {
                         // This definition contains multiple paragraphs. Force it into long mode
                         longestDefinition = Infinity;
                     } else {
                         // Normal case
                         longestDefinition = max(longestDefinition, unescapeHTMLEntities(removeHTMLTags(entry.definition)).length);
                     }
                 });

                 let result = '';
                 const definitionStyle = option('definitionStyle');
                 if ((definitionStyle === 'short') || ((definitionStyle !== 'long') && (longestDefinition < 160))) {
                     const rowAttribs = protect('valign=top');
                     // This list has short definitions. Format it as a table
                     list.forEach(function (entry) {
                         result += entag('tr',
                                         entag('td', entag('dt', entry.term)) + 
                                         entag('td', entag('dd', entag('p', entry.definition))), 
                                         rowAttribs);
                     });
                     result = entag('table', result);

                 } else {
                     list.forEach(function (entry) {
                         // Leave *two* blanks at the start of a
                         // definition so that subsequent processing
                         // can detect block formatting within it.
                         result += entag('dt', entry.term) + entag('dd', entag('p', entry.definition));
                     });
                 }

                 return entag('dl', result);

             });

    return s;
}


// Header ID: three capital letters, hex digits, and a checksum letter that is q, j,
// v, or z. The renderer cannot verify the checksum
const DEPRECATED_ID_PREFIX_REGEXP = /^([A-Z][A-Z]{2}[0-9a-f]+[qjvz]):\s+(.+)$/;

// Match the alias `(#word)` only at the end of the title, so that a parenthesized
// `#word` inside a title stays title text
const DEPRECATED_ALIAS_SUFFIX_REGEXP = /\s+\(#([a-z][a-z0-9_-]*)\)\s*$/;

// A number with a trailing dot is a section number. A number without one is a
// section number when the enclosing title had one, so that `1.20 Release Notes` and
// `2025 Report` stay title text
const SECTION_NUMBER_REGEXP = /^\d+(?:\.\d+)*\.\s+/;
const UNDOTTED_SECTION_NUMBER_REGEXP = /^\d+(?:\.\d+)+\s+/;


/** Remove a leading section number when stripSectionNumbers is set. parentNumbered
    is true when the enclosing section's title had a number. */
function stripSectionNumber(title, parentNumbered) {
    if (! option('stripSectionNumbers')) { return {title: title, numbered: false}; }

    const regexp = SECTION_NUMBER_REGEXP.test(title) ? SECTION_NUMBER_REGEXP :
          (parentNumbered && UNDOTTED_SECTION_NUMBER_REGEXP.test(title)) ? UNDOTTED_SECTION_NUMBER_REGEXP : null;

    return regexp ? {title: title.rp(regexp, ''), numbered: true} : {title: title, numbered: false};
}


/** Strip the section number from the first nonblank text node, which may be inside
    an element */
function stripSectionNumberHTML(titleHTML, parentNumbered) {
    const holder = document.createElement('span');
    holder.innerHTML = titleHTML;

    const walker = document.createTreeWalker(holder, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && (node.nodeValue.trim() === '')) { node = walker.nextNode(); }
    if (node) { node.nodeValue = stripSectionNumber(node.nodeValue.rp(/^\s+/, ''), parentNumbered).title; }

    return holder.innerHTML;
}


/** Split a header into its ID, title, and alias. `id` and `alias` are empty
    strings when absent. */
function splitHeaderTitle(text) {
    let id = '';
    let alias = '';
    let title = text;

    const aliasMatch = title.match(DEPRECATED_ALIAS_SUFFIX_REGEXP);
    if (aliasMatch) {
        alias = aliasMatch[1];
        title = title.ss(0, aliasMatch.index);
    }

    const idMatch = title.match(DEPRECATED_ID_PREFIX_REGEXP);
    if (idMatch) {
        id = idMatch[1];
        title = idMatch[2];
    }

    return {id: id, title: title.trim(), alias: alias};
}


/** Put the colon and parentheses in stylesheet content, so that a theme that hides a
    span hides its punctuation. Write the space after the ID span as a text node,
    because double-click selection breaks words only at text in the DOM. */
function headerFieldsHTML(fieldTable) {
    return (fieldTable.id ? entag('span', fieldTable.id, 'class="deprecated-id-definition"') + ' ' : '') +
        fieldTable.title +
        (fieldTable.alias ? entag('span', fieldTable.alias, 'class="deprecated-alias-definition"') : '');
}


/** Return the ID, title, and alias of a header. Split the ID and alias out of
    the text before structureSections() runs, and read their spans after it.
    `title` and `titleText` exclude the target anchors and both spans. */
function headerFieldTable(header) {
    const idElement    = header.querySelector('.deprecated-id-definition');
    const aliasElement = header.querySelector('.deprecated-alias-definition');
    const clone        = header.cloneNode(true);

    toArray(clone.querySelectorAll('a.target, .deprecated-id-definition, .deprecated-alias-definition')).
        forEach(function (element) { element.remove(); });

    let id    = idElement ? idElement.textContent : '';
    let alias = aliasElement ? aliasElement.textContent : '';
    let title = clone.innerHTML.trim();

    if (! idElement && ! aliasElement) {
        const fieldTable = splitHeaderTitle(clone.textContent.trim());
        id    = fieldTable.id;
        alias = fieldTable.alias;
        // Cut the fields from the markup with the same anchored patterns, because
        // they are the first and last text of the heading
        if (alias) { title = title.rp(DEPRECATED_ALIAS_SUFFIX_REGEXP, ''); }
        if (id)    { title = title.rp(RegExp('^' + id + ':\\s+'), ''); }
        clone.innerHTML = title;
    }

    return {id: id, title: title, titleText: clone.textContent.trim(), alias: alias};
}


/** Read the metadata <dl> that formatMetadataBlocks() puts after the heading, past
    decorations and empty paragraphs */
function headingMetadataTable(header) {
    const metadata = {};
    let element = header.nextElementSibling;
    while (element && (element.matches('div.decoration') ||
                       (element.matches('p') && (element.textContent.trim() === '')))) {
        element = element.nextElementSibling;
    }

    if (element && element.matches('dl.metadata')) {
        toArray(element.querySelectorAll('dt[data-key]')).forEach(function (term) {
            metadata[term.getAttribute('data-key')] = term.nextElementSibling.textContent.trim();
        });
    }
    return metadata;
}


/** Lowercase the name, as the browser does for attribute names, so that one selector
    matches both the overview markup and the DOM */
function metadataAttributeName(key) {
    return 'data-meta-' + key.rp(/[^A-Za-z0-9_-]/g, '-').rp(/-+/g, '-').toLowerCase();
}


function metadataAttributesHTML(metadata) {
    if (! metadata) { return ''; }

    let s = '';
    for (const key in metadata) {
        s += ' ' + metadataAttributeName(key) + '="' + escapeHTMLEntities(String(metadata[key])) + '"';
    }
    return s;
}


function targetAnchorHTML(name) {
    return entag('a', '&nbsp;', 'class="target" name="' + name + '"');
}


/** Return the overview list for entryArray, an array of {level, name, id, title,
    alias} in document order. Give each skipped level an entry with no link, because a
    nested <ol> is valid only inside an <li>, and so that nesting depth equals header
    level. */
function overviewListHTML(entryArray) {
    if (entryArray.length === 0) { return ''; }

    let s = '';

    // Open the first <ol> at level 2, because h1 is the document title
    let openLevel = 1;

    entryArray.forEach(function (entry) {
        if (entry.level > openLevel) {
            // Give each level passed on the way down an <li> that contains the next list
            while (openLevel < entry.level) {
                s += '<ol>';
                ++openLevel;
                if (openLevel < entry.level) {
                    s += '<li class="level' + openLevel + '" role="presentation">';
                }
            }
        } else {
            // Close one list and its parent <li> for each level left
            s += '</li>';
            while (openLevel > entry.level) { s += '</ol></li>'; --openLevel; }
        }

        const metadata = metadataAttributesHTML(entry.metadata);
        s += '<li class="level' + entry.level + '"' + metadata + '><a href="#' + entry.name +
            '" target="_self" class="nopreview">' +
            // Wrap the fields in one span, because the CSS counter is the first flex
            // item of the link; the ID and alias spans stay inline in it
            entag('span', headerFieldsHTML(entry), 'class="tocTitle"') + '</a>';
    });

    s += '</li>';
    while (openLevel > 2) { s += '</ol></li>'; --openLevel; }

    return s + '</ol>';
}


/** Compute heading anchors, section numbers, metadata attributes, term anchors,
    section reference targets, and the overview in one pass in document order. Replace
    the previous output, so that the pass can run again after a script changes the
    document. Read titles from the DOM, because the converted source has code, math,
    and attributes as placeholders, and an author-written heading element skips the
    conversion. */
function structureSections() {
    const article    = document.getElementById('article') || document.body;
    const tocDepth   = parseInt(option('tocDepth'));
    const entryArray = [];

    // Index by nesting depth, which is the heading level minus one. Definition terms use
    // the same stack, so that a term is anchored in its section
    const nameStack     = [];
    const headerCounter = [];
    let   currentDepth  = 0;

    // Whether the title of the section at each depth had a number
    const numberedStack = [];

    // The first heading of each mangled title, for section references
    const titleTable = {};
    const termCount  = {};

    // Skip metadata <dl> terms, which are field names
    toArray(article.querySelectorAll('h1, h2, h3, h4, h5, h6, dl:not(.metadata) > dt')).forEach(function (element) {
        if (element.tagName === 'DT') {
            const clone = element.cloneNode(true);
            toArray(clone.querySelectorAll('a.target')).forEach(function (anchor) { anchor.remove(); });
            let name = (nameStack.length > 0 ? nameStack.join('/') + '/' : '') + 'def-' +
                mangleCode(clone.textContent.trim());

            // Number overloaded terms in the same section
            const count = (termCount[name] || 0) + 1;
            termCount[name] = count;
            if (count > 1) { name += '-' + count; }

            element.innerHTML = targetAnchorHTML(name) + clone.innerHTML;
            return;
        }

        const level = parseInt(element.tagName.ss(1));

        // Skip h1, the document title
        if (level === 1) { return; }
        const depth = level - 1;

        // If becoming more nested:
        for (let i = currentDepth; i < depth; ++i) {
            nameStack[i] = '';
            headerCounter[i] = 0;
        }

        // If becoming less nested:
        headerCounter.splice(depth, currentDepth - depth);
        nameStack.splice(depth, currentDepth - depth);
        currentDepth = depth;

        ++headerCounter[currentDepth - 1];
        const number = headerCounter.join('.');

        // Derive the anchor from the title, excluding the ID and alias
        const fieldTable = headerFieldTable(element);

        // Remove the section number from both the display and the anchor
        const parentNumbered = (depth > 1) && numberedStack[depth - 2];
        const stripped = stripSectionNumber(fieldTable.titleText, parentNumbered);
        numberedStack[depth - 1] = stripped.numbered;
        if (stripped.numbered) {
            fieldTable.titleText = stripped.title;
            fieldTable.title = stripSectionNumberHTML(fieldTable.title, parentNumbered);
        }

        const title = mangle(fieldTable.titleText);
        nameStack[currentDepth - 1] = title;
        const name = nameStack.join('/');

        // Add anchors for the ID, which stays valid when the title changes, and for the
        // alias. Make the anchors children of the heading, because siblings before it
        // would push it down in block flow
        element.innerHTML = targetAnchorHTML(name) +
            (fieldTable.id    ? targetAnchorHTML(fieldTable.id)    : '') +
            (fieldTable.alias ? targetAnchorHTML(fieldTable.alias) : '') +
            headerFieldsHTML(fieldTable);
        element.setAttribute('data-section-number', number);

        toArray(element.attributes).forEach(function (attribute) {
            if (attribute.name.ss(0, 10) === 'data-meta-') { element.removeAttribute(attribute.name); }
        });
        const metadata = headingMetadataTable(element);
        for (const key in metadata) {
            element.setAttribute(metadataAttributeName(key), metadata[key]);
        }

        if (! (title in titleTable)) { titleTable[title] = {name: name, number: number, text: fieldTable.titleText}; }

        if (level <= tocDepth) {
            // Keep only the text of a link in the title, because the entry is a link
            const title = fieldTable.title.rp(/<a\s[^>]*>([\s\S]*?)<\/a>/g, '$1');
            entryArray.push({level: level, name: name, id: fieldTable.id, title: title,
                             alias: fieldTable.alias, metadata: metadata});
        }
    });

    // Set the text of a numbered reference to the section number, or to the title when
    // numbers are hidden
    const showNumber = option('showSectionNumbers');
    toArray(article.querySelectorAll('a.section-reference')).forEach(function (link) {
        const section = titleTable[link.getAttribute('data-section')];
        if (section) {
            link.setAttribute('href', '#' + section.name);
            if (link.classList.contains('numbered')) { link.textContent = showNumber ? section.number : section.text; }
        } else {
            link.removeAttribute('href');
            if (link.classList.contains('numbered')) { link.textContent = '?'; }
        }
    });

    // Under 'inset', put the overview in a box in the article flow, after the title
    // block or at the top of the article
    let overview = document.querySelector('.longTOC, .insetTOC');
    if (! overview && (alignment('main_nav') === 'inset')) {
        overview = document.createElement('div');
        overview.className = 'insetTOC';
        const afterTitles = article.querySelector('div.afterTitles');
        if (afterTitles) {
            afterTitles.parentNode.insertBefore(overview, afterTitles.nextSibling);
        } else {
            article.insertBefore(overview, article.firstChild);
        }
    }
    if (overview) { overview.innerHTML = overviewListHTML(entryArray); }

    // Reinstall the reading position mark in the rebuilt overview
    installReadingPositionMark();
}


/** Rebuild the anchors and the overview after a script changes the section
    structure */
function rebuildTableOfContents() {
    structureSections();
}


function escapeRegExpCharacters(str) {
    return str.rp(/([\.\[\]\(\)\*\+\?\^\$\\\{\}\|])/g, '\\$1');
}


/** Returns true if there are at least two newlines in each of the arguments */
function isolated(preSpaces, postSpaces) {
    if (preSpaces && postSpaces) {
        preSpaces  = preSpaces.match(/\n/g);
        postSpaces = postSpaces.match(/\n/g);
        return preSpaces && (preSpaces.length > 1) && postSpaces && (postSpaces.length > 1);
    } else {
        return false;
    }
}


// Write the private-use character as an escape, because it is invisible
const PROTECT_CHARACTER = '\ue010';

/**
    Wraps header sections in <section> tags with classes h1-section, h2-section, etc.
    Each section begins at the first <a class="target"> tag before a header and ends
    at the next same-or-lower level header or the end of content.
    Sections are properly nested (h3 inside h2 inside h1).
 */
function wrapHeaderSections(str) {
    const startTime = Date.now();
    
    // Safety timeout - if this takes more than 5 seconds, abort
    const TIMEOUT_MS = 5000;
    
    // Find all headers - match just the <h1-6> tags first, then look backwards for anchors
    // This avoids catastrophic backtracking from nested quantifiers
    const headerPattern = /<h([1-6])[^>]*>/g;
    const headers = [];
    let match;
    let matchCount = 0;
    
    // Collect all header positions and levels
    while ((match = headerPattern.exec(str)) !== null) {
        matchCount++;
        const headerPos = match.index;
        const headerLevel = parseInt(match[1]);
        
        // Look backwards from the header to find preceding anchor tags
        // Anchors should be immediately before the header (with possible whitespace)
        const searchStart = Math.max(0, headerPos - 500); // Look back up to 500 chars
        const precedingText = str.substring(searchStart, headerPos);
        
        // Find anchor tags using a simple string search instead of regex to avoid backtracking
        // We're looking for patterns like: <a �0123�>&nbsp;</a>

        const anchorMatches = [];
        let searchPos = 0;
        while (searchPos < precedingText.length) {
            const anchorStart = precedingText.indexOf('<a ', searchPos);
            if (anchorStart === -1) break;
            
            // Look for the protected attribute pattern
            const attrStart = precedingText.indexOf(PROTECT_CHARACTER, anchorStart);
            if (attrStart === -1 || attrStart > anchorStart + 10) {
                searchPos = anchorStart + 1;
                continue;
            }
            
            // Find the closing >
            const tagEnd = precedingText.indexOf('>', attrStart);
            if (tagEnd === -1) break;
            
            // Find the closing </a>
            const anchorEnd = precedingText.indexOf('</a>', tagEnd);
            if (anchorEnd === -1) break;
            
            anchorMatches.push({
                index: anchorStart,
                0: precedingText.substring(anchorStart, anchorEnd + 4)
            });
            
            searchPos = anchorEnd + 4;
        }
        
        // If we found anchors, use the position of the first one in the last consecutive group
        let anchorStartPos = headerPos;
        if (anchorMatches.length > 0) {
            // Find the start of the last consecutive group of anchors
            const lastMatch = anchorMatches[anchorMatches.length - 1];
            const lastMatchEnd = lastMatch.index + lastMatch[0].length;
            
            // Check if this anchor is immediately before the header (with only whitespace between)
            const betweenText = precedingText.substring(lastMatchEnd).rp(DECORATION_REGEXP, '');
            if (/^\s*$/.test(betweenText)) {
                // Find the start of consecutive anchors working backwards
                let firstInGroup = anchorMatches.length - 1;
                for (let i = anchorMatches.length - 2; i >= 0; i--) {
                    const currentEnd = anchorMatches[i].index + anchorMatches[i][0].length;
                    const nextStart = anchorMatches[i + 1].index;
                    const between = precedingText.substring(currentEnd, nextStart).rp(DECORATION_REGEXP, '');
                    if (/^\s*$/.test(between)) {
                        firstInGroup = i;
                    } else {
                        break;
                    }
                }
                anchorStartPos = searchStart + anchorMatches[firstInGroup].index;
            }
        }
        
        headers.push({
            position: anchorStartPos,
            level: headerLevel,
            anchorLength: headerPos - anchorStartPos
        });
        
        // Safety checks
        if (Date.now() - startTime > TIMEOUT_MS) {
            console.error('[wrapHeaderSections] Timeout after', Date.now() - startTime, 'ms, aborting');
            return str;
        }
        if (matchCount > 10000) {
            console.error('[wrapHeaderSections] Too many matches, aborting');
            return str;
        }
    }
    
    
    if (headers.length === 0) {
        return str; // No headers, nothing to wrap
    }
    
    // Build insertion points for section tags
    // We need to track when to open and close sections based on header hierarchy
    const insertions = [];
    
    for (let i = 0; i < headers.length; i++) {
        const currentLevel = headers[i].level;
        const currentPos = headers[i].position;
        
        // Open a section at this header
        insertions.push({
            position: currentPos,
            type: 'open',
            level: currentLevel
        });
        
        // Determine where to close this section
        // It closes when we encounter a same-or-lower level header, or at the end
        let closePos = str.length;
        for (let j = i + 1; j < headers.length; j++) {
            if (headers[j].level <= currentLevel) {
                closePos = headers[j].position;
                break;
            }
        }
        
        // Close this section (and any deeper sections) before the next same-or-lower header
        insertions.push({
            position: closePos,
            type: 'close',
            level: currentLevel
        });
    }
    
    
    // Sort insertions by position (descending) and type
    // Since we insert in reverse order, the sort order determines the final output order in reverse
    insertions.sort(function(a, b) {
        if (a.position !== b.position) {
            return b.position - a.position; // Reverse order for string insertion
        }
        // At same position, we're inserting in reverse, so:
        // - To get: <section></section> in output
        // - We need to insert: </section> then <section>
        // - So in sort order: <section> should come BEFORE </section>
        if (a.type === 'open' && b.type === 'close') return -1;
        if (a.type === 'close' && b.type === 'open') return 1;
        // If both same type at same position, order by level
        if (a.type === 'close') {
            return a.level - b.level; // Lower level (deeper) closes first
        } else {
            return b.level - a.level; // Higher level (shallower) opens first
        }
    });
    
    
    // Insert tags in reverse position order
    for (let i = 0; i < insertions.length; i++) {
        const insertion = insertions[i];
        const tag = insertion.type === 'open' 
            ? '<section class="h' + insertion.level + '-section">' + decoration('start')
            : decoration('end') + '</section>';
        
        str = str.substring(0, insertion.position) + tag + str.substring(insertion.position);
    }
    
    return str;
}

// The title from the 'document' mode conversion, for the caller that installs the
// page. An 'element' conversion leaves it unchanged.
let documentTitleText = '';

/** Highlight `source` as `lang`. Report an unknown language and return the source
    unhighlighted, so that a misspelled language name leaves the render
    running.
    @param {string} source
    @param {string} lang */
function highlightAs(source, lang) {
    if (hljs.getLanguage(lang)) {
        return hljs.highlight(source, {language: lang, ignoreIllegals: true});
    }
    console.error('Unknown code language: ' + lang);
    return hljs.highlightAuto(source, []);
}

/** Return the body HTML of `str`, a string or a DOM element, without the stylesheet,
    the math library script tags, or the signature footer. outputMode selects what
    surrounds the body:

    'document' (the default)
      The whole page: site elements, the main grid, and the article, with a table of
      contents, a document title, and numbered sections.

    'element'
      The body in a <div class="md">, for a page that the caller controls. Omit the
      page structure and the table of contents, and keep a bold first word as text.

    'bare'
      The body alone, for a caller that supplies its own .md ancestor, such as
      contentToHTML(), whose result goes in the page structure, where another wrapper
      would recurse. */
function markdeepToHTML(str, outputMode) {

    // Map names to the number used for end notes, in the order
    // encountered in the text.
    let endNoteTable = {}, endNoteCount = 0;

    /** @type {Record<string, {link: string, attribs?: string}>} */
    const referenceLinkTable = {};

    // Use base 32 for encoding numbers, which is efficient in terms of 
    // characters but avoids 'x' to avoid the pattern \dx\d, which Markdeep would
    // beautify as a dimension
    const PROTECT_RADIX     = 32;
    const protectedStringArray = [];

    // Gives 1e6 possible sequences in base 32, which should be sufficient
    const PROTECT_DIGITS    = 4;

    // Put the protect character at BOTH ends to avoid having the protected number encoding
    // look like an actual number to further markdown processing
    const PROTECT_REGEXP    = RegExp(PROTECT_CHARACTER + '[0-9a-w]{' + PROTECT_DIGITS + ',' + PROTECT_DIGITS + '}' + PROTECT_CHARACTER, 'g');

    /** Given an arbitrary string, returns an escaped identifier
        string to temporarily replace it with to prevent Markdeep from
        processing the contents. See expose() */
    function protect(s) {
        // Generate the replacement index, converted to an alphanumeric string
        let i = (protectedStringArray.push(s) - 1).toString(PROTECT_RADIX);

        // Ensure fixed length
        while (i.length < PROTECT_DIGITS) {
            i = '0' + i;
        }

        return PROTECT_CHARACTER + i + PROTECT_CHARACTER;
    }

    let exposeRan = false;
    /** Given the escaped identifier string from protect(), returns
        the orginal string. */
    function expose(i) {
        // Strip the escape character and parse, then look up in the
        // dictionary.
        const j = parseInt(i.ss(1, i.length - 1), PROTECT_RADIX);
        exposeRan = true;
        return protectedStringArray[j];
    }

    /** First-class function to pass to String.replace to protect a
        sequence defined by a regular expression. */
    function protector(match, protectee) {
        return protect(protectee);
    }

    function protectorWithPrefix(match, prefix, protectee) {
        return prefix + protect(protectee);
    }

    // SECTION HEADERS
    // This is common code for numbered headers. No-number ATX headers are processed
    // separately
    function makeHeaderFunc(level) {
        return function (match, header) {
            // structureSections() computes the anchors, number, and metadata from the
            // rendered title text
            const tag = entag('h' + level, header);

            if (level === 1) {
                // structureSections() inserts the overview after the afterTitles
                // spacer
                return '\n\n</p>\n' + decoration('before') + tag + decoration('after') +
                    '\n' + entag('div', '', protect('class="afterTitles"')) + '\n<p>\n\n';
            } else {
                return '\n\n</p>\n' + decoration('before') + tag + decoration('after') + '\n<p>\n\n';
            }
        }
    }

    if (outputMode === undefined) {
        outputMode = 'document';
    } else if ((outputMode !== 'document') && (outputMode !== 'element') && (outputMode !== 'bare')) {
        throw new Error("markdeep.format(): mode must be 'document', 'element', or 'bare', not " +
                        JSON.stringify(outputMode));
    }

    const documentMode = (outputMode === 'document');
    
    if (str.innerHTML !== undefined) {
        str = str.innerHTML;
    }

    setURLVariables();
    str = runGenerators(str);
    str = escapePlaintextTags(str);

    // Prefix a newline so that blocks beginning at the top of the
    // document are processed correctly
    str = '\n\n' + str;

    // ============================================================================
    // PHASE 1: SOURCE LINE TRACKING - Inject line number markers
    // ============================================================================
    //
    // ALGORITHM OVERVIEW:
    // 
    // This phase injects protected markers ⟨L:N⟩ into the source text before
    // Markdeep processing. These markers survive markdown→HTML conversion and
    // are later extracted to set data-src-line attributes on DOM elements.
    //
    // PROCESSING FLOW:
    // 1. Split document into lines
    // 2. Iterate line-by-line with a state machine to track special blocks
    // 3. When entering a special block (fence, diagram, HTML tag), skip forward
    //    looking ONLY for that block's closing pattern
    // 4. For normal lines (headers, paragraphs), inject protected marker ⟨L:N⟩
    // 5. Rejoin lines into string for Markdeep processing
    //
    // MARKER PROTECTION:
    // - protect('⟨L:123⟩') → stores in protectedStringArray, returns �00da�
    // - Markdeep ignores �00da� during processing
    // - Later, expose() converts �00da� → ⟨L:123⟩ in final HTML
    // - DOM walker finds ⟨L:123⟩ in text nodes, sets data-src-line="123"
    //
    // STATE MACHINE:
    // - mode = 'normal': Check for opening patterns, inject markers
    // - mode = 'script'/'style'/'pre': Skip until closing HTML tag
    // - mode = 'fence': Skip until closing fence with matching indent
    // - mode = 'diagram': Skip until closing ***** boundary
    //
    // SPECIAL CASES:
    // - Self-closing HTML tags on one line are marked normally
    // - Nested blocks are handled correctly (e.g., fence inside <script>)
    // - Indented fences must match opening indent to close
    //
    // ============================================================================
    
    // Under node there is no including page.
    const isIncludedDocument = IN_BROWSER && /[?&]id=inc\d+(&|$)/.test(window.location.search);
    // Walk the lines in every output mode, to find the prose lines in which URL
    // variables expand. Insert markers in document mode of a document that is not
    // included.
    const markLines = documentMode && !isIncludedDocument;
    const urlTable = option('variables');
    const lines = str.split('\n');
    let markerCount = 0;
    let mode = 'normal';  // 'normal', 'script', 'style', 'pre', 'fence', 'diagram'
    let blockStartLine = -1;  // For debugging
    let fenceIndent = '';     // Store opening fence indent to match closing
    let fenceChar = '';       // Store fence character (~ or `)
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let shouldMark = false;
        
        // ----------------------------------------------------------------
        // STATE: Inside a special block - look for closing pattern only
        // ----------------------------------------------------------------
        
        if (mode === 'script') {
            if (line.match(/^[ \t]*<\/script>/i)) {
                mode = 'normal';
            }
            continue;  // Skip this line
        }
        
        if (mode === 'style') {
            if (line.match(/^[ \t]*<\/style>/i)) {
                mode = 'normal';
            }
            continue;
        }
        
        if (mode === 'pre') {
            if (line.match(/^[ \t]*<\/pre>/i)) {
                mode = 'normal';
            }
            continue;
        }
        
        if (mode === 'fence') {
            // Closing fence must match opening indent and character
            const escapedIndent = fenceIndent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const closingPattern = new RegExp('^' + escapedIndent + '\\' + fenceChar + '{3,}[ \\t]*$');
            if (line.match(closingPattern)) {
                mode = 'normal';
            }
            continue;
        }
        
        if (mode === 'diagram') {
            // Closing diagram boundary: line with *****
            if (line.indexOf('*****') >= 0) {
                mode = 'normal';
            }
            continue;
        }
        
        // ----------------------------------------------------------------
        // STATE: Normal mode - check for opening patterns
        // ----------------------------------------------------------------
        
        // HTML <script> tags (but check for self-closing on same line)
        const scriptMatch = line.match(/^[ \t]*<script[\s>]/i);
        if (scriptMatch) {
            // Check if it closes on the same line
            if (!line.match(/<\/script>/i)) {
                mode = 'script';
                blockStartLine = i;
                continue;
            }
        }
        
        // HTML <style> tags
        const styleMatch = line.match(/^[ \t]*<style[\s>]/i);
        if (styleMatch) {
            if (!line.match(/<\/style>/i)) {
                mode = 'style';
                blockStartLine = i;
                continue;
            }
        }
        
        // HTML <pre> tags
        const preMatch = line.match(/^[ \t]*<pre[\s>]/i);
        if (preMatch) {
            if (!line.match(/<\/pre>/i)) {
                mode = 'pre';
                blockStartLine = i;
                continue;
            }
        }
        
        // A fence is a maximal run of three or more ~ or `. An info string that starts
        // with punctuation, as in a Python traceback underline (~~~~~~^^^^^^), makes the
        // line text. These flat passes lack the block indent, so a caller that has the
        // block context enforces the indent bound.
        const fenceMatch = line.match(/^([ \t]*)(~{3,}(?!~)|`{3,}(?!`))(?![ \t]*[~^!@#$%&*.,\/?:;|=+])/);
        if (fenceMatch) {
            mode = 'fence';
            fenceIndent = fenceMatch[1];
            fenceChar = fenceMatch[2][0];  // First char (~ or `)
            blockStartLine = i;
            continue;
        }
        
        // Diagram blocks: line with ***** followed by lines with * in diagram column
        if (line.indexOf('*****') >= 0) {
            // For inline diagrams, the ***** might be at the end of a text line
            // Check if next line has * at the same column position (or starts with *)
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                const starPos = line.indexOf('*****');
                
                // Check if next line starts with * (standalone diagram)
                // OR has * at the diagram column position (inline diagram)
                if (nextLine.match(/^[ \t]*\*/) || 
                    (nextLine.length > starPos && nextLine[starPos] === '*')) {
                    mode = 'diagram';
                    blockStartLine = i;
                    continue;
                }
            }
        }
        
        // Expand URL variables in a prose line, with the line number that its marker uses
        line = expandURLVariables(line, urlTable, i - 1);
        lines[i] = line;

        // ----------------------------------------------------------------
        // Decide whether to mark this normal line
        // ----------------------------------------------------------------
        
        // Check if this is a Setext header (next line is all = or -)
        let isSetextHeader = false;
        if (i + 1 < lines.length && line.trim().length > 0) {
            const nextLine = lines[i + 1];
            if (nextLine.match(/^[ \t]*=+[ \t]*$/) || nextLine.match(/^[ \t]*-+[ \t]*$/)) {
                // But make sure it's not a table separator (has | or :)
                if (!nextLine.match(/[|:]/)) {
                    isSetextHeader = true;
                }
            }
        }
        
        // Skip Setext header lines and their underlines
        if (isSetextHeader) {
            continue;  // Skip this line and let the underline be skipped by horizontal rule check
        }
        
        // Mark ATX headers (#, ##, etc.)
        if (line.match(/^#{1,6}\s/)) {
            shouldMark = true;
        }
        // Leave structural lines unmarked
        if (line.match(/^[ \t]*[~`]{3,}/) ||              // Fences
                 line.match(/^[ \t]*=+[ \t]*$/) ||             // Setext underlines (=)
                 line.match(/^[ \t]*[-*_]{3,}[ \t]*$/) ||      // Horizontal rules or Setext underlines (-)
                 line.indexOf('*****') >= 0 ||                 // Diagram boundaries (inline or standalone)
                 line.match(/^[ \t]*\|/) ||                    // Table rows (start with |)
                 (line.indexOf('|') >= 0 && line.indexOf('|', line.indexOf('|') + 1) >= 0) ||  // Table rows (contain at least two |)
                 line.match(/^[ \t]*:?-+:?[ \t]*\|/) ||        // Table separator (dashes with |)
                 line.match(/^[ \t]*>/) ||                     // Blockquotes  
                 line.match(/^[ \t]*\d+\.[ \t]/) ||            // Numbered lists
                 line.match(/^[ \t]*[-+*][ \t]/) ||            // Bullet lists
                 line.match(/^[ \t]*\[[^\]]+\]:[ \t]+\S/) ||   // Reference definitions
                 line.match(/^[ \t]*\[[^\]]+\][ \t]*$/) ||     // Caption lines ([text] alone on a line)
                 line.match(/^[ \t]*!!!/) ||                   // Admonitions
                 line.match(/^[ \t]*!\[/) ||                   // Image lines (captioned, grid, or standalone)
                 line.match(/\]\([^"<>\s)]+[^)]*\)\s*$/) ||    // Image continuation lines (closing ](url...) of multi-line images)
                 line.match(/https?:\/\/\S+\s*$/) ||           // Lines ending in a bare URL (autolinker would consume the trailing protection sentinel and mangle the href)
                 line.match(/^[ \t]*(?:!\[[^\]]*\]\([^)]*\)[ \t]*)+[ \t]*$/) ||  // Image grid lines (one or more images only)
                 line.match(/\b(figure|fig\.|table|tbl\.|listing|lst\.|diagram|section|subsection|chapter|sec\.)\s+\[/i)) {  // Keyword [ref] patterns
            // Skip these
        }
        // Mark all other non-empty lines (including bold, italic, etc.)
        else if (line.trim().length > 0) {
            // Leave a line without letters or digits unmarked, because a marker breaks
            // a structural line
            if (line.match(/[A-Za-z0-9]/)) {
                shouldMark = true;
            }
        }
        
        // ----------------------------------------------------------------
        // Inject marker into this line
        // ----------------------------------------------------------------
        
        if (markLines && shouldMark) {
            // Append the marker, so that inline syntax such as a checkbox or a date
            // stays whole
            const firstNonWhitespace = line.search(/\S/);
            if (firstNonWhitespace >= 0) {
                // Calculate 1-based line number (subtract 1 because we added '\n\n' prefix)
                let lineNum = i - 1;
                if (lineNum < 1) { lineNum = 1; }
                
                lines[i] = line + protect('⟨L:' + lineNum + '⟩');
                markerCount++;
            }
        }
    }
    
    // ----------------------------------------------------------------
    // Rejoin lines and log summary
    // ----------------------------------------------------------------
    
    str = lines.join('\n');
    
    // Warn if we ended in a special block (unclosed)
    if (mode !== 'normal') {
        console.warn('[MDVIEW] WARNING: Document ended in mode "' + mode + '" (started at line ' + blockStartLine + ')');
    }

    // Replace each code fence that is a diagram or has no label. Leave labeled code
    // fences for the listing pass.
    const cleanupCodeFences = function (s) {
        // A diagram is a code fence and nothing else. Put its fence classes on a div
        // around the diagram and caption, as listings do
        const renderDiagram = function (indent, content, classString, caption) {
            content = content.rp(new RegExp('(^|\n)' + indent, 'g'), '$1');
            let target = '';
            let captionHTML = '';
            if (caption) {
                // Strip whitespace and enclosing brackets from the caption
                caption = caption.trim();
                const processedCaption = createTarget(caption.ss(1, caption.length - 1), protect);
                target = processedCaption.target;
                captionHTML = entag('center', entag('div', processedCaption.caption, protect('class="imagecaption"')));
            }
            const captionAbove = option('captionAbove', 'diagram');
            let block = (captionHTML && captionAbove ? captionHTML : '') +
                // Wrap the <svg> in a scroll box, because an outermost <svg> does not scroll
                '<div ' + protect('class="scrollable"') + '>' + diagramToSVG(content) + '</div>' +
                (captionHTML && ! captionAbove ? captionHTML : '');
            if (classString) {
                block = '<div ' + protect('class="' + classString + '"') + '>' + block + '</div>';
            }
            // Close the paragraph around the diagram block, as listings do
            return '\n' + indent + '</p>' + target + block + '<p>\n';
        };

        // Treat a first token other than a language name, 'diagram', or 'none' as a
        // CSS class, and detect the block as unlabeled
        const splitFenceLabel = function (label) {
            const tokenArray = label.trim().split(/\s+/);
            if ((tokenArray[0] === 'diagram') || (tokenArray[0] === 'none') || hljs.getLanguage(tokenArray[0])) {
                return {lang: tokenArray[0], classString: tokenArray.slice(1).join(' ')};
            }
            return {lang: undefined, classString: tokenArray.join(' ')};
        };

        // Hide labeled code fences, so that their closing markers stay out of the
        // unlabeled fence pattern
        const hiddenFenceArray = [];
        // The reject set for the first character of the label also keeps the opening
        // run maximal. The closing fence is the same character and at least as long,
        // as in CommonMark.
        const labeledFencePattern = /\n([ \t]*)((`|~)\3{2,})([ \t]*[^~`\s!@#$%&*.,\/?:;|=+^]\S*(?:[ \t]+.+)?)\n([\s\S]+?)\n\1\2\3*[ \t]*\n((?:[ \t]*\[.+(?:\n.+){0,3}\])?)/g;
        s = s.rp(labeledFencePattern, function(match, indent, fence, fenceChar, label, content, caption) {
            const parsed = splitFenceLabel(label);
            if ((parsed.lang === 'diagram') || ((parsed.lang === undefined) && looksLikeDiagram(content))) {
                return renderDiagram(indent, content, parsed.classString, caption);
            }
            let hidden = match;
            if (parsed.lang === undefined) {
                // Name the detected language, so that the listing pass reads the
                // remaining tokens as classes
                const classOnlyDetection = hljs.highlightAuto(content);
                const classOnlyLang = (classOnlyDetection.language && classOnlyDetection.relevance > 0) ? classOnlyDetection.language : 'none';
                hidden = '\n' + indent + fence + ' ' + classOnlyLang + ' ' + parsed.classString + '\n' +
                    content + '\n' + indent + fence + '\n' + caption;
            }
            const index = hiddenFenceArray.length;
            hiddenFenceArray.push(hidden);
            // Private-use delimiters, invisible written literally
            return '\n\ue000FENCE' + index + '\ue001\n';
        });

        // Render an unlabeled diagram, or label the fence with the detected language
        s = s.rp(/\n([ \t]*)((`|~)\3{2,})[ \t]*\n([\s\S]+?)\n\1\2\3*[ \t]*\n((?:[ \t]*\[.+(?:\n.+){0,3}\])?)/g, function(match, indent, fence, fenceChar, content, caption) {
            if (looksLikeDiagram(content)) {
                return renderDiagram(indent, content, '', caption);
            }
            const detected = hljs.highlightAuto(content);
            const lang = (detected.language && detected.relevance > 0) ? detected.language : 'none';
            return '\n' + indent + fence + ' ' + lang + '\n' + content + '\n' + indent + fence + '\n' + caption;
        });

        // Restore the hidden labeled fences
        s = s.rp(/\n\ue000FENCE(\d+)\ue001\n/g, function(match, index) {
            return hiddenFenceArray[parseInt(index)];
        });

        return s;
    };

    // Replace each labeled code fence with a listing. cleanupCodeFences() labels every
    // remaining code fence first.
    const processLabeledCodeFences = function (s) {
        const processOneFenceType = function (s, cssClass, symbol) {
            // The language token has the reject set of labeledFencePattern. The closing
            // fence repeats the opening run and may be longer, as in CommonMark.
            const pattern = new RegExp('\n([ \\t]*)(' + symbol + '{3,})([ \\t]*[^~`\\s!@#$%&*.,/?:;|=+^]\\S*)([ \\t]+.+)?\n([\\s\\S]+?)\n\\1\\2' + symbol + '*[ \t]*\n([ \\t]*\\[.+(?:\n.+){0,3}\\])?', 'g');
            s = s.rp(pattern, function(match, indent, fence, lang, cssSubClass, sourceCode, caption) {
                lang = lang ? lang.trim() : undefined;
                let processedCaption;
                if (caption) {
                    // Strip the caption brackets, as for a diagram
                    caption = caption.trim();
                    processedCaption = createTarget(caption.ss(1, caption.length - 1), protect);
                    caption = processedCaption.caption;
                    caption = entag('center', '<div ' + protect('class="listingcaption ' + cssClass + '"') + '>' + caption + '</div>') + '\n';
                }
                sourceCode = sourceCode.rp(new RegExp('(^|\n)' + indent, 'g'), '$1');
                const captionAbove = option('captionAbove', 'listing');
                // Put the fence-line classes on a div around the listing and its caption.
                // Each interlaced segment keeps its own classes.
                const listingClassString = cssSubClass ? cssSubClass.trim() : '';
                let nextSourceCode, nextLang, nextCssSubClass;
                const body = [];
                do {
                    nextSourceCode = nextLang = nextCssSubClass = undefined;
                    // Apply the reject set to interlaced segments too, so that a
                    // traceback underline in a tilde listing stays in the listing
                    sourceCode = sourceCode.rp(new RegExp('\\n([ \\t]*)' + symbol + '{3,}([ \\t]*[^~`\\s!@#$%&*.,/?:;|=+^]\\S*)([ \\t]+.+)?\n([\\s\\S]*)'),
                                               function (match, indent, lang, cssSubClass, everythingElse) {
                                                   nextLang = lang;
                                                   nextCssSubClass = cssSubClass;
                                                   nextSourceCode = everythingElse;
                                                   return '';
                                               });
                    let result;
                    if (lang === 'none') {
                        result = hljs.highlightAuto(sourceCode, []);
                    } else if (lang === undefined) {
                        result = hljs.highlightAuto(sourceCode);
                    } else {
                        result = highlightAs(sourceCode, lang);
                    }
                    let highlighted = result.value;
                    highlighted = highlighted.rp(/^(.*)$/gm, entag('span', '', 'class="line"') + '$1');
                    if (cssSubClass) {
                        highlighted = entag('div', highlighted, 'class="' + cssSubClass + '"');
                    }
                    body.push(highlighted);
                    sourceCode = nextSourceCode;
                    lang = nextLang ? nextLang.trim() : undefined;
                    cssSubClass = nextCssSubClass;
                } while (sourceCode);
                let listing = (caption && captionAbove ? caption : '') +
                    protect(entag('pre', entag('code', body.join('')), 'class="listing ' + cssClass + '"')) +
                    (caption && ! captionAbove ? caption : '');
                if (listingClassString) {
                    listing = entag('div', listing, protect('class="' + listingClassString + '"'));
                }
                return '\n' + indent + '</p>' + (processedCaption? processedCaption.target : '') + listing + '<p>\n';
            });
            return s;
        };
        s = processOneFenceType(s, 'tilde', '~');
        s = processOneFenceType(s, 'backtick', '`');
        return s;
    };

    str = cleanupCodeFences(str);
    str = processLabeledCodeFences(str);

    const FANCY_QUOTE = protect('class="fancyquote"');

    // BLOCKQUOTE: > in front of a series of lines
    // Process iteratively to support nested blockquotes
    let foundBlockquote = false;
    do {
        foundBlockquote = false;
        str = str.rp(/(?:\n>.*){2,}/g, function (match) {
            // Strip the leading '>', then process code fences in the blockquote body
            foundBlockquote = true;
            let body = match.rp(/\n>/g, '\n');
            // Append a newline, which the fence patterns require after a closing fence
            // at the end of the body, and remove it after
            body = processLabeledCodeFences(cleanupCodeFences(body + '\n'));
            if (body.endsWith('\n')) { body = body.ss(0, body.length - 1); }

            // FANCY QUOTE: " .... " with an optional author. Match after the fence
            // passes, so that a quote in a code fence is protected.
            body = body.rp(/\n[ \t]*"(.*(?:\n.*)*)"[ \t]*(?:\n[ \t]*)?\n([ \t]{2,}\S.*)?\n/g,
                         function (fmatch, quote, author) {
                             return entag('blockquote',
                                          entag('span', quote, FANCY_QUOTE) +
                                          (author ? entag('span', author,
                                                          protect('class="author"')) : ''),
                                          FANCY_QUOTE);
                         });

            return entag('blockquote', body);
        });
    } while (foundBlockquote);

    // Highlight explicit inline code
    str = str.rp(/<code\s+lang\s*=\s*["']?([^"'\s>\)\[\]]+)["']?\s*>(.*)<\/code>/gi, function (match, lang, body) {
        return entag('code', highlightAs(body, lang).value, 'lang=' + lang);
    });
    
    // Protect raw <CODE> content
    str = str.rp(/(<code\b.*?<\/code>)/gi, protector);

    // Remove XML/HTML COMMENTS
    // https://html.spec.whatwg.org/multipage/syntax.html#comments
    str = str.rp(/<!--((?!->|>)[\s\S]*?)-->/g, '');

    // Protect SVG blocks (including the ones cleanupCodeFences inserted)
    str = str.rp(/<svg( .*?)?>([\s\S]*?)<\/svg>/gi, function (match, attribs, body) {
        return '<svg' + protect(attribs) + '>' + protect(body) + '</svg>';
    });
    
    // Treat a <style> or <script> in a listing or a code span as text. Search a blanked
    // copy, so that such a tag leaves the real tags after it intact.
    const findTagBlocks = function (str, tagName, wrap) {
        const blanked   = blankRenderedCode(str);
        const regexp    = RegExp('<' + tagName + '(\\b[^>]*)?>([\\s\\S]*?)<\\/' + tagName + '>', 'gi');
        const partArray = [];
        let lastIndex = 0;
        let match;

        while ((match = regexp.exec(blanked)) !== null) {
            partArray.push(str.ss(lastIndex, match.index));
            partArray.push(wrap(str.ss(match.index, regexp.lastIndex)));
            lastIndex = regexp.lastIndex;
        }
        partArray.push(str.ss(lastIndex));

        return partArray.join('');
    };

    // Protect STYLE blocks
    str = findTagBlocks(str, 'style', function (whole) {
        return entag('style', protect(whole.rp(/^<style[^>]*>|<\/style>$/gi, '')));
    });

    // Protect SCRIPT blocks from the typography and markdown passes. The script runs in
    // the output as other embedded HTML does.
    str = findTagBlocks(str, 'script', function (whole) {
        const openTagEnd = whole.indexOf('>');
        const attribs    = whole.ss('<script'.length, openTagEnd);
        const body       = whole.ss(openTagEnd + 1, whole.length - '</script>'.length);

        return '<script' + (attribs ? protect(attribs) : '') + '>' + (body ? protect(body) : '') + '</script>';
    });

    // Protect the very special case of img tags with newlines and
    // breaks in them AND mismatched angle brackets. This happens for
    // Gravizo graphs.
    str = str.rp(/<img\s+src=(["'])[\s\S]*?\1\s*>/gi, function (match, quote) {
        // Strip the "<img " and ">", and then protect the interior:
        return "<img " + protect(match.ss(5, match.length - 1)) + ">";
    });

    // TABLE PIPE ESCAPES: in a table region, an escaped pipe is a literal pipe. Inline
    // code and math in a cell are unprotected here, so this applies in them too, as in
    // GFM. A doubled backslash before a pipe leaves one backslash and a pipe.
    const TABLE_REGION_REGEXP = new RegExp(TABLE_ROW_SOURCE + TABLE_SEPARATOR_SOURCE +
                                         TABLE_ROW_SOURCE + '+(' + TABLE_CAPTION_SOURCE + ')?', 'g');
    str = str.rp(TABLE_REGION_REGEXP, function (region) {
        return region.rp(/\\\|/g, protect('|'));
    });

    // INLINE CODE: Surrounded in (non-escaped!) back ticks on a single line.  Do this before any other
    // processing except for diagrams to protect code blocks from further interference. Don't process back ticks
    // inside of code fences. Allow a single newline, but not wrapping further because that
    // might just pick up quotes used as other punctuation across lines. Explicitly exclude
    // cases where the second quote immediately preceeds a number, e.g., "the old `97"
    const inlineLang = option('inlineCodeLang');
    const inlineCodeRegexp = /(^|[^\\])`(.*?(?:\n.*?)?[^\n\\`])`(?!\d)/g;
    if (inlineLang) {
        // Syntax highlight as well as converting to code. Protect
        // so that the hljs output isn't itself escaped below.
        const filenameRegexp = /^[a-zA-Z]:\\|^\/[a-zA-Z_\.]|^[a-z]{3,5}:\/\//;
        str = str.rp(inlineCodeRegexp, function (match, before, body) {
            // Remove the source-line marker from a span that crosses a newline, because
            // the highlighter would emit it as text
            const source = exposeAll(body).rp(/⟨L:\d+⟩/g, '');

            if (filenameRegexp.test(source)) {
                // This looks like a filename, don't highlight it
                return before + entag('code', source);
            } else {
                return before + protect(entag('code', highlightAs(source, inlineLang).value));
            }
        });
    } else {
        str = str.rp(inlineCodeRegexp, '$1' + entag('code', '$2'));
    }

    // Unescape escaped backticks
    str = str.rp(/\\`/g, '`');
    
    // CODE: Escape angle brackets inside code blocks (including the ones we just introduced),
    // and then protect the blocks themselves
    str = str.rp(/(<code(?: .*?)?>)([\s\S]*?)<\/code>/gi, function (match, open, inlineCode) {
        return protect(open + escapeHTMLEntities(inlineCode) + '</code>');
    });
    
    // PRE: Protect pre blocks
    str = str.rp(/(<pre\b[\s\S]*?<\/pre>)/gi, protector);

    // Protect raw HTML attributes from processing
    str = str.rp(/(<\w[^ \n<>]*?[ \t]+)(.*?)(?=\/?>)/g, protectorWithPrefix);

    // End of processing literal blocks
    /////////////////////////////////////////////////////////////////////////////

    // Temporarily hide $$ MathJax LaTeX blocks from Markdown processing (this must
    // come before single $ block detection below)
    str = str.rp(/(\$\$[\s\S]+?\$\$)/g, protector);

    // Convert LaTeX $ ... $ to MathJax, but verify that this
    // actually looks like math and not just dollar
    // signs. Don't rp double-dollar signs. Do this only
    // outside of protected blocks.

    // Also allow LaTeX of the form $...$ if the close tag is not US$ or Can$
    // and there are spaces outside of the dollar signs.
    //
    // Test: " $3 or US$2 and 3$, $x$ $y + \n 2x$ or ($z$) $k$. or $2 or $2".match(pattern) = 
    // ["$x$", "$y +  2x$", "$z$", "$k$"];
    str = str.rp(/((?:[^\w\d]))\$(\S(?:[^\$]*?\S(?!US|Can))??)\$(?![\w\d])/g, '$1\\($2\\)');

    //
    // Literally: find a non-dollar sign, non-number followed
    // by a dollar sign and a space.  Then, find any number of
    // characters until the same pattern reversed, allowing
    // one punctuation character before the final space. We're
    // trying to exclude things like Canadian 1$ and US $1
    // triggering math mode.

    str = str.rp(/((?:[^\w\d]))\$([ \t][^\$]+?[ \t])\$(?![\w\d])/g, '$1\\($2\\)');

    // Temporarily hide MathJax LaTeX blocks from Markdown processing
    str = str.rp(/(\\\([\s\S]+?\\\))/g, protector);
    str = str.rp(/(\\begin\{equation\}[\s\S]*?\\end\{equation\})/g, protector);
    str = str.rp(/(\\begin\{eqnarray\}[\s\S]*?\\end\{eqnarray\})/g, protector);
    str = str.rp(/(\\begin\{equation\*\}[\s\S]*?\\end\{equation\*\})/g, protector);

    // METADATA BLOCKS: format each metadata block as a <dl>. Run while headers still
    // have their # and ===== spellings, which mark where a block starts.
    str = formatMetadataBlocks(str, RegExp(PROTECT_CHARACTER + '[0-9a-w]{' + PROTECT_DIGITS + '}' + PROTECT_CHARACTER + '$'), protect);

    // HEADERS
    //
    // We consume leading and trailing whitespace to avoid creating an extra paragraph tag
    // around the header itself.

    // An ATX # header is the title. A Setext === header is a level-1 section and
    // --- a level-2 section.

    // Setext-style: Text with ======== right under it
    str = str.rp(/(?:^|\s*\n)(.+?)\n[ \t]*={3,}[ \t]*\n/g, makeHeaderFunc(2));
    str = str.rp(/(?:^|\s*\n)(.+?)\n[ \t]*-{3,}[ \t]*\n/g, makeHeaderFunc(3));

    // ATX-style headers:
    //
    //  # Foo #
    //  # Foo
    //  (# Bar)
    //
    // If note that '#' in the title are only stripped if they appear at the end, in
    // order to allow headers with # in the title.

    // Pattern to match optional protected line number markers (e.g., \ue010XXXX\ue010)
    // Private use, so invisible written literally
    const OPTIONAL_LINE_NUM = '(?:\ue010[0-9a-w]{4}\ue010)?';
    
    // A single # makes the h1 title
    for (let i = 6; i > 0; --i) {
        // Allow a line number marker after the closing #
        str = str.rp(new RegExp(/^\s*/.source + '#{' + i + ',' + i +'}(?:[ \t])([^\n]+?)#*[ \t]*' + OPTIONAL_LINE_NUM + '\n', 'gm'),
                 makeHeaderFunc(i));

        str = str.rp(new RegExp(/^\s*/.source + '\\(#{' + i + ',' + i +'}\\)(?:[ \t])([^\n]+?)\\(?#*\\)?' + OPTIONAL_LINE_NUM + '\\n[ \t]*\n', 'gm'),
                     '\n</p>\n' + entag('div', '$1', protect('class="nonumberh' + i + '"')) + '\n<p>\n\n');
    }

    // HORIZONTAL RULE: * * *, - - -, _ _ _
    str = str.rp(/\n[ \t]*((\*|-|_)[ \t]*){3,}[ \t]*\n/g, '\n<hr>\n');

    // PAGE BREAK or HORIZONTAL RULE: +++++
    str = str.rp(/\n[ \t]*\+{5,}[ \t]*\n/g, '\n<hr ' + protect('class="pagebreak"') + '>\n');

    // ADMONITION: !!! (class) (title)\n body
    str = str.rp(/^!!![ \t]*([^\s"'><&\:]*)\:?(.*)\n([ \t]{3,}.*\s*\n)*/gm, function (match, cssClass, title) {
        // Extract the body from the match, because a repeated group captures only its
        // last line. Strip the indent common to the whole body, because relative indent is
        // meaningful. Keep the blank lines around it, which isolated() and the list
        // passes read.
        const body = removeLeadingSpace(match.ss(match.indexOf('\n')));
        return '\n\n' + entag('div', (title ? entag('div', title, protect('class="admonition-title"')) + '\n' : '') + body, protect('class="admonition ' + cssClass.toLowerCase().trim() + '"')) + '\n\n';
    });

    // FOOTNOTES/ENDNOTES: [^symbolic name]. Disallow spaces in footnote names to
    // make parsing unambiguous. Consume leading space before the footnote.
    function endNote(match, symbolicNameA) {
        const symbolicName = symbolicNameA.toLowerCase().trim();

        if (! (symbolicName in endNoteTable)) {
            ++endNoteCount;
            endNoteTable[symbolicName] = endNoteCount;
        }

        return '<sup><a ' + protect('href="#endnote-' + symbolicName + '" target="_self"') + 
            '>' + endNoteTable[symbolicName] + '</a></sup>';
    }    
    str = str.rp(/[ \t]*\[\^([^\]\n\t ]+)\](?!:)/g, endNote);
    str = str.rp(/(\S)[ \t]*\[\^([^\]\n\t ]+)\]/g, function(match, pre, symbolicNameA) { return pre + endNote(match, symbolicNameA); });


    // CITATIONS: [#symbolicname]
    // The bibliography entry:
    str = str.rp(/\n\[#(\S+)\]:[ \t]+((?:[ \t]*\S[^\n]*\n?)*)/g, function (match, symbolicName, entry) {
        symbolicName = symbolicName.trim();
        return '<div ' + protect('class="bib"') + '>[<a ' + protect('class="target" name="citation-' + symbolicName.toLowerCase() + '"') + 
            '>&nbsp;</a><b>' + symbolicName + '</b>] ' + entry + '</div>';
    });
    
    // A reference:
    // (must process AFTER the definitions, since the syntax is a subset)
    str = str.rp(/\[(#[^\)\(\[\]\.#\s]+(?:\s*,\s*#(?:[^\)\(\[\]\.#\s]+))*)\]/g, function (match, symbolicNameList) {
        // Parse the symbolicNameList
        symbolicNameList = symbolicNameList.split(',');
        let s = '[';
        for (let i = 0; i < symbolicNameList.length; ++i) {
            // Strip spaces and # signs
            const name = symbolicNameList[i].rp(/#| /g, '');
            s += entag('a', name, protect('href="#citation-' + name.toLowerCase() + '" target="_self"'));
            if (i < symbolicNameList.length - 1) { s += ', '; }
        }
        return s + ']';
    });
    

    // TABLES: line with | over line containing only | and -
    // (process before reference links to avoid ambiguity on the captions)
    str = replaceTables(str, protect);

    // REFERENCE-LINK TABLE: [foo]: http://foo.com
    // (must come before reference images and reference links in processing)
    str = str.rp(/^\[([^\^#].*?)\]:(.*?)$/gm, function (match, symbolicName, url) {
        referenceLinkTable[symbolicName.toLowerCase().trim()] = {link: url.trim()};
        return '';
    });

    // EMAIL ADDRESS: <foo@example.com>, or foo@example.com outside a URL. Exclude the
    // brackets from the address, so that the < of a preceding tag stays out of it.
    str = str.rp(/(?:<|(?!<)\b)([^\s<>]+@([^\s<>]+\.)+?[^\s<>]{2,}?)(?:$|>|(?=<)|(?=\s)(?!>))/g, function (match, addr) {
        if (/http:|ftp:|https:|svn:|:\/\/|\.html|\(|\)|\]/.test(match)) {
            // This is a hyperlink to a url with an @ sign, not an email address
            return match;
        } else {
            return '<a ' + protect('href="mailto:' + addr.rp(/^mailto:/i, '') + '"') + '>' + addr + '</a>';
        }
    });

    // Common code for formatting images
    const formatImage = function (ignore, url, attribs) {

        attribs = attribs || '';
        let img;
        let hash;

        let attrib_url = '', attrib_text = '';
        
        // Strip attrib property
        attribs = attribs.rp(/attrib\s*=\s*(?<quote>['"])(([^\n'"])*)\k<quote>/, function (match, quote, text) {
            attrib_text = text.trim();
            return '';
        });

        // Strip attrib-url property
        attribs = attribs.rp(/attrib-url\s*=\s*(?<quote>['"]?)(([^\n'"])*)\k<quote>/, function (match, quote, text) {
            attrib_url = text.trim();
            return '';
        });

        // Detect videos
        if (/\.(mp4|m4v|avi|mpg|mov|webm)$/i.test(url)) {
            // This is video. Any attributes provided will override the defaults given here
            img = '<video ' + protect('class="markdeep" src="' + url + '"' + attribs + ' width="480px" controls="true"') + '></video>';
        } else if (/\.(mp3|mp2|ogg|wav|m4a|aac|flac)$/i.test(url)) {
            // Audio
            img = '<audio ' + protect('class="markdeep" controls ' + attribs + '><source src="' + url + '"') + '></audio>';
        } else if (hash = url.match(/^https:\/\/(?:www\.)?(?:youtube\.com\/\S*?v=|youtu\.be\/)([\w\d-]+).*?(?:\?t=(\d*))?(&.*)?$/i)) {
            if (hash[2]) {
                // YouTube video with timestamp
                img = '<iframe ' + protect('class="markdeep" src="https://www.youtube.com/embed/' + hash[1] + "?start=" + hash[2] + '"' + attribs + ' width="480px" height="300px" frameborder="0" allowfullscreen webkitallowfullscreen mozallowfullscreen') + '></iframe>';
            } else {
                // YouTube video from the begining
                img = '<iframe ' + protect('class="markdeep" src="https://www.youtube.com/embed/' + hash[1] + '"' + attribs + ' width="480px" height="300px" frameborder="0" allowfullscreen webkitallowfullscreen mozallowfullscreen') + '></iframe>';
            } 
        } else if (hash = url.match(/^https:\/\/(?:www\.)?vimeo.com\/\S*?\/([\w\d-]+)$/i)) {
            // Vimeo video
            img = '<iframe ' + protect('class="markdeep" src="https://player.vimeo.com/video/' + hash[1] + '"' + attribs + ' width="480px" height="300px" frameborder="0" allowfullscreen webkitallowfullscreen mozallowfullscreen') + '></iframe>';
        } else {
            // Image (trailing space is needed in case attribs must be quoted by the
            // browser...without the space, the browser will put the closing slash in the
            // quotes.)

            let classList = 'markdeep';
            // Remove classes from attribs
            attribs = attribs.rp(/(^|\s)class *= *(["'])([^'"]+)\2/, function (match, lead, quote, cls) {
                classList += ' ' + cls;
                return lead;
            });
            attribs = attribs.rp(/(^|\s)class *= *([^"' ]+)/, function (match, lead, cls) {
                classList += ' ' + cls;
                return lead;
            });
            
            img = '<img ' + protect('class="' + classList + '" src="' + url + '"' + attribs) + '>';
            if (option('autoLinkImages')) {
                // The image is the destination, so a preview would only repeat it
                img = entag('a', img, protect('class="nopreview" href="' + url + '" target="_blank"'));
            }

            if (attrib_text !== '') {
                // Wrap in a div for the attribution
                if (attrib_url !== '') {
                    // Move the link to the text
                    attrib_text = entag('a', attrib_text, protect('href="' + attrib_url + '"'));
                }
                
                img = entag('div',
                            img + entag('div',
                                        attrib_text,
                                        protect('class="img-attrib"')),
                            protect('class="img-attrib-container" style="display: inline-block; position: relative"'));
            } // if attrib
        }

        return img;
    };

    // Reformat equation links that have brackets: eqn [foo] --> eqn \ref{foo} so that
    // mathjax can process them.
    str = str.rp(/\b(equation|eqn\.|eq\.)\s*\[([^\s\]]+)\]/gi, function (match, eq, label) {
        return eq + ' \\ref{' + label + '}';
    });


    // Reformat figure links that have subfigure labels in parentheses, to avoid them being
    // processed as links
    str = str.rp(/\b(figure|fig\.|table|tbl\.|listing|lst\.)\s*\[([^\s\]]+)\](?=\()/gi, function (match) {
        return match + '<span></span>';
    });


    // Process links before images so that captions can contain links

    // Detect gravizo URLs inside of markdown images and protect them, 
    // which will cause them to be parsed sort-of reasonably. This is
    // a really special case needed to handle the newlines and potential
    // nested parentheses. Use the pattern from http://blog.stevenlevithan.com/archives/regex-recursion
    // (could be extended to multiple nested parens if needed)
    str = str.rp(/\(http:\/\/g.gravizo.com\/(.*g)\?((?:[^\(\)]|\([^\(\)]*\))*)\)/gi, function(match, protocol, url) {
        return "(http://g.gravizo.com/" + protocol + "?" + encodeURIComponent(url) + ")";
    });

    // HYPERLINKS: [text](url attribs). The link text is unescaped characters and escaped
    // brackets. The guard excludes ! (image syntax) and a backslash (an escaped bracket).
    // Bound the attribute match, so that malformed input cannot backtrack
    // catastrophically. A quoted URL may contain parentheses, and ends at the closing
    // quote.
    str = str.rp(/(^|[^!\\])\[((?:[^\[\]\\]|\\[\[\]])+?)\]\(("?)((?<=")[^"<>\s]+|[^<>\s"\)]+)\3(\s+[^\)]{0,200})?\)/g, function (match, pre, text, maybeQuote, url, attribs) {
        attribs = attribs || '';
        // Un-escape brackets in the link text
        text = text.rp(/\\([\[\]])/g, '$1');
        return pre + '<a ' + protect('href="' + url + '"' + attribs) + '>' + text + '</a>' + maybeShowLabel(url);
    });

    // EMPTY HYPERLINKS: [](url)
    str = str.rp(/(^|[^!\\])\[[ \t]*?\]\(("?)((?<=")[^"<>\s]+|[^<>\s"\)]+)\2\)/g, function (match, pre, maybeQuote, url) {
        // The link text is the URL, so it is protected from the autolinker that runs later
        return pre + '<a ' + protect('href="' + url + '"') + '>' + protect(url) + '</a>';
    });

    // REFERENCE LINK: []:
    // Text pattern (?:[^\[\]\\]|\\[\[\]])+ matches either unescaped chars or \[, \]
    str = str.rp(/(^|[^!\\])\[((?:[^\[\]\\]|\\[\[\]])+)\]\[([^\[\]]*)\]/g, function (match, pre, text, symbolicName) {
        // Un-escape brackets in the link text
        text = text.rp(/\\([\[\]])/g, '$1');
        // Empty symbolic name is replaced by the label text
        if (! symbolicName.trim()) {
            symbolicName = text;
        }
        
        symbolicName = symbolicName.toLowerCase().trim();
        const t = referenceLinkTable[symbolicName];
        if (! t) {
            console.error('Unknown reference: ' + symbolicName);
            return '?';
        } else {
            return pre + '<a ' + protect('href="' + t.link + '"') + '>' + text + '</a>';
        }
    });
    
    // REFERENCE IMAGE: ![...][ref attribs]
    // Rewrite as a regular image for further processing below.
    // Limit attribute matching to prevent catastrophic backtracking on malformed input
    str = str.rp(/(!\[.*?\])\[([^<>\[\]\s]+?)([ \t][^\n\[\]]{0,200})?\]/g, function (match, caption, symbolicName, attribs) {
        symbolicName = symbolicName.toLowerCase().trim();
        const t = referenceLinkTable[symbolicName];
        if (! t) {
            console.error('Unknown reference image: ' + symbolicName);
            return '?';
        } else {
            const s = caption + '(' + t.link + (t.attribs || '') + ')';
            return s;
        }
    });

    
    // IMAGE GRID: Rewrite rows and grids of images into a grid
    const imageGridAttribs = protect('width="100%"');
    const imageGridRowAttribs = protect('valign="top"');
    
    // Match each line that is only images and an optional line number marker, and group
    // consecutive lines in code, because a quantifier nested in {2,} backtracks
    // exponentially. The lookahead leaves the newline for the next line. Write the
    // private-use character as an escape, because it is invisible.
    const imageLineRegex = /\n((?:[ \t]*!\[[^\]]{0,100}\]\([^<>\s\)]+(?:[^\n\)]{0,200})?\))+[ \t]*(?:\ue010[0-9a-w]{4}\ue010)?)(?=\n)/g;
    
    // First pass: find all image lines and their positions
    const imageLines = [];
    let match;
    while ((match = imageLineRegex.exec(str)) !== null) {
        imageLines.push({
            index: match.index,
            length: match[0].length,
            content: match[0]
        });
    }
    
    // Second pass: group consecutive image lines into grids
    const replacements = [];
    for (let i = 0; i < imageLines.length; i++) {
        const gridStart = i;
        let gridEnd = i;
        let expectedNextIndex = imageLines[i].index + imageLines[i].length;
        
        // Find consecutive image lines
        while (gridEnd + 1 < imageLines.length && imageLines[gridEnd + 1].index === expectedNextIndex) {
            gridEnd++;
            expectedNextIndex = imageLines[gridEnd].index + imageLines[gridEnd].length;
        }
        
        // If we have at least 2 consecutive lines, or 2+ images on one line, create a grid
        const gridLength = gridEnd - gridStart + 1;
        if (gridLength >= 2) {
            const gridMatch = str.substring(imageLines[gridStart].index, expectedNextIndex);
            replacements.push({
                start: imageLines[gridStart].index,
                end: expectedNextIndex,
                match: gridMatch
            });
            i = gridEnd; // Skip processed lines
        }
    }
    
    // Apply replacements in reverse order to maintain indices
    for (let i = replacements.length - 1; i >= 0; i--) {
        const r = replacements[i];
        const match = r.match;
        let table = '';

        // Break into rows:
        const rows = match.split('\n');

        // Parse each row:
        let rowNum = 0;
        rows.forEach(function(row) {
            rowNum++;
            row = row.trim();
            if (row) {
                // Parse each image
                // Limit attribute matching to prevent catastrophic backtracking on malformed input
                // Limit caption length with {0,100} to prevent catastrophic backtracking
                table += entag('tr', row.rp(/[ \t]*!\[[^\]]{0,100}\]\([^\)\s]+([^\)]{0,200})?\)/g, function(image, attribs) {
                    //if (! /width|height/i.test(attribs) {
                        // Add a bogus "width" attribute to force the images to be hyperlinked to their
                        // full-resolution versions
                    //}
                    return entag('td', '\n\n'+ image + '\n\n');
                }), imageGridRowAttribs);
            }
        });

        const replacement = '\n' + entag('table', table, imageGridAttribs) + '\n';
        str = str.substring(0, r.start) + replacement + str.substring(r.end);
    }

    // SIMPLE IMAGE: ![](url attribs)
    // Limit attribute matching to prevent catastrophic backtracking on malformed input
    str = str.rp(/(\s*)!\[\]\(("?)((?<=")[^"<>\s]+|[^"<>\s\)]+)\2(\s[^\)]{0,200})?\)(\s*)/g, function (match, preSpaces, maybeQuote, url, attribs, postSpaces) {
        let img = formatImage(match, url, attribs);
        
        if (isolated(preSpaces, postSpaces)) {
            // In a block by itself: center
            img = entag('center', img);
        }

        return preSpaces + img + postSpaces;
    });

    // Explicit loop so that the output will be re-processed, preserving spaces between blocks.
    // Note that there is intentionally no global flag on the first regexp since we only want
    // to process the first occurance.
    let loop = true;
    const imageCaptionAbove = option('captionAbove', 'image');
    while (loop) {
        loop = false;

        // CAPTIONED IMAGE: ![caption](url attribs)
        // The caption ends at the first ] before ( or [, so that a caption can contain
        // label brackets ("Figure [x]: ...") and stays inside its own image. A caption
        // may contain newlines but not a blank line, which bounds the match at a
        // paragraph break. Bound the attribute match against catastrophic backtracking.
        str = str.rp(/(\s*)!\[((?:[^\]\n]|\](?![\[\(])|\n(?![ \t]*\n))+?)\]\(("?)((?<=")[^"<>\s]+|[^"<>\s\)]+)\3(\s[^\)]{0,200})?\)(\s*)/, function (match, preSpaces, caption, maybeQuote, url, attribs, postSpaces) {
            loop = true;
            // Un-escape brackets in the caption
            caption = caption.rp(/\\([\[\]])/g, '$1');
            let divStyle = '';
            const iso = isolated(preSpaces, postSpaces);

            // Only floating images get their size attributes moved to the whole box
            if (attribs && ! iso) {
                // Move any width *style* specification to the box itself
                attribs = attribs.rp(/((?:max-)?width)\s*:\s*[^;'"]*/g, function (attribMatch, attrib) {
                    divStyle = attribMatch + ';';
                    return attrib + ':100%';
                });
                
                // Move any width *attribute* specification to the box itself
                attribs = attribs.rp(/((?:max-)?width)\s*=\s*('\S+?'|"\S+?")/g, function (attribMatch, attrib, expr) {
                    // Strip the quotes
                    divStyle = attrib + ':' + expr.ss(1, expr.length - 1) + ';';
                    return 'style="' + attrib + ':100%" ';
                });
            }

            const img = formatImage(match, url, attribs);

            // Center an image in its own block in the content area, and float an image in
            // a paragraph right
            if (! iso) {
                divStyle += 'float:right;margin:4px 0px 0px 25px;';
            }
            const blockOpen = iso ? '<center ' + protect('class="wide"') + '>' : '';
            const blockClose = iso ? '</center>' : '';

            const processedCaption = createTarget(caption, protect);
            const captionHTML = entag('center', entag('span', processedCaption.caption + maybeShowLabel(url), protect('class="imagecaption"')));

            return processedCaption.target + preSpaces + blockOpen +
            entag('div', decoration('start') +
                  (imageCaptionAbove ? captionHTML : '') + img + (! imageCaptionAbove ? captionHTML : '') +
                  decoration('end'), protect('class="image" style="' + divStyle + '"')) +
            blockClose + postSpaces;
        });
    } // while replacements made
    
    ////////////////////////////////////////////

    // Process these after links, so that URLs with underscores and tildes are protected.

    // STRONG: Must run before italic, since they use the
    // same symbols. **b** __b__
    str = replaceMatched(str, /\*\*/, 'strong', protect('class="asterisk"'));
    str = replaceMatched(str, /__/, 'strong', protect('class="underscore"'), function(fullString, afterOffset, content, delim, matchStart, match) {
        // Leave __ before ( or a period and a letter, as in Python magic methods
        // (__init__) and file paths (__init__.py)
        if (afterOffset < fullString.length) {
            const nextChar = fullString[afterOffset];
            if (nextChar === '(') {
                return true;
            } else if (nextChar === '.' && afterOffset + 1 < fullString.length && /[a-zA-Z]/.test(fullString[afterOffset + 1])) {
                return true;
            }
        }
        return false;
    });

    // EM (ITALICS): *i* _i_
    str = replaceMatched(str, /\*/, 'em', protect('class="asterisk"'));
    str = replaceMatched(str, /_/, 'em', protect('class="underscore"'), function(fullString, afterOffset, content, delim, matchStart, match) {
        // Skip a match that starts with _, which is part of a __ pair such as __init__.
        // The flanking rule keeps the content from starting with _, so a leading _ is
        // the opening delimiter.
        if ((matchStart >= 0) && (matchStart < fullString.length) && (fullString[matchStart] === '_')) {
            return true;
        }

        // Skip a match whose closing _ precedes another _, as in
        // _infrastructure/__init__, because that closing _ starts a __ pair
        if ((afterOffset < fullString.length) && (fullString[afterOffset] === '_')) {
            return true;
        }

        // Skip a match before ( or a period and a letter, as in _init_(self) or
        // _init_.py
        if (afterOffset < fullString.length) {
            const nextChar = fullString[afterOffset];
            if ((nextChar === '(') || (nextChar === '.' && afterOffset + 1 < fullString.length && /[a-zA-Z]/.test(fullString[afterOffset + 1]))) {
                return true;
            }
        }
        
        return false;
    });
    
    // STRIKETHROUGH: ~~text~~
    str = str.rp(/\~\~([^~].*?)\~\~/g, entag('del', '$1'));

    // STAGE DIRECTIONS: ((text))
    if (option('enableStageDirections')) {
        // Block level: a line with only the stage direction and an optional line number
        // marker at its end
        const defined_protect_marker = PROTECT_CHARACTER + '[0-9a-w]{' + PROTECT_DIGITS + '}' + PROTECT_CHARACTER;
        const blockRe = RegExp('^[ \\t]*(?:\\(\\(|⸨)([^)]*(?:\\([^)]*\\))*[^)]*)(?:\\)\\)|⸩)(' + defined_protect_marker + ')?[ \\t]*$', 'mg');
        str = str.rp(blockRe,
            entag('div', '$1', protect('class="stage-direction"')) + '$2');
        // Inline: stage direction with other content on the line
        str = str.rp(/\(\(([^)]*(?:\([^)]*\))*[^)]*)\)\)/g,
            entag('span', '$1', protect('class="stage-direction"')));
    }


    // SMART DOUBLE QUOTES: "a -> localized &ldquo;   z"  -> localized &rdquo;
    // Allow situations such as "foo"==>"bar" and foo:"bar", but not 3' 9"
    if (option('smartQuotes')) {
        str = str.rp(/(^|[ \t->])(")(?=[\p{L}\p{N}_])/gmu, '$1' + keyword('&ldquo;'));
        str = str.rp(/([\p{L}\p{M}.,:;?!=<])(")(?=$|\W)/gmu, '$1' + keyword('&rdquo;'));
    }
    
    // ARROWS:
    str = str.rp(/(\s|^)<==(\s)/g, '$1⇐$2');
    str = str.rp(/(\s|^)->(\s)/g, '$1&rarr;$2');
    // (this requires having removed HTML comments first)
    str = str.rp(/(\s|^)-->(\s)/g, '$1&xrarr;$2');
    str = str.rp(/(\s|^)==>(\s)/g, '$1⇒$2');
    str = str.rp(/(\s|^)<-(\s)/g, '$1&larr;$2');
    str = str.rp(/(\s|^)<--(\s)/g, '$1&xlarr;$2');
    str = str.rp(/(\s|^)<==>(\s)/g, '$1⇔$2');
    str = str.rp(/(\s|^)<->(\s)/g, '$1↔$2');

    // EM DASH: ---
    // (exclude things that look like table delimiters!)
    str = str.rp(/([^-!\:\|])---([^->\:\|])/g, '$1&mdash;$2');

    // EM DASH: --, except beside a table delimiter character, and except between a
    // space and a letter, as in the flag --help. An en dash is too short and reads as a
    // minus.
    str = str.rp(/([^-!\:\|])--([^->\:\|])/g, function (match, before, after) {
        if (/\s/.test(before) && /[A-Za-z]/.test(after)) { return match; }
        return before + '&mdash;' + after;
    });

    // NUMBER x NUMBER: dimensions such as 720x360, 2 x 4, and 3px x 17px. Leave
    // identifiers such as NukYS1x75u8D and 0xDEADBEEF: the first number follows a
    // character that is not alphanumeric and starts with 1 through 9, and a number
    // above 9999 needs whitespace around the x. Leave a number after a keyword such
    // as hash or id.
    str = str.rp(/((?:^|[^a-zA-Z0-9])(?:(?:number|key|sku|id|hash|commit|git)[:\*]*[ \t]*)?)([1-9]\d*[a-z]*)([ \t]?)x([ \t]?)(\d+)/gi, function(match, prefix, num1, ws1, ws2, num2) {
        if (/(?:number|key|sku|id|hash|commit|git)[:\*]*\s*$/i.test(prefix)) {
            return match;
        }
        const hasWhitespace = ws1 || ws2;
        const n1 = parseInt(num1, 10);
        const n2 = parseInt(num2, 10);
        if (!hasWhitespace && (n1 > 9999 || n2 > 9999)) {
            return match;
        }
        return prefix + num1 + ws1 + '&times;' + ws2 + num2;
    });

    // MINUS: -4 or 2 - 1
    str = str.rp(/([\s\(\[<\|])-(\d)/g, '$1&minus;$2');
    str = str.rp(/(\d) - (\d)/g, '$1 &minus; $2');

    // EXPONENTS: ^1 ^-1 (no decimal places allowed)
    str = str.rp(/\^([-+]?\d+)\b/g, '<sup>$1</sup>');

    // PAGE BREAK:
    str = str.rp(/(^|\s|\b)\\(pagebreak|newpage)(\b|\s|$)/gi, protect('<div style="page-break-after:always"> </div>\n'))
    
    // SCHEDULE LISTS: date : title followed by indented content
    str = replaceScheduleLists(str, protect);

    // DEFINITION LISTS: Word followed by a colon list
    // Use <dl><dt>term</dt><dd>definition</dd></dl>
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl
    //
    // Process these before lists so that lists within definition lists
    // work correctly
    str = replaceDefinitionLists(str, protect);

    // LISTS: lines with -, +, *, or number.
    str = replaceLists(str, protect);

    // DEGREE: ##-degree
    str = str.rp(/(\d+?)[ \t-]?\n?degrees?\b/g, '$1&deg;');

    // COMMONMARK LINE BREAKS: a trailing backslash, or two or more trailing spaces,
    // makes a <br>. Code, pre, style, and SVG are protected, so these patterns match
    // only prose. A line number marker may come before the newline.
    const defined_optional_marker = '(' + PROTECT_CHARACTER + '[0-9a-w]{' + PROTECT_DIGITS + '}' + PROTECT_CHARACTER + ')?';

    if (option('enableBackslashLineBreak')) {
        str = str.rp(new RegExp('(^|[^\\\\])\\\\' + defined_optional_marker + '\\n', 'gm'),
                     '$1$2\n<br>');
    }

    if (option('enableHiddenLineBreak')) {
        // Leave the line before a list item unbroken, so that the list stays whole
        str = str.rp(new RegExp('(\\S)  +' + defined_optional_marker + '\\n(?![ \\t]*\\n)(?![ \\t]*(?:-|\\+|\\*|\\d+\\.|☐|☑)[ \\t])', 'g'),
                     '$1$2\n<br>');
    }

    // PARAGRAPH: Newline, any amount of space, newline...as long as there isn't already
    // a paragraph break there.
    str = str.rp(/(?:<p>)?\n\s*\n+(?!<\/p>)/gi,
                 function(match) { return (/^<p>/i.test(match)) ? match : '\n\n</p><p>\n\n';});

    // Remove empty paragraphs (mostly avoided by the above, but some can still occur)
    str = str.rp(/<p>(?:\s\n)*<\/p>/gi, '');


    // FOOTNOTES/ENDNOTES
    str = str.rp(/\n\[\^(\S+)\]: ((?:.+?\n?)*)/g, function (match, symbolicName, note) {
        symbolicName = symbolicName.toLowerCase().trim();
        if (symbolicName in endNoteTable) {
            return '\n<div ' + protect('class="endnote"') + '><a ' + 
                protect('class="target" name="endnote-' + symbolicName + '"') + 
                '>&nbsp;</a><sup>' + endNoteTable[symbolicName] + '</sup> ' + note + '</div>';
        } else {
            console.error('Endnote definition without a reference: ' + symbolicName);
            return "\n";
        }
    });
    

    // SECTION LINKS: Foo section, section Foo. Find the headers, then link each mention
    // of one. Run after the other link forms, so that the syntax is unambiguous.
    // structureSections() sets the href.
    const allHeaders = str.match(/<h([1-6])>(.*?)<\/h\1>/gi);
    if (allHeaders) {
        allHeaders.forEach(function (header) {
            header = removeHTMLTags(exposeAll(header.ss(4, header.length - 5))).trim();
            const link = '<a ' + protect('class="section-reference" data-section="' + mangle(header) + '" target="_self"') + '>';

            const sectionExp = '(' + keyword('section') + '|' + keyword('subsection') + '|' + keyword('chapter') + ')';
            const headerExp = '(\\b' + escapeRegExpCharacters(header) + ')';

            // Search for links to this section
            str = str.rp(RegExp(headerExp + '\\s+' + sectionExp, 'gi'), link + "$1</a> $2");
            str = str.rp(RegExp(sectionExp + '\\s+' + headerExp, 'gi'), '$1 ' + link + "$2</a>");
        });
    }
    // FIGURE, TABLE, DIAGRAM, and LISTING references:
    // (must come after figure/table/listing processing, obviously)
    str = str.rp(RegExp('\\b(fig\\.|tbl\\.|lst\\.|' + keyword('figure') + '|' + keyword('table') + '|' + keyword('listing') + '|' + keyword('diagram') + ')\\s+\\[([^\\s\\]]+)\\]', 'gi'), function (match, _type, _ref) {
        // Fix abbreviations
        let type = _type.toLowerCase();
        switch (type) {
        case 'fig.': type = keyword('figure').toLowerCase(); break;
        case 'tbl.': type = keyword('table').toLowerCase(); break;
        case 'lst.': type = keyword('listing').toLowerCase(); break;
        }

        // Clean up the reference
        const ref = type + '_' + mangle(_ref.toLowerCase().trim());
        const t = refTable[ref];

        if (t) {
            // Preview figures, tables, and diagrams square, and code wide. Compare with
            // the localized type keywords.
            const squareTypeArray = [keyword('figure'), keyword('table'), keyword('diagram')].
                  map(function (word) { return word.toLowerCase(); });
            const previewKindAttribute = (squareTypeArray.indexOf(type) > -1) ? ' data-preview="block"' : '';

            return '<a ' + protect('href="#' + ref + '" target="_self"' + previewKindAttribute) + '>' + _type + '&nbsp;' + t.number + maybeShowLabel(_ref) + '</a>';
        } else {
            return _type + ' ?';
        }
    });

    // URL: <http://baz> or http://baz. Run after [link]() processing. Write the no-break
    // space as an escape, because it is invisible.
    str = str.rp(/(?:<|(?!<)\b)(\w{3,6}:\/\/.+?)(?:$|>|(?=<)|(?=\s|\u00A0)(?!<))/g, function (match, url) {
        let extra = '';
        if (url[url.length - 1] == '.') {
            // Accidentally sucked in a period at the end of a sentence
            url = url.ss(0, url.length - 1);
            extra = '.';
        }
        // svn, perforce, and quadplay URLs are not hyperlinked. All others (http/https/ftp/mailto/tel, etc. are)
        return '<a ' + (! (url.startsWith('svn') || url.startsWith('p4') || url.startsWith('quad')) ? protect('href="' + url + '" class="url"') : '') + '>' + url + '</a>' + extra;
    });

if (documentMode) {
    // Step over the decorations before the heading and the anchor in it. Return the
    // title in documentTitleText, because a <title> in the body is invalid HTML; the
    // caller writes it to the head and sets document.title.
    const beforeTitle = "(?:<div class='decoration [a-z]+'><\\/div>)*";
    const titlePattern = new RegExp('(' + beforeTitle + '<h1>(?:<a [^>]*>&nbsp;<\\/a>)?)(.*?)<\\/h1>');

    if (titlePattern.test(str)) {
        str = str.rp(titlePattern, function(match, anchor, titleContent) {
            // Expose before removing tags, because inline code in a heading is protected
            const titleTagText = removeHTMLTags(exposeAll(titleContent)).replace(/⟨L:\d+⟩/g, '').replace(/[         　]/g, ' ');
            documentTitleText = titleTagText;
            return maybeShowLabel(window.location.href, 'center') + match;
        });
    }
} // if ! noTitles

// Remove any bogus leading close-paragraph tag inserted by our extra newlines
str = str.rp(/^\s*<\/p>/, '');


    // SECTION LINKS: sec. [X], section [X], subsection [X]. structureSections() sets
    // the number.
    if (documentMode) {
        str = str.rp(RegExp('\\b(' + keyword('sec') + '\\.|' + keyword('section') + '|' + keyword('subsection') + '|' + keyword('chapter') + ')\\s\\[(.+?)\\]', 'gi'),
                    function (match, prefix, ref) {
                        return prefix + ' <a ' + protect('class="section-reference numbered" data-section="' + mangle(ref) + '" target="_self"') + '>?</a>';
                    });
    }

    // Unescape backslash-escaped brackets. The bracket passes are done, and code, math,
    // and diagrams are protected, so a remaining escaped bracket renders as a bracket.
    str = str.rp(/\\([\[\]])/g, '$1');

    // Wrap header sections in <section> tags before exposing protected strings
    if (documentMode) {
        str = wrapHeaderSections(str);
    }

    // Expose all protected values. We may need to do this
    // recursively, because pre and code blocks can be nested.
    function exposeAll(text) {
        let maxIterations = 50;

        exposeRan = true;
        while ((text.indexOf(PROTECT_CHARACTER) + 1) && exposeRan && (maxIterations > 0)) {
            exposeRan = false;
            text = text.rp(PROTECT_REGEXP, expose);
            --maxIterations;
        }
        return text;
    }

    str = exposeAll(str);


    if (option('linkAPIDefinitions')) {
        // API DEFINITION LINKS
        
        // Maps API names to number of versions of it 
        const apiDefinitionCount = {};

        // Find link targets for APIs, which look like:
        // '<dt><code...>variablename' followed by (, [, or <
        //
        // If there is syntax highlighting because we're documenting
        // keywords for the language supported by HLJS, then there may
        // be an extra span around the variable name.

        str = str.rp(/<dt><code(\b[^<>\n]*)>(<span class="[a-zA-Z\-_0-9]+">)?([A-Za-z_][A-Za-z_\.0-9:\->]*)(<\/span>)?([\(\[<])/g, function (match, prefix, syntaxHighlight, name, syntaxHighlightEnd, next) {
            let linkName = name + (next === '<' ? '' : next === '(' ? '-fcn' : next === '[' ? '-array' : next);
            const count = (apiDefinitionCount[linkName] || 0) + 1;
            apiDefinitionCount[linkName] = count;

            // Unique links for overloads
            if (count > 1) { linkName += '-' + count; }
            
            // The 'ignore' added to the code tag below is to
            // prevent the link finding code from finding this (since
            // we don't have lookbehinds in JavaScript to recognize
            // the <dt>)
            return '<dt><a name="apiDefinition-' + linkName + '"></a><code ignore ' + prefix + '>' + (syntaxHighlight || '') + name + (syntaxHighlightEnd || '') + next;
        });

        // Hide links that are also inside of a <h#>...</h#>, where we don't want them
        // modified by API links. Assume that these are on a single line. The space in
        // the close tag prevents the next regexp from matching.
        str = str.rp(/<h([1-9])>(.*<code\b[^<>\n]*>.*)<\/code>(.*<\/h\1>)/g, '<h$1>$2</code >$3');

        // Now find potential links, which look like:
        // '<code...>variablename</code>' and may contain () or [] after the variablename
        // They may also have an extra syntax-highlighting span
        str = str.rp(/<code(?! ignore)\b[^<>\n]*>(<span class="[a-zA-Z\-_0-9]+">)?([A-Za-z_][A-Za-z_\.0-9:\->]*)(<\/span>)?(\(\)|\[\])?<\/code>/g, function (match, syntaxHighlight, name, syntaxHighlightEnd, next) {
            const linkName = name + (next ? (next[0] === '(' ? '-fcn' : next[0] === '[' ? '-array' : next[0]) : '');
            return apiDefinitionCount[linkName] ? entag('a', match, 'href="#apiDefinition-' + linkName + '" target="_self"') : match;
        });
    }
           
    // Wrap in a <div>, because the parser breaks an inline <span> at its first block
    // child and later nodes lose their .md ancestor. Document mode puts .md on <body>.
    // 'bare' adds no <p>, because the content option has its own blocks.
    if (outputMode === 'bare') { return str; }
    if (outputMode === 'element') { return '<div class="md">' + entag('p', str) + '</div>'; }
    return pageStructure(entag('p', str));
}


/** Remove the empty paragraphs that contentToHTML()'s leading blank line makes
    around a block. The browser closes the `<p>` that Markdeep opens, so these
    paragraphs exist only in the DOM. */
function removeEmptyParagraphs(root) {
    ['site_header', 'site_nav', 'site_footer', 'main_header', 'main_footer'].forEach(function (id) {
        const element = root.querySelector('#' + id);
        if (! element) { return; }
        toArray(element.querySelectorAll('p')).forEach(function (paragraph) {
            if ((paragraph.children.length === 0) && (paragraph.textContent.trim() === '')) {
                paragraph.remove();
            }
        });
    });
}


/** The leading blank line lets a list or header at the start parse as a block;
    a trailing blank line would make an empty paragraph. */
function contentToHTML(markdown) {
    if (! markdown) { return ''; }
    return markdeepToHTML('\n\n' + markdown.rp(/\s+$/, '') + '\n', 'bare');
}


/** Emit all eight page structure elements in reading order, empty when unused,
    each with an id equal to its option name. `body` and `#main` are the layout
    grids; the document scrolls and `#site_header` is sticky. */
function pageStructure(bodyHTML) {
    // The overview lists every heading from h2 to h{tocDepth}
    const tocDepth = Math.min(option('tocDepth'), 6);
    overviewHasEntries = (tocDepth >= 2) && new RegExp('<h[2-' + tocDepth + ']\\b').test(bodyHTML);
    const content = '<div id="content">' +
        entag('header', contentToHTML(option('main_header', 'content')),
              'id="main_header" data-layout="' + listLayout('main_header') + '"') +
        entag('article', bodyHTML, 'id="article"') +
        entag('footer', contentToHTML(option('main_footer', 'content')) + MARKDEEP_FOOTER,
              'id="main_footer" data-layout="' + listLayout('main_footer') + '"') +
        '</div>';

    // structureSections() fills the overview. Emit the pane empty under 'inset',
    // which puts the overview in the article.
    const mainAlign = alignment('main_nav');
    const inset = (mainAlign === 'inset');
    const main = '<main id="main">' +
        entag('nav', decoration('start') + (inset ? '' : '<div class="longTOC"></div>') + decoration('end'),
              'id="main_nav" aria-label="' + keyword('Contents') + '" data-align="' +
              (inset ? 'none' : mainAlign) + '" data-layout="' + listLayout('main_nav') + '"') +
        content + '</main>';

    return colorSchemeControlHTML() +
        entag('header', contentToHTML(option('site_header', 'content')),
                 'id="site_header" data-align="' + alignment('site_header') +
                 '" data-layout="' + listLayout('site_header') + '"') +
        entag('nav', contentToHTML(option('site_nav', 'content')),
              'id="site_nav" aria-label="' + keyword('Site') + '" data-align="' +
              alignment('site_nav') + '" data-layout="' + listLayout('site_nav') + '"') +
        main +
        entag('footer', contentToHTML(option('site_footer', 'content')),
              'id="site_footer" data-align="' + alignment('site_footer') +
              '" data-layout="' + listLayout('site_footer') + '"');
}


// In cycle order. The forced values need `only`, so that a browser that overrides
// page color schemes uses them.
const COLOR_SCHEMES = [{name: 'auto',  scheme: 'light dark', glyph: '◑'},
                       {name: 'light', scheme: 'only light', glyph: '☼'},
                       {name: 'dark',  scheme: 'only dark',  glyph: '☾'}];

const COLOR_SCHEME_STORAGE_KEY = 'markdeepColorScheme';


/** Return '' when the theme disables the choice; initialColorScheme still
    applies then. */
function colorSchemeControlHTML() {
    if (! option('enableColorSchemeChoice')) { return ''; }

    return entag('button', '', 'id="mdColorScheme" type="button" aria-label="' +
                 keyword('Color scheme') + '"');
}


/** Chromium gives each file:// document its own origin, so each one stores its
    own choice. Treat an unreadable or empty store as no choice. */
function initialColorSchemeName() {
    // Ignore the store when the control is off, because a choice stored by another
    // document on the origin would lock a dark-only theme in light
    if (! option('enableColorSchemeChoice')) { return option('initialColorScheme'); }

    let stored = null;
    try {
        stored = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    } catch (ignored) {
        // Storage is disabled or unavailable; keep the theme's setting
    }

    const known = COLOR_SCHEMES.some(function (entry) { return entry.name === stored; });
    return known ? stored : option('initialColorScheme');
}


/** Set color-scheme on the root element. The stylesheet stays, and the page
    restyles without a re-render. */
function applyColorScheme(name) {
    const named = COLOR_SCHEMES.find(function (candidate) { return candidate.name === name; });
    if (! named) {
        console.error('Unknown color scheme: ' + name);
    }
    const entry = named || COLOR_SCHEMES[0];

    document.documentElement.style.colorScheme = entry.scheme;

    const button = document.getElementById('mdColorScheme');
    if (button) {
        button.textContent = entry.glyph;
        button.dataset.scheme = entry.name;
    }

    return entry.name;
}


// LINK HOVER PREVIEW

/** Load the target between the build and the show, so that it renders out of sight */
const PREVIEW_BUILD_DELAY_MS = 150;
const PREVIEW_SHOW_DELAY_MS = 900;

/** Delay the dismissal, so that the pointer can cross a gap or clip a corner */
const PREVIEW_ABANDON_DELAY_MS = 300;

/** Slack around the link and the box. pointerKeepsPreview() covers the span between them. */
const PREVIEW_GRACE_PX = 20;

/** Gap between the link and the box, which the beak spans */
const PREVIEW_OFFSET_PX = 10;

/** Clearance from the window edges */
const PREVIEW_MARGIN_PX = 10;


function pointNearRect(point, rect, slack) {
    return (point.x >= rect.left - slack) && (point.x <= rect.right + slack) &&
        (point.y >= rect.top - slack) && (point.y <= rect.bottom + slack);
}


/** Keep the preview while the pointer is near the link, near the box, or in the
    rectangle between them. The rectangle makes a diagonal move from the link to
    the box safe; with a timer alone, the pointer must cross the beak. */
function pointerKeepsPreview(point, linkRect, boxRect) {
    if (pointNearRect(point, linkRect, PREVIEW_GRACE_PX)) { return true; }
    if (pointNearRect(point, boxRect, PREVIEW_GRACE_PX)) { return true; }

    const bridge = {
        left:   Math.min(linkRect.left,  boxRect.left),
        right:  Math.max(linkRect.right, boxRect.right),
        top:    Math.min(linkRect.bottom, boxRect.bottom),
        bottom: Math.max(linkRect.top,    boxRect.top)
    };
    return pointNearRect(point, bridge, 0);
}


/** The kind sets the box proportions:

    - `page`  another document; tall, to show the top of a page
    - `block` a figure, table or diagram here; square
    - `text`  a section, definition, footnote, or equation here; a wide strip

    The renderer writes `data-preview="block"` on its references to figures,
    tables, and diagrams. */
function previewKind(link) {
    const samePage = link.hash &&
          (link.href.split('#')[0] === window.location.href.split('#')[0]);
    if (! samePage) { return 'page'; }
    return link.dataset.preview || 'text';
}


/** Open the box into the larger half of the window */
function previewPlacement(linkRect, boxWidth, boxHeight) {
    const below = linkRect.top + (linkRect.height / 2) < window.innerHeight / 2;
    const top = below ?
          linkRect.bottom + PREVIEW_OFFSET_PX :
          linkRect.top - boxHeight - PREVIEW_OFFSET_PX;

    const centred = linkRect.left + (linkRect.width / 2) - (boxWidth / 2);
    const left = Math.max(PREVIEW_MARGIN_PX,
                          Math.min(centred, window.innerWidth - boxWidth - PREVIEW_MARGIN_PX));

    const beakCentre = linkRect.left + (linkRect.width / 2) - left;

    return {side: below ? 'below' : 'above', top: top, left: left, beakCentre: beakCentre};
}


function buildPreviewContent(frame, url) {
    const bare = url.toLowerCase().split('?')[0].split('#')[0];
    const isImage = /\.(png|jpe?g|gif|svg|webp|bmp|ico)$/.test(bare);

    if (isImage) {
        const image = document.createElement('img');
        image.src = url;
        frame.appendChild(image);
        return null;
    }

    // Firefox downloads a non-HTML file in an iframe; use an <object> there
    const isHTML = /\.html?$/.test(bare) || (url.indexOf('#') > -1) || ! bare.match(/\.[^/]+$/);
    if (! isHTML && isFirefox) {
        const object = document.createElement('object');
        object.data = url;
        object.style.cssText = 'width:100%;height:100%;border:none';
        frame.appendChild(object);
        return null;
    }

    const iframe = document.createElement('iframe');
    iframe.src = url;
    frame.appendChild(iframe);
    return iframe;
}


/** Fill and position the box while it is hidden, so that the previewed page does
    layout while hidden. */
function installLinkPreview() {
    if (! option('showLinkPreviews')) { return; }

    const box = document.createElement('div');
    box.id = 'mdLinkPreview';

    const urlRow = document.createElement('div');
    urlRow.className = 'md-preview-url';
    // The span keeps the address left to right in the right-to-left row
    const urlText = document.createElement('span');
    urlRow.appendChild(urlText);
    const frame = document.createElement('div');
    frame.className = 'md-preview-frame';
    box.appendChild(urlRow);
    box.appendChild(frame);
    document.body.appendChild(box);

    // Preview state. Read the rest from the DOM or the pointer when needed.
    let previewedLink = null;
    let previewedURL = null;
    let previewIframe = null;
    let buildTimeout = null;
    let showTimeout = null;
    let abandonTimeout = null;

    function clearTimers() {
        [buildTimeout, showTimeout, abandonTimeout].forEach(clearTimeout);
        buildTimeout = showTimeout = abandonTimeout = null;
    }

    function hidePreview() {
        clearTimers();
        previewedLink = null;
        previewedURL = null;
        box.removeAttribute('data-visible');
        box.removeAttribute('data-side');
        frame.textContent = '';

        // Stop whatever the previewed page was still doing.
        if (previewIframe) {
            previewIframe.src = 'about:blank';
            previewIframe = null;
        }
    }

    /** Fill and place the box, and leave it hidden */
    function buildPreview(link) {
        previewedURL = link.href;
        urlText.textContent = previewedURL;
        frame.textContent = '';
        previewIframe = buildPreviewContent(frame, previewedURL);

        // Set the kind before reading the size, because the kind sets the proportions
        box.dataset.kind = previewKind(link);

        // Read the size from the stylesheet, so that a theme can resize the preview
        const style = getComputedStyle(box);
        const placement = previewPlacement(link.getBoundingClientRect(),
                                           parseFloat(style.width), parseFloat(style.height));
        box.dataset.side = placement.side;
        box.style.left = placement.left + 'px';
        box.style.top = placement.top + 'px';
        box.style.setProperty('--beak-left',
                              (placement.beakCentre - parseFloat(style.getPropertyValue('--beak-size'))) + 'px');
    }

    // A preview loads its address, so another scheme would run or open document
    // content
    const PREVIEWABLE_PROTOCOLS = new Set(['http:', 'https:', 'file:']);

    function previewableLink(event) {
        let node = event.target;
        while (node && (node.tagName !== 'A')) { node = node.parentElement; }
        if (! node) { return null; }

        // The renderer sets nopreview on overview entries and image links, and an
        // author can set it on any link
        if (node.closest('.nopreview')) { return null; }

        let ancestor = node;
        let insideDocument = false;
        while (ancestor) {
            if (ancestor.classList && ancestor.classList.contains('md')) { insideDocument = true; }
            ancestor = ancestor.parentElement;
        }
        if (! insideDocument) { return null; }

        const href = node.getAttribute('href');
        if (! href || (href === '#') || node.hasAttribute('download')) { return null; }

        // Test the address the browser resolved. URL parsing removes the spaces,
        // tabs and newlines that would hide a scheme from a test of the attribute.
        let protocol;
        try {
            protocol = new URL(node.href).protocol;
        } catch (error) {
            // Skip an address that the browser fails to parse
            if (error instanceof TypeError) { return null; }
            throw error;
        }
        if (! PREVIEWABLE_PROTOCOLS.has(protocol)) { return null; }

        return node;
    }

    document.addEventListener('mouseover', function (event) {
        const link = previewableLink(event);
        if (! link || (link === previewedLink)) { return; }

        if (previewedLink) { hidePreview(); }
        previewedLink = link;

        buildTimeout = setTimeout(function () {
            buildPreview(link);
        }, PREVIEW_BUILD_DELAY_MS);

        showTimeout = setTimeout(function () {
            box.dataset.visible = '';
        }, PREVIEW_SHOW_DELAY_MS);
    });

    // Track mousemove, because mouseout fires in the gap between the link and the box
    document.addEventListener('mousemove', function (event) {
        if (! previewedLink) { return; }

        const point = {x: event.clientX, y: event.clientY};
        if (pointerKeepsPreview(point, previewedLink.getBoundingClientRect(),
                                box.getBoundingClientRect())) {
            if (abandonTimeout) {
                clearTimeout(abandonTimeout);
                abandonTimeout = null;
            }
            return;
        }

        if (! abandonTimeout) {
            abandonTimeout = setTimeout(hidePreview, PREVIEW_ABANDON_DELAY_MS);
        }
    }, {passive: true});

    box.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (previewedURL) { window.location.href = previewedURL; }
    });

    document.addEventListener('click', function (event) {
        if (previewedLink && ! box.contains(event.target) &&
            ! previewedLink.contains(event.target)) {
            hidePreview();
        }
    });

    document.addEventListener('keydown', function (event) {
        if ((event.key === 'Escape') && previewedLink) { hidePreview(); }
    });

    // The document is the scroll region for structured and plain pages
    document.addEventListener('scroll', hidePreview, {passive: true});
}


/** Write --pane-top, the height of #site_header, below which a pane pins, and
    --pane-bottom, the height of the rows below #main, above which a pane stops.
    CSS has no portable way to read another element's height. The names are
    distinct from theme variables, so that a theme variable is never both an
    input and an output of the measurement. */
function installPaneInsetMeasurement() {
    const header = document.getElementById('site_header');
    const main = document.getElementById('main');
    if (! header || ! main) { return; }

    const root = document.documentElement;
    const body = document.body;
    let publishedTopPixels = null;
    let publishedBottomPixels = null;

    function publish() {
        // A sticky element pins at its border box, which a pane must clear
        const topPixels = header.getBoundingClientRect().height;

        // The body has no padding, so one subtraction measures both rows below #main
        const bottomPixels = body.getBoundingClientRect().bottom - main.getBoundingClientRect().bottom;

        // Write only on change, so that a theme whose header height depends on
        // --pane-top settles instead of driving the observer in a loop
        if (topPixels !== publishedTopPixels) {
            publishedTopPixels = topPixels;
            root.style.setProperty('--pane-top', topPixels + 'px');
        }

        if (bottomPixels !== publishedBottomPixels) {
            publishedBottomPixels = bottomPixels;
            root.style.setProperty('--pane-bottom', bottomPixels + 'px');
        }
    }

    // Observe border boxes, because a change to the header's padding moves only the border box
    const observer = new ResizeObserver(publish);
    observer.observe(header, {box: 'border-box'});
    observer.observe(body, {box: 'border-box'});
    observer.observe(main, {box: 'border-box'});
    publish();
}


/** Give each .scrollable element its own scroll bar and clip the box instead of
    scrolling it, so that a sticky table heading inside it sticks to the window.
    The bar's spacer is as wide as the content, so the bar's range is the overflow
    and the bar shows only on overflow. A sideways wheel or touch gesture on the
    element scrolls the bar. */
function installScrollBars() {
    const boxArray = toArray(document.querySelectorAll('.md .scrollable'));
    if (boxArray.length === 0) { return; }

    const boxByElement = new Map();
    function fit(box) {
        // Use the bounding rectangle, because a diagram <svg> has no offsetWidth.
        // translate leaves the width unchanged.
        const contentWidth = box.firstElementChild.getBoundingClientRect().width;
        box.lastElementChild.firstElementChild.style.width = contentWidth + 'px';
        box.classList.toggle('overflowing', contentWidth > box.clientWidth);
    }
    const observer = new ResizeObserver(function (entryArray) {
        for (const entry of entryArray) { fit(boxByElement.get(entry.target)); }
    });

    for (const box of boxArray) {
        const content = box.firstElementChild;
        const bar = document.createElement('div');
        bar.className = 'scrollbar';
        bar.appendChild(document.createElement('div'));
        box.appendChild(bar);
        box.classList.add('barred');

        bar.addEventListener('scroll', function () {
            box.style.setProperty('--scroll-x', -bar.scrollLeft + 'px');
        }, {passive: true});

        content.addEventListener('wheel', function (event) {
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                bar.scrollLeft += event.deltaX;
                event.preventDefault();
            }
        }, {passive: false});

        let touchX = 0, touchY = 0, touchScrollLeft = 0, touchIsHorizontal = null;
        content.addEventListener('touchstart', function (event) {
            touchX = event.touches[0].clientX;
            touchY = event.touches[0].clientY;
            touchScrollLeft = bar.scrollLeft;
            touchIsHorizontal = null;
        }, {passive: true});
        content.addEventListener('touchmove', function (event) {
            const dx = event.touches[0].clientX - touchX;
            if (touchIsHorizontal === null) {
                touchIsHorizontal = Math.abs(dx) > Math.abs(event.touches[0].clientY - touchY);
            }
            if (touchIsHorizontal) {
                bar.scrollLeft = touchScrollLeft - dx;
                event.preventDefault();
            }
        }, {passive: false});

        boxByElement.set(box, box);
        boxByElement.set(content, box);
        observer.observe(box);
        observer.observe(content);
    }
}


// READING POSITION

/** Space between the pinned header and the reading line, so that the line is visible */
const READING_LINE_SLOP_PIXELS = 64;

/** A reinstall disconnects these, so that one set of observers exists */
let readingPositionIntersectionObserver = null;
let readingPositionResizeObserver = null;
let readingPositionHashListener = null;


/** Mark the overview entry of the section being read: the last section whose
    header is above the reading line. The line is at --pane-top, the height that
    #site_header pins over the content, plus the slop.

    Read the rectangle of a header outside the observer's root to tell whether it
    is above the line or below the viewport. A section taller than the viewport
    has no intersecting header.

    A rootMargin is fixed when its observer is made, so remake the observer when
    the line moves. */
function installReadingPositionMark() {
    if (readingPositionIntersectionObserver) { readingPositionIntersectionObserver.disconnect(); }
    if (readingPositionResizeObserver) { readingPositionResizeObserver.disconnect(); }
    if (readingPositionHashListener) { window.removeEventListener('hashchange', readingPositionHashListener); }
    readingPositionIntersectionObserver = null;
    readingPositionResizeObserver = null;
    readingPositionHashListener = null;

    const overview = document.querySelector('.longTOC, .insetTOC');
    if (! overview) { return; }

    const entryArray = [];
    toArray(overview.querySelectorAll('a[href^="#"]')).forEach(function (link) {
        // Use the raw href, which mangle() encoded. link.hash decodes it, and then
        // a non-ASCII heading fails to match its anchor.
        const anchor = document.getElementsByName(link.getAttribute('href').ss(1))[0];
        if (! anchor) { return; }

        // After the rebuild, the anchor is the header's first child. Before it, the
        // anchor precedes the header, and an alias can add an anchor between them.
        let header = anchor.closest('h2,h3,h4,h5,h6');
        for (let element = anchor; ! header && element; element = element.nextElementSibling) {
            if (/^H[2-6]$/.test(element.tagName)) { header = element; }
            else if (element.tagName !== 'A') { break; }
        }

        if (header) { entryArray.push({header: header, link: link}); }
    });

    if (entryArray.length === 0) { return; }

    let markedLink = null;
    let connectedLinePixels = null;

    /** Read every header's rectangle, because a jumping scroll can move a header
        past the line while its intersection ratio stays above zero. Skip an
        unrendered header, such as one in a folded section, which measures all
        zeros. */
    function mark(linePixels) {
        let lastAbove = -1;
        for (let i = 0; i < entryArray.length; ++i) {
            const rect = entryArray[i].header.getBoundingClientRect();
            if ((rect.height > 0) && (rect.top <= linePixels)) { lastAbove = i; }
        }

        // Above the first header, mark no entry
        const link = (lastAbove >= 0) ? entryArray[lastAbove].link : null;
        if (link === markedLink) { return; }

        if (markedLink) { markedLink.removeAttribute('aria-current'); }
        markedLink = link;

        // `location` is the ARIA value for a position within an environment. A
        // theme styles the enclosing entries with :has().
        if (markedLink) { markedLink.setAttribute('aria-current', 'location'); }
    }

    function connect() {
        const panePixels = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pane-top'));

        // --pane-top is NaN when nothing pins over the document; the line is then
        // the slop
        const linePixels = (panePixels || 0) + READING_LINE_SLOP_PIXELS;
        if (linePixels === connectedLinePixels) { return; }
        connectedLinePixels = linePixels;

        if (readingPositionIntersectionObserver) { readingPositionIntersectionObserver.disconnect(); }

        // The observer triggers mark(), which reads every header. Threshold 1 fires
        // as a header's top crosses the line, and 0 as its bottom leaves.
        readingPositionIntersectionObserver = new IntersectionObserver(function () {
            mark(linePixels);
        }, {rootMargin: '-' + linePixels + 'px 0px 0px 0px', threshold: [0, 1]});

        entryArray.forEach(function (entry) { readingPositionIntersectionObserver.observe(entry.header); });

        mark(linePixels);
    }

    connect();

    // A fragment jump can move the page without crossing any threshold
    readingPositionHashListener = function () { mark(connectedLinePixels); };
    window.addEventListener('hashchange', readingPositionHashListener);

    // Reconnect when the header changes height, which moves the line: a rewrap,
    // a font load, or a theme restyle
    const header = document.getElementById('site_header');
    if (header) {
        readingPositionResizeObserver = new ResizeObserver(connect);
        readingPositionResizeObserver.observe(header, {box: 'border-box'});
    }
}


/** Call after the rendered body is in the DOM */
function installColorSchemeControl() {
    let current = applyColorScheme(initialColorSchemeName());

    const button = document.getElementById('mdColorScheme');
    if (! button) { return; }

    button.addEventListener('click', function () {
        const index = COLOR_SCHEMES.findIndex(function (entry) { return entry.name === current; });
        current = applyColorScheme(COLOR_SCHEMES[(index + 1) % COLOR_SCHEMES.length].name);
        try {
            window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, current);
        } catch (ignored) {
            // Storage is disabled; the choice lasts for this page view
        }
    });
}


/** Workaround for IE11 */
function strToArray(s) {
    if (Array.from) {
        return Array.from(s);
    } else {
        const a = [];
        for (let i = 0; i < s.length; ++i) {
            a[i] = s[i];
        }
        return a;
    }
}

/**
   Adds whitespace at the end of each line of str, so that all lines have equal length in
   unicode characters (which is not the same as JavaScript characters when high-index/escape
   characters are present).
*/
function equalizeLineLengths(str) {
    const lineArray = str.split('\n');

    if ((lineArray.length > 0) && (lineArray[lineArray.length - 1] === '')) {
        // Remove the empty last line generated by split on a trailing newline
        lineArray.pop();
    }
        
    let longest = 0;
    lineArray.forEach(function(line) {
        longest = max(longest, strToArray(line).length);
    });

    // Worst case spaces needed for equalizing lengths
    // http://stackoverflow.com/questions/1877475/repeat-character-n-times
    const spaces = Array(longest + 1).join(' ');

    let result = '';
    lineArray.forEach(function(line) {
        // Append the needed number of spaces onto each line, and
        // reconstruct the output with newlines
        result += line + spaces.ss(strToArray(line).length) + '\n';
    });

    return result;
}

/** Finds the longest common whitespace prefix of all non-empty lines
    and then removes it */
function removeLeadingSpace(str) {
    const lineArray = str.split('\n');

    let minimum = Infinity;
    lineArray.forEach(function (line) {
        if (line.trim() !== '') {
            // This is a non-empty line
            const spaceArray = line.match(/^([ \t]*)/);
            if (spaceArray) {
                minimum = min(minimum, spaceArray[0].length);
            }
        }
    });

    if (minimum === 0) {
        // No leading space
        return str;
    }

    let result = '';
    lineArray.forEach(function(line) {
        // Strip the common spaces
        result += line.ss(minimum) + '\n';
    });

    return result;
}

/** Returns true if this character is a "letter" under the ASCII definition */
function isASCIILetter(c) {
    const code = c.charCodeAt(0);
    return ((code >= 65) && (code <= 90)) || ((code >= 97) && (code <= 122));
}

// Helper function to detect if content looks like an ASCII diagram
function looksLikeDiagram(content) {
    // Content with an HTML tag is text
    if (content.match(/<[a-zA-Z][^>]*>/)) {
        return false;
    }
    
    const lines = content.split('\n');
    if (lines.length < 3) return false;
    
    let totalChars = 0;
    let diagramChars = 0;
    let patternMatches = 0;
    let verticalBars = 0;
    let verticalBarLines = 0;
    
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        
        // Count diagram characters: | + - \ / . ' ^ v * < >
        for (let j = 0; j < line.length; ++j) {
            const c = line[j];
            // Count non-whitespace characters toward total
            if (c !== ' ' && c !== '\t') {
                ++totalChars;
            }
            if ("|+-\\/.'*^v<>".indexOf(c) >= 0) {
                ++diagramChars;
            }
            if (c === '|') {
                ++verticalBars;
            }
        }
        
        // Check for common diagram patterns
        if (line.match(/--\+|\+--|--\.|\.--|'--|--'|<--|-->|\|.*\||^\s*[|+.'v^*]\s*$/)) {
            patternMatches++;
        }
        
        // Count lines with vertical bars
        if (line.indexOf('|') >= 0) {
            ++verticalBarLines;
        }
    }
    
    // Heuristics for diagram detection:
    // 1. At least 20% diagram chars AND 30% pattern matches
    // 2. At least 25% diagram chars (e.g., tree diagrams with slashes)
    // 3. At least 3 lines with vertical bars AND 2+ pattern matches
    const diagramCharRatio = totalChars > 0 ? diagramChars / totalChars : 0;
    const patternRatio = lines.length > 0 ? patternMatches / lines.length : 0;
    
    return (diagramCharRatio >= 0.20 && patternRatio >= 0.30) ||
           (diagramCharRatio >= 0.25) ||
           (verticalBarLines >= 3 && patternMatches >= 2);
}


function diagramToSVG(diagramString, outputFormat) {
    // Clean up diagramString if line endings are ragged
    diagramString = equalizeLineLengths(diagramString);

    /** Pixels per character */
    const SCALE   = 8;

    /** Multiply Y coordinates by this when generating the final SVG
        result to account for the aspect ratio of text files. This
        MUST be 2 */
    const ASPECT = 2;

    const DIAGONAL_ANGLE = Math.atan(1.0 / ASPECT) * 180 / Math.PI;

    const EPSILON = 1e-6;

    // The order of the following is based on rotation angles
    // and is used for ArrowSet.toSVG
    const ARROW_HEAD_CHARACTERS            = '>v<^';
    const POINT_CHARACTERS                 = 'o*◌○◍●';
    const JUMP_CHARACTERS                  = '()';
    const UNDIRECTED_VERTEX_CHARACTERS     = "+";
    const VERTEX_CHARACTERS                = UNDIRECTED_VERTEX_CHARACTERS + ".'";

    // GRAY[i] is the Unicode block character for (i+1)/4 level gray
    const GRAY_CHARACTERS = '░▒▓█';

    // TRI[i] is a right-triangle rotated by 90*i
    const TRI_CHARACTERS  = '◢◣◤◥';

    const DECORATION_CHARACTERS            = ARROW_HEAD_CHARACTERS + POINT_CHARACTERS + JUMP_CHARACTERS + GRAY_CHARACTERS + TRI_CHARACTERS;

    // A text run is letters joined by single spaces, apostrophes, and hyphens
    const LETTER_REGEXP                    = /\p{L}/u;

    function isUndirectedVertex(c) { return UNDIRECTED_VERTEX_CHARACTERS.indexOf(c) + 1; }
    function isVertex(c)           { return VERTEX_CHARACTERS.indexOf(c) !== -1; }
    function isTopVertex(c)        { return isUndirectedVertex(c) || (c === '.'); }
    function isBottomVertex(c)     { return isUndirectedVertex(c) || (c === "'"); }
    function isVertexOrLeftDecoration(c){ return isVertex(c) || (c === '<') || isPoint(c); }
    function isVertexOrRightDecoration(c){return isVertex(c) || (c === '>') || isPoint(c); }
    function isArrowHead(c)        { return ARROW_HEAD_CHARACTERS.indexOf(c) + 1; }
    function isGray(c)             { return GRAY_CHARACTERS.indexOf(c) + 1; }
    function isTri(c)              { return TRI_CHARACTERS.indexOf(c) + 1; }

    // "D" = Diagonal slash (/), "B" = diagonal Backslash (\)
    // Characters that may appear anywhere on a solid line
    function isSolidHLine(c)       { return (c === '-') || isUndirectedVertex(c) || isJump(c); }
    function isSolidVLineOrJumpOrPoint(c) { return isSolidVLine(c) || isJump(c) || isPoint(c); }
    function isSolidVLine(c)       { return (c === '|') || isUndirectedVertex(c); }
    function isSolidDLine(c)       { return (c === '/') || isUndirectedVertex(c) }
    function isSolidBLine(c)       { return (c === '\\') || isUndirectedVertex(c); }
    function isJump(c)             { return JUMP_CHARACTERS.indexOf(c) + 1; }
    function isPoint(c)            { return POINT_CHARACTERS.indexOf(c) + 1; }
    function isDecoration(c)       { return DECORATION_CHARACTERS.indexOf(c) + 1; }
    function isEmpty(c)            { return c === ' '; }
    function isRunLetter(c)        { return LETTER_REGEXP.test(c); }
    function isRunJoiner(c)        { return (c === ' ') || (c === "'") || (c === '-'); }
    function isGlyphLetter(c)      { return isRunLetter(c) && (isPoint(c) || isArrowHead(c)); }
   
    ///////////////////////////////////////////////////////////////////////////////
    // Math library

    /** Invoke as new Vec2(v) to clone or new Vec2(x, y) to create from coordinates.
        Can also invoke without new for brevity. */
    function Vec2(x, y) {
        // Detect when being run without new
        if (! (this instanceof Vec2)) { return new Vec2(x, y); }

        if (y === undefined) {
            if (x === undefined) { x = y = 0; } 
            else if (x instanceof Vec2) { y = x.y; x = x.x; }
            else { console.error("Vec2 requires one Vec2 or (x, y) as an argument"); }
        }
        this.x = x;
        this.y = y;
        Object.seal(this);
    }

    /** Returns an SVG representation */
    Vec2.prototype.toString = Vec2.prototype.toSVG = 
        function () { return '' + (this.x * SCALE) + ',' + (this.y * SCALE * ASPECT) + ' '; };

    /** Converts a "rectangular" string defined by newlines into 2D
        array of characters. Grids are immutable. */
    function makeGrid(str) {
        /** Returns ' ' for out of bounds values */
        const grid = function(x, y) {
            if (y === undefined) {
                if (x instanceof Vec2) { y = x.y; x = x.x; }
                else { console.error('grid requires either a Vec2 or (x, y)'); }
            }
            
            return ((x >= 0) && (x < grid.width) && (y >= 0) && (y < grid.height)) ?
                str[y * (grid.width + 1) + x] : ' ';
        };

        // Elements are true when consumed
        grid._used   = [];

        grid.height  = str.split('\n').length;
        if (str[str.length - 1] === '\n') { --grid.height; }

        // Convert the string to an array to better handle greater-than 16-bit unicode
        // characters, which JavaScript does not process correctly with indices. Do this after
        // the above string processing.
        str = strToArray(str);
        grid.width = str.indexOf('\n');

        /** Mark this location. Takes a Vec2 or (x, y) */
        grid.setUsed = function (x, y) {
            if (y === undefined) {
                if (x instanceof Vec2) { y = x.y; x = x.x; }
                else { console.error('grid requires either a Vec2 or (x, y)'); }
            }
            if ((x >= 0) && (x < grid.width) && (y >= 0) && (y < grid.height)) {
                // Match the source string indexing
                grid._used[y * (grid.width + 1) + x] = true;
            }
        };
        
        grid.isUsed = function (x, y) {
            if (y === undefined) {
                if (x instanceof Vec2) { y = x.y; x = x.x; }
                else { console.error('grid requires either a Vec2 or (x, y)'); }
            }
            return (this._used[y * (this.width + 1) + x] === true);
        };
        
        /** Returns true if there is a solid vertical line passing through (x, y) */
        grid.isSolidVLineAt = function (x, y) {
            if (y === undefined) { y = x.x; x = x.x; }
            
            const up = grid(x, y - 1);
            const c  = grid(x, y);
            const dn = grid(x, y + 1);
            
            const uprt = grid(x + 1, y - 1);
            const uplt = grid(x - 1, y - 1);
            
            if (isSolidVLine(c)) {
                // Looks like a vertical line...does it continue?
                return (isTopVertex(up)    || (up === '^') || isSolidVLine(up) || isJump(up) ||
                        isBottomVertex(dn) || (dn === 'v') || isSolidVLine(dn) || isJump(dn) ||
                        isPoint(up) || isPoint(dn) || (grid(x, y - 1) === '_') || (uplt === '_') ||
                        (uprt === '_') ||
                        
                        // Special case of 1-high vertical on two curved corners 
                        ((isTopVertex(uplt) || isTopVertex(uprt)) &&
                         (isBottomVertex(grid(x - 1, y + 1)) || isBottomVertex(grid(x + 1, y + 1)))));
                
            } else if (isTopVertex(c) || (c === '^')) {
                // May be the top of a vertical line
                return isSolidVLine(dn) || (isJump(dn) && (c !== '.'));
            } else if (isBottomVertex(c) || (c === 'v')) {
                return isSolidVLine(up) || (isJump(up) && (c !== "'"));
            } else if (isPoint(c)) {
                return isSolidVLine(up) || isSolidVLine(dn);
            } 
            
            return false;
        };
    
    
        /** Returns true if there is a solid middle (---) horizontal line
            passing through (x, y). Ignores underscores. */
        grid.isSolidHLineAt = function (x, y) {
            if (y === undefined) { y = x.x; x = x.x; }
            
            const ltlt = grid(x - 2, y);
            const lt   = grid(x - 1, y);
            const c    = grid(x + 0, y);
            const rt   = grid(x + 1, y);
            const rtrt = grid(x + 2, y);
            
            if (isSolidHLine(c) || (isSolidHLine(lt) && isJump(c))) {
                // Looks like a horizontal line...does it continue? We need three in a row.
                if (isSolidHLine(lt)) {
                    return isSolidHLine(rt) || isVertexOrRightDecoration(rt) || 
                        isSolidHLine(ltlt) || isVertexOrLeftDecoration(ltlt);
                } else if (isVertexOrLeftDecoration(lt)) {
                    return isSolidHLine(rt);
                } else {
                    return isSolidHLine(rt) && (isSolidHLine(rtrt) || isVertexOrRightDecoration(rtrt));
                }

            } else if (c === '<') {
                return isSolidHLine(rt) && isSolidHLine(rtrt)
                
            } else if (c === '>') {
                return isSolidHLine(lt) && isSolidHLine(ltlt);
                
            } else if (isVertex(c)) {
                return ((isSolidHLine(lt) && isSolidHLine(ltlt)) || 
                        (isSolidHLine(rt) && isSolidHLine(rtrt)));
            }
            
            return false;
        };
        
        
        /** Returns true if there is a solid backslash line passing through (x, y) */
        grid.isSolidBLineAt = function (x, y) {
            if (y === undefined) { y = x.x; x = x.x; }
            const c = grid(x, y);
            const lt = grid(x - 1, y - 1);
            const rt = grid(x + 1, y + 1);
            
            if (c === '\\') {
                // Looks like a diagonal line...does it continue? We need two in a row.
                return (isSolidBLine(rt) || isBottomVertex(rt) || isPoint(rt) || (rt === 'v') ||
                        isSolidBLine(lt) || isTopVertex(lt) || isPoint(lt) || (lt === '^') ||
                        (grid(x, y - 1) === '/') || (grid(x, y + 1) === '/') || (rt === '_') || (lt === '_')); 
            } else if (c === '.') {
                return (rt === '\\');
            } else if (c === "'") {
                return (lt === '\\');
            } else if (c === '^') {
                return rt === '\\';
            } else if (c === 'v') {
                return lt === '\\';
            } else if (isVertex(c) || isPoint(c) || (c === '|')) {
                return isSolidBLine(lt) || isSolidBLine(rt);
            }
        };
        

        /** Returns true if there is a solid diagonal line passing through (x, y) */
        grid.isSolidDLineAt = function (x, y) {
            if (y === undefined) { y = x.x; x = x.x; }
            
            const c = grid(x, y);
            const lt = grid(x - 1, y + 1);
            const rt = grid(x + 1, y - 1);
            
            if (c === '/' && ((grid(x, y - 1) === '\\') || (grid(x, y + 1) === '\\'))) {
                // Special case of tiny hexagon corner
                return true;
            } else if (isSolidDLine(c)) {
                // Looks like a diagonal line...does it continue? We need two in a row.
                return (isSolidDLine(rt) || isTopVertex(rt) || isPoint(rt) || (rt === '^') || (rt === '_') ||
                        isSolidDLine(lt) || isBottomVertex(lt) || isPoint(lt) || (lt === 'v') || (lt === '_')); 
            } else if (c === '.') {
                return (lt === '/');
            } else if (c === "'") {
                return (rt === '/');
            } else if (c === '^') {
                return lt === '/';
            } else if (c === 'v') {
                return rt === '/';
            } else if (isVertex(c) || isPoint(c) || (c === '|')) {
                return isSolidDLine(lt) || isSolidDLine(rt);
            }
            return false;
        };
        
        grid.toString = function () { return str; };
        
        return Object.freeze(grid);
    }
    
    
    /** A 1D curve. If C is specified, the result is a bezier with
        that as the tangent control point */
    function Path(A, B, C, D, dashed) {
        if (! ((A instanceof Vec2) && (B instanceof Vec2))) {
            console.error('Path constructor requires at least two Vec2s');
        }
        this.A = A;
        this.B = B;
        if (C) {
            this.C = C;
            if (D) {
                this.D = D;
            } else {
                this.D = C;
            }
        }

        this.dashed = dashed || false;

        Object.freeze(this);
    }

    const _ = Path.prototype;
    _.isVertical = function () {
        return this.B.x === this.A.x;
    };

    _.isHorizontal = function () {
        return this.B.y === this.A.y;
    };

    /** Diagonal lines look like: / See also backDiagonal */
    _.isDiagonal = function () {
        const dx = this.B.x - this.A.x;
        const dy = this.B.y - this.A.y;
        return (abs(dy + dx) < EPSILON);
    };

    _.isBackDiagonal = function () {
        const dx = this.B.x - this.A.x;
        const dy = this.B.y - this.A.y;
        return (abs(dy - dx) < EPSILON);
    };

    _.isCurved = function () {
        return this.C !== undefined;
    };

    /** Does this path have any end at (x, y) */
    _.endsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return ((this.A.x === x) && (this.A.y === y)) ||
            ((this.B.x === x) && (this.B.y === y));
    };

    /** Does this path have an up end at (x, y) */
    _.upEndsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isVertical() && (this.A.x === x) && (min(this.A.y, this.B.y) === y);
    };

    /** Does this path have an up end at (x, y) */
    _.diagonalUpEndsAt = function (x, y) {
        if (! this.isDiagonal()) { return false; }
        if (y === undefined) { y = x.y; x = x.x; }
        if (this.A.y < this.B.y) {
            return (this.A.x === x) && (this.A.y === y);
        } else {
            return (this.B.x === x) && (this.B.y === y);
        }
    };

    /** Does this path have a down end at (x, y) */
    _.diagonalDownEndsAt = function (x, y) {
        if (! this.isDiagonal()) { return false; }
        if (y === undefined) { y = x.y; x = x.x; }
        if (this.B.y < this.A.y) {
            return (this.A.x === x) && (this.A.y === y);
        } else {
            return (this.B.x === x) && (this.B.y === y);
        }
    };

    /** Does this path have an up end at (x, y) */
    _.backDiagonalUpEndsAt = function (x, y) {
        if (! this.isBackDiagonal()) { return false; }
        if (y === undefined) { y = x.y; x = x.x; }
        if (this.A.y < this.B.y) {
            return (this.A.x === x) && (this.A.y === y);
        } else {
            return (this.B.x === x) && (this.B.y === y);
        }
    };

    /** Does this path have a down end at (x, y) */
    _.backDiagonalDownEndsAt = function (x, y) {
        if (! this.isBackDiagonal()) { return false; }
        if (y === undefined) { y = x.y; x = x.x; }
        if (this.B.y < this.A.y) {
            return (this.A.x === x) && (this.A.y === y);
        } else {
            return (this.B.x === x) && (this.B.y === y);
        }
    };

    /** Does this path have a down end at (x, y) */
    _.downEndsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isVertical() && (this.A.x === x) && (max(this.A.y, this.B.y) === y);
    };

    /** Does this path have a left end at (x, y) */
    _.leftEndsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isHorizontal() && (this.A.y === y) && (min(this.A.x, this.B.x) === x);
    };

    /** Does this path have a right end at (x, y) */
    _.rightEndsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isHorizontal() && (this.A.y === y) && (max(this.A.x, this.B.x) === x);
    };

    _.verticalPassesThrough = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isVertical() && 
            (this.A.x === x) && 
            (min(this.A.y, this.B.y) <= y) &&
            (max(this.A.y, this.B.y) >= y);
    }

    _.horizontalPassesThrough = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isHorizontal() && 
            (this.A.y === y) && 
            (min(this.A.x, this.B.x) <= x) &&
            (max(this.A.x, this.B.x) >= x);
    }
    
    /** Returns a string suitable for inclusion in an SVG tag */
    _.toSVG = function () {
        let svg = '<path d="M ' + this.A;

        if (this.isCurved()) {
            svg += 'C ' + this.C + this.D + this.B;
        } else {
            svg += 'L ' + this.B;
        }
        svg += '" style="fill:none;"';
        if (this.dashed) {
            svg += ' stroke-dasharray="3,6"';
        }
        svg += '/>';
        return svg;
    };


    /** A group of 1D curves. This was designed so that all of the
        methods can later be implemented in O(1) time, but it
        currently uses O(n) implementations for source code
        simplicity. */
    function PathSet() {
        this._pathArray = [];
    }

    const PS = PathSet.prototype;
    PS.insert = function (path) {
        this._pathArray.push(path);
    };

    /** Returns a new method that returns true if method(x, y) 
        returns true on any element of _pathAray */
    function makeFilterAny(method) {
        return function(x, y) {
            for (let i = 0; i < this._pathArray.length; ++i) {
                if (method.call(this._pathArray[i], x, y)) { return true; }
            }
            // Fall through: return undefined == false
        }
    }

    // True if an up line ends at these coordinates. Recall that the
    // variable _ is bound to the Path prototype still.
    PS.upEndsAt                = makeFilterAny(_.upEndsAt);
    PS.diagonalUpEndsAt        = makeFilterAny(_.diagonalUpEndsAt);
    PS.backDiagonalUpEndsAt    = makeFilterAny(_.backDiagonalUpEndsAt);
    PS.diagonalDownEndsAt      = makeFilterAny(_.diagonalDownEndsAt);
    PS.backDiagonalDownEndsAt  = makeFilterAny(_.backDiagonalDownEndsAt);
    PS.downEndsAt              = makeFilterAny(_.downEndsAt);
    PS.leftEndsAt              = makeFilterAny(_.leftEndsAt);
    PS.rightEndsAt             = makeFilterAny(_.rightEndsAt);
    PS.endsAt                  = makeFilterAny(_.endsAt);
    PS.verticalPassesThrough   = makeFilterAny(_.verticalPassesThrough);
    PS.horizontalPassesThrough = makeFilterAny(_.horizontalPassesThrough);

    /** Returns an SVG string */
    PS.toSVG = function () {
        let svg = '';
        for (let i = 0; i < this._pathArray.length; ++i) {
            svg += this._pathArray[i].toSVG() + '\n';
        }
        return svg;
    };


    function DecorationSet() {
        this._decorationArray = [];
    }

    const DS = DecorationSet.prototype;

    /** insert(x, y, type, <angle>)  
        insert(vec, type, <angle>)

        angle is the angle in degrees to rotate the result */
    DS.insert = function(x, y, type, angle) {
        if (type === undefined) { type = y; y = x.y; x = x.x; }

        if (! isDecoration(type)) {
            console.error('Illegal decoration character: ' + type); 
        }
        const d = {C: Vec2(x, y), type: type, angle:angle || 0};

        // Put arrows at the front and points at the back so that
        // arrows always draw under points

        if (isPoint(type)) {
            this._decorationArray.push(d);
        } else {
            this._decorationArray.unshift(d);
        }
    };


    DS.toSVG = function () {
        let svg = '';
        for (let i = 0; i < this._decorationArray.length; ++i) {
            const decoration = this._decorationArray[i];
            const C = decoration.C;
            
            if (isJump(decoration.type)) {
                // Slide jumps
                const dx = (decoration.type === ')') ? +0.75 : -0.75;
                const up  = Vec2(C.x, C.y - 0.5);
                const dn  = Vec2(C.x, C.y + 0.5);
                const cup = Vec2(C.x + dx, C.y - 0.5);
                const cdn = Vec2(C.x + dx, C.y + 0.5);

                svg += '<path d="M ' + dn + ' C ' + cdn + cup + up + '" style="fill:none;"/>';

            } else if (isPoint(decoration.type)) {
                const cls = {'*':'closed', 'o':'open', '◌':'dotted', '○':'open', '◍':'shaded', '●':'closed'}[decoration.type];
                svg += '<circle cx="' + (C.x * SCALE) + '" cy="' + (C.y * SCALE * ASPECT) +
                       '" r="' + (SCALE - STROKE_WIDTH) + '" class="' + cls + 'dot"/>';
            } else if (isGray(decoration.type)) {
                
                const shade = Math.round((3 - GRAY_CHARACTERS.indexOf(decoration.type)) * 63.75);
                svg += '<rect x="' + ((C.x - 0.5) * SCALE) + '" y="' + ((C.y - 0.5) * SCALE * ASPECT) + '" width="' + SCALE + '" height="' + (SCALE * ASPECT) + '" stroke="none" fill="rgb(' + shade + ',' + shade + ',' + shade +')"/>';

            } else if (isTri(decoration.type)) {
                // 30-60-90 triangle
                const index = TRI_CHARACTERS.indexOf(decoration.type);
                let xs  = 0.5 - (index & 1);
                const ys  = 0.5 - (index >> 1);
                xs *= sign(ys);
                const tip = Vec2(C.x + xs, C.y - ys);
                const up  = Vec2(C.x + xs, C.y + ys);
                const dn  = Vec2(C.x - xs, C.y + ys);
                svg += '<polygon points="' + tip + up + dn + '" style="stroke:none"/>\n';
            } else { // Arrow head
                const tip = Vec2(C.x + 1, C.y);
                const up =  Vec2(C.x - 0.5, C.y - 0.35);
                const dn =  Vec2(C.x - 0.5, C.y + 0.35);
                svg += '<polygon points="' + tip + up + dn + 
                    '"  style="stroke:none" transform="rotate(' + decoration.angle + ',' + C + ')"/>\n';
            }
        }
        return svg;
    };

    /** Text runs removed from the diagram before path processing */
    function TextRunSet() {
        this._textRunArray = [];
    }

    const TRS = TextRunSet.prototype;

    /** A and B are the first and last cells of the text in the source. alignment
        is the edge that the text is pinned to, and also the CSS class that sets
        the matching text anchor. */
    TRS.insert = function (A, B, text, alignment) {
        this._textRunArray.push({A: A, B: B, text: text, alignment: alignment});
    };


    /** Returns an SVG string */
    TRS.toSVG = function () {
        let svg = '';
        for (let i = 0; i < this._textRunArray.length; ++i) {
            const textRun = this._textRunArray[i];

            // The run's edges are half a cell beyond the centers of its end cells
            let x;
            if (textRun.alignment === 'left') {
                x = textRun.A.x - 0.5;
            } else if (textRun.alignment === 'right') {
                x = textRun.B.x + 0.5;
            } else {
                x = (textRun.A.x + textRun.B.x) / 2;
            }

            svg += '<text class="diagram-text ' + textRun.alignment + '" x="' + (x * SCALE) +
                '" y="' + (4 + textRun.A.y * SCALE * ASPECT) + '">' +
                escapeHTMLEntities(textRun.text) + '</text>\n';
        }
        return svg;
    };


    /** Copy each run to its source cells. The run fills its cells exactly, so
        alignment has no effect in text output. */
    TRS.toTextArray = function (textArray) {
        for (let i = 0; i < this._textRunArray.length; ++i) {
            const textRun = this._textRunArray[i];
            const characterArray = strToArray(textRun.text);
            for (let j = 0; j < characterArray.length; ++j) {
                textArray[textRun.A.y][textRun.A.x + j] = characterArray[j];
            }
        }
    };

    /** Closed regions bounded by paths, painted below the other diagram elements */
    function RegionSet() {
        this._regionArray = [];
    }

    const RS = RegionSet.prototype;

    /** boundary: SVG path data for one closed region */
    RS.insert = function (boundary) {
        this._regionArray.push(boundary);
    };


    /** Returns an SVG string */
    RS.toSVG = function () {
        let svg = '';
        for (let i = 0; i < this._regionArray.length; ++i) {
            svg += '<path class="diagram-region" d="' + this._regionArray[i] + '"/>\n';
        }
        return svg;
    };

    ////////////////////////////////////////////////////////////////////////////

    function findPaths(grid, pathSet) {
        // Does the line from A to B contain at least one c?
        function lineContains(A, B, c) {
            const dx = sign(B.x - A.x);
            const dy = sign(B.y - A.y);
            let x, y;

            for (x = A.x, y = A.y; (x !== B.x) || (y !== B.y); x += dx, y += dy) {
                if (grid(x, y) === c) { return true; }
            }

            // Last point
            return (grid(x, y) === c);
        }

        // Find all solid vertical lines. Iterate horizontally
        // so that we never hit the same line twice
        for (let x = 0; x < grid.width; ++x) {
            for (let y = 0; y < grid.height; ++y) {
                if (grid.isSolidVLineAt(x, y)) {
                    // This character begins a vertical line...now, find the end
                    const A = Vec2(x, y);
                    do  { grid.setUsed(x, y); ++y; } while (grid.isSolidVLineAt(x, y));
                    const B = Vec2(x, y - 1);
                    
                    const up = grid(A);
                    const upup = grid(A.x, A.y - 1);

                    if (! isVertex(up) && ((((upup === '-') || (upup === '_') ||
                                            (grid(A.x - 1, A.y - 1) === '_') ||
                                            (grid(A.x + 1, A.y - 1) === '_')) && !((grid(A.x - 1, A.y - 1) === '+') || (grid(A.x + 1, A.y - 1) === '+'))) || 
                                            (upup === '┳') ||
                                           isBottomVertex(upup)) || isJump(upup)) {
                        // Stretch up to almost reach the line above (if there is a decoration,
                        // it will finish the gap)
                        // A curved connection fills the gap itself, so leave it unstretched
                        A.y -= 0.5;
                    }

                    const dn = grid(B);
                    const dndn = grid(B.x, B.y + 1);
                    if (! isVertex(dn) && ((((dndn === '-') || 
                                            (grid(B.x - 1, B.y) === '_') || 
                                            (grid(B.x + 1, B.y) === '_')) && !((grid(B.x - 1, B.y + 1) === '+') || (grid(B.x + 1, B.y + 1) === '+'))) || 
                        (dndn === '┻') || 
                        isTopVertex(dndn)) || isJump(dndn)) {
                        // Stretch down to almost reach the line below
                        B.y += 0.5;
                    }

                    // Don't insert degenerate lines
                    if ((A.x !== B.x) || (A.y !== B.y)) {
                        pathSet.insert(new Path(A, B));
                    }

                    // Continue the search from the end value y+1
                } 

                // Some very special patterns for the short lines needed on
                // circuit diagrams. Only invoke these if not also on a curve
                //      _  _    
                //    -'    '-   -'
                else if ((grid(x, y) === "'") &&
                    (((grid(x - 1, y) === '-') && (grid(x + 1, y - 1) === '_') &&
                     ! isSolidVLineOrJumpOrPoint(grid(x - 1, y - 1))) ||
                     ((grid(x - 1, y - 1) === '_') && (grid(x + 1, y) === '-') &&
                     ! isSolidVLineOrJumpOrPoint(grid(x + 1, y - 1))))) {
                    pathSet.insert(new Path(Vec2(x, y - 0.5), Vec2(x, y)));
                }

                //    _.-  -._  
                else if ((grid(x, y) === '.') &&
                         (((grid(x - 1, y) === '_') && (grid(x + 1, y) === '-') && 
                           ! isSolidVLineOrJumpOrPoint(grid(x + 1, y + 1))) ||
                          ((grid(x - 1, y) === '-') && (grid(x + 1, y) === '_') &&
                           ! isSolidVLineOrJumpOrPoint(grid(x - 1, y + 1))))) {
                    pathSet.insert(new Path(Vec2(x, y), Vec2(x, y + 0.5)));
                }

                // For drawing resistors: -.╱
                else if ((grid(x, y) === '.') &&
                         (grid(x - 1, y) === '-') &&
                         (grid(x + 1, y) === '╱')) {
                    pathSet.insert(new Path(Vec2(x, y), Vec2(x + 0.5, y + 0.5)));
                }
                
                // For drawing resistors: ╱'-
                else if ((grid(x, y) === "'") &&
                         (grid(x + 1, y) === '-') &&
                         (grid(x - 1, y) === '╱')) {
                    pathSet.insert(new Path(Vec2(x, y), Vec2(x - 0.5, y - 0.5)));
                }

            } // y
        } // x
        
        // Find all solid horizontal lines 
        for (let y = 0; y < grid.height; ++y) {
            for (let x = 0; x < grid.width; ++x) {
                if (grid.isSolidHLineAt(x, y)) {
                    // Begins a line...find the end
                    const A = Vec2(x, y);
                    do { grid.setUsed(x, y); ++x; } while (grid.isSolidHLineAt(x, y));
                    const B = Vec2(x - 1, y);

                    // Detect adjacent box-drawing characters and lengthen the edge
                    if (grid(B.x + 1, B.y) === '┫') { B.x += 0.5; }
                    if (grid(A.x - 1, A.y) === '┣') { A.x -= 0.5; }

                    // Detect curves and shorten the edge
                    if ( ! isVertex(grid(A.x - 1, A.y)) && 
                         ((isTopVertex(grid(A)) && isSolidVLineOrJumpOrPoint(grid(A.x - 1, A.y + 1))) ||
                          (isBottomVertex(grid(A)) && isSolidVLineOrJumpOrPoint(grid(A.x - 1, A.y - 1))))) {
                        ++A.x;
                    }

                    if ( ! isVertex(grid(B.x + 1, B.y)) && 
                         ((isTopVertex(grid(B)) && isSolidVLineOrJumpOrPoint(grid(B.x + 1, B.y + 1))) ||
                          (isBottomVertex(grid(B)) && isSolidVLineOrJumpOrPoint(grid(B.x + 1, B.y - 1))))) {
                        --B.x;
                    }

                    // Only insert non-degenerate lines
                    if ((A.x !== B.x) || (A.y !== B.y)) {
                        pathSet.insert(new Path(A, B));
                    }
                    
                    // Continue the search from the end x+1
                }
            }
        } // y

        // Find all solid left-to-right downward diagonal lines (BACK DIAGONAL)
        for (let i = -grid.height; i < grid.width; ++i) {
            for (let x = i, y = 0; y < grid.height; ++y, ++x) {
                if (grid.isSolidBLineAt(x, y)) {
                    // Begins a line...find the end
                    const A = Vec2(x, y);
                    do { ++x; ++y; } while (grid.isSolidBLineAt(x, y));
                    const B = Vec2(x - 1, y - 1);

                    // Ensure that the entire line wasn't just vertices
                    if (lineContains(A, B, '\\')) {
                        for (let j = A.x; j <= B.x; ++j) {
                            grid.setUsed(j, A.y + (j - A.x)); 
                        }

                        const top = grid(A);
                        const up = grid(A.x, A.y - 1);
                        const uplt = grid(A.x - 1, A.y - 1);
                        if ((up === '/') || (uplt === '_') || (up === '_') || 
                            (! isVertex(top)  && 
                             (isSolidHLine(uplt) || isSolidVLine(uplt)))) {
                            // Continue half a cell more to connect for:
                            //  ___   ___
                            //  \        \    /      ----     |
                            //   \        \   \        ^      |^
                            A.x -= 0.5; A.y -= 0.5;
                        } else if (isPoint(uplt)) {
                            // Continue 1/4 cell more to connect for:
                            //
                            //  o
                            //   ^
                            //    \
                            A.x -= 0.25; A.y -= 0.25;
                        }
                        
                        const bottom = grid(B);
                        const dnrt = grid(B.x + 1, B.y + 1);
                        if ((grid(B.x, B.y + 1) === '/') || (grid(B.x + 1, B.y) === '_') || 
                            (grid(B.x - 1, B.y) === '_') || 
                            (! isVertex(grid(B)) &&
                             (isSolidHLine(dnrt) || isSolidVLine(dnrt)))) {
                            // Continue half a cell more to connect for:
                            //                       \      \ |
                            //  \       \     \       v      v|
                            //   \__   __\    /      ----     |
                            
                            B.x += 0.5; B.y += 0.5;
                        } else if (isPoint(dnrt)) {
                            // Continue 1/4 cell more to connect for:
                            //
                            //    \
                            //     v
                            //      o
                            
                            B.x += 0.25; B.y += 0.25;
                        }
                        
                        pathSet.insert(new Path(A, B));
                        // Continue the search from the end x+1,y+1
                    } // lineContains
                }
            }
        } // i


        // Find all solid left-to-right upward diagonal lines (DIAGONAL)
        for (let i = -grid.height; i < grid.width; ++i) {
            for (let x = i, y = grid.height - 1; y >= 0; --y, ++x) {
                if (grid.isSolidDLineAt(x, y)) {
                    // Begins a line...find the end
                    const A = Vec2(x, y);
                    do { ++x; --y; } while (grid.isSolidDLineAt(x, y));
                    const B = Vec2(x - 1, y + 1);

                    if (lineContains(A, B, '/')) {
                        // This is definitely a line. Commit the characters on it
                        for (let j = A.x; j <= B.x; ++j) {
                            grid.setUsed(j, A.y - (j - A.x)); 
                        }

                        const up = grid(B.x, B.y - 1);
                        const uprt = grid(B.x + 1, B.y - 1);
                        const bottom = grid(B);
                        if ((up === '\\') || (up === '_') || (uprt === '_') || 
                            (! isVertex(grid(B)) &&
                             (isSolidHLine(uprt) || isSolidVLine(uprt)))) {
                            
                            // Continue half a cell more to connect at:
                            //     __   __  ---     |
                            //    /      /   ^     ^|
                            //   /      /   /     / |
                            
                            B.x += 0.5; B.y -= 0.5;
                        } else if (isPoint(uprt)) {
                            
                            // Continue 1/4 cell more to connect at:
                            //
                            //       o
                            //      ^
                            //     /
                            
                            B.x += 0.25; B.y -= 0.25;
                        }
                        
                        const dnlt = grid(A.x - 1, A.y + 1);
                        const top = grid(A);
                        if ((grid(A.x, A.y + 1) === '\\') || (grid(A.x - 1, A.y) === '_') || (grid(A.x + 1, A.y) === '_') ||
                            (! isVertex(grid(A)) &&
                             (isSolidHLine(dnlt) || isSolidVLine(dnlt)))) {

                            // Continue half a cell more to connect at:
                            //               /     \ |
                            //    /  /      v       v|
                            // __/  /__   ----       | 
                            
                            A.x -= 0.5; A.y += 0.5;
                        } else if (isPoint(dnlt)) {
                            
                            // Continue 1/4 cell more to connect at:
                            //
                            //       /
                            //      v
                            //     o
                            
                            A.x -= 0.25; A.y += 0.25;
                        }
                        pathSet.insert(new Path(A, B));

                        // Continue the search from the end x+1,y-1
                    } // lineContains
                }
            }
        } // y
        
        
        // Now look for curved corners. The syntax constraints require
        // that these can always be identified by looking at three
        // horizontally-adjacent characters.
        for (let y = 0; y < grid.height; ++y) {
            for (let x = 0; x < grid.width; ++x) {
                const c = grid(x, y);

                // Note that because of undirected vertices, the
                // following cases are not exclusive
                if (isTopVertex(c)) {
                    // -.
                    //   |
                    if (isSolidHLine(grid(x - 1, y)) && isSolidVLine(grid(x + 1, y + 1))) {
                        grid.setUsed(x - 1, y); grid.setUsed(x, y); grid.setUsed(x + 1, y + 1);
                        pathSet.insert(new Path(Vec2(x - 1, y), Vec2(x + 1, y + 1), 
                                                Vec2(x + 1.1, y), Vec2(x + 1, y + 1)));
                    }

                    //  .-
                    // |
                    if (isSolidHLine(grid(x + 1, y)) && isSolidVLine(grid(x - 1, y + 1))) {
                        grid.setUsed(x - 1, y + 1); grid.setUsed(x, y); grid.setUsed(x + 1, y);
                        pathSet.insert(new Path(Vec2(x + 1, y), Vec2(x - 1, y + 1), 
                                                Vec2(x - 1.1, y), Vec2(x - 1, y + 1)));
                    }
                }
                
                // Special case patterns:
                //   .  .   .  .    
                //  (  o     )  o
                //   '  .   '  '
                if (((c === ')') || isPoint(c)) && (grid(x - 1, y - 1) === '.') && (grid(x - 1, y + 1) === "\'")) {
                    grid.setUsed(x, y); grid.setUsed(x - 1, y - 1); grid.setUsed(x - 1, y + 1);
                    pathSet.insert(new Path(Vec2(x - 2, y - 1), Vec2(x - 2, y + 1), 
                                            Vec2(x + 0.6, y - 1), Vec2(x + 0.6, y + 1)));
                }

                if (((c === '(') || isPoint(c)) && (grid(x + 1, y - 1) === '.') && (grid(x + 1, y + 1) === "\'")) {
                    grid.setUsed(x, y); grid.setUsed(x + 1, y - 1); grid.setUsed(x + 1, y + 1);
                    pathSet.insert(new Path(Vec2(x + 2, y - 1), Vec2(x + 2, y + 1), 
                                            Vec2(x - 0.6, y - 1), Vec2(x - 0.6, y + 1)));
                }

                if (isBottomVertex(c)) {
                    //   |
                    // -' 
                    if (isSolidHLine(grid(x - 1, y)) && isSolidVLine(grid(x + 1, y - 1))) {
                        grid.setUsed(x - 1, y); grid.setUsed(x, y); grid.setUsed(x + 1, y - 1);
                        pathSet.insert(new Path(Vec2(x - 1, y), Vec2(x + 1, y - 1), 
                                                Vec2(x + 1.1, y), Vec2(x + 1, y - 1)));
                    }

                    // | 
                    //  '-
                    if (isSolidHLine(grid(x + 1, y)) && isSolidVLine(grid(x - 1, y - 1))) {
                        grid.setUsed(x - 1, y - 1); grid.setUsed(x, y); grid.setUsed(x + 1, y);
                        pathSet.insert(new Path(Vec2(x + 1, y), Vec2(x - 1, y - 1),
                                                Vec2(x - 1.1, y), Vec2(x - 1, y - 1)));
                    }
                }
               
            } // for x
        } // for y

        // Find low horizontal lines marked with underscores. These
        // are so simple compared to the other cases that we process
        // them directly here without a helper function. Process these
        // from top to bottom and left to right so that we can read
        // them in a single sweep.
        // 
        // Exclude the special case of double underscores going right
        // into an ASCII character, which could be a source code
        // identifier such as __FILE__ embedded in the diagram.
        for (let y = 0; y < grid.height; ++y) {
            for (let x = 0; x < grid.width - 2; ++x) {
                let lt = grid(x - 1, y);

                if ((grid(x, y) === '_') && (grid(x + 1, y) === '_') && 
                    (! isASCIILetter(grid(x + 2, y)) || (lt === '_')) && 
                    (! isASCIILetter(lt) || (grid(x + 2, y) === '_'))) {

                    let ltlt = grid(x - 2, y);
                    const A = Vec2(x - 0.5, y + 0.5);

                    if ((lt === '|') || (grid(x - 1, y + 1) === '|') ||
                        (lt === '.') || (grid(x - 1, y + 1) === "'")) {
                        // Extend to meet adjacent vertical
                        A.x -= 0.5;

                        // Very special case of overrunning into the side of a curve,
                        // needed for logic gate diagrams
                        if ((lt === '.') && 
                            ((ltlt === '-') ||
                             (ltlt === '.')) &&
                            (grid(x - 2, y + 1) === '(')) {
                            A.x -= 0.5;
                        }
                    } else if (lt === '/') {
                        A.x -= 1.0;
                    }

                    // Detect overrun of a tight double curve
                    if ((lt === '(') && (ltlt === '(') &&
                        (grid(x, y + 1) === "'") && (grid(x, y - 1) === '.')) {
                        A.x += 0.5;
                    }
                    lt = ltlt = undefined;

                    do { grid.setUsed(x, y); ++x; } while (grid(x, y) === '_');

                    const B = Vec2(x - 0.5, y + 0.5);
                    const c = grid(x, y);
                    const rt = grid(x + 1, y);
                    const dn = grid(x, y + 1);

                    if ((c === '|') || (dn === '|') || (c === '.') || (dn === "'")) {
                        // Extend to meet adjacent vertical
                        B.x += 0.5;

                        // Very special case of overrunning into the side of a curve,
                        // needed for logic gate diagrams
                        if ((c === '.') && 
                            ((rt === '-') || (rt === '.')) &&
                            (grid(x + 1, y + 1) === ')')) {
                            B.x += 0.5;
                        }
                    } else if ((c === '\\')) {
                        B.x += 1.0;
                    }

                    // Detect overrun of a tight double curve
                    if ((c === ')') && (rt === ')') && (grid(x - 1, y + 1) === "'") && (grid(x - 1, y - 1) === '.')) {
                        B.x += -0.5;
                    }

                    pathSet.insert(new Path(A, B));
                }
            } // for x
        } // for y
    } // findPaths


    function findDecorations(grid, pathSet, decorationSet) {
        function isEmptyOrVertex(c) { return (c === ' ') || /[^a-zA-Z0-9]|[ov]/.test(c); }
        function isLetter(c) { const x = c.toUpperCase().charCodeAt(0); return (x > 64) && (x < 91); }
                    
        /** Is the point in the center of these values on a line? Allow points that are vertically
            adjacent but not horizontally--they wouldn't fit anyway, and might be text. */
        function onLine(up, dn, lt, rt) {
            return ((isEmptyOrVertex(dn) || isPoint(dn)) &&
                    (isEmptyOrVertex(up) || isPoint(up)) &&
                    isEmptyOrVertex(rt) &&
                    isEmptyOrVertex(lt));
        }

        for (let x = 0; x < grid.width; ++x) {
            for (let j = 0; j < grid.height; ++j) {
                const c = grid(x, j);
                const y = j;

                if (isJump(c)) {

                    // Ensure that this is really a jump and not a stray character
                    if (pathSet.downEndsAt(x, y - 0.5) &&
                        pathSet.upEndsAt(x, y + 0.5)) {
                        decorationSet.insert(x, y, c);
                        grid.setUsed(x, y);
                    }

                } else if (isPoint(c)) {
                    const up = grid(x, y - 1);
                    const dn = grid(x, y + 1);
                    const lt = grid(x - 1, y);
                    const rt = grid(x + 1, y);
                    const llt = grid(x - 2, y);
                    const rrt = grid(x + 2, y);

                    if (pathSet.rightEndsAt(x - 1, y) ||   // Must be at the end of a line...
                        pathSet.leftEndsAt(x + 1, y) ||    // or completely isolated NSEW
                        pathSet.downEndsAt(x, y - 1) ||
                        pathSet.upEndsAt(x, y + 1) ||

                        pathSet.upEndsAt(x, y) ||    // For points on vertical lines 
                        pathSet.downEndsAt(x, y) ||  // that are surrounded by other characters
                        
                        onLine(up, dn, lt, rt)) {

                        decorationSet.insert(x, y, c);
                        grid.setUsed(x, y);
                    }
                } else if (isGray(c)) {
                    decorationSet.insert(x, y, c);
                    grid.setUsed(x, y);
                } else if (isTri(c)) {
                    decorationSet.insert(x, y, c);
                    grid.setUsed(x, y);
                } else { // Arrow heads

                    // If we find one, ensure that it is really an
                    // arrow head and not a stray character by looking
                    // for a connecting line.
                    let dx = 0;
                    if ((c === '>') && (pathSet.rightEndsAt(x, y) || 
                                        pathSet.horizontalPassesThrough(x, y))) {
                        if (isPoint(grid(x + 1, y))) {
                            // Back up if connecting to a point so as to not
                            // overlap it
                            dx = -0.5;
                        }
                        decorationSet.insert(x + dx, y, '>', 0);
                        grid.setUsed(x, y);
                    } else if ((c === '<') && (pathSet.leftEndsAt(x, y) ||
                                               pathSet.horizontalPassesThrough(x, y))) {
                        if (isPoint(grid(x - 1, y))) {
                            // Back up if connecting to a point so as to not
                            // overlap it
                            dx = 0.5;
                        }
                        decorationSet.insert(x + dx, y, '>', 180); 
                        grid.setUsed(x, y);
                    } else if (c === '^') {
                        // Because of the aspect ratio, we need to look
                        // in two slots for the end of the previous line
                        if (pathSet.upEndsAt(x, y - 0.5)) {
                            decorationSet.insert(x, y - 0.5, '>', 270); 
                            grid.setUsed(x, y);
                        } else if (pathSet.upEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 270);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalUpEndsAt(x + 0.5, y - 0.5)) {
                            decorationSet.insert(x + 0.5, y - 0.5, '>', 270 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalUpEndsAt(x + 0.25, y - 0.25)) {
                            decorationSet.insert(x + 0.25, y - 0.25, '>', 270 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalUpEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 270 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalUpEndsAt(x, y)) {
                            decorationSet.insert(x, y, c, 270 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalUpEndsAt(x - 0.5, y - 0.5)) {
                            decorationSet.insert(x - 0.5, y - 0.5, c, 270 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalUpEndsAt(x - 0.25, y - 0.25)) {
                            decorationSet.insert(x - 0.25, y - 0.25, c, 270 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.verticalPassesThrough(x, y)) {
                            // Only try this if all others failed
                            decorationSet.insert(x, y - 0.5, '>', 270); 
                            grid.setUsed(x, y);
                        }
                    } else if (c === 'v') {
                        if (pathSet.downEndsAt(x, y + 0.5)) {
                            decorationSet.insert(x, y + 0.5, '>', 90); 
                            grid.setUsed(x, y);
                        } else if (pathSet.downEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 90);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalDownEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 90 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalDownEndsAt(x - 0.5, y + 0.5)) {
                            decorationSet.insert(x - 0.5, y + 0.5, '>', 90 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalDownEndsAt(x - 0.25, y + 0.25)) {
                            decorationSet.insert(x - 0.25, y + 0.25, '>', 90 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalDownEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 90 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalDownEndsAt(x + 0.5, y + 0.5)) {
                            decorationSet.insert(x + 0.5, y + 0.5, '>', 90 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalDownEndsAt(x + 0.25, y + 0.25)) {
                            decorationSet.insert(x + 0.25, y + 0.25, '>', 90 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.verticalPassesThrough(x, y)) {
                            // Only try this if all others failed
                            decorationSet.insert(x, y + 0.5, '>', 90); 
                            grid.setUsed(x, y);
                        }
                    } // arrow heads
                } // decoration type
            } // y
        } // x
    } // findArrowHeads

    // Cases where we want to redraw at graphical unicode character
    // to adjust its weight or shape for a conventional application
    // in constructing a diagram.
    function findReplacementCharacters(grid, pathSet) {
        for (let x = 0; x < grid.width; ++x) {
            for (let y = 0; y < grid.height; ++y) {
                if (grid.isUsed(x, y)) continue;
                const c = grid(x, y);
                switch (c) {
                case '╱':
                    pathSet.insert(new Path(Vec2(x - 0.5, y + 0.5), Vec2(x + 0.5, y - 0.5)));
                    grid.setUsed(x, y);
                    break;
                case '╲':
                    pathSet.insert(new Path(Vec2(x - 0.5, y - 0.5), Vec2(x + 0.5, y + 0.5)));
                    grid.setUsed(x, y);
                    break;
                }
            }
        }
    } // findReplacementCharacters

    /** The paths are the edges of a planar graph whose vertices are their
        endpoints; Math.round on the quarter-cell scale makes vertex identity
        an integer comparison. A path running into an arrow head is dropped,
        so that an arrow never closes a loop. Straight paths are cut where
        another path touches or crosses their interior, because a wall shared
        by two boxes is one long path with the divider in its middle. Walking
        the half edges sorted by departure angle at each vertex gives the faces;
        the unbounded face of each component has negative area. */
    function findRegions(pathSet, decorationSet, regionSet) {
        // Path endpoints lie on quarter cells
        const VERTEX_SCALE = 4;

        // An arrow head is up to half a cell from the end of its line
        const ARROW_REACH_CELLS = 0.75;

        // Also test direction, because an arrow into the bottom of a small circle
        // lands half a cell from where its two bottom curves meet
        const ARROW_MIN_ALIGNMENT_COSINE = 0.7;

        // Enough samples to give a shallow corner arc or a half circle the correct area sign
        const AREA_SAMPLES_PER_CURVE = 8;

        function scaled(v)  { return Math.round(v * VERTEX_SCALE); }
        function keyOf(P)   { return scaled(P.x) + ',' + scaled(P.y); }
        function samePoint(P, Q) { return (scaled(P.x) === scaled(Q.x)) && (scaled(P.y) === scaled(Q.y)); }

        /** Return the direction from an end of the path into it. Y is scaled by the
            aspect ratio because decoration angles are in rendered space. */
        function departureFromEnd(path, atB) {
            const P = atB ? path.B : path.A;
            let toward = atB ? path.A : path.B;
            if (path.isCurved()) {
                const control = atB ? path.D : path.C;
                if ((control.x !== P.x) || (control.y !== P.y)) { toward = control; }
            }
            return Vec2(toward.x - P.x, (toward.y - P.y) * ASPECT);
        }

        function endsInArrowHead(path) {
            for (let i = 0; i < decorationSet._decorationArray.length; ++i) {
                const decoration = decorationSet._decorationArray[i];
                if (! isArrowHead(decoration.type)) { continue; }

                const radians = decoration.angle * Math.PI / 180;
                for (let e = 0; e < 2; ++e) {
                    const P = e ? path.B : path.A;
                    const dx = decoration.C.x - P.x;
                    const dy = decoration.C.y - P.y;
                    if (((dx * dx) + (dy * dy)) > (ARROW_REACH_CELLS * ARROW_REACH_CELLS)) { continue; }

                    // The path runs into the arrow when the arrow points back down the path
                    const away = departureFromEnd(path, e);
                    const length = Math.sqrt((away.x * away.x) + (away.y * away.y));
                    if (length < EPSILON) { continue; }
                    const alignment = (((away.x / length) * Math.cos(radians)) +
                                     ((away.y / length) * Math.sin(radians)));
                    if (alignment <= -ARROW_MIN_ALIGNMENT_COSINE) { return true; }
                }
            }
            return false;
        }

        /** Compute the scaled endpoints and bounds once, because the split pass
            compares every pair of edges. */
        function makeEdge(A, B, curve) {
            const ax = scaled(A.x), ay = scaled(A.y);
            const bx = scaled(B.x), by = scaled(B.y);
            return {A: A, B: B, curve: curve,
                    ax: ax, ay: ay, bx: bx, by: by,
                    x0: min(ax, bx), y0: min(ay, by),
                    x1: max(ax, bx), y1: max(ay, by)};
        }

        // Corner curves meet other edges only at their ends, so the split pass leaves them whole
        const edgeArray = [];
        for (let i = 0; i < pathSet._pathArray.length; ++i) {
            const path = pathSet._pathArray[i];
            if (samePoint(path.A, path.B) || endsInArrowHead(path)) { continue; }
            edgeArray.push(makeEdge(path.A, path.B, path.isCurved() ? path : null));
        }

        function boundsOverlap(edge, other) {
            return (edge.x0 <= other.x1) && (other.x0 <= edge.x1) &&
                   (edge.y0 <= other.y1) && (other.y0 <= edge.y1);
        }

        function isInteriorPoint(edge, px, py) {
            if (((px === edge.ax) && (py === edge.ay)) ||
                ((px === edge.bx) && (py === edge.by))) { return false; }
            if ((((edge.bx - edge.ax) * (py - edge.ay)) !==
                 ((edge.by - edge.ay) * (px - edge.ax)))) { return false; }
            return (edge.x0 <= px) && (px <= edge.x1) && (edge.y0 <= py) && (py <= edge.y1);
        }

        function considerCut(edge, px, py, cutArray, cutTable) {
            if (! isInteriorPoint(edge, px, py)) { return; }
            const k = px + ',' + py;
            if (cutTable[k]) { return; }
            cutTable[k] = true;
            cutArray.push({x: px, y: py});
        }

        /** Lines run only at multiples of 45 degrees, so a crossing lands on
            the lattice and the rounding is exact. */
        function considerCrossing(edge, other, cutArray, cutTable) {
            const rx = edge.bx - edge.ax,   ry = edge.by - edge.ay;
            const sx = other.bx - other.ax, sy = other.by - other.ay;
            const denominator = (rx * sy) - (ry * sx);
            if (denominator === 0) { return; }
            const dx = other.ax - edge.ax, dy = other.ay - edge.ay;
            const t = (((dx * sy) - (dy * sx)) / denominator);
            const u = (((dx * ry) - (dy * rx)) / denominator);
            if ((t < 0) || (t > 1) || (u < 0) || (u > 1)) { return; }
            considerCut(edge, Math.round(edge.ax + (t * rx)), Math.round(edge.ay + (t * ry)),
                        cutArray, cutTable);
        }

        const cutEdgeArray = [];
        for (let i = 0; i < edgeArray.length; ++i) {
            const edge = edgeArray[i];
            if (edge.curve) { cutEdgeArray.push(edge); continue; }

            const cutArray = [];
            const cutTable = {};
            for (let j = 0; j < edgeArray.length; ++j) {
                const other = edgeArray[j];
                if ((j === i) || ! boundsOverlap(edge, other)) { continue; }
                considerCut(edge, other.ax, other.ay, cutArray, cutTable);
                considerCut(edge, other.bx, other.by, cutArray, cutTable);
                if (! other.curve) { considerCrossing(edge, other, cutArray, cutTable); }
            }

            if (cutArray.length === 0) { cutEdgeArray.push(edge); continue; }

            cutArray.sort(function (P, Q) {
                return (((P.x - edge.ax) * (P.x - edge.ax)) + ((P.y - edge.ay) * (P.y - edge.ay))) -
                       (((Q.x - edge.ax) * (Q.x - edge.ax)) + ((Q.y - edge.ay) * (Q.y - edge.ay)));
            });

            // Unscaled endpoints keep the path finder's exact geometry
            let previous = edge.A;
            for (let c = 0; c < cutArray.length; ++c) {
                const at = Vec2(cutArray[c].x / VERTEX_SCALE, cutArray[c].y / VERTEX_SCALE);
                cutEdgeArray.push(makeEdge(previous, at, null));
                previous = at;
            }
            cutEdgeArray.push(makeEdge(previous, edge.B, null));
        }

        /** Return the angle at which the edge leaves its tail. A curve uses its
            tangent, because two arcs of one circle share both ends and their chords tie. */
        function departureAngle(edge, reversed) {
            const tail = reversed ? edge.B : edge.A;
            let toward = reversed ? edge.A : edge.B;
            if (edge.curve) {
                const control = reversed ? edge.curve.D : edge.curve.C;
                if (! samePoint(control, tail)) { toward = control; }
            }
            return Math.atan2(toward.y - tail.y, toward.x - tail.x);
        }

        /** Return the signed curvature at the tail. A curve leaving tangent to another
            edge ties its angle, and the bend breaks the tie. Positive bends
            toward increasing angle. */
        function departureBend(edge, reversed) {
            if (! edge.curve) { return 0; }
            const tail = reversed ? edge.B : edge.A;
            const P1 = reversed ? edge.curve.D : edge.curve.C;
            const P2 = reversed ? edge.curve.C : edge.curve.D;
            const dx = P1.x - tail.x, dy = P1.y - tail.y;
            const length = Math.sqrt((dx * dx) + (dy * dy));
            if (length <= EPSILON) { return 0; }
            return (2 / 3) * ((dx * (P2.y - P1.y)) - (dy * (P2.x - P1.x))) / (length * length * length);
        }

        // Twins are adjacent, so h ^ 1 is the twin of h
        const vertexTable = {};
        const halfEdgeArray = [];
        for (let i = 0; i < cutEdgeArray.length; ++i) {
            for (let reversed = 0; reversed < 2; ++reversed) {
                const e = cutEdgeArray[i];
                const tail = reversed ? e.B : e.A;
                const tailKey = keyOf(tail);
                if (! vertexTable[tailKey]) { vertexTable[tailKey] = {outgoingArray: []}; }
                vertexTable[tailKey].outgoingArray.push(halfEdgeArray.length);
                halfEdgeArray.push({edge: e, reversed: (reversed === 1), tail: tail,
                                    head: reversed ? e.A : e.B, tailKey: tailKey,
                                    angle: departureAngle(e, reversed),
                                    bend: departureBend(e, reversed)});
            }
        }

        /** Return the points along the half edge after its tail, so that each vertex
            appears once in a joined face list */
        function samplesAlong(halfEdge) {
            if (! halfEdge.edge.curve) { return [halfEdge.head]; }

            const curve = halfEdge.edge.curve;
            const P0 = halfEdge.tail;
            const P1 = halfEdge.reversed ? curve.D : curve.C;
            const P2 = halfEdge.reversed ? curve.C : curve.D;
            const P3 = halfEdge.head;

            const sampleArray = [];
            for (let s = 1; s <= AREA_SAMPLES_PER_CURVE; ++s) {
                const t = s / AREA_SAMPLES_PER_CURVE;
                const u = 1 - t;
                sampleArray.push(Vec2(
                    (u * u * u * P0.x) + (3 * u * u * t * P1.x) + (3 * u * t * t * P2.x) + (t * t * t * P3.x),
                    (u * u * u * P0.y) + (3 * u * u * t * P1.y) + (3 * u * t * t * P2.y) + (t * t * t * P3.y)));
            }
            return sampleArray;
        }

        const slotArray = [];
        for (const key in vertexTable) {
            const outgoingArray = vertexTable[key].outgoingArray;
            outgoingArray.sort(function (a, b) {
                const A = halfEdgeArray[a], B = halfEdgeArray[b];
                return (Math.abs(A.angle - B.angle) > EPSILON) ? (A.angle - B.angle) : (A.bend - B.bend);
            });
            for (let s = 0; s < outgoingArray.length; ++s) { slotArray[outgoingArray[s]] = s; }
        }

        /** Return the next half edge of the face: the twin's neighbour one step back
            in angle order */
        function nextHalfEdge(index) {
            const twin = index ^ 1;
            const outgoing = vertexTable[halfEdgeArray[twin].tailKey].outgoingArray;
            return outgoing[((slotArray[twin] - 1) + outgoing.length) % outgoing.length];
        }

        const visitedArray = [];
        for (let i = 0; i < halfEdgeArray.length; ++i) {
            if (visitedArray[i]) { continue; }

            const chainArray = [];
            let walk = i;
            do {
                visitedArray[walk] = true;
                chainArray.push(walk);
                walk = nextHalfEdge(walk);
            } while ((walk !== i) && ! visitedArray[walk] && (chainArray.length <= halfEdgeArray.length));

            // A walk bounds a closed face when it returns to its start
            if ((walk !== i) || (chainArray.length < 2)) { continue; }

            // Shoelace over curve samples, because a half circle closed by its
            // own chord has a zero-area chord polygon. Y grows downward, so an
            // enclosed face is positive and an unbounded face is negative.
            let doubleArea = 0;
            let previous = halfEdgeArray[chainArray[0]].tail;
            for (let k = 0; k < chainArray.length; ++k) {
                const sampleArray = samplesAlong(halfEdgeArray[chainArray[k]]);
                for (let s = 0; s < sampleArray.length; ++s) {
                    const point = sampleArray[s];
                    doubleArea += (previous.x * point.y) - (point.x * previous.y);
                    previous = point;
                }
            }
            if (doubleArea <= EPSILON) { continue; }

            let boundary = 'M ' + halfEdgeArray[chainArray[0]].tail;
            for (let k = 0; k < chainArray.length; ++k) {
                const step = halfEdgeArray[chainArray[k]];
                if (step.edge.curve) {
                    boundary += 'C ' + (step.reversed ? step.edge.curve.D : step.edge.curve.C) +
                        (step.reversed ? step.edge.curve.C : step.edge.curve.D) + step.head;
                } else {
                    boundary += 'L ' + step.head;
                }
            }
            regionSet.insert(boundary + 'Z');
        }
    } // findRegions

    /** Blank the text runs, so that only diagram characters form paths and
        decorations and set the neighbor tests. Run before makeGrid, which freezes
        the grid. Indices are code points, as in makeGrid, so that a character
        outside the basic multilingual plane keeps its run in its column. */
    function findTextRuns(diagramString, textRunSet) {
        // Detect in the source and blank in the copy, so that a run's neighbors are
        // always source characters
        const sourceArray = strToArray(diagramString);
        const outputArray = sourceArray.slice();

        // Lines have been equalized, so a row is a fixed stride
        const width = sourceArray.indexOf('\n');

        // An empty diagram has no row to scan
        if (width < 0) { return diagramString; }

        const stride = width + 1;
        const height = sourceArray.length / stride;

        /** Return a blank outside the row, so that a run at a line end stays in its row */
        function characterAt(x, y) {
            return ((x >= 0) && (x < width)) ? sourceArray[y * stride + x] : ' ';
        }

        /** A group of glyph letters with a non-letter on both sides is a diagram glyph: a
            lone 'v' is an arrow head and 'o o o o' a row of dots. The 'ov' in
            "over" is part of a word. */
        function isShapeGlyphAt(x, y) {
            if (! isGlyphLetter(characterAt(x, y))) { return false; }

            let first = x;
            while (isGlyphLetter(characterAt(first - 1, y))) { first -= 1; }

            let last = x;
            while (isGlyphLetter(characterAt(last + 1, y))) { last += 1; }

            return ! isRunLetter(characterAt(first - 1, y)) &&
                   ! isRunLetter(characterAt(last + 1, y));
        }

        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                if (! isRunLetter(characterAt(x, y)) || isShapeGlyphAt(x, y)) { continue; }

                let begin = x;
                let end   = x;
                while (true) {
                    if (isRunLetter(characterAt(end + 1, y)) && ! isShapeGlyphAt(end + 1, y)) {
                        end += 1;
                    } else if (isRunJoiner(characterAt(end + 1, y)) &&
                               isRunLetter(characterAt(end + 2, y)) &&
                               ! isShapeGlyphAt(end + 2, y)) {
                        end += 2;
                    } else {
                        break;
                    }
                }

                if ((characterAt(begin - 1, y) === '"') && (characterAt(end + 1, y) === '"')) {
                    begin -= 1;
                    end   += 1;
                }

                const lt = characterAt(begin - 1, y);
                const rt = characterAt(end + 1, y);

                if ((lt === '`') && (rt === '`')) {
                    // Remove the backticks and keep the run in the grid
                    outputArray[y * stride + begin - 1] = ' ';
                    outputArray[y * stride + end + 1]   = ' ';
                } else if ((lt !== '_') && (rt !== '_')) {
                    // Leave a run beside an underscore, which marks a monospace identifier
                    let text = '';
                    for (let i = begin; i <= end; ++i) {
                        text += sourceArray[y * stride + i];
                        outputArray[y * stride + i] = ' ';
                    }

                    let alignment = 'center';
                    if ((lt !== ' ') && (rt === ' ')) {
                        alignment = 'left';
                    } else if ((lt === ' ') && (rt !== ' ')) {
                        alignment = 'right';
                    }

                    textRunSet.insert(Vec2(begin, y), Vec2(end, y), text, alignment);
                }

                // The loop increment steps onto the first cell after the run
                x = end;
            }
        }

        return outputArray.join('');
    } // findTextRuns

    /** Render the diagram as text with the parser and diagram processor of the SVG
        output, in the processor's grid coordinates. */
    function renderDiagramAsText(grid, pathSet, decorationSet, textRunSet) {
        const UP = 1, DOWN = 2, LEFT = 4, RIGHT = 8;
        // Diagonal arm bits, separate from the mask bits
        const DARM_UL = 1, DARM_UR = 2, DARM_LL = 4, DARM_LR = 8;
        // Two arms at one cell are a diamond vertex, drawn with the
        // Symbols for Legacy Computing diagonal glyphs
        const DIAG_VERTEX_GLYPH = [];
        DIAG_VERTEX_GLYPH[DARM_UR | DARM_LR] = '🯙'; // 🯙 left vertex
        DIAG_VERTEX_GLYPH[DARM_UL | DARM_LL] = '🯛'; // 🯛 right vertex
        DIAG_VERTEX_GLYPH[DARM_LL | DARM_LR] = '🯚'; // 🯚 top vertex
        DIAG_VERTEX_GLYPH[DARM_UL | DARM_UR] = '🯘'; // 🯘 bottom vertex
        
        const MASK_GLYPH = [];
        MASK_GLYPH[UP | DOWN] = '│';
        MASK_GLYPH[LEFT | RIGHT] = '─';
        MASK_GLYPH[UP | RIGHT] = '└';
        MASK_GLYPH[UP | LEFT] = '┘';
        MASK_GLYPH[DOWN | RIGHT] = '┌';
        MASK_GLYPH[DOWN | LEFT] = '┐';
        MASK_GLYPH[UP | DOWN | RIGHT] = '├';
        MASK_GLYPH[UP | DOWN | LEFT] = '┤';
        MASK_GLYPH[UP | LEFT | RIGHT] = '┴';
        MASK_GLYPH[DOWN | LEFT | RIGHT] = '┬';
        MASK_GLYPH[UP | DOWN | LEFT | RIGHT] = '┼';

        const ROUND_GLYPH = [];
        ROUND_GLYPH[DOWN | RIGHT] = '╭';
        ROUND_GLYPH[DOWN | LEFT] = '╮';
        ROUND_GLYPH[UP | LEFT] = '╯';
        ROUND_GLYPH[UP | RIGHT] = '╰';

        const maskArray = [], roundArray = [], dashArray = [], diagArray = [],
            underscoreArray = [], outArray = [];
        let x, y, i;
        for (y = 0; y < grid.height; ++y) {
            maskArray.push([]); roundArray.push([]); dashArray.push([]);
            diagArray.push([]); underscoreArray.push([]); outArray.push([]);
            for (x = 0; x < grid.width; ++x) {
                maskArray[y].push(0); roundArray[y].push(false); dashArray[y].push(false);
                diagArray[y].push(0); underscoreArray[y].push(false); outArray[y].push(' ');
            }
        }

        function addMask(cx, cy, bits, dashed) {
            if ((cx < 0) || (cy < 0) || (cx >= grid.width) || (cy >= grid.height)) { return; }
            maskArray[cy][cx] |= bits;
            if (dashed) { dashArray[cy][cx] = true; }
        }

        function setRound(cx, cy) {
            if ((cx >= 0) && (cy >= 0) && (cx < grid.width) && (cy < grid.height)) {
                roundArray[cy][cx] = true;
            }
        }

        // Arrow and point stubs shorten a line by half a cell. Clip the covered
        // range and keep the connectivity bit toward the stub.
        function addStraight(path) {
            let lo, hi, c, fixed;
            if (path.isVertical()) {
                fixed = Math.round(path.A.x);
                lo = min(path.A.y, path.B.y); hi = max(path.A.y, path.B.y);
                for (c = Math.ceil(lo - 0.25); c <= Math.floor(hi + 0.25); ++c) {
                    addMask(fixed, c,
                            ((c - lo > 0.25) ? UP : 0) | ((hi - c > 0.25) ? DOWN : 0),
                            path.dashed);
                }
            } else {
                lo = min(path.A.x, path.B.x); hi = max(path.A.x, path.B.x);
                if (path.A.y !== Math.round(path.A.y)) {
                    // An underscore line is on the bottom of its row; draw it with '_'
                    fixed = Math.floor(path.A.y);
                    for (c = Math.ceil(lo + 0.25); c <= Math.floor(hi - 0.25); ++c) {
                        if ((c >= 0) && (fixed >= 0) && (c < grid.width) && (fixed < grid.height)) {
                            underscoreArray[fixed][c] = true;
                        }
                    }
                    return;
                }
                fixed = Math.round(path.A.y);
                for (c = Math.ceil(lo - 0.25); c <= Math.floor(hi + 0.25); ++c) {
                    addMask(c, fixed,
                            ((c - lo > 0.25) ? LEFT : 0) | ((hi - c > 0.25) ? RIGHT : 0),
                            path.dashed);
                }
            }
        }

        // Two diagonals meeting at a point leave a corner pair of arms, which
        // tells a diamond vertex from a full crossing
        function addDiagonal(path, isBack) {
            const start = (path.A.x <= path.B.x) ? path.A : path.B;
            const end = (path.A.x <= path.B.x) ? path.B : path.A;
            const slope = (end.y > start.y) ? 1 : -1;
            const cxLo = Math.ceil(start.x - 0.25);
            const cxHi = Math.floor(end.x + 0.25);
            for (let cx = cxLo; cx <= cxHi; ++cx) {
                const cy = Math.round(start.y + slope * (cx - start.x));
                if ((cx < 0) || (cy < 0) || (cx >= grid.width) || (cy >= grid.height)) { continue; }
                const lowNeighbour = (cx > cxLo);   // a covered cell to the lower x
                const highNeighbour = (cx < cxHi);  // a covered cell to the higher x
                const single = (cxLo === cxHi);
                if (isBack) {
                    if (lowNeighbour || single) { diagArray[cy][cx] |= DARM_UL; }
                    if (highNeighbour || single) { diagArray[cy][cx] |= DARM_LR; }
                } else {
                    if (lowNeighbour || single) { diagArray[cy][cx] |= DARM_LL; }
                    if (highNeighbour || single) { diagArray[cy][cx] |= DARM_UR; }
                }
            }
        }

        function connectTo(cornerX, cornerY, endpoint, dashed) {
            const dx = endpoint.x - cornerX;
            const dy = endpoint.y - cornerY;
            const horizontal = abs(dx) >= abs(dy);
            const bit = horizontal ? ((dx > 0) ? RIGHT : LEFT) : ((dy > 0) ? DOWN : UP);
            addMask(cornerX, cornerY, bit, dashed);
            const n = Math.floor((horizontal ? abs(dx) : abs(dy)) + 0.25);
            const sx = horizontal ? sign(dx) : 0;
            const sy = horizontal ? 0 : sign(dy);
            const toward = horizontal ? ((sx > 0) ? LEFT : RIGHT) : ((sy > 0) ? UP : DOWN);
            const away = horizontal ? ((sx > 0) ? RIGHT : LEFT) : ((sy > 0) ? DOWN : UP);
            for (let s = 1; s <= n; ++s) {
                addMask(cornerX + sx * s, cornerY + sy * s,
                        toward | ((s < n) ? away : 0), dashed);
            }
        }

        function addCurve(path) {
            if ((path.D.x === path.B.x) && (path.D.y === path.B.y)) {
                // An L corner: A is the horizontal arm and B the vertical arm,
                // so the turn cell is at B's column on A's row
                const cornerX = Math.round(path.B.x);
                const cornerY = Math.round(path.A.y);
                connectTo(cornerX, cornerY, path.A, path.dashed);
                connectTo(cornerX, cornerY, path.B, path.dashed);
                setRound(cornerX, cornerY);
            } else {
                // A ( or ) arc: both ends share a column, and the arc bulges
                // through a bar two columns toward the control points
                const barX = Math.round(path.A.x) + 2 * sign(path.C.x - path.A.x);
                const topY = Math.round(min(path.A.y, path.B.y));
                const bottomY = Math.round(max(path.A.y, path.B.y));
                connectTo(barX, topY, (path.A.y <= path.B.y) ? path.A : path.B, path.dashed);
                connectTo(barX, bottomY, (path.A.y <= path.B.y) ? path.B : path.A, path.dashed);
                addMask(barX, topY, DOWN, path.dashed);
                addMask(barX, bottomY, UP, path.dashed);
                for (let cy = topY + 1; cy < bottomY; ++cy) {
                    addMask(barX, cy, UP | DOWN, path.dashed);
                }
                setRound(barX, topY);
                setRound(barX, bottomY);
            }
        }

        for (i = 0; i < pathSet._pathArray.length; ++i) {
            const path = pathSet._pathArray[i];
            if (path.isCurved()) { addCurve(path); }
            else if (path.isVertical() || path.isHorizontal()) { addStraight(path); }
            else if (path.isDiagonal()) { addDiagonal(path, false); }     // ╱
            else if (path.isBackDiagonal()) { addDiagonal(path, true); }   // ╲
        }

        // Resolve decorations first. An arrow head clears the line bit that faces
        // it in the cell beyond the head, so that cell's glyph omits the segment
        // toward the arrow.
        const POINT_GLYPH = { '*': '●', 'o': '○',
                            '◌': '◌', '○': '○',
                            '◍': '◍', '●': '●' };
        const ARROW_GLYPH = '▶▼◀▲';
        const ARROW_STEP_TABLE = [{x: 1, y: 0, bit: LEFT}, {x: 0, y: 1, bit: UP},
                                {x: -1, y: 0, bit: RIGHT}, {x: 0, y: -1, bit: DOWN}];
        const decoArray = [];
        for (y = 0; y < grid.height; ++y) {
            decoArray.push([]);
            for (x = 0; x < grid.width; ++x) { decoArray[y].push(null); }
        }
        for (i = 0; i < decorationSet._decorationArray.length; ++i) {
            const decoration = decorationSet._decorationArray[i];
            const type = decoration.type;
            if (isPoint(type) || isJump(type) || isGray(type) || isTri(type)) {
                const dx2 = Math.round(decoration.C.x);
                const dy2 = Math.round(decoration.C.y);
                if ((dx2 < 0) || (dy2 < 0) || (dx2 >= grid.width) || (dy2 >= grid.height)) { continue; }
                decoArray[dy2][dx2] = isPoint(type) ? (POINT_GLYPH[type] || type) : type;
            } else {
                // Angle 0 points right and angles grow clockwise. The decoration is
                // up to half a cell from the line end along the arrow axis, so round
                // that axis back toward the glyph cell; Math.round would drop a
                // v-arrow onto the box edge below
                const quarter = ((Math.round(decoration.angle / 90) % 4) + 4) % 4;
                const ax = decoration.C.x, ay = decoration.C.y;
                const cx2 = (quarter === 0) ? Math.ceil(ax)
                        : (quarter === 2) ? Math.floor(ax) : Math.round(ax);
                const cy2 = (quarter === 1) ? Math.floor(ay)
                        : (quarter === 3) ? Math.ceil(ay) : Math.round(ay);
                if ((cx2 < 0) || (cy2 < 0) || (cx2 >= grid.width) || (cy2 >= grid.height)) { continue; }
                decoArray[cy2][cx2] = ARROW_GLYPH[quarter];
                const step = ARROW_STEP_TABLE[quarter];
                const bx = cx2 + step.x, by = cy2 + step.y;
                if ((bx >= 0) && (by >= 0) && (bx < grid.width) && (by < grid.height)) {
                    maskArray[by][bx] &= ~step.bit;
                }
            }
        }

        for (y = 0; y < grid.height; ++y) {
            for (x = 0; x < grid.width; ++x) {
                let mask = maskArray[y][x];
                // A lone stub bit is a path end; draw the full bar of the source '-' or '|'
                if ((mask === UP) || (mask === DOWN)) { mask = UP | DOWN; }
                if ((mask === LEFT) || (mask === RIGHT)) { mask = LEFT | RIGHT; }
                if (decoArray[y][x]) {
                    outArray[y][x] = decoArray[y][x];
                } else if (mask) {
                    let glyph = (roundArray[y][x] && ROUND_GLYPH[mask]) || MASK_GLYPH[mask] || ' ';
                    if (dashArray[y][x]) {
                        if (mask === (UP | DOWN)) { glyph = '╎'; }
                        else if (mask === (LEFT | RIGHT)) { glyph = '╌'; }
                    }
                    outArray[y][x] = glyph;
                } else if (diagArray[y][x]) {
                    const arms = diagArray[y][x];
                    const vertex = DIAG_VERTEX_GLYPH[arms];
                    if (vertex) {
                        outArray[y][x] = vertex;
                    } else {
                        const hasSlash = (arms & (DARM_LL | DARM_UR)) !== 0;
                        const hasBack = (arms & (DARM_UL | DARM_LR)) !== 0;
                        outArray[y][x] = (hasSlash && hasBack) ? '╳'
                            : (hasSlash ? '╱' : '╲');
                    }
                } else if (underscoreArray[y][x]) {
                    outArray[y][x] = '_';
                }
            }
        }

        // findTextRuns() removed the text runs before makeGrid
        textRunSet.toTextArray(outArray);

        // Residual grid: everything the processor did not consume
        for (y = 0; y < grid.height; ++y) {
            for (x = 0; x < grid.width; ++x) {
                const c = grid(x, y);
                if ((c !== ' ') && ! grid.isUsed(x, y) && (outArray[y][x] === ' ')) {
                    outArray[y][x] = c;
                }
            }
        }

        const lineArray = [];
        for (y = 0; y < grid.height; ++y) {
            lineArray.push(outArray[y].join('').replace(/\s+$/, ''));
        }
        return lineArray.join('\n').rp(new RegExp(HIDE_O, 'g'), 'o');
    }

    // Find text runs first, so that text characters stay out of path matching and
    // the paths aligned to them keep their neighbors
    const textRunSet = new TextRunSet();
    diagramString = findTextRuns(diagramString, textRunSet);

    // Temporarily replace 'o' that is surrounded by other text
    // with another character to avoid processing it as a point 
    // decoration. This will be replaced in the final svg and is
    // faster than checking each neighborhood each time.
    // Write the private-use character as an escape, because it is invisible
    const HIDE_O = '\ue004';
    diagramString = diagramString.rp(/([a-zA-Z]{2})o/g, '$1' + HIDE_O);
    diagramString = diagramString.rp(/o([a-zA-Z]{2})/g, HIDE_O + '$1');
    // The escape in each character class is HIDE_O
    diagramString = diagramString.rp(/([a-zA-Z\ue004])o([a-zA-Z\ue004])/g, '$1' + HIDE_O + '$2');

    const grid = makeGrid(diagramString);

    const pathSet = new PathSet();
    const decorationSet = new DecorationSet();

    findPaths(grid, pathSet);
    findReplacementCharacters(grid, pathSet);
    findDecorations(grid, pathSet, decorationSet);

    if (outputFormat === 'text') {
        return renderDiagramAsText(grid, pathSet, decorationSet, textRunSet);
    }

    // Find regions after every pass that can insert a path
    const regionSet = new RegionSet();
    findRegions(pathSet, decorationSet, regionSet);

    let svg = '<svg class="diagram" xmlns="http://www.w3.org/2000/svg" version="1.1" height="' + 
        ((grid.height + 1) * SCALE * ASPECT) + '" width="' + ((grid.width + 1) * SCALE) + '"';

    // A diagram is a centered block and never floats
    svg += ' style="margin:0 auto 0 auto;"';

    svg += '><g transform="translate(' + Vec2(1, 1) + ')">\n';

    if (DEBUG_SHOW_GRID) {
        svg += '<g style="opacity:0.1">\n';
        for (let x = 0; x < grid.width; ++x) {
            for (let y = 0; y < grid.height; ++y) {
                svg += '<rect x="' + ((x - 0.5) * SCALE + 1) + '" + y="' + ((y - 0.5) * SCALE * ASPECT + 2) + '" width="' + (SCALE - 2) + '" height="' + (SCALE * ASPECT - 2) + '" style="fill:';
                if (grid.isUsed(x, y)) {
                    svg += 'red;';
                } else if (grid(x, y) === ' ') {
                    svg += 'gray;opacity:0.05';
                } else {
                    svg += 'blue;';
                }
                svg += '"/>\n';
            }
        }
        svg += '</g>\n';
    }
    
    // Paint regions first, so that every line and glyph is over them
    svg += regionSet.toSVG();
    svg += pathSet.toSVG();
    svg += decorationSet.toSVG();
    svg += textRunSet.toSVG();

    // Convert any remaining characters
    if (! DEBUG_HIDE_PASSTHROUGH) {
        svg += '<g transform="translate(0,0)">';
        for (let y = 0; y < grid.height; ++y) {
            for (let x = 0; x < grid.width; ++x) {
                const c = grid(x, y);
                if (/[⬢⬡]/.test(c)) {
                    // Enlarge hexagons so that they fill a grid
                    svg += '<text text-anchor="middle" x="' + (x * SCALE) + '" y="' + (4 + y * SCALE * ASPECT) + '" style="font-size:20.5px">' + escapeHTMLEntities(c) +  '</text>';
                } else if ((c !== ' ') && ! grid.isUsed(x, y)) {
                    svg += '<text text-anchor="middle" x="' + (x * SCALE) + '" y="' + (4 + y * SCALE * ASPECT) + '">' + escapeHTMLEntities(c) +  '</text>';
                } // if
            } // y
        } // x
        svg += '</g>';
    }

    if (DEBUG_SHOW_SOURCE) {
        // Offset the characters a little for easier viewing
        svg += '<g transform="translate(2,2)">\n';
        for (let x = 0; x < grid.width; ++x) {
            for (let y = 0; y < grid.height; ++y) {
                const c = grid(x, y);
                if (c !== ' ') {
                    svg += '<text text-anchor="middle" x="' + (x * SCALE) + '" y="' + (4 + y * SCALE * ASPECT) + '" style="fill:#F00;font-family:Menlo,monospace;font-size:12px;text-align:center">' + escapeHTMLEntities(c) +  '</text>';
                } // if
            } // y
        } // x
        svg += '</g>';
    } // if

    svg += '</g></svg>';

    svg = svg.rp(new RegExp(HIDE_O, 'g'), 'o');


    return svg;
}


/** Public API: window.markdeep.diagramToText */
function diagramToText(diagramString) {
    return diagramToSVG(diagramString, 'text');
}

function blankLine(match) { return match.rp(/[^\n]/g, ' '); }

/** blankCodeFences, blankCodeText, and blankVerbatimText find code fences with
    the renderer's fence grammar, because a different grammar would disagree
    about what is code. */
function blankCodeFences(source) {
    return source.rp(/(^|\n)([ \t]*)(~{3,}(?!~)|`{3,}(?!`))(?![ \t]*[~^!@#$%&*.,\/?:;|=+])[\s\S]*?\n\2\3[ \t]*(?=\n|$)/g, blankLine);
}

/** Keep lengths and newlines, so that a match in the result names the same span
    of source */
function blankCodeText(source) {
    return source.rp(/(^|\n)([ \t]*)(~{3,}(?!~)|`{3,}(?!`))(?![ \t]*[~^!@#$%&*.,\/?:;|=+])[\s\S]*?\n\2\3[ \t]*(?=\n|$)|`[^`\n]*`/g, blankLine);
}

/** For source whose code fences are already pre and code elements */
function blankRenderedCode(source) {
    return source.rp(/<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>|`[^`\n]*`/gi, blankLine);
}

/** Blank code fences, inline code, and script, style, and pre blocks */
function blankVerbatimText(source) {
    return source.rp(/(^|\n)([ \t]*)(~{3,}(?!~)|`{3,}(?!`))(?![ \t]*[~^!@#$%&*.,\/?:;|=+])[\s\S]*?\n\2\3[ \t]*(?=\n|$)|<(script|style|pre)\b[\s\S]*?<\/\4>|`[^`\n]*`/gi, blankLine);
}


////////////////////////// Processing for INSERT HERE
//
// Insert command processing modifies the entire document and potentially
// delays further processing, so it is handled specially and runs the main
// markdeep processing as a callback
//
// node: the node being processed for markdeep. This is document.body
// in markdeep mode, but may be another node in html or script mode.
//
// processMarkdeepCallback: function to run when insert is complete
// to evaluate markdeep 
function processInsertCommands(nodeArray, sourceArray, insertDoneCallback) {
    const myURLParse = /([^?]+)(?:\?(?:[^#]*&)?id=(inc\d+)&p=([^&]+))?/.exec(location.href);

    const myBase = removeFilename(myURLParse[1]);
    const myID = myURLParse[2];
    const parentBase = removeFilename(myURLParse[3] && decodeURIComponent(myURLParse[3]));
    const childFrameStyle = 'display:none';
    let includeCounter = 0;
    const IAmAChild = myID; // !== undefined
    let IAmAParent = false;
    let numIncludeChildrenLeft = 0;

    // Splice a child into the source text and launch its iframe from a hidden
    // container, because a second pass through the HTML parser would bring back
    // the corruption that the <plaintext> carrier prevents
    // Write the private-use character as an escape, because it is invisible
    const PLACEHOLDER_CHARACTER = '\ue020';
    let childFrameHTML = '';
    /** @type {Object<string, number>} */
    const childSourceIndexTable = {};

    
    // Helper function for use by children
    function sendContentsToMyParent(sourceArray) {
        // Send my own inserts too, so that a grandchild reaches the top document
        let body = sourceArray.join('\n');

        // Fix relative URLs within the body
        let baseref;
        if (document.baseURI !== undefined) {
            baseref = document.baseURI.rp(/\/[^/]+$/, '/');
        } else {
            // IE11
            // Return location from BASE tag.
            //   https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
            const base = document.getElementsByTagName('base');
            baseref = (base.length > 0) ? base[0].href : document.URL;
        }

        let serverref;
        if (/^file:\/\//.test(baseref)) {
            serverref = 'file://';
        } else {
            serverref = baseref.match(/[^:/]{3,6}:\/\/[^/]*\//)[0];
        }

        // Cases where URLs appear:
        //
        // ![](...)
        // [](...)
        // [link]: ...
        // <img src="...">
        // <script src="...">
        // <a href="...">
        // <link href="...">
        //
        // A url is relative if it does not begin with '^[a-z]{3,6}://|^#'

        function makeAbsoluteURL(url) {
            return (/^[a-z]{3,6}:\/\//.test(url)) ?
                url :
                (url[0] === '/') ?
                // Make relative to server
                serverref + url.ss(1) :
                // Make relative to source document
                baseref + url;
        }

        // Unquoted images and links
        body = body.rp(/\]\([ \t]*([^#")][^ "\)]+)([ \t\)])/g, function (match, url, suffix) {
            return '](' + makeAbsoluteURL(url) + suffix;
        });
        
        // Quoted images and links
        body = body.rp(/\]\([ \t]*"([^#"][^"]+)"([ \t\)])/g, function (match, url, suffix) {
            return ']("' + makeAbsoluteURL(url) + '"' + suffix;
        });

        // Raw HTML
        body = body.rp(/(src|href)=(["'])([^#>][^"'\n>]+)\2/g, function (match, type, quot, url) {
            return type + '=' + quot + makeAbsoluteURL(url) + quot;
        });

        // Reference links
        body = body.rp(/(\n\[[^\]>\n \t]:[ \t]*)([^# \t][^ \t]+)"/g, function (match, prefix, url) {
            return prefix + makeAbsoluteURL(url);
        });

        // Unprotect code fences
        // TODO
        
        // console.log(location.pathname + " sent message to parent");
        // Send the document contents after the childFrame replaced itself
        // (not the source variable captured when this function was defined!)
        parent.postMessage([myID, '=', body].join(''), '*');
    }

    // Strip the filename from the url, if there is one (and it is a string)
    function removeFilename(url) {
        return url && url.ss(0, url.lastIndexOf('/') + 1);
    }

    // IAmAChild: Truish if this document is a child
    //
    // sourceArray: the source of the nodes, with the inserted children spliced in
    function documentReady(IAmAChild, nodeArray, sourceArray) {
        if (IAmAChild) {
            // I'm a child and not waiting for my own children, so trigger the send now. My parent will
            // do the processing.
            
            // console.log("Leaf node " + location.pathname + " sending to parent");
            sendContentsToMyParent(sourceArray);
        } else {
            // No includes. Run markdeep processing after the rest of this file parses
            
            // console.log("non-parent, non-child Parent scheduling markdeepProcessor");
            setTimeout(function () { insertDoneCallback(nodeArray, sourceArray) }, 1);
        }
    }
     
     /** @param {MessageEvent} event */
     function messageCallback(event) {
         // An include message is `inc{n}={child source}`
         const header = (typeof event.data === 'string') && event.data.match(/^(inc\d+)=/);
         if (! header) { return; }
         const childID = header[1];

         // Accept contents only from the child frame created for this ID. Any window
         // can post the same text, and file pages send a null origin, so test the
         // sending window.
         const childFrame = /** @type {HTMLIFrameElement | null} */ (document.getElementById(childID));
         if (! childFrame || (event.source !== childFrame.contentWindow)) { return; }

         childFrame.remove();

         const childBody = event.data.substring(header[0].length);
         const childIndex = childSourceIndexTable[childID];
         sourceArray[childIndex] = sourceArray[childIndex].rp(
             PLACEHOLDER_CHARACTER + childID + PLACEHOLDER_CHARACTER,
             function () { return '\n' + childBody + '\n'; });

         --numIncludeChildrenLeft;
         if (numIncludeChildrenLeft <= 0) {
             // This was the last child
             documentReady(IAmAChild, nodeArray, sourceArray);
         }
     }

     const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1 && navigator.userAgent.indexOf('Seamonkey') === -1;
    
     // Find all insert or embed statements in all nodes and replace them
     for (let i = 0; i < sourceArray.length; ++i) {
         const verbatimBlanked = blankVerbatimText(sourceArray[i]);
         sourceArray[i] = sourceArray[i].rp(/(?:^|\s)\((insert|embed)[ \t]+(\S+\.\S*)[ \t]+(height=[a-zA-Z0-9.]+[ \t]+)?here\)\s/g, function(match, type, src, params, offset) {
             // Leave the command in verbatim text, which documents the syntax
             if (verbatimBlanked.ss(offset, offset + match.length) !== match) { return match; }

             const childID = 'inc' + (++includeCounter);
             const isHTML = src.toLowerCase().rp(/\?.*$/,'').endsWith('.html');
             if (type === 'embed' || ! isHTML) {
                 // This is not embedding another Markdeep file. Instead it is embedding
                 // some other kind of document.
                 let tag = 'iframe', url='src';
                 const style = params ? ' style="' + params.rp(/=/g, ':') + '"' : '';
                 
                 if (isFirefox && ! isHTML) {
                     // Firefox doesn't handle embedding other non-html documents in iframes
                     // correctly (it tries to download them!), so we switch to an object
                     // tag--which seems to work identically to the embed tag on this browser.                     
                     tag = 'object'; url = 'data';

                     // Firefox can be confused on a server (but not
                     // locally) by misconfigured MIME types and show
                     // nothing.  But if we know that we're on a
                     // server, we can go ahead and make an
                     // XMLHttpRequest() for the underlying document
                     // directly. Replace the insert in this case.
                     if (location.protocol.startsWith('http')) {
                         const req = new XMLHttpRequest();
                         (function (childID, style) {
                             req.addEventListener("load", function () {
                                 document.getElementById(childID).outerHTML =
                                     // Escape the text once for the srcdoc document and once for the attribute
                                     entag('iframe', '', 'class="textinsert" srcdoc="' + escapeHTMLEntities('<pre>' + escapeHTMLEntities(this.responseText) + '</pre>') + '"' + style);
                             });
                             req.overrideMimeType("text/plain; charset=x-user-defined");
                             req.open("GET", src); 
                             req.send();
                         })(childID, style);
                     }
                 }

                 // Escape the address, which is document text, to keep it inside its attribute
                 return entag(tag, '', 'class="textinsert" id="' + childID + '" ' + url + '="' + escapeHTMLEntities(src) + '"' + style);
             }
             
             if (numIncludeChildrenLeft === 0) {
                 // This is the first child observed. Prepare to receive messages from the
                 // embedded children.
                 IAmAParent = true;
                 addEventListener("message", messageCallback);
             }
             
             ++numIncludeChildrenLeft;
             //console.log(window.location.pathname, 'numIncludeChildrenLeft = ' + numIncludeChildrenLeft);
             
             // The loaded frame sends its source back, and messageCallback splices it
             // in at this placeholder
             childSourceIndexTable[childID] = i;
             childFrameHTML += '<iframe src="' + escapeHTMLEntities(src + ((src.indexOf('?') === -1) ? '?' : '&') + 'id=' + childID + '&p=' + encodeURIComponent(myBase)) + 
                 '" id="' + childID + '" style="' + childFrameStyle + '" content="text/html;charset=UTF-8"></iframe>';

             return PLACEHOLDER_CHARACTER + childID + PLACEHOLDER_CHARACTER;
         });
     }

     // console.log('after insert: ' + source);

     // Process all nodes
     if (IAmAParent) {
         // Put the frames in their own container, so that the document source stays
         // unchanged. The last child to report decides whether I am also a child.
         const childFrameContainer = document.createElement('div');
         childFrameContainer.style.display = 'none';
         childFrameContainer.innerHTML = childFrameHTML;
         document.body.appendChild(childFrameContainer);
     } else {
         // The source was not modified
         documentReady(IAmAChild, nodeArray, sourceArray);
     }
} // function processInsertCommands()

 
/* Syntax highlighting palette. Selectors use highlight.js 11 scope names: a dotted
   scope such as `title.function` is `class="hljs-title function_"`, selected by
   `.hljs-title.function_`. Colors read --syntax-* custom properties so that both
   color schemes work and a theme restyles syntax by setting values. */
const HIGHLIGHT_STYLESHEET = entag('style', `@layer md.base{
.hljs{display:block;overflow-x:auto;padding:0.5em;background:transparent;color:var(--syntax-text);-webkit-text-size-adjust:none}
.hljs-comment{color:var(--syntax-comment)}
.hljs-comment .hljs-doctag{font-weight:bold}
.hljs-keyword{color:var(--syntax-keyword)}
.hljs-literal,.hljs-variable.language_{color:var(--syntax-literal)}
.hljs-variable.constant_,.hljs-symbol{color:var(--syntax-constant)}
.hljs-number{color:var(--syntax-number)}
.hljs-string{color:var(--syntax-string)}
.hljs-char.escape_{color:var(--syntax-escape)}
.hljs-regexp{color:var(--syntax-regexp)}
.hljs-type,.hljs-class,.hljs-title.class_{color:var(--syntax-type)}
.hljs-built_in,.hljs-title,.hljs-title.function_{color:var(--syntax-function)}
.hljs-variable,.hljs-params,.hljs-property,.hljs-template-variable{color:var(--syntax-variable)}
.hljs-attr{color:var(--syntax-key)}
.hljs-attribute{color:var(--syntax-property)}
.hljs-name{color:var(--syntax-tag)}
.hljs-tag{color:var(--syntax-tag-bracket)}
.hljs-selector-tag,.hljs-selector-id,.hljs-selector-class,.hljs-selector-attr,.hljs-selector-pseudo{color:var(--syntax-selector)}
.hljs-meta{color:var(--syntax-meta)}
.hljs-section{color:var(--syntax-section);font-weight:bold}
.hljs-bullet{color:var(--syntax-bullet)}
.hljs-quote{color:var(--syntax-quote)}
.hljs-strong{color:var(--syntax-strong);font-weight:bold}
.hljs-emphasis{color:var(--syntax-emphasis);font-style:italic}
.hljs-code{color:var(--syntax-code)}
.hljs-link{text-decoration:underline}
.hljs-subst{color:var(--syntax-text)}
}`);

function isMarkdeepScriptName(str) { return str.search(/markdeep\S*?\.js$/i) !== -1; }
function toArray(list) { return Array.prototype.slice.call(list); }

/** Remove every element of class `fallback`, so that the styles that show the
    unrendered source as plain text stop applying to the rendered page. */
function removeFallbackNodes() {
    toArray(document.getElementsByClassName('fallback')).forEach(function (node) { node.remove(); });
}

/** Save the scroll position of the rendered document when the page hides, and
    restore it after a reload or a back or forward navigation. The key excludes
    the fragment, so that a reload of `#target` keeps the reader's place. Images
    and fonts that finish loading change the layout, so set the position again at
    the load event unless the reader has moved the page.
    @returns {boolean} True when it restored a position */
function restoreRenderedScroll() {
    const key = 'markdeep.scrollTop ' + location.pathname + location.search;
    const scroller = /** @type {Element} */ (document.scrollingElement);
    window.addEventListener('pagehide', function () {
        sessionStorage.setItem(key, String(scroller.scrollTop));
    });

    const navigationType = /** @type {PerformanceNavigationTiming} */ (performance.getEntriesByType('navigation')[0]).type;
    const saved = sessionStorage.getItem(key);
    if (((navigationType !== 'reload') && (navigationType !== 'back_forward')) || (saved === null)) {
        return false;
    }

    const y = parseFloat(saved);
    scroller.scrollTop = y;
    if (document.readyState !== 'complete') {
        let readerMoved = false;
        for (const eventName of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
            window.addEventListener(eventName, function () { readerMoved = true; }, {once: true, capture: true});
        }
        window.addEventListener('load', function () {
            if (! readerMoved) { scroller.scrollTop = y; }
        }, {once: true});
    }
    return true;
}

// Intentionally uninitialized global variable used to detect
// recursive invocations
if (! IN_BROWSER || ! window.alreadyProcessedMarkdeep) {
    if (IN_BROWSER) {
        window.alreadyProcessedMarkdeep = true;

        // This script runs from the preamble, so the rule exists before the
        // <plaintext> source carrier, and the browser never paints the raw markdown.
        // Without JavaScript the source shows as monospace text, the fallback
        // rendering.
        document.head.appendChild(Object.assign(document.createElement("style"),
                                                {id: "markdeepCarrierStyle",
                                                 textContent: "plaintext{display:none}"}));
    }

    // Not needed: jax: ["input/TeX", "output/SVG"], 
    const MATHJAX_CONFIG = '<span style="display:none">' +
        // Custom definitions (NC == \newcommand)
        '$$NC{\\n}{\\hat{n}}NC{\\thetai}{\\theta_\\mathrm{i}}NC{\\thetao}{\\theta_\\mathrm{o}}NC{\\d}[1]{\\mathrm{d}#1}NC{\\w}{\\hat{\\omega}}NC{\\wi}{\\w_\\mathrm{i}}NC{\\wo}{\\w_\\mathrm{o}}NC{\\wh}{\\w_\\mathrm{h}}NC{\\Li}{L_\\mathrm{i}}NC{\\Lo}{L_\\mathrm{o}}NC{\\Le}{L_\\mathrm{e}}NC{\\Lr}{L_\\mathrm{r}}NC{\\Lt}{L_\\mathrm{t}}NC{\\O}{\\mathrm{O}}NC{\\degrees}{{^{\\large\\circ}}}NC{\\T}{\\mathsf{T}}NC{\\mathset}[1]{\\mathbb{#1}}NC{\\Real}{\\mathset{R}}NC{\\Integer}{\\mathset{Z}}NC{\\Boolean}{\\mathset{B}}NC{\\Complex}{\\mathset{C}}NC{\\un}[1]{\\,\\mathrm{#1}}$$\n'.rp(/NC/g, '\\newcommand') +
        '</span>\n';

    const MATHJAX_URL = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';

    const loadMathJax = function() {
        window.MathJax = {
            loader: {load: ["input/tex", "output/chtml", '[tex]/mathtools']},
            tex: {
                packages: {'[+]': ['mathtools']},
                tags: 'ams'
            }
        };
        
        // Dynamically load mathjax
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = MATHJAX_URL;
        document.getElementsByTagName("head")[0].appendChild(script);
    }

    const needsMathJax = function(html) {
        // Need MathJax if $$ ... $$, \( ... \), or \begin{
        return option('detectMath') &&
            ((html.search(/(?:\$\$[\s\S]+\$\$)|(?:\\begin{)/m) !== -1) || 
            (html.search(/\\\(.*\\\)/) !== -1));
    }

    // PHASE 1: Helper functions for attributing source lines to DOM elements
    
    /** Check if a tag name represents a block-level element */
    function isBlockElement(tagName) {
        if (!tagName) { return false; }
        const blockTags = {
            'P': true, 'DIV': true, 'H1': true, 'H2': true, 'H3': true, 
            'H4': true, 'H5': true, 'H6': true, 'PRE': true, 'BLOCKQUOTE': true,
            'UL': true, 'OL': true, 'LI': true, 'TABLE': true, 'TR': true,
            'TD': true, 'TH': true, 'SECTION': true, 'ARTICLE': true,
            'HEADER': true, 'FOOTER': true, 'CENTER': true
        };
        return blockTags[tagName.toUpperCase()] || false;
    }
    
    /** Walk DOM and convert protected line markers to data-src-line attributes */
    function attributeSourceLines(rootElement) {
        if (!rootElement) { return; }
        
        let attributedCount = 0;
        const markerPattern = /⟨L:(\d+)⟩/g;
        
        // Walk all text nodes
        const walker = document.createTreeWalker(
            rootElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodesToClean = [];
        let node;
        
        while (node = walker.nextNode()) {
            const text = node.nodeValue;
            if (!text) { continue; }
            
            const match = markerPattern.exec(text);
            if (match) {
                const lineNum = match[1];
                
                // Find nearest block-level parent element
                let blockElement = node.parentElement;
                while (blockElement && !isBlockElement(blockElement.tagName)) {
                    blockElement = blockElement.parentElement;
                }
                
                if (blockElement && !blockElement.hasAttribute('data-src-line')) {
                    blockElement.setAttribute('data-src-line', lineNum);
                    attributedCount++;
                }
                
                // Mark this text node for cleaning
                textNodesToClean.push(node);
                
                // Reset regex for next iteration
                markerPattern.lastIndex = 0;
            }
        }
        
        // Clean markers from text nodes
        for (let i = 0; i < textNodesToClean.length; i++) {
            const textNode = textNodesToClean[i];
            textNode.nodeValue = textNode.nodeValue.replace(/⟨L:\d+⟩/g, '');
        }
    }
    
    // ============================================================================
    // PHASE 2: SOURCE VIEW - Context menu and source viewing
    // ============================================================================
    //
    // Provides a context menu to view the original Markdeep source with line
    // numbers. Clicking on a rendered element shows the corresponding source line.
    //
    // FEATURES:
    // - Custom context menu on body (when no selection)
    // - "View Document Markdeep Source" menu item
    // - Source view with isolated styling (no page CSS inheritance)
    // - Scroll to clicked line with pointer alignment
    // - Return to rendered document button
    //
    // ============================================================================
    
    function initializeSourceView(originalSource) {
        let isSourceViewActive = false;
        let sourceViewContainer = null;
        let clickedLineNumber = null;
        let clickedY = null;
        
        // Create source view UI (hidden initially)
        function createSourceViewUI() {
            // Create container with isolated styling
            const container = document.createElement('div');
            container.id = 'markdeep-source-view';
            // Read colors from custom properties, so that the source view follows the color scheme
            container.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:999999; background:var(--page-color); color:var(--body-color); overflow:auto;';

            // Create toolbar
            const toolbar = document.createElement('div');
            toolbar.style.cssText = 'position:sticky; top:0; left:0; right:0; background:var(--table-shade); border-bottom:var(--table-line-width) solid var(--table-line); padding:10px; z-index:1000000;';

            const returnButton = document.createElement('button');
            returnButton.textContent = 'Return to Rendered Document';
            returnButton.style.cssText = 'padding:8px 16px; background:var(--link-color); color:var(--page-color); border:none; border-radius:4px; cursor:pointer; font-family:var(--body-font); font-size:14px;';
            returnButton.onmouseover = function() { this.style.background = 'var(--heading-color)'; };
            returnButton.onmouseout = function() { this.style.background = 'var(--link-color)'; };
            returnButton.onclick = function() { hideSourceView(); };
            
            toolbar.appendChild(returnButton);
            container.appendChild(toolbar);
            
            // Create source display area
            const sourceDisplay = document.createElement('pre');
            sourceDisplay.id = 'markdeep-source-display';
            sourceDisplay.style.cssText = 'margin:0; padding:20px; font-family:var(--code-font); font-size:13px; line-height:1.5; white-space:pre-wrap; word-wrap:break-word; color:var(--body-color); background:var(--page-color);';
            
            // Add line numbers and source
            const lines = originalSource.split('\n');
            let html = '';
            for (let i = 0; i < lines.length; i++) {
                const lineNum = i + 1;
                const lineContent = lines[i].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                html += '<span style="display:inline-block; width:100%; background:' +
                       ((lineNum % 2 === 0) ? 'var(--table-shade)' : 'var(--page-color)') + ';">' +
                       '<span style="display:inline-block; width:60px; color:var(--quiet-color); text-align:right; padding-right:10px; user-select:none;" data-line="' + lineNum + '">' + lineNum + '</span>' +
                       '<span style="display:inline-block;">' + lineContent + '</span>' +
                       '</span>\n';
            }
            sourceDisplay.innerHTML = html;
            
            container.appendChild(sourceDisplay);
            document.body.appendChild(container);
            
            return container;
        }
        
        // Show source view and scroll to line
        function showSourceView(lineNumber, clickY) {
            if (!sourceViewContainer) {
                sourceViewContainer = createSourceViewUI();
            }
            
            sourceViewContainer.style.display = 'block';
            isSourceViewActive = true;
            
            // Scroll to the line
            if (lineNumber) {
                const lineSpan = sourceViewContainer.querySelector('[data-line="' + lineNumber + '"]');
                if (lineSpan) {
                    // Calculate scroll position to align line with click position
                    const lineRect = lineSpan.getBoundingClientRect();
                    const containerRect = sourceViewContainer.getBoundingClientRect();
                    const toolbarHeight = sourceViewContainer.querySelector('div').offsetHeight;
                    
                    // Scroll so the line appears at the same Y position as the click
                    const targetY = clickY || (window.innerHeight / 2);
                    const scrollTop = lineSpan.offsetTop - targetY + toolbarHeight;
                    sourceViewContainer.scrollTop = Math.max(0, scrollTop);
                }
            }
        }
        
        // Expose the showSourceView function globally for section header context menu
        window.markdeepShowSourceView = function() {
            showSourceView(null, null);
        };
        
        // Hide source view
        function hideSourceView() {
            if (sourceViewContainer) {
                sourceViewContainer.style.display = 'none';
            }
            isSourceViewActive = false;
        }
        
        // Create custom context menu matching existing Markdeep style
        const contextMenu = document.createElement('div');
        contextMenu.id = 'markdeep-source-context-menu';
        contextMenu.style.cssText = 'display:none; position:absolute; background:#383838; cursor:default; border:1px solid #999; color:#fff; padding:4px 0px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,"Helvetica Neue",sans-serif; font-size:85%; font-weight:600; border-radius:4px; box-shadow:0px 3px 10px rgba(0,0,0,35%); z-index:999998;';
        
        const menuItem = document.createElement('div');
        menuItem.style.cssText = 'padding:0px 20px; cursor:pointer;';
        menuItem.onmouseover = function() { this.style.background = '#1659d1'; };
        menuItem.onmouseout = function() { this.style.background = 'transparent'; };
        menuItem.onclick = function() {
            contextMenu.style.display = 'none';
            showSourceView(clickedLineNumber, clickedY);
        };
        
        // Update menu item text based on whether we have a line number
        function updateMenuItemText() {
            if (clickedLineNumber) {
                menuItem.textContent = 'View Document Markdeep Source (Line ' + clickedLineNumber + ')';
            } else {
                menuItem.textContent = 'View Document Markdeep Source';
            }
        }
        
        contextMenu.appendChild(menuItem);
        document.body.appendChild(contextMenu);
        
        // Handle context menu on body
        document.addEventListener('contextmenu', function(e) {
            // Skip if source view is active
            if (isSourceViewActive) { return; }
            
            // Allow browser context menu if there's a selection
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) {
                contextMenu.style.display = 'none';
                return;
            }
            
            // Skip if right-clicking on a header element - let the header context menu handle it
            let target = e.target;
            while (target && target !== document.body) {
                if (target.tagName && target.tagName.match(/^H\d$/)) {
                    // This is a header, let the header context menu handle it
                    return;
                }
                target = target.parentElement;
            }
            
            // Find the nearest element with data-src-line
            target = e.target;
            let lineNumber = null;
            while (target && target !== document.body) {
                if (target.hasAttribute && target.hasAttribute('data-src-line')) {
                    lineNumber = parseInt(target.getAttribute('data-src-line'));
                    break;
                }
                target = target.parentElement;
            }
            
            // Show custom context menu
            e.preventDefault();
            clickedLineNumber = lineNumber;
            clickedY = e.clientY;
            updateMenuItemText();
            
            // Position menu so cursor is at the top-left of the first item
            // Account for menu padding (4px top) to align cursor with text
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = (e.pageY - 4) + 'px';
            contextMenu.style.display = 'block';
            
            // Adjust if menu would go off-screen
            setTimeout(function() {
                const rect = contextMenu.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                    contextMenu.style.left = (window.innerWidth - rect.width - 10) + 'px';
                }
                if (rect.bottom > window.innerHeight) {
                    contextMenu.style.top = (window.innerHeight - rect.height - 10) + 'px';
                }
            }, 0);
        });
        
        // Hide context menu on click elsewhere
        document.addEventListener('click', function() {
            contextMenu.style.display = 'none';
        });
        
        // Hide context menu on scroll
        document.addEventListener('scroll', function() {
            contextMenu.style.display = 'none';
        });
    }

    const formatDocument = function (mode) {
        // Detect the noformat argument to the URL
        const noformat = (window.location.href.search(/\?.*noformat.*/i) !== -1);

        switch (mode) {
        case 'script':
            // Nothing to do
            return;

        case 'html':
        case 'doxygen':
            // Process explicit diagram tags by themselves
            toArray(document.querySelectorAll('.diagram, .no-region')).concat(toArray(document.getElementsByTagName('diagram'))).forEach(
                function (element) {
                    let src = unescapeHTMLEntities(element.innerHTML);
                    // Remove the first and last string (which probably
                    // had the pre or diagram tag as part of them) if they are 
                    // empty except for whitespace.
                    src = src.rp(/(:?^[ \t]*\n)|(:?\n[ \t]*)$/g, '');

                    if (mode === 'doxygen') {
                        // Undo Doxygen's &ndash and &mdash, which are impossible to 
                        // detect once the browser has parsed the document
                        src = src.rp(new RegExp('–', 'g'), '--');
                        src = src.rp(new RegExp('—', 'g'), '---');
                        
                        // Undo Doxygen's links within the diagram because they throw off spacing
                        src = src.rp(/<a class="el" .*>(.*)<\/a>/g, '$1');
                    }
                    element.outerHTML = '<center class="md"><div class="scrollable">' +
                        diagramToSVG(removeLeadingSpace(src)) + '</div></center>';
                });

            // Collect all nodes that will receive Markdeep processing
            const markdeepNodeArray = toArray(document.getElementsByClassName('markdeep')).concat(toArray(document.getElementsByTagName('markdeep')));

            // Extract the source code of markeep nodes
            const sourceArray = markdeepNodeArray.map(function (node) {
                return removeLeadingSpace(unescapeHTMLEntities(node.innerHTML));
            });

            // Process insert commands and then trigger markdeep processing
            processInsertCommands(markdeepNodeArray, sourceArray, function (nodeArray, sourceArray) {
                // Process all nodes, replacing them as we progress
                let anyNeedsMathJax = false;
                for (let i = 0; i < markdeepNodeArray.length; ++i) {
                    const oldNode = markdeepNodeArray[i];
                    const newNode = document.createElement('div');
                    const html = markdeepToHTML(sourceArray[i], 'element');
                    anyNeedsMathJax = anyNeedsMathJax || needsMathJax(html);
                    newNode.innerHTML = html;
                    oldNode.parentNode.replaceChild(newNode, oldNode);
                }

                if (anyNeedsMathJax) { loadMathJax(); }

                // Include our stylesheet even if there are no MARKDEEP tags, but do not include the BODY_STYLESHEET.
                document.head.innerHTML = window.markdeep.stylesheet() + document.head.innerHTML + (anyNeedsMathJax ? MATHJAX_CONFIG : '');

                removeFallbackNodes();

            });

            window.alreadyProcessedMarkdeep = true;

            return;
        }
        
        // The following is Morgan's massive hack for allowing browsers to
        // directly parse Markdown from what appears to be a text file, but is
        // actually an intentionally malformed HTML file.
        
        // In order to be able to show what source files look like, the
        // noformat argument may be supplied.
        
        if (! noformat) {
            // Remove any recursive references to this script so that we don't trigger the cost of
            // recursive *loading*. (The alreadyProcessedMarkdeep variable will prevent recursive
            // *execution*.) We allow other scripts to pass through.
            toArray(document.getElementsByTagName('script')).forEach(function(node) {
                if (isMarkdeepScriptName(node.src)) {
                    node.parentNode.removeChild(node);
                }
            });
            
            // Add an event handler for scrolling
            const scrollThreshold = parseInt(option('scrollThreshold'));
            document.addEventListener('scroll', function () {
                const b = document.body, c = b.classList, s = 'scrolled';
                if (b.scrollTop > scrollThreshold) c.add(s); else c.remove(s);
            });
            
            // The browser would apply its saved position to the raw source, so
            // restoreRenderedScroll() restores it after rendering
            history.scrollRestoration = 'manual';

            // Hide the body while formatting
            if (document.body) {
                document.body.style.visibility = 'hidden';
            }
        }

        const source = documentSource();

        if (noformat) {
            // The source begins after <plaintext>, so put the preamble back in front,
            // so that the whole file can be copied as one. Remove the carrier style,
            // which Markdeep adds at load time.
            const preamble = document.head.cloneNode(true);
            const carrierStyle = preamble.querySelector('#markdeepCarrierStyle');

            if (carrierStyle) { carrierStyle.remove(); }

            document.body.innerHTML = entag('pre', escapeHTMLEntities(
                preamble.innerHTML.trim() + '<plaintext>\n' + source));

            return;
        }

        // In the common case of no INSERT commands, source is the original source
        // passed to avoid reparsing.
        const markdeepProcessor = function (source) {
            // Let the theme modify the document before conversion
            if (window.markdeepOptions && window.markdeepOptions.preRenderCallback) {
                window.markdeepOptions.preRenderCallback();
            }

            // Recompute the source text from the current version of the document
            // if it was unmodified
            source = source || documentSource();
            let markdeepHTML = markdeepToHTML(source, 'document');

            // console.log(markdeepHTML); // Final processed source 

            /////////////////////////////////////////////////////////////
            // Add the section header event handlers

            if (option('contextMenu')) {
                const onContextMenu = function (event) {
                    let menu = null;
                    try {
                        // Test for whether the click was on a header or definition term
                        const match = event.target.tagName.match(/^H(\d)$/);
                        const isDT = event.target.tagName === 'DT';
                        if (!match && !isDT) { return; }

                        // The event target is a header or DT...ensure that it is a Markdeep element
                        // (we could be in HTML or Doxygen mode and have non-.md content in the
                        // same document)
                        let node = event.target;
                        while (node) {
                            if (node.classList.contains('md')) { break } else { node = node.parentElement; }
                        }
                        if (! node) {
                            // never found .md
                            return;
                        }
                        
                        // Show the menu
                        menu = document.getElementById('mdContextMenu');
                        if (! menu) { return; }
                        
                        let sectionType, anchorNode, sectionName, sectionLabel, anchor;
                        
                        if (isDT) {
                            // Definition term
                            sectionType = 'Definition';
                            // The anchor is the first child of the DT
                            anchorNode = event.target.firstElementChild;
                            if (!anchorNode || anchorNode.tagName !== 'A') { return; }
                            
                            sectionName = event.target.innerText.trim();
                            sectionLabel = sectionName.toLowerCase();
                            anchor = anchorNode.name;
                        } else {
                            // Header
                            let level = parseInt(match[1]) || 1;
                            
                            // The h1 is the document title
                            if (level === 1) { return; }

                            sectionType = ['Section', 'Subsection'][Math.min(level - 2, 1)];
                            anchorNode = event.target.firstElementChild;
                            if (! anchorNode || (anchorNode.tagName !== 'A')) { return; }

                            sectionName = event.target.innerText.trim();
                            sectionLabel = sectionName.toLowerCase();
                            anchor = anchorNode.name;
                        }
                        const url = '' + location.origin + location.pathname + '#' + anchor;

                        let shortUrl = url;
                        if (shortUrl.length > 17) {
                            shortUrl = url.ss(0, 7) + '…' + location.pathname.ss(location.pathname.length - 8) + '#' + anchor;
                        }

                        // Build each entry as an element with a listener, because the
                        // labels and the copied text contain heading text, which must
                        // never become HTML or an inline handler
                        const shownMenu = menu;
                        /** @param {string} text */
                        function copy(text) {
                            navigator.clipboard.writeText(text);
                            shownMenu.style.visibility = 'hidden';
                        }
                        /** @type {Array<{label: string, action: () => void}>} */
                        const entries = [
                            {label: 'Visit URL “' + shortUrl + '”', action: function () { location.href = url; }},
                            {label: 'Copy URL “' + shortUrl + '”', action: function () { copy(url); }},
                            {label: 'Copy Markdeep “' + sectionName + ' ' + sectionType.toLowerCase() + '”',
                             action: function () { copy(sectionName + ' ' + sectionType.toLowerCase()); }},
                            {label: 'Copy Markdeep “' + sectionType + ' [' + sectionLabel + ']”',
                             action: function () { copy(sectionType + ' [' + sectionLabel + ']'); }},
                            {label: 'Copy HTML “<a href=…>”',
                             action: function () { copy('<a href="' + url + '">' + sectionName + '</a>'); }}];
                        if (DEBUG_VIEW_SOURCE_MENU) {
                            entries.push({label: 'View Document Markdeep Source', action: function () {
                                shownMenu.style.visibility = 'hidden';
                                if (window.markdeepShowSourceView) { window.markdeepShowSourceView(); }
                            }});
                        }

                        menu.replaceChildren();
                        for (const {label, action} of entries) {
                            const entry = document.createElement('div');
                            entry.textContent = label;
                            entry.addEventListener('click', action);
                            menu.appendChild(entry);
                        }
                        menu.style.visibility = 'visible';
                        menu.style.left = event.pageX + 'px';
                        menu.style.top = event.pageY + 'px';
                        
                        event.preventDefault();
                        return false;
                    } catch (e) {
                        // Something went wrong
                        if (menu) { menu.style.visibility = 'hidden'; }
                    }
                }

                markdeepHTML += '<div id="mdContextMenu" style="visibility:hidden"></div>';
            
                document.addEventListener('contextmenu', onContextMenu, false);
                document.addEventListener('mousedown', function (event) {
                    const menu = document.getElementById('mdContextMenu');
                    if (menu) {
                        for (let node = event.target; node; node = node.parentElement) {
                            if (node === menu) { return; }
                        }
                        // Clicked off menu, so close it
                        menu.style.visibility = 'hidden';
                    }
                });
                document.addEventListener('keydown', function (event) {
                    if (event.keyCode === 27) {
                        const menu = document.getElementById('mdContextMenu');
                        if (menu) { menu.style.visibility = 'hidden'; }
                    }
                });
            
            }

            // Close open menus on an outside click or Escape, because <details> toggles
            // itself and ignores dismissal
            function closeMenus(event) {
                toArray(document.querySelectorAll('[data-layout=menu] details[open]')).forEach(function (details) {
                    if (! event || ! details.contains(event.target)) { details.open = false; }
                });
            }
            document.addEventListener('click', closeMenus);
            document.addEventListener('keydown', function (event) {
                if (event.keyCode === 27) { closeMenus(); }
            });
            
            /////////////////////////////////////////////////////////////
            
            const needMathJax = needsMathJax(markdeepHTML);
            if (needMathJax) {
                markdeepHTML = MATHJAX_CONFIG + markdeepHTML; 
            }

            // Replace the document. If using MathJax, include the custom Markdeep definitions
            const longDocument = source.length > 1000;
            
            // Give the phone its own layout width, so that the grids stack; with a fixed
            // layout viewport, a pane and the article share its pixels
            // https://developer.mozilla.org/en-US/docs/Mozilla/Mobile/Viewport_meta_tag
            let META = '<meta charset="UTF-8"><meta http-equiv="content-type" content="text/html;charset=UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
            // Add a base tag if embedded in an <iframe srcdoc=""> inline
            // (not an <iframe src="">).  This allows # links generated by
            // the table of contents to work correctly.
            if (document.location.href === 'about:srcdoc') {
                META += '<base href="about:srcdoc"><base target="_blank">';
            }
            
            let head = META + fontStylesheet() + ROOT_STYLESHEET + BODY_STYLESHEET + STYLESHEET + pageStructureStylesheet() + sectionNumberingStylesheet() + HIGHLIGHT_STYLESHEET + styleStylesheet();
            if (longDocument) {
                head += entag('style', ':root { --title-padding-top: 40px } div.afterTitles { height: 15px; }');
            }

            head += themeStylesheetLinks() + faviconLink();

            // Defer to an author's <title>. head is prepended to document.head below, so
            // a generated <title> would come first in tree order and win.
            const titleText = document.head.querySelector('title') ? '' : documentTitleText;
            if (titleText) { head += entag('title', titleText); }

            if (window.location.href.search(/\?.*export.*/i) !== -1) {
                // Export mode
                let text = head + document.head.innerHTML + markdeepHTML;
                if (needMathJax) {
                    // Dynamically load mathjax
                    text += '<script src="' + MATHJAX_URL +'"></script>';
                }
                document.body.innerHTML = entag('pre', escapeHTMLEntities(text));
            } else {
                document.head.innerHTML = head + document.head.innerHTML;
                document.body.innerHTML = markdeepHTML;

                // Set document.title, because a browser that set the tab title while
                // loading the file keeps it when a <title> is written later
                if (titleText) { document.title = titleText; }

                if (needMathJax) { loadMathJax(); }
                
                removeEmptyParagraphs(document.body);

                // PHASE 1: Convert protected line markers to data-src-line attributes
                attributeSourceLines(document.body);

                // Build anchors, numbers, metadata attributes, section references, and
                // the overview from the rendered headings
                structureSections();

                // PHASE 2: Add source view toggle (skip for included documents)
                const isIncluded = /[?&]id=inc\d+(&|$)/.test(window.location.search);
                if (!isIncluded && DEBUG_VIEW_SOURCE_MENU) {
                    initializeSourceView(source);
                }
            }

            // Change the ID of the body, so that CSS can distinguish Markdeep
            // controlling a whole document from Markdeep embedded within
            // a document in HTML mode.
            document.body.id = 'md';
            // The page structure is the children of <body>, so <body> has the class md
            document.body.classList.add('md');
            removeFallbackNodes();
            document.body.style.visibility = 'visible';

            activateScripts(document.body);

            installLinkPreview();


            // Install after the body renders, because this writes color-scheme on the
            // root element
            installColorSchemeControl();
            installPaneInsetMeasurement();
            installScrollBars();

            // Install after the measurement, which sets the --pane-top that places
            // the reading line
            installReadingPositionMark();

            // A restored position wins over the fragment target
            const restored = restoreRenderedScroll();
            const hashIndex = window.location.href.indexOf('#');
            if ((hashIndex > -1) && ! restored) {
                // Scroll to the target; needed when loading is too fast (ironically)
                setTimeout(function () {
                    const anchor = document.getElementsByName(window.location.href.substring(hashIndex + 1));
                    if (anchor.length > 0) { anchor[0].scrollIntoView(); }
                    if (window.markdeepOptions) (window.markdeepOptions.postRenderCallback || Math.cos)();
                }, 100);
            } else if (window.markdeepOptions && window.markdeepOptions.postRenderCallback) {
                // Wait for the DOM to update
                setTimeout(window.markdeepOptions.postRenderCallback, 100);
            }
            
        };
        
        // Process insert commands, and then run the markdeepProcessor on the document
        processInsertCommands([document.body], [source], function (nodeArray, sourceArray) {
            markdeepProcessor(sourceArray && sourceArray[0]);
        });
    };

    /** Return the anchor name of a nested header: the mangled titles of the header
        and its ancestors joined with '/', so that headers with the same title get
        distinct anchors.
        @param {Array<string>} headerArray Header titles, outermost first
        @returns {string} Such as 'introduction/forms_of_being/addendum' */
    function headerAnchor(headerArray) {
        if (!Array.isArray(headerArray) || headerArray.length === 0) {
            return '';
        }
        
        const processedHeaders = [];
        let parentNumbered = false;
        for (let i = 0; i < headerArray.length; ++i) {
            const titleOnly = splitHeaderTitle(headerArray[i]).title;
            const stripped = stripSectionNumber(plainTitleText(titleOnly), parentNumbered);
            parentNumbered = stripped.numbered;
            processedHeaders.push(mangle(stripped.title));
        }

        return processedHeaders.join('/');
    }

    /** Return the anchor name of a definition term under its headers. An API term
        uses code-sensitive mangling.
        @param {Array<string>} headerArray Header titles, outermost first; may be empty
        @param {string} term The definition term
        @returns {string} Such as 'introduction/section/def-functionname-fcn' */
    function definitionAnchor(headerArray, term) {
        if (typeof term !== 'string' || term.length === 0) {
            return '';
        }

        // The term is plain text, so `<` is a character and a code span is the only
        // markup
        const mangledTerm = mangleCode(term.rp(/(`+)(.+?)\1/g, '$2').trim());

        if (!Array.isArray(headerArray) || headerArray.length === 0) {
            return 'def-' + mangledTerm;
        }

        return headerAnchor(headerArray) + '/def-' + mangledTerm;
    }

    // HTML void elements have no closing tag. Container elements are closed when
    // they are open at the cut. Every valid tag is kept whole.
    const TRUNCATE_HTML_VOID = {
        area:1, base:1, br:1, col:1, embed:1, hr:1, img:1, input:1,
        link:1, meta:1, param:1, source:1, track:1, wbr:1
    };
    const TRUNCATE_HTML_CONTAINER = {
        a:1, abbr:1, b:1, big:1, cite:1, code:1, del:1, div:1, em:1, i:1, ins:1,
        kbd:1, mark:1, pre:1, q:1, s:1, samp:1, small:1, span:1, strong:1, sub:1,
        sup:1, tt:1, u:1, 'var':1
    };
    const TRUNCATE_TOGGLE_DELIMS = ['**', '__', '*', '_'];   // try longest first
    // Sticky (/y), so that exec() matches only at lastIndex, as Python's re.match(text, i) does
    const TRUNCATE_LINK_ATOM    = /!?\[(?:[^\[\]\\]|\\[\[\]])*?\]\(("?)(?:(?<=")[^"<>\s]+|[^<>\s"\)]+)\1(?:\s[^)]{0,200})?\)/y;
    const TRUNCATE_HTML_COMMENT = /<!--[\s\S]*?-->/y;
    const TRUNCATE_HTML_TAG     = /<\/?([A-Za-z][A-Za-z0-9]*)[^>]*?(\/?)>/y;

    /** Truncate text to at most maxWidth characters without splitting Markdeep
        inline markup or HTML tags. Track the open inline constructs (inline code,
        emphasis, strong, stage directions, and HTML container tags), and keep each
        link, image, HTML tag, and HTML comment whole. Return the longest prefix
        whose kept text, closers for the open constructs, and suffix fit in
        maxWidth; drop a whole unit that overflows. The input has balanced,
        nested delimiters.
        @param {string} text Text to truncate
        @param {number} maxWidth Maximum length of the result
        @param {string} suffix Appended when truncated; "…" when undefined
        @returns {string} Truncated text with all markup closed */
    function truncateMarkdown(text, maxWidth, suffix) {
        if (suffix === undefined) { suffix = "…"; }
        if (text.length <= maxWidth) { return text; }

        // Clean cut points as [keptEnd, stack snapshot]. Record a cut after content
        // and never right after an opener, so that every closed span has content.
        const candidates = [[0, []]];
        const stack = [];
        let i = 0;
        const n = text.length;
        while (i < n) {
            const ch = text.charAt(i);

            // Inside code, an unescaped closing backtick is the only special character
            if (stack.length && stack[stack.length - 1] === '`') {
                if (ch === '`' && text.charAt(i - 1) !== '\\') {
                    stack.pop();
                }
                i += 1;
                candidates.push([i, stack.slice()]);
                continue;
            }

            // Keep a whole link or image
            if (ch === '!' || ch === '[') {
                TRUNCATE_LINK_ATOM.lastIndex = i;
                if (TRUNCATE_LINK_ATOM.exec(text)) {
                    i = TRUNCATE_LINK_ATOM.lastIndex;
                    candidates.push([i, stack.slice()]);
                    continue;
                }
            }

            // Keep an HTML comment or tag whole, and close container tags
            if (ch === '<') {
                TRUNCATE_HTML_COMMENT.lastIndex = i;
                if (TRUNCATE_HTML_COMMENT.exec(text)) {
                    i = TRUNCATE_HTML_COMMENT.lastIndex;
                    candidates.push([i, stack.slice()]);
                    continue;
                }
                TRUNCATE_HTML_TAG.lastIndex = i;
                const tag = TRUNCATE_HTML_TAG.exec(text);
                if (tag) {
                    const name = tag[1].toLowerCase();
                    const isClose = tag[0].charAt(1) === '/';
                    const isSelfClose = tag[2] === '/';
                    i = TRUNCATE_HTML_TAG.lastIndex;
                    if (isClose) {
                        if (stack.length && stack[stack.length - 1] === '</' + name + '>') {
                            stack.pop();
                        }
                        candidates.push([i, stack.slice()]);
                    } else if (TRUNCATE_HTML_CONTAINER[name] && !isSelfClose) {
                        // Skip the cut right after an opener, as for the delimiters
                        stack.push('</' + name + '>');
                    } else {
                        // A void, self-closing, or unknown tag is one unit with no closer
                        candidates.push([i, stack.slice()]);
                    }
                    continue;
                }
                // Treat a lone '<' as text
            }

            // Open code.
            if (ch === '`' && (i === 0 || text.charAt(i - 1) !== '\\')) {
                stack.push('`');
                i += 1;
                continue;
            }

            // Stage directions.
            if (text.substring(i, i + 2) === '((') {
                stack.push('))');
                i += 2;
                continue;
            }
            if (text.substring(i, i + 2) === '))' && stack.length && stack[stack.length - 1] === '))') {
                stack.pop();
                i += 2;
                candidates.push([i, stack.slice()]);
                continue;
            }

            // Strong and emphasis, longest delimiter first. Open only when the content
            // starts with a character other than whitespace or the delimiter, as in
            // Markdeep's flanking rule, so that "2 * 3" stays text.
            let delim = null;
            for (let d = 0; d < TRUNCATE_TOGGLE_DELIMS.length; d++) {
                const candidate = TRUNCATE_TOGGLE_DELIMS[d];
                if (text.substring(i, i + candidate.length) === candidate) {
                    delim = candidate;
                    break;
                }
            }
            if (delim) {
                const j = i + delim.length;
                if (stack.length && stack[stack.length - 1] === delim) {
                    stack.pop();
                    i = j;
                    candidates.push([i, stack.slice()]);
                    continue;
                }
                const afterChar = text.charAt(j);
                if ((j < n) && (afterChar !== ' ') && (afterChar !== '\t') &&
                    (afterChar !== '\n') && (afterChar !== delim.charAt(0))) {
                    stack.push(delim);
                    i = j;
                    continue;
                }
                // Treat an invalid delimiter as text
            }

            // A plain character
            i += 1;
            candidates.push([i, stack.slice()]);
        }

        // Pick the longest prefix whose closed, suffixed form fits maxWidth
        let best = suffix.substring(0, maxWidth);
        let bestEnd = -1;
        for (let c = 0; c < candidates.length; c++) {
            const end = candidates[c][0];
            const snap = candidates[c][1];
            let kept = text.substring(0, end).replace(/\s+$/, '');
            // Markdeep leaves a code span open when its content ends in ` or \, so trim them
            if (snap.length && snap[snap.length - 1] === '`') {
                kept = kept.replace(/[\\`]+$/, '');
            }
            let closers = '';
            for (let k = snap.length - 1; k >= 0; k--) {
                closers += snap[k];
            }
            const out = kept + closers + suffix;
            if ((out.length <= maxWidth) && (end > bestEnd)) {
                best = out;
                bestEnd = end;
            }
        }
        return best;
    }

    /** Return a Markdown table for rows of data. A header cell may be an object
        {value, maxWidth, minWidth, halign}; max_width and min_width also work.
        @param {Array<Array<*>>} rows Rows; the first row is the header
        @param {string} caption Markdeep caption line; "" when falsy
        @param {boolean} outerBorder Put | at both ends of each row; false when falsy
        @param {boolean} padding Pad cells to an ASCII grid; true when undefined
        @param {string} truncateSuffix Suffix of truncated cells; "…" when falsy
        @returns {string} The table */
    function generateMarkdownTable(rows, caption, outerBorder, padding, truncateSuffix) {
        caption = caption || "";
        outerBorder = outerBorder || false;
        padding = (padding === undefined) ? true : padding;
        truncateSuffix = truncateSuffix || "…";
        
        if (!rows || rows.length === 0) {
            throw new Error("rows cannot be empty");
        }
        
        // Read the column specs from the header row
        const headerRow = rows[0];
        const colSpecs = [];
        for (let i = 0; i < headerRow.length; i++) {
            const cell = headerRow[i];
            if (cell === null || cell === undefined) {
                throw new Error("null/undefined values not allowed (clean data before calling)");
            }
            if (typeof cell === 'object' && !Array.isArray(cell)) {
                colSpecs.push({
                    value: String(cell.value || ""),
                    maxWidth: cell.max_width || cell.maxWidth || null,
                    minWidth: cell.min_width || cell.minWidth || 0,
                    halign: cell.halign || null
                });
            } else {
                colSpecs.push({
                    value: String(cell),
                    maxWidth: null,
                    minWidth: 0,
                    halign: null
                });
            }
        }
        
        const numCols = colSpecs.length;
        
        // Convert every cell to a string, validate it, and truncate it
        const processedRows = [];
        for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
            const row = rows[rowIdx];
            if (row.length > numCols) {
                throw new Error("Row " + rowIdx + " has " + row.length + " cols, but header has " + numCols);
            }
            
            const processedRow = [];
            let rowHasBr = false;
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
                const cellVal = row[colIdx];
                if (cellVal === null || cellVal === undefined) {
                    throw new Error("null/undefined values not allowed (clean data before calling)");
                }
                
                let cellStr;
                if (rowIdx === 0) {
                    cellStr = colSpecs[colIdx].value;
                } else if (typeof cellVal === 'object' && !Array.isArray(cellVal)) {
                    cellStr = String(cellVal.value || "");
                } else {
                    cellStr = String(cellVal);
                }
                
                // Convert newlines to <br>
                if (cellStr.indexOf('\n') !== -1) {
                    cellStr = cellStr.replace(/\n/g, '<br>');
                }
                
                if (cellStr.indexOf('<br>') !== -1) {
                    rowHasBr = true;
                }
                
                // Truncate to maxWidth without splitting inline markup
                if (colIdx < colSpecs.length) {
                    const maxW = colSpecs[colIdx].maxWidth;
                    if (maxW !== null) {
                        cellStr = truncateMarkdown(cellStr, maxW, truncateSuffix);
                    }
                }
                
                processedRow.push(cellStr);
            }
            
            // Pad row to numCols if fewer
            while (processedRow.length < numCols) {
                processedRow.push("");
            }
            
            processedRows.push({cells: processedRow, hasBr: rowHasBr});
        }
        
        // Calculate column widths for padding
        const colWidths = [];
        for (let c = 0; c < colSpecs.length; c++) {
            colWidths.push(colSpecs[c].minWidth);
        }
        if (padding) {
            for (let r = 0; r < processedRows.length; r++) {
                if (!processedRows[r].hasBr) {
                    for (let c = 0; c < processedRows[r].cells.length; c++) {
                        colWidths[c] = Math.max(colWidths[c], processedRows[r].cells[c].length);
                    }
                }
            }
        }
        
        // Pad a cell to width, aligned by halign
        function padCell(text, width, halign) {
            if (text.length >= width) return text;
            const paddingNeeded = width - text.length;
            if (halign === "left") {
                return text + " ".repeat(paddingNeeded);
            } else if (halign === "right") {
                return " ".repeat(paddingNeeded) + text;
            } else if (halign === "center") {
                const leftPad = Math.floor(paddingNeeded / 2);
                const rightPad = paddingNeeded - leftPad;
                return " ".repeat(leftPad) + text + " ".repeat(rightPad);
            }
            return text + " ".repeat(paddingNeeded);
        }
        
        const lines = [];
        
        // Header row
        const headerCells = [];
        for (let c = 0; c < numCols; c++) {
            let cell = processedRows[0].cells[c];
            if (padding) {
                cell = padCell(cell, colWidths[c], colSpecs[c].halign);
            }
            headerCells.push(cell);
        }
        let headerLine = headerCells.join(" | ").trimEnd();
        if (outerBorder) {
            headerLine = "| " + headerLine + " |";
        }
        lines.push(headerLine);
        
        // Separator row. Header and data rows join cells with " | " and the separator
        // joins them with "|", so widen each separator cell by its missing spaces.
        const sepCells = [];
        const numSepCols = colSpecs.length;
        for (let c = 0; c < numSepCols; c++) {
            const baseWidth = padding ? colWidths[c] : 3;
            let width;
            if (numSepCols === 1) {
                width = baseWidth;  // One column has no joiner
            } else if (c === 0) {
                width = baseWidth + 1;  // First column: its trailing space
            } else if (c === numSepCols - 1) {
                width = baseWidth + 1;  // Last column: its leading space
            } else {
                width = baseWidth + 2;  // Middle column: both spaces
            }
            
            const halign = colSpecs[c].halign;
            let sep;
            if (halign === "left") {
                sep = ":" + "-".repeat(width > 1 ? width - 1 : 1);
            } else if (halign === "right") {
                sep = "-".repeat(width > 1 ? width - 1 : 1) + ":";
            } else if (halign === "center") {
                sep = width > 2 ? ":" + "-".repeat(width - 2) + ":" : ":-:";
            } else {
                sep = "-".repeat(width);
            }
            sepCells.push(sep);
        }
        // Join with "|", because the cell widths include the spaces
        let sepLine = sepCells.join("|").trimEnd();
        if (outerBorder) {
            sepLine = "|" + sepLine + "|";
        }
        lines.push(sepLine);
        
        // Data rows
        for (let r = 1; r < processedRows.length; r++) {
            const rowCells = [];
            for (let c = 0; c < processedRows[r].cells.length; c++) {
                let cell = processedRows[r].cells[c];
                if (padding && !processedRows[r].hasBr) {
                    cell = padCell(cell, colWidths[c], colSpecs[c].halign);
                }
                rowCells.push(cell);
            }
            let rowLine = rowCells.join(" | ").trimEnd();
            if (outerBorder) {
                rowLine = "| " + rowLine + " |";
            }
            lines.push(rowLine);
        }
        
        let result = lines.join("\n");
        
        if (caption) {
            result += "\n" + caption;
        }

        return result;
    }


    /** Return the table with the given label in Markdeep source: the inverse of
        generateMarkdownTable for `[Table [label]: caption]`. The caption is on the
        line just below the table, as replaceTables() and TABLE_REGEXP require.
        @param {string} source Markdeep source text
        @param {string} label The label in the inner brackets of `[Table [label]: ...]`
        @returns {{caption:string, id:string, headerRow:string[],
                   alignRow:string[], data:string[][], lineStart:number,
                   lineLength:number, charStart:number, charLength:number}}
        @throws Error when the label is missing or repeated, the label is beside no
                parseable table, or the table is malformed */
    function extractTable(source, label) {
        const separatorCellRe = /^[ \t]*:?-+:?[ \t]*$/;

        // Keep \| escaped in the returned cells, so that the extract, edit, and
        // generateMarkdownTable round trip is lossless
        function splitRow(rowText) {
            const parts = splitTableRow(rowText);
            for (let i = 0; i < parts.length; ++i) {
                parts[i] = parts[i].replace(/^\s+|\s+$/g, '');
            }
            return parts;
        }

        function isSeparatorRow(rowText) {
            const cells = splitRow(rowText);
            if (cells.length === 0) { return false; }
            for (let i = 0; i < cells.length; ++i) {
                if (!separatorCellRe.test(cells[i])) { return false; }
            }
            return true;
        }

        function alignmentMarker(cellText) {
            const t = cellText.replace(/^\s+|\s+$/g, '');
            const left = t.charAt(0) === ':';
            const right = t.charAt(t.length - 1) === ':';
            if (left && right) { return 'C'; }
            if (right) { return 'R'; }
            if (left) { return 'L'; }
            return 'X';
        }

        const captionRe = /^[ \t]*\[Table[ \t]+\[([^\]\n]+)\][ \t]*:([^\]\n]*)\][ \t]*$/gm;
        const matches = [];
        let m;
        while ((m = captionRe.exec(source)) !== null) {
            if (m[1].replace(/^\s+|\s+$/g, '') === label) {
                matches.push({ start: m.index, end: m.index + m[0].length });
            }
        }
        if (matches.length === 0) {
            throw new Error("Table label not found: [" + label + "]");
        }
        if (matches.length > 1) {
            throw new Error("Table label appears more than once: [" + label + "]");
        }
        const match = matches[0];

        let captionText = source.substring(match.start, match.end).replace(/^\s+|\s+$/g, '');
        if (captionText.charAt(0) === '[') { captionText = captionText.substring(1); }
        if (captionText.charAt(captionText.length - 1) === ']') {
            captionText = captionText.substring(0, captionText.length - 1);
        }
        captionText = captionText.replace(/^\s+|\s+$/g, '');

        const lines = source.split('\n');
        const lineOffsets = [0];
        for (let li = 0; li < lines.length - 1; ++li) {
            lineOffsets.push(lineOffsets[lineOffsets.length - 1] + lines[li].length + 1);
        }

        let captionLineIdx = 0;
        for (let ci = 0; ci < match.start; ++ci) {
            if (source.charAt(ci) === '\n') { ++captionLineIdx; }
        }

        let separatorIdx = -1;
        for (let idx = captionLineIdx - 1; idx >= 0; --idx) {
            const line = lines[idx];
            if (line.replace(/^\s+|\s+$/g, '').length === 0) { break; }
            if (isSeparatorRow(line)) { separatorIdx = idx; break; }
        }
        if (separatorIdx <= 0) {
            throw new Error("Label [" + label + "] is not adjacent to a parseable table");
        }

        const headerIdx = separatorIdx - 1;
        const headerLine = lines[headerIdx];
        if (headerLine.replace(/^\s+|\s+$/g, '').length === 0 || headerLine.indexOf('|') === -1) {
            throw new Error("Label [" + label + "] is not adjacent to a parseable table " +
                            "(no header row above separator)");
        }

        const headerRow = splitRow(headerLine);
        const sepCells = splitRow(lines[separatorIdx]);
        if (sepCells.length !== headerRow.length) {
            throw new Error("Table [" + label + "] header has " + headerRow.length +
                            " cells but alignment row has " + sepCells.length);
        }
        const alignRow = [];
        for (let ai = 0; ai < sepCells.length; ++ai) {
            alignRow.push(alignmentMarker(sepCells[ai]));
        }

        const data = [];
        for (let di = separatorIdx + 1; di < captionLineIdx; ++di) {
            const dline = lines[di];
            if (dline.replace(/^\s+|\s+$/g, '').length === 0) { break; }
            const cells = splitRow(dline);
            if (cells.length > headerRow.length) {
                throw new Error("Table [" + label + "] data row " +
                                (di - separatorIdx) + " has " + cells.length +
                                " cells but header has " + headerRow.length);
            }
            while (cells.length < headerRow.length) { cells.push(''); }
            data.push(cells);
        }

        const lineStart = headerIdx;
        const lineLength = captionLineIdx - headerIdx + 1;
        const charStart = lineOffsets[headerIdx];
        const captionLineEnd = lineOffsets[captionLineIdx] + lines[captionLineIdx].length;
        const charLength = captionLineEnd - charStart;

        return {
            caption:     captionText,
            id:          label,
            headerRow:   headerRow,
            alignRow:    alignRow,
            data:        data,
            lineStart:   lineStart,
            lineLength:  lineLength,
            charStart:   charStart,
            charLength:  charLength
        };
    }


    // Export relevant methods
    const api = Object.freeze({
        format:               markdeepToHTML,
        formatDiagram:        diagramToSVG,
        diagramToText:        diagramToText,
        looksLikeDiagram:     looksLikeDiagram,
        formatDocument:       formatDocument,
        headerAnchor:         headerAnchor,
        definitionAnchor:     definitionAnchor,
        generateMarkdownTable: generateMarkdownTable,
        truncateMarkdown:     truncateMarkdown,
        extractTable:         extractTable,
        parseTable:           parseTable,
        rebuildTableOfContents: rebuildTableOfContents,
        langTable:            LANG_TABLE,
        stylesheet:           function() {
            return fontStylesheet() + ROOT_STYLESHEET + STYLESHEET + sectionNumberingStylesheet() + HIGHLIGHT_STYLESHEET + styleStylesheet();
        }
    });

    // Return the API under Node.js, and publish it as window.markdeep in a browser
    if (! IN_BROWSER) {
        return api;
    }
    window.markdeep = api;

    // Wait for DOMContentLoaded, because the renderer may run from the preamble
    // before the body parses, and source reconstruction and insert processing
    // need the whole document. In script mode the processor has no effect.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { formatDocument(option('mode')); });
    } else {
        formatDocument(option('mode'));
    }
} // formatDocument

return undefined;
})();

/*
  The following contains regexps with character groups that do not escape
  '['. For example, /[a-z[\]]/. That is technically legal in most
  situations but confuses syntax highlighting of this source 
  itself in emacs and sometimes also fails at runtime.
*/
/* BEGIN highlight.js */
/*!
  Highlight.js v11.11.1 (git: 62f8a60a30)
  (c) 2006-2026 Josh Goebel <hello@joshgoebel.com> and other contributors
  License: BSD-3-Clause
 */
var hljs=function(){"use strict";function e(n){
return n instanceof Map?n.clear=n.delete=n.set=()=>{
throw Error("map is read-only")}:n instanceof Set&&(n.add=n.clear=n.delete=()=>{
throw Error("set is read-only")
}),Object.freeze(n),Object.getOwnPropertyNames(n).forEach((t=>{
const a=n[t],r=typeof a;"object"!==r&&"function"!==r||Object.isFrozen(a)||e(a)
})),n}class n{constructor(e){
void 0===e.data&&(e.data={}),this.data=e.data,this.isMatchIgnored=!1}
ignoreMatch(){this.isMatchIgnored=!0}}function t(e){
return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")
}function a(e,...n){const t=Object.create(null);for(const n in e)t[n]=e[n]
;return n.forEach((e=>{for(const n in e)t[n]=e[n]})),t}const r=e=>!!e.scope
;class i{constructor(e,n){
this.buffer="",this.classPrefix=n.classPrefix,e.walk(this)}addText(e){
this.buffer+=t(e)}openNode(e){if(!r(e))return;const n=((e,{prefix:n})=>{
if(e.startsWith("language:"))return e.replace("language:","language-")
;if(e.includes(".")){const t=e.split(".")
;return[`${n}${t.shift()}`,...t.map(((e,n)=>`${e}${"_".repeat(n+1)}`))].join(" ")
}return`${n}${e}`})(e.scope,{prefix:this.classPrefix});this.span(n)}
closeNode(e){r(e)&&(this.buffer+="</span>")}value(){return this.buffer}span(e){
this.buffer+=`<span class="${e}">`}}const s=(e={})=>{const n={children:[]}
;return Object.assign(n,e),n};class o{constructor(){
this.rootNode=s(),this.stack=[this.rootNode]}get top(){
return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(e){
this.top.children.push(e)}openNode(e){const n=s({scope:e})
;this.add(n),this.stack.push(n)}closeNode(){
if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){
for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}
walk(e){return this.constructor._walk(e,this.rootNode)}static _walk(e,n){
return"string"==typeof n?e.addText(n):n.children&&(e.openNode(n),
n.children.forEach((n=>this._walk(e,n))),e.closeNode(n)),e}static _collapse(e){
"string"!=typeof e&&e.children&&(e.children.every((e=>"string"==typeof e))?e.children=[e.children.join("")]:e.children.forEach((e=>{
o._collapse(e)})))}}class l extends o{constructor(e){super(),this.options=e}
addText(e){""!==e&&this.add(e)}startScope(e){this.openNode(e)}endScope(){
this.closeNode()}__addSublanguage(e,n){const t=e.root
;n&&(t.scope="language:"+n),this.add(t)}toHTML(){
return new i(this,this.options).value()}finalize(){
return this.closeAllNodes(),!0}}function c(e){
return e?"string"==typeof e?e:e.source:null}function d(e){return u("(?=",e,")")}
function g(e){return u("(?:",e,")*")}function m(e){return u("(?:",e,")?")}
function u(...e){return e.map((e=>c(e))).join("")}function _(...e){const n=(e=>{
const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(e);return"("+(n.capture?"":"?:")+e.map((e=>c(e))).join("|")+")"}
function p(e){return RegExp(e.toString()+"|").exec("").length-1}
const b=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./
;function f(e,{joinWith:n}){let t=0;return e.map((e=>{t+=1;const n=t
;let a=c(e),r="";for(;a.length>0;){const e=b.exec(a);if(!e){r+=a;break}
r+=a.substring(0,e.index),
a=a.substring(e.index+e[0].length),"\\"===e[0][0]&&e[1]?r+="\\"+(Number(e[1])+n):(r+=e[0],
"("===e[0]&&t++)}return r})).map((e=>`(${e})`)).join(n)}
const h="[a-zA-Z]\\w*",E="[a-zA-Z_]\\w*",x="\\b\\d+(\\.\\d+)?",y="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",v="\\b(0b[01]+)",w={
begin:"\\\\[\\s\\S]",relevance:0},N={scope:"string",begin:"'",end:"'",
illegal:"\\n",contains:[w]},M={scope:"string",begin:'"',end:'"',illegal:"\\n",
contains:[w]},A=(e,n,t={})=>{const r=a({scope:"comment",begin:e,end:n,
contains:[]},t);r.contains.push({scope:"doctag",
begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0})
;const i=_("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/)
;return r.contains.push({begin:u(/[ ]+/,"(",i,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),r
},k=A("//","$"),C=A("/\\*","\\*/"),S=A("#","$");var O=Object.freeze({
__proto__:null,APOS_STRING_MODE:N,BACKSLASH_ESCAPE:w,BINARY_NUMBER_MODE:{
scope:"number",begin:v,relevance:0},BINARY_NUMBER_RE:v,COMMENT:A,
C_BLOCK_COMMENT_MODE:C,C_LINE_COMMENT_MODE:k,C_NUMBER_MODE:{scope:"number",
begin:y,relevance:0},C_NUMBER_RE:y,END_SAME_AS_BEGIN:e=>Object.assign(e,{
"on:begin":(e,n)=>{n.data._beginMatch=e[1]},"on:end":(e,n)=>{
n.data._beginMatch!==e[1]&&n.ignoreMatch()}}),HASH_COMMENT_MODE:S,IDENT_RE:h,
MATCH_NOTHING_RE:/\b\B/,METHOD_GUARD:{begin:"\\.\\s*"+E,relevance:0},
NUMBER_MODE:{scope:"number",begin:x,relevance:0},NUMBER_RE:x,
PHRASAL_WORDS_MODE:{
begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
},QUOTE_STRING_MODE:M,REGEXP_MODE:{scope:"regexp",begin:/\/(?=[^/\n]*\/)/,
end:/\/[gimuy]*/,contains:[w,{begin:/\[/,end:/\]/,relevance:0,contains:[w]}]},
RE_STARTERS_RE:"!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",
SHEBANG:(e={})=>{const n=/^#![ ]*\//
;return e.binary&&(e.begin=u(n,/.*\b/,e.binary,/\b.*/)),a({scope:"meta",begin:n,
end:/$/,relevance:0,"on:begin":(e,n)=>{0!==e.index&&n.ignoreMatch()}},e)},
TITLE_MODE:{scope:"title",begin:h,relevance:0},UNDERSCORE_IDENT_RE:E,
UNDERSCORE_TITLE_MODE:{scope:"title",begin:E,relevance:0}});function T(e,n){
"."===e.input[e.index-1]&&n.ignoreMatch()}function D(e,n){
void 0!==e.className&&(e.scope=e.className,delete e.className)}function I(e,n){
n&&e.beginKeywords&&(e.begin="\\b("+e.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",
e.__beforeBegin=T,e.keywords=e.keywords||e.beginKeywords,delete e.beginKeywords,
void 0===e.relevance&&(e.relevance=0))}function R(e,n){
Array.isArray(e.illegal)&&(e.illegal=_(...e.illegal))}function L(e,n){
if(e.match){
if(e.begin||e.end)throw Error("begin & end are not supported with match")
;e.begin=e.match,delete e.match}}function B(e,n){
void 0===e.relevance&&(e.relevance=1)}const F=(e,n)=>{if(!e.beforeMatch)return
;if(e.starts)throw Error("beforeMatch cannot be used with starts")
;const t=Object.assign({},e);Object.keys(e).forEach((n=>{delete e[n]
})),e.keywords=t.keywords,e.begin=u(t.beforeMatch,d(t.begin)),e.starts={
relevance:0,contains:[Object.assign(t,{endsParent:!0})]
},e.relevance=0,delete t.beforeMatch
},P=["of","and","for","in","not","or","if","then","parent","list","value"]
;function z(e,n,t="keyword"){const a=Object.create(null)
;return"string"==typeof e?r(t,e.split(" ")):Array.isArray(e)?r(t,e):Object.keys(e).forEach((t=>{
Object.assign(a,z(e[t],n,t))})),a;function r(e,t){
n&&(t=t.map((e=>e.toLowerCase()))),t.forEach((n=>{const t=n.split("|")
;a[t[0]]=[e,U(t[0],t[1])]}))}}function U(e,n){
return n?Number(n):(e=>P.includes(e.toLowerCase()))(e)?0:1}const $={},j=e=>{
console.error(e)},q=(e,...n)=>{console.log("WARN: "+e,...n)},G=(e,n)=>{
$[`${e}/${n}`]||(console.log(`Deprecated as of ${e}. ${n}`),$[`${e}/${n}`]=!0)
},Z=Error();function K(e,n,{key:t}){let a=0;const r=e[t],i={},s={}
;for(let e=1;e<=n.length;e++)s[e+a]=r[e],i[e+a]=!0,a+=p(n[e-1])
;e[t]=s,e[t]._emit=i,e[t]._multi=!0}function H(e){(e=>{
e.scope&&"object"==typeof e.scope&&null!==e.scope&&(e.beginScope=e.scope,
delete e.scope)})(e),"string"==typeof e.beginScope&&(e.beginScope={
_wrap:e.beginScope}),"string"==typeof e.endScope&&(e.endScope={_wrap:e.endScope
}),(e=>{if(Array.isArray(e.begin)){
if(e.skip||e.excludeBegin||e.returnBegin)throw j("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),
Z
;if("object"!=typeof e.beginScope||null===e.beginScope)throw j("beginScope must be object"),
Z;K(e,e.begin,{key:"beginScope"}),e.begin=f(e.begin,{joinWith:""})}})(e),(e=>{
if(Array.isArray(e.end)){
if(e.skip||e.excludeEnd||e.returnEnd)throw j("skip, excludeEnd, returnEnd not compatible with endScope: {}"),
Z
;if("object"!=typeof e.endScope||null===e.endScope)throw j("endScope must be object"),
Z;K(e,e.end,{key:"endScope"}),e.end=f(e.end,{joinWith:""})}})(e)}function X(e){
function n(n,t){
return RegExp(c(n),"m"+(e.case_insensitive?"i":"")+(e.unicodeRegex?"u":"")+(t?"g":""))
}class t{constructor(){
this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}
addRule(e,n){
n.position=this.position++,this.matchIndexes[this.matchAt]=n,this.regexes.push([n,e]),
this.matchAt+=p(e)+1}compile(){0===this.regexes.length&&(this.exec=()=>null)
;const e=this.regexes.map((e=>e[1]));this.matcherRe=n(f(e,{joinWith:"|"
}),!0),this.lastIndex=0}exec(e){this.matcherRe.lastIndex=this.lastIndex
;const n=this.matcherRe.exec(e);if(!n)return null
;const t=n.findIndex(((e,n)=>n>0&&void 0!==e)),a=this.matchIndexes[t]
;return n.splice(0,t),Object.assign(n,a)}}class r{constructor(){
this.rules=[],this.multiRegexes=[],
this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(e){
if(this.multiRegexes[e])return this.multiRegexes[e];const n=new t
;return this.rules.slice(e).forEach((([e,t])=>n.addRule(e,t))),
n.compile(),this.multiRegexes[e]=n,n}resumingScanAtSamePosition(){
return 0!==this.regexIndex}considerAll(){this.regexIndex=0}addRule(e,n){
this.rules.push([e,n]),"begin"===n.type&&this.count++}exec(e){
const n=this.getMatcher(this.regexIndex);n.lastIndex=this.lastIndex
;let t=n.exec(e)
;if(this.resumingScanAtSamePosition())if(t&&t.index===this.lastIndex);else{
const n=this.getMatcher(0);n.lastIndex=this.lastIndex+1,t=n.exec(e)}
return t&&(this.regexIndex+=t.position+1,
this.regexIndex===this.count&&this.considerAll()),t}}
if(e.compilerExtensions||(e.compilerExtensions=[]),
e.contains&&e.contains.includes("self"))throw Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.")
;return e.classNameAliases=a(e.classNameAliases||{}),function t(i,s){const o=i
;if(i.isCompiled)return o
;[D,L,H,F].forEach((e=>e(i,s))),e.compilerExtensions.forEach((e=>e(i,s))),
i.__beforeBegin=null,[I,R,B].forEach((e=>e(i,s))),i.isCompiled=!0;let l=null
;return"object"==typeof i.keywords&&i.keywords.$pattern&&(i.keywords=Object.assign({},i.keywords),
l=i.keywords.$pattern,
delete i.keywords.$pattern),l=l||/\w+/,i.keywords&&(i.keywords=z(i.keywords,e.case_insensitive)),
o.keywordPatternRe=n(l,!0),
s&&(i.begin||(i.begin=/\B|\b/),o.beginRe=n(o.begin),i.end||i.endsWithParent||(i.end=/\B|\b/),
i.end&&(o.endRe=n(o.end)),
o.terminatorEnd=c(o.end)||"",i.endsWithParent&&s.terminatorEnd&&(o.terminatorEnd+=(i.end?"|":"")+s.terminatorEnd)),
i.illegal&&(o.illegalRe=n(i.illegal)),
i.contains||(i.contains=[]),i.contains=[].concat(...i.contains.map((e=>(e=>(e.variants&&!e.cachedVariants&&(e.cachedVariants=e.variants.map((n=>a(e,{
variants:null},n)))),e.cachedVariants?e.cachedVariants:V(e)?a(e,{
starts:e.starts?a(e.starts):null
}):Object.isFrozen(e)?a(e):e))("self"===e?i:e)))),i.contains.forEach((e=>{t(e,o)
})),i.starts&&t(i.starts,s),o.matcher=(e=>{const n=new r
;return e.contains.forEach((e=>n.addRule(e.begin,{rule:e,type:"begin"
}))),e.terminatorEnd&&n.addRule(e.terminatorEnd,{type:"end"
}),e.illegal&&n.addRule(e.illegal,{type:"illegal"}),n})(o),o}(e)}function V(e){
return!!e&&(e.endsWithParent||V(e.starts))}class W extends Error{
constructor(e,n){super(e),this.name="HTMLInjectionError",this.html=n}}
const Y=t,Q=a,J=Symbol("nomatch"),ee=t=>{
const a=Object.create(null),r=Object.create(null),i=[];let s=!0
;const o="Could not find the language '{}', did you forget to load/include a language module?",c={
disableAutodetect:!0,name:"Plain text",contains:[]};let p={
ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,
languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",
cssSelector:"pre code",languages:null,__emitter:l};function b(e){
return p.noHighlightRe.test(e)}function f(e,n,t){let a="",r=""
;"object"==typeof n?(a=e,
t=n.ignoreIllegals,r=n.language):(G("10.7.0","highlight(lang, code, ...args) has been deprecated."),
G("10.7.0","Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277"),
r=e,a=n),void 0===t&&(t=!0);const i={code:a,language:r};A("before:highlight",i)
;const s=i.result?i.result:h(i.language,i.code,t)
;return s.code=i.code,A("after:highlight",s),s}function h(e,t,r,i){
const l=Object.create(null);function c(){if(!A.keywords)return void C.addText(S)
;let e=0;A.keywordPatternRe.lastIndex=0;let n=A.keywordPatternRe.exec(S),t=""
;for(;n;){t+=S.substring(e,n.index)
;const r=v.case_insensitive?n[0].toLowerCase():n[0],i=(a=r,A.keywords[a]);if(i){
const[e,a]=i
;if(C.addText(t),t="",l[r]=(l[r]||0)+1,l[r]<=7&&(O+=a),e.startsWith("_"))t+=n[0];else{
const t=v.classNameAliases[e]||e;g(n[0],t)}}else t+=n[0]
;e=A.keywordPatternRe.lastIndex,n=A.keywordPatternRe.exec(S)}var a
;t+=S.substring(e),C.addText(t)}function d(){null!=A.subLanguage?(()=>{
if(""===S)return;let e=null;if("string"==typeof A.subLanguage){
if(!a[A.subLanguage])return void C.addText(S)
;e=h(A.subLanguage,S,!0,k[A.subLanguage]),k[A.subLanguage]=e._top
}else e=E(S,A.subLanguage.length?A.subLanguage:null)
;A.relevance>0&&(O+=e.relevance),C.__addSublanguage(e._emitter,e.language)
})():c(),S=""}function g(e,n){
""!==e&&(C.startScope(n),C.addText(e),C.endScope())}function m(e,n){let t=1
;const a=n.length-1;for(;t<=a;){if(!e._emit[t]){t++;continue}
const a=v.classNameAliases[e[t]]||e[t],r=n[t];a?g(r,a):(S=r,c(),S=""),t++}}
function u(e,n){
return e.scope&&"string"==typeof e.scope&&C.openNode(v.classNameAliases[e.scope]||e.scope),
e.beginScope&&(e.beginScope._wrap?(g(S,v.classNameAliases[e.beginScope._wrap]||e.beginScope._wrap),
S=""):e.beginScope._multi&&(m(e.beginScope,n),S="")),A=Object.create(e,{parent:{
value:A}}),A}function _(e,t,a){let r=((e,n)=>{const t=e&&e.exec(n)
;return t&&0===t.index})(e.endRe,a);if(r){if(e["on:end"]){const a=new n(e)
;e["on:end"](t,a),a.isMatchIgnored&&(r=!1)}if(r){
for(;e.endsParent&&e.parent;)e=e.parent;return e}}
if(e.endsWithParent)return _(e.parent,t,a)}function b(e){
return 0===A.matcher.regexIndex?(S+=e[0],1):(I=!0,0)}function f(e){
const n=e[0],a=t.substring(e.index),r=_(A,e,a);if(!r)return J;const i=A
;A.endScope&&A.endScope._wrap?(d(),
g(n,A.endScope._wrap)):A.endScope&&A.endScope._multi?(d(),
m(A.endScope,e)):i.skip?S+=n:(i.returnEnd||i.excludeEnd||(S+=n),
d(),i.excludeEnd&&(S=n));do{
A.scope&&C.closeNode(),A.skip||A.subLanguage||(O+=A.relevance),A=A.parent
}while(A!==r.parent);return r.starts&&u(r.starts,e),i.returnEnd?0:n.length}
let x={};function y(a,i){const o=i&&i[0];if(S+=a,null==o)return d(),0
;if("begin"===x.type&&"end"===i.type&&x.index===i.index&&""===o){
if(S+=t.slice(i.index,i.index+1),!s){const n=Error(`0 width match regex (${e})`)
;throw n.languageName=e,n.badRule=x.rule,n}return 1}
if(x=i,"begin"===i.type)return(e=>{
const t=e[0],a=e.rule,r=new n(a),i=[a.__beforeBegin,a["on:begin"]]
;for(const n of i)if(n&&(n(e,r),r.isMatchIgnored))return b(t)
;return a.skip?S+=t:(a.excludeBegin&&(S+=t),
d(),a.returnBegin||a.excludeBegin||(S=t)),u(a,e),a.returnBegin?0:t.length})(i)
;if("illegal"===i.type&&!r){
const e=Error('Illegal lexeme "'+o+'" for mode "'+(A.scope||"<unnamed>")+'"')
;throw e.mode=A,e}if("end"===i.type){const e=f(i);if(e!==J)return e}
if("illegal"===i.type&&""===o)return i.index===t.length||(S+="\n"),1
;if(D>1e5&&D>3*i.index)throw Error("potential infinite loop, way more iterations than matches")
;return S+=o,o.length}const v=w(e)
;if(!v)throw j(o.replace("{}",e)),Error('Unknown language: "'+e+'"')
;const N=X(v);let M="",A=i||N;const k={},C=new p.__emitter(p);(()=>{const e=[]
;for(let n=A;n!==v;n=n.parent)n.scope&&e.unshift(n.scope)
;e.forEach((e=>C.openNode(e)))})();let S="",O=0,T=0,D=0,I=!1;try{
if(v.__emitTokens)v.__emitTokens(t,C);else{for(A.matcher.considerAll();;){
D++,I?I=!1:A.matcher.considerAll(),A.matcher.lastIndex=T
;const e=A.matcher.exec(t);if(!e)break;const n=y(t.substring(T,e.index),e)
;T=e.index+n}y(t.substring(T))}return C.finalize(),M=C.toHTML(),{language:e,
value:M,relevance:O,illegal:!1,_emitter:C,_top:A}}catch(n){
if(n.message&&n.message.includes("Illegal"))return{language:e,value:Y(t),
illegal:!0,relevance:0,_illegalBy:{message:n.message,index:T,
context:t.slice(T-100,T+100),mode:n.mode,resultSoFar:M},_emitter:C};if(s)return{
language:e,value:Y(t),illegal:!1,relevance:0,errorRaised:n,_emitter:C,_top:A}
;throw n}}function E(e,n){n=n||p.languages||Object.keys(a);const t=(e=>{
const n={value:Y(e),illegal:!1,relevance:0,_top:c,_emitter:new p.__emitter(p)}
;return n._emitter.addText(e),n})(e),r=n.filter(w).filter(M).map((n=>h(n,e,!1)))
;r.unshift(t);const i=r.sort(((e,n)=>{
if(e.relevance!==n.relevance)return n.relevance-e.relevance
;if(e.language&&n.language){if(w(e.language).supersetOf===n.language)return 1
;if(w(n.language).supersetOf===e.language)return-1}return 0})),[s,o]=i,l=s
;return l.secondBest=o,l}function x(e){let n=null;const t=(e=>{
let n=e.className+" ";n+=e.parentNode?e.parentNode.className:""
;const t=p.languageDetectRe.exec(n);if(t){const n=w(t[1])
;return n||(q(o.replace("{}",t[1])),
q("Falling back to no-highlight mode for this block.",e)),n?t[1]:"no-highlight"}
return n.split(/\s+/).find((e=>b(e)||w(e)))})(e);if(b(t))return
;if(A("before:highlightElement",{el:e,language:t
}),e.dataset.highlighted)return void console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",e)
;if(e.children.length>0&&(p.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),
console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),
console.warn("The element with unescaped HTML:"),
console.warn(e)),p.throwUnescapedHTML))throw new W("One of your code blocks includes unescaped HTML.",e.innerHTML)
;n=e;const a=n.textContent,i=t?f(a,{language:t,ignoreIllegals:!0}):E(a)
;e.innerHTML=i.value,e.dataset.highlighted="yes",((e,n,t)=>{const a=n&&r[n]||t
;e.classList.add("hljs"),e.classList.add("language-"+a)
})(e,t,i.language),e.result={language:i.language,re:i.relevance,
relevance:i.relevance},i.secondBest&&(e.secondBest={
language:i.secondBest.language,relevance:i.secondBest.relevance
}),A("after:highlightElement",{el:e,result:i,text:a})}let y=!1;function v(){
if("loading"===document.readyState)return y||window.addEventListener("DOMContentLoaded",(()=>{
v()}),!1),void(y=!0);document.querySelectorAll(p.cssSelector).forEach(x)}
function w(e){return e=(e||"").toLowerCase(),a[e]||a[r[e]]}
function N(e,{languageName:n}){"string"==typeof e&&(e=[e]),e.forEach((e=>{
r[e.toLowerCase()]=n}))}function M(e){const n=w(e)
;return n&&!n.disableAutodetect}function A(e,n){const t=e;i.forEach((e=>{
e[t]&&e[t](n)}))}Object.assign(t,{highlight:f,highlightAuto:E,highlightAll:v,
highlightElement:x,
highlightBlock:e=>(G("10.7.0","highlightBlock will be removed entirely in v12.0"),
G("10.7.0","Please use highlightElement now."),x(e)),configure:e=>{p=Q(p,e)},
initHighlighting:()=>{
v(),G("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")},
initHighlightingOnLoad:()=>{
v(),G("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")
},registerLanguage:(e,n)=>{let r=null;try{r=n(t)}catch(n){
if(j("Language definition for '{}' could not be registered.".replace("{}",e)),
!s)throw n;j(n),r=c}
r.name||(r.name=e),a[e]=r,r.rawDefinition=n.bind(null,t),r.aliases&&N(r.aliases,{
languageName:e})},unregisterLanguage:e=>{delete a[e]
;for(const n of Object.keys(r))r[n]===e&&delete r[n]},
listLanguages:()=>Object.keys(a),getLanguage:w,registerAliases:N,
autoDetection:M,inherit:Q,addPlugin:e=>{(e=>{
e["before:highlightBlock"]&&!e["before:highlightElement"]&&(e["before:highlightElement"]=n=>{
e["before:highlightBlock"](Object.assign({block:n.el},n))
}),e["after:highlightBlock"]&&!e["after:highlightElement"]&&(e["after:highlightElement"]=n=>{
e["after:highlightBlock"](Object.assign({block:n.el},n))})})(e),i.push(e)},
removePlugin:e=>{const n=i.indexOf(e);-1!==n&&i.splice(n,1)}}),t.debugMode=()=>{
s=!1},t.safeMode=()=>{s=!0},t.versionString="11.11.1",t.regex={concat:u,
lookahead:d,either:_,optional:m,anyNumberOfTimes:g}
;for(const n in O)"object"==typeof O[n]&&e(O[n]);return Object.assign(t,O),t
},ne=ee({});ne.newInstance=()=>ee({})
;const te=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video","defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],ae=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),re=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),ie=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),se=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse(),oe="[A-Za-z$_][0-9A-Za-z$_]*",le=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],ce=["true","false","null","undefined","NaN","Infinity"],de=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],ge=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],me=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],ue=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],_e=[].concat(me,de,ge)
;var pe="[0-9](_*[0-9])*",be=`\\.(${pe})`,fe="[0-9a-fA-F](_*[0-9a-fA-F])*",he={
className:"number",variants:[{
begin:`(\\b(${pe})((${be})|\\.)?|(${be}))[eE][+-]?(${pe})[fFdD]?\\b`},{
begin:`\\b(${pe})((${be})[fFdD]?\\b|\\.([fFdD]\\b)?)`},{
begin:`(${be})[fFdD]?\\b`},{begin:`\\b(${pe})[fFdD]\\b`},{
begin:`\\b0[xX]((${fe})\\.?|(${fe})?\\.(${fe}))[pP][+-]?(${pe})[fFdD]?\\b`},{
begin:"\\b(0|[1-9](_*[0-9])*)[lL]?\\b"},{begin:`\\b0[xX](${fe})[lL]?\\b`},{
begin:"\\b0(_*[0-7])*[lL]?\\b"},{begin:"\\b0[bB][01](_*[01])*[lL]?\\b"}],
relevance:0};function Ee(e,n,t){return-1===t?"":e.replace(n,(a=>Ee(e,n,t-1)))}
function xe(e){const n=e.regex,t=oe,a={begin:/<[A-Za-z0-9\\._:-]+/,
end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(e,n)=>{
const t=e[0].length+e.index,a=e.input[t]
;if("<"===a||","===a)return void n.ignoreMatch();let r
;">"===a&&(((e,{after:n})=>{const t="</"+e[0].slice(1)
;return-1!==e.input.indexOf(t,n)})(e,{after:t})||n.ignoreMatch())
;const i=e.input.substring(t)
;((r=i.match(/^\s*=/))||(r=i.match(/^\s+extends\s+/))&&0===r.index)&&n.ignoreMatch()
}},r={$pattern:oe,keyword:le,literal:ce,built_in:_e,"variable.language":ue
},i="[0-9](_?[0-9])*",s=`\\.(${i})`,o="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",l={
className:"number",variants:[{
begin:`(\\b(${o})((${s})|\\.)?|(${s}))[eE][+-]?(${i})\\b`},{
begin:`\\b(${o})\\b((${s})\\b|\\.)?|(${s})\\b`},{
begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{
begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{
begin:"\\b0[0-7]+n?\\b"}],relevance:0},c={className:"subst",begin:"\\$\\{",
end:"\\}",keywords:r,contains:[]},d={begin:".?html`",end:"",starts:{end:"`",
returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,c],subLanguage:"xml"}},g={
begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,
contains:[e.BACKSLASH_ESCAPE,c],subLanguage:"css"}},m={begin:".?gql`",end:"",
starts:{end:"`",returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,c],
subLanguage:"graphql"}},u={className:"string",begin:"`",end:"`",
contains:[e.BACKSLASH_ESCAPE,c]},_={className:"comment",
variants:[e.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{
begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,
excludeBegin:!0,relevance:0},{className:"variable",begin:t+"(?=\\s*(-)|$)",
endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]
}),e.C_BLOCK_COMMENT_MODE,e.C_LINE_COMMENT_MODE]
},p=[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,d,g,m,u,{match:/\$\d+/},l]
;c.contains=p.concat({begin:/\{/,end:/\}/,keywords:r,contains:["self"].concat(p)
});const b=[].concat(_,c.contains),f=b.concat([{begin:/(\s*)\(/,end:/\)/,
keywords:r,contains:["self"].concat(b)}]),h={className:"params",begin:/(\s*)\(/,
end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:r,contains:f},E={variants:[{
match:[/class/,/\s+/,t,/\s+/,/extends/,/\s+/,n.concat(t,"(",n.concat(/\./,t),")*")],
scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{
match:[/class/,/\s+/,t],scope:{1:"keyword",3:"title.class"}}]},x={relevance:0,
match:n.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),
className:"title.class",keywords:{_:[...de,...ge]}},y={variants:[{
match:[/function/,/\s+/,t,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],
className:{1:"keyword",3:"title.function"},label:"func.def",contains:[h],
illegal:/%/},v={
match:n.concat(/\b/,(w=[...me,"super","import"].map((e=>e+"\\s*\\(")),
n.concat("(?!",w.join("|"),")")),t,n.lookahead(/\s*\(/)),
className:"title.function",relevance:0};var w;const N={
begin:n.concat(/\./,n.lookahead(n.concat(t,/(?![0-9A-Za-z$_(])/))),end:t,
excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},M={
match:[/get|set/,/\s+/,t,/(?=\()/],className:{1:"keyword",3:"title.function"},
contains:[{begin:/\(\)/},h]
},A="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+e.UNDERSCORE_IDENT_RE+")\\s*=>",k={
match:[/const|var|let/,/\s+/,t,/\s*/,/=\s*/,/(async\s*)?/,n.lookahead(A)],
keywords:"async",className:{1:"keyword",3:"title.function"},contains:[h]}
;return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:r,exports:{
PARAMS_CONTAINS:f,CLASS_REFERENCE:x},illegal:/#(?![$_A-z])/,
contains:[e.SHEBANG({label:"shebang",binary:"node",relevance:5}),{
label:"use_strict",className:"meta",relevance:10,
begin:/^\s*['"]use (strict|asm)['"]/
},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,d,g,m,u,_,{match:/\$\d+/},l,x,{
scope:"attr",match:t+n.lookahead(":"),relevance:0},k,{
begin:"("+e.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",
keywords:"return throw case",relevance:0,contains:[_,e.REGEXP_MODE,{
className:"function",begin:A,returnBegin:!0,end:"\\s*=>",contains:[{
className:"params",variants:[{begin:e.UNDERSCORE_IDENT_RE,relevance:0},{
className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,
excludeBegin:!0,excludeEnd:!0,keywords:r,contains:f}]}]},{begin:/,/,relevance:0
},{match:/\s+/,relevance:0},{variants:[{begin:"<>",end:"</>"},{
match:/<[A-Za-z0-9\\._:-]+\s*\/>/},{begin:a.begin,
"on:begin":a.isTrulyOpeningTag,end:a.end}],subLanguage:"xml",contains:[{
begin:a.begin,end:a.end,skip:!0,contains:["self"]}]}]},y,{
beginKeywords:"while if switch catch for"},{
begin:"\\b(?!function)"+e.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
returnBegin:!0,label:"func.def",contains:[h,e.inherit(e.TITLE_MODE,{begin:t,
className:"title.function"})]},{match:/\.\.\./,relevance:0},N,{match:"\\$"+t,
relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},
contains:[h]},v,{relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,
className:"variable.constant"},E,M,{match:/\$[(.]/}]}}
const ye=e=>u(/\b/,e,/\w$/.test(e)?/\b/:/\B/),ve=["Protocol","Type"].map(ye),we=["init","self"].map(ye),Ne=["Any","Self"],Me=["actor","any","associatedtype","async","await",/as\?/,/as!/,"as","borrowing","break","case","catch","class","consume","consuming","continue","convenience","copy","default","defer","deinit","didSet","distributed","do","dynamic","each","else","enum","extension","fallthrough",/fileprivate\(set\)/,"fileprivate","final","for","func","get","guard","if","import","indirect","infix",/init\?/,/init!/,"inout",/internal\(set\)/,"internal","in","is","isolated","nonisolated","lazy","let","macro","mutating","nonmutating",/open\(set\)/,"open","operator","optional","override","package","postfix","precedencegroup","prefix",/private\(set\)/,"private","protocol",/public\(set\)/,"public","repeat","required","rethrows","return","set","some","static","struct","subscript","super","switch","throws","throw",/try\?/,/try!/,"try","typealias",/unowned\(safe\)/,/unowned\(unsafe\)/,"unowned","var","weak","where","while","willSet"],Ae=["false","nil","true"],ke=["assignment","associativity","higherThan","left","lowerThan","none","right"],Ce=["#colorLiteral","#column","#dsohandle","#else","#elseif","#endif","#error","#file","#fileID","#fileLiteral","#filePath","#function","#if","#imageLiteral","#keyPath","#line","#selector","#sourceLocation","#warning"],Se=["abs","all","any","assert","assertionFailure","debugPrint","dump","fatalError","getVaList","isKnownUniquelyReferenced","max","min","numericCast","pointwiseMax","pointwiseMin","precondition","preconditionFailure","print","readLine","repeatElement","sequence","stride","swap","swift_unboxFromSwiftValueWithType","transcode","type","unsafeBitCast","unsafeDowncast","withExtendedLifetime","withUnsafeMutablePointer","withUnsafePointer","withVaList","withoutActuallyEscaping","zip"],Oe=_(/[/=\-+!*%<>&|^~?]/,/[\u00A1-\u00A7]/,/[\u00A9\u00AB]/,/[\u00AC\u00AE]/,/[\u00B0\u00B1]/,/[\u00B6\u00BB\u00BF\u00D7\u00F7]/,/[\u2016-\u2017]/,/[\u2020-\u2027]/,/[\u2030-\u203E]/,/[\u2041-\u2053]/,/[\u2055-\u205E]/,/[\u2190-\u23FF]/,/[\u2500-\u2775]/,/[\u2794-\u2BFF]/,/[\u2E00-\u2E7F]/,/[\u3001-\u3003]/,/[\u3008-\u3020]/,/[\u3030]/),Te=_(Oe,/[\u0300-\u036F]/,/[\u1DC0-\u1DFF]/,/[\u20D0-\u20FF]/,/[\uFE00-\uFE0F]/,/[\uFE20-\uFE2F]/),De=u(Oe,Te,"*"),Ie=_(/[a-zA-Z_]/,/[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/,/[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/,/[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/,/[\u1E00-\u1FFF]/,/[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/,/[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/,/[\u2C00-\u2DFF\u2E80-\u2FFF]/,/[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/,/[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/,/[\uFE47-\uFEFE\uFF00-\uFFFD]/),Re=_(Ie,/\d/,/[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/),Le=u(Ie,Re,"*"),Be=u(/[A-Z]/,Re,"*"),Fe=["attached","autoclosure",u(/convention\(/,_("swift","block","c"),/\)/),"discardableResult","dynamicCallable","dynamicMemberLookup","escaping","freestanding","frozen","GKInspectable","IBAction","IBDesignable","IBInspectable","IBOutlet","IBSegueAction","inlinable","main","nonobjc","NSApplicationMain","NSCopying","NSManaged",u(/objc\(/,Le,/\)/),"objc","objcMembers","propertyWrapper","requires_stored_property_inits","resultBuilder","Sendable","testable","UIApplicationMain","unchecked","unknown","usableFromInline","warn_unqualified_access"],Pe=["iOS","iOSApplicationExtension","macOS","macOSApplicationExtension","macCatalyst","macCatalystApplicationExtension","watchOS","watchOSApplicationExtension","tvOS","tvOSApplicationExtension","swift"]
;var ze=Object.freeze({__proto__:null,grmr_armasm:e=>{const n={
variants:[e.COMMENT("^[ \\t]*(?=#)","$",{relevance:0,excludeBegin:!0
}),e.COMMENT("[;@]","$",{relevance:0
}),e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]};return{name:"ARM Assembly",
case_insensitive:!0,aliases:["arm"],keywords:{$pattern:"\\.?"+e.IDENT_RE,
meta:".2byte .4byte .align .ascii .asciz .balign .byte .code .data .else .end .endif .endm .endr .equ .err .exitm .extern .global .hword .if .ifdef .ifndef .include .irp .long .macro .rept .req .section .set .skip .space .text .word .arm .thumb .code16 .code32 .force_thumb .thumb_func .ltorg ALIAS ALIGN ARM AREA ASSERT ATTR CN CODE CODE16 CODE32 COMMON CP DATA DCB DCD DCDU DCDO DCFD DCFDU DCI DCQ DCQU DCW DCWU DN ELIF ELSE END ENDFUNC ENDIF ENDP ENTRY EQU EXPORT EXPORTAS EXTERN FIELD FILL FUNCTION GBLA GBLL GBLS GET GLOBAL IF IMPORT INCBIN INCLUDE INFO KEEP LCLA LCLL LCLS LTORG MACRO MAP MEND MEXIT NOFP OPT PRESERVE8 PROC QN READONLY RELOC REQUIRE REQUIRE8 RLIST FN ROUT SETA SETL SETS SN SPACE SUBT THUMB THUMBX TTL WHILE WEND ",
built_in:"r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 w0 w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 w12 w13 w14 w15 w16 w17 w18 w19 w20 w21 w22 w23 w24 w25 w26 w27 w28 w29 w30 x0 x1 x2 x3 x4 x5 x6 x7 x8 x9 x10 x11 x12 x13 x14 x15 x16 x17 x18 x19 x20 x21 x22 x23 x24 x25 x26 x27 x28 x29 x30 pc lr sp ip sl sb fp a1 a2 a3 a4 v1 v2 v3 v4 v5 v6 v7 v8 f0 f1 f2 f3 f4 f5 f6 f7 p0 p1 p2 p3 p4 p5 p6 p7 p8 p9 p10 p11 p12 p13 p14 p15 c0 c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14 c15 q0 q1 q2 q3 q4 q5 q6 q7 q8 q9 q10 q11 q12 q13 q14 q15 cpsr_c cpsr_x cpsr_s cpsr_f cpsr_cx cpsr_cxs cpsr_xs cpsr_xsf cpsr_sf cpsr_cxsf spsr_c spsr_x spsr_s spsr_f spsr_cx spsr_cxs spsr_xs spsr_xsf spsr_sf spsr_cxsf s0 s1 s2 s3 s4 s5 s6 s7 s8 s9 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24 s25 s26 s27 s28 s29 s30 s31 d0 d1 d2 d3 d4 d5 d6 d7 d8 d9 d10 d11 d12 d13 d14 d15 d16 d17 d18 d19 d20 d21 d22 d23 d24 d25 d26 d27 d28 d29 d30 d31 {PC} {VAR} {TRUE} {FALSE} {OPT} {CONFIG} {ENDIAN} {CODESIZE} {CPU} {FPU} {ARCHITECTURE} {PCSTOREOFFSET} {ARMASM_VERSION} {INTER} {ROPI} {RWPI} {SWST} {NOSWST} . @"
},contains:[{className:"keyword",
begin:"\\b(adc|(qd?|sh?|u[qh]?)?add(8|16)?|usada?8|(q|sh?|u[qh]?)?(as|sa)x|and|adrl?|sbc|rs[bc]|asr|b[lx]?|blx|bxj|cbn?z|tb[bh]|bic|bfc|bfi|[su]bfx|bkpt|cdp2?|clz|clrex|cmp|cmn|cpsi[ed]|cps|setend|dbg|dmb|dsb|eor|isb|it[te]{0,3}|lsl|lsr|ror|rrx|ldm(([id][ab])|f[ds])?|ldr((s|ex)?[bhd])?|movt?|mvn|mra|mar|mul|[us]mull|smul[bwt][bt]|smu[as]d|smmul|smmla|mla|umlaal|smlal?([wbt][bt]|d)|mls|smlsl?[ds]|smc|svc|sev|mia([bt]{2}|ph)?|mrr?c2?|mcrr2?|mrs|msr|orr|orn|pkh(tb|bt)|rbit|rev(16|sh)?|sel|[su]sat(16)?|nop|pop|push|rfe([id][ab])?|stm([id][ab])?|str(ex)?[bhd]?|(qd?)?sub|(sh?|q|u[qh]?)?sub(8|16)|[su]xt(a?h|a?b(16)?)|srs([id][ab])?|swpb?|swi|smi|tst|teq|wfe|wfi|yield)(eq|ne|cs|cc|mi|pl|vs|vc|hi|ls|ge|lt|gt|le|al|hs|lo)?[sptrx]?(?=\\s)"
},n,e.QUOTE_STRING_MODE,{className:"string",begin:"'",end:"[^\\\\]'",relevance:0
},{className:"title",begin:"\\|",end:"\\|",illegal:"\\n",relevance:0},{
className:"number",variants:[{begin:"[#$=]?0x[0-9a-f]+"},{begin:"[#$=]?0b[01]+"
},{begin:"[#$=]\\d+"},{begin:"\\b\\d+"}],relevance:0},{className:"symbol",
variants:[{begin:"^[ \\t]*[a-z_\\.\\$][a-z0-9_\\.\\$]+:"},{
begin:"^[a-z_\\.\\$][a-z0-9_\\.\\$]+"},{begin:"[=#]\\w+"}],relevance:0}]}},
grmr_bash:e=>{const n=e.regex,t={},a={begin:/\$\{/,end:/\}/,contains:["self",{
begin:/:-/,contains:[t]}]};Object.assign(t,{className:"variable",variants:[{
begin:n.concat(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},a]});const r={
className:"subst",begin:/\$\(/,end:/\)/,contains:[e.BACKSLASH_ESCAPE]
},i=e.inherit(e.COMMENT(),{match:[/(^|\s)/,/#.*$/],scope:{2:"comment"}}),s={
begin:/<<-?\s*(?=\w+)/,starts:{contains:[e.END_SAME_AS_BEGIN({begin:/(\w+)/,
end:/(\w+)/,className:"string"})]}},o={className:"string",begin:/"/,end:/"/,
contains:[e.BACKSLASH_ESCAPE,t,r]};r.contains.push(o);const l={begin:/\$?\(\(/,
end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},e.NUMBER_MODE,t]
},c=e.SHEBANG({binary:"(fish|bash|zsh|sh|csh|ksh|tcsh|dash|scsh)",relevance:10
}),d={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,
contains:[e.inherit(e.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0};return{
name:"Bash",aliases:["sh","zsh"],keywords:{$pattern:/\b[a-z][a-z0-9._-]+\b/,
keyword:["if","then","else","elif","fi","time","for","while","until","in","do","done","case","esac","coproc","function","select"],
literal:["true","false"],
built_in:["break","cd","continue","eval","exec","exit","export","getopts","hash","pwd","readonly","return","shift","test","times","trap","umask","unset","alias","bind","builtin","caller","command","declare","echo","enable","help","let","local","logout","mapfile","printf","read","readarray","source","sudo","type","typeset","ulimit","unalias","set","shopt","autoload","bg","bindkey","bye","cap","chdir","clone","comparguments","compcall","compctl","compdescribe","compfiles","compgroups","compquote","comptags","comptry","compvalues","dirs","disable","disown","echotc","echoti","emulate","fc","fg","float","functions","getcap","getln","history","integer","jobs","kill","limit","log","noglob","popd","print","pushd","pushln","rehash","sched","setcap","setopt","stat","suspend","ttyctl","unfunction","unhash","unlimit","unsetopt","vared","wait","whence","where","which","zcompile","zformat","zftp","zle","zmodload","zparseopts","zprof","zpty","zregexparse","zsocket","zstyle","ztcp","chcon","chgrp","chown","chmod","cp","dd","df","dir","dircolors","ln","ls","mkdir","mkfifo","mknod","mktemp","mv","realpath","rm","rmdir","shred","sync","touch","truncate","vdir","b2sum","base32","base64","cat","cksum","comm","csplit","cut","expand","fmt","fold","head","join","md5sum","nl","numfmt","od","paste","ptx","pr","sha1sum","sha224sum","sha256sum","sha384sum","sha512sum","shuf","sort","split","sum","tac","tail","tr","tsort","unexpand","uniq","wc","arch","basename","chroot","date","dirname","du","echo","env","expr","factor","groups","hostid","id","link","logname","nice","nohup","nproc","pathchk","pinky","printenv","printf","pwd","readlink","runcon","seq","sleep","stat","stdbuf","stty","tee","test","timeout","tty","uname","unlink","uptime","users","who","whoami","yes"]
},contains:[c,e.SHEBANG(),d,l,i,s,{match:/(\/[a-z._-]+)+/},o,{match:/\\"/},{
className:"string",begin:/'/,end:/'/},{match:/\\'/},t]}},grmr_c:e=>{
const n=e.regex,t=e.COMMENT("//","$",{contains:[{begin:/\\\n/}]
}),a="decltype\\(auto\\)",r="[a-zA-Z_]\\w*::",i="("+a+"|"+n.optional(r)+"[a-zA-Z_]\\w*"+n.optional("<[^<>]+>")+")",s={
className:"type",variants:[{begin:"\\b[a-z\\d_]*_t\\b"},{
match:/\batomic_[a-z]{3,6}\b/}]},o={className:"string",variants:[{
begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{
begin:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
end:"'",illegal:"."},e.END_SAME_AS_BEGIN({
begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},l={
className:"number",variants:[{match:/\b(0b[01']+)/},{
match:/(-?)\b([\d']+(\.[\d']*)?|\.[\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)/
},{
match:/(-?)\b(0[xX][a-fA-F0-9]+(?:'[a-fA-F0-9]+)*(?:\.[a-fA-F0-9]*(?:'[a-fA-F0-9]*)*)?(?:[pP][-+]?[0-9]+)?(l|L)?(u|U)?)/
},{match:/(-?)\b\d+(?:'\d+)*(?:\.\d*(?:'\d*)*)?(?:[eE][-+]?\d+)?/}],relevance:0
},c={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{
keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef elifdef elifndef include"
},contains:[{begin:/\\\n/,relevance:0},e.inherit(o,{className:"string"}),{
className:"string",begin:/<.*?>/},t,e.C_BLOCK_COMMENT_MODE]},d={
className:"title",begin:n.optional(r)+e.IDENT_RE,relevance:0
},g=n.optional(r)+e.IDENT_RE+"\\s*\\(",m={
keyword:["asm","auto","break","case","continue","default","do","else","enum","extern","for","fortran","goto","if","inline","register","restrict","return","sizeof","typeof","typeof_unqual","struct","switch","typedef","union","volatile","while","_Alignas","_Alignof","_Atomic","_Generic","_Noreturn","_Static_assert","_Thread_local","alignas","alignof","noreturn","static_assert","thread_local","_Pragma"],
type:["float","double","signed","unsigned","int","short","long","char","void","_Bool","_BitInt","_Complex","_Imaginary","_Decimal32","_Decimal64","_Decimal96","_Decimal128","_Decimal64x","_Decimal128x","_Float16","_Float32","_Float64","_Float128","_Float32x","_Float64x","_Float128x","const","static","constexpr","complex","bool","imaginary"],
literal:"true false NULL",
built_in:"std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"
},u=[c,s,t,e.C_BLOCK_COMMENT_MODE,l,o],_={variants:[{begin:/=/,end:/;/},{
begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],
keywords:m,contains:u.concat([{begin:/\(/,end:/\)/,keywords:m,
contains:u.concat(["self"]),relevance:0}]),relevance:0},p={
begin:"("+i+"[\\*&\\s]+)+"+g,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,
keywords:m,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:a,keywords:m,relevance:0},{
begin:g,returnBegin:!0,contains:[e.inherit(d,{className:"title.function"})],
relevance:0},{relevance:0,match:/,/},{className:"params",begin:/\(/,end:/\)/,
keywords:m,relevance:0,contains:[t,e.C_BLOCK_COMMENT_MODE,o,l,s,{begin:/\(/,
end:/\)/,keywords:m,relevance:0,contains:["self",t,e.C_BLOCK_COMMENT_MODE,o,l,s]
}]},s,t,e.C_BLOCK_COMMENT_MODE,c]};return{name:"C",aliases:["h"],keywords:m,
disableAutodetect:!0,illegal:"</",contains:[].concat(_,p,u,[c,{
begin:e.IDENT_RE+"::",keywords:m},{className:"class",
beginKeywords:"enum class struct union",end:/[{;:<>=]/,contains:[{
beginKeywords:"final class struct"},e.TITLE_MODE]}]),exports:{preprocessor:c,
strings:o,keywords:m}}},grmr_coffeescript:e=>{const n={
keyword:le.concat(["then","unless","until","loop","by","when","and","or","is","isnt","not"]).filter((t=["var","const","let","function","static"],
e=>!t.includes(e))),literal:ce.concat(["yes","no","on","off"]),
built_in:_e.concat(["npm","print"])};var t
;const a="[A-Za-z$_][0-9A-Za-z$_]*",r={className:"subst",begin:/#\{/,end:/\}/,
keywords:n},i=[e.BINARY_NUMBER_MODE,e.inherit(e.C_NUMBER_MODE,{starts:{
end:"(\\s*/)?",relevance:0}}),{className:"string",variants:[{begin:/'''/,
end:/'''/,contains:[e.BACKSLASH_ESCAPE]},{begin:/'/,end:/'/,
contains:[e.BACKSLASH_ESCAPE]},{begin:/"""/,end:/"""/,
contains:[e.BACKSLASH_ESCAPE,r]},{begin:/"/,end:/"/,
contains:[e.BACKSLASH_ESCAPE,r]}]},{className:"regexp",variants:[{begin:"///",
end:"///",contains:[r,e.HASH_COMMENT_MODE]},{begin:"//[gim]{0,3}(?=\\W)",
relevance:0},{begin:/\/(?![ *]).*?(?![\\]).\/[gim]{0,3}(?=\W)/}]},{begin:"@"+a
},{subLanguage:"javascript",excludeBegin:!0,excludeEnd:!0,variants:[{
begin:"```",end:"```"},{begin:"`",end:"`"}]}];r.contains=i
;const s=e.inherit(e.TITLE_MODE,{begin:a}),o="(\\(.*\\)\\s*)?\\B[-=]>",l={
className:"params",begin:"\\([^\\(]",returnBegin:!0,contains:[{begin:/\(/,
end:/\)/,keywords:n,contains:["self"].concat(i)}]},c={variants:[{
match:[/class\s+/,a,/\s+extends\s+/,a]},{match:[/class\s+/,a]}],scope:{
2:"title.class",4:"title.class.inherited"},keywords:n};return{
name:"CoffeeScript",aliases:["coffee","cson","iced"],keywords:n,illegal:/\/\*/,
contains:[...i,e.COMMENT("###","###"),e.HASH_COMMENT_MODE,{className:"function",
begin:"^\\s*"+a+"\\s*=\\s*"+o,end:"[-=]>",returnBegin:!0,contains:[s,l]},{
begin:/[:\(,=]\s*/,relevance:0,contains:[{className:"function",begin:o,
end:"[-=]>",returnBegin:!0,contains:[l]}]},c,{begin:a+":",end:":",
returnBegin:!0,returnEnd:!0,relevance:0}]}},grmr_cpp:e=>{
const n=e.regex,t=e.COMMENT("//","$",{contains:[{begin:/\\\n/}]
}),a="decltype\\(auto\\)",r="[a-zA-Z_]\\w*::",i="(?!struct)("+a+"|"+n.optional(r)+"[a-zA-Z_]\\w*"+n.optional("<[^<>]+>")+")",s={
className:"type",begin:"\\b[a-z\\d_]*_t\\b"},o={className:"string",variants:[{
begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{
begin:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
end:"'",illegal:"."},e.END_SAME_AS_BEGIN({
begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},l={
className:"number",variants:[{
begin:"[+-]?(?:(?:[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"
},{
begin:"[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"
}],relevance:0},c={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{
keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},e.inherit(o,{className:"string"}),{
className:"string",begin:/<.*?>/},t,e.C_BLOCK_COMMENT_MODE]},d={
className:"title",begin:n.optional(r)+e.IDENT_RE,relevance:0
},g=n.optional(r)+e.IDENT_RE+"\\s*\\(",m={
type:["bool","char","char16_t","char32_t","char8_t","double","float","int","long","short","void","wchar_t","unsigned","signed","const","static"],
keyword:["alignas","alignof","and","and_eq","asm","atomic_cancel","atomic_commit","atomic_noexcept","auto","bitand","bitor","break","case","catch","class","co_await","co_return","co_yield","compl","concept","const_cast|10","consteval","constexpr","constinit","continue","decltype","default","delete","do","dynamic_cast|10","else","enum","explicit","export","extern","false","final","for","friend","goto","if","import","inline","module","mutable","namespace","new","noexcept","not","not_eq","nullptr","operator","or","or_eq","override","private","protected","public","reflexpr","register","reinterpret_cast|10","requires","return","sizeof","static_assert","static_cast|10","struct","switch","synchronized","template","this","thread_local","throw","transaction_safe","transaction_safe_dynamic","true","try","typedef","typeid","typename","union","using","virtual","volatile","while","xor","xor_eq"],
literal:["NULL","false","nullopt","nullptr","true"],built_in:["_Pragma"],
_type_hints:["any","auto_ptr","barrier","binary_semaphore","bitset","complex","condition_variable","condition_variable_any","counting_semaphore","deque","false_type","flat_map","flat_set","future","imaginary","initializer_list","istringstream","jthread","latch","lock_guard","multimap","multiset","mutex","optional","ostringstream","packaged_task","pair","promise","priority_queue","queue","recursive_mutex","recursive_timed_mutex","scoped_lock","set","shared_future","shared_lock","shared_mutex","shared_timed_mutex","shared_ptr","stack","string_view","stringstream","timed_mutex","thread","true_type","tuple","unique_lock","unique_ptr","unordered_map","unordered_multimap","unordered_multiset","unordered_set","variant","vector","weak_ptr","wstring","wstring_view"]
},u={className:"function.dispatch",relevance:0,keywords:{
_hint:["abort","abs","acos","apply","as_const","asin","atan","atan2","calloc","ceil","cerr","cin","clog","cos","cosh","cout","declval","endl","exchange","exit","exp","fabs","floor","fmod","forward","fprintf","fputs","free","frexp","fscanf","future","invoke","isalnum","isalpha","iscntrl","isdigit","isgraph","islower","isprint","ispunct","isspace","isupper","isxdigit","labs","launder","ldexp","log","log10","make_pair","make_shared","make_shared_for_overwrite","make_tuple","make_unique","malloc","memchr","memcmp","memcpy","memset","modf","move","pow","printf","putchar","puts","realloc","scanf","sin","sinh","snprintf","sprintf","sqrt","sscanf","std","stderr","stdin","stdout","strcat","strchr","strcmp","strcpy","strcspn","strlen","strncat","strncmp","strncpy","strpbrk","strrchr","strspn","strstr","swap","tan","tanh","terminate","to_underlying","tolower","toupper","vfprintf","visit","vprintf","vsprintf"]
},
begin:n.concat(/\b/,/(?!decltype)/,/(?!if)/,/(?!for)/,/(?!switch)/,/(?!while)/,e.IDENT_RE,n.lookahead(/(<[^<>]+>|)\s*\(/))
},_=[u,c,s,t,e.C_BLOCK_COMMENT_MODE,l,o],p={variants:[{begin:/=/,end:/;/},{
begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],
keywords:m,contains:_.concat([{begin:/\(/,end:/\)/,keywords:m,
contains:_.concat(["self"]),relevance:0}]),relevance:0},b={className:"function",
begin:"("+i+"[\\*&\\s]+)+"+g,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,
keywords:m,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:a,keywords:m,relevance:0},{
begin:g,returnBegin:!0,contains:[d],relevance:0},{begin:/::/,relevance:0},{
begin:/:/,endsWithParent:!0,contains:[o,l]},{relevance:0,match:/,/},{
className:"params",begin:/\(/,end:/\)/,keywords:m,relevance:0,
contains:[t,e.C_BLOCK_COMMENT_MODE,o,l,s,{begin:/\(/,end:/\)/,keywords:m,
relevance:0,contains:["self",t,e.C_BLOCK_COMMENT_MODE,o,l,s]}]
},s,t,e.C_BLOCK_COMMENT_MODE,c]};return{name:"C++",
aliases:["cc","c++","h++","hpp","hh","hxx","cxx"],keywords:m,illegal:"</",
classNameAliases:{"function.dispatch":"built_in"},
contains:[].concat(p,b,u,_,[c,{
begin:"\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",
end:">",keywords:m,contains:["self",s]},{begin:e.IDENT_RE+"::",keywords:m},{
match:[/\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,/\s+/,/\w+/],
className:{1:"keyword",3:"title.class"}}])}},grmr_csharp:e=>{const n={
keyword:["abstract","as","base","break","case","catch","class","const","continue","do","else","event","explicit","extern","finally","fixed","for","foreach","goto","if","implicit","in","interface","internal","is","lock","namespace","new","operator","out","override","params","private","protected","public","readonly","record","ref","return","scoped","sealed","sizeof","stackalloc","static","struct","switch","this","throw","try","typeof","unchecked","unsafe","using","virtual","void","volatile","while"].concat(["add","alias","and","ascending","args","async","await","by","descending","dynamic","equals","file","from","get","global","group","init","into","join","let","nameof","not","notnull","on","or","orderby","partial","record","remove","required","scoped","select","set","unmanaged","value|0","var","when","where","with","yield"]),
built_in:["bool","byte","char","decimal","delegate","double","dynamic","enum","float","int","long","nint","nuint","object","sbyte","short","string","ulong","uint","ushort"],
literal:["default","false","null","true"]},t=e.inherit(e.TITLE_MODE,{
begin:"[a-zA-Z](\\.?\\w)*"}),a={className:"number",variants:[{
begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)(u|U|l|L|ul|UL|f|F|b|B)"},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},r={className:"string",begin:'@"',end:'"',contains:[{begin:'""'}]
},i=e.inherit(r,{illegal:/\n/}),s={className:"subst",begin:/\{/,end:/\}/,
keywords:n},o=e.inherit(s,{illegal:/\n/}),l={className:"string",begin:/\$"/,
end:'"',illegal:/\n/,contains:[{begin:/\{\{/},{begin:/\}\}/
},e.BACKSLASH_ESCAPE,o]},c={className:"string",begin:/\$@"/,end:'"',contains:[{
begin:/\{\{/},{begin:/\}\}/},{begin:'""'},s]},d=e.inherit(c,{illegal:/\n/,
contains:[{begin:/\{\{/},{begin:/\}\}/},{begin:'""'},o]})
;s.contains=[c,l,r,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,a,e.C_BLOCK_COMMENT_MODE],
o.contains=[d,l,i,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,a,e.inherit(e.C_BLOCK_COMMENT_MODE,{
illegal:/\n/})];const g={variants:[{className:"string",
begin:/"""("*)(?!")(.|\n)*?"""\1/,relevance:1
},c,l,r,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},m={begin:"<",end:">",
contains:[{beginKeywords:"in out"},t]
},u=e.IDENT_RE+"(<"+e.IDENT_RE+"(\\s*,\\s*"+e.IDENT_RE+")*>)?(\\[\\])?",_={
begin:"@"+e.IDENT_RE,relevance:0};return{name:"C#",aliases:["cs","c#"],
keywords:n,illegal:/::/,contains:[e.COMMENT("///","$",{returnBegin:!0,
contains:[{className:"doctag",variants:[{begin:"///",relevance:0},{
begin:"\x3c!--|--\x3e"},{begin:"</?",end:">"}]}]
}),e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"meta",begin:"#",
end:"$",keywords:{
keyword:"if else elif endif define undef warning error line region endregion pragma checksum"
}},g,a,{beginKeywords:"class interface",relevance:0,end:/[{;=]/,
illegal:/[^\s:,]/,contains:[{beginKeywords:"where class"
},t,m,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{beginKeywords:"namespace",
relevance:0,end:/[{;=]/,illegal:/[^\s:]/,
contains:[t,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{
beginKeywords:"record",relevance:0,end:/[{;=]/,illegal:/[^\s:]/,
contains:[t,m,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{className:"meta",
begin:"^\\s*\\[(?=[\\w])",excludeBegin:!0,end:"\\]",excludeEnd:!0,contains:[{
className:"string",begin:/"/,end:/"/}]},{
beginKeywords:"new return throw await else",relevance:0},{className:"function",
begin:"("+u+"\\s+)+"+e.IDENT_RE+"\\s*(<[^=]+>\\s*)?\\(",returnBegin:!0,
end:/\s*[{;=]/,excludeEnd:!0,keywords:n,contains:[{
beginKeywords:"public private protected static internal protected abstract async extern override unsafe virtual new sealed partial",
relevance:0},{begin:e.IDENT_RE+"\\s*(<[^=]+>\\s*)?\\(",returnBegin:!0,
contains:[e.TITLE_MODE,m],relevance:0},{match:/\(\)/},{className:"params",
begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:n,relevance:0,
contains:[g,a,e.C_BLOCK_COMMENT_MODE]
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},_]}},grmr_css:e=>{
const n=e.regex,t=(e=>({IMPORTANT:{scope:"meta",begin:"!important"},
BLOCK_COMMENT:e.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",
begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{
className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{
scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",
contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{
scope:"number",
begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}
}))(e),a=[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE];return{name:"CSS",
case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},
classNameAliases:{keyframePosition:"selector-tag"},contains:[t.BLOCK_COMMENT,{
begin:/-(webkit|moz|ms|o)-(?=[a-z])/},t.CSS_NUMBER_MODE,{
className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0},{
className:"selector-class",begin:"\\.[a-zA-Z-][a-zA-Z0-9_-]*",relevance:0
},t.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{
begin:":("+re.join("|")+")"},{begin:":(:)?("+ie.join("|")+")"}]
},t.CSS_VARIABLE,{className:"attribute",begin:"\\b("+se.join("|")+")\\b"},{
begin:/:/,end:/[;}{]/,
contains:[t.BLOCK_COMMENT,t.HEXCOLOR,t.IMPORTANT,t.CSS_NUMBER_MODE,...a,{
begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"
},contains:[...a,{className:"string",begin:/[^)]/,endsWithParent:!0,
excludeEnd:!0}]},t.FUNCTION_DISPATCH]},{begin:n.lookahead(/@/),end:"[{;]",
relevance:0,illegal:/:/,contains:[{className:"keyword",begin:/@-?\w[\w]*(-\w+)*/
},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{
$pattern:/[a-z-]+/,keyword:"and or not only",attribute:ae.join(" ")},contains:[{
begin:/[a-z-]+(?=:)/,className:"attribute"},...a,t.CSS_NUMBER_MODE]}]},{
className:"selector-tag",begin:"\\b("+te.join("|")+")\\b"}]}},grmr_glsl:e=>({
name:"GLSL",keywords:{
keyword:"break continue discard do else for if return while switch case default attribute binding buffer ccw centroid centroid varying coherent column_major const cw depth_any depth_greater depth_less depth_unchanged early_fragment_tests equal_spacing flat fractional_even_spacing fractional_odd_spacing highp in index inout invariant invocations isolines layout line_strip lines lines_adjacency local_size_x local_size_y local_size_z location lowp max_vertices mediump noperspective offset origin_upper_left out packed patch pixel_center_integer point_mode points precise precision quads r11f_g11f_b10f r16 r16_snorm r16f r16i r16ui r32f r32i r32ui r8 r8_snorm r8i r8ui readonly restrict rg16 rg16_snorm rg16f rg16i rg16ui rg32f rg32i rg32ui rg8 rg8_snorm rg8i rg8ui rgb10_a2 rgb10_a2ui rgba16 rgba16_snorm rgba16f rgba16i rgba16ui rgba32f rgba32i rgba32ui rgba8 rgba8_snorm rgba8i rgba8ui row_major sample shared smooth std140 std430 stream triangle_strip triangles triangles_adjacency uniform varying vertices volatile writeonly",
type:"atomic_uint bool bvec2 bvec3 bvec4 dmat2 dmat2x2 dmat2x3 dmat2x4 dmat3 dmat3x2 dmat3x3 dmat3x4 dmat4 dmat4x2 dmat4x3 dmat4x4 double dvec2 dvec3 dvec4 float iimage1D iimage1DArray iimage2D iimage2DArray iimage2DMS iimage2DMSArray iimage2DRect iimage3D iimageBuffer iimageCube iimageCubeArray image1D image1DArray image2D image2DArray image2DMS image2DMSArray image2DRect image3D imageBuffer imageCube imageCubeArray int isampler1D isampler1DArray isampler2D isampler2DArray isampler2DMS isampler2DMSArray isampler2DRect isampler3D isamplerBuffer isamplerCube isamplerCubeArray ivec2 ivec3 ivec4 mat2 mat2x2 mat2x3 mat2x4 mat3 mat3x2 mat3x3 mat3x4 mat4 mat4x2 mat4x3 mat4x4 sampler1D sampler1DArray sampler1DArrayShadow sampler1DShadow sampler2D sampler2DArray sampler2DArrayShadow sampler2DMS sampler2DMSArray sampler2DRect sampler2DRectShadow sampler2DShadow sampler3D samplerBuffer samplerCube samplerCubeArray samplerCubeArrayShadow samplerCubeShadow image1D uimage1DArray uimage2D uimage2DArray uimage2DMS uimage2DMSArray uimage2DRect uimage3D uimageBuffer uimageCube uimageCubeArray uint usampler1D usampler1DArray usampler2D usampler2DArray usampler2DMS usampler2DMSArray usampler2DRect usampler3D samplerBuffer usamplerCube usamplerCubeArray uvec2 uvec3 uvec4 vec2 vec3 vec4 void",
built_in:"gl_MaxAtomicCounterBindings gl_MaxAtomicCounterBufferSize gl_MaxClipDistances gl_MaxClipPlanes gl_MaxCombinedAtomicCounterBuffers gl_MaxCombinedAtomicCounters gl_MaxCombinedImageUniforms gl_MaxCombinedImageUnitsAndFragmentOutputs gl_MaxCombinedTextureImageUnits gl_MaxComputeAtomicCounterBuffers gl_MaxComputeAtomicCounters gl_MaxComputeImageUniforms gl_MaxComputeTextureImageUnits gl_MaxComputeUniformComponents gl_MaxComputeWorkGroupCount gl_MaxComputeWorkGroupSize gl_MaxDrawBuffers gl_MaxFragmentAtomicCounterBuffers gl_MaxFragmentAtomicCounters gl_MaxFragmentImageUniforms gl_MaxFragmentInputComponents gl_MaxFragmentInputVectors gl_MaxFragmentUniformComponents gl_MaxFragmentUniformVectors gl_MaxGeometryAtomicCounterBuffers gl_MaxGeometryAtomicCounters gl_MaxGeometryImageUniforms gl_MaxGeometryInputComponents gl_MaxGeometryOutputComponents gl_MaxGeometryOutputVertices gl_MaxGeometryTextureImageUnits gl_MaxGeometryTotalOutputComponents gl_MaxGeometryUniformComponents gl_MaxGeometryVaryingComponents gl_MaxImageSamples gl_MaxImageUnits gl_MaxLights gl_MaxPatchVertices gl_MaxProgramTexelOffset gl_MaxTessControlAtomicCounterBuffers gl_MaxTessControlAtomicCounters gl_MaxTessControlImageUniforms gl_MaxTessControlInputComponents gl_MaxTessControlOutputComponents gl_MaxTessControlTextureImageUnits gl_MaxTessControlTotalOutputComponents gl_MaxTessControlUniformComponents gl_MaxTessEvaluationAtomicCounterBuffers gl_MaxTessEvaluationAtomicCounters gl_MaxTessEvaluationImageUniforms gl_MaxTessEvaluationInputComponents gl_MaxTessEvaluationOutputComponents gl_MaxTessEvaluationTextureImageUnits gl_MaxTessEvaluationUniformComponents gl_MaxTessGenLevel gl_MaxTessPatchComponents gl_MaxTextureCoords gl_MaxTextureImageUnits gl_MaxTextureUnits gl_MaxVaryingComponents gl_MaxVaryingFloats gl_MaxVaryingVectors gl_MaxVertexAtomicCounterBuffers gl_MaxVertexAtomicCounters gl_MaxVertexAttribs gl_MaxVertexImageUniforms gl_MaxVertexOutputComponents gl_MaxVertexOutputVectors gl_MaxVertexTextureImageUnits gl_MaxVertexUniformComponents gl_MaxVertexUniformVectors gl_MaxViewports gl_MinProgramTexelOffset gl_BackColor gl_BackLightModelProduct gl_BackLightProduct gl_BackMaterial gl_BackSecondaryColor gl_ClipDistance gl_ClipPlane gl_ClipVertex gl_Color gl_DepthRange gl_EyePlaneQ gl_EyePlaneR gl_EyePlaneS gl_EyePlaneT gl_Fog gl_FogCoord gl_FogFragCoord gl_FragColor gl_FragCoord gl_FragData gl_FragDepth gl_FrontColor gl_FrontFacing gl_FrontLightModelProduct gl_FrontLightProduct gl_FrontMaterial gl_FrontSecondaryColor gl_GlobalInvocationID gl_InstanceID gl_InvocationID gl_Layer gl_LightModel gl_LightSource gl_LocalInvocationID gl_LocalInvocationIndex gl_ModelViewMatrix gl_ModelViewMatrixInverse gl_ModelViewMatrixInverseTranspose gl_ModelViewMatrixTranspose gl_ModelViewProjectionMatrix gl_ModelViewProjectionMatrixInverse gl_ModelViewProjectionMatrixInverseTranspose gl_ModelViewProjectionMatrixTranspose gl_MultiTexCoord0 gl_MultiTexCoord1 gl_MultiTexCoord2 gl_MultiTexCoord3 gl_MultiTexCoord4 gl_MultiTexCoord5 gl_MultiTexCoord6 gl_MultiTexCoord7 gl_Normal gl_NormalMatrix gl_NormalScale gl_NumSamples gl_NumWorkGroups gl_ObjectPlaneQ gl_ObjectPlaneR gl_ObjectPlaneS gl_ObjectPlaneT gl_PatchVerticesIn gl_Point gl_PointCoord gl_PointSize gl_Position gl_PrimitiveID gl_PrimitiveIDIn gl_ProjectionMatrix gl_ProjectionMatrixInverse gl_ProjectionMatrixInverseTranspose gl_ProjectionMatrixTranspose gl_SampleID gl_SampleMask gl_SampleMaskIn gl_SamplePosition gl_SecondaryColor gl_TessCoord gl_TessLevelInner gl_TessLevelOuter gl_TexCoord gl_TextureEnvColor gl_TextureMatrix gl_TextureMatrixInverse gl_TextureMatrixInverseTranspose gl_TextureMatrixTranspose gl_Vertex gl_VertexID gl_ViewportIndex gl_WorkGroupID gl_WorkGroupSize gl_in gl_out EmitStreamVertex EmitVertex EndPrimitive EndStreamPrimitive abs acos acosh all any asin asinh atan atanh atomicAdd atomicAnd atomicCompSwap atomicCounter atomicCounterDecrement atomicCounterIncrement atomicExchange atomicMax atomicMin atomicOr atomicXor barrier bitCount bitfieldExtract bitfieldInsert bitfieldReverse ceil clamp cos cosh cross dFdx dFdy degrees determinant distance dot equal exp exp2 faceforward findLSB findMSB floatBitsToInt floatBitsToUint floor fma fract frexp ftransform fwidth greaterThan greaterThanEqual groupMemoryBarrier imageAtomicAdd imageAtomicAnd imageAtomicCompSwap imageAtomicExchange imageAtomicMax imageAtomicMin imageAtomicOr imageAtomicXor imageLoad imageSize imageStore imulExtended intBitsToFloat interpolateAtCentroid interpolateAtOffset interpolateAtSample inverse inversesqrt isinf isnan ldexp length lessThan lessThanEqual log log2 matrixCompMult max memoryBarrier memoryBarrierAtomicCounter memoryBarrierBuffer memoryBarrierImage memoryBarrierShared min mix mod modf noise1 noise2 noise3 noise4 normalize not notEqual outerProduct packDouble2x32 packHalf2x16 packSnorm2x16 packSnorm4x8 packUnorm2x16 packUnorm4x8 pow radians reflect refract round roundEven shadow1D shadow1DLod shadow1DProj shadow1DProjLod shadow2D shadow2DLod shadow2DProj shadow2DProjLod sign sin sinh smoothstep sqrt step tan tanh texelFetch texelFetchOffset texture texture1D texture1DLod texture1DProj texture1DProjLod texture2D texture2DLod texture2DProj texture2DProjLod texture3D texture3DLod texture3DProj texture3DProjLod textureCube textureCubeLod textureGather textureGatherOffset textureGatherOffsets textureGrad textureGradOffset textureLod textureLodOffset textureOffset textureProj textureProjGrad textureProjGradOffset textureProjLod textureProjLodOffset textureProjOffset textureQueryLevels textureQueryLod textureSize transpose trunc uaddCarry uintBitsToFloat umulExtended unpackDouble2x32 unpackHalf2x16 unpackSnorm2x16 unpackSnorm4x8 unpackUnorm2x16 unpackUnorm4x8 usubBorrow",
literal:"true false"},illegal:'"',
contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,e.C_NUMBER_MODE,{
className:"meta",begin:"#",end:"$"}]}),grmr_go:e=>{const n={
keyword:["break","case","chan","const","continue","default","defer","else","fallthrough","for","func","go","goto","if","import","interface","map","package","range","return","select","struct","switch","type","var"],
type:["bool","byte","complex64","complex128","error","float32","float64","int8","int16","int32","int64","string","uint8","uint16","uint32","uint64","int","uint","uintptr","rune"],
literal:["true","false","iota","nil"],
built_in:["append","cap","close","complex","copy","imag","len","make","new","panic","print","println","real","recover","delete"]
};return{name:"Go",aliases:["golang"],keywords:n,illegal:"</",
contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"string",
variants:[e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,{begin:"`",end:"`"}]},{
className:"number",variants:[{
match:/-?\b0[xX]\.[a-fA-F0-9](_?[a-fA-F0-9])*[pP][+-]?\d(_?\d)*i?/,relevance:0
},{
match:/-?\b0[xX](_?[a-fA-F0-9])+((\.([a-fA-F0-9](_?[a-fA-F0-9])*)?)?[pP][+-]?\d(_?\d)*)?i?/,
relevance:0},{match:/-?\b0[oO](_?[0-7])*i?/,relevance:0},{
match:/-?\.\d(_?\d)*([eE][+-]?\d(_?\d)*)?i?/,relevance:0},{
match:/-?\b\d(_?\d)*(\.(\d(_?\d)*)?)?([eE][+-]?\d(_?\d)*)?i?/,relevance:0}]},{
begin:/:=/},{className:"function",beginKeywords:"func",end:"\\s*(\\{|$)",
excludeEnd:!0,contains:[e.TITLE_MODE,{className:"params",begin:/\(/,end:/\)/,
endsParent:!0,keywords:n,illegal:/["']/}]}]}},grmr_haskell:e=>{
const n="([0-9]_*)+",t="([0-9a-fA-F]_*)+",a="([!#$%&*+.\\/<=>?@\\\\^~-]|(?!([(),;\\[\\]`|{}]|[_:\"']))(\\p{S}|\\p{P}))",r={
variants:[e.COMMENT("--+","$"),e.COMMENT(/\{-/,/-\}/,{contains:["self"]})]},i={
className:"meta",begin:/\{-#/,end:/#-\}/},s={className:"meta",begin:"^#",end:"$"
},o={className:"type",begin:"\\b[A-Z][\\w']*",relevance:0},l={begin:"\\(",
end:"\\)",illegal:'"',contains:[i,s,{className:"type",
begin:"\\b[A-Z][\\w]*(\\((\\.\\.|,|\\w+)\\))?"},e.inherit(e.TITLE_MODE,{
begin:"[_a-z][\\w']*"}),r]},c={className:"number",relevance:0,variants:[{
match:`\\b(${n})(\\.(${n}))?([eE][+-]?(${n}))?\\b`},{
match:`\\b0[xX]_*(${t})(\\.(${t}))?([pP][+-]?(${n}))?\\b`},{
match:"\\b0[oO](([0-7]_*)+)\\b"},{match:"\\b0[bB](([01]_*)+)\\b"}]};return{
name:"Haskell",aliases:["hs"],
keywords:"let in if then else case of where do module import hiding qualified type data newtype deriving class instance as default infix infixl infixr foreign export ccall stdcall cplusplus jvm dotnet safe unsafe family forall mdo proc rec",
unicodeRegex:!0,contains:[{beginKeywords:"module",end:"where",
keywords:"module where",contains:[l,r],illegal:"\\W\\.|;"},{
begin:"\\bimport\\b",end:"$",keywords:"import qualified as hiding",
contains:[l,r],illegal:"\\W\\.|;"},{className:"class",
begin:"^(\\s*)?(class|instance)\\b",end:"where",
keywords:"class family instance where",contains:[o,l,r]},{className:"class",
begin:"\\b(data|(new)?type)\\b",end:"$",
keywords:"data family type newtype deriving",contains:[i,o,l,{begin:/\{/,
end:/\}/,contains:l.contains},r]},{beginKeywords:"default",end:"$",
contains:[o,l,r]},{beginKeywords:"infix infixl infixr",end:"$",
contains:[e.C_NUMBER_MODE,r]},{begin:"\\bforeign\\b",end:"$",
keywords:"foreign import export ccall stdcall cplusplus jvm dotnet safe unsafe",
contains:[o,e.QUOTE_STRING_MODE,r]},{className:"meta",
begin:"#!\\/usr\\/bin\\/env runhaskell",end:"$"},i,s,{scope:"string",
begin:/'(?=\\?.')/,end:/'/,contains:[{scope:"char.escape",match:/\\./}]
},e.QUOTE_STRING_MODE,c,o,e.inherit(e.TITLE_MODE,{begin:"^[_a-z][\\w']*"}),{
begin:`(?!-)${a}--+|--+(?!-)${a}`},r,{begin:"->|<-"}]}},grmr_http:e=>{
const n="HTTP/([32]|1\\.[01])",t={className:"attribute",
begin:e.regex.concat("^",/[A-Za-z][A-Za-z0-9-]*/,"(?=\\:\\s)"),starts:{
contains:[{className:"punctuation",begin:/: /,relevance:0,starts:{end:"$",
relevance:0}}]}},a=[t,{begin:"\\n\\n",starts:{subLanguage:[],endsWithParent:!0}
}];return{name:"HTTP",aliases:["https"],illegal:/\S/,contains:[{
begin:"^(?="+n+" \\d{3})",end:/$/,contains:[{className:"meta",begin:n},{
className:"number",begin:"\\b\\d{3}\\b"}],starts:{end:/\b\B/,illegal:/\S/,
contains:a}},{begin:"(?=^[A-Z]+ (.*?) "+n+"$)",end:/$/,contains:[{
className:"string",begin:" ",end:" ",excludeBegin:!0,excludeEnd:!0},{
className:"meta",begin:n},{className:"keyword",begin:"[A-Z]+"}],starts:{
end:/\b\B/,illegal:/\S/,contains:a}},e.inherit(t,{relevance:0})]}},
grmr_java:e=>{
const n=e.regex,t="[\xc0-\u02b8a-zA-Z_$][\xc0-\u02b8a-zA-Z_$0-9]*",a=t+Ee("(?:<"+t+"~~~(?:\\s*,\\s*"+t+"~~~)*>)?",/~~~/g,2),r={
keyword:["synchronized","abstract","private","var","static","if","const ","for","while","strictfp","finally","protected","import","native","final","void","enum","else","break","transient","catch","instanceof","volatile","case","assert","package","default","public","try","switch","continue","throws","protected","public","private","module","requires","exports","do","sealed","yield","permits","goto","when"],
literal:["false","true","null"],
type:["char","boolean","long","float","int","byte","short","double"],
built_in:["super","this"]},i={className:"meta",begin:"@"+t,contains:[{
begin:/\(/,end:/\)/,contains:["self"]}]},s={className:"params",begin:/\(/,
end:/\)/,keywords:r,relevance:0,contains:[e.C_BLOCK_COMMENT_MODE],endsParent:!0}
;return{name:"Java",aliases:["jsp"],keywords:r,illegal:/<\/|#/,
contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{begin:/\w+@/,
relevance:0},{className:"doctag",begin:"@[A-Za-z]+"}]}),{
begin:/import java\.[a-z]+\./,keywords:"import",relevance:2
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{begin:/"""/,end:/"""/,
className:"string",contains:[e.BACKSLASH_ESCAPE]
},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{
match:[/\b(?:class|interface|enum|extends|implements|new)/,/\s+/,t],className:{
1:"keyword",3:"title.class"}},{match:/non-sealed/,scope:"keyword"},{
begin:[n.concat(/(?!else)/,t),/\s+/,t,/\s+/,/=(?!=)/],className:{1:"type",
3:"variable",5:"operator"}},{begin:[/record/,/\s+/,t],className:{1:"keyword",
3:"title.class"},contains:[s,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{
beginKeywords:"new throw return else",relevance:0},{
begin:["(?:"+a+"\\s+)",e.UNDERSCORE_IDENT_RE,/\s*(?=\()/],className:{
2:"title.function"},keywords:r,contains:[{className:"params",begin:/\(/,
end:/\)/,keywords:r,relevance:0,
contains:[i,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,he,e.C_BLOCK_COMMENT_MODE]
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},he,i]}},grmr_javascript:xe,
grmr_json:e=>{const n=["true","false","null"],t={scope:"literal",
beginKeywords:n.join(" ")};return{name:"JSON",aliases:["jsonc"],keywords:{
literal:n},contains:[{className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,
relevance:1.01},{match:/[{}[\],:]/,className:"punctuation",relevance:0
},e.QUOTE_STRING_MODE,t,e.C_NUMBER_MODE,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE],
illegal:"\\S"}},grmr_julia:e=>{
const n="[A-Za-z_\\u00A1-\\uFFFF][A-Za-z_0-9\\u00A1-\\uFFFF]*",t={$pattern:n,
keyword:["baremodule","begin","break","catch","ccall","const","continue","do","else","elseif","end","export","false","finally","for","function","global","if","import","in","isa","let","local","macro","module","quote","return","true","try","using","where","while"],
literal:["ARGS","C_NULL","DEPOT_PATH","ENDIAN_BOM","ENV","Inf","Inf16","Inf32","Inf64","InsertionSort","LOAD_PATH","MergeSort","NaN","NaN16","NaN32","NaN64","PROGRAM_FILE","QuickSort","RoundDown","RoundFromZero","RoundNearest","RoundNearestTiesAway","RoundNearestTiesUp","RoundToZero","RoundUp","VERSION|0","devnull","false","im","missing","nothing","pi","stderr","stdin","stdout","true","undef","\u03c0","\u212f"],
built_in:["AbstractArray","AbstractChannel","AbstractChar","AbstractDict","AbstractDisplay","AbstractFloat","AbstractIrrational","AbstractMatrix","AbstractRange","AbstractSet","AbstractString","AbstractUnitRange","AbstractVecOrMat","AbstractVector","Any","ArgumentError","Array","AssertionError","BigFloat","BigInt","BitArray","BitMatrix","BitSet","BitVector","Bool","BoundsError","CapturedException","CartesianIndex","CartesianIndices","Cchar","Cdouble","Cfloat","Channel","Char","Cint","Cintmax_t","Clong","Clonglong","Cmd","Colon","Complex","ComplexF16","ComplexF32","ComplexF64","CompositeException","Condition","Cptrdiff_t","Cshort","Csize_t","Cssize_t","Cstring","Cuchar","Cuint","Cuintmax_t","Culong","Culonglong","Cushort","Cvoid","Cwchar_t","Cwstring","DataType","DenseArray","DenseMatrix","DenseVecOrMat","DenseVector","Dict","DimensionMismatch","Dims","DivideError","DomainError","EOFError","Enum","ErrorException","Exception","ExponentialBackOff","Expr","Float16","Float32","Float64","Function","GlobalRef","HTML","IO","IOBuffer","IOContext","IOStream","IdDict","IndexCartesian","IndexLinear","IndexStyle","InexactError","InitError","Int","Int128","Int16","Int32","Int64","Int8","Integer","InterruptException","InvalidStateException","Irrational","KeyError","LinRange","LineNumberNode","LinearIndices","LoadError","MIME","Matrix","Method","MethodError","Missing","MissingException","Module","NTuple","NamedTuple","Nothing","Number","OrdinalRange","OutOfMemoryError","OverflowError","Pair","PartialQuickSort","PermutedDimsArray","Pipe","ProcessFailedException","Ptr","QuoteNode","Rational","RawFD","ReadOnlyMemoryError","Real","ReentrantLock","Ref","Regex","RegexMatch","RoundingMode","SegmentationFault","Set","Signed","Some","StackOverflowError","StepRange","StepRangeLen","StridedArray","StridedMatrix","StridedVecOrMat","StridedVector","String","StringIndexError","SubArray","SubString","SubstitutionString","Symbol","SystemError","Task","TaskFailedException","Text","TextDisplay","Timer","Tuple","Type","TypeError","TypeVar","UInt","UInt128","UInt16","UInt32","UInt64","UInt8","UndefInitializer","UndefKeywordError","UndefRefError","UndefVarError","Union","UnionAll","UnitRange","Unsigned","Val","Vararg","VecElement","VecOrMat","Vector","VersionNumber","WeakKeyDict","WeakRef"]
},a={keywords:t,illegal:/<\//},r={className:"subst",begin:/\$\(/,end:/\)/,
keywords:t},i={className:"variable",begin:"\\$"+n},s={className:"string",
contains:[e.BACKSLASH_ESCAPE,r,i],variants:[{begin:/\w*"""/,end:/"""\w*/,
relevance:10},{begin:/\w*"/,end:/"\w*/}]},o={className:"string",
contains:[e.BACKSLASH_ESCAPE,r,i],begin:"`",end:"`"},l={className:"meta",
begin:"@"+n};return a.name="Julia",a.contains=[{className:"number",
begin:/(\b0x[\d_]*(\.[\d_]*)?|0x\.\d[\d_]*)p[-+]?\d+|\b0[box][a-fA-F0-9][a-fA-F0-9_]*|(\b\d[\d_]*(\.[\d_]*)?|\.\d[\d_]*)([eEfF][-+]?\d+)?/,
relevance:0},{className:"string",begin:/'(.|\\[xXuU][a-zA-Z0-9]+)'/},s,o,l,{
className:"comment",variants:[{begin:"#=",end:"=#",relevance:10},{begin:"#",
end:"$"}]},e.HASH_COMMENT_MODE,{className:"keyword",
begin:"\\b(((abstract|primitive)\\s+)type|(mutable\\s+)?struct)\\b"},{begin:/<:/
}],r.contains=a.contains,a},grmr_kotlin:e=>{const n={
keyword:"abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual",
built_in:"Byte Short Char Int Long Boolean Float Double Void Unit Nothing",
literal:"true false null"},t={className:"symbol",begin:e.UNDERSCORE_IDENT_RE+"@"
},a={className:"subst",begin:/\$\{/,end:/\}/,contains:[e.C_NUMBER_MODE]},r={
className:"variable",begin:"\\$"+e.UNDERSCORE_IDENT_RE},i={className:"string",
variants:[{begin:'"""',end:'"""(?=[^"])',contains:[r,a]},{begin:"'",end:"'",
illegal:/\n/,contains:[e.BACKSLASH_ESCAPE]},{begin:'"',end:'"',illegal:/\n/,
contains:[e.BACKSLASH_ESCAPE,r,a]}]};a.contains.push(i);const s={
className:"meta",
begin:"@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*"+e.UNDERSCORE_IDENT_RE+")?"
},o={className:"meta",begin:"@"+e.UNDERSCORE_IDENT_RE,contains:[{begin:/\(/,
end:/\)/,contains:[e.inherit(i,{className:"string"}),"self"]}]
},l=he,c=e.COMMENT("/\\*","\\*/",{contains:[e.C_BLOCK_COMMENT_MODE]}),d={
variants:[{className:"type",begin:e.UNDERSCORE_IDENT_RE},{begin:/\(/,end:/\)/,
contains:[]}]},g=d;return g.variants[1].contains=[d],d.variants[1].contains=[g],
{name:"Kotlin",aliases:["kt","kts"],keywords:n,
contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"}]}),e.C_LINE_COMMENT_MODE,c,{className:"keyword",
begin:/\b(break|continue|return|this)\b/,starts:{contains:[{className:"symbol",
begin:/@\w+/}]}},t,s,o,{className:"function",beginKeywords:"fun",end:"[(]|$",
returnBegin:!0,excludeEnd:!0,keywords:n,relevance:5,contains:[{
begin:e.UNDERSCORE_IDENT_RE+"\\s*\\(",returnBegin:!0,relevance:0,
contains:[e.UNDERSCORE_TITLE_MODE]},{className:"type",begin:/</,end:/>/,
keywords:"reified",relevance:0},{className:"params",begin:/\(/,end:/\)/,
endsParent:!0,keywords:n,relevance:0,contains:[{begin:/:/,end:/[=,\/]/,
endsWithParent:!0,contains:[d,e.C_LINE_COMMENT_MODE,c],relevance:0
},e.C_LINE_COMMENT_MODE,c,s,o,i,e.C_NUMBER_MODE]},c]},{
begin:[/class|interface|trait/,/\s+/,e.UNDERSCORE_IDENT_RE],beginScope:{
3:"title.class"},keywords:"class interface trait",end:/[:\{(]|$/,excludeEnd:!0,
illegal:"extends implements",contains:[{
beginKeywords:"public protected internal private constructor"
},e.UNDERSCORE_TITLE_MODE,{className:"type",begin:/</,end:/>/,excludeBegin:!0,
excludeEnd:!0,relevance:0},{className:"type",begin:/[,:]\s*/,end:/[<\(,){\s]|$/,
excludeBegin:!0,returnEnd:!0},s,o]},i,{className:"meta",begin:"^#!/usr/bin/env",
end:"$",illegal:"\n"},l]}},grmr_latex:e=>{const n=[{begin:/\^{6}[0-9a-f]{6}/},{
begin:/\^{5}[0-9a-f]{5}/},{begin:/\^{4}[0-9a-f]{4}/},{begin:/\^{3}[0-9a-f]{3}/
},{begin:/\^{2}[0-9a-f]{2}/},{begin:/\^{2}[\u0000-\u007f]/}],t=[{
className:"keyword",begin:/\\/,relevance:0,contains:[{endsParent:!0,
begin:e.regex.either(...["(?:NeedsTeXFormat|RequirePackage|GetIdInfo)","Provides(?:Expl)?(?:Package|Class|File)","(?:DeclareOption|ProcessOptions)","(?:documentclass|usepackage|input|include)","makeat(?:letter|other)","ExplSyntax(?:On|Off)","(?:new|renew|provide)?command","(?:re)newenvironment","(?:New|Renew|Provide|Declare)(?:Expandable)?DocumentCommand","(?:New|Renew|Provide|Declare)DocumentEnvironment","(?:(?:e|g|x)?def|let)","(?:begin|end)","(?:part|chapter|(?:sub){0,2}section|(?:sub)?paragraph)","caption","(?:label|(?:eq|page|name)?ref|(?:paren|foot|super)?cite)","(?:alpha|beta|[Gg]amma|[Dd]elta|(?:var)?epsilon|zeta|eta|[Tt]heta|vartheta)","(?:iota|(?:var)?kappa|[Ll]ambda|mu|nu|[Xx]i|[Pp]i|varpi|(?:var)rho)","(?:[Ss]igma|varsigma|tau|[Uu]psilon|[Pp]hi|varphi|chi|[Pp]si|[Oo]mega)","(?:frac|sum|prod|lim|infty|times|sqrt|leq|geq|left|right|middle|[bB]igg?)","(?:[lr]angle|q?quad|[lcvdi]?dots|d?dot|hat|tilde|bar)"].map((e=>e+"(?![a-zA-Z@:_])")))
},{endsParent:!0,
begin:RegExp(["(?:__)?[a-zA-Z]{2,}_[a-zA-Z](?:_?[a-zA-Z])+:[a-zA-Z]*","[lgc]__?[a-zA-Z](?:_?[a-zA-Z])*_[a-zA-Z]{2,}","[qs]__?[a-zA-Z](?:_?[a-zA-Z])+","use(?:_i)?:[a-zA-Z]*","(?:else|fi|or):","(?:if|cs|exp):w","(?:hbox|vbox):n","::[a-zA-Z]_unbraced","::[a-zA-Z:]"].map((e=>e+"(?![a-zA-Z:_])")).join("|"))
},{endsParent:!0,variants:n},{endsParent:!0,relevance:0,variants:[{
begin:/[a-zA-Z@]+/},{begin:/[^a-zA-Z@]?/}]}]},{className:"params",relevance:0,
begin:/#+\d?/},{variants:n},{className:"built_in",relevance:0,begin:/[$&^_]/},{
className:"meta",begin:/% ?!(T[eE]X|tex|BIB|bib)/,end:"$",relevance:10
},e.COMMENT("%","$",{relevance:0})],a={begin:/\{/,end:/\}/,relevance:0,
contains:["self",...t]},r=e.inherit(a,{relevance:0,endsParent:!0,
contains:[a,...t]}),i={begin:/\[/,end:/\]/,endsParent:!0,relevance:0,
contains:[a,...t]},s={begin:/\s+/,relevance:0},o=[r],l=[i],c=(e,n)=>({
contains:[s],starts:{relevance:0,contains:e,starts:n}}),d=(e,n)=>({
begin:"\\\\"+e+"(?![a-zA-Z@:_])",keywords:{$pattern:/\\[a-zA-Z]+/,keyword:"\\"+e
},relevance:0,contains:[s],starts:n}),g=(n,t)=>e.inherit({
begin:"\\\\begin(?=[ \t]*(\\r?\\n[ \t]*)?\\{"+n+"\\})",keywords:{
$pattern:/\\[a-zA-Z]+/,keyword:"\\begin"},relevance:0
},c(o,t)),m=(n="string")=>e.END_SAME_AS_BEGIN({className:n,begin:/(.|\r?\n)/,
end:/(.|\r?\n)/,excludeBegin:!0,excludeEnd:!0,endsParent:!0}),u=e=>({
className:"string",end:"(?=\\\\end\\{"+e+"\\})"}),_=(e="string")=>({relevance:0,
begin:/\{/,starts:{endsParent:!0,contains:[{className:e,end:/(?=\})/,
endsParent:!0,contains:[{begin:/\{/,end:/\}/,relevance:0,contains:["self"]}]}]}
});return{name:"LaTeX",aliases:["tex"],
contains:[...["verb","lstinline"].map((e=>d(e,{contains:[m()]}))),d("mint",c(o,{
contains:[m()]})),d("mintinline",c(o,{contains:[_(),m()]})),d("url",{
contains:[_("link"),_("link")]}),d("hyperref",{contains:[_("link")]
}),d("href",c(l,{contains:[_("link")]
})),...[].concat(...["","\\*"].map((e=>[g("verbatim"+e,u("verbatim"+e)),g("filecontents"+e,c(o,u("filecontents"+e))),...["","B","L"].map((n=>g(n+"Verbatim"+e,c(l,u(n+"Verbatim"+e)))))]))),g("minted",c(l,c(o,u("minted")))),...t]
}},grmr_lisp:e=>{
const n="[a-zA-Z_\\-+\\*\\/<=>&#][a-zA-Z0-9_\\-+*\\/<=>&#!]*",t="\\|[^]*?\\|",a="(-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s|D|E|F|L|S)(\\+|-)?\\d+)?",r={
className:"literal",begin:"\\b(t{1}|nil)\\b"},i={className:"number",variants:[{
begin:a,relevance:0},{begin:"#(b|B)[0-1]+(/[0-1]+)?"},{
begin:"#(o|O)[0-7]+(/[0-7]+)?"},{begin:"#(x|X)[0-9a-fA-F]+(/[0-9a-fA-F]+)?"},{
begin:"#(c|C)\\("+a+" +"+a,end:"\\)"}]},s=e.inherit(e.QUOTE_STRING_MODE,{
illegal:null}),o=e.COMMENT(";","$",{relevance:0}),l={begin:"\\*",end:"\\*"},c={
className:"symbol",begin:"[:&]"+n},d={begin:n,relevance:0},g={begin:t},m={
contains:[i,s,l,c,{begin:"\\(",end:"\\)",contains:["self",r,s,i,d]},d],
variants:[{begin:"['`]\\(",end:"\\)"},{begin:"\\(quote ",end:"\\)",keywords:{
name:"quote"}},{begin:"'"+t}]},u={variants:[{begin:"'"+n},{
begin:"#'"+n+"(::"+n+")*"}]},_={begin:"\\(\\s*",end:"\\)"},p={endsWithParent:!0,
relevance:0};return _.contains=[{className:"name",variants:[{begin:n,relevance:0
},{begin:t}]},p],p.contains=[m,u,_,r,i,s,o,l,c,g,d],{name:"Lisp",illegal:/\S/,
contains:[i,e.SHEBANG(),r,s,o,m,u,_,d]}},grmr_lua:e=>{
const n="\\[=*\\[",t="\\]=*\\]",a={begin:n,end:t,contains:["self"]
},r=[e.COMMENT("--(?!"+n+")","$"),e.COMMENT("--"+n,t,{contains:[a],relevance:10
})];return{name:"Lua",aliases:["pluto"],keywords:{
$pattern:e.UNDERSCORE_IDENT_RE,literal:"true false nil",
keyword:"and break do else elseif end for goto if in local not or repeat return then until while",
built_in:"_G _ENV _VERSION __index __newindex __mode __call __metatable __tostring __len __gc __add __sub __mul __div __mod __pow __concat __unm __eq __lt __le assert collectgarbage dofile error getfenv getmetatable ipairs load loadfile loadstring module next pairs pcall print rawequal rawget rawset require select setfenv setmetatable tonumber tostring type unpack xpcall arg self coroutine resume yield status wrap create running debug getupvalue debug sethook getmetatable gethook setmetatable setlocal traceback setfenv getinfo setupvalue getlocal getregistry getfenv io lines write close flush open output type read stderr stdin input stdout popen tmpfile math log max acos huge ldexp pi cos tanh pow deg tan cosh sinh random randomseed frexp ceil floor rad abs sqrt modf asin min mod fmod log10 atan2 exp sin atan os exit setlocale date getenv difftime remove time clock tmpname rename execute package preload loadlib loaded loaders cpath config path seeall string sub upper len gfind rep find match char dump gmatch reverse byte format gsub lower table setn insert getn foreachi maxn foreach concat sort remove"
},contains:r.concat([{className:"function",beginKeywords:"function",end:"\\)",
contains:[e.inherit(e.TITLE_MODE,{
begin:"([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*"}),{className:"params",
begin:"\\(",endsWithParent:!0,contains:r}].concat(r)
},e.C_NUMBER_MODE,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{className:"string",
begin:n,end:t,contains:[a],relevance:5}])}},grmr_makefile:e=>{const n={
className:"variable",variants:[{begin:"\\$\\("+e.UNDERSCORE_IDENT_RE+"\\)",
contains:[e.BACKSLASH_ESCAPE]},{begin:/\$[@%<?\^\+\*]/}]},t={className:"string",
begin:/"/,end:/"/,contains:[e.BACKSLASH_ESCAPE,n]},a={className:"variable",
begin:/\$\([\w-]+\s/,end:/\)/,keywords:{
built_in:"subst patsubst strip findstring filter filter-out sort word wordlist firstword lastword dir notdir suffix basename addsuffix addprefix join wildcard realpath abspath error warning shell origin flavor foreach if or and call eval file value"
},contains:[n,t]},r={begin:"^"+e.UNDERSCORE_IDENT_RE+"\\s*(?=[:+?]?=)"},i={
className:"section",begin:/^[^\s]+:/,end:/$/,contains:[n]};return{
name:"Makefile",aliases:["mk","mak","make"],keywords:{$pattern:/[\w-]+/,
keyword:"define endef undefine ifdef ifndef ifeq ifneq else endif include -include sinclude override export unexport private vpath"
},contains:[e.HASH_COMMENT_MODE,n,t,a,r,{className:"meta",begin:/^\.PHONY:/,
end:/$/,keywords:{$pattern:/[\.\w]+/,keyword:".PHONY"}},i]}},grmr_markdown:e=>{
const n={begin:/<\/?[A-Za-z_]/,end:">",subLanguage:"xml",relevance:0},t={
variants:[{begin:/\[.+?\]\[.*?\]/,relevance:0},{
begin:/\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
relevance:2},{
begin:e.regex.concat(/\[.+?\]\(/,/[A-Za-z][A-Za-z0-9+.-]*/,/:\/\/.*?\)/),
relevance:2},{begin:/\[.+?\]\([./?&#].*?\)/,relevance:1},{
begin:/\[.*?\]\(.*?\)/,relevance:0}],returnBegin:!0,contains:[{match:/\[(?=\])/
},{className:"string",relevance:0,begin:"\\[",end:"\\]",excludeBegin:!0,
returnEnd:!0},{className:"link",relevance:0,begin:"\\]\\(",end:"\\)",
excludeBegin:!0,excludeEnd:!0},{className:"symbol",relevance:0,begin:"\\]\\[",
end:"\\]",excludeBegin:!0,excludeEnd:!0}]},a={className:"strong",contains:[],
variants:[{begin:/_{2}(?!\s)/,end:/_{2}/},{begin:/\*{2}(?!\s)/,end:/\*{2}/}]
},r={className:"emphasis",contains:[],variants:[{begin:/\*(?![*\s])/,end:/\*/},{
begin:/_(?![_\s])/,end:/_/,relevance:0}]},i=e.inherit(a,{contains:[]
}),s=e.inherit(r,{contains:[]});a.contains.push(s),r.contains.push(i)
;let o=[n,t];return[a,r,i,s].forEach((e=>{e.contains=e.contains.concat(o)
})),o=o.concat(a,r),{name:"Markdown",aliases:["md","mkdown","mkd"],contains:[{
className:"section",variants:[{begin:"^#{1,6}",end:"$",contains:o},{
begin:"(?=^.+?\\n[=-]{2,}$)",contains:[{begin:"^[=-]*$"},{begin:"^",end:"\\n",
contains:o}]}]},n,{className:"bullet",begin:"^[ \t]*([*+-]|(\\d+\\.))(?=\\s+)",
end:"\\s+",excludeEnd:!0},a,r,{className:"quote",begin:"^>\\s+",contains:o,
end:"$"},{className:"code",variants:[{begin:"(`{3,})[^`](.|\\n)*?\\1`*[ ]*"},{
begin:"(~{3,})[^~](.|\\n)*?\\1~*[ ]*"},{begin:"```",end:"```+[ ]*$"},{
begin:"~~~",end:"~~~+[ ]*$"},{begin:"`.+?`"},{begin:"(?=^( {4}|\\t))",
contains:[{begin:"^( {4}|\\t)",end:"(\\n)$"}],relevance:0}]},{
begin:"^[-\\*]{3,}",end:"$"},t,{begin:/^\[[^\n]+\]:/,returnBegin:!0,contains:[{
className:"symbol",begin:/\[/,end:/\]/,excludeBegin:!0,excludeEnd:!0},{
className:"link",begin:/:\s*/,end:/$/,excludeBegin:!0}]},{scope:"literal",
match:/&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/}]}},grmr_matlab:e=>{
const n="('|\\.')+",t={relevance:0,contains:[{begin:n}]};return{name:"Matlab",
keywords:{
keyword:"arguments break case catch classdef continue else elseif end enumeration events for function global if methods otherwise parfor persistent properties return spmd switch try while",
built_in:"sin sind sinh asin asind asinh cos cosd cosh acos acosd acosh tan tand tanh atan atand atan2 atanh sec secd sech asec asecd asech csc cscd csch acsc acscd acsch cot cotd coth acot acotd acoth hypot exp expm1 log log1p log10 log2 pow2 realpow reallog realsqrt sqrt nthroot nextpow2 abs angle complex conj imag real unwrap isreal cplxpair fix floor ceil round mod rem sign airy besselj bessely besselh besseli besselk beta betainc betaln ellipj ellipke erf erfc erfcx erfinv expint gamma gammainc gammaln psi legendre cross dot factor isprime primes gcd lcm rat rats perms nchoosek factorial cart2sph cart2pol pol2cart sph2cart hsv2rgb rgb2hsv zeros ones eye repmat rand randn linspace logspace freqspace meshgrid accumarray size length ndims numel disp isempty isequal isequalwithequalnans cat reshape diag blkdiag tril triu fliplr flipud flipdim rot90 find sub2ind ind2sub bsxfun ndgrid permute ipermute shiftdim circshift squeeze isscalar isvector ans eps realmax realmin pi i|0 inf nan isnan isinf isfinite j|0 why compan gallery hadamard hankel hilb invhilb magic pascal rosser toeplitz vander wilkinson max min nanmax nanmin mean nanmean type table readtable writetable sortrows sort figure plot plot3 scatter scatter3 cellfun legend intersect ismember procrustes hold num2cell "
},illegal:'(//|"|#|/\\*|\\s+/\\w+)',contains:[{className:"function",
beginKeywords:"function",end:"$",contains:[e.UNDERSCORE_TITLE_MODE,{
className:"params",variants:[{begin:"\\(",end:"\\)"},{begin:"\\[",end:"\\]"}]}]
},{className:"built_in",begin:/true|false/,relevance:0,starts:t},{
begin:"[a-zA-Z][a-zA-Z_0-9]*"+n,relevance:0},{className:"number",
begin:e.C_NUMBER_RE,relevance:0,starts:t},{className:"string",begin:"'",end:"'",
contains:[{begin:"''"}]},{begin:/\]|\}|\)/,relevance:0,starts:t},{
className:"string",begin:'"',end:'"',contains:[{begin:'""'}],starts:t
},e.COMMENT("^\\s*%\\{\\s*$","^\\s*%\\}\\s*$"),e.COMMENT("%","$")]}},
grmr_objectivec:e=>{const n=/[a-zA-Z@][a-zA-Z0-9_]*/,t={$pattern:n,
keyword:["@interface","@class","@protocol","@implementation"]};return{
name:"Objective-C",aliases:["mm","objc","obj-c","obj-c++","objective-c++"],
keywords:{"variable.language":["this","super"],$pattern:n,
keyword:["while","export","sizeof","typedef","const","struct","for","union","volatile","static","mutable","if","do","return","goto","enum","else","break","extern","asm","case","default","register","explicit","typename","switch","continue","inline","readonly","assign","readwrite","self","@synchronized","id","typeof","nonatomic","IBOutlet","IBAction","strong","weak","copy","in","out","inout","bycopy","byref","oneway","__strong","__weak","__block","__autoreleasing","@private","@protected","@public","@try","@property","@end","@throw","@catch","@finally","@autoreleasepool","@synthesize","@dynamic","@selector","@optional","@required","@encode","@package","@import","@defs","@compatibility_alias","__bridge","__bridge_transfer","__bridge_retained","__bridge_retain","__covariant","__contravariant","__kindof","_Nonnull","_Nullable","_Null_unspecified","__FUNCTION__","__PRETTY_FUNCTION__","__attribute__","getter","setter","retain","unsafe_unretained","nonnull","nullable","null_unspecified","null_resettable","class","instancetype","NS_DESIGNATED_INITIALIZER","NS_UNAVAILABLE","NS_REQUIRES_SUPER","NS_RETURNS_INNER_POINTER","NS_INLINE","NS_AVAILABLE","NS_DEPRECATED","NS_ENUM","NS_OPTIONS","NS_SWIFT_UNAVAILABLE","NS_ASSUME_NONNULL_BEGIN","NS_ASSUME_NONNULL_END","NS_REFINED_FOR_SWIFT","NS_SWIFT_NAME","NS_SWIFT_NOTHROW","NS_DURING","NS_HANDLER","NS_ENDHANDLER","NS_VALUERETURN","NS_VOIDRETURN"],
literal:["false","true","FALSE","TRUE","nil","YES","NO","NULL"],
built_in:["dispatch_once_t","dispatch_queue_t","dispatch_sync","dispatch_async","dispatch_once"],
type:["int","float","char","unsigned","signed","short","long","double","wchar_t","unichar","void","bool","BOOL","id|0","_Bool"]
},illegal:"</",contains:[{className:"built_in",
begin:"\\b(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)\\w+"
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,e.C_NUMBER_MODE,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,{
className:"string",variants:[{begin:'@"',end:'"',illegal:"\\n",
contains:[e.BACKSLASH_ESCAPE]}]},{className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,
keywords:{
keyword:"if else elif endif define undef warning error line pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},e.inherit(e.QUOTE_STRING_MODE,{
className:"string"}),{className:"string",begin:/<.*?>/,end:/$/,illegal:"\\n"
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{className:"class",
begin:"("+t.keyword.join("|")+")\\b",end:/(\{|$)/,excludeEnd:!0,keywords:t,
contains:[e.UNDERSCORE_TITLE_MODE]},{begin:"\\."+e.UNDERSCORE_IDENT_RE,
relevance:0}]}},grmr_perl:e=>{const n=e.regex,t=/[dualxmsipngr]{0,12}/,a={
$pattern:/[\w.]+/,
keyword:"abs accept alarm and atan2 bind binmode bless break caller chdir chmod chomp chop chown chr chroot class close closedir connect continue cos crypt dbmclose dbmopen defined delete die do dump each else elsif endgrent endhostent endnetent endprotoent endpwent endservent eof eval exec exists exit exp fcntl field fileno flock for foreach fork format formline getc getgrent getgrgid getgrnam gethostbyaddr gethostbyname gethostent getlogin getnetbyaddr getnetbyname getnetent getpeername getpgrp getpriority getprotobyname getprotobynumber getprotoent getpwent getpwnam getpwuid getservbyname getservbyport getservent getsockname getsockopt given glob gmtime goto grep gt hex if index int ioctl join keys kill last lc lcfirst length link listen local localtime log lstat lt ma map method mkdir msgctl msgget msgrcv msgsnd my ne next no not oct open opendir or ord our pack package pipe pop pos print printf prototype push q|0 qq quotemeta qw qx rand read readdir readline readlink readpipe recv redo ref rename require reset return reverse rewinddir rindex rmdir say scalar seek seekdir select semctl semget semop send setgrent sethostent setnetent setpgrp setpriority setprotoent setpwent setservent setsockopt shift shmctl shmget shmread shmwrite shutdown sin sleep socket socketpair sort splice split sprintf sqrt srand stat state study sub substr symlink syscall sysopen sysread sysseek system syswrite tell telldir tie tied time times tr truncate uc ucfirst umask undef unless unlink unpack unshift untie until use utime values vec wait waitpid wantarray warn when while write x|0 xor y|0"
},r={className:"subst",begin:"[$@]\\{",end:"\\}",keywords:a},i={begin:/->\{/,
end:/\}/},s={scope:"attr",match:/\s+:\s*\w+(\s*\(.*?\))?/},o={scope:"variable",
variants:[{begin:/\$\d/},{
begin:n.concat(/[$%@](?!")(\^\w\b|#\w+(::\w+)*|\{\w+\}|\w+(::\w*)*)/,"(?![A-Za-z])(?![@$%])")
},{begin:/[$%@](?!")[^\s\w{=]|\$=/,relevance:0}],contains:[s]},l={
className:"number",variants:[{match:/0?\.[0-9][0-9_]+\b/},{
match:/\bv?(0|[1-9][0-9_]*(\.[0-9_]+)?|[1-9][0-9_]*)\b/},{
match:/\b0[0-7][0-7_]*\b/},{match:/\b0x[0-9a-fA-F][0-9a-fA-F_]*\b/},{
match:/\b0b[0-1][0-1_]*\b/}],relevance:0
},c=[e.BACKSLASH_ESCAPE,r,o],d=[/!/,/\//,/\|/,/\?/,/'/,/"/,/#/],g=(e,a,r="\\1")=>{
const i="\\1"===r?r:n.concat(r,a)
;return n.concat(n.concat("(?:",e,")"),a,/(?:\\.|[^\\\/])*?/,i,/(?:\\.|[^\\\/])*?/,r,t)
},m=(e,a,r)=>n.concat(n.concat("(?:",e,")"),a,/(?:\\.|[^\\\/])*?/,r,t),u=[o,e.HASH_COMMENT_MODE,e.COMMENT(/^=\w/,/=cut/,{
endsWithParent:!0}),i,{className:"string",contains:c,variants:[{
begin:"q[qwxr]?\\s*\\(",end:"\\)",relevance:5},{begin:"q[qwxr]?\\s*\\[",
end:"\\]",relevance:5},{begin:"q[qwxr]?\\s*\\{",end:"\\}",relevance:5},{
begin:"q[qwxr]?\\s*\\|",end:"\\|",relevance:5},{begin:"q[qwxr]?\\s*<",end:">",
relevance:5},{begin:"qw\\s+q",end:"q",relevance:5},{begin:"'",end:"'",
contains:[e.BACKSLASH_ESCAPE]},{begin:'"',end:'"'},{begin:"`",end:"`",
contains:[e.BACKSLASH_ESCAPE]},{begin:/\{\w+\}/,relevance:0},{
begin:"-?\\w+\\s*=>",relevance:0}]},l,{
begin:"(\\/\\/|"+e.RE_STARTERS_RE+"|\\b(split|return|print|reverse|grep)\\b)\\s*",
keywords:"split return print reverse grep",relevance:0,
contains:[e.HASH_COMMENT_MODE,{className:"regexp",variants:[{
begin:g("s|tr|y",n.either(...d,{capture:!0}))},{begin:g("s|tr|y","\\(","\\)")},{
begin:g("s|tr|y","\\[","\\]")},{begin:g("s|tr|y","\\{","\\}")}],relevance:2},{
className:"regexp",variants:[{begin:/(m|qr)\/\//,relevance:0},{
begin:m("(?:m|qr)?",/\//,/\//)},{begin:m("m|qr",n.either(...d,{capture:!0
}),/\1/)},{begin:m("m|qr",/\(/,/\)/)},{begin:m("m|qr",/\[/,/\]/)},{
begin:m("m|qr",/\{/,/\}/)}]}]},{className:"function",beginKeywords:"sub method",
end:"(\\s*\\(.*?\\))?[;{]",excludeEnd:!0,relevance:5,contains:[e.TITLE_MODE,s]
},{className:"class",beginKeywords:"class",end:"[;{]",excludeEnd:!0,relevance:5,
contains:[e.TITLE_MODE,s,l]},{begin:"-\\w\\b",relevance:0},{begin:"^__DATA__$",
end:"^__END__$",subLanguage:"mojolicious",contains:[{begin:"^@@.*",end:"$",
className:"comment"}]}];return r.contains=u,i.contains=u,{name:"Perl",
aliases:["pl","pm"],keywords:a,contains:u}},grmr_php:e=>{
const n=e.regex,t=/(?![A-Za-z0-9])(?![$])/,a=n.concat(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,t),r=n.concat(/(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,t),i=n.concat(/[A-Z]+/,t),s={
scope:"variable",match:"\\$+"+a},o={scope:"subst",variants:[{begin:/\$\w+/},{
begin:/\{\$/,end:/\}/}]},l=e.inherit(e.APOS_STRING_MODE,{illegal:null
}),c="[ \t\n]",d={scope:"string",variants:[e.inherit(e.QUOTE_STRING_MODE,{
illegal:null,contains:e.QUOTE_STRING_MODE.contains.concat(o)}),l,{
begin:/<<<[ \t]*(?:(\w+)|"(\w+)")\n/,end:/[ \t]*(\w+)\b/,
contains:e.QUOTE_STRING_MODE.contains.concat(o),"on:begin":(e,n)=>{
n.data._beginMatch=e[1]||e[2]},"on:end":(e,n)=>{
n.data._beginMatch!==e[1]&&n.ignoreMatch()}},e.END_SAME_AS_BEGIN({
begin:/<<<[ \t]*'(\w+)'\n/,end:/[ \t]*(\w+)\b/})]},g={scope:"number",variants:[{
begin:"\\b0[bB][01]+(?:_[01]+)*\\b"},{begin:"\\b0[oO][0-7]+(?:_[0-7]+)*\\b"},{
begin:"\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b"},{
begin:"(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?"
}],relevance:0
},m=["false","null","true"],u=["__CLASS__","__DIR__","__FILE__","__FUNCTION__","__COMPILER_HALT_OFFSET__","__LINE__","__METHOD__","__NAMESPACE__","__TRAIT__","die","echo","exit","include","include_once","print","require","require_once","array","abstract","and","as","binary","bool","boolean","break","callable","case","catch","class","clone","const","continue","declare","default","do","double","else","elseif","empty","enddeclare","endfor","endforeach","endif","endswitch","endwhile","enum","eval","extends","final","finally","float","for","foreach","from","global","goto","if","implements","instanceof","insteadof","int","integer","interface","isset","iterable","list","match|0","mixed","new","never","object","or","private","protected","public","readonly","real","return","string","switch","throw","trait","try","unset","use","var","void","while","xor","yield"],_=["Error|0","AppendIterator","ArgumentCountError","ArithmeticError","ArrayIterator","ArrayObject","AssertionError","BadFunctionCallException","BadMethodCallException","CachingIterator","CallbackFilterIterator","CompileError","Countable","DirectoryIterator","DivisionByZeroError","DomainException","EmptyIterator","ErrorException","Exception","FilesystemIterator","FilterIterator","GlobIterator","InfiniteIterator","InvalidArgumentException","IteratorIterator","LengthException","LimitIterator","LogicException","MultipleIterator","NoRewindIterator","OutOfBoundsException","OutOfRangeException","OuterIterator","OverflowException","ParentIterator","ParseError","RangeException","RecursiveArrayIterator","RecursiveCachingIterator","RecursiveCallbackFilterIterator","RecursiveDirectoryIterator","RecursiveFilterIterator","RecursiveIterator","RecursiveIteratorIterator","RecursiveRegexIterator","RecursiveTreeIterator","RegexIterator","RuntimeException","SeekableIterator","SplDoublyLinkedList","SplFileInfo","SplFileObject","SplFixedArray","SplHeap","SplMaxHeap","SplMinHeap","SplObjectStorage","SplObserver","SplPriorityQueue","SplQueue","SplStack","SplSubject","SplTempFileObject","TypeError","UnderflowException","UnexpectedValueException","UnhandledMatchError","ArrayAccess","BackedEnum","Closure","Fiber","Generator","Iterator","IteratorAggregate","Serializable","Stringable","Throwable","Traversable","UnitEnum","WeakReference","WeakMap","Directory","__PHP_Incomplete_Class","parent","php_user_filter","self","static","stdClass"],p={
keyword:u,literal:(e=>{const n=[];return e.forEach((e=>{
n.push(e),e.toLowerCase()===e?n.push(e.toUpperCase()):n.push(e.toLowerCase())
})),n})(m),built_in:_},b=e=>e.map((e=>e.replace(/\|\d+$/,""))),f={variants:[{
match:[/new/,n.concat(c,"+"),n.concat("(?!",b(_).join("\\b|"),"\\b)"),r],scope:{
1:"keyword",4:"title.class"}}]},h=n.concat(a,"\\b(?!\\()"),E={variants:[{
match:[n.concat(/::/,n.lookahead(/(?!class\b)/)),h],scope:{2:"variable.constant"
}},{match:[/::/,/class/],scope:{2:"variable.language"}},{
match:[r,n.concat(/::/,n.lookahead(/(?!class\b)/)),h],scope:{1:"title.class",
3:"variable.constant"}},{match:[r,n.concat("::",n.lookahead(/(?!class\b)/))],
scope:{1:"title.class"}},{match:[r,/::/,/class/],scope:{1:"title.class",
3:"variable.language"}}]},x={scope:"attr",
match:n.concat(a,n.lookahead(":"),n.lookahead(/(?!::)/))},y={relevance:0,
begin:/\(/,end:/\)/,keywords:p,contains:[x,s,E,e.C_BLOCK_COMMENT_MODE,d,g,f]
},v={relevance:0,
match:[/\b/,n.concat("(?!fn\\b|function\\b|",b(u).join("\\b|"),"|",b(_).join("\\b|"),"\\b)"),a,n.concat(c,"*"),n.lookahead(/(?=\()/)],
scope:{3:"title.function.invoke"},contains:[y]};y.contains.push(v)
;const w=[x,E,e.C_BLOCK_COMMENT_MODE,d,g,f],N={
begin:n.concat(/#\[\s*\\?/,n.either(r,i)),beginScope:"meta",end:/]/,
endScope:"meta",keywords:{literal:m,keyword:["new","array"]},contains:[{
begin:/\[/,end:/]/,keywords:{literal:m,keyword:["new","array"]},
contains:["self",...w]},...w,{scope:"meta",variants:[{match:r},{match:i}]}]}
;return{case_insensitive:!1,keywords:p,
contains:[N,e.HASH_COMMENT_MODE,e.COMMENT("//","$"),e.COMMENT("/\\*","\\*/",{
contains:[{scope:"doctag",match:"@[A-Za-z]+"}]}),{match:/__halt_compiler\(\);/,
keywords:"__halt_compiler",starts:{scope:"comment",end:e.MATCH_NOTHING_RE,
contains:[{match:/\?>/,scope:"meta",endsParent:!0}]}},{scope:"meta",variants:[{
begin:/<\?php/,relevance:10},{begin:/<\?=/},{begin:/<\?/,relevance:.1},{
begin:/\?>/}]},{scope:"variable.language",match:/\$this\b/},s,v,E,{
match:[/const/,/\s/,a],scope:{1:"keyword",3:"variable.constant"}},f,{
scope:"function",relevance:0,beginKeywords:"fn function",end:/[;{]/,
excludeEnd:!0,illegal:"[$%\\[]",contains:[{beginKeywords:"use"
},e.UNDERSCORE_TITLE_MODE,{begin:"=>",endsParent:!0},{scope:"params",
begin:"\\(",end:"\\)",excludeBegin:!0,excludeEnd:!0,keywords:p,
contains:["self",N,s,E,e.C_BLOCK_COMMENT_MODE,d,g]}]},{scope:"class",variants:[{
beginKeywords:"enum",illegal:/[($"]/},{beginKeywords:"class interface trait",
illegal:/[:($"]/}],relevance:0,end:/\{/,excludeEnd:!0,contains:[{
beginKeywords:"extends implements"},e.UNDERSCORE_TITLE_MODE]},{
beginKeywords:"namespace",relevance:0,end:";",illegal:/[.']/,
contains:[e.inherit(e.UNDERSCORE_TITLE_MODE,{scope:"title.class"})]},{
beginKeywords:"use",relevance:0,end:";",contains:[{
match:/\b(as|const|function)\b/,scope:"keyword"},e.UNDERSCORE_TITLE_MODE]},d,g]}
},grmr_plaintext:e=>({name:"Plain text",aliases:["text","txt"],
disableAutodetect:!0}),grmr_python:e=>{
const n=e.regex,t=/[\p{XID_Start}_]\p{XID_Continue}*/u,a=["and","as","assert","async","await","break","case","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","match","nonlocal|10","not","or","pass","raise","return","try","while","with","yield"],r={
$pattern:/[A-Za-z]\w+|__\w+__/,keyword:a,
built_in:["__import__","abs","all","any","ascii","bin","bool","breakpoint","bytearray","bytes","callable","chr","classmethod","compile","complex","delattr","dict","dir","divmod","enumerate","eval","exec","filter","float","format","frozenset","getattr","globals","hasattr","hash","help","hex","id","input","int","isinstance","issubclass","iter","len","list","locals","map","max","memoryview","min","next","object","oct","open","ord","pow","print","property","range","repr","reversed","round","set","setattr","slice","sorted","staticmethod","str","sum","super","tuple","type","vars","zip"],
literal:["__debug__","Ellipsis","False","None","NotImplemented","True"],
type:["Any","Callable","Coroutine","Dict","List","Literal","Generic","Optional","Sequence","Set","Tuple","Type","Union"]
},i={className:"meta",begin:/^(>>>|\.\.\.) /},s={className:"subst",begin:/\{/,
end:/\}/,keywords:r,illegal:/#/},o={begin:/\{\{/,relevance:0},l={
className:"string",contains:[e.BACKSLASH_ESCAPE],variants:[{
begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,end:/'''/,
contains:[e.BACKSLASH_ESCAPE,i],relevance:10},{
begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,end:/"""/,
contains:[e.BACKSLASH_ESCAPE,i],relevance:10},{
begin:/([fF][rR]|[rR][fF]|[fF])'''/,end:/'''/,
contains:[e.BACKSLASH_ESCAPE,i,o,s]},{begin:/([fF][rR]|[rR][fF]|[fF])"""/,
end:/"""/,contains:[e.BACKSLASH_ESCAPE,i,o,s]},{begin:/([uU]|[rR])'/,end:/'/,
relevance:10},{begin:/([uU]|[rR])"/,end:/"/,relevance:10},{
begin:/([bB]|[bB][rR]|[rR][bB])'/,end:/'/},{begin:/([bB]|[bB][rR]|[rR][bB])"/,
end:/"/},{begin:/([fF][rR]|[rR][fF]|[fF])'/,end:/'/,
contains:[e.BACKSLASH_ESCAPE,o,s]},{begin:/([fF][rR]|[rR][fF]|[fF])"/,end:/"/,
contains:[e.BACKSLASH_ESCAPE,o,s]},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]
},c="[0-9](_?[0-9])*",d=`(\\b(${c}))?\\.(${c})|\\b(${c})\\.`,g="\\b|"+a.join("|"),m={
className:"number",relevance:0,variants:[{
begin:`(\\b(${c})|(${d}))[eE][+-]?(${c})[jJ]?(?=${g})`},{begin:`(${d})[jJ]?`},{
begin:`\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${g})`},{
begin:`\\b0[bB](_?[01])+[lL]?(?=${g})`},{begin:`\\b0[oO](_?[0-7])+[lL]?(?=${g})`
},{begin:`\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${g})`},{begin:`\\b(${c})[jJ](?=${g})`
}]},u={className:"comment",begin:n.lookahead(/# type:/),end:/$/,keywords:r,
contains:[{begin:/# type:/},{begin:/#/,end:/\b\B/,endsWithParent:!0}]},_={
className:"params",variants:[{className:"",begin:/\(\s*\)/,skip:!0},{begin:/\(/,
end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:r,
contains:["self",i,m,l,e.HASH_COMMENT_MODE]}]};return s.contains=[l,m,i],{
name:"Python",aliases:["py","gyp","ipython"],unicodeRegex:!0,keywords:r,
illegal:/(<\/|\?)|=>/,contains:[i,m,{scope:"variable.language",match:/\bself\b/
},{beginKeywords:"if",relevance:0},{match:/\bor\b/,scope:"keyword"
},l,u,e.HASH_COMMENT_MODE,{match:[/\bdef/,/\s+/,t],scope:{1:"keyword",
3:"title.function"},contains:[_]},{variants:[{
match:[/\bclass/,/\s+/,t,/\s*/,/\(\s*/,t,/\s*\)/]},{match:[/\bclass/,/\s+/,t]}],
scope:{1:"keyword",3:"title.class",6:"title.class.inherited"}},{
className:"meta",begin:/^[\t ]*@/,end:/(?=#)|$/,contains:[m,_,l]}]}},
grmr_pyxlscript:e=>{var n={
keyword:"assert todo debug_pause debug_print|4 debug_watch with_camera let|2 const mod local preserving_transform|10 for at in and or xor not with while until if then else push_mode pop_mode reset_game set_mode return def break continue default bitand bitnot bitor bitxor bitshl bitshr because quit_game launch_game deg true false nan IDE_USER VIEW_ARRAY HOST_CODE SCREEN_SIZE pi epsilon infinity nil|2 \u221e \xbd \u2153 \u2154 \xbc \xbe \u2155 \u2156 \u2157 \u2158 \u2159 \u2150 \u215b \u2151 \u2152 \xb0 \u03b5 \u03c0 \u2205 \u221e \u2070 \xb9 \xb2 \xb3 \u2074 \u2075 \u2076 \u2077 \u2078 \u2079 CREDITS CONSTANTS ASSETS SOURCE_LOCATION midi gamepad_array touch joy",
built_in:"set_screen_size ray_intersect ray_intersect_map up_y draw_bounds draw_disk reset_clip reset_transform set_clip draw_line draw_sprite_corner_rect intersect_clip draw_point draw_corner_rect reset_camera set_camera get_camera draw_rect get_background set_background text_width sprite_transfer_orientation sprite_pixel_color draw_sprite draw_text draw_tri draw_poly get_transform get_clip rotation_sign sign_nonzero set_transform xy xz_to_xyz xy_to_angle angle_to_xy xy_to_xyz xz_to_xy xy_to_xz xz xyz any_button_press any_button_release draw_map draw_map_span map_resize map_generate_maze map_resize get_mode get_previous_mode get_map_pixel_color get_map_pixel_color_by_ws_coord get_map_sprite set_map_sprite get_map_sprite_by_ws_coord set_map_sprite_by_ws_coord parse unparse format_number capitalized uppercase lowercase titlecase capitalized resume_audio get_audio_status ray_value play_sound stop_audio game_frames mode_frames delay sequence add_frame_hook make_spline remove_frame_hook make_entity entity_mass entity_move entity_inertia entity_area draw_entity overlaps entity_remove_all entity_add_child entity_remove_child entity_update_children entity_simulate split utc_now now game_frames mode_frames replace starts_with ends_with find_move make_move_finder map_find_path find_path make_array join entity_apply_fluid_force entity_projected_length entity_point_vel entity_apply_force entity_apply_impulse perp gray rgb rgba artist_hsv_to_rgb hsv hsva penultimate_value last_value last_key insert reverse reversed call set_post_effects get_post_effects reset_post_effects push_front utc_time local_time device_control physics_add_contact_callback physics_entity_contacts physics_entity_has_contacts physics_add_entity physics_remove_entity physics_remove_all physics_attach physics_detach make_physics make_contact_group draw_physics physics_simulate min max mid find_max_value find_min_value max_value min_value abs acos atan asin sign sign_nonzero cos clamp hash linstep convex_hull smoothstep lerp lerp_angle smootherstep perceptual_lerp_color log log2 log10 noise oscillate pow make_random random_from_distribution random_sign random_integer random_within_cube random_within_tri random_within_region random_within_sphere random_on_sphere random_within_circle random_within_region random_within_square random_on_square random_on_circle random_direction2D random_direction3D random_key random_value random_gaussian3D random_on_cube random_gaussian random_gaussian2D random_truncated_gaussian random_truncated_gaussian2D random_truncated_gaussian3D evaluate_constant_expression \u03be sqrt cbrt sin set_random_seed tan conncatenate extend extended make_bot_gamepad update_bot_gamepad deep_immutable_clone deep_clone clone copy draw_previous_mode cross direction dot equivalent magnitude magnitude_squared max_component min_component xy xyz midi_send_raw trim_spaces slice set_pause_menu iterate iterate_pairs contains fast_remove_key find keys remove_key shuffle shuffled sort values sorted resize push pop pop_front push_front fast_remove_value remove_values remove_all round floor ceil todo debug_pause debug_print resized set_playback_rate set_pitch set_volume set_pan set_loop remove_frame_hooks_by_mode type is_string is_function is_nan is_object is_nil is_boolean is_number is_array rgb_to_xyz axis_aligned_draw_box animation_frame load_local save_local transform_map_layer_to_ws_z transform_ws_z_to_ss_z transform_ws_z_to_map_layer transform_map_space_to_ws transform_ws_to_map_space transform_cs_to_ss transform_cs_z_to_ws_z transform_ws_z_to_cs_z transform_ss_to_cs transform_cs_to_ws transform_ws_to_cs transform_es_to_es transform_es_to_sprite_space transform_sprite_space_to_es transform_to transform_from transform_es_to_ws transform_ws_to_ws transform_to_parent transform_to_child compose_transform transform_ws_to_es transform_cs_z_to_ss_z transform_ss_z_to_cs_z transform_ss_to_ws transform_ws_to_ss array_value string_compress string_decompress pause_menu stop_hosting start_hosting disconnect_guest swap pass_through unparse_hex_color xyz_to_rgb ABS ADD DIV MAD SUM PROD MUL SUB FLOOR CEIL ROUND MAX MIN MEAN MEAN3 MEAN4 SIGN CLAMP LERP RGB_ADD RGB_ADD_RGB RGB_SUB_RGB RGB_MUL_RGB RGB_DIV_RGB RGB_DISTANCE RGB_MUL RGB_DIV RGB_DOT_RGB RGB_LERP RGBA_ADD_RGBA RGBA_SUB_RGBA RGBA_MUL_RGBA RGBA_DIV_RGBA RGBA_MUL RGBA_DIV RGBA_DOT_RGBA RGBA_LERP XY_DISTANCE XZ_DISTANCE XYZ_DISTANCE XY_MAD_S_XY XY_MAD_XY_XY XY_ADD_XY XY_SUB_XY XY_MUL_XY XY_DIV_XY XY_MUL XY_DIV XY_DOT_XY XY_CRS_XY XZ_ADD_XZ XZ_SUB_XZ XZ_MUL_XZ XZ_DIV_XZ XZ_MUL XZ_DIV XZ_DOT_XZ XYZ_DIRECTION XYZ_ADD_XYZ XYZ_SUB_XYZ XYZ_MAD_S_XYZ XYZ_MUL_XYZ XYZ_DIV_XYZ XYZ_MUL XYZ_DIV XYZ_DOT_XYZ XYZ_CRS_XYZ XY_LERP XYZ_LERP XZ_LERP XY_DIRECTION XY_MAGNITUDE XZ_MAGNITUDE XYZ_MAGNITUDE MAT3x3_ORTHONORMALIZE MAT2x2_MATMUL_XY XZ_DIRECTION MAT2x2_MATMUL_XZ MAT3x3_MATMUL_XYZ MAT3x4_MATMUL_XYZ MAT3x4_MATMUL_XYZW"
},t={className:"subst",begin:/\{/,end:/\}/,keywords:n},a={className:"string",
contains:[e.BACKSLASH_ESCAPE],variants:[{begin:/(u|r|ur)"/,end:/"/,relevance:10
},{begin:/(b|br)"/,end:/"/},{begin:/(fr|rf|f)"/,end:/"/,
contains:[e.BACKSLASH_ESCAPE,t]},e.QUOTE_STRING_MODE]},r={className:"number",
relevance:0,variants:[{
begin:/\u2205|[+-]?[\u221e\u03b5\u03c0\xbd\u2153\u2154\xbc\xbe\u2155\u2156\u2157\u2158\u2159\u2150\u215b\u2151\u2152`]/
},{begin:/#[0-7a-fA-F]+/},{begin:/\b[+-]?(\d*\.)?\d+(%|deg|\xb0)?/},{
begin:/[\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089\u2070\xb9\xb2\xb3\u2074\u2075\u2076\u2077\u2078\u2079]/
}]},i={className:"params",begin:/\(/,end:/\)/,contains:[r,a]}
;return t.contains=[a,r],{aliases:["pyxlscript"],keywords:n,
illegal:/(<\/|->|\?)|=>|@|\$/,contains:[{className:"section",relevance:10,
variants:[{
begin:/^[^\n]+?\\n(-|\u2500|\u2014|\u2501|\u23af|=|\u2550|\u268c){5,}/}]},r,a,{
className:"built_in",variants:[{begin:/\b(loop|size|random)(?=\()/}]
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{variants:[{className:"function",
beginKeywords:"def"}],end:/:/,illegal:/[${=;\n,]/,
contains:[e.UNDERSCORE_TITLE_MODE,i,{begin:/->/,endsWithParent:!0,
keywords:"None"}]}]}},grmr_r:e=>{
const n=e.regex,t=/(?:(?:[a-zA-Z]|\.[._a-zA-Z])[._a-zA-Z0-9]*)|\.(?!\d)/,a=n.either(/0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?\d+i?/,/0[xX][0-9a-fA-F]+(?:[pP][+-]?\d+)?[Li]?/,/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[Li]?/),r=/[=!<>:]=|\|\||&&|:::?|<-|<<-|->>|->|\|>|[-+*\/?!$&|:<=>@^~]|\*\*/,i=n.either(/[()]/,/[{}]/,/\[\[/,/[[\]]/,/\\/,/,/)
;return{name:"R",keywords:{$pattern:t,
keyword:"function if in break next repeat else for while",
literal:"NULL NA TRUE FALSE Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 NA_complex_|10",
built_in:"LETTERS letters month.abb month.name pi T F abs acos acosh all any anyNA Arg as.call as.character as.complex as.double as.environment as.integer as.logical as.null.default as.numeric as.raw asin asinh atan atanh attr attributes baseenv browser c call ceiling class Conj cos cosh cospi cummax cummin cumprod cumsum digamma dim dimnames emptyenv exp expression floor forceAndCall gamma gc.time globalenv Im interactive invisible is.array is.atomic is.call is.character is.complex is.double is.environment is.expression is.finite is.function is.infinite is.integer is.language is.list is.logical is.matrix is.na is.name is.nan is.null is.numeric is.object is.pairlist is.raw is.recursive is.single is.symbol lazyLoadDBfetch length lgamma list log max min missing Mod names nargs nzchar oldClass on.exit pos.to.env proc.time prod quote range Re rep retracemem return round seq_along seq_len seq.int sign signif sin sinh sinpi sqrt standardGeneric substitute sum switch tan tanh tanpi tracemem trigamma trunc unclass untracemem UseMethod xtfrm"
},contains:[e.COMMENT(/#'/,/$/,{contains:[{scope:"doctag",match:/@examples/,
starts:{end:n.lookahead(n.either(/\n^#'\s*(?=@[a-zA-Z]+)/,/\n^(?!#')/)),
endsParent:!0}},{scope:"doctag",begin:"@param",end:/$/,contains:[{
scope:"variable",variants:[{match:t},{match:/`(?:\\.|[^`\\])+`/}],endsParent:!0
}]},{scope:"doctag",match:/@[a-zA-Z]+/},{scope:"keyword",match:/\\[a-zA-Z]+/}]
}),e.HASH_COMMENT_MODE,{scope:"string",contains:[e.BACKSLASH_ESCAPE],
variants:[e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\(/,end:/\)(-*)"/
}),e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\{/,end:/\}(-*)"/
}),e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\[/,end:/\](-*)"/
}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\(/,end:/\)(-*)'/
}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\{/,end:/\}(-*)'/
}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\[/,end:/\](-*)'/}),{begin:'"',end:'"',
relevance:0},{begin:"'",end:"'",relevance:0}]},{relevance:0,variants:[{scope:{
1:"operator",2:"number"},match:[r,a]},{scope:{1:"operator",2:"number"},
match:[/%[^%]*%/,a]},{scope:{1:"punctuation",2:"number"},match:[i,a]},{scope:{
2:"number"},match:[/[^a-zA-Z0-9._]|^/,a]}]},{scope:{3:"operator"},
match:[t,/\s+/,/<-/,/\s+/]},{scope:"operator",relevance:0,variants:[{match:r},{
match:/%[^%]*%/}]},{scope:"punctuation",relevance:0,match:i},{begin:"`",end:"`",
contains:[{begin:/\\./}]}]}},grmr_ruby:e=>{
const n=e.regex,t="([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)",a=n.either(/\b([A-Z]+[a-z0-9]+)+/,/\b([A-Z]+[a-z0-9]+)+[A-Z]+/),r=n.concat(a,/(::\w+)*/),i={
"variable.constant":["__FILE__","__LINE__","__ENCODING__"],
"variable.language":["self","super"],
keyword:["alias","and","begin","BEGIN","break","case","class","defined","do","else","elsif","end","END","ensure","for","if","in","module","next","not","or","redo","require","rescue","retry","return","then","undef","unless","until","when","while","yield","include","extend","prepend","public","private","protected","raise","throw"],
built_in:["proc","lambda","attr_accessor","attr_reader","attr_writer","define_method","private_constant","module_function"],
literal:["true","false","nil"]},s={className:"doctag",begin:"@[A-Za-z]+"},o={
begin:"#<",end:">"},l=[e.COMMENT("#","$",{contains:[s]
}),e.COMMENT("^=begin","^=end",{contains:[s],relevance:10
}),e.COMMENT("^__END__",e.MATCH_NOTHING_RE)],c={className:"subst",begin:/#\{/,
end:/\}/,keywords:i},d={className:"string",contains:[e.BACKSLASH_ESCAPE,c],
variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/},{begin:/`/,end:/`/},{
begin:/%[qQwWx]?\(/,end:/\)/},{begin:/%[qQwWx]?\[/,end:/\]/},{
begin:/%[qQwWx]?\{/,end:/\}/},{begin:/%[qQwWx]?</,end:/>/},{begin:/%[qQwWx]?\//,
end:/\//},{begin:/%[qQwWx]?%/,end:/%/},{begin:/%[qQwWx]?-/,end:/-/},{
begin:/%[qQwWx]?\|/,end:/\|/},{begin:/\B\?(\\\d{1,3})/},{
begin:/\B\?(\\x[A-Fa-f0-9]{1,2})/},{begin:/\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/},{
begin:/\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/},{
begin:/\B\?\\(c|C-)[\x20-\x7e]/},{begin:/\B\?\\?\S/},{
begin:n.concat(/<<[-~]?'?/,n.lookahead(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)),
contains:[e.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,
contains:[e.BACKSLASH_ESCAPE,c]})]}]},g="[0-9](_?[0-9])*",m={className:"number",
relevance:0,variants:[{
begin:`\\b([1-9](_?[0-9])*|0)(\\.(${g}))?([eE][+-]?(${g})|r)?i?\\b`},{
begin:"\\b0[dD][0-9](_?[0-9])*r?i?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*r?i?\\b"
},{begin:"\\b0[oO][0-7](_?[0-7])*r?i?\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b"},{
begin:"\\b0(_?[0-7])+r?i?\\b"}]},u={variants:[{match:/\(\)/},{
className:"params",begin:/\(/,end:/(?=\))/,excludeBegin:!0,endsParent:!0,
keywords:i}]},_=[d,{variants:[{match:[/class\s+/,r,/\s+<\s+/,r]},{
match:[/\b(class|module)\s+/,r]}],scope:{2:"title.class",
4:"title.class.inherited"},keywords:i},{match:[/(include|extend)\s+/,r],scope:{
2:"title.class"},keywords:i},{relevance:0,match:[r,/\.new[. (]/],scope:{
1:"title.class"}},{relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,
className:"variable.constant"},{relevance:0,match:a,scope:"title.class"},{
match:[/def/,/\s+/,t],scope:{1:"keyword",3:"title.function"},contains:[u]},{
begin:e.IDENT_RE+"::"},{className:"symbol",
begin:e.UNDERSCORE_IDENT_RE+"(!|\\?)?:",relevance:0},{className:"symbol",
begin:":(?!\\s)",contains:[d,{begin:t}],relevance:0},m,{className:"variable",
begin:"(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])"},{
className:"params",begin:/\|(?!=)/,end:/\|/,excludeBegin:!0,excludeEnd:!0,
relevance:0,keywords:i},{begin:"("+e.RE_STARTERS_RE+"|unless)\\s*",
keywords:"unless",contains:[{className:"regexp",contains:[e.BACKSLASH_ESCAPE,c],
illegal:/\n/,variants:[{begin:"/",end:"/[a-z]*"},{begin:/%r\{/,end:/\}[a-z]*/},{
begin:"%r\\(",end:"\\)[a-z]*"},{begin:"%r!",end:"![a-z]*"},{begin:"%r\\[",
end:"\\][a-z]*"}]}].concat(o,l),relevance:0}].concat(o,l)
;c.contains=_,u.contains=_;const p=[{begin:/^\s*=>/,starts:{end:"$",contains:_}
},{className:"meta.prompt",
begin:"^([>?]>|[\\w#]+\\(\\w+\\):\\d+:\\d+[>*]|(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>)(?=[ ])",
starts:{end:"$",keywords:i,contains:_}}];return l.unshift(o),{name:"Ruby",
aliases:["rb","gemspec","podspec","thor","irb"],keywords:i,illegal:/\/\*/,
contains:[e.SHEBANG({binary:"ruby"})].concat(p).concat(l).concat(_)}},
grmr_rust:e=>{
const n=e.regex,t=/(r#)?/,a=n.concat(t,e.UNDERSCORE_IDENT_RE),r=n.concat(t,e.IDENT_RE),i={
className:"title.function.invoke",relevance:0,
begin:n.concat(/\b/,/(?!let|for|while|if|else|match\b)/,r,n.lookahead(/\s*\(/))
},s="([ui](8|16|32|64|128|size)|f(32|64))?",o=["drop ","Copy","Send","Sized","Sync","Drop","Fn","FnMut","FnOnce","ToOwned","Clone","Debug","PartialEq","PartialOrd","Eq","Ord","AsRef","AsMut","Into","From","Default","Iterator","Extend","IntoIterator","DoubleEndedIterator","ExactSizeIterator","SliceConcatExt","ToString","assert!","assert_eq!","bitflags!","bytes!","cfg!","col!","concat!","concat_idents!","debug_assert!","debug_assert_eq!","env!","eprintln!","panic!","file!","format!","format_args!","include_bytes!","include_str!","line!","local_data_key!","module_path!","option_env!","print!","println!","select!","stringify!","try!","unimplemented!","unreachable!","vec!","write!","writeln!","macro_rules!","assert_ne!","debug_assert_ne!"],l=["i8","i16","i32","i64","i128","isize","u8","u16","u32","u64","u128","usize","f32","f64","str","char","bool","Box","Option","Result","String","Vec"]
;return{name:"Rust",aliases:["rs"],keywords:{$pattern:e.IDENT_RE+"!?",type:l,
keyword:["abstract","as","async","await","become","box","break","const","continue","crate","do","dyn","else","enum","extern","false","final","fn","for","if","impl","in","let","loop","macro","match","mod","move","mut","override","priv","pub","ref","return","self","Self","static","struct","super","trait","true","try","type","typeof","union","unsafe","unsized","use","virtual","where","while","yield"],
literal:["true","false","Some","None","Ok","Err"],built_in:o},illegal:"</",
contains:[e.C_LINE_COMMENT_MODE,e.COMMENT("/\\*","\\*/",{contains:["self"]
}),e.inherit(e.QUOTE_STRING_MODE,{begin:/b?"/,illegal:null}),{
className:"symbol",begin:/'[a-zA-Z_][a-zA-Z0-9_]*(?!')/},{scope:"string",
variants:[{begin:/b?r(#*)"(.|\n)*?"\1(?!#)/},{begin:/b?'/,end:/'/,contains:[{
scope:"char.escape",match:/\\('|\w|x\w{2}|u\w{4}|U\w{8})/}]}]},{
className:"number",variants:[{begin:"\\b0b([01_]+)"+s},{begin:"\\b0o([0-7_]+)"+s
},{begin:"\\b0x([A-Fa-f0-9_]+)"+s},{
begin:"\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)"+s}],relevance:0},{
begin:[/fn/,/\s+/,a],className:{1:"keyword",3:"title.function"}},{
className:"meta",begin:"#!?\\[",end:"\\]",contains:[{className:"string",
begin:/"/,end:/"/,contains:[e.BACKSLASH_ESCAPE]}]},{
begin:[/let/,/\s+/,/(?:mut\s+)?/,a],className:{1:"keyword",3:"keyword",
4:"variable"}},{begin:[/for/,/\s+/,a,/\s+/,/in/],className:{1:"keyword",
3:"variable",5:"keyword"}},{begin:[/type/,/\s+/,a],className:{1:"keyword",
3:"title.class"}},{begin:[/(?:trait|enum|struct|union|impl|for)/,/\s+/,a],
className:{1:"keyword",3:"title.class"}},{begin:e.IDENT_RE+"::",keywords:{
keyword:"Self",built_in:o,type:l}},{className:"punctuation",begin:"->"},i]}},
grmr_scheme:e=>{
const n="[^\\(\\)\\[\\]\\{\\}\",'`;#|\\\\\\s]+",t="(-|\\+)?\\d+([./]\\d+)?",a={
$pattern:n,
built_in:"case-lambda call/cc class define-class exit-handler field import inherit init-field interface let*-values let-values let/ec mixin opt-lambda override protect provide public rename require require-for-syntax syntax syntax-case syntax-error unit/sig unless when with-syntax and begin call-with-current-continuation call-with-input-file call-with-output-file case cond define define-syntax delay do dynamic-wind else for-each if lambda let let* let-syntax letrec letrec-syntax map or syntax-rules ' * + , ,@ - ... / ; < <= = => > >= ` abs acos angle append apply asin assoc assq assv atan boolean? caar cadr call-with-input-file call-with-output-file call-with-values car cdddar cddddr cdr ceiling char->integer char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? char-downcase char-lower-case? char-numeric? char-ready? char-upcase char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? char? close-input-port close-output-port complex? cons cos current-input-port current-output-port denominator display eof-object? eq? equal? eqv? eval even? exact->inexact exact? exp expt floor force gcd imag-part inexact->exact inexact? input-port? integer->char integer? interaction-environment lcm length list list->string list->vector list-ref list-tail list? load log magnitude make-polar make-rectangular make-string make-vector max member memq memv min modulo negative? newline not null-environment null? number->string number? numerator odd? open-input-file open-output-file output-port? pair? peek-char port? positive? procedure? quasiquote quote quotient rational? rationalize read read-char real-part real? remainder reverse round scheme-report-environment set! set-car! set-cdr! sin sqrt string string->list string->number string->symbol string-append string-ci<=? string-ci<? string-ci=? string-ci>=? string-ci>? string-copy string-fill! string-length string-ref string-set! string<=? string<? string=? string>=? string>? string? substring symbol->string symbol? tan transcript-off transcript-on truncate values vector vector->list vector-fill! vector-length vector-ref vector-set! with-input-from-file with-output-to-file write write-char zero?"
},r={className:"literal",begin:"(#t|#f|#\\\\"+n+"|#\\\\.)"},i={
className:"number",variants:[{begin:t,relevance:0},{begin:t+"[+\\-]"+t+"i",
relevance:0},{begin:"#b[0-1]+(/[0-1]+)?"},{begin:"#o[0-7]+(/[0-7]+)?"},{
begin:"#x[0-9a-f]+(/[0-9a-f]+)?"}]},s=e.QUOTE_STRING_MODE,o=[e.COMMENT(";","$",{
relevance:0}),e.COMMENT("#\\|","\\|#")],l={begin:n,relevance:0},c={
className:"symbol",begin:"'"+n},d={endsWithParent:!0,relevance:0},g={variants:[{
begin:/'/},{begin:"`"}],contains:[{begin:"\\(",end:"\\)",
contains:["self",r,s,i,l,c]}]},m={className:"name",relevance:0,begin:n,
keywords:a},u={variants:[{begin:"\\(",end:"\\)"},{begin:"\\[",end:"\\]"}],
contains:[{begin:/lambda/,endsWithParent:!0,returnBegin:!0,contains:[m,{
endsParent:!0,variants:[{begin:/\(/,end:/\)/},{begin:/\[/,end:/\]/}],
contains:[l]}]},m,d]};return d.contains=[r,i,s,l,c,g,u].concat(o),{
name:"Scheme",aliases:["scm"],illegal:/\S/,
contains:[e.SHEBANG(),i,s,c,g,u].concat(o)}},grmr_shell:e=>({
name:"Shell Session",aliases:["console","shellsession"],contains:[{
className:"meta.prompt",begin:/^\s{0,3}[/~\w\d[\]()@-]*[>%$#][ ]?/,starts:{
end:/[^\\](?=\s*$)/,subLanguage:"bash"}}]}),grmr_sml:e=>({
name:"SML (Standard ML)",aliases:["ml"],keywords:{$pattern:"[a-z_]\\w*!?",
keyword:"abstype and andalso as case datatype do else end eqtype exception fn fun functor handle if in include infix infixr let local nonfix of op open orelse raise rec sharing sig signature struct structure then type val with withtype where while",
built_in:"array bool char exn int list option order real ref string substring vector unit word",
literal:"true false NONE SOME LESS EQUAL GREATER nil"},illegal:/\/\/|>>/,
contains:[{className:"literal",begin:/\[(\|\|)?\]|\(\)/,relevance:0
},e.COMMENT("\\(\\*","\\*\\)",{contains:["self"]}),{className:"symbol",
begin:"'[A-Za-z_](?!')[\\w']*"},{className:"type",begin:"`[A-Z][\\w']*"},{
className:"type",begin:"\\b[A-Z][\\w']*",relevance:0},{
begin:"[a-z_]\\w*'[\\w']*"},e.inherit(e.APOS_STRING_MODE,{className:"string",
relevance:0}),e.inherit(e.QUOTE_STRING_MODE,{illegal:null}),{className:"number",
begin:"\\b(0[xX][a-fA-F0-9_]+[Lln]?|0[oO][0-7_]+[Lln]?|0[bB][01_]+[Lln]?|[0-9][0-9_]*([Lln]|(\\.[0-9_]*)?([eE][-+]?[0-9_]+)?)?)",
relevance:0},{begin:/[-=]>/}]}),grmr_sql:e=>{
const n=e.regex,t=e.COMMENT("--","$"),a=["abs","acos","array_agg","asin","atan","avg","cast","ceil","ceiling","coalesce","corr","cos","cosh","count","covar_pop","covar_samp","cume_dist","dense_rank","deref","element","exp","extract","first_value","floor","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","last_value","lead","listagg","ln","log","log10","lower","max","min","mod","nth_value","ntile","nullif","percent_rank","percentile_cont","percentile_disc","position","position_regex","power","rank","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","row_number","sin","sinh","sqrt","stddev_pop","stddev_samp","substring","substring_regex","sum","tan","tanh","translate","translate_regex","treat","trim","trim_array","unnest","upper","value_of","var_pop","var_samp","width_bucket"],r=a,i=["abs","acos","all","allocate","alter","and","any","are","array","array_agg","array_max_cardinality","as","asensitive","asin","asymmetric","at","atan","atomic","authorization","avg","begin","begin_frame","begin_partition","between","bigint","binary","blob","boolean","both","by","call","called","cardinality","cascaded","case","cast","ceil","ceiling","char","char_length","character","character_length","check","classifier","clob","close","coalesce","collate","collect","column","commit","condition","connect","constraint","contains","convert","copy","corr","corresponding","cos","cosh","count","covar_pop","covar_samp","create","cross","cube","cume_dist","current","current_catalog","current_date","current_default_transform_group","current_path","current_role","current_row","current_schema","current_time","current_timestamp","current_path","current_role","current_transform_group_for_type","current_user","cursor","cycle","date","day","deallocate","dec","decimal","decfloat","declare","default","define","delete","dense_rank","deref","describe","deterministic","disconnect","distinct","double","drop","dynamic","each","element","else","empty","end","end_frame","end_partition","end-exec","equals","escape","every","except","exec","execute","exists","exp","external","extract","false","fetch","filter","first_value","float","floor","for","foreign","frame_row","free","from","full","function","fusion","get","global","grant","group","grouping","groups","having","hold","hour","identity","in","indicator","initial","inner","inout","insensitive","insert","int","integer","intersect","intersection","interval","into","is","join","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","language","large","last_value","lateral","lead","leading","left","like","like_regex","listagg","ln","local","localtime","localtimestamp","log","log10","lower","match","match_number","match_recognize","matches","max","member","merge","method","min","minute","mod","modifies","module","month","multiset","national","natural","nchar","nclob","new","no","none","normalize","not","nth_value","ntile","null","nullif","numeric","octet_length","occurrences_regex","of","offset","old","omit","on","one","only","open","or","order","out","outer","over","overlaps","overlay","parameter","partition","pattern","per","percent","percent_rank","percentile_cont","percentile_disc","period","portion","position","position_regex","power","precedes","precision","prepare","primary","procedure","ptf","range","rank","reads","real","recursive","ref","references","referencing","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","release","result","return","returns","revoke","right","rollback","rollup","row","row_number","rows","running","savepoint","scope","scroll","search","second","seek","select","sensitive","session_user","set","show","similar","sin","sinh","skip","smallint","some","specific","specifictype","sql","sqlexception","sqlstate","sqlwarning","sqrt","start","static","stddev_pop","stddev_samp","submultiset","subset","substring","substring_regex","succeeds","sum","symmetric","system","system_time","system_user","table","tablesample","tan","tanh","then","time","timestamp","timezone_hour","timezone_minute","to","trailing","translate","translate_regex","translation","treat","trigger","trim","trim_array","true","truncate","uescape","union","unique","unknown","unnest","update","upper","user","using","value","values","value_of","var_pop","var_samp","varbinary","varchar","varying","versioning","when","whenever","where","width_bucket","window","with","within","without","year","add","asc","collation","desc","final","first","last","view"].filter((e=>!a.includes(e))),s={
match:n.concat(/\b/,n.either(...r),/\s*\(/),relevance:0,keywords:{built_in:r}}
;function o(e){
return n.concat(/\b/,n.either(...e.map((e=>e.replace(/\s+/,"\\s+")))),/\b/)}
const l={scope:"keyword",
match:o(["create table","insert into","primary key","foreign key","not null","alter table","add constraint","grouping sets","on overflow","character set","respect nulls","ignore nulls","nulls first","nulls last","depth first","breadth first"]),
relevance:0};return{name:"SQL",case_insensitive:!0,illegal:/[{}]|<\//,keywords:{
$pattern:/\b[\w\.]+/,keyword:((e,{exceptions:n,when:t}={})=>{const a=t
;return n=n||[],e.map((e=>e.match(/\|\d+$/)||n.includes(e)?e:a(e)?e+"|0":e))
})(i,{when:e=>e.length<3}),literal:["true","false","unknown"],
type:["bigint","binary","blob","boolean","char","character","clob","date","dec","decfloat","decimal","float","int","integer","interval","nchar","nclob","national","numeric","real","row","smallint","time","timestamp","varchar","varying","varbinary"],
built_in:["current_catalog","current_date","current_default_transform_group","current_path","current_role","current_schema","current_transform_group_for_type","current_user","session_user","system_time","system_user","current_time","localtime","current_timestamp","localtimestamp"]
},contains:[{scope:"type",
match:o(["double precision","large object","with timezone","without timezone"])
},l,s,{scope:"variable",match:/@[a-z0-9][a-z0-9_]*/},{scope:"string",variants:[{
begin:/'/,end:/'/,contains:[{match:/''/}]}]},{begin:/"/,end:/"/,contains:[{
match:/""/}]},e.C_NUMBER_MODE,e.C_BLOCK_COMMENT_MODE,t,{scope:"operator",
match:/[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,relevance:0}]}},
grmr_swift:e=>{const n={match:/\s+/,relevance:0},t=e.COMMENT("/\\*","\\*/",{
contains:["self"]}),a=[e.C_LINE_COMMENT_MODE,t],r={match:[/\./,_(...ve,...we)],
className:{2:"keyword"}},i={match:u(/\./,_(...Me)),relevance:0
},s=Me.filter((e=>"string"==typeof e)).concat(["_|0"]),o={variants:[{
className:"keyword",
match:_(...Me.filter((e=>"string"!=typeof e)).concat(Ne).map(ye),...we)}]},l={
$pattern:_(/\b\w+/,/#\w+/),keyword:s.concat(Ce),literal:Ae},c=[r,i,o],g=[{
match:u(/\./,_(...Se)),relevance:0},{className:"built_in",
match:u(/\b/,_(...Se),/(?=\()/)}],m={match:/->/,relevance:0},p=[m,{
className:"operator",relevance:0,variants:[{match:De},{match:`\\.(\\.|${Te})+`}]
}],b="([0-9]_*)+",f="([0-9a-fA-F]_*)+",h={className:"number",relevance:0,
variants:[{match:`\\b(${b})(\\.(${b}))?([eE][+-]?(${b}))?\\b`},{
match:`\\b0x(${f})(\\.(${f}))?([pP][+-]?(${b}))?\\b`},{match:/\b0o([0-7]_*)+\b/
},{match:/\b0b([01]_*)+\b/}]},E=(e="")=>({className:"subst",variants:[{
match:u(/\\/,e,/[0\\tnr"']/)},{match:u(/\\/,e,/u\{[0-9a-fA-F]{1,8}\}/)}]
}),x=(e="")=>({className:"subst",match:u(/\\/,e,/[\t ]*(?:[\r\n]|\r\n)/)
}),y=(e="")=>({className:"subst",label:"interpol",begin:u(/\\/,e,/\(/),end:/\)/
}),v=(e="")=>({begin:u(e,/"""/),end:u(/"""/,e),contains:[E(e),x(e),y(e)]
}),w=(e="")=>({begin:u(e,/"/),end:u(/"/,e),contains:[E(e),y(e)]}),N={
className:"string",
variants:[v(),v("#"),v("##"),v("###"),w(),w("#"),w("##"),w("###")]
},M=[e.BACKSLASH_ESCAPE,{begin:/\[/,end:/\]/,relevance:0,
contains:[e.BACKSLASH_ESCAPE]}],A={begin:/\/[^\s](?=[^/\n]*\/)/,end:/\//,
contains:M},k=e=>{const n=u(e,/\//),t=u(/\//,e);return{begin:n,end:t,
contains:[...M,{scope:"comment",begin:`#(?!.*${t})`,end:/$/}]}},C={
scope:"regexp",variants:[k("###"),k("##"),k("#"),A]},S={match:u(/`/,Le,/`/)
},O=[S,{className:"variable",match:/\$\d+/},{className:"variable",
match:`\\$${Re}+`}],T=[{match:/(@|#(un)?)available/,scope:"keyword",starts:{
contains:[{begin:/\(/,end:/\)/,keywords:Pe,contains:[...p,h,N]}]}},{
scope:"keyword",match:u(/@/,_(...Fe),d(_(/\(/,/\s+/)))},{scope:"meta",
match:u(/@/,Le)}],D={match:d(/\b[A-Z]/),relevance:0,contains:[{className:"type",
match:u(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/,Re,"+")
},{className:"type",match:Be,relevance:0},{match:/[?!]+/,relevance:0},{
match:/\.\.\./,relevance:0},{match:u(/\s+&\s+/,d(Be)),relevance:0}]},I={
begin:/</,end:/>/,keywords:l,contains:[...a,...c,...T,m,D]};D.contains.push(I)
;const R={begin:/\(/,end:/\)/,relevance:0,keywords:l,contains:["self",{
match:u(Le,/\s*:/),keywords:"_|0",relevance:0
},...a,C,...c,...g,...p,h,N,...O,...T,D]},L={begin:/</,end:/>/,
keywords:"repeat each",contains:[...a,D]},B={begin:/\(/,end:/\)/,keywords:l,
contains:[{begin:_(d(u(Le,/\s*:/)),d(u(Le,/\s+/,Le,/\s*:/))),end:/:/,
relevance:0,contains:[{className:"keyword",match:/\b_\b/},{className:"params",
match:Le}]},...a,...c,...p,h,N,...T,D,R],endsParent:!0,illegal:/["']/},F={
match:[/(func|macro)/,/\s+/,_(S.match,Le,De)],className:{1:"keyword",
3:"title.function"},contains:[L,B,n],illegal:[/\[/,/%/]},P={
match:[/\b(?:subscript|init[?!]?)/,/\s*(?=[<(])/],className:{1:"keyword"},
contains:[L,B,n],illegal:/\[|%/},z={match:[/operator/,/\s+/,De],className:{
1:"keyword",3:"title"}},U={begin:[/precedencegroup/,/\s+/,Be],className:{
1:"keyword",3:"title"},contains:[D],keywords:[...ke,...Ae],end:/}/},$={
begin:[/(struct|protocol|class|extension|enum|actor)/,/\s+/,Le,/\s*/],
beginScope:{1:"keyword",3:"title.class"},keywords:l,contains:[L,...c,{begin:/:/,
end:/\{/,keywords:l,contains:[{scope:"title.class.inherited",match:Be},...c],
relevance:0}]};for(const e of N.variants){
const n=e.contains.find((e=>"interpol"===e.label));n.keywords=l
;const t=[...c,...g,...p,h,N,...O];n.contains=[...t,{begin:/\(/,end:/\)/,
contains:["self",...t]}]}return{name:"Swift",keywords:l,contains:[...a,F,P,{
match:[/class\b/,/\s+/,/func\b/,/\s+/,/\b[A-Za-z_][A-Za-z0-9_]*\b/],scope:{
1:"keyword",3:"keyword",5:"title.function"}},{match:[/class\b/,/\s+/,/var\b/],
scope:{1:"keyword",3:"keyword"}},$,z,U,{beginKeywords:"import",end:/$/,
contains:[...a],relevance:0},C,...c,...g,...p,h,N,...O,...T,D,R]}},
grmr_typescript:e=>{
const n=e.regex,t=xe(e),a=oe,r=["any","void","number","boolean","string","object","never","symbol","bigint","unknown"],i={
begin:[/namespace/,/\s+/,e.IDENT_RE],beginScope:{1:"keyword",3:"title.class"}
},s={beginKeywords:"interface",end:/\{/,excludeEnd:!0,keywords:{
keyword:"interface extends",built_in:r},contains:[t.exports.CLASS_REFERENCE]
},o={$pattern:oe,
keyword:le.concat(["type","interface","public","private","protected","implements","declare","abstract","readonly","enum","override","satisfies"]),
literal:ce,built_in:_e.concat(r),"variable.language":ue},l={className:"meta",
begin:"@"+a},c=(e,n,t)=>{const a=e.contains.findIndex((e=>e.label===n))
;if(-1===a)throw Error("can not find mode to replace");e.contains.splice(a,1,t)}
;Object.assign(t.keywords,o),t.exports.PARAMS_CONTAINS.push(l)
;const d=t.contains.find((e=>"attr"===e.scope)),g=Object.assign({},d,{
match:n.concat(a,n.lookahead(/\s*\?:/))})
;return t.exports.PARAMS_CONTAINS.push([t.exports.CLASS_REFERENCE,d,g]),
t.contains=t.contains.concat([l,i,s,g]),
c(t,"shebang",e.SHEBANG()),c(t,"use_strict",{className:"meta",relevance:10,
begin:/^\s*['"]use strict['"]/
}),t.contains.find((e=>"func.def"===e.label)).relevance=0,Object.assign(t,{
name:"TypeScript",aliases:["ts","tsx","mts","cts"]}),t},grmr_wgsl:e=>({
name:"WGSL",keywords:{
keyword:"break continue continuing discard else for if loop return while switch case default alias const const_assert diagnostic enable fn let override requires struct var function private workgroup uniform storage read read_write write center centroid flat linear perspective sample frag_depth front_facing global_invocation_id instance_index local_invocation_id local_invocation_index num_workgroups position sample_index sample_mask vertex_index workgroup_id rgba8unorm rgba8snorm rgba8uint rgba8sint rgba16uint rgba16sint rgba16float r32uint r32sint r32float rg32uint rg32sint rg32float rgba32uint rgba32sint rgba32float bgra8unorm align binding builtin compute const diagnostic fragment group id interpolate invariant location must_use size vertex workgroup_size",
type:"bool f32 f16 i32 i16 u32 u16 vec2 vec2f vec2i vec2u vec3 vec3f vec3i vec3u vec4 vec4f vec4i vec4u mat2x2 mat2x2f mat2x2i mat2x2u mat2x3 mat2x3f mat2x3i mat2x3u mat2x4 mat2x4f mat2x4i mat2x4u mat3x2 mat3x2f mat3x2i mat3x2u mat3x3 mat3x3f mat3x3i mat3x3u mat3x4 mat3x4f mat3x4i mat3x4u mat4x2 mat4x2f mat4x2i mat4x2u mat4x3 mat4x3f mat4x3i mat4x3u mat4x4 mat4x4f mat4x4i mat4x4u texture_1d texture_2d texture_2d_array texture_3d texture_cube texture_cube_array texture_multisampled_2d texture_storage_3d texture_storage_1d texture_storage_2d texture_storage_2d_array texture_depth_2d texture_depth_2d_array texture_depth_cube texture_depth_cube_array sampler sampler_comparison array atomic ptr",
built_in:"bitcast all any select arrayLength abs acos acosh asin asinh atan atanh atan2 ceil clamp cos cosh countLeadingZeros countOneBits countTrailingZeros cross degrees determinant distance dot dot4U8Packed dot4I8Packed exp exp2 extractBits faceForward firstLeadingBit firstTrailingBit floor fma fract frexp inverseBits inverseSqrt ldexp length log log2 max min mix modf normalize pow quantizeToF16 radians reflect refract reverseBits round saturate sign sin sinh smoothstep sqrt step tan tanh transpose trunc dpdx dpdxCoarse dpdxFine dpdy dpdyCoarse dpdyFine fwidth fwidthCoarse fwidthFine textureDimensions textureGather textureGatherCompare textureLoad textureNumLayers textureNumLevels textureNumSamples textureSample textureSampleBias textureSampleCompare textureSampleCompareLevel textureSampleGrad textureSampleLevel textureSampleBaseClampToEdge textureStore atomicLoad atomicStore atomicAdd atomicSub atomicMax atomicMin atomicAnd atomicOr atomicXor atomicExchange atomicCompareExchangeWeak pack4x8snorm pack4x8unorm pack4xI8 pack4xU8 pack4xI8Clamp pack4xU8Clamp pack2x16snorm pack2x16unorm pack2x16float unpack4x8snorm unpack4x8unorm unpack4xI8 unpack4xU8 unpack2x16snorm unpack2x16unorm unpack2x16float storageBarrier textureBarrier workgroupBarrier workgroupUniformLoad",
literal:"true false"},illegal:'"',
contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,e.C_NUMBER_MODE]}),
grmr_xml:e=>{
const n=e.regex,t=n.concat(/[\p{L}_]/u,n.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),a={
className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},r={begin:/\s/,
contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]
},i=e.inherit(r,{begin:/\(/,end:/\)/}),s=e.inherit(e.APOS_STRING_MODE,{
className:"string"}),o=e.inherit(e.QUOTE_STRING_MODE,{className:"string"}),l={
endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",
begin:/[\p{L}0-9._:-]+/u,relevance:0},{begin:/=\s*/,relevance:0,contains:[{
className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[a]},{
begin:/'/,end:/'/,contains:[a]},{begin:/[^\s"'=<>`]+/}]}]}]};return{
name:"HTML, XML",
aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],
case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,
end:/>/,relevance:10,contains:[r,o,s,i,{begin:/\[/,end:/\]/,contains:[{
className:"meta",begin:/<![a-z]/,end:/>/,contains:[r,i,o,s]}]}]
},e.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,
relevance:10},a,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,
relevance:10,contains:[o]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",
begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[l],starts:{
end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",
begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[l],starts:{
end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{
className:"tag",begin:/<>|<\/>/},{className:"tag",
begin:n.concat(/</,n.lookahead(n.concat(t,n.either(/\/>/,/>/,/\s/)))),
end:/\/?>/,contains:[{className:"name",begin:t,relevance:0,starts:l}]},{
className:"tag",begin:n.concat(/<\//,n.lookahead(n.concat(t,/>/))),contains:[{
className:"name",begin:t,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}
},grmr_yaml:e=>{
const n="true false yes no null",t="[\\w#;/?:@&=+$,.~*'()[\\]]+",a={
className:"string",relevance:0,variants:[{begin:/"/,end:/"/},{begin:/\S+/}],
contains:[e.BACKSLASH_ESCAPE,{className:"template-variable",variants:[{
begin:/\{\{/,end:/\}\}/},{begin:/%\{/,end:/\}/}]}]},r=e.inherit(a,{variants:[{
begin:/'/,end:/'/,contains:[{begin:/''/,relevance:0}]},{begin:/"/,end:/"/},{
begin:/[^\s,{}[\]]+/}]}),i={end:",",endsWithParent:!0,excludeEnd:!0,keywords:n,
relevance:0},s={begin:/\{/,end:/\}/,contains:[i],illegal:"\\n",relevance:0},o={
begin:"\\[",end:"\\]",contains:[i],illegal:"\\n",relevance:0},l=[{
className:"attr",variants:[{begin:/[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/},{
begin:/"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/},{
begin:/'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/}]},{className:"meta",
begin:"^---\\s*$",relevance:10},{className:"string",
begin:"[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"},{
begin:"<%[%=-]?",end:"[%-]?%>",subLanguage:"ruby",excludeBegin:!0,excludeEnd:!0,
relevance:0},{className:"type",begin:"!\\w+!"+t},{className:"type",
begin:"!<"+t+">"},{className:"type",begin:"!"+t},{className:"type",begin:"!!"+t
},{className:"meta",begin:"&"+e.UNDERSCORE_IDENT_RE+"$"},{className:"meta",
begin:"\\*"+e.UNDERSCORE_IDENT_RE+"$"},{className:"bullet",begin:"-(?=[ ]|$)",
relevance:0},e.HASH_COMMENT_MODE,{beginKeywords:n,keywords:{literal:n}},{
className:"number",
begin:"\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"
},{className:"number",begin:e.C_NUMBER_RE+"\\b",relevance:0},s,o,{
className:"string",relevance:0,begin:/'/,end:/'/,contains:[{match:/''/,
scope:"char.escape",relevance:0}]},a],c=[...l]
;return c.pop(),c.push(r),i.contains=c,{name:"YAML",case_insensitive:!0,
aliases:["yml"],contains:l}}});const Ue=ne;for(const e of Object.keys(ze)){
const n=e.replace("grmr_","").replace("_","-");Ue.registerLanguage(n,ze[e])}
return Ue}()
;"object"==typeof exports&&"undefined"!=typeof module&&(module.exports=hljs);
hljs.registerAliases("objective-c", {languageName: "objectivec"});
/* END highlight.js */

// highlight.js assigns itself to module.exports in its last statement, so the
// renderer's node export follows it.
if (MARKDEEP_NODE_API) {
    module.exports = MARKDEEP_NODE_API;
}
// The following is for emacs. It must be at the end of the file and is
// needed to preserve the BOM mark when editing in emacs. The begin and
// end comment on each line are also required.
 
/* Local Variables: */
/* mode: JavaScript */
/* coding: utf-8-with-signature */
/* End: */

