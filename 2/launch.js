!function(){const e=new URLSearchParams(new URL(document.currentScript.src).search),t=e.get('file')
;if(!t)return void console.error('launch.js missing file query parameter');if(window.markdeepFileLoaded||={},window.markdeepFileLoaded[t])return
;const o=e.get('background');if(null!==o){const e='[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|white|black',t=new RegExp(`^(?:(${e})|light-dark\\((${e}),(${e})\\))$`).exec(o)
;if(t){let e=t[1];if(void 0===e){const o=localStorage.getItem('markdeepColorScheme')
;e='dark'===o||'light'!==o&&matchMedia('(prefers-color-scheme: dark)').matches?t[3]:t[2]}
const o='white'===e||'black'===e?e:'#'+e,n=Object.assign(document.createElement('style'),{className:'fallback',
textContent:`body{background:${o};color:rgba(0,0,0,0)}`});document.head.appendChild(n),window.addEventListener('load',function(){'markdeep'in window||n.remove()
})}else console.error(`launch.js background must be 3 or 6 hex digits, white, black, or light-dark() of two of those, not "${o}"`)}
const n=JSON.parse(localStorage.getItem('loadLocalFileLocation')||'{}'),a=[];for(let e=0;e<=10;++e)a.push('../'.repeat(e)+t);!function e(o){
if(0===o.length)return console.warn(`launch.js could not find "${t}" within 10 directories. Rendering without a theme.`),
void document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://morgan3d.github.io/markdeep/2/latest/markdeep2.min.js'}))
;const a=o[0],r=document.createElement('script');r.addEventListener('error',function(){e(o.slice(1))}),r.addEventListener('load',function(){var e;e=r.src,
window.markdeepFileLoaded[t]=!0,n[t]=e,localStorage.setItem('loadLocalFileLocation',JSON.stringify(n))}),r.src=a,document.head.appendChild(r)
}(n[t]?[n[t]].concat(a):a)}();