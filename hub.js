/* Digital Hub Stage 11 — public catalogue and page interactions */
(() => {
  'use strict';
  const SUPABASE_URL = 'https://njlzebhvwubblcsendiz.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_G1lTGHb8rbZVT2hT_v7VWA_GjIxRi1m';
  const BUCKET = 'hub-files';
  const PAGE = document.body.dataset.page || 'home';
  const CATEGORIES = {
    music:{label:'Music Library',icon:'♫',href:'music.html'},
    metallurgy:{label:'Metallurgy Hub',icon:'⚙',href:'metallurgy.html'},
    technology:{label:'Technology Hub',icon:'⌘',href:'technology.html'},
    resource:{label:'Resources Centre',icon:'▤',href:'resources.html'}
  };
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const formatSize = value => { const n=Number(value); if(!Number.isFinite(n)||n<=0)return ''; if(n<1048576)return `${Math.max(1,Math.round(n/1024))} KB`; return `${(n/1048576).toFixed(1)} MB`; };
  const formatDate = value => { if(!value)return ''; const d=new Date(value); return Number.isNaN(d.getTime())?'':d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); };
  const fileKind = item => {
    const mime=String(item.mime_type||'').toLowerCase(), name=String(item.original_file_name||'').toLowerCase();
    const ext=(name.split('.').pop()||'').trim();
    if(mime.includes('pdf')||ext==='pdf')return 'pdf';
    if(mime.startsWith('audio/')||['mp3','wav','ogg','m4a','aac','flac','opus'].includes(ext))return 'audio';
    if(mime.includes('spreadsheet')||['xls','xlsx','csv','ods'].includes(ext))return 'spreadsheet';
    if(mime.includes('presentation')||['ppt','pptx','odp'].includes(ext))return 'presentation';
    if(mime.startsWith('image/')||['jpg','jpeg','png','gif','webp','svg'].includes(ext))return 'image';
    if(mime.includes('word')||['doc','docx','odt','rtf'].includes(ext))return 'document';
    return 'other';
  };
  const getPublicUrl = path => path ? hubClient.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || '' : '';
  const contentSearch = item => [item.title,item.creator,item.album,item.description,item.original_file_name,CATEGORIES[item.content_type]?.label].filter(Boolean).join(' ').toLowerCase();
  const navToggle=$('menuToggle'), navLinks=$('navLinks');
  if(navToggle&&navLinks){navToggle.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(open));navToggle.textContent=open?'×':'☰';navToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');});navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{navLinks.classList.remove('open');navToggle.setAttribute('aria-expanded','false');navToggle.textContent='☰';}));}
  if($('year'))$('year').textContent=new Date().getFullYear();
  const categoryNav=PAGE==='home'?'home':PAGE;
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===categoryNav)a.setAttribute('aria-current','page');});
  if(!window.supabase||!window.supabase.createClient){showGlobalError('The content service did not load. Check your internet connection and refresh.');return;}
  if(!/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/.test(SUPABASE_URL)||!(SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')||SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ'))){showGlobalError('The public catalogue connection needs to be checked by the site owner.');return;}
  const hubClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  let allItems=[];
  function showGlobalError(message){document.querySelectorAll('.status').forEach(el=>el.textContent=message);if($('latestEmpty')){$('latestEmpty').hidden=false;$('latestEmpty').textContent=message;}}
  function coverMarkup(item,type){const coverUrl=item.cover_path?getPublicUrl(item.cover_path):'';if(type==='music'&&coverUrl)return `<img class="cover" src="${escapeHtml(coverUrl)}" alt="Cover artwork for ${escapeHtml(item.title)}" loading="lazy">`;return `<div class="cover cover-fallback" aria-hidden="true">${CATEGORIES[type]?.icon||'▤'}</div>`;}
  function itemCard(item,options={}){
    const type=item.content_type, label=CATEGORIES[type]?.label||'Digital Hub';
    const fileUrl=getPublicUrl(item.file_path), downloadUrl=fileUrl?`${fileUrl}${fileUrl.includes('?')?'&':'?'}download=${encodeURIComponent(item.original_file_name||'download')}`:'';
    const kind=fileKind(item), isMusic=type==='music', isPdf=kind==='pdf';
    const title=escapeHtml(item.title), creator=escapeHtml(item.creator||'Digital Hub'), album=String(item.album||'').trim();
    const desc=item.description?`<p class="description">${escapeHtml(item.description)}</p>`:'';
    const meta=[item.original_file_name,formatSize(item.file_size),formatDate(item.created_at)].filter(Boolean).map(escapeHtml).join(' · ');
    let actions='';
    if(isMusic){actions=`<div class="play-row"><button class="play-button" type="button" data-play="${escapeHtml(item.id)}" aria-label="Play ${title}">▶</button><span class="play-label">Play track</span></div><div class="card-actions"><a class="action" href="${escapeHtml(downloadUrl)}" rel="noopener">Download song ↓</a></div>`;}
    else {actions=`<div class="card-actions">${isPdf?`<button class="action" type="button" data-preview="${escapeHtml(item.id)}">Preview PDF ↗</button>`:`<a class="action secondary" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer">Open file ↗</a>`}<a class="action" href="${escapeHtml(downloadUrl)}" rel="noopener">Download ↓</a></div>`;}
    return `<article class="content-card" data-item-id="${escapeHtml(item.id)}"><div class="content-top">${coverMarkup(item,type)}<div class="content-meta"><span class="pill">${escapeHtml(label)}</span><h3 class="content-title">${title}</h3><div class="creator">${isMusic?'Artist: ': 'By: '}${creator}</div>${isMusic?(album?`<div class="album">Album: ${escapeHtml(album)}</div>`:'<div class="album">Album details not provided</div>'):''}</div></div>${desc}${actions}${meta?`<div class="file-meta">${meta}</div>`:''}</article>`;
  }
  function renderCards(items,host){if(!host)return;host.innerHTML=items.map(item=>itemCard(item)).join('');}
  function showPreview(item){const dialog=$('previewDialog'),frame=$('previewFrame'),title=$('previewTitle');if(!dialog||!frame)return;const url=getPublicUrl(item.file_path);if(!url)return;title.textContent=item.title||'PDF preview';frame.src=url+'#toolbar=1&navpanes=0&view=FitH';if(typeof dialog.showModal==='function')dialog.showModal();else window.open(url,'_blank','noopener');}
  function setupPreview(){const dialog=$('previewDialog'),close=$('closePreview');if(close)close.addEventListener('click',()=>{dialog.close();$('previewFrame').src='about:blank';});if(dialog)dialog.addEventListener('click',e=>{if(e.target===dialog){dialog.close();$('previewFrame').src='about:blank';}});}
  function setupPlayer(){const audio=$('globalAudio'),bar=$('miniPlayer');if(!audio||!bar)return;document.addEventListener('click',e=>{const btn=e.target.closest('[data-play]');if(!btn)return;const item=allItems.find(x=>String(x.id)===btn.dataset.play);if(!item)return;const url=getPublicUrl(item.file_path);if(!url)return;audio.src=url;$('miniTitle').textContent=item.title||'Untitled track';$('miniArtist').textContent=[item.creator||'Unknown artist',item.album||''].filter(Boolean).join(' · ');const cover=$('miniCover');if(item.cover_path){cover.outerHTML=`<img class="cover" id="miniCover" src="${escapeHtml(getPublicUrl(item.cover_path))}" alt="">`;}else{cover.outerHTML=`<div class="mini-cover" id="miniCover">♫</div>`;}bar.classList.add('visible');audio.play().catch(()=>{bar.classList.add('visible');});});}
  function setupHome(){const latestHost=$('latestItems'),featureHost=$('featuredItems'),search=$('homeSearch'),category=$('homeCategory'),results=$('searchResults'),resultHost=$('searchItems'),summary=$('searchSummary'),empty=$('searchEmpty');if(latestHost){const latest=allItems.slice(0,6);renderCards(latest,latestHost);if($('latestEmpty'))$('latestEmpty').hidden=latest.length>0;if(!latest.length)latestHost.innerHTML='';}
    if(featureHost){const picks=['music','metallurgy','technology','resource'].map(type=>allItems.find(x=>x.content_type===type)).filter(Boolean);featureHost.innerHTML=picks.length?picks.map(item=>`<a class="feature-card" href="${CATEGORIES[item.content_type].href}"><div class="kicker">${escapeHtml(CATEGORIES[item.content_type].label)} · Latest pick</div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.creator||'Digital Hub')} · ${escapeHtml(formatDate(item.created_at)||'Recently published')}</p></a>`).join(''):'<div class="status">Published items will appear here as each collection grows.</div>';}
    const runSearch=()=>{const term=(search?.value||'').trim().toLowerCase(),cat=category?.value||'all';const matches=allItems.filter(item=>(!term||contentSearch(item).includes(term))&&(cat==='all'||item.content_type===cat));if(!results)return;const active=!!term||cat!=='all';results.hidden=!active;if(active){renderCards(matches.slice(0,60),resultHost);summary.textContent=`${matches.length} matching published ${matches.length===1?'item':'items'}.`;empty.hidden=matches.length>0;}};
    if(search)search.addEventListener('input',runSearch);if(category)category.addEventListener('change',runSearch);
  }
  function setupCategoryPage(){const host=$('pageItems');if(!host)return;const search=$('pageSearch'),filter=$('fileFilter'),sort=$('sortOrder'),count=$('pageCount'),empty=$('pageEmpty'),status=$('pageStatus');const update=()=>{let items=allItems.filter(x=>x.content_type===PAGE);const q=(search?.value||'').trim().toLowerCase(),kind=filter?.value||'all',sorting=sort?.value||'newest';if(q)items=items.filter(x=>contentSearch(x).includes(q));if(kind!=='all')items=items.filter(x=>fileKind(x)===kind);items.sort((a,b)=>sorting==='oldest'?new Date(a.created_at)-new Date(b.created_at):sorting==='title'?String(a.title).localeCompare(String(b.title)):new Date(b.created_at)-new Date(a.created_at));renderCards(items,host);count.textContent=`${items.length} ${items.length===1?'published item':'published items'} in ${CATEGORIES[PAGE].label}`;empty.hidden=items.length>0;status.hidden=allItems.some(x=>x.content_type===PAGE);if(status.hidden===false)status.textContent='New published materials will appear here.';};[search,filter,sort].forEach(el=>el?.addEventListener(el===search?'input':'change',update));update();}
  function attachInteractions(){document.addEventListener('click',e=>{const btn=e.target.closest('[data-preview]');if(!btn)return;const item=allItems.find(x=>String(x.id)===btn.dataset.preview);if(item)showPreview(item);});setupPreview();setupPlayer();}
  async function loadContent(){const status=$('pageStatus');if(status)status.textContent='Loading published materials…';let result=await hubClient.from('hub_content').select('id,content_type,title,creator,album,description,file_path,original_file_name,mime_type,file_size,cover_path,created_at').eq('is_published',true).order('created_at',{ascending:false}).limit(200);
    if(result.error&&/album|column/i.test(result.error.message||'')){console.warn('Album column is not installed yet; loading the current catalogue schema.',result.error.message);result=await hubClient.from('hub_content').select('id,content_type,title,creator,description,file_path,original_file_name,mime_type,file_size,cover_path,created_at').eq('is_published',true).order('created_at',{ascending:false}).limit(200);}
    if(result.error){console.error('Digital Hub catalogue error:',result.error);if(status)status.textContent='The published catalogue could not be loaded. Please refresh later.';if($('latestItems'))$('latestItems').innerHTML='<div class="status">Published content is temporarily unavailable.</div>';if($('pageItems'))$('pageStatus').textContent='Error loading this collection. Check the connection and refresh.';return;}
    allItems=(result.data||[]).map(x=>({...x,album:x.album||''}));if(PAGE==='home')setupHome();else setupCategoryPage();attachInteractions();
  }
  loadContent();
})();
