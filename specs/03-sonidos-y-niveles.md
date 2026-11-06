# SPEC 03 — Sonidos, mapas y dificultad

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-06
> **Objective:** Añadir sonidos de rebote y rotura sin mezclarse, 3 mapas progresivos y 3 dificultades elegibles al juego existente.

---

## Por qué existe esta spec

La spec 01 dejó fuera sonidos y múltiples niveles. Esta spec los cubre juntos por decisión explícita del usuario, aunque son dos áreas independientes. Los pasos del plan están ordenados para que cada área se pueda implementar y commitear por separado (sonidos primero).

---

## Scope

**In:**

- Reproducir `assets/sounds/ball-bounce.mp3` cuando la bola rebota en pared lateral o techo.
- Reproducir `assets/sounds/break-sound.mp3` cuando un bloque llega a `hp = 0` (se rompe).
- Un solo canal de audio: al iniciar un sonido se corta el que esté sonando; nunca hay dos audios a la vez.
- 3 mapas definidos como arrays de strings (`LEVELS`), 10 columnas, mismo formato que `LEVEL` de la spec 01.
- Progresión: al limpiar un mapa pasa al siguiente en estado `ready`; al limpiar el 3º → `won`.
- Puntos y vidas se conservan entre mapas.
- Velocidad de la bola +10 % por mapa sobre la base de la dificultad (mapa 1 = x1.0, mapa 2 = x1.1, mapa 3 = x1.2).
- 3 dificultades (`easy`, `normal`, `hard`) que cambian velocidad base de la bola, ancho de la paleta y vidas iniciales.
- Selector de dificultad con teclas `1` / `2` / `3` solo antes de la primera bola lanzada de la partida; `normal` por defecto.
- HUD muestra mapa actual (`Nivel 1/3`) y dificultad.
- Al reiniciar desde `won`/`lost` se conserva la última dificultad elegida (sin persistir entre sesiones).

**Out of scope (para futuras specs):**

- Sonido al golpear paleta, al golpear un bloque sin romperlo, al perder vida, ganar o perder.
- Música de fondo, control de volumen, botón de mute.
- Pantalla de menú o de selección de dificultad (fase `menu`).
- Cambiar la dificultad una vez lanzada la primera bola.
- Persistencia (`localStorage`) de dificultad, nivel o puntuación.
- Más de 3 mapas, editor de mapas, power-ups.
- Pantalla o mensaje de transición entre mapas (solo vuelve a `ready`).
- Pre-carga con Web Audio API o mezcla de varios canales.
- Tests automáticos.

---

## Data model

Scripts globales, igual que la spec 01. Se añade a `game.js` (no se toca `assets/spritesheet.js`).

```js
// Sonidos: un único canal compartido
const SOUNDS = {
  bounce: new Audio( 'assets/sounds/ball-bounce.mp3' ),
  break:  new Audio( 'assets/sounds/break-sound.mp3' ),
};
let currentSound = null;   // el que suena ahora, o null

// Mapas (mismo alfabeto que BLOCK_TYPES; '.' = vacío)
const LEVELS = [ /* 3 arrays de 7 strings de 10 chars */ ];

// Dificultades
const DIFFICULTIES = {
  easy:   { ballSpeed: 300, paddleW: 160, lives: 5 },
  normal: { ballSpeed: 360, paddleW: 120, lives: 3 },
  hard:   { ballSpeed: 440, paddleW: 90,  lives: 2 },
};
const LEVEL_SPEED_STEP = 0.10; // +10 % por mapa

// Campos nuevos en state
state.level      = 0;          // índice en LEVELS (0..2)
state.difficulty = 'normal';   // clave de DIFFICULTIES; sobrevive a resetGame
state.started    = false;      // true tras lanzar la primera bola; bloquea el selector
```

Conventions:

- `ball.speed` = `DIFFICULTIES[state.difficulty].ballSpeed * (1 + LEVEL_SPEED_STEP * state.level)`.
- `paddle.w` = `DIFFICULTIES[state.difficulty].paddleW`; reemplaza el `120` fijo de la spec 01.
- `state.lives` inicial = `DIFFICULTIES[state.difficulty].lives`.
- `LEVELS[0]` conserva el layout actual de `LEVEL` (7 filas, `g`→`v`) para que el primer mapa se vea igual que en la spec 01.
- `playSound( name )`: si `currentSound` existe, `pause()` y `currentTime = 0`; luego `currentSound = SOUNDS[name]`, `currentTime = 0`, `play()` con `.catch( () => {} )`.
- Si en el mismo frame hay rebote y rotura, suena el último que se invoque (el anterior se corta).

---

## Implementation plan

1. Añadir `SOUNDS`, `currentSound` y `playSound( name )` en `game.js`. Prueba: desde la consola, `playSound( 'bounce' )` suena y llamarla de nuevo en seguida corta y reinicia el audio.
2. En `stepBall`, llamar `playSound( 'bounce' )` en rebote contra paredes laterales y techo (no en suelo, paleta ni bloques). Prueba: la bola suena al tocar los tres bordes y es muda en la paleta.
3. En `collideBallBlocks`, llamar `playSound( 'break' )` cuando `hp` llega a 0. Prueba: gray suena solo en el 3er golpe, hotpink en el 2º, el resto en el 1º; los golpes que no rompen son mudos y nunca suenan dos audios a la vez.
4. Reemplazar `LEVEL` por `LEVELS` (3 mapas) y añadir `state.level`; `createBlocks( levelIndex )` construye desde `LEVELS[levelIndex]`. Prueba: con `LEVELS[0]` el juego se ve idéntico a la spec 01.
5. Progresión: al quedar sin bloques, si `state.level < LEVELS.length - 1` → `level++`, `createBlocks`, vaciar `explosions`, pegar la bola a la paleta, fase `ready`; si es el último → `won`. `resetGame` vuelve a `level = 0`. Prueba: limpiar el mapa 1 muestra el mapa 2 en `ready` con puntos y vidas intactos; limpiar el 3º muestra "¡Ganaste!".
6. Añadir `DIFFICULTIES`, `state.difficulty`, `state.started`; aplicar `ballSpeed`, `paddleW` y `lives` en `resetGame` y en el estado inicial. Calcular `ball.speed` con el factor de mapa en cada cambio de mapa y en `onSpace` al lanzar. Prueba: cambiar `state.difficulty` en consola y reiniciar da valores distintos de velocidad, paleta y vidas.
7. Teclas `1` / `2` / `3` en `ready` con `state.started === false`: fijan la dificultad y aplican paleta y vidas al instante. `onSpace` pone `started = true` al lanzar. `resetGame` pone `started = false` y conserva `difficulty`. Prueba: `1` agranda la paleta y da 5 vidas; tras lanzar, las teclas no hacen nada.
8. HUD: dibujar `Nivel N/3` y el nombre de la dificultad junto a puntuación y vidas. Prueba: el HUD cambia al elegir dificultad y al pasar de mapa.

---

## Acceptance criteria

- [X] Abrir `index.html` (file://) carga sin errores en la consola.
- [X] Al rebotar la bola en pared izquierda, derecha o techo suena `ball-bounce.mp3`.
- [X] Al golpear la paleta, o un bloque sin romperlo, no suena nada.
- [X] Al romper un bloque suena `break-sound.mp3`.
- [X] Si un sonido está sonando y se dispara otro, el primero se detiene y solo se oye el nuevo.
- [X] Un mismo sonido disparado dos veces seguidas se reinicia (no se superponen copias).
- [X] Un fallo de `play()` (autoplay bloqueado) no genera error no capturado en la consola.
- [X] El mapa 1 se ve igual que el nivel de la spec 01 (70 bloques).
- [X] Hay 3 mapas distintos entre sí y cada uno tiene 10 columnas.
- [X] Al limpiar el mapa 1 o 2, aparece el siguiente mapa en `ready` con la bola pegada a la paleta, y puntos y vidas sin cambio.
- [X] Al limpiar el mapa 3 aparece "¡Ganaste!" y `Espacio` reinicia en el mapa 1.
- [X] La velocidad de la bola es x1.0, x1.1 y x1.2 de la base en los mapas 1, 2 y 3.
- [X] En `normal` (por defecto): bola 360 px/s, paleta 120 px, 3 vidas en el mapa 1.
- [X] En `easy`: bola 300 px/s, paleta 160 px, 5 vidas. En `hard`: 440 px/s, 90 px, 2 vidas.
- [X] Las teclas `1` / `2` / `3` cambian la dificultad en `ready` antes de la primera bola lanzada.
- [X] Tras lanzar la primera bola, las teclas `1` / `2` / `3` no cambian la dificultad.
- [X] Tras `won` o `lost`, `Espacio` reinicia en el mapa 1 con la última dificultad elegida.
- [X] El HUD muestra `Nivel N/3` y la dificultad, y se actualiza al cambiar.
- [X] `assets/spritesheet.js` queda sin modificar.

---

## Decisions

- **Sí:** una sola spec para sonidos y niveles. Decisión del usuario, pese a la recomendación de dividirla; el plan separa ambas áreas por pasos.
- **Sí:** un único canal (`currentSound`) donde el nuevo corta al anterior. Garantiza «los sonidos no deben mezclarse» de forma literal.
- **No:** que el sonido en curso bloquee al nuevo. Se perderían sonidos de rotura.
- **No:** reiniciar solo el mismo sonido permitiendo simultaneidad. Los dos efectos se oirían a la vez.
- **Sí:** `Audio` nativo con `play().catch()`. Funciona por `file://` sin servidor y sin dependencias.
- **No:** Web Audio API. Exige decodificar buffers con `fetch`, que falla por `file://`.
- **Sí:** `ball-bounce` en laterales y techo; mudo en paleta y bloques. Es el sentido literal de «únicamente cuando toque las paredes».
- **Sí:** 3 mapas con victoria al terminar el 3º. Alcance acotado y suficiente para probar la progresión.
- **No:** bucle infinito de mapas. Rompe el estado `won` de la spec 01.
- **Sí:** puntos y vidas se conservan entre mapas. Es una sola partida con varios mapas.
- **Sí:** selector `1`/`2`/`3` en `ready` inicial, sin fase nueva. Respeta que menús quedan fuera desde la spec 01.
- **No:** fase `menu`. Más UI y estado para poco valor.
- **Sí:** dificultad cambia velocidad, paleta y vidas. Tres palancas independientes y fáciles de percibir.
- **Sí:** +10 % de velocidad por mapa. Sube la dificultad sin crear lógica nueva.
- **Sí:** dificultad fija tras lanzar la primera bola. Evita cambiar vidas o paleta a mitad de partida.
- **Sí:** se conserva la última dificultad al reiniciar. Evita reelegirla en cada partida; sin persistencia entre sesiones.
- **Sí (por defecto, no discutido):** valores de `DIFFICULTIES` y diseño de los 3 mapas. Ajustables en implementación si la jugabilidad lo pide.

---

## Risks

| Risk                                                                                  | Mitigation                                                                                           |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| El navegador bloquea `play()` hasta que haya un gesto del usuario.                    | El primer sonido llega tras `Espacio` (gesto válido); `play().catch( () => {} )` evita errores.      |
| Rebote y rotura en el mismo frame: el rebote se corta y casi no se oye.               | Aceptado: es el comportamiento pedido (un solo canal, el último gana).                               |
| Latencia de arranque del `mp3` en el primer disparo.                                  | Aceptado: `Audio` precarga con `preload = 'auto'`; no se usa Web Audio por `file://`.                |
| Paleta de 160 px o 90 px rompe supuestos con el `120` fijo de la spec 01.             | Plan paso 6 reemplaza todos los usos del `120` por `paddle.w` (inicio, `ready`, colisión, límites).  |
| Velocidad x1.2 en `hard` (528 px/s) provoca efecto túnel.                             | Spec 01 ya limita `dt` a 50 ms y usa sub-pasos si el desplazamiento supera el radio.                 |
| Mapas con bloques `gray` y `hotpink` en exceso vuelven un mapa injugable en `hard`.   | Diseñar los mapas 2 y 3 con filas mixtas; el usuario revisa los layouts al aprobar la implementación. |

---

## What is **not** in this spec

- Sonidos de paleta, golpe sin rotura, pérdida de vida, victoria o derrota.
- Música, volumen y mute.
- Pantalla de menú o selección de dificultad.
- Cambio de dificultad en mitad de la partida.
- Persistencia de cualquier tipo.
- Más de 3 mapas, editor de mapas, power-ups.
- Pantalla de transición entre mapas.
- Web Audio API y varios canales de audio.
- Tests automáticos.

Cada uno, si se hace, va en su propia spec.
