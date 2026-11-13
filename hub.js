/* Digital Hub Stage 13 — artist profiles, album collections and featured releases */
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
  const contentSearch = item => [item.title,item.creator,item.album,item.description,item.original_file_name,CATEGORIES[item.content_type]?.label].filter(Boolean).join(' ').toLowerCase();
  const same = (a,b) => String(a||'').trim().toLocaleLowerCase() === String(b||'').trim().toLocaleLowerCase();
  const navToggle=$('menuToggle'), navLinks=$('navLinks');
  if(navToggle&&navLinks){
    navToggle.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(open));navToggle.textContent=open?'×':'☰';navToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
    navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{navLinks.classList.remove('open');navToggle.setAttribute('aria-expanded','false');navToggle.textContent='☰';}));
  }
  if($('year'))$('year').textContent=new Date().getFullYear();
  const categoryNav=(PAGE==='artist'||PAGE==='album')?'music':(PAGE==='home'?'home':PAGE);
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===categoryNav)a.setAttribute('aria-current','page');});
  if(!window.supabase||!window.supabase.createClient){showGlobalError('The content service did not load. Check your internet connection and refresh.');return;}
  if(!/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/.test(SUPABASE_URL)||!(SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')||SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ'))){showGlobalError('The public catalogue connection needs to be checked by the site owner.');return;}
  const hubClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  let allItems=[];
  let musicQueue=[];
  let activeQueue=[];
  const getPublicUrl = path => path ? hubClient.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || '' : '';
  function showGlobalError(message){document.querySelectorAll('.status').forEach(el=>el.textContent=message);if($('latestEmpty')){$('latestEmpty').hidden=false;$('latestEmpty').textContent=message;}if($('latestItems'))$('latestItems').innerHTML=`<div class="status">${escapeHtml(message)}</div>`;}
  function coverMarkup(item,type){const coverUrl=item.cover_path?getPublicUrl(item.cover_path):'';if(type==='music'&&coverUrl)return `<img class="cover" src="${escapeHtml(coverUrl)}" alt="Cover artwork for ${escapeHtml(item.title)}" loading="lazy">`;return `<div class="cover cover-fallback" aria-hidden="true">${CATEGORIES[type]?.icon||'▤'}</div>`;}
  function artistHref(name){return `artist.html?artist=${encodeURIComponent(name)}`;}
  function albumHref(item){return `album.html?artist=${encodeURIComponent(item.creator||'')}&album=${encodeURIComponent(item.album||'')}`;}
  function itemCard(item){
    const type=item.content_type, label=CATEGORIES[type]?.label||'Digital Hub';
    const fileUrl=getPublicUrl(item.file_path), downloadUrl=fileUrl?`${fileUrl}${fileUrl.includes('?')?'&':'?'}download=${encodeURIComponent(item.original_file_name||'download')}`:'';
    const kind=fileKind(item), isMusic=type==='music', isPdf=kind==='pdf';
    const title=escapeHtml(item.title), creator=escapeHtml(item.creator||'Digital Hub'), album=String(item.album||'').trim();
    const desc=item.description?`<p class="description">${escapeHtml(item.description)}</p>`:'';
    const meta=[item.original_file_name,formatSize(item.file_size),formatDate(item.created_at)].filter(Boolean).map(escapeHtml).join(' · ');
    const featured=isMusic&&item.is_featured?'<span class="featured-badge">★ Featured release</span>':'';
    let actions='', musicMeta='';
    if(isMusic){
      musicMeta=`<div class="music-links">${item.creator?`<a href="${artistHref(item.creator)}">Artist profile ↗</a>`:'<span class="muted">Artist details not provided</span>'}${album?`<a href="${albumHref(item)}">Album details ↗</a>`:''}</div>`;
      actions=`<div class="play-row"><button class="play-button" type="button" data-play="${escapeHtml(item.id)}" aria-label="Play ${title}">▶</button><span class="play-label">Play track</span></div><div class="card-actions"><a class="action" href="${escapeHtml(downloadUrl)}" rel="noopener">Download song ↓</a></div>`;
    } else {actions=`<div class="card-actions">${isPdf?`<button class="action" type="button" data-preview="${escapeHtml(item.id)}">Preview PDF ↗</button>`:`<a class="action secondary" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer">Open file ↗</a>`}<a class="action" href="${escapeHtml(downloadUrl)}" rel="noopener">Download ↓</a></div>`;}
    return `<article class="content-card" data-item-id="${escapeHtml(item.id)}"><div class="content-top">${coverMarkup(item,type)}<div class="content-meta">${featured}<span class="pill">${escapeHtml(label)}</span><h3 class="content-title">${title}</h3><div class="creator">${isMusic?'Artist: ':'By: '}${creator}</div>${isMusic&&album?`<div class="album">Album: ${escapeHtml(album)}</div>`:''}</div></div>${musicMeta}${desc}${actions}${meta?`<div class="file-meta">${meta}</div>`:''}</article>`;
  }
  function renderCards(items,host){if(!host)return;host.innerHTML=items.map(itemCard).join('');}
  function showPreview(item){const dialog=$('previewDialog'),frame=$('previewFrame'),title=$('previewTitle');if(!dialog||!frame)return;const url=getPublicUrl(item.file_path);if(!url)return;title.textContent=item.title||'PDF preview';frame.src=url+'#toolbar=1&navpanes=0&view=FitH';if(typeof dialog.showModal==='function')dialog.showModal();else window.open(url,'_blank','noopener');}
  function setupPreview(){const dialog=$('previewDialog'),close=$('closePreview');if(close)close.addEventListener('click',()=>{dialog.close();$('previewFrame').src='about:blank';});if(dialog)dialog.addEventListener('click',e=>{if(e.target===dialog){dialog.close();$('previewFrame').src='about:blank';}});}
  function setupPlayer(){
    const audio=$('globalAudio'),bar=$('miniPlayer');if(!audio||!bar)return;
    const prev=$('miniPrev'),next=$('miniNext');let currentIndex=-1;
    if(!activeQueue.length)activeQueue=musicQueue.slice();
    const updateControls=()=>{if(prev)prev.disabled=currentIndex<=0;if(next)next.disabled=currentIndex<0||currentIndex>=activeQueue.length-1;};
    function updateCover(item){const image=$('miniCover'),fallback=$('miniCoverFallback');if(item.cover_path){const url=getPublicUrl(item.cover_path);if(image){image.src=url;image.hidden=false;}if(fallback)fallback.hidden=true;}else{if(image){image.removeAttribute('src');image.hidden=true;}if(fallback)fallback.hidden=false;}}
    function playAt(index,autoPlay=true){const item=activeQueue[index];if(!item)return;const url=getPublicUrl(item.file_path);if(!url)return;currentIndex=index;audio.src=url;audio.load();$('miniTitle').textContent=item.title||'Untitled track';$('miniArtist').textContent=[item.creator||'Unknown artist',item.album||''].filter(Boolean).join(' · ')||'Unknown artist';updateCover(item);bar.classList.add('visible');updateControls();if(autoPlay)audio.play().catch(()=>{$('miniArtist').textContent+=' · Press play to start';});}
    document.addEventListener('click',e=>{const btn=e.target.closest('[data-play]');if(!btn)return;const id=btn.dataset.play;let index=activeQueue.findIndex(x=>String(x.id)===id);if(index<0){activeQueue=musicQueue.slice();index=activeQueue.findIndex(x=>String(x.id)===id);}if(index>=0)playAt(index,true);});
    if(prev)prev.addEventListener('click',()=>playAt(currentIndex-1,true));
    if(next)next.addEventListener('click',()=>playAt(currentIndex+1,true));
    audio.addEventListener('ended',()=>{if(currentIndex>=0&&currentIndex<activeQueue.length-1)playAt(currentIndex+1,true);});
    document.querySelectorAll('[data-play-all]').forEach(button=>button.addEventListener('click',()=>{if(activeQueue.length)playAt(0,true);else{const status=$('pageStatus')||$('profileStatus');if(status)status.textContent='There are no published tracks in this collection yet.';}}));
  }
  function renderFeaturedMusic(host){
    if(!host)return;
    const featured=musicQueue.filter(x=>x.is_featured).slice(0,8);
    if(!featured.length){host.innerHTML='<div class="empty">No featured music releases have been selected yet. You can feature a track from the administrator dashboard.</div>';return;}
    host.innerHTML=featured.map(item=>`<article class="featured-release">${coverMarkup(item,'music')}<div class="featured-release-copy"><span class="featured-badge">★ Featured release</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.creator||'Unknown artist')}${item.album?' · '+escapeHtml(item.album):''}</p><div class="featured-release-actions"><button class="action" type="button" data-play="${escapeHtml(item.id)}">▶ Play</button><a class="action secondary" href="${artistHref(item.creator||'Unknown artist')}">Artist ↗</a></div></div></article>`).join('');
  }
  function setupHome(){
    const latestHost=$('latestItems'),featureHost=$('featuredItems'),search=$('homeSearch'),category=$('homeCategory'),results=$('searchResults'),resultHost=$('searchItems'),summary=$('searchSummary'),empty=$('searchEmpty');
    if(latestHost){const latest=allItems.slice(0,8);renderCards(latest,latestHost);if($('latestEmpty'))$('latestEmpty').hidden=latest.length>0;if(!latest.length)latestHost.innerHTML='';}
    if(featureHost){const picks=['music','metallurgy','technology','resource'].map(type=>allItems.find(x=>x.content_type===type)).filter(Boolean);featureHost.innerHTML=picks.length?picks.map(item=>`<a class="feature-card" href="${CATEGORIES[item.content_type].href}"><div class="kicker">${escapeHtml(CATEGORIES[item.content_type].label)} · Latest pick</div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.creator||'Digital Hub')} · ${escapeHtml(formatDate(item.created_at)||'Recently published')}</p><span class="feature-open">Explore collection ↗</span></a>`).join(''):'<div class="status">Published items will appear here as each collection grows.</div>';}
    renderFeaturedMusic($('featuredMusicItems'));
    const runSearch=()=>{const term=(search?.value||'').trim().toLowerCase(),cat=category?.value||'all',matches=allItems.filter(item=>(!term||contentSearch(item).includes(term))&&(cat==='all'||item.content_type===cat));if(!results)return;const active=!!term||cat!=='all';results.hidden=!active;if(active){renderCards(matches.slice(0,60),resultHost);summary.textContent=`${matches.length} matching published ${matches.length===1?'item':'items'}.`;empty.hidden=matches.length>0;}};
    if(search)search.addEventListener('input',runSearch);if(category)category.addEventListener('change',runSearch);
  }
  function populateMusicFilters(items){
    const artist=$('artistFilter'),album=$('albumFilter');
    const fill=(select,values,label)=>{if(!select)return;const current=select.value;select.innerHTML=`<option value="all">All ${label}</option>`+values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');if(values.includes(current))select.value=current;};
    fill(artist,[...new Set(items.map(x=>(x.creator||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b)),'artists');
    fill(album,[...new Set(items.map(x=>(x.album||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b)),'albums');
  }
  function groupMusic(items){
    const artists=new Map(),albums=new Map();
    items.forEach(item=>{
      const artist=(item.creator||'').trim();
      if(artist){if(!artists.has(artist))artists.set(artist,[]);artists.get(artist).push(item);}
      const album=(item.album||'').trim();
      if(album){const key=artist.toLocaleLowerCase()+'::'+album.toLocaleLowerCase();if(!albums.has(key))albums.set(key,{artist,album,items:[]});albums.get(key).items.push(item);}
    });
    return {artists,albums:[...albums.values()]};
  }
  function renderMusicDiscover(items){
    const artistHost=$('artistGrid'),albumHost=$('albumGrid');if(!artistHost&&!albumHost)return;
    const groups=groupMusic(items);
    if(artistHost){const artistRows=[...groups.artists.entries()].sort((a,b)=>a[0].localeCompare(b[0]));artistHost.innerHTML=artistRows.length?artistRows.map(([name,tracks])=>{const cover=tracks.find(x=>x.cover_path)?.cover_path;const url=cover?getPublicUrl(cover):'';const artwork=url?`<img class="discover-cover" src="${escapeHtml(url)}" alt="" loading="lazy">`:'<div class="discover-cover discover-fallback">♫</div>';const albumCount=new Set(tracks.map(x=>(x.album||'').trim()).filter(Boolean)).size;return `<a class="discover-card" href="${artistHref(name)}">${artwork}<div class="discover-copy"><span class="eyebrow-small">Artist profile</span><h3>${escapeHtml(name)}</h3><p>${tracks.length} ${tracks.length===1?'track':'tracks'} · ${albumCount} ${albumCount===1?'album':'albums'}</p><span class="discover-link">View artist ↗</span></div></a>`;}).join(''):'<div class="empty">Artist profiles will appear when published tracks include artist names.</div>';}
    if(albumHost){const rows=groups.albums.sort((a,b)=>a.album.localeCompare(b.album)||a.artist.localeCompare(b.artist));albumHost.innerHTML=rows.length?rows.map(group=>{const item=group.items.find(x=>x.cover_path)||group.items[0],url=item.cover_path?getPublicUrl(item.cover_path):'';const artwork=url?`<img class="discover-cover" src="${escapeHtml(url)}" alt="" loading="lazy">`:'<div class="discover-cover discover-fallback">▣</div>';return `<a class="discover-card" href="${albumHref({creator:group.artist,album:group.album})}">${artwork}<div class="discover-copy"><span class="eyebrow-small">Album / release</span><h3>${escapeHtml(group.album)}</h3><p>${escapeHtml(group.artist||'Various artists')} · ${group.items.length} ${group.items.length===1?'track':'tracks'}</p><span class="discover-link">Open album ↗</span></div></a>`;}).join(''):'<div class="empty">Album collections will appear when uploaded music includes an album name.</div>';}
  }
  function setupCategoryPage(){
    const host=$('pageItems');if(!host)return;
    const base=allItems.filter(x=>x.content_type===PAGE);
    const search=$('pageSearch'),filter=$('fileFilter'),sort=$('sortOrder'),count=$('pageCount'),empty=$('pageEmpty'),status=$('pageStatus'),artist=$('artistFilter'),album=$('albumFilter');
    if(PAGE==='music'){populateMusicFilters(base);renderMusicDiscover(base);renderFeaturedMusic($('featuredMusicPage'));}
    const update=()=>{
      let items=base.slice();const q=(search?.value||'').trim().toLowerCase(),kind=filter?.value||'all',sorting=sort?.value||'newest',artistValue=artist?.value||'all',albumValue=album?.value||'all';
      if(q)items=items.filter(x=>contentSearch(x).includes(q));
      if(kind!=='all')items=items.filter(x=>fileKind(x)===kind);
      if(artistValue!=='all')items=items.filter(x=>(x.creator||'')===artistValue);
      if(albumValue!=='all')items=items.filter(x=>(x.album||'')===albumValue);
      items.sort((a,b)=>{if(sorting==='oldest')return new Date(a.created_at)-new Date(b.created_at);if(sorting==='title')return String(a.title||'').localeCompare(String(b.title||''));if(sorting==='artist'||sorting==='author')return String(a.creator||'').localeCompare(String(b.creator||''));if(sorting==='album')return String(a.album||'').localeCompare(String(b.album||''));return new Date(b.created_at)-new Date(a.created_at);});
      renderCards(items,host);if(count)count.textContent=`${items.length} of ${base.length} published ${base.length===1?'item':'items'} in ${CATEGORIES[PAGE].label}`;if(empty)empty.hidden=items.length>0;
      if(status){status.hidden=base.length>0;if(!base.length)status.textContent=`New published materials will appear here in ${CATEGORIES[PAGE].label}.`;}
    };
    [search,filter,sort,artist,album].forEach(el=>el?.addEventListener(el===search?'input':'change',update));
    const clear=$('clearFilters');if(clear)clear.addEventListener('click',()=>{if(search)search.value='';if(filter)filter.value='all';if(sort)sort.value='newest';if(artist)artist.value='all';if(album)album.value='all';update();});
    document.querySelectorAll('[data-search-term]').forEach(btn=>btn.addEventListener('click',()=>{if(search){search.value=btn.dataset.searchTerm||'';update();search.focus();}}));
    update();
  }
  function setupArtistPage(){
    const requested=new URLSearchParams(location.search).get('artist')||'';
    const matches=musicQueue.filter(x=>same(x.creator,requested));
    if(!requested||!matches.length){if($('artistName'))$('artistName').textContent='Artist not found';if($('profileStatus'))$('profileStatus').textContent='This artist does not have any published tracks yet.';return;}
    activeQueue=matches.slice();
    $('artistName').textContent=requested;
    document.title=`${requested} | Artist Profile | Digital Hub`;
    $('artistSubtitle').textContent='Explore published tracks and albums by '+requested+'. This profile is generated from the artist details on published music uploads.';
    const albums=new Set(matches.map(x=>(x.album||'').trim()).filter(Boolean));
    $('artistStats').textContent=`${matches.length} published ${matches.length===1?'track':'tracks'} · ${albums.size} ${albums.size===1?'album or release':'albums or releases'}`;
    const host=$('artistAlbumItems');if(host){const rows=groupMusic(matches).albums;host.innerHTML=rows.length?rows.map(group=>{const href=albumHref({creator:requested,album:group.album});const sample=group.items.find(x=>x.cover_path)||group.items[0];const url=sample.cover_path?getPublicUrl(sample.cover_path):'';return `<a class="discover-card" href="${href}">${url?`<img class="discover-cover" src="${escapeHtml(url)}" alt="" loading="lazy">`:'<div class="discover-cover discover-fallback">▣</div>'}<div class="discover-copy"><span class="eyebrow-small">Album / release</span><h3>${escapeHtml(group.album)}</h3><p>${group.items.length} ${group.items.length===1?'track':'tracks'}</p><span class="discover-link">Open album ↗</span></div></a>`;}).join(''):'<div class="empty">No album names have been added to this artist’s tracks yet.</div>';}
    renderCards(matches,$('artistTrackItems'));if($('profileStatus'))$('profileStatus').textContent='Artist catalogue loaded.';
  }
  function setupAlbumPage(){
    const params=new URLSearchParams(location.search), artist=params.get('artist')||'', album=params.get('album')||'';
    const matches=musicQueue.filter(x=>same(x.album,album)&&(!artist||same(x.creator,artist)));
    if(!album||!matches.length){if($('albumName'))$('albumName').textContent='Album not found';if($('profileStatus'))$('profileStatus').textContent='This album does not have any published tracks yet.';return;}
    activeQueue=matches.slice();
    $('albumName').textContent=album;
    document.title=`${album} | Album | Digital Hub`;
    const albumArtistName=artist||matches[0].creator||'';
    $('albumArtist').textContent=albumArtistName||'Various artists';
    $('albumArtist').href=albumArtistName?artistHref(albumArtistName):'music.html';
    $('albumStats').textContent=`${matches.length} published ${matches.length===1?'track':'tracks'} · First added ${formatDate(matches.reduce((a,b)=>new Date(a.created_at)<new Date(b.created_at)?a:b).created_at)||'date unavailable'}`;
    const coverItem=matches.find(x=>x.cover_path);if(coverItem){$('albumCover').src=getPublicUrl(coverItem.cover_path);$('albumCover').hidden=false;$('albumCoverFallback').hidden=true;}
    renderCards(matches,$('albumTrackItems'));if($('profileStatus'))$('profileStatus').textContent='Album collection loaded.';
  }
  function attachInteractions(){document.addEventListener('click',e=>{const btn=e.target.closest('[data-preview]');if(!btn)return;const item=allItems.find(x=>String(x.id)===btn.dataset.preview);if(item)showPreview(item);});setupPreview();setupPlayer();}
  async function loadContent(){
    const status=$('pageStatus')||$('profileStatus');if(status)status.textContent='Loading published materials…';
    const baseFields='id,content_type,title,creator,description,file_path,original_file_name,mime_type,file_size,cover_path,created_at';
    let fields=baseFields+',album,is_featured';
    let result=await hubClient.from('hub_content').select(fields).eq('is_published',true).order('created_at',{ascending:false}).limit(300);
    if(result.error&&(/is_featured|album|column/i.test(result.error.message||'')||result.error.code==='42703')){
      const message=(result.error.message||'').toLowerCase();
      if(message.includes('is_featured'))fields=baseFields+',album';
      else if(message.includes('album'))fields=baseFields;
      else fields=baseFields;
      result=await hubClient.from('hub_content').select(fields).eq('is_published',true).order('created_at',{ascending:false}).limit(300);
      if(result.error&&(/album|column/i.test(result.error.message||''))){result=await hubClient.from('hub_content').select(baseFields).eq('is_published',true).order('created_at',{ascending:false}).limit(300);}
    }
    if(result.error){console.error('Digital Hub catalogue error:',result.error);if(status)status.textContent='The published catalogue could not be loaded. Please refresh later.';showGlobalError('Published content is temporarily unavailable.');return;}
    allItems=(result.data||[]).map(x=>({...x,album:x.album||'',is_featured:Boolean(x.is_featured)}));musicQueue=allItems.filter(x=>x.content_type==='music');activeQueue=musicQueue.slice();
    if(PAGE==='home')setupHome();else if(PAGE==='artist')setupArtistPage();else if(PAGE==='album')setupAlbumPage();else setupCategoryPage();attachInteractions();
  }
  loadContent();
})();
