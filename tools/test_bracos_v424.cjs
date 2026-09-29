// Exercita os eventos GML reais em APIs simuladas. Não é compilação GameMaker.
process.env.BUNKER_SKIP_TESTS='1';
process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const {world}=require('./test_collisions.cjs');
const {run,refs,source}=require('./test_regressions.cjs');
const assert=require('node:assert/strict');
let count=0;
function test(name,fn){fn();count++;console.log('OK:',name);}
function setup(kind,angle){
 const c=world();c.id=c;
 run(c,`objects/${kind}/Create_0.gml`);
 c.dono=c.player;Object.assign(c.player,{x:160,y:190,depth:0});
 c.global.equipamento_ativo=kind==='Obj_cano'?'cano':'pistola';
 c.global.municao_pistola=4;
 c.mouse_x=160+c.lengthdir_x(200,angle);
 c.mouse_y=190-12*c.bunker_escala_protagonista()+c.lengthdir_y(200,angle);
 return c;
}
function near(a,b){assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);}
function transform(c,x,y,ox,oy){
 const dx=(x-ox)*c.image_xscale,dy=(y-oy)*c.image_yscale;
 return [c.x+c.lengthdir_x(dx,c.image_angle)-c.lengthdir_y(dy,c.image_angle),
 c.y+c.lengthdir_y(dx,c.image_angle)+c.lengthdir_x(dy,c.image_angle)];
}
test('ombros permanecem no torso em 360 direções para cada arma',()=>{
 for(const kind of ['Obj_cano','Obj_armaPregos'])for(let angle=0;angle<360;angle++){
  const c=setup(kind,angle);run(c,`objects/${kind}/Step_0.gml`);
  const dir=Math.floor((angle+45)/90)%4;
  const cano=kind==='Obj_cano';
  const xy=cano?[[12,10],[16,7],[20,10],[16,7]][dir]:[[11,11],[16,6],[21,11],[16,6]][dir];
  const p=transform(c,...xy,16,16);
  near(p[0],160);near(p[1],190-18*c.bunker_escala_protagonista());
  near(Math.abs(c.image_xscale),c.image_yscale);
 }
});
test('cano usa arquivos próprios à esquerda e direita sem transformar a arte',()=>{
 const r=setup('Obj_cano',0),l=setup('Obj_cano',180);
 run(r,'objects/Obj_cano/Step_0.gml');run(l,'objects/Obj_cano/Step_0.gml');
 assert.equal(r.image_angle,0);assert.equal(l.image_angle,0);
 assert(r.image_xscale>0&&l.image_xscale>0&&l.image_yscale>0);
 assert.equal(r.sprite_index,refs.Spr_cano_direita);assert.equal(l.sprite_index,refs.Spr_cano_esquerda);
});
test('pistola para cima: boca real acima do ombro e disparo sai desse ponto',()=>{
 const c=setup('Obj_armaPregos',90);let launch;
 c.mouse_check_button_pressed=b=>b===c.mb_right;
 c.bunker_lancar_projetil=(kind,owner,x,y,a,r)=>{
  launch={x,y,a};const p={kind};c.actors.push(p);return p;
 };
 run(c,'objects/Obj_armaPregos/Step_0.gml');
 const muzzle=transform(c,16,22,16,16);
 near(launch.x,muzzle[0]);near(launch.y,muzzle[1]);near(launch.a,90);
 assert(launch.y<190-18*c.escala_visual);assert.equal(c.municao_atual,3);
});
test('impacto do cano acompanha o metal esquerdo e aplica dano uma vez',()=>{
 const c=setup('Obj_cano',180);run(c,'objects/Obj_cano/Step_0.gml');
 const p=transform(c,10,8,16,16),e=c.enemy(p[0],p[1]+10);
 c.bunker_cano_impacto(c);assert.equal(e.vida,26);
 c.bunker_cano_impacto(c);assert.equal(e.vida,26);
});
test('troca de posição do dono atualiza encaixe e mantém proporção',()=>{
 const c=setup('Obj_cano',180);run(c,'objects/Obj_cano/Step_0.gml');
 const x=c.x,y=c.y;c.player.x+=27;c.player.y-=19;
 c.bunker_pose_bracos(c,180,true);near(c.x,x+27);near(c.y,y-19);
});
test('pause desliga filtragem antes do sprite e cabeça tem recorte frontal',()=>{
 const draw=source('objects/Obj_jogador/Draw_64.gml').split('if (global.pause_aberto)')[1];
 assert(draw.indexOf('gpu_set_texfilter(false)')<draw.indexOf('draw_sprite_ext(Spr_pause_fundo'));
 const player=source('objects/Obj_jogador/Draw_0.gml');
 assert(player.includes('if (lado_desenho == 1)'));
 assert(player.includes('draw_sprite_part_ext(sprite_desenho'));
 assert(player.includes('arma_mao.ataque_direcao'));
});
console.log(`${count} testes v4.24 passaram; 720 direções verificadas em simulação.`);
