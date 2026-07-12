/**
 * Saltos de proxy en los que Express debe confiar para resolver la IP real del
 * cliente (`req.ip`) a partir de la cabecera `X-Forwarded-For`.
 *
 * En Vercel toda petición entra por su proxy, que añade la IP del cliente a
 * `X-Forwarded-For`. Sin `trust proxy`, Express ignora esa cabecera y
 * express-rate-limit aborta con ERR_ERL_UNEXPECTED_X_FORWARDED_FOR: no puede
 * distinguir clientes, así que el límite deja de proteger de verdad.
 *
 * Fuera de Vercel devolvemos 0 (no confiar en nada): sin un proxy delante,
 * cualquiera podría falsear la cabecera y rotar IPs para saltarse el límite.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {number} número de proxies de confianza (0 = ninguno)
 */
const resolveTrustProxy = (env = process.env) => (env.VERCEL ? 1 : 0);

module.exports = { resolveTrustProxy };
