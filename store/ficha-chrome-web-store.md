# Ficha de VeloPrompt en la Chrome Web Store

Copia y pega cada campo en el panel de desarrollador (https://chrome.google.com/webstore/devconsole).
Idioma de la ficha: **Español**.

## Paquete

- Archivo: `apps/extension/dist/veloprompt-extension-1.0.0-chrome.zip`
  (se genera con `pnpm --filter veloprompt-extension zip`).
- Versión: **1.0.0**. El nombre y la descripción corta salen del manifiesto:
  - Nombre: **VeloPrompt**
  - Descripción corta (máx. 132): *Ponle un velo a tus datos antes de enviarlos a la IA. Todo en local, sin servidor.*

## Pestaña «Ficha de Play Store» / «Store listing»

**Descripción** (pega el texto entre las líneas):

---
¿Pegas contratos, correos o tablas en ChatGPT y luego te das cuenta de que llevaban la cédula, el DNI o el IBAN de alguien? VeloPrompt te avisa antes de que pase.

Antes de que pegues o envíes un mensaje a un chat de IA, VeloPrompt detecta los datos sensibles y te ofrece cambiarlos por etiquetas como [CEDULA_1] o [NIF_1]. La IA trabaja con las etiquetas y, cuando responde, tú ves tus datos reales de nuevo, solo en tu pantalla.

CÓMO FUNCIONA
• Al pegar: si el texto tiene datos sensibles, aparece un aviso con los datos resaltados. Elige «Tapar todo», «Elegir» dato a dato o «Pegar igual».
• Al enviar: revisa también lo que escribiste a mano antes de que salga.
• En la respuesta: las etiquetas se cambian por tus datos reales, subrayados, con un botón para copiar la respuesta completa.
• El mismo dato recibe siempre la misma etiqueta durante la conversación.

QUÉ DETECTA
• Ecuador: cédula y RUC. España: DNI/NIF, NIE, CIF e IBAN. México: CURP, RFC y CLABE. Chile: RUT. Colombia: NIT y cédula. Perú: RUC y DNI. Argentina: CUIT/CUIL, CBU y DNI.
• En cualquier país: emails, teléfonos, tarjetas de crédito, IBAN, claves de API (OpenAI, Anthropic, AWS, GitHub, Slack) y contraseñas.
• Tus propios términos: nombres de clientes, proyectos o personas que quieras tapar siempre.
Los números se validan con su dígito o letra de control, para no confundirlos con pedidos, fechas o importes.

DÓNDE FUNCIONA
ChatGPT, Claude, Gemini, Copilot, Microsoft 365 Copilot, Perplexity y DeepSeek.

PRIVACIDAD DE VERDAD
• 100 % local: sin servidor, sin cuentas, sin analítica y sin ninguna petición de red.
• Las etiquetas y tus datos reales viven solo en la memoria de la pestaña y se borran al cerrarla.
• Solo pide acceso a los sitios de chat compatibles, nunca a «todos los sitios».

VeloPrompt reduce el riesgo, pero no reconoce nombres de personas, direcciones ni datos dentro de imágenes o archivos adjuntos. Revisa siempre lo que envías.

¿Lo quieres para todo tu equipo? zaisor.io/veloprompt
---

- **Categoría:** Productividad → Herramientas (si aparece «Privacidad y seguridad», mejor esa).
- **Idioma:** Español.
- **Icono de la tienda (128×128):** `apps/extension/public/icon/128.png`
- **Capturas (1280×800, en este orden):** `store/imagenes/1-detecta.png`, `2-elige.png`,
  `3-etiquetas.png`, `4-restaura.png`, `5-local.png`
- **Mosaico promocional pequeño (440×280):** `store/imagenes/mosaico-440x280.png`
- **Marquesina (1400×560, opcional):** `store/imagenes/marquesina-1400x560.png`
- **Sitio web oficial:** https://zaisor.io/veloprompt
- **URL de asistencia:** https://zaisor.io/contacto (o `mailto:hola@zaisor.io`)

## Pestaña «Prácticas de privacidad» / «Privacy practices»

**Finalidad única** (pega):
> Detectar datos personales y secretos en los mensajes que el usuario pega o envía en chats de IA, y sustituirlos por etiquetas antes de que salgan del navegador, mostrando de nuevo los valores reales en las respuestas solo en la pantalla del usuario.

**Justificación de `storage`:**
> Guarda en el navegador los ajustes del usuario (sitios activos, países y tipos de dato), su lista de términos propios y un contador semanal de datos tapados por tipo (solo números). Nada se sincroniza ni se envía.

**Justificación de los permisos de host** (chatgpt.com, claude.ai, gemini.google.com, copilot.microsoft.com, m365.cloud.microsoft, www.microsoft365.com, perplexity.ai, chat.deepseek.com):
> Son los chats de IA compatibles. La extensión necesita leer el texto del cuadro de mensaje en esas páginas para detectar datos sensibles al pegar o enviar, sustituirlos por etiquetas en el propio cuadro, y cambiar las etiquetas por los valores reales en las respuestas mostradas. En los dominios de Microsoft 365 solo actúa en el chat de Copilot. No se solicita acceso a ningún otro sitio.

**¿Usas código remoto?** → **No.** Todo el código está incluido en el paquete.

**Uso de datos — ¿qué datos de usuario recoges?** → **No marcar ninguno.**
VeloPrompt procesa el texto del chat en el propio dispositivo y no lo transmite ni lo almacena fuera
de la memoria de la pestaña. Si el revisor lo interpreta de otra forma, la opción más cercana sería
«Contenido del sitio web», siempre aclarando que no sale del dispositivo.

**Certificaciones** → marcar las tres:
- No vendo ni transfiero datos de usuario a terceros fuera de los casos de uso aprobados.
- No uso ni transfiero datos de usuario para fines no relacionados con la finalidad única.
- No uso ni transfiero datos de usuario para determinar solvencia ni conceder préstamos.

**URL de la política de privacidad:** https://zaisor.io/veloprompt/privacidad
(el texto está en `store/politica-privacidad.md`; tiene que estar publicado antes de enviar).

## Pestaña «Distribución»

- **Visibilidad:** Pública (o «No listada» para una primera fase de pruebas con enlace).
- **Regiones:** Todas.
- **Precio:** Gratis.
