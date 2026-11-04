// Company slide theme for Markdeep 2: print to PDF for landscape slides. Each
// level-2 heading is a section title slide, and each level-3 heading starts a
// slide under an accent band.

( window.markdeepOptions ||=[] ).push({
    stylesheets: {'company-slide': 'assets/company-slide.css'},

    main_nav: {align: 'none'},

    style: {
        body:    {fontSize: '25px'},
        // #article is border-box, so the maximum width includes the padding
        article: {maxWidth: '980px', paddingTop: '40px', paddingRight: '40px', paddingBottom: '40px', paddingLeft: '40px'},
        h1:      {fontSize: '50px', fontWeight: 'bold', marginTop: '250px', marginBottom: '40px'},
        strong:  {color: '#cf8313'},
        code:    {fontSize: '100%'},
        listing: {fontSize: '80%', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc'},
        table:   {fontSize: '100%', backgroundColor: '#eee'},
        td:      {borderStyle: 'none'},
        diagram: {zoom: '150%'},
    },
});

document.head.appendChild(Object.assign(document.createElement('script'), {src: document.currentScript.src.replace(/[^/]*$/, 'company-common.js')}));
