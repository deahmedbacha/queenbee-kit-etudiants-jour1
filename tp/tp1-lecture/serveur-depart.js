// TP 1 — Lire les mesures sans bloquer la boucle d'événements.
//
//   GET  /ping              déjà écrite : elle joue « l'autre utilisateur »
//   POST /import/bloquant   lit tout le fichier d'un coup (readFileSync)
//   POST /import/flux       lit le fichier ligne par ligne (createReadStream + readline)
//
// Lancement, depuis la racine du projet :
//   node tp/tp1-lecture/serveur-depart.js data/mesures-SN-CASA-2026-10-31_30j.ndjson
// Puis, dans un second terminal : node tp/tp1-lecture/sonde.js bloquant (ou flux)

import express from "express";
import { existsSync, readFileSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const FICHIER = process.argv[2] ?? "data/mesures-SN-CASA-2026-10-31.ndjson";

// Le chemin du fichier est relatif au dossier depuis lequel on lance la commande.
if (!existsSync(FICHIER)) {
  console.error(`Fichier introuvable : ${FICHIER}`);
  console.error("Lancez le serveur depuis la racine du projet. Pour générer le fichier de 30 jours :");
  console.error("  node scripts/generate-measures.js SN-CASA 2026-10-31 30");
  process.exit(1);
}

const app = express();

app.get("/ping", (req, res) => {
  res.json({ pong: true });
});

// POST /import/bloquant : lecture bloquante.
// readFileSync puis la boucle occupent le seul fil d'exécution de Node.js
// du début à la fin : aucun /ping n'est traité pendant ce temps.
app.post("/import/bloquant", (req, res) => {
  const debut = performance.now();

  const contenu = readFileSync(FICHIER, "utf8");

  let mesures = 0;
  let total = 0;

  for (const ligne of contenu.split("\n")) {
    if (ligne.trim() === "") continue; // la dernière ligne du fichier est vide

    const mesure = JSON.parse(ligne);
    total += mesure.weight_kg;
    mesures += 1;
  }

  res.json({
    mesures,
    poids_moyen_kg: Math.round((total / mesures) * 100) / 100,
    duree_ms: Math.round(performance.now() - debut),
  });
});

// POST /import/flux : lecture en flux.
// Le fichier arrive par morceaux de 64 Ko. Entre deux morceaux, la boucle
// d'événements reprend la main et peut répondre aux /ping en attente.
app.post("/import/flux", async (req, res) => {
  const debut = performance.now();

  const lignes = createInterface({
    input: createReadStream(FICHIER),
    crlfDelay: Infinity,
  });

  let mesures = 0;
  let total = 0;

  for await (const ligne of lignes) {
    if (ligne.trim() === "") continue;

    const mesure = JSON.parse(ligne);
    total += mesure.weight_kg;
    mesures += 1;
  }

  res.json({
    mesures,
    poids_moyen_kg: Math.round((total / mesures) * 100) / 100,
    duree_ms: Math.round(performance.now() - debut),
  });
});

app.listen(4000, () => {
  console.log(`Serveur du TP 1 sur http://localhost:4000, fichier : ${FICHIER}`);
});