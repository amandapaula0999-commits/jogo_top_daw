process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {world,objectEvent}=require('./test_collisions.cjs');
const {run,source,refs,root}=require('./test_regressions.cjs');
const read=p=>JSON.parse(source(p).replace(/,\s*([}\]])/g,'$1'));
let passed=0;function test(n,f){f();passed++;console.log('OK: '+n);}
function enter(c,name='Room_Ferramentas_N2'){
 const meta=read(`rooms/${name}/${name}.yy`);c.room=refs[name];c.room_width=meta.roomSettings.Width;c.room_height=meta.roomSettings.Height;c.actors=[];c.walls=[];
 const ins=meta.layers.flatMap(l=>l.instances||[]);
 for(const i of ins){
  if(i.objectId.name==='Obj_mapa'||i.objectId.name==='Obj_jogador')continue;
  const a=c.instance_create_depth(i.x,i.y,0,refs[i.objectId.name]);Object.assign(a,{image_index:i.imageIndex,image_speed:0,image_xscale:i.scaleX,image_yscale:i.scaleY,visible:true});
  if(i.objectId.name==='Obj_parede')c.bunker_parede_configurar(a,i.scaleX*64,i.scaleY*64);
 }
 run(c,'objects/Obj_mapa/Create_0.gml');
 for(const p of c.actors.filter(a=>a.kind===refs.Obj_porta)){const save={...p};objectEvent(c,p,'objects/Obj_porta/Create_0.gml');Object.assign(p,save);}
 c.player.x=256;c.player.y=274;c.player.vida_max=100;
 return c;
}
function use(c,p){c.keys.add(c.ord('E'));objectEvent(c,p,'objects/Obj_porta/Step_0.gml');c.keys.clear();}
function press(c,x,y){c.player.x=x;c.player.y=y;c.s10_input=0;c.keys.add(c.ord('E'));c.sala10_step(c);c.keys.clear();}
function collect(c){press(c,290,115);assert(!c.global.inventario_pe_cabra);press(c,290,115);}
function item(c,name){return c.actors.find(a=>a.kind===refs[name]);}
function reachable(c,x0=256,y0=274){
 const blocked=(x,y)=>x<12||y<12||x>500||y>330||c.walls.some(w=>x+10>=w.x&&x-10<=w.x+w.largura&&y+11>=w.y&&y-4<=w.y+w.altura);
 const q=[[x0,y0]],seen=new Set([`${x0},${y0}`]);
 for(let i=0;i<q.length;i++)for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const x=q[i][0]+dx,y=q[i][1]+dy,k=`${x},${y}`;if(!seen.has(k)&&!blocked(x,y)){seen.add(k);q.push([x,y]);}}
 return (x,y,r=12)=>q.some(([px,py])=>Math.hypot(px-x,py-y)<=r);
}
test('acesso superior central exige chave mesmo com debug; demais portas conservadas',()=>{
 const c=enter(world(),'Room_Corredor_N2');const p=c.actors.find(a=>a.destino===refs.Room_Ferramentas_N2);assert.deepEqual([p.x,p.y],[c.room_width/2,95]);assert.equal(c.actors.filter(a=>a.kind===refs.Obj_porta).length,6);
 c.player.x=624;c.player.y=145;c.global.modo_teste_portas_livres=true;use(c,p);assert(!c.eventos.some(e=>e[0]==='goto'));assert(p.mensagem_bloqueio.includes('FERRAMENTAS'));
 c.global.chave_sala_ferramentas=true;use(c,p);assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Ferramentas_N2));assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[256,274]);
});
test('caixinha da Sala dos Funcionários continua sendo a origem da chave',()=>{
 const c=enter(world(),'Room_Funcionarios');c.player.x=404;c.player.y=119;c.keys.add(c.ord('E'));
 const step=source('objects/Obj_mapa/Step_0.gml');run(c,'objects/Obj_mapa/Step_0.gml',step.slice(step.indexOf('// INTERAÇÕES / SALA DOS FUNCIONÁRIOS')));
 assert(c.global.chave_sala_ferramentas&&c.global.funcionarios_chaves_coletadas&&c.global.chave_deposito);
});
test('primeira entrada mostra ambiente comum e depois percebe o pé de cabra',()=>{
 const c=enter(world());assert(item(c,'Obj_sala10_pe_cabra').visible);assert.equal(item(c,'Obj_sala10_pe_cabra').x,274);assert.equal(item(c,'Obj_sala10_pe_cabra').y,48);
 assert.equal(c.s10_frame,0);assert(!c.global.inventario_pe_cabra);
 for(let i=0;i<181;i++)c.sala10_step(c);assert.equal(c.s10_frame,1);assert(!c.s10_observar);
});
test('examinar e coletar na primeira visita guarda a ferramenta e deixa suporte vazio',()=>{
 const c=enter(world()),ammo=c.global.municao_pistola;collect(c);
 assert(c.global.inventario_pe_cabra);assert(!item(c,'Obj_sala10_pe_cabra').visible);
 assert.equal(item(c,'Obj_sala10_suporte').image_index,0);assert.equal(c.s10_frame,4);
 assert.equal(c.global.municao_pistola,ammo);assert(!c.actors.some(a=>a.kind===refs.Obj_armaPregos));
 press(c,290,115);assert.equal(c.s10_frame,5);assert(!item(c,'Obj_sala10_pe_cabra').visible);
});
test('entrada, saída, retorno e checkpoint preservam a coleta sem exigir segunda visita',()=>{
 const c=enter(world());collect(c);c.player.x=256;c.player.y=299;use(c,item(c,'Obj_porta'));
 assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Corredor_N2));assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[624,184]);
 enter(c);assert(c.global.inventario_pe_cabra&&!item(c,'Obj_sala10_pe_cabra').visible);
 c.global.v5_checkpoint_room=refs.Room_Ferramentas_N2;c.global.v5_checkpoint_x=256;c.global.v5_checkpoint_y=274;c.v5_reiniciar_checkpoint();enter(c);
 assert(c.global.inventario_pe_cabra&&!item(c,'Obj_sala10_pe_cabra').visible);
 c.bunker_iniciar(true);enter(c);assert(!c.global.inventario_pe_cabra&&item(c,'Obj_sala10_pe_cabra').visible);
});
test('pausa e outras interfaces bloqueiam coleta e avanço das falas',()=>{
 for(const flag of ['pause_aberto','diario_aberto','config_aberta','cutscene_ativa','dialogo_ativo']){const c=enter(world());c.s10_examinada=true;c.global[flag]=true;const t=c.s10_tempo;press(c,290,115);assert(!c.global.inventario_pe_cabra);assert.equal(c.s10_tempo,t);}
});
test('regra da futura porta da sala fria exige o pé de cabra, inclusive em debug',()=>{
 const c=enter(world());c.global.modo_teste_portas_livres=true;const p={chave_exigida:'pe_cabra'};
 assert(!c.v53_porta_liberada(p));collect(c);assert(c.v53_porta_liberada(p));
});
test('paredes contínuas, vão central e móveis sólidos; todos os pontos de uso são alcançáveis',()=>{
 const c=enter(world());assert.equal(c.walls.length,11);const can=reachable(c);
 for(const pt of [[256,299],[290,115],[115,269],[421,144]])assert(can(...pt),pt+' sem rota');
 for(const pt of [[35,10],[10,150],[500,150],[80,322],[400,322],[100,110],[420,100],[115,220]])assert(c.bunker_varrer_paredes(...pt,...pt,0).t<=1);
 assert(c.bunker_varrer_paredes(256,324,256,324,0).t>1);
 for(const kind of [refs.Obj_bala,refs.Obj_canoAremesado]){const a=c.projectile(kind,100,166,90);a.velocidade=300;c.bunker_projetil_passo(a);assert(a.deleted||!a.em_voo);}
});
test('Sala 10 usa somente sprites estáticos; preview e dados correspondem aos recursos registrados',()=>{
 for(const n of ['Obj_sala10_cenario','Obj_sala10_suporte','Obj_sala10_pe_cabra'])assert(!read(`objects/${n}/${n}.yy`).eventList.some(e=>e.eventType===8));
 const s=read('sprites/Spr_sala10_suporte/Spr_sala10_suporte.yy');assert.equal(s.frames.length,1);assert.equal(s.sequence.playbackSpeed,0);
 const room=read('rooms/Room_Ferramentas_N2/Room_Ferramentas_N2.yy');assert.equal(room.layers.flatMap(l=>l.instances||[]).filter(i=>i.objectId.name==='Obj_jogador').length,1);
 assert(source('objects/Obj_mapa/Draw_0.gml').includes('if (room == Room_Ferramentas_N2 || room == Room_Deposito_N2 || room == Room_Laboratorio_N2) exit;'));
});
console.log(passed+' testes da Sala 10 passaram (GML simulado; sem GameMaker).');
