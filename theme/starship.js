// Starship theme for Markdeep 2

( window.markdeepOptions ||=[] ).push({
    definitionStyle: 'long',
    stylesheets: {starship: 'assets/starship.css'},

    // Antonio, for the headings and the overview pills. Load it here, because
    // @import must precede every rule and the renderer injects the theme
    // stylesheet.
    fontStylesheets: ['https://fonts.googleapis.com/css2?family=Antonio:wght@400;700&display=swap'],

    // Style vocabulary entries. starship.css contains the custom properties,
    // pseudo-elements, sticky section chrome, section colours, and media
    // queries.
    style: {
        body: {
            fontFamily: 'Helvetica, sans-serif',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '170%',
            color: '#ddd',
            backgroundColor: 'var(--page-color)',
            marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px',
            // Use border-box, because Markdeep sets body height to 100dvh:
            // padding would overflow, and an anchor jump would scroll the page
            // under the fixed cover strip and cut the top off a stuck H2.
            boxSizing: 'border-box',
            // Pad only the top. body clips its overflow at the viewport
            // height, so bottom padding adds a page-color strip below every
            // scroll region, and #content's left padding sets the distance to
            // the curved section heading.
            paddingTop: 'var(--page-top-padding)',
            paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px',
            maxWidth: 'unset',
            scrollbarGutter: 'stable'
        },

        // The bar is painted at #content's border box. Reserve in the right
        // padding the --section-border-right-size rail, the scrollbar strip,
        // and 4px. Paint a white thumb on a transparent track over the
        // content.
        content: {
            scrollbarWidth: 'thin',
            scrollbarColor: '#fff transparent',
            paddingLeft: '12px',
            paddingRight: 'calc(var(--section-border-right-size) + var(--scrollbar-offset) + 4px)'
        },

        // Fill the cell, so that the prose runs to the left edge and the
        // section rail runs across to the overview
        main_header: {maxWidth: 'none'},
        article:     {maxWidth: 'none'},
        main_footer: {maxWidth: 'none'},

        h1: {
            fontSize: '55px',
            marginTop: '0px',
            marginBottom: '0px',
            textAlign: 'center',
            color: 'var(--starship-orange)'
        },

        code: {
            fontSize: '90%',
            color: '#fff',
            backgroundColor: 'unset',
            paddingLeft: '2px',
            paddingRight: '2px'
        },

        listing: {
            // Keep padding and border inside the full width, clear of the
            // section rail
            boxSizing: 'border-box',
            fontSize: '100%',
            lineHeight: 'normal',
            backgroundColor: '#202020',
            borderWidth: '1px', borderStyle: 'solid', borderColor: '#777',
            boxShadow: '0px 1px 2px rgba(0,0,0,0.5)',
            overflowX: 'auto'
        },

        table:        {backgroundColor: '#2a2a2a'},
        table_stripe: {backgroundColor: '#202020'},
        td:           {borderWidth: '1px', borderStyle: 'solid', borderColor: '#202020'},
        // Color each table header with its enclosing section's colour
        th:           {borderWidth: '1px', borderStyle: 'solid', borderColor: '#202020',
                       backgroundColor: 'var(--section-border-color)',
                       color: 'var(--page-color)'},

        diagram:        {stroke: '#ccc', fill: '#ccc'},
        // Shade enclosed regions dark against the dark page
        diagram_region: {fill: '#282828'},

        admonition: {
            position: 'unset',
            boxShadow: '0px 1px 2px rgba(0,0,0,0.5)',
            backgroundColor: '#202020',
            borderWidth: '1px 1px 1px 2.5rem', borderStyle: 'solid',
            borderColor: 'rgba(68,138,255,1)'
        },
        admonition_tip: {
            backgroundColor: '#202020',
            borderWidth: '1px 1px 1px 2.5rem', borderStyle: 'solid',
            borderColor: 'rgba(68,138,255,1)'
        },
        admonition_warn: {
            backgroundColor: '#202020',
            borderWidth: '1px 1px 1px 2.5rem', borderStyle: 'solid',
            borderColor: 'rgba(255,170,0,1)'
        },
        admonition_error: {
            backgroundColor: '#202020',
            borderWidth: '1px 1px 1px 2.5rem', borderStyle: 'solid',
            borderColor: 'rgba(255,23,68,1)'
        }
    },

    // Force the dark scheme of Starship's colors
    initialColorScheme: 'dark',
    enableColorSchemeChoice: false,

    // Reserve the overview's width on the right. #content extends
    // --scrollbar-offset into this column to move the bar right, and pads it
    // back to keep the article in place. The overview is fixed to the window.
    main_nav: {align: 'right',
               style: {width: 'calc(var(--nav-size) - var(--scrollbar-offset))',
                       paddingLeft: '24px'}},
});

// Paint black until the stylesheets load
document.documentElement.style.backgroundColor = '#000';

// Mandatory activation line. DO NOT MODIFY OR RELOCATE
((d,o)=>d.head.appendChild(((m)=>{m.dataset.theme=d.currentScript.src;return m;})(Object.assign(d.createElement('script'),{src:o.find((e)=>e.markdeepPath)?.markdeepPath??d.currentScript.src.replace(/[^/]*$/,'markdeep2.min.js')}))))(document,window.markdeepOptions);
