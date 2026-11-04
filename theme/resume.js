// Resume/CV theme for Markdeep 2

( window.markdeepOptions ||=[] ).push({
    stylesheets: {resume: 'assets/resume.css'},

    // Disable the overview
    tocDepth: 0,

    // Disable heading numbers
    showSectionNumbers: false,

    // Force white background
    initialColorScheme: 'light',
    enableColorSchemeChoice: false,

    // Disable link previews
    showLinkPreviews: false,
});

// Mandatory activation line. DO NOT MODIFY OR RELOCATE
((d,o)=>d.head.appendChild(((m)=>{m.dataset.theme=d.currentScript.src;return m;})(Object.assign(d.createElement('script'),{src:o.find((e)=>e.markdeepPath)?.markdeepPath??d.currentScript.src.replace(/[^/]*$/,'markdeep2.min.js')}))))(document,window.markdeepOptions);
