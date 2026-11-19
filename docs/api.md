# API Queen Bee v0 : contrat des routes

## Conventions communes

- URL de base : `http://localhost:3000`
- Corps de requête et de réponse en JSON (`Content-Type: application/json`).
- Dates au format ISO 8601 avec fuseau : `2026-10-31T10:00:00Z`.
- Identifiant d'une ruche : code du site suivi d'un numéro sur trois chiffres, par exemple `SN-CASA-001`.

### Format des erreurs

Toutes les erreurs suivent la RFC 9457, avec l'en-tête `Content-Type: application/problem+json` :

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le paramètre limit doit être un entier compris entre 1 et 500."
}
```

`title` est l'intitulé du code, le même pour toutes les erreurs de ce code. `detail` explique ce qui s'est passé pour cette requête. Une réponse ne contient jamais de pile d'exécution.

| Code | `title` |
| --- | --- |
| 400 | Requête invalide |
| 404 | Ressource introuvable |
| 409 | Conflit |
| 500 | Erreur interne |

Erreurs communes à toutes les routes :
- **400** : le corps n'est pas un JSON valide (`"Le corps de la requête n'est pas un JSON valide."`).
- **404** : aucune route ne correspond (`"Aucune route ne correspond à GET /api/nope."`).
- **500** : erreur interne imprévue (`"Une erreur interne est survenue."`).

---

### GET /health

Indique que l'API répond.

Paramètres : aucun.

200 :
```json
{ "status": "ok" }
```

---

### GET /api/hives

Liste des ruches, éventuellement filtrée par site.

Paramètres de requête
- `site_id` : texte, facultatif. Code d'un site, par exemple `SN-CASA`. Absent ou vide : toutes les ruches. Un site inconnu renvoie une liste vide.

200 :
```json
[
  { "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" },
  { "id": "SN-CASA-002", "site_id": "SN-CASA", "status": "active" }
]
```

`status` vaut `active` ou `inactive`.

---

### GET /api/hives/:id

Une ruche.

Paramètres de chemin
- `id` : texte, identifiant de la ruche.

200 :
```json
{ "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" }
```

404 : aucune ruche ne porte cet identifiant.
```json
{
  "type": "about:blank",
  "title": "Ressource introuvable",
  "status": 404,
  "detail": "Aucune ruche ne porte l'identifiant XX-NOPE-999."
}
```

---

### GET /api/hives/:id/measures

Historique des mesures d'une ruche, de la plus récente à la plus ancienne.

Paramètres de chemin
- `id` : texte, identifiant de la ruche.

Paramètres de requête
- `limit` : entier de 1 à 500, 50 par défaut. Nombre maximal de mesures renvoyées.
- `offset` : entier positif ou nul, 0 par défaut. Nombre de mesures à sauter ; la page suivante commence à `offset + limit`.

Les valeurs non entières (`abc`, `1.5`, `-1`, chaîne vide) sont refusées.

200 : `items` est vide si `offset` dépasse le nombre de mesures.
```json
{
  "items": [
    {
      "hive_id": "SN-CASA-001",
      "site_id": "SN-CASA",
      "timestamp": "2026-10-31T23:45:00Z",
      "position_lat": 12.574298,
      "position_lon": -16.28731,
      "weight_kg": 36.89,
      "temp_internal_c": 34.4,
      "temp_external_c": 24,
      "humidity_pct": 64,
      "acoustic_activity_score": 0.02,
      "battery_pct": 79
    }
  ],
  "limit": 50,
  "offset": 0
}
```

400 : `limit` ou `offset` invalide.
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le paramètre limit doit être un entier compris entre 1 et 500."
}
```
Pour `offset`, `detail` vaut `"Le paramètre offset doit être un entier positif ou nul."`

404 : aucune ruche ne porte cet identifiant.

---

### POST /api/hives/:id/measures

Enregistre une mesure envoyée par la passerelle d'un site. La mesure garde le `timestamp` de la trame : l'instant où le capteur l'a prise, pas celui où le serveur l'a reçue.

Paramètres de chemin
- `id` : texte, identifiant de la ruche.

Corps
| Champ | Obligatoire | Type | Règle |
| --- | --- | --- | --- |
| `timestamp` | oui | texte | Date ISO 8601 |
| `weight_kg` | oui | nombre | Poids de la ruche en kg |
| `hive_id` | non | texte | S'il est présent, égal au `:id` du chemin |
| `site_id`, `position_lat`, `position_lon`, `temp_internal_c`, `temp_external_c`, `humidity_pct`, `acoustic_activity_score`, `battery_pct` | non | | Champs de la trame, enregistrés tels quels |

Exemple de corps :
```json
{
  "hive_id": "SN-CASA-001",
  "site_id": "SN-CASA",
  "timestamp": "2026-10-31T10:00:00Z",
  "weight_kg": 36.84,
  "battery_pct": 88
}
```

201 : la mesure enregistrée. `hive_id` et `site_id` viennent de la ruche.
```json
{
  "hive_id": "SN-CASA-001",
  "site_id": "SN-CASA",
  "timestamp": "2026-10-31T10:00:00Z",
  "weight_kg": 36.84,
  "battery_pct": 88
}
```

400 : `timestamp` ou `weight_kg` manque, ou `hive_id` ne correspond pas au chemin.
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le champ timestamp est obligatoire."
}
```

404 : aucune ruche ne porte cet identifiant.

---

### GET /api/hives/:id/inspections

Inspections d'une ruche, de la plus récente à la plus ancienne (selon `inspected_at`).

Paramètres de chemin
- `id` : texte, identifiant de la ruche.

200 : un tableau, vide si la ruche n'a aucune inspection.
```json
[
  {
    "id": "0b8f3c1e-6d2a-4f5b-9a7e-1c2d3e4f5a02",
    "hive_id": "SN-CASA-001",
    "inspected_at": "2026-10-14T09:10:00Z",
    "colony_status": "normale",
    "queen_present": true,
    "observations": null
  }
]
```

404 : aucune ruche ne porte cet identifiant.

---

### POST /api/hives/:id/inspections

Enregistre une inspection saisie sur l'application mobile. L'identifiant est un UUID choisi par l'application, pas par le serveur.

Paramètres de chemin
- `id` : texte, identifiant de la ruche.

Corps
| Champ | Obligatoire | Type | Règle |
| --- | --- | --- | --- |
| `id` | oui | texte | UUID, par exemple `3aa0f18f-a2f8-46b2-a7bd-1d3a725db517` |
| `inspected_at` | oui | texte | Date ISO 8601 avec fuseau |
| `colony_status` | oui | texte | `forte`, `normale`, `faible` ou `morte` |
| `queen_present` | non | booléen | `true` ou `false` ; absent : `null` |
| `observations` | non | texte | Absent : `null` |

Exemple de corps :
```json
{
  "id": "3aa0f18f-a2f8-46b2-a7bd-1d3a725db517",
  "inspected_at": "2026-11-18T09:00:00Z",
  "colony_status": "forte",
  "queen_present": true,
  "observations": "RAS"
}
```

201 : l'inspection créée.
```json
{
  "id": "3aa0f18f-a2f8-46b2-a7bd-1d3a725db517",
  "hive_id": "SN-CASA-002",
  "inspected_at": "2026-11-18T09:00:00Z",
  "colony_status": "forte",
  "queen_present": true,
  "observations": "RAS"
}
```

400 : un champ obligatoire manque ou une valeur est invalide.
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le champ colony_status doit valoir forte, normale, faible, morte."
}
```

404 : aucune ruche ne porte cet identifiant.

409 : une inspection porte déjà cet `id` (synchronisation rejouée).
```json
{
  "type": "about:blank",
  "title": "Conflit",
  "status": 409,
  "detail": "Une inspection porte déjà l'identifiant 3aa0f18f-a2f8-46b2-a7bd-1d3a725db517."
}
```