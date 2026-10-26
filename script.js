(function(){
  var root=document.documentElement;
  var isMac=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent||'');

  /* theme: follows the system until the viewer picks one */
  function currentTheme(){
    var t=root.getAttribute('data-theme'); if(t) return t;
    return window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
  }
  try{var sv=localStorage.getItem('pf-theme'); if(sv==='light'||sv==='dark') root.setAttribute('data-theme',sv);}catch(e){}
  var themeBtn=document.getElementById('themeBtn');
  function labelTheme(){themeBtn.textContent=currentTheme()==='dark'?'light mode':'dark mode';}
  function toggleTheme(){
    var n=currentTheme()==='dark'?'light':'dark';
    root.setAttribute('data-theme',n);
    try{localStorage.setItem('pf-theme',n);}catch(e){}
    labelTheme();
  }
  labelTheme();
  themeBtn.addEventListener('click',toggleTheme);

  /* project filter */
  var chips=document.querySelectorAll('.chip');
  var cards=document.querySelectorAll('#grid .card');
  chips.forEach(function(chip){
    chip.addEventListener('click',function(){
      var f=chip.getAttribute('data-filter');
      chips.forEach(function(c){c.setAttribute('aria-pressed',c===chip?'true':'false');});
      cards.forEach(function(card){card.hidden=!(f==='all'||card.getAttribute('data-cat')===f);});
    });
  });

  /* active section + scroll progress */
  var links=document.querySelectorAll('.nav a');
  var map={};
  links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(en.isIntersecting){
          links.forEach(function(a){a.classList.remove('on');});
          var a=map[en.target.id]; if(a) a.classList.add('on');
        }
      });
    },{rootMargin:'-30% 0px -60% 0px'});
    document.querySelectorAll('main section').forEach(function(s){io.observe(s);});
  }
  var bar=document.getElementById('progress');
  function prog(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    bar.style.setProperty('--p',h>0?Math.min(1,window.scrollY/h):0);
  }
  window.addEventListener('scroll',prog,{passive:true}); window.addEventListener('resize',prog); prog();

  /* cursor-lit surfaces */
  document.addEventListener('pointermove',function(e){
    var t=e.target.closest&&e.target.closest('.spot');
    if(!t) return;
    var r=t.getBoundingClientRect();
    t.style.setProperty('--mx',(e.clientX-r.left)+'px');
    t.style.setProperty('--my',(e.clientY-r.top)+'px');
  },{passive:true});

  /* copy email */
  var emailEl=document.getElementById('email'), note=document.getElementById('note');
  function selectEmail(){
    var r=document.createRange(); r.selectNodeContents(emailEl);
    var s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
    note.textContent='Selected. Copy it from your device menu.';
  }
  function copyEmail(){
    var text=emailEl.textContent;
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){note.textContent='Copied '+text;},selectEmail);
    } else { selectEmail(); }
  }
  document.getElementById('copyBtn').addEventListener('click',copyEmail);

  /* quick jump palette */
  var pal=document.getElementById('pal'), inp=document.getElementById('palInput'), list=document.getElementById('palList');
  var palBtn=document.getElementById('palBtn'), lastFocus=null, sel=0, shown=[];
  document.getElementById('kbdHint').textContent=isMac?'⌘ K':'Ctrl K';
  var kicon=document.querySelector('.kicon');
  if(window.matchMedia('(max-width:900px)').matches&&kicon) kicon.style.display='block';
  window.matchMedia('(max-width:900px)').addEventListener&&window.matchMedia('(max-width:900px)').addEventListener('change',function(m){if(kicon) kicon.style.display=m.matches?'block':'none';});
  function goto(id){var el=document.getElementById(id); if(el) el.scrollIntoView({behavior:'smooth',block:'start'});}
  var items=[
    {label:'Overview',hint:'section',run:function(){goto('overview');}},
    {label:'Projects',hint:'section',run:function(){goto('projects');}},
    {label:'Stack',hint:'section',run:function(){goto('stack');}},
    {label:'Experience',hint:'section',run:function(){goto('experience');}},
    {label:'Gear',hint:'section',run:function(){goto('gear');}},
    {label:'Writing',hint:'section',run:function(){goto('writing');}},
    {label:'Contact',hint:'section',run:function(){goto('contact');}},
    {label:'Copy email address',hint:'action',run:function(){goto('contact');copyEmail();}},
    {label:'Switch theme',hint:'action',run:toggleTheme}
  ];
  function render(){
    var q=inp.value.trim().toLowerCase();
    shown=items.filter(function(i){return !q||i.label.toLowerCase().indexOf(q)>-1;});
    if(sel>=shown.length) sel=0;
    list.innerHTML='';
    if(!shown.length){var e=document.createElement('li');e.className='empty';e.textContent='Nothing matches that.';list.appendChild(e);return;}
    shown.forEach(function(it,i){
      var li=document.createElement('li'), b=document.createElement('button');
      b.type='button'; b.setAttribute('aria-selected',i===sel?'true':'false');
      var a=document.createElement('span'); a.textContent=it.label;
      var h=document.createElement('span'); h.className='hint'; h.textContent=it.hint;
      b.appendChild(a); b.appendChild(h);
      b.addEventListener('click',function(){choose(it);});
      b.addEventListener('mousemove',function(){sel=i;mark();});
      li.appendChild(b); list.appendChild(li);
    });
  }
  function mark(){Array.prototype.forEach.call(list.querySelectorAll('button'),function(b,i){b.setAttribute('aria-selected',i===sel?'true':'false');});}
  function open(){lastFocus=document.activeElement;pal.hidden=false;inp.value='';sel=0;render();inp.focus();}
  function close(){pal.hidden=true;if(lastFocus&&lastFocus.focus) lastFocus.focus();}
  function choose(it){close();setTimeout(it.run,30);}
  palBtn.addEventListener('click',open);
  pal.addEventListener('click',function(e){if(e.target===pal) close();});
  inp.addEventListener('input',function(){sel=0;render();});
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();pal.hidden?open():close();return;}
    if(pal.hidden) return;
    if(e.key==='Escape'){e.preventDefault();close();}
    else if(e.key==='ArrowDown'){e.preventDefault();if(shown.length){sel=(sel+1)%shown.length;mark();}}
    else if(e.key==='ArrowUp'){e.preventDefault();if(shown.length){sel=(sel-1+shown.length)%shown.length;mark();}}
    else if(e.key==='Enter'){e.preventDefault();if(shown[sel]) choose(shown[sel]);}
  });
})();
