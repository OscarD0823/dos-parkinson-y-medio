'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const ui = Object.fromEntries(['biblioteca','lector','load-error','chapter-list','progreso-global','empezar','reader-title','reader-chapter','chapter-select','pages','page-select','page-total','anterior','siguiente','chapter-end','chapter-end-text','modo-pagina','modo-vertical','reading-progress','reader-status','zoom-dialog','zoom-image','zoom-level','zoom-title','zoom-previous','zoom-next'].map(id => [id,$(id)]));
  let book, chapter, pageIndex = 0, zoomPageIndex = 0, mode = 'pagina', observer, zoom = 100;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pageTurn = window.ComicPageTurn;
  let activeTurn, gesture, suppressTouchClickUntil = 0;
  const storageKey = 'dos-parkinson-y-medio:lectura:v1';
  const available = () => book.chapters.filter(c => c.pages.length);
  const saved = () => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } };
  const save = () => { try { localStorage.setItem(storageKey,JSON.stringify({chapter:chapter.number,page:pageIndex+1,mode})); } catch {} };
  const element = (tag, className, text) => { const e=document.createElement(tag); if(className)e.className=className;if(text!==undefined)e.textContent=text;return e; };
  const route = (number,index=0,newMode=mode,replace=false) => {
    const hash=`#capitulo=${number}&pagina=${index+1}&modo=${newMode}`;
    if(replace){history.replaceState(null,'',hash);readRoute();}
    else if(location.hash===hash)readRoute();else{history.pushState(history.state,'',hash);readRoute();}
  };
  const message = text => {ui['reader-status'].textContent=text;};
  function renderLibrary(){
    const total=book.chapters.reduce((sum,c)=>sum+c.pages.length,0);
    const finished=book.chapters.filter(c=>c.pages.length>=c.plannedPages).length;
    ui['progreso-global'].textContent=total ? `${total} ${total===1?'página ilustrada disponible':'páginas ilustradas disponibles'} · ${finished} de 13 capítulos completos` : 'Primeras páginas en preparación · 13 capítulos previstos';
    ui['chapter-list'].replaceChildren();
    for(const c of book.chapters){
      const button=element('button','chapter-card');button.disabled=!c.pages.length;
      const number=element('span','chapter-number',String(c.number).padStart(2,'0'));number.setAttribute('aria-hidden','true');
      const info=element('span','chapter-info');info.append(element('h3','',c.title));
      const status=c.pages.length ? (c.pages.length>=c.plannedPages?`${c.pages.length} páginas · Capítulo completo`:`${c.pages.length} de ${c.plannedPages} páginas · En publicación`) : 'En preparación';
      info.append(element('small','',status));
      button.append(number,info,element('span','chapter-arrow',c.pages.length?'↗':'PRÓXIMAMENTE'));
      button.setAttribute('aria-label',`Capítulo ${c.number}: ${c.title}. ${status}`);
      button.addEventListener('click',()=>route(c.number));
      ui['chapter-list'].append(button);
    }
    const progress=saved();const resumable=progress&&available().some(c=>c.number===progress.chapter);
    ui.empezar.disabled=!total;
    ui.empezar.textContent=total?(resumable?'Continuar leyendo →':'Empezar a leer →'):'Preparando las primeras páginas';
    ui.empezar.onclick=()=>{if(resumable){const c=book.chapters.find(c=>c.number===progress.chapter);route(c.number,Math.min(Math.max(0,Number(progress.page)-1||0),c.pages.length-1),progress.mode==='vertical'?'vertical':'pagina');}else if(available().length)route(available()[0].number);};
  }
  function showLibrary(){
    cancelPageTurn();gesture=null;
    observer?.disconnect();ui.lector.hidden=true;ui.biblioteca.hidden=false;document.body.classList.remove('reader-active');
    document.title='Dos Parkinson y Medio · Cómic';renderLibrary();
    if(location.hash==='#capitulos')requestAnimationFrame(()=>$('capitulos').scrollIntoView());
  }
  function setProgress(){
    ui['reading-progress'].firstElementChild.style.width=`${(pageIndex+1)/chapter.pages.length*100}%`;
    ui['page-select'].value=String(pageIndex);save();
  }
  function showZoomPage(index,resetZoom=false){
    const p=chapter.pages[index];if(!p)return;
    zoomPageIndex=index;if(resetZoom)zoom=100;
    ui['zoom-image'].width=p.width||1024;ui['zoom-image'].height=p.height||1536;
    ui['zoom-image'].src=p.image;ui['zoom-image'].alt=p.alt||`Capítulo ${chapter.number}, página ${p.number}`;
    ui['zoom-title'].textContent=`Capítulo ${chapter.number} · Página ${p.number}`;
    ui['zoom-previous'].disabled=index===0;ui['zoom-next'].disabled=index===chapter.pages.length-1;
    ui['zoom-previous'].setAttribute('aria-label',`Página anterior${index?`, página ${index}`:''}`);
    ui['zoom-next'].setAttribute('aria-label',`Página siguiente${index+1<chapter.pages.length?`, página ${index+2}`:''}`);
    applyZoom();ui['zoom-dialog'].querySelector('.zoom-content').scrollTo(0,0);
  }
  function openZoom(p){
    cancelPageTurn();
    const index=chapter.pages.indexOf(p);showZoomPage(index>=0?index:pageIndex,true);
    ui['zoom-dialog'].showModal();ui['zoom-dialog'].querySelector('.zoom-content').scrollTo(0,0);
  }
  function turnZoomPage(direction){
    if(activeTurn)return;
    const next=zoomPageIndex+direction;if(next<0||next>=chapter.pages.length)return;
    const oldImage=!reducedMotion.matches?pageTurn?.capture(ui['zoom-image']):null;
    showZoomPage(next);route(chapter.number,next,mode);
    animatePageTurn(oldImage,direction,ui['zoom-image'],ui['zoom-image'].parentElement);
  }
  function applyZoom(){ui['zoom-image'].style.width=`${zoom}%`;ui['zoom-level'].textContent=`${zoom} %`;$('zoom-less').disabled=zoom===100;$('zoom-more').disabled=zoom===250;}
  function cancelPageTurn(){
    if(activeTurn){activeTurn.cancel();activeTurn=null;}
  }
  function animatePageTurn(image,direction,target=ui.pages.querySelector('.comic-image-button'),host=target?.closest('.comic-page')){
    if(!image||reducedMotion.matches||!target||!host||!pageTurn)return;
    cancelPageTurn();
    const turn=pageTurn.animate({source:image,target,host,direction});
    activeTurn=turn;
    turn?.finished.then(()=>{if(activeTurn===turn)activeTurn=null;});
  }
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)cancelPageTurn();});
  const canSwipe = () => !activeTurn&&mode==='pagina'&&!ui.lector.hidden&&!ui['zoom-dialog'].open&&(!window.visualViewport||window.visualViewport.scale<=1.01);
  document.addEventListener('touchstart',e=>{
    if(e.touches.length>1){cancelPageTurn();gesture=null;suppressTouchClickUntil=performance.now()+900;}
  },{passive:true,capture:true});
  ui.pages.addEventListener('touchstart',e=>{
    if(!canSwipe()||e.touches.length!==1||!e.target.closest('.comic-image-button'))return;
    const touch=e.touches[0];
    gesture={id:touch.identifier,x:touch.clientX,y:touch.clientY,time:performance.now(),axis:null};
  },{passive:true});
  ui.pages.addEventListener('touchmove',e=>{
    if(!gesture)return;
    const touch=Array.from(e.touches).find(t=>t.identifier===gesture.id);
    if(!touch||e.touches.length!==1||!canSwipe()){gesture=null;return;}
    const dx=Math.abs(touch.clientX-gesture.x),dy=Math.abs(touch.clientY-gesture.y);
    if(Math.max(dx,dy)>12){
      suppressTouchClickUntil=performance.now()+700;
      if(!gesture.axis)gesture.axis=dx>dy*1.35?'horizontal':'vertical';
    }
  },{passive:true});
  ui.pages.addEventListener('touchend',e=>{
    const start=gesture;gesture=null;
    if(!start||!canSwipe()||e.touches.length)return;
    const touch=Array.from(e.changedTouches).find(t=>t.identifier===start.id);if(!touch)return;
    const dx=touch.clientX-start.x,dy=touch.clientY-start.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))>12)suppressTouchClickUntil=performance.now()+700;
    if(start.axis==='vertical'||Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.5||performance.now()-start.time>900)return;
    const next=pageIndex+(dx<0?1:-1);
    if(next>=0&&next<chapter.pages.length)route(chapter.number,next);
  },{passive:true});
  ui.pages.addEventListener('touchcancel',()=>{gesture=null;suppressTouchClickUntil=performance.now()+700;},{passive:true});
  ui.pages.addEventListener('click',e=>{
    if(e.detail&&performance.now()<suppressTouchClickUntil){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  function makePage(p,index){
    const figure=element('figure','comic-page');figure.dataset.index=index;figure.id=`pagina-${p.number}`;
    const button=element('button','comic-image-button');button.setAttribute('aria-label',`Ampliar página ${p.number}`);
    const img=element('img');img.draggable=false;img.src=p.image;img.width=p.width||1024;img.height=p.height||1536;img.alt=p.alt||`Capítulo ${chapter.number}, página ${p.number}`;img.loading=(index===pageIndex?'eager':'lazy');img.decoding='async';
    img.addEventListener('error',()=>{message(`No se pudo cargar la página ${p.number}. Comprueba tu conexión.`);});
    button.append(img);button.addEventListener('click',()=>openZoom(p));
    const caption=element('figcaption');caption.append(element('span','',`CAPÍTULO ${chapter.number} · PÁGINA ${String(p.number).padStart(2,'0')}`));
    const download=element('a','', 'Guardar imagen ↓');download.href=p.image;download.download=p.image.split('/').pop();caption.append(download);
    figure.append(button,caption);
    if(p.transcript){const details=element('details');details.append(element('summary','','Leer transcripción'),element('p','',p.transcript));figure.append(details);}
    return figure;
  }
  function renderReader({preservePagePosition=false}={}){
    ui.pages.dataset.mode=mode;
    document.querySelector('.reader-hint').textContent=mode==='pagina'?'Desliza para pasar la hoja. Amplía una página y toca sus bordes para cambiar de página. Tu lectura se guarda.':'Desplázate hacia abajo para leer. En la ampliación, toca los bordes para cambiar de página.';
    observer?.disconnect();ui.biblioteca.hidden=true;ui.lector.hidden=false;document.body.classList.add('reader-active');
    document.title=`${chapter.title} · Dos Parkinson y Medio`;
    ui['reader-title'].textContent=chapter.title;ui['reader-chapter'].textContent=`CAPÍTULO ${String(chapter.number).padStart(2,'0')}`;
    ui['chapter-select'].replaceChildren();
    for(const c of book.chapters){const option=element('option','',`${c.number}. ${c.title}${c.pages.length?'':' · En preparación'}`);option.value=c.number;option.disabled=!c.pages.length;ui['chapter-select'].append(option);}
    ui['chapter-select'].value=chapter.number;
    ui['modo-pagina'].setAttribute('aria-pressed',String(mode==='pagina'));ui['modo-vertical'].setAttribute('aria-pressed',String(mode==='vertical'));
    ui['page-select'].replaceChildren();for(let i=0;i<chapter.pages.length;i++){const option=element('option','',String(i+1));option.value=i;ui['page-select'].append(option);}
    ui['page-total'].textContent=`de ${chapter.pages.length}`;
    ui.pages.replaceChildren(...(mode==='vertical'?chapter.pages.map((p,i)=>makePage(p,i)):[makePage(chapter.pages[pageIndex],pageIndex)]));
    $('page-navigation').hidden=mode==='vertical';ui.anterior.disabled=pageIndex===0;
    ui.siguiente.disabled=pageIndex===chapter.pages.length-1;
    const atEnd=mode==='vertical'||pageIndex===chapter.pages.length-1;
    ui['chapter-end'].hidden=!atEnd;
    ui['chapter-end-text'].textContent=chapter.pages.length<chapter.plannedPages ? `Has llegado a la última página publicada de este capítulo. Las siguientes están en preparación (${chapter.pages.length} de ${chapter.plannedPages}).` : 'Has terminado este capítulo. Vuelve al índice para continuar con las entregas disponibles.';
    message('');setProgress();
    if(mode==='vertical'){
      observer=new IntersectionObserver(entries=>{
        const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
        if(visible.length){pageIndex=Number(visible[0].target.dataset.index);setProgress();history.replaceState(null,'',`#capitulo=${chapter.number}&pagina=${pageIndex+1}&modo=vertical`);}
      },{threshold:[.15,.3,.5,.7]});
      ui.pages.querySelectorAll('figure').forEach(e=>observer.observe(e));
      requestAnimationFrame(()=>$(`pagina-${chapter.pages[pageIndex].number}`).scrollIntoView({behavior:'instant',block:'start'}));
    }else{
      if(!preservePagePosition)window.scrollTo({top:ui.lector.offsetTop,behavior:'instant'});
      for(const index of [pageIndex-1,pageIndex+1])if(chapter.pages[index]){const preload=new Image();preload.src=chapter.pages[index].image;}
    }
  }
  function readRoute(){
    if(!book)return;
    cancelPageTurn();gesture=null;
    const params=new URLSearchParams(location.hash.slice(1));const number=Number(params.get('capitulo'));
    const found=available().find(c=>c.number===number);
    if(!found){showLibrary();return;}
    const nextIndex=Math.min(Math.max(0,Math.floor(Number(params.get('pagina'))||1)-1),found.pages.length-1);
    const nextMode=params.get('modo')==='vertical'?'vertical':'pagina';
    const preservePagePosition=!ui.lector.hidden&&chapter===found&&mode==='pagina'&&nextMode==='pagina'&&nextIndex!==pageIndex;
    const turn=preservePagePosition&&!ui['zoom-dialog'].open;
    const oldImage=turn&&!reducedMotion.matches?pageTurn?.capture(ui.pages.querySelector('.comic-image-button img')):null;
    const direction=Math.sign(nextIndex-pageIndex);
    chapter=found;pageIndex=nextIndex;mode=nextMode;renderReader({preservePagePosition});
    animatePageTurn(oldImage,direction);
  }
  async function load(){
    ui['load-error'].hidden=true;
    try{
      const response=await fetch('data/libro.json',{cache:'no-cache'});if(!response.ok)throw new Error('No se pudo cargar el índice');
      book=await response.json();if(!Array.isArray(book.chapters))throw new Error('Índice inválido');
      renderLibrary();readRoute();
    }catch(error){ui['progreso-global'].textContent='El índice no está disponible en este momento.';ui['load-error'].hidden=false;}
  }
  $('volver').onclick=()=>{location.hash='';window.scrollTo(0,0);};
  $('indice').onclick=$('end-library').onclick=()=>{location.hash='capitulos';};
  ui.anterior.onclick=()=>{if(!activeTurn&&pageIndex>0)route(chapter.number,pageIndex-1);};
  ui.siguiente.onclick=()=>{if(!activeTurn&&pageIndex+1<chapter.pages.length)route(chapter.number,pageIndex+1);};
  ui['chapter-select'].onchange=e=>route(Number(e.target.value));ui['page-select'].onchange=e=>route(chapter.number,Number(e.target.value));
  ui['modo-pagina'].onclick=()=>route(chapter.number,pageIndex,'pagina');ui['modo-vertical'].onclick=()=>route(chapter.number,pageIndex,'vertical');
  $('zoom-more').onclick=()=>{cancelPageTurn();zoom=Math.min(250,zoom+25);applyZoom();};$('zoom-less').onclick=()=>{cancelPageTurn();zoom=Math.max(100,zoom-25);applyZoom();};
  ui['zoom-previous'].onclick=()=>turnZoomPage(-1);ui['zoom-next'].onclick=()=>turnZoomPage(1);
  $('zoom-close').onclick=()=>ui['zoom-dialog'].close();
  ui['zoom-dialog'].addEventListener('click',e=>{if(e.target===ui['zoom-dialog'])ui['zoom-dialog'].close();});
  ui['zoom-dialog'].addEventListener('close',()=>{cancelPageTurn();ui.pages.querySelector(`[data-index="${zoomPageIndex}"] .comic-image-button`)?.focus({preventScroll:true});});
  ui['zoom-dialog'].addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.key==='ArrowLeft'&&!ui['zoom-previous'].disabled){e.preventDefault();turnZoomPage(-1);}
    if(e.key==='ArrowRight'&&!ui['zoom-next'].disabled){e.preventDefault();turnZoomPage(1);}
  });
  $('compartir').onclick=async()=>{
    const data={title:`Dos Parkinson y Medio · Capítulo ${chapter.number}`,url:location.href};
    try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);message('Enlace copiado.');}else message(`Enlace: ${location.href}`);}catch(error){if(error.name!=='AbortError')message('Puedes compartir el enlace de la barra de direcciones.');}
  };
  document.addEventListener('keydown',e=>{
    if(ui.lector.hidden||ui['zoom-dialog'].open||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName))return;
    if(mode==='pagina'&&e.key==='ArrowRight'&&!ui.siguiente.disabled){e.preventDefault();ui.siguiente.click();}
    if(mode==='pagina'&&e.key==='ArrowLeft'&&!ui.anterior.disabled){e.preventDefault();ui.anterior.click();}
  });
  window.addEventListener('hashchange',readRoute);$('reintentar').onclick=load;load();
})();
