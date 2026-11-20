// Lit la configuration dans l'environnement (process.env), une seule fois, au démarrage.
// Une valeur invalide arrête le démarrage avec un message clair.
const NODE_ENVS = ["development", "production", "test"];
const STORAGES = ["postgres", "memory"];

export function loadConfig(env = process.env) {
  const erreurs = [];

  const portTexte = env.PORT ?? "3000";
  const port = Number(portTexte);
  if (!/^\d+$/.test(portTexte) || port < 1 || port > 65535) {
    erreurs.push(`PORT doit être un entier entre 1 et 65535 (reçu : "${portTexte}").`);
  }

  const nodeEnv = env.NODE_ENV ?? "development";
  if (!NODE_ENVS.includes(nodeEnv)) {
    erreurs.push(`NODE_ENV doit valoir ${NODE_ENVS.join(", ")} (reçu : "${nodeEnv}").`);
  }

  const storage = env.STORAGE ?? "postgres";
  if (!STORAGES.includes(storage)) {
    erreurs.push(`STORAGE doit valoir ${STORAGES.join(" ou ")} (reçu : "${storage}").`);
  }

  const dbPortTexte = env.DB_PORT ?? "5432";
  const dbPort = Number(dbPortTexte);
  if (!/^\d+$/.test(dbPortTexte) || dbPort < 1 || dbPort > 65535) {
    erreurs.push(`DB_PORT doit être un entier entre 1 et 65535 (reçu : "${dbPortTexte}").`);
  }

  const poolMaxTexte = env.DB_POOL_MAX ?? "10";
  const poolMax = Number(poolMaxTexte);
  if (!/^\d+$/.test(poolMaxTexte) || poolMax < 1) {
    erreurs.push(`DB_POOL_MAX doit être un entier strictement positif (reçu : "${poolMaxTexte}").`);
  }

  const dbPassword = env.DB_PASSWORD ?? "";
  if (storage === "postgres" && dbPassword.trim() === "") {
    erreurs.push("DB_PASSWORD est obligatoire lorsque STORAGE vaut postgres.");
  }

  if (erreurs.length > 0) {
    throw new Error(`Configuration invalide :\n  - ${erreurs.join("\n  - ")}`);
  }

  return {
    port,
    nodeEnv,
    storage,
    db: {
      host: env.DB_HOST ?? "localhost",
      port: dbPort,
      user: env.DB_USER ?? "queenbee",
      password: dbPassword,
      database: env.DB_NAME ?? "queenbee",
      poolMax,
    },
  };
}

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

export { config };
