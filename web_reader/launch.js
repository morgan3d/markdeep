// Markdeep 2 theme file discovery and launcher

(function () {
    const MAX_DEPTH = 10;
    const query = new URLSearchParams(new URL(/** @type {HTMLScriptElement} */ (document.currentScript).src).search);
    const filename = query.get('file');

    if (! filename) {
        console.error('launch.js missing file query parameter');
        return;
    }

    window.markdeepFileLoaded ||= {};
    if (window.markdeepFileLoaded[filename]) { return; }

    // Hide the source until the renderer removes every fallback element. With
    // no renderer, show the source again at load.
    const background = query.get('background');
    if (background !== null) {
        if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|white|black)$/.test(background)) {
            const color = (background === 'white' || background === 'black') ? background : '#' + background;
            const hide = Object.assign(document.createElement('style'), {
                className: 'fallback',
                textContent: `body{background:${color};color:rgba(0,0,0,0)}`
            });
            document.head.appendChild(hide);
            window.addEventListener('load', function () {
                if (! ('markdeep' in window)) { hide.remove(); }
            });
        } else {
            console.error(`launch.js background must be 3 or 6 hex digits, white, or black, not "${background}"`);
        }
    }

    // Maps files to last discovered locations
    const cache = JSON.parse(localStorage.getItem('loadLocalFileLocation') || '{}');

    function succeed(resolvedSrc) {
        window.markdeepFileLoaded[filename] = true;
        cache[filename] = resolvedSrc;
        localStorage.setItem('loadLocalFileLocation', JSON.stringify(cache));
    }

    // Failover to markdeep default theme, and then to plain text.
    function giveUp() {
        console.warn(`launch.js could not find "${filename}" within ${MAX_DEPTH} directories. Rendering without a theme.`);
        document.head.appendChild(Object.assign(document.createElement('script'), {
            src: 'https://morgan3d.github.io/markdeep/2/latest/markdeep2.min.js'
        }));
    }

    function tryNext(remaining) {
        if (remaining.length === 0) { giveUp(); return; }

        const src = remaining[0];
        const element = document.createElement('script');

        element.addEventListener('error', function () {
            tryNext(remaining.slice(1));
        });

        element.addEventListener('load', function () {
            succeed(element.src);
        });

        element.src = src;
        document.head.appendChild(element);
    }

    const search = [];
    for (let d = 0; d <= MAX_DEPTH; ++d) { search.push('../'.repeat(d) + filename); }

    // Try the cached location first, and then search upward.
    tryNext(cache[filename] ? [cache[filename]].concat(search) : search);
})();
