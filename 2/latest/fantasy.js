// Fantasy theme for Markdeep
// 
( window.markdeepOptions ||=[] ).push({

    // showSectionNumbers: false,
    main_nav: {align: 'none'},

    stylesheets: {'fantasy': 'assets/fantasy.css'},
 
    initialColorScheme: 'light',
    enableColorSchemeChoice: false,

    fontStylesheets: [
        'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet',
        'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet'
    ],

    style: {
        body: {
            fontFamily: "'Libre Baskerville', serif",
            lineHeight: '2em',
            textAlign: 'left',
            backgroundImage: `url('${document.currentScript.src.replace(/[^/]*$/, '')}assets/watercolor.jpg')`
        },

        h1: {
            fontFamily: "'Great Vibes', cursive",
            fontSize: '64px',
            textAlign: 'center',
            marginTop: '128px',
            textShadow: '0 0 20px #fff, 0 0 8px #fff'
        },

        hr: {
            color: 'purple',
            textAlign: 'center',
            fontWeight: '100',
            fontSize: '24px',
            borderStyle: 'none',
            height: '32px'
        },

        heading: {
            color: 'purple'
        }
    }           
});

// Mandatory activation line. DO NOT MODIFY OR RELOCATE
((d,o)=>d.head.appendChild(((m)=>{m.dataset.theme=d.currentScript.src;return m;})(Object.assign(d.createElement('script'),{src:o.find((e)=>e.markdeepPath)?.markdeepPath??d.currentScript.src.replace(/[^/]*$/,'markdeep2.min.js')}))))(document,window.markdeepOptions);
