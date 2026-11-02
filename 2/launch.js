!function(){var e='loadLocalFileLocation',r=new URL(document.currentScript.src),t=new URLSearchParams(r.search).get('file')
;window.markdeepFileLoaded=window.markdeepFileLoaded||{};var n=localStorage.getItem(e),a=n?JSON.parse(n):{};if(t){if(!window.markdeepFileLoaded[t]){
for(var o=[],i=0;i<=10;++i)o.push('../'.repeat(i)+t);!function r(n){
if(0===n.length)return console.warn('launch: could not find "'+t+"\" within 10 directories above this document. Rendering without a theme."),
void document.head.appendChild(Object.assign(document.createElement('script'),{src:"https://morgan3d.github.io/markdeep/2/latest/markdeep2.min.js"}))
;var o=n[0],i=document.createElement('script');i.addEventListener('error',function(){r(n.slice(1))}),i.addEventListener('load',function(){var r;r=i.src,
window.markdeepFileLoaded[t]=!0,a[t]=r,localStorage.setItem(e,JSON.stringify(a))}),i.src=o,document.head.appendChild(i)}(a[t]?[a[t]].concat(o):o)}
}else console.error('launch: no file parameter in the loader query string')}();