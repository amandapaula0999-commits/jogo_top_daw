process.env.BUNKER_SKIP_TESTS='1';
process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const {world,sprites}=require('./test_collisions.cjs');
const {run,refs,source}=require('./test_regressions.cjs');
const assert=require('node:assert/strict');
let count=0;
function test(name,fn){fn();count++;console.log('OK:',name);}
function arm(c){
  return {x:100,y:100,dono:{x:100,y:124},image_index:0,image_angle:0,
    escala_ataque:2,image_xscale:2,image_yscale:2,direcao_arma:0,ataque_pixels_anteriores:[],dano_cano:4,ataque_atingiu:false,ataque_ponta_valida:false};
}
for(const d of ['direita','baixo','cima','esquerda'])test('origem e quadros: '+d,()=>{
  for(const [state,n] of [['andando',4],['idle',1],['parado',1]]){
    const s=sprites.get(refs['Spr_jogador_'+state+'_'+d]);
    assert.equal(s.frames.length,n);assert.equal(s.width,32);assert.equal(s.height,32);
    assert.equal(s.sequence.xorigin,16);assert.equal(s.sequence.yorigin,32);
  }
});
test('ataque sem quadros da pistola; recepcionista anima a 4 FPS em 1x',()=>{
  const atk=sprites.get(refs.Spr_canoAtaque),npc=sprites.get(refs.Spr_recepcionista);
  assert.equal(atk.frames.length,10);assert.equal(atk.sequence.xorigin,12);assert.equal(atk.sequence.yorigin,18);
  assert.equal(npc.frames.length,10);assert.equal(npc.sequence.playbackSpeed,4);
  assert(source('objects/Obj_recepcionista/Create_0.gml').includes('image_xscale = 1;'));
  assert(source('objects/Obj_recepcionista/Create_0.gml').includes('image_yscale = 1;'));
  assert(source('objects/Obj_recepcionista/Step_0.gml').includes('global.secretaria_orientou = true'));
});
test('escala ampliada compartilhada, máscara de pés preservada',()=>{
  const c=world(),s=c.bunker_escala_protagonista();
  const eh=c.sprite_get_bbox_bottom(refs.Spr_inimigo_parado_baixo)+1-c.sprite_get_bbox_top(refs.Spr_inimigo_parado_baixo);
  const ph=c.sprite_get_bbox_bottom(refs.Spr_jogador_parado_baixo)+1-c.sprite_get_bbox_top(refs.Spr_jogador_parado_baixo);
  assert(Math.abs(ph*s/(eh*c.bunker_escala_inimigo())-16/20)<1e-9);
  assert(source('objects/Obj_jogador/Create_0.gml').includes('mask_index = Spr_mascara_jogador'));
  assert(source('objects/Obj_jogador/Draw_0.gml').includes('escala_personagem * (1 + idle_breath)'));
  const p=c.projectile(refs.Obj_canoAremesado,80,100);
  assert.equal(p.image_xscale,0.55*s);
  assert.equal(p.raio_colisao,c.bunker_raio_projetil(refs.Spr_cano,0.55*s));
});
test('cano registra contato próximo à ponta uma única vez',()=>{
  const c=world(),a=arm(c),e=c.enemy(112,100);
  c.bunker_cano_impacto(a);assert.equal(e.vida,26);
  for(let i=0;i<3;i++){a.image_index=i;c.bunker_cano_impacto(a);}
  assert.equal(e.vida,26);
});
test('parede entre mão e ponta bloqueia inimigo',()=>{
  const c=world(),a=arm(c),e=c.enemy(143,90);c.wall(115,40,1,80);
  c.bunker_cano_impacto(a);assert.equal(e.vida,30);
});
test('mão além da parede não causa dano no outro lado',()=>{
  const c=world(),a=arm(c);a.dono.x=80;c.wall(90,50,1,100);
  const e=c.enemy(130,91);c.bunker_cano_impacto(a);assert.equal(e.vida,30);
});
test('arco acerta inimigo que não estava no primeiro quadro',()=>{
  const c=world(),a=arm(c),e=c.enemy(150,120);
  c.bunker_cano_impacto(a);assert.equal(e.vida,30);
  a.image_index=1;c.bunker_cano_impacto(a);assert.equal(e.vida,26);
});
test('ataque real completa sequência, trava mira e respeita pausa',()=>{
  const c=world();c.id=c;run(c,'objects/Obj_cano/Create_0.gml');
  c.dono=c.player;c.player.x=100;c.player.y=124;c.player.depth=0;c.player.furtivo=false;
  c.global.equipamento_ativo='cano';c.mouse_x=200;c.mouse_y=124-12*c.bunker_escala_protagonista();c.mouse_down=true;
  run(c,'objects/Obj_cano/Step_0.gml');assert(c.atacando);assert.equal(c.ataque_direcao,0);
  c.mouse_down=false;c.mouse_x=0;c.mouse_y=200;const angle=c.image_angle;
  c.global.pause_aberto=true;const time=c.ataque_tempo;run(c,'objects/Obj_cano/Step_0.gml');assert.equal(c.ataque_tempo,time);
  c.global.pause_aberto=false;let seen=new Set([0]);
  for(let n=0;n<50;n++){run(c,'objects/Obj_cano/Step_0.gml');seen.add(Math.floor(c.image_index));if(c.atacando)assert.equal(c.image_angle,angle);}
  assert.equal(c.atacando,false);for(let i=0;i<3;i++)assert(seen.has(i));
});
function gun(angle){
  const c=world();run(c,'objects/Obj_armaPregos/Create_0.gml');
  c.dono=c.player;c.player.x=100;c.player.y=124;c.player.depth=0;
  c.global.equipamento_ativo='pistola';c.global.municao_pistola=4;
  c.mouse_x=100+c.lengthdir_x(200,angle);
  c.mouse_y=124-12*c.escala_visual+c.lengthdir_y(200,angle);
  return c;
}
test('pistola troca as quatro direções e gira com o cursor nas diagonais',()=>{
  for(const [a,f,r] of [[0,1,0],[90,2,180],[180,3,0],[270,0,0],[30,1,30],[60,2,150],[330,1,-30]]){
    const c=gun(a);run(c,'objects/Obj_armaPregos/Step_0.gml');
    assert.equal(c.image_index,f);assert(Math.abs(c.image_angle-r)<1e-8);
    assert.equal(c.image_xscale,c.bunker_escala_protagonista());assert.equal(c.image_yscale,c.image_xscale);
  }
});
test('pistola dispara pelas quatro bocas corretas e desconta uma munição',()=>{
  for(const a of [0,90,180,270]){
    const c=gun(a);c.mouse_check_button_pressed=b=>b===c.mb_right;
    run(c,'objects/Obj_armaPregos/Step_0.gml');
    const p=c.actors.find(o=>o.kind===refs.Obj_bala);assert(p);assert.equal(p.dano,5);
    assert.equal(c.municao_atual,3);assert.equal(c.global.municao_pistola,3);
    assert(Math.abs(p.direction-a)<1e-8);
  }
});
test('pausa bloqueia disparo e conserva munição',()=>{
  const c=gun(0);c.global.pause_aberto=true;c.mouse_check_button_pressed=()=>true;
  run(c,'objects/Obj_armaPregos/Step_0.gml');
  assert(!c.actors.some(o=>o.kind===refs.Obj_bala));assert.equal(c.municao_atual,4);
});
console.log(`${count} testes v4.23 passaram; GML simulado.`);
