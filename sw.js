/* Permite abrir la app sin señal.
   Sube el número de VERSION cada vez que cambies index.html, así los
   teléfonos toman la versión nueva en lugar de la guardada. */
const VERSION = "equipos-v5";
const ARCHIVOS = ["./", "./index.html", "./manifest.json", "./icono-192.png", "./icono-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(VERSION).then(c=> c.addAll(ARCHIVOS)).then(()=> self.skipWaiting()));
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys()
      .then(claves=> Promise.all(claves.filter(k=> k !== VERSION).map(k=> caches.delete(k))))
      .then(()=> self.clients.claim())
  );
});

self.addEventListener("fetch", e=>{
  const url = e.request.url;

  // Las llamadas al servidor de datos nunca se guardan: si no hay señal,
  // la app ya sabe dejar las lecturas en cola y subirlas después.
  if(url.indexOf("script.google.com") !== -1 || url.indexOf("googleusercontent.com") !== -1) return;
  if(e.request.method !== "GET") return;

  // Primero la red, para tomar la versión más nueva; si no hay, lo guardado.
  e.respondWith(
    fetch(e.request)
      .then(res=>{
        const copia = res.clone();
        caches.open(VERSION).then(c=> c.put(e.request, copia)).catch(()=>{});
        return res;
      })
      .catch(()=> caches.match(e.request).then(r=> r || caches.match("./index.html")))
  );
});
