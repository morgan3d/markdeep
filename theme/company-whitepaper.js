// Company whitepaper theme for Markdeep 2: a cover page with the company
// background and logo behind the title, and each top-level section on a new
// printed page.

( window.markdeepOptions ||=[] ).push({
    stylesheets: {'company-whitepaper': 'assets/company-whitepaper.css'},

    style: {
        body: {fontSize: '11pt', fontWeight: 100},
        h1:   {fontSize: '24pt', fontWeight: 400},
        h2:   {fontSize: '24pt', fontWeight: 400, color: '#cf8313',
               borderBottomWidth: '3px', borderBottomStyle: 'solid', borderBottomColor: '#cf8313',
               paddingBottom: '10px', marginTop: '50px', marginBottom: '40px', breakBefore: 'page'},
        h3:   {fontSize: '22pt', color: '#cf8313'},
        h4:   {fontSize: '19pt', fontWeight: 400, color: '#cf8313'},
        h5:   {fontSize: '17pt', fontWeight: 400, color: '#cf8313'},
        h6:   {fontSize: '15pt', fontWeight: 400, color: '#cf8313'},
        table: {width: '100%', fontSize: '10pt', fontWeight: 100},
        th:    {fontSize: '12pt'},
        caption: {fontSize: '14pt', fontStyle: 'normal', fontWeight: 700},
    },
});

document.head.appendChild(Object.assign(document.createElement('script'), {src: document.currentScript.src.replace(/[^/]*$/, 'company-common.js')}));
