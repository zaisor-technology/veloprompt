# Política de privacidad de VeloPrompt

**Última actualización:** 20 de octubre de 2026

VeloPrompt es una extensión de navegador de **Zaisor Technology, LLC** (Wyoming, Estados Unidos),
1950 Olympus Ave, Hacienda Heights, CA 91745, Estados Unidos. Contacto: **hola@zaisor.io**.

## Resumen

**VeloPrompt no recoge, no envía y no vende ningún dato.** Todo el análisis ocurre dentro de tu
navegador. La extensión no tiene servidor, no hace peticiones de red, no usa analítica ni
publicidad, y no carga código remoto.

## Qué hace la extensión con tus datos

1. **Texto que pegas o envías en un chat de IA.** En los sitios compatibles (ChatGPT, Claude,
   Gemini, Copilot, Microsoft 365 Copilot, Perplexity y DeepSeek), VeloPrompt lee el texto que pegas
   o que vas a enviar en el cuadro del chat para detectar datos sensibles (documentos de identidad,
   números de cuenta, tarjetas, emails, teléfonos, claves de API, contraseñas y los términos que tú
   definas). El análisis se hace en tu equipo y el texto no sale de él por parte de VeloPrompt.
2. **Etiquetas y valores reales.** Cuando eliges tapar un dato, VeloPrompt lo sustituye por una
   etiqueta (por ejemplo `[CEDULA_1]`) y guarda la relación etiqueta → valor **solo en la memoria de
   esa pestaña**, para mostrarte tus datos reales en la respuesta. Esa relación nunca se escribe en
   disco y desaparece al cerrar o recargar la pestaña.
3. **Respuestas de la IA.** VeloPrompt lee el texto de las respuestas en pantalla para cambiar las
   etiquetas por tus datos reales, solo en tu pantalla. No modifica lo que se envía al servicio de IA.

Lo que finalmente envías al servicio de IA lo decides tú y queda sujeto a la política de privacidad
de ese servicio.

## Qué se guarda en tu navegador

En el almacenamiento local de la extensión (`chrome.storage.local`), que no se sincroniza ni se envía:

- Tus ajustes: sitios activos, países y tipos de dato elegidos.
- Tu lista de términos propios, si la creas.
- Un contador semanal de datos tapados, **solo con el número por tipo** (por ejemplo, "3 emails"),
  nunca con los datos.

Puedes borrarlo todo desinstalando la extensión. El contador también se puede poner a cero desde
los ajustes.

## Permisos

- **storage:** guardar los ajustes, los términos propios y el contador descritos arriba.
- **Acceso a chatgpt.com, claude.ai, gemini.google.com, copilot.microsoft.com,
  m365.cloud.microsoft, www.microsoft365.com, perplexity.ai y chat.deepseek.com:** detectar datos en el
  cuadro del chat y restaurarlos en las respuestas. En los dominios de Microsoft 365 la extensión
  solo actúa en el chat de Copilot. No tiene acceso a ningún otro sitio.

## Lo que no hacemos

- No recogemos ni transmitimos datos personales, contenido de páginas, historial ni actividad.
- No usamos cookies, analítica, publicidad ni seguimiento.
- No vendemos ni compartimos datos con terceros (no tenemos datos que compartir).
- No usamos los datos para fines distintos de la función de la extensión, ni para evaluar
  solvencia o conceder préstamos.

## Menores

VeloPrompt no está dirigida a menores de 13 años y no recoge datos de nadie.

## Cambios

Si esta política cambia, publicaremos la nueva versión en esta página con su fecha. Si alguna vez la
extensión necesitara enviar algún dato, lo explicaríamos antes y pediríamos tu consentimiento.

## Contacto

Para cualquier pregunta sobre privacidad: **hola@zaisor.io**.

---

# VeloPrompt Privacy Policy (English)

**Last updated:** October 20, 2026

VeloPrompt is a browser extension by **Zaisor Technology, LLC** (Wyoming, USA), 1950 Olympus Ave,
Hacienda Heights, CA 91745, USA. Contact: **hola@zaisor.io**.

**VeloPrompt does not collect, transmit or sell any data.** All analysis happens inside your browser.
The extension has no server, makes no network requests, uses no analytics or ads, and loads no
remote code.

- **Text you paste or send in an AI chat** on the supported sites (ChatGPT, Claude, Gemini, Copilot,
  Microsoft 365 Copilot, Perplexity, DeepSeek) is analyzed locally to detect sensitive data. It is
  never sent anywhere by VeloPrompt.
- **Label → real value mapping** (e.g. `[CEDULA_1]`) is kept **only in the memory of that tab** to show
  your real data in the AI's answer on your screen. It is never written to disk and is discarded when
  the tab is closed or reloaded.
- **Stored locally** (`chrome.storage.local`, not synced): your settings, your custom terms, and a weekly
  count of masked items **by type only** (never the data itself).
- **Permissions:** `storage` for the above; host access limited to the chat sites listed, to detect data
  in the chat box and restore it in answers. On Microsoft 365 domains it only acts on the Copilot chat.
- No cookies, analytics, advertising, tracking, data sale or sharing. Not directed at children under 13.

Questions: **hola@zaisor.io**.
