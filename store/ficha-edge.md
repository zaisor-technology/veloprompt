# Ficha de VeloPrompt en Microsoft Edge Add-ons

Panel: https://partner.microsoft.com/dashboard/microsoftedge/overview (registro gratuito).
Se sube **el mismo ZIP** que en Chrome: `apps/extension/dist/veloprompt-extension-0.1.1-chrome.zip`.

## 1. Registro (solo la primera vez)

1. Entra en el panel con una cuenta Microsoft (puede ser la personal) y pulsa **Registrarse** en
   el programa de Microsoft Edge.
2. Tipo de cuenta: **Empresa** (*Company*).
   - Nombre del editor (*Publisher display name*): `Zaisor Technology LLC`
   - Email de contacto: `hola@zaisor.io`
   - Dirección: `1950 Olympus Ave, Hacienda Heights, CA 91745, Estados Unidos`
   - Teléfono: el de la empresa
3. Microsoft puede tardar unos días en verificar una cuenta de empresa. Mientras tanto ya se puede
   preparar la extensión.

## 2. Nueva extensión → Paquete

**Crear nueva extensión** → arrastra el ZIP → **Continuar**.

## 3. Disponibilidad (*Availability*)

- Visibilidad: **Pública** (*Public*)
- Mercados: **todos** (*All markets*)

## 4. Propiedades (*Properties*)

- Categoría: **Productividad** (*Productivity*)
- URL de la política de privacidad: `https://zaisor.io/veloprompt/privacidad`
- Sitio web: `https://zaisor.io/veloprompt`
- Contacto de soporte: `https://zaisor.io/contacto`
- Contenido para adultos: **No**

## 5. Ficha de la tienda (*Store listings*) → Español

- **Descripción:** la misma que en Chrome (`store/ficha-chrome-web-store.md`, desde «¿Pegas
  contratos, correos o tablas…» hasta «zaisor.io/veloprompt»).
- **Logo de la extensión** (*Extension Store logo*): `store/imagenes/logo-edge-300x300.png`
- **Mosaico promocional pequeño** (*Small promotional tile*, 440×280): `store/imagenes/promo-pequena-440x280.png`
- **Mosaico promocional grande** (*Large promotional tile*, 1400×560, opcional): `store/imagenes/promo-marquee-1400x560.jpg`
- **Capturas de pantalla** (1280×800, en este orden):
  `captura-1-1280x800.png`, `2-elige.png`, `3-etiquetas.png`, `4-restaura.png`, `5-local.png`
- **Términos de búsqueda** (*Search terms*, máximo 7, uno por casilla):
  1. `privacidad`
  2. `datos personales`
  3. `ChatGPT`
  4. `proteger datos IA`
  5. `anonimizar`
  6. `RGPD`
  7. `Copilot`

## 6. Enviar (*Publish*)

En **Notas para la certificación** (*Notes for certification*) pega:

```
La extensión funciona en local, no necesita cuenta ni hace peticiones de red. Para probarla:
1) abra https://chatgpt.com (o claude.ai); 2) pegue en el cuadro del chat: «Soy Ana, cédula
1710034065, NIF 12345678Z, correo ana@example.com»; 3) aparecerá el aviso de VeloPrompt con los
datos resaltados; pulse «Tapar todo» y el texto quedará con etiquetas como [CEDULA_1];
4) en la respuesta de la IA las etiquetas se muestran con los valores reales, subrayados.
Los datos de ejemplo son ficticios. Código fuente: https://github.com/zaisor-technology/veloprompt
```

Pulsa **Publicar**. Microsoft revisa en un plazo de hasta 7 días hábiles.

## Después de publicarla

Edge Add-ons asigna una dirección del tipo
`https://microsoftedge.microsoft.com/addons/detail/veloprompt/<id>`. Añádela al README, a
zaisor.io/veloprompt y a la release de GitHub.
