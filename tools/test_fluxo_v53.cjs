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
test('Arquivo: um guarda, cientista inferior direito e porta superior direita trancada',()=>{
 const c=world(),ps=room(c,'Room_Biblioteca'),n=npc(c),enemies=c.actors.filter(a=>a.kind===refs.Obj_caracol);
 assert.equal(enemies.length,1);assert(enemies[0].guarda_arquivo);assert(n.x>1100&&n.y>550);
 assert(Math.hypot(n.x-enemies[0].x,n.y-enemies[0].y)<160);
 const door=ps[0];assert(door.x>1100&&door.y<150);assert.equal(door.destino,refs.Room_Corredor_Pos);
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
test('boss libera chave física; coleta exige E e escadaria é o único gatilho da vitória',()=>{
 const c=world();room(c,'Room1');c.global.boss_derrotado=true;
 room(c,'Room1');let key=c.actors.find(a=>a.kind===refs.Obj_chave_escadaria);assert(key);assert(!c.global.v53_chave_escada&&!c.global.vitoria_ativa);
 c.player.x=key.x;c.player.y=key.y;c.global.pause_aberto=true;c.keys.add(c.ord('E'));objectEvent(c,key,'objects/Obj_chave_escadaria/Step_0.gml');assert(!c.global.v53_chave_escada);
 c.global.pause_aberto=false;objectEvent(c,key,'objects/Obj_chave_escadaria/Step_0.gml');c.keys.clear();assert(c.global.v53_chave_escada);
 const ps=room(c,'Room_Corredor_Pos'),stairs=ps.find(p=>p.saida_final);use(c,stairs);assert(stairs.abrindo&&!c.global.vitoria_ativa);
 for(let i=0;i<150&&!c.global.vitoria_ativa;i++)objectEvent(c,stairs,'objects/Obj_porta/Step_0.gml');
 assert(c.global.vitoria_ativa);assert(!c.eventos.some(e=>e[0]==='goto'));
 room(c,'Room1');assert(!c.actors.some(a=>a.kind===refs.Obj_chave_escadaria));
});
test('novo jogo limpa as duas chaves; retornos e chegada da chave ficam fora dos sólidos',()=>{
 const c=world();c.global.v53_arquivo_livre=true;c.global.v53_chave_cientista=true;c.global.v53_chave_escada=true;
 c.bunker_iniciar(true);assert(!c.global.v53_arquivo_livre&&!c.global.v53_chave_cientista&&!c.global.v53_chave_escada);
 const links=[];for(const n of ['Room_Biblioteca','Room_Corredor_Pos','Room1'])for(const p of room(c,n))links.push([p.destino.description,p.spawn_x,p.spawn_y]);
 for(const [n,x,y] of links){room(c,n);assert(c.bunker_varrer_paredes(x,y,x,y,10).t>1,n+' chegada obstruída');}
 room(c,'Room1');assert(c.bunker_varrer_paredes(400,520,400,520,10).t>1);
});
test('evento do boss conclui fuga e solta a chave sem iniciar os créditos',()=>{
 const c=world();room(c,'Room1');Object.assign(c,{vida:0,fugindo:false,morto:false,saida_impacto:false,feedback_tempo:0,onda_tempo:0,x:1265,y:380,fuga_alvo_x:1270,fuga_alvo_y:380});
 const code=source('objects/Obj_boss/Step_0.gml');run(c,'objects/Obj_boss/Step_0.gml',code.slice(0,code.indexOf('visible = (room == Room1)')));
 assert(c.global.boss_derrotado);assert(c.morto&&!c.fugindo);assert(!c.global.vitoria_ativa);
 assert.equal(c.actors.filter(a=>a.kind===refs.Obj_chave_escadaria).length,1);
 c.global.v53_arquivo_livre=true;room(c,'Room_Biblioteca');assert(!c.actors.some(a=>a.kind===refs.Obj_caracol));
});
console.log(passed+' testes de progressão v5.3 passaram; GML simulado.');
