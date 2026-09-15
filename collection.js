/* Progressive enhancement: keyboard tabs and scannable operational times. */
(() => {
 const enhanceTabs = () => {
  const tabs=[...document.querySelectorAll('.rb-tab')];
  tabs.forEach((tab,i)=>tab.addEventListener('keydown',e=>{
   let next;
   if(e.key==='ArrowRight')next=(i+1)%tabs.length;
   if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;
   if(e.key==='Home')next=0;
   if(e.key==='End')next=tabs.length-1;
   if(next!==undefined){e.preventDefault();tabs[next].click();tabs[next].focus();}
  }));
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceTabs);else enhanceTabs();
 document.querySelectorAll('.directory-card p:not(.eyebrow)').forEach(p=>{
  // Only typographic emphasis: preserve every word and every hour.
  p.innerHTML=p.innerHTML.replace(/\b\d{1,2}h\d{2}(?:[–—]\d{1,2}h\d{2})?/g,'<strong>$&</strong>');
 });
})();
