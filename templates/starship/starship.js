// Include this script into a .md.html file at the top,
// **INSTEAD OF** the markdeep line at the bottom.
//
// <meta charset="utf-8"><script src="starship.js"></script>

window.markdeepOptions = {
    tocStyle: 'long',
    definitionStyle: 'long',
    h1TitleInput: true,
    showLinkPreviews: true};

// Set a favicon to icon.png
{
    const link = document.createElement("link");
    link.rel = "icon"
    link.type = "image/png"
    link.href = "icon.png";
    document.head.appendChild(link);
}


{
    const style = document.createElement("style");
    style.innerHTML = `
@import url("https://fonts.googleapis.com/css2?family=Antonio:wght@400;700&display=swap");


.md em.asterisk { font-style: normal; font-weight: bold; }
.md :not(.listing) > code {white-space: nowrap}

:root {
    --toc-width: 15em;
    
    --section-border-color: #5a5a5a;

    /***************************************************/
    /* Do not change, the layout is hardcoded to these */
    --section-border-top-size: 48px;
    --section-border-right-size: 96px;
    --starship-antialias-distance: 1px;
    --page-top-padding: 8px;
    --h1-sticky-height: 92px;
    --h2-stick-gap: 32px;
    /***************************************************/

    --starship-orange: #ff9900;
    --starship-peach: #ffcc99;
    --starship-tan: #cc9966;
    --starship-purple: #cc99cc;
    --starship-blue: #9999ff;
    --starship-red: #cc6666;

    --page-color: black;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  vertical-align: middle;
}

body {
    font-weight: 400;
    font-size: 16px;
    font-family: Helvetica, sans-serif;
    text-align: left;
    line-height: 170%;
    margin: 0px;
    padding: var(--page-top-padding) 16px 8px 8px;
    max-width: unset;
    margin-right: calc(var(--toc-width) + var(--section-border-right-size) - 8px);
    scrollbar-gutter: stable;
    color: #ddd;
    background: var(--page-color);
}

@media screen {
    /* Black bar to hide content scrolling behind sticky headers */
    body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: calc(var(--page-top-padding) * 2);
        background: var(--page-color);
        z-index: 9999;
        pointer-events: none;
        display: block;
        line-height: 0;
    }
}

/* reset heading/link fonts to that of body */
.md a,
.md div.title, contents, .md .tocHeader,
.md h1, .md h2, .md h3, .md h4, .md h5, .md h6,
.md .nonumberh1, .md .nonumberh2, .md .nonumberh3, .md .nonumberh4, .md .nonumberh5, .md .nonumberh6,
.md .shortTOC, .md .mediumTOC, .md .longTOC {
    font-family: inherit;
}


/* Remove the TOC "Contents" label and the newline beneath it */
.md .longTOC br:first-of-type {
    display: none;
}

.md .tocHeader, .md tocTop {
    display:none;
    height: 0;
}

.md .longTOC { 
    margin: 0px;
    top: 2px;
    padding: 0px;
    padding-right: 8px;
    padding-left: 8px;
    font-family: 'Roboto', Arial, Helvetica, "sans serif";
    font-weight: 300;
    scrollbar-gutter: stable;
    scrollbar-width: 0;

    display: block;
    width: calc(var(--toc-width) - 15px);
    overflow-y: auto;
    font-family: inherit;
    position: fixed;
    right: 0px;
    bottom: 0px;
    padding-right: 10px;
    scrollbar-gutter: stable;
}

/* Invisible anchors for sections */
.md a.target {
    top: 0px;
}


/* Modify the TOC styles and H1 headers for print */
@media print {
    /* Change all sticky elements to relative */
    .md h1,
    .md h2,
    .md section.h1-section > a:first-of-type,
    .md section.h1-section > a:first-of-type::before,
    .md section.h1-section > a:first-of-type::after {
        position: relative;
    }

    .md section.h1-section {
        page-break-before: always;
        break-before: always;
        margin-top: 32px;
    }

    /* Side border doesn't scroll, so don't try to cover it */
    .md section.h1-section > a:first-of-type {
        background: none !important;
    }

    /* Restore TOC at top of document, make multi-column on browsers that support it */
    .md .longTOC {
        position: static;
        width: calc(100% + var(--section-border-right-size));
        right: auto;
        column-count: 4;
        column-gap: 2em;
        column-rule: 1px solid #333;
    }
    
    /*.md .longTOC a.level1 {
        break-before: column;
    }*/

    /* Prevent column breaks within TOC links */
    .md .longTOC a {
        break-inside: avoid;
        page-break-inside: avoid;
        -webkit-break-inside: avoid;
        -webkit-page-break-inside: avoid;
    }

    @page {
        margin-top: 2cm;
        margin-bottom: 1.5cm;
    }

    /* Restore full page width in print */
    body {
        margin-right: calc(var(--section-border-right-size) + 8px);
    }

    /* Detect Safari */
    @supports (-webkit-hyphens: none) {

        .md h1 {
            margin-top: -72px !important;
            top: -24px !important;
        }
    }
}


.md .longTOC a {
    font-size: 80%;
    margin-bottom: -5px;
}

.md .longTOC a.level1 {
    background: #0F0 !important;
    height: 32px;
    font-size: 15px;
    border-radius: 16px;
    text-align: left;
    margin: 0;
    color: #000 !important;
    margin-bottom: -26px;
    margin-top: 12px;
    padding-top: 16px !important;
    padding-bottom: 8px !important;
    padding-left: 16px !important;
    line-height: 8px !important;
    display: block;
    box-sizing: border-box;
}

.md .longTOC a.level1 code {
    color: #000 !important;
    font-size: inherit;
    line-height: inherit;
}

.md .longTOC a.level1 .tocNumber { display: none } 

/* Rotating starship colors for TOC level1 to match h1 colors */
/* Using adjacent sibling combinator to count only level1 elements */
.md .longTOC a.level1 { background: var(--starship-orange) !important; }
.md .longTOC a.level1 ~ a.level1 { background: var(--starship-peach) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-tan) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-purple) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-blue) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-red) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-orange) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-peach) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-tan) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-purple) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-blue) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-red) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-orange) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-peach) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-tan) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-purple) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-blue) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 { background: var(--starship-red) !important; }


/* Set level2/level3 link colors to match preceding level1 background */
.md .longTOC a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level3 { color: var(--starship-orange) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-peach) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-tan) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-purple) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-blue) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-red) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-orange) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-peach) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-tan) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-purple) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-blue) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-red) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-orange) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-peach) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-tan) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-purple) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-blue) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-red) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-orange) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-peach) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-tan) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-purple) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-blue) !important; }
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level2,
.md .longTOC a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level1 ~ a.level3 { color: var(--starship-red) !important; }


.md div.title, .md div.subtitle, .md h1, .md h2, .md h3, .md h4, .md h5, .md h6, .md .longTOC .level1, .md .longTOC .level1 code {
    font-family: Antonio, Arial, Helvetica, "sans serif" !important;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing:-0.05em;
}

.md .longTOC a.level1 {
    margin-bottom: 0px;
    margin-top: 0px;
}

/* word-wrap long titles */
.md .longTOC a.level2, .md .longTOC a.level3 {
    margin-top: -40px;
    margin-left: 8px;
    display: block;
    line-height: 110%;
}

.md div.title {
    font-size: 55px;
    text-align: center;
    margin-bottom: 0px;
    width: calc(100% + var(--section-border-right-size));
    padding: 0px;
    margin-top: -8px;
    color: var(--starship-orange);
}

.md div.afterTitles {
    border: none
}

.md div.subtitle {
    text-align: left;
    font-size: 115%;
}


.md div.afterTitles {
    display:none;
}

.md .tocNumber { display: none; }
.md h2::before { display: none; }
.md h3::before { display: none; }

.md h1 {
    content: '';
    position: sticky;
    display: block;
    top: 12px;
    left: 0px;
    margin-top: -48px;
    margin-bottom: 0px;

    font-size: 55px !important;
    margin-left:-16px;
    margin-right:32px;
    padding-left:48px;
    padding-top:0px;
    line-height: var(--section-border-top-size);
    white-space: nowrap;
    overflow: hidden;
    max-width: calc(100% - var(--section-border-right-size) + 16px);
    height: calc(2px + var(--section-border-top-size));
    width: fit-content;
    padding-right: 10px;
    border: none;
    display: block;
    z-index: 2;
}

/* Blackout of the h1 section top border under the text */
.md h1::after {
    content: '';
    position: absolute;
    top: 0px;
    left: 40px;
    right: -16px;
    height: calc(var(--section-border-top-size) + 16px);
    background: #000;
    z-index: -1;
    pointer-events: none;
    overflow: visible;
    display: block;
}

/* Remove Markdeep's default numbering on H1 */
.md h1::before {
    content: '';
    display: none;
}

.md section.h1-section {
    margin-bottom: 32px;
    padding-bottom: 32px;
    position: relative;
    padding-left: 16px;
}

/* h1 background with rounded corners */
.md section.h1-section > a:first-of-type::before {
    content: '';
    position: sticky;
    display: block;
    top: 16px;
    left: 0px;
    padding: 0;
    margin-bottom: 0px;
    margin-top: 0px;

    width: 100%;
    height: var(--section-border-top-size);
    z-index: 3;
    pointer-events: none;
    border-top-right-radius: calc(var(--section-border-top-size) * 1.5) var(--section-border-top-size);
    border-top-left-radius: calc(var(--section-border-top-size) / 2);
    border-bottom-left-radius: calc(var(--section-border-top-size) / 2);
    background: var(--section-border-color);
}

/* Black background behind the h1 border. Use the toc anchor to create this element */
.md section.h1-section > a:first-of-type {
    position: sticky;
    visibility: visible;
    content: '';
    display: block;
    top: 16px;
    margin-left: -16px;
    width: calc(100% + var(--section-border-right-size) + 32px);
    height: calc(var(--section-border-top-size) - 4px);
    z-index: 2;
    pointer-events: none;
    background: var(--page-color);
}

/* Inner concave corner of section border - reversed elliptical gradient (transparent center, opaque at radius) - half size */
.md section.h1-section > a:first-of-type::after {
    content:'';
    position: sticky;
    display: block;
    top: 0px;
    margin-top: -83px;
    width: 100%;
    height: calc(var(--section-border-top-size) * 2);
    z-index: 20;
    pointer-events: none;
    background: radial-gradient(
            calc(var(--section-border-top-size) * 0.75 - var(--starship-antialias-distance) * 0.5) calc(var(--section-border-top-size) * 0.5 - var(--starship-antialias-distance) * 0.5) at 0% 100%,
            transparent calc(100% - calc(var(--starship-antialias-distance) * 0.5)),
            var(--section-border-color) calc(100% + calc(var(--starship-antialias-distance) * 0.5))) calc(100% - var(--section-border-right-size) + 0.4px) calc(7.4px + var(--section-border-top-size)) / calc(var(--section-border-top-size) * 0.75) calc(var(--section-border-top-size) * 0.5) no-repeat;
}

/* Side bar. Slides under the toc anchor */
.md section.h1-section::after {
    content: '';
    position: absolute;
    top: 46px;
    right: calc(-16px - var(--section-border-right-size));
    width: var(--section-border-right-size);
    bottom: 0;
    z-index: 1;
    background: var(--section-border-color);
    pointer-events: none;
}

/* Rotating starship colors for sections (h1 inherits) */
.md section.h1-section:nth-of-type(6n+1) { --section-border-color: var(--starship-orange); }
.md section.h1-section:nth-of-type(6n+2) { --section-border-color: var(--starship-peach); }
.md section.h1-section:nth-of-type(6n+3) { --section-border-color: var(--starship-tan); }
.md section.h1-section:nth-of-type(6n+4) { --section-border-color: var(--starship-purple); }
.md section.h1-section:nth-of-type(6n+5) { --section-border-color: var(--starship-blue); }
.md section.h1-section:nth-of-type(6n+6) { --section-border-color: var(--starship-red); }

.md h1 { color: var(--section-border-color) !important; }
.md h2, .md h3, .md h4, .md h5, .md h6 { color: var(--section-border-color) !important; }

.md h2 {
    font-size: 150%;
    border: none;
    position: sticky;
    padding: 0px;
    padding-top:4px;
    padding-bottom:8px;
    margin: 0px;
    top: calc(var(--page-top-padding) + var(--h1-sticky-height) - var(--h2-stick-gap) - 4px);
    min-height: 32px;
    background: #000;
}

.md h1 code, .md h2 code { font-family: inherit; line-height: inherit; color: inherit }

.md h3, .md h4, .md h5, .md h6 {
    font-size: 120%;
}

span.md > p {
    padding-left: 16px;
}

.md code {
    font-size: 90%;
    background: #eee;
    padding-left: 2px;
    padding-right: 2px;
}


.md pre.listing {
    font-size: 100%;
    line-height: normal;
    background: #202020;
    border: 1px solid #777;
    box-shadow: 0px 1px 2px rgba(0,0,0,0.5);
}

.md pre.listing code {
    font-weight: unset;
    background: none;
    color: unset;
}



.md div.longTOC {
    font-size: 15px;
}


.md svg.diagram {
    stroke: #ccc;
    fill: #ccc;
}

.md svg.diagram .opendot {
    fill: #000;
}

.md table.table {
    background-color: #2a2a2a;
}

.md table.table tr:nth-child(even) {
    background-color: #202020;
}

.md table.table td, .md table.table th {
    border: 1px solid #202020;
}

.md table.table th {
    background-color: var(--section-border-color);
    color: var(--page-color);
}


.md code {
    color: #fff;
    background: unset;
}


.hljs-comment,.hljs-quote{color:#a0f0aa}.hljs-variable,.hljs-template-variable,.hljs-tag,.hljs-name,.hljs-selector-id,.hljs-selector-class,.hljs-regexp,.hljs-deletion{color:#cc6666}.hljs-number,.hljs-built_in,.hljs-builtin-name,.hljs-literal,.hljs-type,.hljs-params,.hljs-meta,.hljs-link{color:#de935f}.hljs-attribute{color:#f0c674}.hljs-string,.hljs-symbol,.hljs-bullet,.hljs-addition{color:#b5bd68}.hljs-title,.hljs-section{color:#81a2be}.hljs-keyword,.hljs-selector-tag{color:#b294bb}.hljs{display:block;overflow-x:auto;background:#1d1f21;color:#c5c8c6;padding:.5em}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:bold}
.hljs-function .hljs-title { color:#81a2be}


.md .admonition {
    position: unset;
    box-shadow: 0px 1px 2px rgba(0,0,0,0.5);
    background: #202020;
    border: 1px solid rgba(68,138,255,1);
    border-left: 2.5rem solid rgba(68,138,255,1);
}

.md .admonition-title {
    border-bottom: 1px solid rgba(68,138,255,1);
}

.md .admonition.warn, .md .admonition.warning {
    border: 1px solid rgba(255,170,0,1);
    border-left: 2.5rem solid rgba(255,170,0,1);
    background: #202020;
}

.md .admonition.warn .admonition-title, .md .admonition.warning .admonition-title {
    border-bottom: 1px solid rgba(255,170,0,1);
}

.md .admonition.tip {
    border: 1px solid rgba(68,138,255,1);
    border-left: 2.5rem solid rgba(68,138,255,1);
    background: #202020;
}
.md .admonition.tip .admonition-title {
    border-bottom: 1px solid rgba(68,138,255,1);
}

.md .admonition.error {
    border: 1px solid rgba(255,23,68,1);
    border-left: 2.5rem solid rgba(255,23,68,1);
    background: #202020;
}

.md .admonition.error .admonition-title {
    border-bottom: 1px solid rgba(255,23,68,1);
}

.md a:link, .md a:visited, .md a:link code, .md a:visited code {
    color: #80bfff !important;
}

/* Exclude links within .longTOC (except .level1) */
.md .longTOC a:not(.level1):link, .md .longTOC a:not(.level1):visited, .md .longTOC a:not(.level1):link code, .md .longTOC a:not(.level1):visited code {
    color: unset !important;
}


/* Hide TOC on small viewports (must be hard-coded constant) */
@media (max-width: 700px) {
    :root {
        --toc-width: 0;
        --section-border-right-size: 800px;
    }
    
    .md .longTOC {
        visibility: hidden;
        position: absolute;
        pointer-events: none;
    }

    .md div.title {
        width: 100%;
    }

    .md h1 {
        max-width: 100%;
    }

    .md section.h1-section::before {
        background:
            linear-gradient(to right, var(--section-border-color), var(--section-border-color)) calc(var(--section-border-top-size) / 2) 8px / calc(100% - var(--section-border-top-size) * 2 + 1px) var(--section-border-top-size) no-repeat,
            radial-gradient(circle at calc(var(--section-border-top-size) / 2) calc(var(--section-border-top-size) / 2 + 8px), var(--section-border-color) calc(var(--section-border-top-size) * 0.5 - calc(var(--starship-antialias-distance) / 2)), #000 calc(var(--section-border-top-size) * 0.5 + calc(var(--starship-antialias-distance) / 2))) 0 0 / var(--section-border-top-size) calc(var(--section-border-top-size) + 8px) no-repeat,
            radial-gradient(ellipse calc(var(--section-border-top-size) * 1.5) var(--section-border-top-size) at 0 100%, var(--section-border-color) calc(100% - calc(var(--starship-antialias-distance) / 2)), var(--page-color) calc(100% + calc(var(--starship-antialias-distance) / 2))) 100% 8px / calc(var(--section-border-top-size) * 1.5) var(--section-border-top-size) no-repeat;
    }

    body {
        margin-right: 0;
        overflow-x: hidden;
    }
}
`;
    document.head.appendChild(style);
}

{
    const style = document.createElement("style");
    style.classList.add("fallback");
    style.innerHTML = 'body{background:#000;color:#EEE;visibility:hidden}';
    document.head.appendChild(style);
}
    
document.write(`
<!-- Markdeep: --><script src="markdeep.min.js" charset="utf-8"></script><script src="https://morgan3d.github.io/markdeep/latest/markdeep.min.js" charset="utf-8"></script><script>window.alreadyProcessedMarkdeep||(document.body.style.visibility="visible")</script>
`);
