# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Aprobado
> **Depends on:** ninguna
> **Date:** 2026-11-06
> **Objective:** Un juego de Arkanoid jugable en el navegador (JS + canvas) con un nivel fijo, vidas, puntuación, bloques multi-golpe y animación de explosión.

---

## Por qué existe esta spec

`README.md` dice Python + Pygame, pero `assets/spritesheet.js` es JavaScript de navegador. Se decidió **JS + canvas** para reutilizar el sprite sheet tal cual y no tener dependencias. El README debe corregirse como parte de esta spec.

---

## Scope

**In:**

- Página `index.html` en la raíz del repo (el path `assets/spritesheet-breakout.png` es relativo a la página).
- Canvas 640x640 con bucle de juego (`requestAnimationFrame`, movimiento en px/s con `dt`).
- Paleta controlada con teclado: `←` `→` mueven, `Espacio` lanza la bola.
- Una bola con rebote en paredes, techo, paleta y bloques.
- Ángulo de rebote en la paleta según el punto de impacto (máx. 60° respecto a la vertical).
- Un nivel fijo definido como array de strings (`LEVEL`), 10 columnas x 7 filas.
- Bloques multi-golpe: `gray` = 3 golpes, `hotpink` = 2 golpes, resto = 1 golpe.
- Puntuación: 10 puntos por golpe de bloque de 1 golpe, 20 por bloque de 2, 30 por bloque de 3 (se suman al romper el bloque).
- Animación de explosión (`EXPLOSION_FRAMES`, `EXPLOSION_DURATION`) al romper un bloque.
- 3 vidas, HUD con puntuación y vidas.
- Estados `ready`, `playing`, `won`, `lost`; `Espacio` reinicia desde `won`/`lost`.
- Corregir `README.md` (stack JS + canvas, cómo abrir el juego).

**Out of scope (para futuras specs):**

- Sonidos (`assets/sounds/` queda sin usar).
- Múltiples niveles y progresión.
- Power-ups.
- Control con mouse o touch.
- High scores y persistencia.
- Menú, pausa, pantalla de título.
- Sprites de daño para bloques multi-golpe (el bloque conserva su color hasta romperse).
- Tests automáticos.

---

## Data model

Scripts globales (no módulos), igual que `spritesheet.js`. Origen en esquina superior izquierda; píxeles; velocidades en px/s.

```js
// game.js
const CANVAS = { w: 640, h: 640 };
const BLOCK = { w: 64, h: 32, cols: 10, top: 64 }; // sprite 32x16 escalado x2

const LEVEL = [          // 7 filas x 10 cols; '.' = vacío
  "gggggggggg",          // g=gray(3) h=hotpink(2) r=red y=yellow
  "hhhhhhhhhh",          // c=cyan m=magenta v=green (1 golpe)
  "rrrrrrrrrr",
  "yyyyyyyyyy",
  "cccccccccc",
  "mmmmmmmmmm",
  "vvvvvvvvvv",
];

const BLOCK_TYPES = {    // letra -> sprite y dureza
  g: { color: "gray", hp: 3 },   h: { color: "hotpink", hp: 2 },
  r: { color: "red", hp: 1 },    y: { color: "yellow", hp: 1 },
  c: { color: "cyan", hp: 1 },   m: { color: "magenta", hp: 1 },
  v: { color: "green", hp: 1 },
};

const state = {
  phase: "ready",        // "ready" | "playing" | "won" | "lost"
  score: 0,
  lives: 3,
  paddle: { x, y, w: 120, h: 14, speed: 480 },
  ball: { x, y, r: 8, vx, vy, speed: 360 },  // sprite 16x16, sin escalar
  blocks: [/* { col, row, color, hp, maxHp } */],
  explosions: [/* { x, y, color, t } */],    // t = ms transcurridos
};
```

Convenciones:

- En `ready` la bola va pegada al centro de la paleta y la sigue.
- `score` por bloque roto = `maxHp * 10`.
- Una explosión se elimina cuando `t >= EXPLOSION_DURATION`; el frame se elige por `t` (4 frames).

---

## Implementation plan

1. Crear `index.html` (canvas 640x640, carga `assets/spritesheet.js`, `game.js`, `style.css`) y `style.css` (canvas centrado, fondo oscuro). `game.js` vacío salvo `loadSpritesheet` y fondo. Prueba: abrir `index.html`, se ve canvas sin errores en consola.
2. En `game.js`: constantes, `state` inicial y construcción de `blocks` desde `LEVEL`. Dibujar bloques y paleta con `drawSprite`. Prueba: se ve el nivel completo de 70 bloques y la paleta.
3. Bucle con `dt` e input de teclado: la paleta se mueve con `←` `→` y se limita a los bordes. Prueba: mover la paleta sin salirse del canvas.
4. Bola en `ready` pegada a la paleta; `Espacio` pasa a `playing` y lanza hacia arriba. Rebote en paredes y techo. Prueba: la bola rebota en tres bordes.
5. Colisión bola-paleta con ángulo según punto de impacto. Prueba: impacto al centro sube recto, en los extremos sale a ~60°.
6. Colisión bola-bloque: reduce `hp`, invierte `vx` o `vy` según el eje de menor penetración, elimina el bloque en `hp = 0` y suma puntos. Prueba: gray requiere 3 golpes, hotpink 2, resto 1.
7. Animación de explosión al romper bloque. Prueba: cada bloque roto muestra 4 frames en ~150 ms.
8. Vidas y HUD: bola cae por abajo → `lives--`, vuelve a `ready`; en 0 → `lost`. Dibujar puntuación y vidas. Prueba: perder 3 veces muestra "Game Over".
9. Victoria y reinicio: sin bloques → `won`; `Espacio` en `won`/`lost` restablece `state`. Prueba: ciclo completo repetible sin recargar.
10. Actualizar `README.md` (stack JS + canvas, abrir `index.html`, controles) y la nota de stack en `CLAUDE.md`.

---

## Acceptance criteria

- [ ] Abrir `index.html` (file://) carga el juego sin errores en la consola.
- [ ] El nivel muestra 70 bloques en 7 filas x 10 columnas, con los colores definidos en `LEVEL`.
- [ ] `←` y `→` mueven la paleta y esta no sale del canvas.
- [ ] En `ready` la bola sigue a la paleta y `Espacio` la lanza.
- [ ] La bola rebota en paredes laterales y techo.
- [ ] Un impacto al centro de la paleta envía la bola en vertical; en los extremos sale a 60° respecto a la vertical (±5°).
- [ ] Un bloque `gray` desaparece al tercer golpe, uno `hotpink` al segundo y los demás al primero.
- [ ] Romper un bloque suma `maxHp * 10` puntos (30, 20 o 10) y el HUD se actualiza.
- [ ] Al romper un bloque se reproduce una animación de 4 frames de ~150 ms en su posición.
- [ ] Si la bola cae por abajo, las vidas bajan en 1 y la bola vuelve a `ready`.
- [ ] Con 0 vidas aparece "Game Over" y `Espacio` reinicia puntuación, vidas y bloques.
- [ ] Al destruir los 70 bloques aparece "¡Ganaste!" y `Espacio` reinicia.
- [ ] La velocidad de la bola es la misma a 60 Hz y a 144 Hz (movimiento por `dt`).
- [ ] `README.md` describe JS + canvas y cómo abrir el juego.

---

## Decisions

- **Sí:** JS + canvas. Reutiliza `spritesheet.js` y no exige dependencias; se corrige el README en lugar de reescribir los assets.
- **No:** Python + Pygame. Obligaría a reescribir el manejo del sprite sheet.
- **Sí:** scripts globales y `index.html` + `game.js` + `style.css`. Coincide con `spritesheet.js` y funciona por `file://` sin servidor.
- **No:** ES modules. Exigen servidor local y chocan con el estilo global del sprite sheet.
- **Sí:** movimiento en px/s con `dt`. Evita que la velocidad dependa de la tasa de refresco.
- **Sí:** nivel como array de strings. Editable a mano; base para niveles múltiples en otra spec.
- **Sí:** dureza por color (`gray` 3, `hotpink` 2) sin sprites de daño. No hay sprites de daño en el sheet.
- **Sí:** verificación manual con checklist. No hay tooling de tests y el MVP es pequeño.
- **No:** sonidos en este MVP, aunque existen los mp3. Decisión explícita del usuario; va en otra spec.
- **No:** mouse. Un solo esquema de control mantiene el MVP simple.
- **Sí (por defecto, no discutido):** canvas 640x640, bloques a escala x2 (64x32), paleta de 120 px (el sprite nativo es 162x14), bola 16x16 a 360 px/s. Ajustables en implementación si la jugabilidad lo pide.

---

## Risks

| Risk                                                                              | Mitigation                                                                                     |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `EXPLOSION_FRAMES.gray` usa las mismas coordenadas que `red` (fila y=176).        | Aceptado: el bloque gray explota con frames rojos. Corregir el sheet queda fuera de esta spec. |
| Bola atraviesa bloques o paleta a `dt` grande (efecto túnel).                     | Limitar `dt` a 50 ms y mover la bola en sub-pasos si el desplazamiento supera su radio.        |
| La bola se queda en bucle horizontal casi perfecto (`vy` ≈ 0) tras rebotes.       | El ángulo en la paleta está limitado a 60° de la vertical, así `vy` nunca es ≈ 0 al salir.     |
| Cargar por `file://` puede bloquear la imagen en algunos navegadores con canvas.  | Solo se dibuja (no se lee con `getImageData`), así que no hay canvas contaminado.              |

---

## What is **not** in this spec

- Sonidos.
- Varios niveles.
- Power-ups.
- Mouse o touch.
- High scores y persistencia.
- Menú, pausa, pantalla de título.
- Sprites de daño en bloques multi-golpe.
- Tests automáticos.

Cada uno, si se hace, va en su propia spec.
