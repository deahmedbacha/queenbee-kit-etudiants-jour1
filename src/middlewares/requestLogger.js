// Une ligne par requête : date, méthode, URL complète, code de statut, durée.
export function requestLogger(req, res, next) {
  const debut = performance.now();

  // "finish" est émis une seule fois, quand la réponse est envoyée.
  res.on("finish", () => {
    const duree = (performance.now() - debut).toFixed(1);
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duree} ms`);
  });

  next();
}