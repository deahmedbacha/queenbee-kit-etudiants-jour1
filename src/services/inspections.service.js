import { ConflictError, ValidationError } from "../errors.js";

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async listInspections(user, hiveId) {
      await hivesService.getHive(user, hiveId);
      return inspectionsRepository.findByHive(hiveId);
    },

    async addInspection(user, hiveId, data) {
      const hive = await hivesService.getHive(user, hiveId);
      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche ${hive.id}.`,
        );
      }
      const result = await inspectionsRepository.insertIfAbsent({
        id: data.id,
        hive_id: hive.id,
        author_id: user.id,
        inspected_at: data.inspected_at,
        colony_status: data.colony_status,
        queen_present: data.queen_present ?? null,
        observations: data.observations ?? null,
      });
      if (!result.created && result.inspection.hive_id !== hive.id) {
        throw new ConflictError(
          `L'identifiant ${data.id} est déjà utilisé par une inspection d'une autre ruche.`,
        );
      }
      return result; // { inspection, created }
    },
  };
}
