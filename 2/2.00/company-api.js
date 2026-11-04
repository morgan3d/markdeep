// Company API theme for Markdeep 2: the outline on the left under a dark logo
// band, accent links, and flat code.

( window.markdeepOptions ||=[] ).push({
    stylesheets: {'company-api': 'assets/company-api.css'},

    definitionStyle: 'long',

    style: {
        body: {fontSize: '14px', fontWeight: 400, lineHeight: '170%', textAlign: 'left'},
        h1:   {fontSize: '21px', fontWeight: 900},
        h2:   {fontSize: '150%', fontWeight: 'bold',
               borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#000',
               paddingTop: '25px', paddingBottom: '25px', marginBottom: '25px'},
        h3:   {fontSize: '120%', color: 'rgb(0, 72, 49)',
               borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#cf8313'},
        h4:   {fontSize: '120%'},
        h5:   {fontSize: '120%'},
        h6:   {fontSize: '120%'},
        code: {backgroundColor: 'unset'},

        admonition: {position: 'relative', borderRadius: 'unset', marginLeft: '-10px', paddingLeft: '48px',
                     borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: 'rgb(118, 185, 0)',
                     backgroundColor: 'unset'},
        admonition_warn:  {borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: 'rgb(255, 165, 0)',
                           backgroundColor: 'unset'},
        admonition_tip:   {borderWidth: '1px 1px 1px 2.5rem', borderStyle: 'solid', borderColor: 'rgba(68,138,255,1)',
                           backgroundColor: '#202020'},
        admonition_error: {borderWidth: '1px 1px 1px 2.5rem', borderStyle: 'solid', borderColor: 'rgba(255,23,68,1)',
                           backgroundColor: '#202020'},
    },

    // Start the outline text below the logo band at its top
    main_nav: {align: 'left',
               style: {width: '200px', overflowY: 'auto', whiteSpace: 'nowrap',
                       paddingTop: '115px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '10px',
                       borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: '#777'}},
});

document.head.appendChild(Object.assign(document.createElement('script'), {src: document.currentScript.src.replace(/[^/]*$/, 'company-common.js')}));
