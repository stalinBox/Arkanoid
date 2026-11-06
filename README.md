# Juego Arkanoid

Juego de Arkanoid para el navegador, desarrollado en JavaScript con canvas 2D (sin dependencias). El objetivo es destruir todos los bloques con una pelota que rebota en una paleta controlada por el jugador.

## Cómo jugar

Abrir `index.html` en el navegador (funciona por `file://`, no requiere servidor).

## Controles

- `←` `→`: mover la paleta
- `Espacio`: lanzar la bola; reiniciar tras ganar o perder

## Reglas

- 3 vidas. Si la bola cae por abajo se pierde una vida.
- Bloques `gray` = 3 golpes, `hotpink` = 2 golpes, el resto = 1 golpe.
- Al romper un bloque suma 10, 20 o 30 puntos según su dureza.
