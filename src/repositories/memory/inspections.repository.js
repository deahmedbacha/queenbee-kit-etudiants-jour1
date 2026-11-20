// Repository : comment lire et écrire les inspections.
export function createInspectionsRepository(inspections) {
  return {
    // De la plus récente à la plus ancienne inspection sur le terrain.
    async findByHive(hiveId) {
      return inspections
        .filter((i) => i.hive_id === hiveId)
        .sort((a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at));
    },

    async findById(id) {
      return inspections.find((i) => i.id === id) ?? null;
    },

    async insert(inspection) {
      inspections.push(inspection);
      return inspection;
    },
  };
}
