import express from "express";
import { readFileSync } from "node:fs";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { sendProblem } from "./utils/problem.js";

const app = express();
app.use(requestLogger);  // journalise toutes les requêtes
app.use(express.json()); // lit les corps JSON ; toujours avant les routes

// ---------------------------------------------------------------------------
// Données en mémoire
// ---------------------------------------------------------------------------

// Quelques ruches de deux sites, copiées du jeu de données.
const hives = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "active" },
  { id: "CI-AGBO-048", site_id: "CI-AGBO", status: "active" },
  { id: "CI-AGBO-049", site_id: "CI-AGBO", status: "inactive" },
];

// Mesures du 31 octobre des ruches ci-dessus : 96 par ruche de SN-CASA, de quoi
// tester la pagination. Lecture synchrone acceptable ici : elle a lieu une seule
// fois, au démarrage, avant que le serveur n'accepte des requêtes.
const FICHIER = new URL("../data/mesures-SN-CASA-2026-10-31.ndjson", import.meta.url);
const measures = readFileSync(FICHIER, "utf8")
  .split("\n")
  .filter((ligne) => ligne.trim() !== "")
  .map((ligne) => JSON.parse(ligne))
  .filter((mesure) => hives.some((h) => h.id === mesure.hive_id));

const inspections = [
  {
    id: "0b8f3c1e-6d2a-4f5b-9a7e-1c2d3e4f5a01",
    hive_id: "SN-CASA-001",
    inspected_at: "2026-10-04T08:30:00Z",
    colony_status: "forte",
    queen_present: true,
    observations: "Couvain compact, bonnes réserves.",
  },
  {
    id: "0b8f3c1e-6d2a-4f5b-9a7e-1c2d3e4f5a02",
    hive_id: "SN-CASA-001",
    inspected_at: "2026-10-14T09:10:00Z",
    colony_status: "normale",
    queen_present: true,
    observations: null,
  },
];

// ---------------------------------------------------------------------------
// Petites fonctions utiles
// ---------------------------------------------------------------------------

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLONY_STATUSES = ["forte", "normale", "faible", "morte"];

const estAbsent = (valeur) => valeur === undefined || valeur === null;
const estDateIso = (valeur) => typeof valeur === "string" && ISO_8601.test(valeur) && !Number.isNaN(Date.parse(valeur));
const estEntier = (texte) => typeof texte === "string" && /^\d+$/.test(texte);

function trouverRuche(id) {
  return hives.find((h) => h.id === id);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /health : l'API répond.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /api/hives : toutes les ruches, ou celles d'un site avec ?site_id=SN-CASA.
app.get("/api/hives", (req, res) => {
  const { site_id } = req.query;

  // Absent ou vide : pas de filtre. Une chaîne vide n'est pas undefined.
  if (!site_id) {
    return res.json(hives);
  }

  res.json(hives.filter((hive) => hive.site_id === site_id));
});

// GET /api/hives/:id : une ruche, ou 404 si elle n'existe pas.
app.get("/api/hives/:id", (req, res) => {
  const hive = trouverRuche(req.params.id);
  if (!hive) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  res.json(hive);
});

// GET /api/hives/:id/measures : historique paginé, de la plus récente à la plus ancienne.
app.get("/api/hives/:id/measures", (req, res) => {
  const hive = trouverRuche(req.params.id);
  if (!hive) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  // Les paramètres de requête arrivent sous forme de texte : "abc", "1.5" ou "-1"
  // sont refusés, pas convertis en silence.
  let limit = 50;
  if (req.query.limit !== undefined) {
    limit = Number(req.query.limit);
    if (!estEntier(req.query.limit) || limit < 1 || limit > 500) {
      return sendProblem(res, 400, "Le paramètre limit doit être un entier compris entre 1 et 500.");
    }
  }

  let offset = 0;
  if (req.query.offset !== undefined) {
    offset = Number(req.query.offset);
    if (!estEntier(req.query.offset)) {
      return sendProblem(res, 400, "Le paramètre offset doit être un entier positif ou nul.");
    }
  }

  const items = measures
    .filter((m) => m.hive_id === hive.id)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(offset, offset + limit);

  res.json({ items, limit, offset });
});

// POST /api/hives/:id/measures : enregistre une mesure envoyée par la passerelle.
app.post("/api/hives/:id/measures", (req, res) => {
  const hive = trouverRuche(req.params.id);
  if (!hive) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  // Sans corps, req.body vaut undefined : on part d'un objet vide.
  const trame = req.body ?? {};

  if (estAbsent(trame.timestamp)) {
    return sendProblem(res, 400, "Le champ timestamp est obligatoire.");
  }
  if (estAbsent(trame.weight_kg)) {
    return sendProblem(res, 400, "Le champ weight_kg est obligatoire.");
  }
  if (trame.hive_id !== undefined && trame.hive_id !== hive.id) {
    return sendProblem(
      res,
      400,
      `Le champ hive_id (${trame.hive_id}) ne correspond pas à la ruche du chemin (${hive.id}).`,
    );
  }

  // La mesure garde le timestamp de la trame : l'instant où le capteur l'a prise.
  const measure = { ...trame, hive_id: hive.id, site_id: hive.site_id };
  measures.push(measure);

  res.status(201).json(measure);
});

// GET /api/hives/:id/inspections : les inspections de la ruche, la plus récente d'abord.
app.get("/api/hives/:id/inspections", (req, res) => {
  const hive = trouverRuche(req.params.id);
  if (!hive) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  const items = inspections
    .filter((i) => i.hive_id === hive.id)
    .sort((a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at));

  res.json(items);
});

// POST /api/hives/:id/inspections : enregistre une inspection saisie sur l'application mobile.
app.post("/api/hives/:id/inspections", (req, res) => {
  const hive = trouverRuche(req.params.id);
  if (!hive) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  const corps = req.body ?? {};

  // L'identifiant est un UUID choisi par l'application mobile, pas par le serveur.
  if (typeof corps.id !== "string" || !UUID.test(corps.id)) {
    return sendProblem(res, 400, "Le champ id est obligatoire et doit être un UUID.");
  }
  if (!estDateIso(corps.inspected_at)) {
    return sendProblem(
      res,
      400,
      "Le champ inspected_at est obligatoire et doit être une date ISO 8601, par exemple 2026-11-18T09:00:00Z.",
    );
  }
  if (!COLONY_STATUSES.includes(corps.colony_status)) {
    return sendProblem(res, 400, `Le champ colony_status doit valoir ${COLONY_STATUSES.join(", ")}.`);
  }
  if (!estAbsent(corps.queen_present) && typeof corps.queen_present !== "boolean") {
    return sendProblem(res, 400, "Le champ queen_present doit être un booléen.");
  }
  if (!estAbsent(corps.observations) && typeof corps.observations !== "string") {
    return sendProblem(res, 400, "Le champ observations doit être un texte.");
  }

  // Un identifiant déjà connu signale une inspection déjà synchronisée.
  if (inspections.some((i) => i.id === corps.id)) {
    return sendProblem(res, 409, `Une inspection porte déjà l'identifiant ${corps.id}.`);
  }

  const inspection = {
    id: corps.id,
    hive_id: hive.id,
    inspected_at: corps.inspected_at,
    colony_status: corps.colony_status,
    queen_present: corps.queen_present ?? null,
    observations: corps.observations ?? null,
  };
  inspections.push(inspection);

  res.status(201).json(inspection);
});

// ---------------------------------------------------------------------------
// Erreurs : toujours en dernier, après toutes les routes.
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000, () => {
  console.log("API Queen Bee sur http://localhost:3000");
});