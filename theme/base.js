// New theme starter for Markdeep 2. Edit this to create your theme.

// The Markdeep Web Reader loads from the directory of this theme. To pin a specific
// version, set markdeepPath in your document.
( window.markdeepOptions ||=[] ).push({

    // showSectionNumbers: false,

});

// Mandatory activation line. DO NOT MODIFY OR RELOCATE
((d,o)=>d.head.appendChild(((m)=>{m.dataset.theme=d.currentScript.src;return m;})(Object.assign(d.createElement('script'),{src:o.find((e)=>e.markdeepPath)?.markdeepPath??d.currentScript.src.replace(/[^/]*$/,'markdeep2.min.js')}))))(document,window.markdeepOptions);
