import { loadConfig } from "./config.js";
import { createApp } from "./app.js";
import { createMemoryRepositories } from "./repositories/memory/index.js";

// Démarre le serveur : configuration, repositories en mémoire, application, écoute.
let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const app = createApp(createMemoryRepositories());

app.listen(config.port, () => {
  console.log(`API Queen Bee sur http://localhost:${config.port} (${config.nodeEnv})`);
});
