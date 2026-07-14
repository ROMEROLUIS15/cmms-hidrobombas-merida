/**
 * Utilidades sin dependencias externas.
 *
 * Deliberadamente NO se importa `https://jslib.k6.io/k6-utils/...`: k6 lo
 * descargaría en cada arranque, y una prueba de carga que no corre sin red es
 * una prueba que un día no corre.
 */

/** UUID v4 (suficiente para claves de idempotencia y datos de prueba). */
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Elemento aleatorio de un array (mezcla de tráfico realista). */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
