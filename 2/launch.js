// Markdeep 2 theme loader (RMD89q). A document opened from a local file carries
// one fixed URL - this script - and names the theme it wants in the query
// string. We find that theme by walking upward from the document, so no
// document ever contains a relative path to its theme and rearranging the tree
// costs nothing.
//
// The injected sources are relative, so they resolve against the *document*
// base rather than our origin. That is the whole mechanism: the walk happens
// in the author's tree even though this script came from elsewhere.

(function () {
    var MAX_DEPTH = 10;
    var CACHE_KEY = 'loadLocalFileLocation';
    var FALLBACK_RENDERER = 'https://morgan3d.github.io/markdeep/2/latest/markdeep2.min.js';

    var scriptUrl = new URL(document.currentScript.src);
    var filename = new URLSearchParams(scriptUrl.search).get('file');

    window.markdeepFileLoaded = window.markdeepFileLoaded || {};

    // Maps a wanted filename to the full path where it was last found. The
    // loader owns this, not the theme: a theme should contain only what its
    // author wrote.
    var cacheRaw = localStorage.getItem(CACHE_KEY);
    var cache = cacheRaw ? JSON.parse(cacheRaw) : {};

    function succeed(resolvedSrc) {
        window.markdeepFileLoaded[filename] = true;
        cache[filename] = resolvedSrc;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }

    // Best effort for the reader. The document's author already chose to
    // fetch this script from the Markdeep site, so loading the renderer from
    // the same place discloses nothing new and transmits no reader data.
    // Someone who opened a document they did not write, and who has never
    // heard of Markdeep, gets a plain but readable page instead of raw source.
    function giveUp() {
        console.warn('launch: could not find "' + filename + '" within ' +
                     MAX_DEPTH + ' directories above this document. ' +
                     'Rendering without a theme.');
        document.head.appendChild(Object.assign(document.createElement('script'),
                                                {src: FALLBACK_RENDERER}));
    }

    function tryNext(remaining) {
        if (remaining.length === 0) { giveUp(); return; }

        var src = remaining[0];
        var element = document.createElement('script');

        element.addEventListener('error', function () {
            tryNext(remaining.slice(1));
        });

        element.addEventListener('load', function () {
            succeed(element.src);
        });

        element.src = src;
        document.head.appendChild(element);
    }

    if (!filename) {
        console.error('launch: no file parameter in the loader query string');
        return;
    }

    // Already loaded by another route on this page; nothing to do.
    if (window.markdeepFileLoaded[filename]) { return; }

    // Try the remembered location first, then sweep upward. A remembered
    // location that is still correct settles the walk in one attempt and
    // logs nothing, which is the entire point of remembering it.
    var sweep = [];
    for (var d = 0; d <= MAX_DEPTH; ++d) { sweep.push('../'.repeat(d) + filename); }
    tryNext(cache[filename] ? [cache[filename]].concat(sweep) : sweep);
})();
