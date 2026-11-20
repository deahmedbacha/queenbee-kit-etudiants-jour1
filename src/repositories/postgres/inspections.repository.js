export function createInspectionsRepository(pool) {
  async function add(inspection) {
    const { rows } = await pool.query(
      `INSERT INTO inspections (
         id, hive_id, author_id, inspected_at, colony_status, queen_present, observations
       )
       VALUES (
         $1, $2, (SELECT owner_id FROM hives WHERE id = $2), $3, $4, $5, $6
       )
       RETURNING id, hive_id, author_id, inspected_at, colony_status, queen_present, observations`,
      [
        inspection.id,
        inspection.hive_id,
        inspection.inspected_at,
        inspection.colony_status,
        inspection.queen_present ?? null,
        inspection.observations ?? null,
      ],
    );
    return rows[0];
  }

  return {
    add,
    insert: add,
    async findById() {
      return null;
    },
    async findByHive(hiveId) {
      const { rows } = await pool.query(
        `SELECT id, hive_id, author_id, inspected_at, colony_status, queen_present, observations
           FROM inspections
          WHERE hive_id = $1
          ORDER BY inspected_at DESC`,
        [hiveId],
      );
      return rows;
    },
  };
}
