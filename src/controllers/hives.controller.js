import { ValidationError } from "../errors.js";

const estEntier = (texte) => typeof texte === "string" && /^\d+$/.test(texte);

// Les paramètres de requête arrivent sous forme de texte : "abc", "1.5" ou "-1"
// sont refusés, pas convertis en silence.
function lirePagination(query) {
  let limit = 50;
  if (query.limit !== undefined) {
    limit = Number(query.limit);
    if (!estEntier(query.limit) || limit < 1 || limit > 500) {
      throw new ValidationError("Le paramètre limit doit être un entier compris entre 1 et 500.");
    }
  }

  let offset = 0;
  if (query.offset !== undefined) {
    offset = Number(query.offset);
    if (!estEntier(query.offset)) {
      throw new ValidationError("Le paramètre offset doit être un entier positif ou nul.");
    }
  }

  return { limit, offset };
}

// Contrôleur : que dit la requête, que répondre ? Il appelle les services,
// il n'importe jamais un repository et ne contient pas de règle métier.
export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    async list(req, res) {
      res.json(await hivesService.list(req.query.site_id));
    },

    async get(req, res) {
      res.json(await hivesService.get(req.params.id));
    },

    async listMeasures(req, res) {
      const { limit, offset } = lirePagination(req.query);
      const items = await measuresService.list(req.params.id, { limit, offset });
      res.json({ items, limit, offset });
    },

    async addMeasure(req, res) {
      res.status(201).json(await measuresService.add(req.params.id, req.body));
    },

    async listInspections(req, res) {
      res.json(await inspectionsService.list(req.params.id));
    },

    async addInspection(req, res) {
      res.status(201).json(await inspectionsService.add(req.params.id, req.body));
    },
  };
}
