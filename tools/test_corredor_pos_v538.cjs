/* Layout real e eventos GML com APIs simuladas. Não executa o runtime GameMaker. */
process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict');
const {world,objectEvent}=require('./test_collisions.cjs');
const {run,source,refs}=require('./test_regressions.cjs');
const yy=p=>JSON.parse(source(p).replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
const room=yy('rooms/Room_Corredor_Pos/Room_Corredor_Pos.yy'),all=room.layers.flatMap(l=>l.instances||[]);
let total=0;function test(n,f){f();total++;console.log('OK: '+n);}
function scene(){
 const c=world();c.room=refs.Room_Corredor_Pos;c.room_width=room.roomSettings.Width;c.room_height=room.roomSettings.Height;c.actors=[];c.walls=[];
 for(const ref of room.instanceCreationOrder){
  const i=all.find(i=>i.name===ref.name),name=i.objectId.name;
  if(name==='Obj_mapa'){run(c,'objects/Obj_mapa/Create_0.gml');continue;}
  if(name==='Obj_jogador'){c.player.x=i.x;c.player.y=i.y;continue;}
  const a=c.instance_create_depth(i.x,i.y,0,refs[name]);a.image_xscale=i.scaleX;a.image_yscale=i.scaleY;
  if(name==='Obj_parede')c.bunker_parede_configurar(a,64*i.scaleX,64*i.scaleY);
 }
 for(const p of c.actors.filter(a=>a.kind===refs.Obj_porta)){const keep={...p};objectEvent(c,p,'objects/Obj_porta/Create_0.gml');Object.assign(p,keep);}
 return c;
}
function walk(c){
 const valid=(x,y)=>x>=0&&y>=0&&x<704&&y<384&&!c.walls.some(w=>x+10>=w.x&&x-11<w.x+w.largura&&y+11>=w.y&&y-4<w.y+w.altura);
 assert(valid(c.player.x,c.player.y));const q=[[c.player.x,c.player.y]],seen=new Set([q[0].join(',')]);
 for(let i=0;i<q.length;i++)for(const [dx,dy]of[[2,0],[-2,0],[0,2],[0,-2]]){const x=q[i][0]+dx,y=q[i][1]+dy,k=[x,y].join(',');if(!seen.has(k)&&valid(x,y)){seen.add(k);q.push([x,y]);}}
 return (x,y,r=3)=>q.some(([px,py])=>Math.hypot(px-x,py-y)<=r);
}
test('704x384, cenário estático e 15 colisores nativos, sem obstáculos procedurais duplicados',()=>{
 const c=scene();assert.deepEqual([c.room_width,c.room_height],[704,384]);assert.equal(c.walls.length,15);assert.equal(c.props_cenario.length,0);
 assert.equal(all.filter(i=>i.objectId.name==='Obj_corredor_pos_cenario').length,1);
 assert.equal(yy('objects/Obj_corredor_pos_cenario/Obj_corredor_pos_cenario.yy').eventList.length,0);
 c.draw_set_alpha=()=>{throw Error('Desenho procedural no corredor');};run(c,'objects/Obj_mapa/Draw_0.gml');
});
test('entradas, portas e escadaria têm rota; pedras, caixas e paredes bloqueiam',()=>{
 const c=scene(),can=walk(c);
 for(const pt of[[352,286],[352,126],[550,190],[352,98],[352,314],[602,190],[150,186],[480,284]])assert(can(...pt),pt+' sem rota');
 for(const pt of[[60,186],[190,90],[222,94],[536,88],[210,315],[352,45],[352,350],[694,190]])assert(!can(...pt,0),pt+' sólido atravessável');
 const ps=c.actors.filter(a=>a.kind===refs.Obj_porta);assert.equal(ps.length,3);
 for(const [x,y]of[[352,98],[352,314],[602,190]])assert.equal(ps.filter(p=>c.bunker_porta_em_alcance(p,{x,y})).length,1);
 for(const w of c.walls){assert.equal(w.largura,64*w.image_xscale);assert.equal(w.altura,64*w.image_yscale);}
 assert(c.bunker_varrer_paredes(170,190,40,190,2).t<=1);
 assert(c.bunker_varrer_paredes(190,170,190,70,2).t<=1);
});
test('todas as salas ligadas chegam a locais livres; saídas preservam os destinos originais',()=>{
 const c=scene(),can=walk(c),expected=[[refs.Room_Biblioteca,800,142],[refs.Room1,683,580],[refs.Room_Corredor_N2,1030,186]];
 for(const [dest,x,y]of expected){const p=c.actors.find(a=>a.destino===dest);assert(p);assert.deepEqual([p.spawn_x,p.spawn_y],[x,y]);assert(p.visual_estatico);}
 for(const name of ['Room_Biblioteca','Room1','Room_Corredor_N2']){
  const d=world();d.room=refs[name];d.actors=[];d.walls=[];run(d,'objects/Obj_mapa/Create_0.gml');
  const p=d.actors.find(a=>a.destino===refs.Room_Corredor_Pos);assert(p);assert(can(p.spawn_x,p.spawn_y));
  for(const entry of c.actors.filter(a=>a.kind===refs.Obj_porta))assert(!c.bunker_porta_em_alcance(entry,{x:p.spawn_x,y:p.spawn_y}),'chegada dentro de interação');
 }
});
test('E atravessa portas; créditos só ocorrem na escada com chave e boss derrotado',()=>{
 for(const [dest,x,y]of[[refs.Room_Biblioteca,352,314],[refs.Room1,352,98]]){
  const c=scene(),p=c.actors.find(a=>a.destino===dest);c.player.x=x;c.player.y=y;
  objectEvent(c,p,'objects/Obj_porta/Step_0.gml');assert(!c.eventos.some(e=>e[0]==='goto'));
  c.keys.add(69);objectEvent(c,p,'objects/Obj_porta/Step_0.gml');assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===dest));
 }
 const c=scene(),s=c.actors.find(a=>a.tipo_passagem==='escada');c.global.modo_teste_portas_livres=false;
 c.player.x=602;c.player.y=190;c.v5_passagem_atualizar(s);assert(!c.global.vitoria_ativa);
 c.global.v53_chave_escada=true;c.v5_passagem_atualizar(s);assert(!c.global.vitoria_ativa);
 c.global.boss_derrotado=true;c.player.x=550;c.v5_passagem_atualizar(s);assert(!c.global.vitoria_ativa);
 c.player.x=602;c.v5_passagem_atualizar(s);assert(c.global.vitoria_ativa&&c.global.demo_creditos);
 c.v5_debug_avancar_room();assert.equal(c.global.spawn_room,refs.Room_Corredor_N2);assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[1030,186]);
});
test('spawns antigos são convertidos e checkpoint novo fica acessível',()=>{
 const body=source('objects/Obj_jogador/Create_0.gml');const begin=body.indexOf('// v5.38: converte'),end=body.indexOf('// Recupera spawns',begin);
 const cb=body.indexOf('if(room==Room_Corredor_Pos) {',end),ce=body.indexOf('// A escada salva',cb);
 for(const [x,y,tx,ty]of[[683,575,352,286],[683,190,352,126],[1120,384,550,190]]){
  const c=scene();c.x=x;c.y=y;run(c,'migracao_spawn_extraida',body.slice(begin,end));assert.deepEqual([c.x,c.y],[tx,ty]);assert(walk(c)(tx,ty));
  run(c,'checkpoint_extraido',body.slice(cb,ce));assert.deepEqual([c.global.v5_checkpoint_x,c.global.v5_checkpoint_y],[352,286]);
 }
});
test('cadáver permanece condicional à vitória, sem dano, e câmera cabe na sala compacta',()=>{
 const c=scene(),i=all.find(i=>i.objectId.name==='Obj_boss_morto');assert(i);assert.deepEqual([i.x,i.y],[433,149]);
 let corpse={};objectEvent(c,corpse,'objects/Obj_boss_morto/Create_0.gml');assert(corpse.deleted);
 c.global.boss_derrotado=true;corpse={};objectEvent(c,corpse,'objects/Obj_boss_morto/Create_0.gml');assert(!corpse.deleted);assert.equal(corpse.image_speed,0);
 for(const [w,h]of[[1366,768],[1024,768]]){c.window_get_width=()=>w;c.window_get_height=()=>h;c.bunker_configurar_tela();assert(c.global.tela_camera_w<=704&&c.global.tela_camera_h<=384);}
});
console.log(total+' grupos passaram (GML simulado; sem runtime GameMaker).');
