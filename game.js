const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

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

const PADDLE_Y = 600;

function createBlocks() {
  const blocks = [];
  LEVEL.forEach( ( rowStr, row ) => {
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
  blocks: createBlocks(),
  explosions: [],        // { x, y, color, t } — t = ms transcurridos
};

function draw() {
  ctx.fillStyle = '#1b1b2f';
  ctx.fillRect( 0, 0, CANVAS.w, CANVAS.h );

  for ( const b of state.blocks ) {
    drawSprite( ctx, 'block_' + b.color, b.col * BLOCK.w, BLOCK.top + b.row * BLOCK.h, BLOCK.w, BLOCK.h );
  }

  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );
}

loadSpritesheet( draw );
