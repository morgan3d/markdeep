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

        const COLOR = '[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|white|black';
        const match = new RegExp(`^(?:(${COLOR})|light-dark\\((${COLOR}),(${COLOR})\\))$`).exec(background);

        if (match) {

            let value = match[1];
            if (value === undefined) {
                // Choose the scheme as the renderer does: the stored choice, then the system
                const stored = localStorage.getItem('markdeepColorScheme');
                const dark = (stored === 'dark') ||
                      ((stored !== 'light') && matchMedia('(prefers-color-scheme: dark)').matches);
                value = dark ? match[3] : match[2];
            }

            const hide = Object.assign(document.createElement('style'), {
                className: 'fallback',
                textContent: `body{background:${((value === 'white' || value === 'black') ? '' : '#') + value};color:rgba(0,0,0,0)}`
            });

            document.head.appendChild(hide);
            window.addEventListener('load', function () {
                if (! ('markdeep' in window)) { hide.remove(); }
            });

        } else {
            console.error(`launch.js background must be 3 or 6 hex digits, white, black, or light-dark() of two of those, not "${background}"`);
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
