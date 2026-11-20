// Repository : comment lire et écrire les mesures.
export function createMeasuresRepository(measures) {
  return {
    // De la plus récente à la plus ancienne, puis la page [offset, offset + limit[.
    async findByHive(hiveId, { limit, offset }) {
      return measures
        .filter((m) => m.hive_id === hiveId)
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(offset, offset + limit);
    },

    async insert(measure) {
      measures.push(measure);
      return measure;
    },
  };
}
