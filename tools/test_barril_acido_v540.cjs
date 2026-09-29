/* Regressão real de Step/Animation End/Create, sprites reais; APIs simuladas, sem VM/YYC. */
process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {world}=require('./test_collisions.cjs');const {run,source,refs}=require('./test_regressions.cjs');
const yy=p=>JSON.parse(source(p).replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
const sprites=new Map(Object.entries(refs).filter(([n])=>n.startsWith('Spr_')||n==='spr_acido').map(([n,r])=>[r,yy(`sprites/${n}/${n}.yy`)]));
function event(c,a,file){
 const scope={...c};for(const k of Object.keys(a))Object.defineProperty(scope,k,{get:()=>a[k],set:v=>a[k]=v,enumerable:true,configurable:true});
 Object.defineProperty(scope,'image_number',{get:()=>sprites.get(a.sprite_index)?.frames.length||0});
 scope.id=a;scope.instance_destroy=(t=a)=>c.instance_destroy(t);
 const local=vm.createContext(scope);run(local,file);
 for(const k of Object.keys(local))if(k!=='id'&&!Object.hasOwn(a,k)&&!Object.hasOwn(c,k))a[k]=local[k];
}
function setup(fps=60){
 const c=world();c.room=refs.Room1;c.actors=[];c.walls=[];c.delta_time=1e6/fps;c.game_get_speed=()=>fps;
 c.sprite_get_number=s=>sprites.get(s).frames.length;
 c.path_add=()=>({});c.v536_boss_mover=()=>{}; // movimento não é o assunto desta regressão.
 const create=c.instance_create_depth;
 c.instance_create_depth=(x,y,depth,kind)=>{
  const a=create(x,y,depth,kind),name=kind.description,meta=yy(`objects/${name}/${name}.yy`);
  Object.assign(a,{sprite_index:refs[meta.spriteId?.name],image_xscale:1,image_yscale:1,image_speed:0,image_index:0,image_alpha:1,alarm:[],layer:'Instances'});
  if([refs.Obj_barril,refs.Obj_acido,refs.Obj_boss,refs.Obj_bala,refs.Obj_canoAremesado].includes(kind))event(c,a,`objects/${name}/Create_0.gml`);
  return a;
 };
 c.instance_create_layer=(x,y,layer,kind)=>c.instance_create_depth(x,y,0,kind);
 c.collision_rectangle=(l,t,r,b,kind)=>c.actors.find(a=>{
  if(a.kind!==kind||a.deleted)return false;const s=sprites.get(a.sprite_index);if(!s)return false;
  const x=a.x-s.sequence.xorigin*a.image_xscale,y=a.y-s.sequence.yorigin*a.image_yscale;
  return l<=x+(s.bbox_right+1)*a.image_xscale&&r>=x+s.bbox_left*a.image_xscale&&t<=y+(s.bbox_bottom+1)*a.image_yscale&&b>=y+s.bbox_top*a.image_yscale;
 })||c.noone;
 c.barrel=c.instance_create_depth(430,360,0,refs.Obj_barril);c.player.x=800;c.player.y=400;
 return c;
}
function tick(c,b,frames=1){for(let i=0;i<frames;i++){
 event(c,b,'objects/Obj_barril/Step_0.gml');
 const s=sprites.get(b.sprite_index),fps=1e6/c.delta_time;
 b.image_index+=b.image_speed*(s.sequence.playbackSpeedType===0?s.sequence.playbackSpeed/fps:s.sequence.playbackSpeed);
 if(b.image_index>=s.frames.length){b.image_index%=s.frames.length;event(c,b,'objects/Obj_barril/Other_7.gml');}
}}
const pools=c=>c.actors.filter(a=>a.kind===refs.Obj_acido&&!a.deleted);
let total=0;function test(name,fn){fn();total++;console.log('OK: '+name);}
test('sprite real de 6 quadros derrama exatamente uma poça ao terminar a queda',()=>{
 const c=setup(),b=c.barrel;assert.equal(c.sprite_get_number(refs.Spr_barril_caindo),6);
 assert(c.bunker_derrubar_barril(b));tick(c,b,100);
 assert.equal(pools(c).length,1,'REGRESSÃO: barril termina no quadro 5; poça não criada');
 assert(b.mostrar_chao&&b.acido_criado&&b.respawn_tempo>0);assert(!b.deleted);
 event(c,b,'objects/Obj_barril/Other_7.gml');event(c,b,'objects/Obj_barril/Other_7.gml');tick(c,b,20);assert.equal(pools(c).length,1);
});
test('Animation End funciona como salvaguarda sem depender do próximo Step',()=>{
 const c=setup(),b=c.barrel;c.bunker_derrubar_barril(b);b.image_index=0;
 event(c,b,'objects/Obj_barril/Other_7.gml');assert.equal(pools(c).length,1);assert.equal(b.image_index,5);assert.equal(b.image_speed,0);
 event(c,b,'objects/Obj_barril/Other_7.gml');assert.equal(pools(c).length,1);
});
test('bala, cano e impacto do boss derrubam uma vez; poça real causa -35 e abre carapaça',()=>{
 for(const hit of ['bala','cano','boss']){
  const c=setup(),b=c.barrel;
  if(hit==='boss')c.bunker_impacto(b.x,b.y,135);
  else {const p=c.projectile(hit==='bala'?refs.Obj_bala:refs.Obj_canoAremesado,b.x-140,b.y,0);p.velocidade=200;c.bunker_projetil_passo(p);}
  assert(b.atingido);
  tick(c,b,85);assert.equal(pools(c).length,1);const acid=pools(c)[0];assert.equal(acid.depth,100);assert.equal(acid.origem_barril,b);assert(acid.image_alpha>0);
  const bg=yy('rooms/Room1/Room1.yy').layers.find(l=>(l.instances||[]).some(i=>i.objectId.name==='Obj_arena_cenario'));assert(acid.depth<bg.depth,'poça escondida atrás do cenário');
  const boss=c.instance_create_depth(b.x,b.y,0,refs.Obj_boss),hp=boss.vida;
  event(c,boss,'objects/Obj_boss/Step_0.gml');assert.equal(boss.vida,hp-35);assert(boss.derrotado);
  event(c,boss,'objects/Obj_boss/Step_0.gml');assert.equal(boss.vida,hp-35);
  c.bunker_aplicar_impacto(boss,8);assert.equal(boss.vida,hp-43);
  c.bunker_derrubar_barril(b);assert.equal(pools(c).length,1);
 }
});
test('poça vive 9s, barril deitado persiste e reposição permite novo ciclo a 30/60/120 FPS',()=>{
 for(const fps of [30,60,120]){
  const c=setup(fps),b=c.barrel;c.bunker_derrubar_barril(b);while(!b.acido_criado)tick(c,b);
  const p=pools(c)[0];for(let i=0;i<Math.floor(fps*8.9);i++){tick(c,b);event(c,p,'objects/Obj_acido/Step_0.gml');}
  assert(!p.deleted&&b.mostrar_chao&&b.atingido);
  for(let i=0;i<Math.ceil(fps*.2);i++){tick(c,b);if(!p.deleted)event(c,p,'objects/Obj_acido/Step_0.gml');}
  assert(p.deleted&&b.mostrar_chao);while(b.atingido)tick(c,b);
  assert(!b.acido_criado&&!b.mostrar_chao);assert.equal(b.sprite_index,refs.Spr_barril);
  c.bunker_derrubar_barril(b);tick(c,b,Math.ceil(fps*1.4));assert.equal(pools(c).length,1);assert.notEqual(pools(c)[0],p);
 }
});
test('pausa/menus/diálogo congelam a queda e impedem derramamento antecipado',()=>{
 for(const flag of ['pause_aberto','config_aberta','cutscene_ativa','dialogo_ativo','diario_aberto','vitoria_ativa']){
  const c=setup(),b=c.barrel;c.bunker_derrubar_barril(b);tick(c,b,15);const frame=b.image_index;
  c.global[flag]=true;tick(c,b,150);assert.equal(b.image_index,frame);assert.equal(pools(c).length,0);
  // Evento final já enfileirado no mesmo frame da abertura do menu.
  event(c,b,'objects/Obj_barril/Other_7.gml');assert.equal(pools(c).length,0);
  c.global[flag]=false;tick(c,b);assert.equal(pools(c).length,1);
  const p=pools(c)[0],time=b.respawn_tempo,duration=p.duracao;c.global[flag]=true;
  tick(c,b,100);event(c,p,'objects/Obj_acido/Step_0.gml');assert.equal(b.respawn_tempo,time);assert.equal(p.duracao,duration);
 }
});
test('quatro barris mantêm poças independentes; reposição não apaga ácido de outro barril',()=>{
 const c=setup();for(const [x,y]of[[880,220],[500,540],[980,530]])c.instance_create_depth(x,y,0,refs.Obj_barril);
 const bs=c.actors.filter(a=>a.kind===refs.Obj_barril);for(const b of bs){c.bunker_derrubar_barril(b);tick(c,b,80);}
 assert.equal(pools(c).length,4);bs[0].respawn_tempo=.1;tick(c,bs[0]);assert.equal(pools(c).length,3);
 for(const b of bs.slice(1))assert(c.instance_exists(b.acido_id));
});
console.log(total+' grupos barril/ácido aprovados (GML simulado).');
