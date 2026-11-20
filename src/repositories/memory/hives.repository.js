// Repository : comment lire les ruches. Ici un tableau en mémoire ;
// au jour 2, PostgreSQL. Méthodes async dès maintenant pour que rien d'autre ne change.
export function createHivesRepository(hives) {
  return {
    async findAll() {
      return hives;
    },

    async findBySite(siteId) {
      return hives.filter((h) => h.site_id === siteId);
    },

    async findById(id) {
      return hives.find((h) => h.id === id) ?? null;
    },
  };
}
