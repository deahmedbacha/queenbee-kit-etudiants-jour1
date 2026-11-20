// Contrôleur : que dit la requête, que répondre ? Il appelle les services,
// il n'importe jamais un repository et ne contient pas de règle métier.
export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    async listHives(req, res) {
      res.json(await hivesService.listHives(req.validated));
    },

    async getHive(req, res) {
      res.json(await hivesService.getHive(req.params.id));
    },

    async listMeasures(req, res) {
      const { limit, offset } = req.validated;
      const items = await measuresService.listMeasures(req.params.id, { limit, offset });
      res.json({ items, limit, offset });
    },

    async addMeasure(req, res) {
      res.status(201).json(await measuresService.addMeasure(req.params.id, req.validated));
    },

    async listInspections(req, res) {
      res.json(await inspectionsService.listInspections(req.params.id));
    },

    async addInspection(req, res) {
      res.status(201).json(await inspectionsService.addInspection(req.params.id, req.validated));
    },
  };
}
