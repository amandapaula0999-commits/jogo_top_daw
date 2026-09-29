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
test('prólogo: recepção exige orientação e queda define Sala 1 sem passar pelo duto',()=>{
 const c=world();let ps=room(c,'Room_Externa');assert(ps.some(p=>p.destino===refs.Room_Recepcao));
 ps=room(c,'Room_Recepcao');const entry=ps.find(p=>p.destino===refs.Room_Armadilha);assert(entry.requer_orientacao);
 c.global.secretaria_orientou=false;use(c,entry);assert(!c.eventos.some(e=>e[0]==='goto'));
 c.global.secretaria_orientou=true;use(c,entry);assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Armadilha));
 room(c,'Room_Armadilha');c.armadilha_tempo=204;
 const step=source('objects/Obj_mapa/Step_0.gml');run(c,'objects/Obj_mapa/Step_0.gml',step.slice(step.indexOf('if (room == Room_Armadilha &&')));
 assert.equal(c.global.spawn_room,refs.Room_Desmoronada);assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[210,360]);
 const disk={};c.ini_write_string=(s,k,v)=>disk[k]=v;c.ini_write_real=c.ini_write_string;
 room(c,'Room_Desmoronada');playerCreate(c);
 assert.deepEqual([c.player.x,c.player.y],[210,360]);assert.equal(c.global.v5_checkpoint_room,refs.Room_Desmoronada);
 assert.deepEqual(disk,{sala:'Room_Desmoronada',x:210,y:360});assert(!c.global.v5_queda_pendente);
});
test('Sala 1 tem só a porta; Pesquisa é acessada exclusivamente pela nova porta do corredor',()=>{
 const c=world();let ps=room(c,'Room_Desmoronada');assert.equal(ps.length,1);
 assert.equal(ps[0].destino,refs.Room_Corredor);assert.equal(ps[0].tipo_passagem,'porta');
 assert(!source('objects/Obj_mapa/Draw_0.gml').includes('prop_grade(910,555'));
 const entrances=[];
 for(const n of ['Room_Externa','Room_Recepcao','Room_Armadilha','Room_Desmoronada','Room_Corredor','Room_Pesquisa','Room_Biblioteca','Room1'])
  for(const p of room(c,n))if(p.destino===refs.Room_Pesquisa)entrances.push([n,p.tipo_passagem]);
 assert.deepEqual(entrances,[['Room_Corredor','porta']]);
});
test('nova porta fica à direita, sem sobrepor interação; ida e volta chegam livres',()=>{
 const c=world(),ps=room(c,'Room_Corredor');
 const back=ps.find(p=>p.destino===refs.Room_Desmoronada),entry=ps.find(p=>p.destino===refs.Room_Pesquisa);
 assert(entry.x>back.x&&entry.y===back.y&&entry.y>600);assert(entry.x-back.x>164);
 use(c,entry);assert.equal(c.global.spawn_room,refs.Room_Pesquisa);
 const research=room(c,'Room_Pesquisa');playerCreate(c);
 assert.deepEqual([c.player.x,c.player.y],[110,170]);
 const exit=research.find(p=>p.destino===refs.Room_Corredor);use(c,exit);
 room(c,'Room_Corredor');playerCreate(c);assert.deepEqual([c.player.x,c.player.y],[340,575]);
});
test('Pesquisa menor tem entrada superior esquerda e único duto inferior direito',()=>{
 const c=world(),ps=room(c,'Room_Pesquisa');assert.deepEqual([c.room_width,c.room_height],[1200,700]);assert.equal(ps.length,2);
 const door=ps.find(p=>p.tipo_passagem==='porta'),vent=ps.find(p=>p.tipo_passagem==='duto');
 assert(door.x<160&&door.y<120);assert.equal(door.destino,refs.Room_Corredor);
 assert(vent.x>c.room_width*.85&&vent.y>c.room_height*.8);assert.equal(vent.destino,refs.Room_Biblioteca);
});
test('elevador superior esquerdo é apenas interativo; entulho impede toda passagem',()=>{
 const c=world(),ps=room(c,'Room_Corredor');const e=ps.find(p=>p.tipo_passagem==='elevador');
 assert(e.x<300&&e.y<160);use(c,e);assert(e.mensagem_tempo>0);assert(!c.eventos.some(v=>v[0]==='goto'));
 const back=ps.find(p=>p.destino===refs.Room_Desmoronada);assert(back.x<300&&back.y>600);
 for(let y=32;y<=736;y+=8)assert(c.bunker_varrer_paredes(1060,y,1300,y,8).t<=1,'fresta em '+y);
 assert(ps.some(p=>p.destino===refs.Room_Pesquisa));
});
test('duto da Pesquisa fica preto até chegar aos Arquivos sem travar o controle',()=>{
 const c=world();let ps=room(c,'Room_Pesquisa');
 for(const [target,dest] of [[refs.Room_Biblioteca,'Room_Biblioteca']]){
  const p=ps.find(p=>p.destino===target&&p.tipo_passagem==='duto');assert(p);use(c,p);
  assert(c.global.v5_duto_ativo&&c.global.cutscene_ativa);
  let frames=0,cover=0;c.c_black=0;c.c_white=1;c.draw_set_alpha=()=>{};c.draw_set_color=()=>{};
  c.draw_rectangle=(...r)=>{assert.deepEqual(r,[0,0,1366,768,false]);cover++;};
  while(p.tempo_duto>0&&frames++<100){run(c,'objects/Obj_jogador/Draw_75.gml');c.v5_passagem_atualizar(p);}
  assert(frames>=60&&frames<100);assert.equal(cover,frames);assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===target));
  ps=room(c,dest);playerCreate(c);assert(!c.global.v5_duto_ativo&&!c.global.cutscene_ativa);
  assert(c.bunker_varrer_paredes(c.player.x,c.player.y,c.player.x,c.player.y,10).t>1);
 }
});
test('morte e Recomeçar retornam ao checkpoint da queda com vida e proteção',()=>{
 const c=world();c.v5_checkpoint_gravar(refs.Room_Desmoronada,210,360);room(c,'Room_Corredor');
 c.global.inventario_cano=true;c.global.inventario_pistola=true;c.global.v5_duto_ativo=true;
 c.v5_reiniciar_checkpoint();assert.equal(c.global.spawn_room,refs.Room_Desmoronada);assert(!c.global.v5_duto_ativo);
 room(c,'Room_Desmoronada');playerCreate(c);assert.deepEqual([c.player.x,c.player.y],[210,360]);
 assert.equal(c.player.vida,100);assert(c.player.invulneravel);assert.equal(c.player.alarm[0],120);
 assert(c.global.inventario_cano&&c.global.inventario_pistola);
 const step=source('objects/Obj_jogador/Step_0.gml');assert(step.includes('if (vida <= 0) {\n    v5_reiniciar_checkpoint();'));
 assert(source('objects/Obj_pause/Step_0.gml').includes('v5_reiniciar_checkpoint();'));
});
test('rooms permanecem separadas; todas as posições de transição são livres',()=>{
 const c=world(),links=[];
 for(const n of ['Room_Desmoronada','Room_Corredor','Room_Pesquisa','Room_Biblioteca','Room1'])
  for(const p of room(c,n))if(p.tipo_passagem!=='elevador')links.push([p.destino.description,p.spawn_x,p.spawn_y]);
 for(const [n,x,y] of links){room(c,n);assert(c.bunker_varrer_paredes(x,y,x,y,10).t>1,n+' chegada bloqueada');}
 assert(!Object.hasOwn(refs,'Room_Fase1'));
});
console.log(passed+' testes de fluxo v5.2 passaram; APIs GML simuladas.');
