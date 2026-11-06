const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const CANVAS = { w: 640, h: 640 };
const BLOCK = { w: 64, h: 32, cols: 10, top: 64 }; // sprite 32x16 escalado x2

// 3 mapas de 7 filas x 10 cols; '.' = vacío
// g=gray(3) h=hotpink(2) r=red y=yellow c=cyan m=magenta v=green (1 golpe)
const LEVELS = [
  [                      // mapa 1: franjas completas (igual que spec 01)
    "gggggggggg",
    "hhhhhhhhhh",
    "rrrrrrrrrr",
    "yyyyyyyyyy",
    "cccccccccc",
    "mmmmmmmmmm",
    "vvvvvvvvvv",
  ],
  [                      // mapa 2: pirámide
    "....gg....",
    "...hhhh...",
    "..rrrrrr..",
    ".yyyyyyyy.",
    "cccccccccc",
    ".mmmmmmmm.",
    "..vvvvvv..",
  ],
  [                      // mapa 3: filas mixtas con huecos
    "gggggggggg",
    "hghghghghg",
    "r.r.r.r.r.",
    ".y.y.y.y.y",
    "cmcmcmcmcm",
    "hhhhhhhhhh",
    "g.g.g.g.g.",
  ],
];

const BLOCK_TYPES = {    // letra -> sprite y dureza
  g: { color: "gray", hp: 3 },   h: { color: "hotpink", hp: 2 },
  r: { color: "red", hp: 1 },    y: { color: "yellow", hp: 1 },
  c: { color: "cyan", hp: 1 },   m: { color: "magenta", hp: 1 },
  v: { color: "green", hp: 1 },
};

const PADDLE_Y = 600;

// Sonidos: un único canal compartido; el sonido nuevo corta al que esté sonando
const SOUNDS = {
  bounce: new Audio( 'assets/sounds/ball-bounce.mp3' ),
  break:  new Audio( 'assets/sounds/break-sound.mp3' ),
};
for ( const s of Object.values( SOUNDS ) ) s.preload = 'auto';
let currentSound = null; // el que suena ahora, o null

function playSound( name ) {
  if ( currentSound ) { currentSound.pause(); currentSound.currentTime = 0; }
  currentSound = SOUNDS[ name ];
  currentSound.currentTime = 0;
  currentSound.play().catch( () => {} ); // autoplay bloqueado: se ignora
}

function createBlocks( levelIndex ) {
  const blocks = [];
  LEVELS[ levelIndex ].forEach( ( rowStr, row ) => {
    [ ...rowStr ].forEach( ( ch, col ) => {
      const type = BLOCK_TYPES[ ch ];
      if ( type ) blocks.push( { col, row, color: type.color, hp: type.hp, maxHp: type.hp } );
    } );
  } );
  return blocks;
}

const state = {
  phase: "ready",        // "ready" | "playing" | "won" | "lost"
  score: 0,
  lives: 3,
  paddle: { x: ( CANVAS.w - 120 ) / 2, y: PADDLE_Y, w: 120, h: 14, speed: 480 },
  ball: { x: CANVAS.w / 2, y: PADDLE_Y - 8, r: 8, vx: 0, vy: 0, speed: 360 },
  level: 0,              // índice en LEVELS (0..2)
  blocks: createBlocks( 0 ),
  explosions: [],        // { x, y, color, t } — t = ms transcurridos
};

function draw() {
  ctx.fillStyle = '#1b1b2f';
  ctx.fillRect( 0, 0, CANVAS.w, CANVAS.h );

  for ( const b of state.blocks ) {
    drawSprite( ctx, 'block_' + b.color, b.col * BLOCK.w, BLOCK.top + b.row * BLOCK.h, BLOCK.w, BLOCK.h );
  }

  for ( const e of state.explosions ) {
    const frames = EXPLOSION_FRAMES[ e.color ];
    const i = Math.min( frames.length - 1, Math.floor( e.t / EXPLOSION_DURATION * frames.length ) );
    if ( e.color === 'gray' ) ctx.filter = 'grayscale(1)';
    drawFrame( ctx, frames[ i ], e.x, e.y, BLOCK.w, BLOCK.h );
    if ( e.color === 'gray' ) ctx.filter = 'none';
  }

  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );

  const b = state.ball;
  drawSprite( ctx, 'ball', b.x - b.r, b.y - b.r, b.r * 2, b.r * 2 );

  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText( 'Puntos: ' + state.score, 16, 32 );
  ctx.textAlign = 'right';
  ctx.fillText( 'Vidas: ' + state.lives, CANVAS.w - 16, 32 );

  if ( state.phase === 'lost' || state.phase === 'won' ) {
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillText( state.phase === 'won' ? '¡Ganaste!' : 'Game Over', CANVAS.w / 2, CANVAS.h / 2 );
  }
}

const keys = { left: false, right: false };

function setKey( e, down ) {
  if ( e.code === 'ArrowLeft' ) keys.left = down;
  else if ( e.code === 'ArrowRight' ) keys.right = down;
  else if ( e.code === 'Space' ) { if ( down && !e.repeat ) onSpace(); }
  else return;
  e.preventDefault();
}
window.addEventListener( 'keydown', e => setKey( e, true ) );
window.addEventListener( 'keyup', e => setKey( e, false ) );

function onSpace() {
  if ( state.phase === 'ready' ) {
    state.phase = 'playing';
    state.ball.vx = 0;
    state.ball.vy = -state.ball.speed;
  } else if ( state.phase === 'won' || state.phase === 'lost' ) {
    resetGame();
  }
}

function resetGame() {
  state.phase = 'ready';
  state.score = 0;
  state.lives = 3;
  state.paddle.x = ( CANVAS.w - state.paddle.w ) / 2;
  state.ball.vx = state.ball.vy = 0;
  state.blocks = createBlocks( state.level );
  state.explosions = [];
}

function stickBallToPaddle() {
  const p = state.paddle, b = state.ball;
  b.x = p.x + p.w / 2;
  b.y = p.y - b.r;
}

function update( dt ) {
  const p = state.paddle, b = state.ball;
  const dir = ( keys.right ? 1 : 0 ) - ( keys.left ? 1 : 0 );
  p.x = Math.max( 0, Math.min( CANVAS.w - p.w, p.x + dir * p.speed * dt ) );

  for ( const e of state.explosions ) e.t += dt * 1000;
  state.explosions = state.explosions.filter( e => e.t < EXPLOSION_DURATION );

  if ( state.phase === 'ready' ) {
    stickBallToPaddle();
  } else if ( state.phase === 'playing' ) {
    // sub-pasos: el desplazamiento por paso nunca supera el radio (evita efecto túnel)
    const steps = Math.ceil( b.speed * dt / b.r );
    for ( let i = 0; i < steps && state.phase === 'playing'; i++ ) stepBall( dt / steps );
  }
}

function stepBall( dt ) {
  const b = state.ball;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if ( b.x - b.r < 0 ) { b.x = b.r; b.vx = Math.abs( b.vx ); playSound( 'bounce' ); }
  else if ( b.x + b.r > CANVAS.w ) { b.x = CANVAS.w - b.r; b.vx = -Math.abs( b.vx ); playSound( 'bounce' ); }
  if ( b.y - b.r < 0 ) { b.y = b.r; b.vy = Math.abs( b.vy ); playSound( 'bounce' ); }
  collideBallPaddle();
  collideBallBlocks();
  if ( b.y - b.r > CANVAS.h ) loseLife();
}

function loseLife() {
  state.lives--;
  state.phase = state.lives > 0 ? 'ready' : 'lost';
  state.ball.vx = state.ball.vy = 0;
}

function collideBallBlocks() {
  const b = state.ball;
  for ( let i = 0; i < state.blocks.length; i++ ) {
    const k = state.blocks[ i ];
    const bx = k.col * BLOCK.w, by = BLOCK.top + k.row * BLOCK.h;
    const cx = Math.max( bx, Math.min( b.x, bx + BLOCK.w ) );
    const cy = Math.max( by, Math.min( b.y, by + BLOCK.h ) );
    if ( ( b.x - cx ) ** 2 + ( b.y - cy ) ** 2 >= b.r * b.r ) continue;

    // penetración por cada lado; rebota en el eje de menor penetración
    const fromLeft = b.x + b.r - bx, fromRight = bx + BLOCK.w - ( b.x - b.r );
    const fromTop = b.y + b.r - by, fromBottom = by + BLOCK.h - ( b.y - b.r );
    const min = Math.min( fromLeft, fromRight, fromTop, fromBottom );
    if ( min === fromLeft ) { b.x -= fromLeft; b.vx = -Math.abs( b.vx ); }
    else if ( min === fromRight ) { b.x += fromRight; b.vx = Math.abs( b.vx ); }
    else if ( min === fromTop ) { b.y -= fromTop; b.vy = -Math.abs( b.vy ); }
    else { b.y += fromBottom; b.vy = Math.abs( b.vy ); }

    if ( --k.hp <= 0 ) {
      playSound( 'break' );
      state.score += k.maxHp * 10;
      state.explosions.push( { x: bx, y: by, color: k.color, t: 0 } );
      state.blocks.splice( i, 1 );
      if ( state.blocks.length === 0 ) state.phase = 'won';
    }
    return; // un bloque por sub-paso
  }
}

const MAX_BOUNCE_ANGLE = 60 * Math.PI / 180; // respecto a la vertical

function collideBallPaddle() {
  const p = state.paddle, b = state.ball;
  if ( b.vy <= 0 ) return;
  const hit = b.y + b.r >= p.y && b.y - b.r <= p.y + p.h
    && b.x >= p.x - b.r && b.x <= p.x + p.w + b.r;
  if ( !hit ) return;
  const offset = Math.max( -1, Math.min( 1, ( b.x - ( p.x + p.w / 2 ) ) / ( p.w / 2 ) ) );
  const angle = offset * MAX_BOUNCE_ANGLE;
  b.vx = b.speed * Math.sin( angle );
  b.vy = -b.speed * Math.cos( angle );
  b.y = p.y - b.r;
}

let lastTime = null;
function frame( now ) {
  if ( lastTime !== null ) update( Math.min( ( now - lastTime ) / 1000, 0.05 ) ); // dt en s, tope 50 ms
  lastTime = now;
  draw();
  requestAnimationFrame( frame );
}

loadSpritesheet( () => requestAnimationFrame( frame ) );
