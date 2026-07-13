const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Corta las peticiones cuyo parámetro de ruta no es un UUID válido.
 *
 * Sin esto, un id malformado (p. ej. `/api/service-reports/undefined/pdf`) llega
 * hasta `findByPk` y Postgres revienta con
 * `invalid input syntax for type uuid: "undefined"` → el usuario recibe un 500.
 *
 * Se responde 404 (no 400) porque un id que ni siquiera puede existir es, a
 * efectos del cliente, un recurso inexistente — y así se mantiene el contrato
 * que ya esperaban los tests.
 *
 * Nota: en SQLite este fallo NO se reproduce (no valida el tipo UUID), así que
 * la suite pasaba en verde mientras producción devolvía 500.
 *
 * @param {string} [param='id'] - nombre del parámetro de ruta a validar.
 */
const validateUuidParam = (param = 'id') => (req, res, next) => {
  const value = req.params[param];

  if (!UUID_RE.test(value || '')) {
    return res.status(404).json({
      success: false,
      message: 'Recurso no encontrado',
    });
  }

  next();
};

module.exports = { validateUuidParam, UUID_RE };
