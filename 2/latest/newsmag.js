// News magazine theme for Markdeep 2

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF';
const SLAB = "'Roboto Slab', 'Helvetica Neue', Helvetica, Arial, sans-serif";

( window.markdeepOptions ||=[] ).push({
    stylesheets: {newsmag: 'assets/newsmag.css'},

    fontFaces: [
        {fontFamily: "'Roboto Slab'",      src: 'assets/RobotoSlab-latin.woff2',          fontWeight: '200 700', unicodeRange: LATIN},
        {fontFamily: "'Roboto Slab'",      src: 'assets/RobotoSlab-latin-ext.woff2',      fontWeight: '200 700', unicodeRange: LATIN_EXT},
        {fontFamily: "'Playfair Display'", src: 'assets/PlayfairDisplay-latin.woff2',     fontWeight: '400 900', unicodeRange: LATIN},
        {fontFamily: "'Playfair Display'", src: 'assets/PlayfairDisplay-latin-ext.woff2', fontWeight: '400 900', unicodeRange: LATIN_EXT},
    ],

    // Show the magazine name across the top of every page
    site_header: {
        content: 'Newsmag',
        style: {backgroundColor: '#444', paddingTop: 0, paddingBottom: 0, borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: '#ddd'},
    },

    showSectionNumbers: false,

    // Force white background
    initialColorScheme: 'light',
    enableColorSchemeChoice: false,

    style: {
        body:    {fontFamily: SLAB, fontSize: '15px', fontWeight: 200, lineHeight: '165%', color: '#333'},
        heading: {fontFamily: SLAB, fontWeight: 700},
        h1:      {fontSize: '30px', color: '#000', marginBottom: 0},
        h2:      {fontSize: '16px', textTransform: 'uppercase', color: '#d23123', paddingBottom: '8px', borderBottomStyle: 'none'},
        h3:      {fontSize: '15px', textTransform: 'uppercase', color: '#999', fontWeight: 200},
        h4:      {fontSize: '15px', fontStyle: 'italic', color: '#999', fontWeight: 200},
    },
});

// Mandatory activation line. DO NOT MODIFY OR RELOCATE
((d,o)=>d.head.appendChild(((m)=>{m.dataset.theme=d.currentScript.src;return m;})(Object.assign(d.createElement('script'),{src:o.find((e)=>e.markdeepPath)?.markdeepPath??d.currentScript.src.replace(/[^/]*$/,'markdeep2.min.js')}))))(document,window.markdeepOptions);
