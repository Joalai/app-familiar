const APP_PATCH_VERSION='2026.09.08.6';

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.mode!=='navigate')return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request);
      if(!response.ok)return response;
      const type=response.headers.get('content-type')||'';
      if(!type.includes('text/html'))return response;
      let html=await response.text();
      html=html.replace(/const APP_VERSION='[^']+';/,"const APP_VERSION='"+APP_PATCH_VERSION+"';");
      if(!html.includes('app-enhancements.js'))html=html.replace('</body>','<script src="app-enhancements.js?v='+APP_PATCH_VERSION+'"></script></body>');
      const headers=new Headers(response.headers);
      headers.set('cache-control','no-store');
      headers.delete('content-length');
      return new Response(html,{status:response.status,statusText:response.statusText,headers});
    }catch(e){return fetch(request)}
  })());
});

self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>clients[0]?clients[0].focus():self.clients.openWindow('./')))});
