// Options shared by the Company themes. Each Company theme pushes its own
// options and then loads this file.

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF';
const ROBOTO = 'Roboto, Arial, sans-serif';

( window.markdeepOptions ||=[] ).push({
    fontFaces: [
        {fontFamily: 'Roboto', src: 'assets/Roboto-latin.woff2',     fontWeight: '100 900', unicodeRange: LATIN},
        {fontFamily: 'Roboto', src: 'assets/Roboto-latin-ext.woff2', fontWeight: '100 900', unicodeRange: LATIN_EXT},
    ],

    showSectionNumbers: false,

    // Force white background
    initialColorScheme: 'light',
    enableColorSchemeChoice: false,

    style: {
        body:    {fontFamily: ROBOTO},
        heading: {fontFamily: ROBOTO},
        th:      {backgroundColor: '#f7d7a8', color: 'black'},
    },
});

// Mandatory activation line. DO NOT MODIFY OR RELOCATE
((d,o)=>d.head.appendChild(((m)=>{m.dataset.theme=d.currentScript.src;return m;})(Object.assign(d.createElement('script'),{src:o.find((e)=>e.markdeepPath)?.markdeepPath??d.currentScript.src.replace(/[^/]*$/,'markdeep2.min.js')}))))(document,window.markdeepOptions);
