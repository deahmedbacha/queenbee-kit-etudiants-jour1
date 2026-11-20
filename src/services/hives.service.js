import { NotFoundError } from "../errors.js";

// Service : les règles sur les ruches. Il reçoit son repository, il ne l'importe pas.
export function createHivesService({ hivesRepository }) {
  return {
    async listHives({ site_id } = {}) {
      return hivesRepository.findAll({ site_id });
    },

    async getHive(id) {
      const hive = await hivesRepository.findById(id);
      if (!hive) throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      return hive;
    },
  };
}
