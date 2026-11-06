# SPEC 02 — Explosión gris para bloques gray

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-11-06
> **Objective:** Que el bloque `gray` explote con frames en escala de grises en lugar de frames rojos.

---

## Por qué existe esta spec

La spec 01 ya implementa la destrucción de bloques y la animación de 4 frames (`EXPLOSION_FRAMES`, `EXPLOSION_DURATION`). Pero `EXPLOSION_FRAMES.gray` apunta a las mismas coordenadas que `red` (fila `y=176`) y el sheet no tiene frames de explosión grises. Spec 01 aceptó ese defecto como riesgo; esta spec lo corrige.

---

## Scope

**In:**

- Dibujar los frames de explosión de `gray` con `ctx.filter = 'grayscale(1)'` sobre los frames rojos existentes.
- El cambio vive solo en `draw()` de `game.js`.
- Restaurar `ctx.filter` a `'none'` tras dibujar cada explosión gray.

**Out of scope (para futuras specs):**

- Cambiar `assets/spritesheet.js` o `EXPLOSION_FRAMES`.
- Revisar o retocar la explosión de los otros 6 colores (ya tienen frames propios).
- Efectos nuevos (partículas, fade, shake, duración distinta).
- Sprites de daño para bloques multi-golpe.
- Fallback para navegadores sin soporte de `ctx.filter`.
- Pre-renderizar frames con `getImageData`.

---

## Data model

Esta feature no introduce estructuras de datos nuevas. Reutiliza `state.explosions` (`{ x, y, color, t }`) de la spec 01; `color === 'gray'` selecciona el filtro.

---

## Implementation plan

1. En `draw()` de `game.js`, dentro del bucle de `state.explosions`: si `e.color === 'gray'`, asignar `ctx.filter = 'grayscale(1)'` antes de `drawFrame` y `ctx.filter = 'none'` después. Prueba: romper un bloque gray (3 golpes) muestra una explosión de 4 frames gris; romper uno red/cyan sigue mostrando su color.

---

## Acceptance criteria

- [X] Al romper un bloque `gray` la explosión se ve en escala de grises, sin tonos rojos.
- [X] La explosión gray mantiene 4 frames y ~150 ms.
- [X] Las explosiones de los otros 6 colores no cambian.
- [X] Tras una explosión gray, paleta, bola, bloques y HUD se dibujan sin filtro.
- [X] `assets/spritesheet.js` queda sin modificar.
- [X] No hay errores en la consola.

---

## Decisions

- **Sí:** `ctx.filter = 'grayscale(1)'` sobre los frames rojos. No requiere assets nuevos ni lectura de píxeles.
- **No:** pre-renderizar con `getImageData`. Puede contaminar el canvas por `file://`; spec 01 lo evitó.
- **No:** apuntar `gray` a frames de otro color. Seguiría sin verse gris.
- **Sí:** cambio solo en `game.js`. `spritesheet.js` es el helper de assets y no se toca.
- **Sí:** solo `gray`. Los otros colores tienen frames correctos.
- **Sí:** sin fallback. Si `ctx.filter` no existe (Safari antiguo), la explosión se ve roja; es aceptable.

---

## Risks

| Risk                                                       | Mitigation                                                                  |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `ctx.filter` no soportado en Safari antiguo.               | Aceptado: degrada a explosión roja, como en spec 01.                        |
| Olvidar restaurar `ctx.filter` y filtrar el resto del frame. | Restaurar `'none'` justo tras `drawFrame`; criterio de aceptación lo verifica. |

---

## What is **not** in this spec

- Cambios en `assets/spritesheet.js`.
- Otros colores o efectos nuevos.
- Fallback para `ctx.filter`.
- Daño visible en bloques multi-golpe.

Cada uno, si se hace, va en su propia spec.
