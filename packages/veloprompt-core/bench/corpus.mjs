/** Texto sintético con prosa, números de todo tipo y algunos datos sensibles ficticios. */
const PARAGRAPHS = [
  "Hola, necesito ayuda para redactar un correo a nuestro proveedor sobre el pedido nº 4567891234 que llegó tarde el 20/10/2026. ",
  "El importe total fue de $1.250,00 y la factura 20456789012 vence el 15-11-2026. ",
  "Por favor, escribe a ana.cliente@example.com o llama al +34 612 345 678 si hay dudas. ",
  "Mi DNI es 12345678Z y el RUT de la empresa chilena es 12.345.678-5. ",
  "La reunión es a las 10:30 en la sala 204; asistirán 35 personas del equipo de ventas. ",
  "Usa la clave sk-ant-api03-QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ solo en pruebas. ",
  "El IBAN es ES91 2100 0418 4502 0005 1332 y la tarjeta 4111 1111 1111 1111. ",
  "Seguimos analizando las métricas trimestrales: 3.500 visitas, 12% de conversión y 7.800 euros. ",
];

/** @param {number} size */
export function buildCorpus(size) {
  let out = "";
  let i = 0;
  while (out.length < size) out += PARAGRAPHS[i++ % PARAGRAPHS.length];
  return out;
}
