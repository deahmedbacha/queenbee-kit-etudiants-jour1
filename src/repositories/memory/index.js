// Crée les trois repositories en mémoire, remplis avec le jeu de données de départ.
// Au jour 2, un fichier équivalent créera les repositories PostgreSQL.
import { readFileSync } from "node:fs";
import { createHivesRepository } from "./hives.repository.js";
import { createMeasuresRepository } from "./measures.repository.js";
import { createInspectionsRepository } from "./inspections.repository.js";

// Quelques ruches de deux sites, copiées du jeu de données.
const HIVES = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "active" },
  { id: "CI-AGBO-048", site_id: "CI-AGBO", status: "active" },
  { id: "CI-AGBO-049", site_id: "CI-AGBO", status: "inactive" },
];

const INSPECTIONS = [
  {
    id: "0b8f3c1e-6d2a-4f5b-9a7e-1c2d3e4f5a01",
    hive_id: "SN-CASA-001",
    inspected_at: "2026-10-04T08:30:00Z",
    colony_status: "forte",
    queen_present: true,
    observations: "Couvain compact, bonnes réserves.",
  },
  {
    id: "0b8f3c1e-6d2a-4f5b-9a7e-1c2d3e4f5a02",
    hive_id: "SN-CASA-001",
    inspected_at: "2026-10-14T09:10:00Z",
    colony_status: "normale",
    queen_present: true,
    observations: null,
  },
];

// Mesures du 31 octobre des ruches ci-dessus (96 par ruche de SN-CASA).
// Lecture synchrone acceptable : une seule fois, au démarrage.
function chargerMesures() {
  const fichier = new URL("../../../data/mesures-SN-CASA-2026-10-31.ndjson", import.meta.url);
  return readFileSync(fichier, "utf8")
    .split("\n")
    .filter((ligne) => ligne.trim() !== "")
    .map((ligne) => JSON.parse(ligne))
    .filter((mesure) => HIVES.some((h) => h.id === mesure.hive_id));
}

export function createMemoryRepositories() {
  return {
    hivesRepository: createHivesRepository([...HIVES]),
    measuresRepository: createMeasuresRepository(chargerMesures()),
    inspectionsRepository: createInspectionsRepository([...INSPECTIONS]),
  };
}
