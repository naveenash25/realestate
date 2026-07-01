/* ============================================================
   OWNER CONNECT — Hi-Fi shared chrome
   Injects: public header, footer, dashboard sidebars + topbar.
   Drop a placeholder element; this fills it.
     <div data-oc-header data-active="Buy"></div>
     <div data-oc-footer></div>
     <aside data-oc-side="owner|buyer|admin" data-active="Dashboard"></aside>
   ============================================================ */
(function(){
  var ICON = {
    home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    building:'<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/>',
    leads:'<path d="M16 11a4 4 0 1 0-8 0"/><circle cx="12" cy="7" r="3"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    wallet:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h3"/><path d="M3 10h18"/>',
    chat:'<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/>',
    bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    shield:'<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>',
    calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h.01M16 11h.01M8 15h2M12 15h.01M16 15h.01"/>',
    chart:'<path d="M4 19V5M4 19h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="13" width="3" height="4"/>',
    docs:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    flag:'<path d="M4 21V4h13l-2 4 2 4H4"/>',
    cal:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    cog:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.5L4.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z"/>',
    compare:'<rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="16" rx="1"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="12" r="1.2"/><circle cx="3.5" cy="18" r="1.2"/>'
  };
  function svg(name,cls){return '<svg class="ico '+(cls||'')+'" viewBox="0 0 24 24">'+(ICON[name]||'')+'</svg>';}

  var NAV = [
    ['Buy','OC-03-Search-Results.html'],['Rent','OC-03-Search-Results.html'],
    ['Commercial','#'],['Plots','#'],['Builders','OC-14-Builder-Verify.html'],
    ['New Projects','#'],['Pricing','OC-09-Payment-Plans.html'],['Resources','#']
  ];

  function header(el){
    var active = el.getAttribute('data-active')||'';
    var links = NAV.map(function(n){
      var car = n[0]==='Resources'?' <svg class="ico sm" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>':'';
      return '<a href="'+n[1]+'" class="'+(n[0]===active?'on':'')+'">'+n[0]+car+'</a>';
    }).join('');
    el.outerHTML =
    '<header class="site"><div class="wrap nav">'+
      '<a class="logo" href="Owner-Connect-Homepage-HiFi.html"><span class="mark"><svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg></span>'+
      '<span class="txt"><b>Owner <span style="color:var(--blue)">Connect</span></b><span class="sub">Direct Owner Marketplace</span></span></a>'+
      '<nav class="mainnav">'+links+'</nav>'+
      '<div class="nav-right">'+
        '<a class="icon-btn" href="OC-17-Saved.html" aria-label="Saved">'+svg('heart')+'</a>'+
        '<a class="btn ghost" href="OC-16-Login.html">Login</a>'+
        '<a class="btn green" href="OC-05-Add-Property.html">'+svg('plus','sm')+' List Property Free</a>'+
      '</div>'+
    '</div></header>';
  }

  function footer(el){
    el.outerHTML =
    '<footer class="foot"><div class="wrap between">'+
      '<div class="row" style="gap:8px;"><svg class="ico sm" viewBox="0 0 24 24" style="stroke:#9fb0cc"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg> © 2026 Owner Connect — Direct Owner Marketplace</div>'+
      '<div class="row" style="gap:20px;"><a href="#">About</a><a href="OC-09-Payment-Plans.html">Pricing</a><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a></div>'+
    '</div></footer>';
  }

  var SIDE = {
    owner:{name:'Rajesh Kumar',role:'Property Owner',init:'RK',items:[
      ['Main',null],['Dashboard','OC-04-Owner-Dashboard.html','grid'],
      ['My Properties','#','building'],['Add Property','OC-05-Add-Property.html','plus'],
      ['Leads','OC-06-Lead-Management.html','leads'],['Messages','OC-10-Chat.html','chat'],
      ['Account',null],['Wallet','OC-13-Wallet.html','wallet'],
      ['Lead Calculator','OC-12-Lead-Calculator.html','calc'],['Plans & Billing','OC-09-Payment-Plans.html','docs'],
      ['Notifications','OC-20-Notifications.html','bell'],['Profile','OC-11-Profile.html','user']
    ]},
    buyer:{name:'Anjali Rao',role:'Buyer',init:'AR',items:[
      ['Main',null],['Dashboard','OC-18-Buyer-Dashboard.html','grid'],
      ['Search','OC-03-Search-Results.html','building'],['Saved','OC-17-Saved.html','heart'],
      ['Compare','OC-15-Compare.html','compare'],['Visits','OC-19-Schedule-Visit.html','cal'],
      ['Account',null],['Messages','OC-10-Chat.html','chat'],
      ['Notifications','OC-20-Notifications.html','bell'],['Profile','OC-11-Profile.html','user']
    ]},
    admin:{name:'Priya Nair',role:'Administrator',init:'PN',items:[
      ['Main',null],['Dashboard','OC-07-Admin-Dashboard.html','grid'],
      ['Verification','OC-08-Verification.html','shield'],['Builder Verify','OC-14-Builder-Verify.html','docs'],
      ['Listings','OC-03-Search-Results.html','building'],['Users','#','leads'],
      ['Platform',null],['Fraud & Flags','#','flag'],['Analytics','#','chart'],
      ['Settings','#','cog']
    ]}
  };

  function side(el){
    var role = el.getAttribute('data-oc-side')||'owner';
    var active = el.getAttribute('data-active')||'Dashboard';
    var cfg = SIDE[role]||SIDE.owner;
    var html = '<a class="logo" href="Owner-Connect-Homepage-HiFi.html"><span class="mark"><svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg></span>'+
      '<span class="txt"><b>Owner Connect</b><span class="sub">'+role+' panel</span></span></a>';
    cfg.items.forEach(function(it){
      if(it[1]===null){ html+='<div class="grp">'+it[0]+'</div>'; }
      else { html+='<a href="'+it[1]+'" class="'+(it[0]===active?'on':'')+'">'+svg(it[2])+it[0]+'</a>'; }
    });
    html+='<div class="spacer"></div>';
    html+='<div class="uchip"><span class="av">'+cfg.init+'</span><div><div class="nm">'+cfg.name+'</div><div class="rl">'+cfg.role+'</div></div></div>';
    el.className='side';
    el.innerHTML=html;
    mobileChrome(role, active, cfg);
  }

  // Bottom tab bar + top bar shown only on phone widths (hidden on desktop
  // via CSS). 5 key destinations per role; middle item is the primary action.
  var MNAV = {
    owner:[['Home','OC-04-Owner-Dashboard.html','grid'],['Leads','OC-06-Lead-Management.html','leads'],['Add','OC-05-Add-Property.html','plus'],['Wallet','OC-13-Wallet.html','wallet'],['Profile','OC-11-Profile.html','user']],
    buyer:[['Home','OC-18-Buyer-Dashboard.html','grid'],['Search','OC-03-Search-Results.html','building'],['Saved','OC-17-Saved.html','heart'],['Visits','OC-19-Schedule-Visit.html','cal'],['Profile','OC-11-Profile.html','user']],
    admin:[['Home','OC-07-Admin-Dashboard.html','grid'],['Verify','OC-08-Verification.html','shield'],['Builder','OC-14-Builder-Verify.html','docs'],['Alerts','#','flag'],['More','#','cog']]
  };
  function mobileChrome(role, active, cfg){
    if(document.querySelector('.m-topbar')) return;
    var top=document.createElement('div');
    top.className='m-topbar';
    top.innerHTML='<span class="m-logo"><span class="mark"><svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#fff;stroke-width:2.4;fill:none"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg></span>Owner Connect</span>'+
      '<span class="m-av">'+cfg.init+'</span>';
    document.body.appendChild(top);
    var items=(MNAV[role]||MNAV.owner);
    var bot=document.createElement('nav');
    bot.className='m-bottomnav';
    bot.innerHTML=items.map(function(it,i){
      var mid=(i===2);
      return '<a href="'+it[1]+'" class="'+(it[0]===active||(it[0]==='Home'&&active==='Dashboard')?'on':'')+(mid?' mid':'')+'">'+svg(it[2])+'<span>'+it[0]+'</span></a>';
    }).join('');
    document.body.appendChild(bot);
  }

  function run(){
    document.querySelectorAll('[data-oc-header]').forEach(header);
    document.querySelectorAll('[data-oc-footer]').forEach(footer);
    document.querySelectorAll('[data-oc-side]').forEach(side);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run);
  else run();
})();
