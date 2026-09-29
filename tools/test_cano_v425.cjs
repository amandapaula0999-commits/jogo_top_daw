process.env.BUNKER_SKIP_TESTS='1';
process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const {world,sprites}=require('./test_collisions.cjs');
const {run,refs}=require('./test_regressions.cjs');
const assert=require('node:assert/strict');
let count=0;
function test(n,f){f();count++;console.log('OK:',n);}
const names=['direita','cima','esquerda','baixo'];
function setup(dir){
 const c=world();c.id=c;run(c,'objects/Obj_cano/Create_0.gml');
 c.dono=c.player;Object.assign(c.player,{x:150,y:170,depth:0});
 c.global.equipamento_ativo='cano';c.mouse_x=150+c.lengthdir_x(200,dir*90);
 c.mouse_y=170-12*c.escala_ataque+c.lengthdir_y(200,dir*90);
 run(c,'objects/Obj_cano/Step_0.gml');return c;
}
function step(c){run(c,'objects/Obj_cano/Step_0.gml');}
test('quatro recursos próprios: 3 quadros, 32x32, origem comum, 80 ms',()=>{
 for(const n of names){const s=sprites.get(refs['Spr_cano_'+n]);
  assert.equal(s.frames.length,3);assert.equal(s.width,32);assert.equal(s.height,32);
  assert.equal(s.sequence.xorigin,16);assert.equal(s.sequence.yorigin,16);
  assert.equal(s.sequence.playbackSpeed,12.5);
 }
});
test('360 ângulos escolhem o GIF correto sem rotação ou espelhamento',()=>{
 const c=setup(0);
 for(let a=0;a<360;a++){
  c.bunker_pose_bracos(c,a,true);
  assert.equal(c.sprite_index,refs['Spr_cano_'+names[Math.floor((a+45)/90)%4]]);
  assert.equal(c.image_angle,0);assert(c.image_xscale>0);assert.equal(c.image_xscale,c.image_yscale);
 }
});
for(const fps of [30,60,144])test(`três quadros, direção travada, duração e recuperação a ${fps} FPS`,()=>{
 const c=setup(2);c.delta_time=1e6/fps;c.mouse_down=true;step(c);c.mouse_down=false;
 assert(c.atacando);const seen=new Set([c.image_index]);let elapsed=1/fps;
 c.mouse_x=400;c.mouse_y=170;
 while(c.atacando&&elapsed<1){step(c);elapsed+=1/fps;seen.add(c.image_index);
  assert.equal(c.sprite_index,refs.Spr_cano_esquerda);assert.equal(c.image_angle,0);
 }
 assert(!c.atacando);assert(seen.has(0)&&seen.has(1)&&seen.has(2));
 assert(elapsed>=.24&&elapsed<.24+2/fps);
 c.mouse_down=true;step(c);assert(!c.atacando);c.mouse_down=false;
 while(c.ataque_recarga>0)step(c);
 c.mouse_down=true;step(c);assert(c.atacando);assert.equal(c.sprite_index,refs.Spr_cano_direita);
});
test('pausa conserva quadro, tempo e recuperação do golpe',()=>{
 const c=setup(0);c.mouse_down=true;step(c);c.mouse_down=false;
 const before=[c.ataque_tempo,c.ataque_recarga,c.image_index];c.global.pause_aberto=true;
 for(let n=0;n<80;n++)step(c);
 assert.deepEqual([c.ataque_tempo,c.ataque_recarga,c.image_index],before);
});
test('todas as direções e quadros acertam o metal uma única vez',()=>{
 for(let d=0;d<4;d++)for(let f=0;f<3;f++){
  const c=setup(d);c.image_index=f;const points=c.bunker_cano_pixels(d,f);
  const p=points[Math.floor(points.length/2)];
  const tx=c.x+(p[0]+.5-16)*c.image_xscale,ty=c.y+(p[1]+.5-16)*c.image_yscale;
  const e=c.enemy(tx,ty);
  c.bunker_caixa_dano=()=>({l:tx-.1,r:tx+.1,t:ty-.1,b:ty+.1});
  c.bunker_cano_impacto(c);assert.equal(e.vida,26);
  c.bunker_cano_impacto(c);assert.equal(e.vida,26);
 }
});
test('uma parede bloqueia o dano do metal nas quatro direções',()=>{
 for(let d=0;d<4;d++){
  const c=setup(d),e=c.enemy(c.x,c.y);
  // Barreira horizontal entre os pés e a origem do conjunto de braços.
  c.wall(0,(c.player.y+c.y)/2,350,1);
  c.bunker_cano_impacto(c);assert.equal(e.vida,30);
 }
});
test('fundo transparente distante não causa dano e geometria é reutilizada',()=>{
 const c=setup(0),e=c.enemy(c.x-60,c.y-60);
 c.bunker_caixa_dano=()=>({l:e.x,r:e.x+1,t:e.y,b:e.y+1});
 c.bunker_cano_impacto(c);assert.equal(e.vida,30);
 const g=c.global.cano_geometria;c.bunker_cano_pixels(3,2);assert.equal(g,c.global.cano_geometria);
});
console.log(`${count} testes direcionais v4.25 passaram (GML simulado).`);
