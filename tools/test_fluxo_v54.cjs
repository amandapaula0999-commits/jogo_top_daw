process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const {world,objectEvent}=require('./test_collisions.cjs');
const {run,source,refs}=require('./test_regressions.cjs');
const assert=require('node:assert/strict');
let passed=0;function test(n,fn){fn();console.log('OK:',n);passed++;}
function room(c,name){
 const meta=JSON.parse(source('rooms/'+name+'/'+name+'.yy').replace(/,\s*([}\]])/g,'$1'));
 c.room=refs[name];c.room_width=meta.roomSettings.Width;c.room_height=meta.roomSettings.Height;
 c.actors=[];c.walls=[];run(c,'objects/Obj_mapa/Create_0.gml');
 for(const p of c.actors.filter(a=>a.kind===refs.Obj_porta)){
  const saved={...p};objectEvent(c,p,'objects/Obj_porta/Create_0.gml');Object.assign(p,saved);
 }
 return c.actors.filter(a=>a.kind===refs.Obj_porta);
}
function playerCreate(c){c.window_get_fullscreen=()=>true;objectEvent(c,c.player,'objects/Obj_jogador/Create_0.gml');}
function use(c,p){c.keys.clear();c.player.x=p.x;c.player.y=p.y;c.keys.add(c.ord('E'));if(p.tipo_passagem==='porta')objectEvent(c,p,'objects/Obj_porta/Step_0.gml');else c.v5_passagem_atualizar(p);c.keys.clear();}

function npc(c){const n=c.actors.find(a=>a.kind===refs.Obj_cientista1);objectEvent(c,n,'objects/Obj_cientista1/Create_0.gml');return n;}
function npcStep(c,n){objectEvent(c,n,'objects/Obj_cientista1/Step_0.gml');}
test('Arquivo: um guarda, cientista inferior direito e porta superior esquerda trancada',()=>{
 const c=world(),ps=room(c,'Room_Biblioteca'),n=npc(c),enemies=c.actors.filter(a=>a.kind===refs.Obj_caracol);
 assert.equal(enemies.length,1);assert(enemies[0].guarda_arquivo);assert(n.x>1100&&n.y>550);
 assert(Math.hypot(n.x-enemies[0].x,n.y-enemies[0].y)<180);
 const door=ps[0];assert(door.x<180&&door.y<150);assert.equal(door.destino,refs.Room_Corredor_Pos);
 use(c,door);assert(!door.abrindo);assert(door.mensagem_tempo>0);assert(!c.global.v53_chave_cientista);
 c.player.x=n.x;c.player.y=n.y;c.keys.add(c.ord('E'));npcStep(c,n);assert(!n.exibir_dialogo&&!c.global.dialogo_ativo);
});
test('derrotar guarda libera conversa; chave só é concedida ao terminar as quatro falas',()=>{
 const c=world();room(c,'Room_Biblioteca');const n=npc(c),e=c.actors.find(a=>a.guarda_arquivo);
 e.vida=0;assert(c.v53_arquivo_liberado());c.string_length=s=>s.length;c.string_copy=(s,start,len)=>s.slice(start-1,start-1+len);
 c.player.x=n.x;c.player.y=n.y;c.keys.add(c.ord('E'));npcStep(c,n);c.keys.clear();assert(n.exibir_dialogo);assert(!c.global.v53_chave_cientista);
 assert(n.fala_1.includes('caos')&&n.fala_2.includes('rádio'));
 for(let i=1;i<=4;i++){
  npcStep(c,n);n.char_index=n.texto_completo.length;c.keys.add(c.vk_space);npcStep(c,n);c.keys.clear();
  if(i<4)assert(!c.global.v53_chave_cientista);
 }
 assert(c.global.v53_chave_cientista&&!c.global.dialogo_ativo&&!n.exibir_dialogo);
 const door=c.actors.find(a=>a.kind===refs.Obj_porta);use(c,door);assert(door.abrindo);assert.equal(c.global.spawn_room,refs.Room_Corredor_Pos);
});
test('Sala 5: checkpoint na chegada, três portas, boss acima e escadaria à direita',()=>{
 const c=world();c.global.spawn_room=refs.Room_Corredor_Pos;c.global.spawn_x=683;c.global.spawn_y=575;
 const ps=room(c,'Room_Corredor_Pos');playerCreate(c);assert.equal(ps.length,3);
 assert.equal(c.global.v5_checkpoint_room,refs.Room_Corredor_Pos);assert.deepEqual([c.global.v5_checkpoint_x,c.global.v5_checkpoint_y],[683,575]);
 const archive=ps.find(p=>p.destino===refs.Room_Biblioteca),boss=ps.find(p=>p.destino===refs.Room1),stairs=ps.find(p=>p.saida_final);
 assert.equal(archive.x,c.room_width/2);assert(archive.y>600);assert(boss.y<150);assert(stairs.x>1200);
 c.global.v53_chave_cientista=true;c.global.chave_pega=true;use(c,stairs);assert(!stairs.abrindo&&!c.global.vitoria_ativa);
 room(c,'Room1');c.v5_reiniciar_checkpoint();assert.equal(c.global.spawn_room,refs.Room_Corredor_Pos);
 room(c,'Room_Corredor_Pos');playerCreate(c);assert.deepEqual([c.player.x,c.player.y],[683,575]);assert.equal(c.player.vida,100);
});

module.exports={room,playerCreate,use,npc};
test('duto funciona ida e volta com tela preta até a chegada, inclusive sem chave',()=>{
 const c=world();
 for(const [from,to] of [['Room_Pesquisa','Room_Biblioteca'],['Room_Biblioteca','Room_Pesquisa']]){
  const ps=room(c,from),d=ps.find(p=>p.tipo_passagem==='duto');assert(d);assert.equal(d.destino,refs[to]);
  use(c,d);assert(c.global.v5_duto_ativo&&c.global.cutscene_ativa);assert(d.tempo_duto>0);
  for(let i=0;i<70;i++)c.v5_passagem_atualizar(d);
  assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs[to]));
  room(c,to);assert(!c.global.v5_duto_ativo&&!c.global.cutscene_ativa);
  assert(c.bunker_varrer_paredes(c.global.spawn_x,c.global.spawn_y,c.global.spawn_x,c.global.spawn_y,12).t>1);
 }
});
function collect(c){const k=c.actors.find(a=>a.kind===refs.Obj_chave_escadaria);assert(k);c.player.x=k.x;c.player.y=k.y;c.keys.add(c.ord('E'));objectEvent(c,k,'objects/Obj_chave_escadaria/Step_0.gml');c.keys.clear();return k;}
function intro(c){for(let i=0;i<178;i++)c.v54_atualizar();}
test('chave no canto superior esquerdo; arena vazia e porta inferior central antes da coleta',()=>{
 const c=world(),ps=room(c,'Room1');const k=c.actors.find(a=>a.kind===refs.Obj_chave_escadaria);
 assert(k.x<200&&k.y<260);assert(!c.instance_exists(refs.Obj_boss));
 assert.equal(ps[0].x,c.room_width/2);assert(ps[0].y>600);assert(!c.instance_exists(c.global.parede_saida));
 const meta=JSON.parse(source('rooms/Room1/Room1.yy'));assert(!meta.layers.some(l=>(l.instances||[]).some(i=>i.objectId.name==='Obj_boss')));
 const p=c.actors.find(a=>a.kind===refs.Obj_chave_escadaria);c.keys.add(c.ord('E'));c.player.x=p.x;c.player.y=p.y;c.global.pause_aberto=true;
 objectEvent(c,p,'objects/Obj_chave_escadaria/Step_0.gml');assert(!c.instance_exists(refs.Obj_boss));c.global.pause_aberto=false;c.keys.clear();
 collect(c);assert(c.global.v53_chave_escada&&c.instance_exists(refs.Obj_boss));assert(!c.instance_exists(refs.Obj_chave_escadaria));assert(!ps[0].ativa);
});
test('cena: golpe, foco na porta, queda dos escombros, colisão, pausa e liberação do combate',()=>{
 const c=world();room(c,'Room1');collect(c);const boss=c.global.v54_boss;
 const saved={...boss};objectEvent(c,boss,'objects/Obj_boss/Create_0.gml');Object.assign(boss,saved);
 for(let i=0;i<66;i++)c.v54_atualizar();assert(boss.ataque_ativo);assert.equal(boss.ataque_tempo,66);assert.equal(c.global.camera_foco_y,360);
 c.global.pause_aberto=true;c.v54_atualizar();assert.equal(c.global.v54_tempo,66);c.global.pause_aberto=false;
 for(let i=66;i<116;i++)c.v54_atualizar();assert.equal(c.global.camera_foco_y,640);assert(c.instance_exists(c.global.parede_saida));
 assert(c.bunker_varrer_paredes(683,580,683,710,12).t<=1);
 for(let i=116;i<178;i++)c.v54_atualizar();assert(!c.global.cutscene_ativa&&!boss.ataque_ativo);assert.equal(c.global.camera_zoom,1);assert(!c.global.v54_porta.ativa);
});
test('morrer durante cena preserva chave e permite reiniciar a luta pelo checkpoint',()=>{
 const c=world();room(c,'Room_Corredor_Pos');playerCreate(c);room(c,'Room1');collect(c);c.v5_reiniciar_checkpoint();
 assert.equal(c.global.spawn_room,refs.Room_Corredor_Pos);assert(c.global.v53_chave_escada&&!c.global.boss_derrotado);
 room(c,'Room_Corredor_Pos');assert.equal(c.global.v54_cena,0);room(c,'Room1');assert(c.instance_exists(refs.Obj_boss));assert.equal(c.global.v54_cena,1);
});
test('fuga real destrói bloqueio, remove Boss e só a escadaria inicia os créditos',()=>{
 const c=world();room(c,'Room1');collect(c);intro(c);const b=c.global.v54_boss;
 objectEvent(c,b,'objects/Obj_boss/Create_0.gml');b.vida=0;
 for(let i=0;i<240&&!b.deleted;i++)objectEvent(c,b,'objects/Obj_boss/Step_0.gml');
 assert(b.deleted);assert(c.global.boss_derrotado&&c.global.saida_aberta);assert(!c.instance_exists(c.global.parede_saida));assert(c.global.v54_porta.ativa);assert(!c.global.vitoria_ativa);
 let ps=room(c,'Room_Corredor_Pos');let draws=[];c.c_white=0;c.draw_sprite_ext=(...a)=>draws.push(a);c.v54_dinamico_desenhar();assert(draws.some(a=>a[0]===refs.Spr_boos_caido));
 assert(!c.instance_exists(refs.Obj_boss));const stair=ps.find(p=>p.saida_final);use(c,stair);
 for(let i=0;i<150&&!c.global.vitoria_ativa;i++)objectEvent(c,stair,'objects/Obj_porta/Step_0.gml');assert(c.global.vitoria_ativa);
 room(c,'Room1');assert(!c.instance_exists(refs.Obj_boss)&&!c.instance_exists(refs.Obj_chave_escadaria));
});
test('escombros dos dois lados bloqueiam bala/cano e oferecem inspeção ao longo da pilha',()=>{
 for(const [name,x,to] of [['Room_Corredor',1070,1300],['Room_Corredor_Pos',222,70]]){
  const c=world();room(c,name);for(const y of [50,210,380,600,720]){
   assert(c.bunker_varrer_paredes(x,y,to,y,4).t<1);c.player.x=x;c.player.y=y;c.v54_atualizar();assert(c.global.v54_entulho_perto);
  }
  c.keys.add(c.ord('E'));c.v54_atualizar();assert(c.global.v54_entulho_tempo>0);
  for(const a of c.actors.filter(a=>a.kind===refs.Obj_caracol)){a.sprite_index=refs.Spr_inimigo_parado_baixo;a.image_xscale=.55;a.image_yscale=.55;}
  for(const type of [refs.Obj_bala,refs.Obj_canoAremesado]){const proj=c.projectile(type,x,380,to>x?0:180);proj.velocidade=500;c.bunker_projetil_passo(proj);assert(proj.deleted||!proj.em_voo);}
 }
});
test('retornos, chave, cientista e porta ficam fora dos sólidos; escada bloqueia chave sem vitória',()=>{
 const c=world();const links=[];
 for(const n of ['Room_Biblioteca','Room_Corredor_Pos','Room1','Room_Pesquisa'])for(const p of room(c,n))links.push([p.destino.description,p.spawn_x,p.spawn_y]);
 for(const [n,x,y] of links){room(c,n);assert(c.bunker_varrer_paredes(x,y,x,y,12).t>1,n+' chegada');}
 room(c,'Room_Biblioteca');const n=c.actors.find(a=>a.kind===refs.Obj_cientista1);assert(c.bunker_varrer_paredes(n.x,n.y,n.x,n.y,12).t>1);
 room(c,'Room1');const k=c.actors.find(a=>a.kind===refs.Obj_chave_escadaria);assert(c.bunker_varrer_paredes(k.x,k.y,k.x,k.y,12).t>1);
 const ps=room(c,'Room_Corredor_Pos');c.global.v53_chave_escada=true;assert(!c.v53_porta_liberada(ps.find(p=>p.saida_final)));
});
console.log(passed+' testes v5.4 passaram; APIs GML simuladas.');
