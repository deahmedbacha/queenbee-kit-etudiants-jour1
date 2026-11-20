import { ValidationError } from "../errors.js";

// Service : les règles sur les mesures qui dépendent du contexte (la ruche).
export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async listMeasures(hiveId, { limit, offset }) {
      await hivesService.getHive(hiveId);
      return measuresRepository.findByHive(hiveId, { limit, offset });
    },

    async addMeasure(hiveId, data) {
      const hive = await hivesService.getHive(hiveId);
      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche ${hive.id}.`,
        );
      }
      return measuresRepository.add({
        ...data,
        hive_id: hive.id,
        site_id: hive.site_id,
      });
    },
  };
}
