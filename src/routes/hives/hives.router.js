import { Router } from "express";

// Routeur : quelle URL, quel verbe. Aucune logique.
// Monté sur /api/hives dans app.js : les chemins ici sont relatifs à ce préfixe
// (écrire "/api/hives/:id" ici donnerait /api/hives/api/hives/:id, donc des 404).
export function createHivesRouter(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.get("/:id/measures", controller.listMeasures);
  router.post("/:id/measures", controller.addMeasure);
  router.get("/:id/inspections", controller.listInspections);
  router.post("/:id/inspections", controller.addInspection);

  return router;
}
