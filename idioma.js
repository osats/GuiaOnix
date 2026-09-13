(() => {
 const supported=['pt','en','es','fr'];
 const page=document.body.dataset.page;
 const current=document.body.dataset.language;
 const requested=new URLSearchParams(location.search).get('idioma');
 let saved=null;try{saved=localStorage.getItem('onix-language')}catch(e){}
 const detected=(navigator.languages||[navigator.language]).map(x=>x.toLowerCase().split('-')[0]).find(x=>supported.includes(x));
 const selected=supported.includes(requested)?requested:supported.includes(saved)?saved:detected||'pt';
 try{localStorage.setItem('onix-language',selected)}catch(e){}
 if(current!==selected)location.replace(page+(selected==='pt'?'':'-'+selected)+'.html?idioma='+selected+location.hash);
 document.querySelectorAll('.languages a').forEach(a=>a.addEventListener('click',()=>{
  a.hash=location.hash;
  try{localStorage.setItem('onix-language',a.hreflang)}catch(e){}
 }));
})();
