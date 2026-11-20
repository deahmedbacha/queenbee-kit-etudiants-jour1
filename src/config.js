// Lit la configuration dans l'environnement (process.env), une seule fois, au démarrage.
// Une valeur invalide arrête le démarrage avec un message clair.
const NODE_ENVS = ["development", "production", "test"];

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

  if (erreurs.length > 0) {
    throw new Error(`Configuration invalide :\n  - ${erreurs.join("\n  - ")}`);
  }

  return { port, nodeEnv };
}
