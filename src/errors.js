// Erreurs métier. Les services les lèvent ; seul errorHandler (couche HTTP)
// les traduit en code de statut.
export class NotFoundError extends Error {}   // la ressource n'existe pas      -> 404
export class ValidationError extends Error {} // une règle n'est pas respectée  -> 400
export class ConflictError extends Error {}   // la ressource existe déjà       -> 409
