// Une ligne par requête : date, méthode, URL complète, code de statut, durée.
// Exemple : 2026-11-19T10:42:03.120Z GET /api/hives?site_id=SN-CASA 200 1.8 ms
export function requestLogger(req, res, next) {
  const debut = performance.now();

  // "finish" est émis une seule fois, quand la réponse est envoyée :
  // c'est le seul moment où le code de statut et la durée sont connus.
  res.on("finish", () => {
    const duree = (performance.now() - debut).toFixed(1);
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duree} ms`);
  });

  next();
}