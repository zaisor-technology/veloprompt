# VeloPrompt

**Ponle un velo a tus datos antes de enviarlos a la IA.**

VeloPrompt es una extensión de navegador de código abierto (licencia MIT) de **Zaisor Technology LLC**.
Antes de que pegues o envíes un texto en un chat de IA (ChatGPT, Claude, Gemini, Copilot, Perplexity,
DeepSeek), detecta los datos sensibles y los sustituye por etiquetas coherentes como `[CEDULA_1]` o
`[NIF_2]`. Cuando la IA responde, puede devolverte el texto con tus datos reales.

Todo ocurre en tu navegador: **sin servidor, sin telemetría y sin llamadas de red.**

Web: [zaisor.io/veloprompt](https://zaisor.io/veloprompt)

> Estado: semana 3. Motor de detección (`veloprompt-core`) y extensión para ChatGPT, Claude, Gemini, Copilot, Perplexity y DeepSeek ([`apps/extension`](apps/extension/README.md)).

## Estructura

| Ruta | Contenido |
| --- | --- |
| [`packages/veloprompt-core`](packages/veloprompt-core) | Motor de detección y anonimización. TypeScript puro, ESM, sin dependencias en runtime. |
| [`apps/extension`](apps/extension) | Extensión MV3 para Chrome y Edge (WXT): ChatGPT, Claude, Gemini, Copilot, Perplexity y DeepSeek. |

## Uso del motor

```ts
import { detect, redact, restore, createSession } from "veloprompt-core";

detect("Mi DNI es 12345678Z");
// → [{ type: "NIF", country: "ES", value: "12345678Z", start: 10, end: 19, confidence: 0.98, rule: "es.dni" }]

const session = createSession(); // una por conversación
const { text, map } = redact("Escribe a ana@example.com, RUT 12.345.678-5", { session });
// text → "Escribe a [EMAIL_1], RUT [RUT_1]"
// map  → { "[EMAIL_1]": "ana@example.com", "[RUT_1]": "12.345.678-5" }

restore("He enviado el contrato a [EMAIL_1]", map);
// → "He enviado el contrato a ana@example.com"
```

Opciones de `detect` y `redact`:

| Opción | Para qué sirve |
| --- | --- |
| `countries` | Países activos (`EC`, `ES`, `MX`, `CL`, `CO`, `PE`, `AR`). Por defecto, todos. Las reglas comunes se aplican siempre. |
| `types` | Tipos activos (`CEDULA`, `NIF`, `EMAIL`, `TARJETA`...). Por defecto, todos. |
| `customTerms` | Palabras o frases propias que se tapan siempre (nombres de clientes, proyectos...). Se etiquetan como `[PRIVADO_n]`. |
| `minConfidence` | Descarta hallazgos por debajo de esa confianza (0-1). |
| `session` | Solo en `redact`: conserva las etiquetas entre mensajes. El mismo dato recibe siempre la misma etiqueta, aunque se escriba con o sin puntos y guiones. |

## Qué ve y qué no ve VeloPrompt

### Lo que sí detecta

| País | Datos | Cómo se valida |
| --- | --- | --- |
| Ecuador | Cédula, RUC (persona natural, sociedad privada y pública) | Provincia 01-24 o 30, módulo 10 y módulo 11 |
| España | DNI/NIF, NIE, CIF, IBAN | Letra módulo 23, control del CIF, IBAN mod 97 |
| México | CURP, RFC (física y moral), CLABE | Dígito verificador de cada uno y fecha válida |
| Chile | RUT/RUN (`12.345.678-5` y `12345678-5`) | Módulo 11 (incluida la K) |
| Colombia | NIT; cédula de ciudadanía | NIT con dígito de verificación; la cédula solo con contexto |
| Perú | RUC; DNI | RUC con dígito verificador; el DNI solo con contexto |
| Argentina | CUIT/CUIL, CBU; DNI | Verificador de CUIT y los dos de CBU; el DNI solo con contexto |
| Todos | Email, teléfonos (E.164 y formatos locales de los 7 países), tarjetas, IBAN de cualquier país, claves de API (`sk-`, `sk-ant-`, `AKIA`, `ghp_`, `github_pat_`, `xox…`), valores tras `contraseña:` / `password:` | Luhn y marca de tarjeta, mod 97, prefijos de clave |

"Solo con contexto" significa que el número únicamente cuenta si hay cerca una palabra como *DNI*,
*C.C.* o *cédula*. Sin dígito de control, un número de 8 cifras podría ser cualquier cosa.

### Lo que no ve (todavía)

- **Nombres de personas, direcciones postales y fechas de nacimiento.** No hay forma fiable de reconocerlos
  con reglas locales. Usa `customTerms` para tapar nombres concretos.
- **Datos dentro de imágenes, PDF o archivos adjuntos.** Solo analiza el texto que pegas o escribes.
- **Datos con errores de escritura.** Si una cédula tiene un dígito mal, el control falla y no se tapa.
  Es intencionado: así se evitan falsos positivos en pedidos, importes y referencias.
- **Números escritos con letras o partidos de forma rara** ("uno siete uno dos...", "1712 / 345678").
- **Información sensible por su contenido** (diagnósticos médicos, opiniones, secretos de negocio),
  salvo que la añadas a `customTerms`.
- **Teléfonos locales sin separadores ni contexto** en países donde se confundirían con otros números
  (por ejemplo, `612345678` suelto en España). Con "tel.", "móvil", "WhatsApp"... o con espacios, sí se detectan.

VeloPrompt reduce el riesgo, pero no lo elimina. Revisa siempre lo que envías.

### Cuando dos reglas compiten

Si un mismo número encaja en varias reglas (por ejemplo, un RUC peruano y un CUIT argentino que empiezan
por `20`), gana la que tiene una palabra de contexto cerca ("RUC", "CUIT"). Si ninguna la tiene, decide la
prioridad de la regla. En cualquier caso el dato se tapa.

### Privacidad

- El motor no hace ninguna llamada de red ni guarda nada. El mapa etiqueta → valor vive solo en memoria.
- Sin dependencias en tiempo de ejecución.
- Los tests usan números sintéticos generados con cada algoritmo. Nunca documentos de personas reales.

## Desarrollo

Requisitos: Node 20+ y pnpm 10.

```bash
pnpm install
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest
pnpm coverage    # Vitest + cobertura v8
pnpm bench       # compila y mide detect() sobre 50.000 caracteres (objetivo < 50 ms)
pnpm build       # tsup → packages/veloprompt-core/dist
```

Cada país tiene su archivo en `packages/veloprompt-core/src/rules/` (`ec.ts`, `es.ts`, `mx.ts`, `cl.ts`,
`co.ts`, `pe.ts`, `ar.ts`, `common.ts`) y sus algoritmos de control en `src/checksums.ts`.

## Licencia

[MIT](LICENSE) © Zaisor Technology LLC
