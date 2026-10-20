# Publicar VeloPrompt en la Chrome Web Store y en Edge

Todo el material está en esta carpeta. La subida y el pago los hace una persona de Zaisor:
nada se publica automáticamente.

| Archivo | Para qué |
| --- | --- |
| `ficha-chrome-web-store.md` | Todos los campos de la ficha, listos para copiar y pegar |
| `politica-privacidad.md` | Política de privacidad (ES + EN) para publicar en zaisor.io/veloprompt/privacidad |
| `imagenes/1-…5-*.png` | 5 capturas de 1280×800 |
| `imagenes/mosaico-440x280.png` | Mosaico promocional pequeño |
| `imagenes/marquesina-1400x560.png` | Marquesina (opcional) |
| `imagenes/logo-300x300.png` | Logo para la tienda de Edge |
| `../apps/extension/dist/veloprompt-extension-1.0.0-chrome.zip` | Paquete (no se sube a git; ver paso 1) |

## Antes de empezar (bloqueante)

- [ ] **Publicar la política de privacidad** en `https://zaisor.io/veloprompt/privacidad`. Sin una URL
      pública, Google rechaza la ficha.
- [ ] **Página `https://zaisor.io/veloprompt`** (aunque sea sencilla): la ficha y la extensión enlazan a ella.
- [ ] Probar el ZIP final una vez: `chrome://extensions` → Cargar descomprimida → `apps/extension/dist/chrome-mv3`.

## 1. Generar el paquete

```bash
cd ~/Documents/PROYECTOS/veloprompt
pnpm install
pnpm --filter veloprompt-extension zip
# → apps/extension/dist/veloprompt-extension-1.0.0-chrome.zip
```

Para regenerar las imágenes: `pnpm --filter veloprompt-extension store:images`.

## 2. Chrome Web Store

1. **Cuenta de desarrollador** (una sola vez): entra en https://chrome.google.com/webstore/devconsole
   con la cuenta de Google de la empresa, acepta el acuerdo y paga la **cuota única de 5 USD**.
   - Recomendado: crear un *grupo de editores* o usar una cuenta de Google de Zaisor (no personal),
     para que la extensión no dependa de una sola persona.
   - En **Configuración de la cuenta**: nombre de editor **Zaisor Technology LLC**, email de contacto
     **hola@zaisor.io** (hay que verificarlo) y, si lo pide, la dirección postal.
2. **Nuevo elemento** → sube el ZIP.
3. Rellena las pestañas **Ficha**, **Prácticas de privacidad** y **Distribución** con
   `ficha-chrome-web-store.md`.
4. **Enviar para revisión.** Suele tardar de 1 a 3 días. Los permisos de host (acceso a webs de
   chat) hacen que la revisión sea más detallada; las justificaciones de la ficha están escritas para eso.
5. Consejo: la primera vez publícala como **No listada**, compártela con unas pocas personas y,
   cuando todo vaya bien, cámbiala a **Pública**.

## 3. Microsoft Edge Add-ons (gratis)

1. Regístrate en **Partner Center** como desarrollador de Microsoft Edge
   (https://partner.microsoft.com/dashboard/microsoftedge/overview). No tiene coste.
2. **Crear nueva extensión** → sube **el mismo ZIP**.
3. Propiedades: categoría *Productividad*, URL de privacidad y de sitio web como en Chrome.
4. Ficha en español: descripción (la misma), logo `imagenes/logo-300x300.png`, capturas 1280×800,
   mosaico 440×280.
5. En «Notas para la certificación» pega:
   > La extensión funciona en local, no hace peticiones de red. Para probarla, abra chatgpt.com, pegue
   > «Soy Ana, NIF 12345678Z, correo ana@example.com» en el chat y verá el aviso de VeloPrompt.
6. **Publicar.** La revisión de Edge tarda hasta 7 días hábiles.

## 4. Actualizaciones

1. Sube la versión en `apps/extension/package.json` (por ejemplo, 1.0.1).
2. `pnpm --filter veloprompt-extension zip`.
3. En cada tienda: **Paquete → Subir nuevo paquete** → enviar a revisión.

## Pendiente de decidir

- **Código abierto:** la ficha no dice «de código abierto» mientras el repositorio sea privado. Si
  se hace público, se puede añadir a la descripción y a la marquesina, con el enlace a GitHub.
- **Ficha en inglés:** se puede añadir más adelante, junto con la traducción de la extensión.
