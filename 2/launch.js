!function(){const e=new URLSearchParams(new URL(document.currentScript.src).search),t=e.get('file')
;if(!t)return void console.error('launch.js missing file query parameter');if(window.markdeepFileLoaded||={},window.markdeepFileLoaded[t])return
;const n=e.get('background');if(null!==n)if(/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|white|black)$/.test(n)){
const e='white'===n||'black'===n?n:'#'+n,t=Object.assign(document.createElement('style'),{className:'fallback',
textContent:`body{background:${e};color:rgba(0,0,0,0)}`});document.head.appendChild(t),window.addEventListener('load',function(){'markdeep'in window||t.remove()
})}else console.error(`launch.js background must be 3 or 6 hex digits, white, or black, not "${n}"`)
;const o=JSON.parse(localStorage.getItem('loadLocalFileLocation')||'{}'),a=[];for(let e=0;e<=10;++e)a.push('../'.repeat(e)+t);!function e(n){
if(0===n.length)return console.warn(`launch.js could not find "${t}" within 10 directories. Rendering without a theme.`),
void document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://morgan3d.github.io/markdeep/2/latest/markdeep2.min.js'}))
;const a=n[0],r=document.createElement('script');r.addEventListener('error',function(){e(n.slice(1))}),r.addEventListener('load',function(){var e;e=r.src,
window.markdeepFileLoaded[t]=!0,o[t]=e,localStorage.setItem('loadLocalFileLocation',JSON.stringify(o))}),r.src=a,document.head.appendChild(r)
}(o[t]?[o[t]].concat(a):a)}();