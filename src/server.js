import express from "express";

const app = express();
app.use(express.json()); // lit les corps JSON (servira pour POST) ; toujours avant les routes

// Quelques ruches de deux sites, copiées du jeu de données.
// Pas encore de base de données : un simple tableau en mémoire.
const hives = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "active" },
  { id: "CI-AGBO-048", site_id: "CI-AGBO", status: "active" },
  { id: "CI-AGBO-049", site_id: "CI-AGBO", status: "inactive" },
];

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
  const hive = hives.find((h) => h.id === req.params.id);

  if (!hive) {
    return res.status(404).json({ error: `Aucune ruche ne porte l'identifiant ${req.params.id}.` });
  }

  res.json(hive);
});

app.listen(3000, () => {
  console.log("API Queen Bee sur http://localhost:3000");
});