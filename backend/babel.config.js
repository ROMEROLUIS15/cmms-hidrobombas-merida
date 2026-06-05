/**
 * Configuración de Babel SOLO para tests (la consume babel-jest).
 * La app en producción corre con `node` directamente (CommonJS), sin Babel.
 *
 * preset-env con target "node current" transpila los paquetes ESM-only del
 * ecosistema @langchain/* a CommonJS para que Jest pueda importarlos. Esto
 * desacopla la suite de tests de si langchain publica build CJS o solo ESM,
 * permitiendo actualizar dependencias sin romper el backend.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
  ],
};
