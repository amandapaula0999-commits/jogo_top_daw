/* Geometria real e eventos GML com APIs simuladas; não compila nem executa VM/YYC. */
process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict');
const {world,objectEvent}=require('./test_collisions.cjs');
const {run,source,refs}=require('./test_regressions.cjs');
const read=p=>JSON.parse(source(p).replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
let total=0;function test(n,f){f();total++;console.log('OK: '+n);}
function scene(){
 const c=world(),r=read('rooms/Room_Recepcao/Room_Recepcao.yy');
 c.room=refs.Room_Recepcao;c.room_width=r.roomSettings.Width;c.room_height=r.roomSettings.Height;c.actors=[];c.walls=[];
 c.string_length=s=>s.length;c.string_copy=(s,start,n)=>s.slice(start-1,start-1+n);
 const all=r.layers.flatMap(l=>l.instances||[]),map=new Map(all.map(i=>[i.name,i]));
 for(const ref of r.instanceCreationOrder){
  const i=map.get(ref.name),n=i.objectId.name;
  if(n==='Obj_mapa'){run(c,'objects/Obj_mapa/Create_0.gml');continue;}
  if(n==='Obj_jogador'){c.player.x=i.x;c.player.y=i.y;continue;}
  const a=c.instance_create_depth(i.x,i.y,0,refs[n]);a.image_xscale=i.scaleX;a.image_yscale=i.scaleY;
  if(n==='Obj_parede')c.bunker_parede_configurar(a,i.scaleX*64,i.scaleY*64);
  if(n==='Obj_recepcionista')objectEvent(c,a,'objects/Obj_recepcionista/Create_0.gml');
 }
 for(const p of c.actors.filter(a=>a.kind===refs.Obj_porta)){const keep={...p};objectEvent(c,p,'objects/Obj_porta/Create_0.gml');Object.assign(p,keep);}
 c.npc=c.actors.find(a=>a.kind===refs.Obj_recepcionista);c.tempo_apresentacao=0;return c;
}
function use(c,p){c.keys.add(c.ord('E'));objectEvent(c,p,'objects/Obj_porta/Step_0.gml');c.keys.clear();}
function talk(c){c.keys.add(c.ord('E'));objectEvent(c,c.npc,'objects/Obj_recepcionista/Step_0.gml');c.keys.clear();}
function inspect(c){
 const s=source('objects/Obj_mapa/Step_0.gml');const start=s.indexOf('// Inspeção opcional'),end=s.indexOf('if (room == Room_Armadilha &&',start);
 c.keys.add(c.ord('E'));run(c,'inspecao_extraida',s.slice(start,end));c.keys.clear();
}
function canWalk(c){
 const valid=(x,y)=>x>=40&&y>=40&&x<=600&&y<=387&&!c.walls.some(w=>x+10>=w.x&&x-11<w.x+w.largura&&y+11>=w.y&&y-4<w.y+w.altura);
 assert(valid(c.player.x,c.player.y),'spawn preso');
 const q=[[c.player.x,c.player.y]],seen=new Set([q[0].join(',')]);
 for(let i=0;i<q.length;i++)for(const [dx,dy]of[[2,0],[-2,0],[0,2],[0,-2]]){
  const x=q[i][0]+dx,y=q[i][1]+dy,k=[x,y].join(',');if(!seen.has(k)&&valid(x,y)){seen.add(k);q.push([x,y]);}
 }
 return (x,y,r=8)=>q.some(([px,py])=>Math.hypot(px-x,py-y)<=r);
}
test('arte estática e 17 colisores na Room, sem paredes antigas invisíveis ou NPC duplicado',()=>{
 const c=scene(),r=read('rooms/Room_Recepcao/Room_Recepcao.yy');assert.deepEqual([c.room_width,c.room_height],[640,427]);assert.equal(c.walls.length,17);
 assert.equal(c.actors.filter(a=>a.kind===refs.Obj_recepcionista).length,1);assert.equal(c.props_cenario.length,0);
 const order=r.instanceCreationOrder.map(i=>i.name);assert(order.indexOf('inst_REC_DESK')<order.indexOf('inst_REC_PLAYER'));
 const obj=read('objects/Obj_recepcao_cenario/Obj_recepcao_cenario.yy');assert(!obj.eventList.some(e=>e.eventType===8));
 const spr=read('sprites/Spr_recepcao_cenario/Spr_recepcao_cenario.yy');assert.equal(spr.frames.length,1);assert.equal(spr.sequence.playbackSpeed,0);
 c.draw_set_alpha=()=>{throw Error('desenho procedural na recepção');};run(c,'objects/Obj_mapa/Draw_0.gml');
});
test('entrada alcança balcão, documentos, café, banco e ambas as portas; tapete não bloqueia',()=>{
 const c=scene(),can=canWalk(c);
 for(const pt of [[320,203],[430,204],[153,260],[505,290],[320,370],[583,217],[320,248],[110,339]])assert(can(...pt),pt+' sem caminho');
 for(const pt of [[320,150],[70,260],[510,340],[50,354],[585,344],[320,30]])assert(!can(...pt,0),pt+' atravessável');
});
test('fachada e atalho P chegam no mesmo ponto seguro, fora do gatilho de saída',()=>{
 const c=world();c.room=refs.Room_Externa;run(c,'objects/Obj_mapa/Create_0.gml');const p=c.actors.find(a=>a.destino===refs.Room_Recepcao);
 assert.deepEqual([p.spawn_x,p.spawn_y],[320,326]);c.v5_debug_avancar_room();assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[320,326]);
 const d=scene();assert(!d.bunker_porta_em_alcance(d.actors.find(a=>a.destino===refs.Room_Externa),d.player));
});
test('conversa é acionada pela frente do balcão e mantém as quatro falas originais',()=>{
 const c=scene();talk(c);assert(!c.npc.exibir_dialogo);
 c.player.x=320;c.player.y=203;talk(c);assert(c.npc.exibir_dialogo&&c.global.dialogo_ativo);
 const lines=[];
 for(let i=0;i<4;i++){
  lines.push(c.npc['fala_'+(i+1)]);objectEvent(c,c.npc,'objects/Obj_recepcionista/Step_0.gml');
  c.npc.char_index=c.npc.texto_completo.length;talk(c);
 }
 assert(!c.npc.exibir_dialogo&&!c.global.dialogo_ativo&&c.global.secretaria_orientou);
 assert(lines[0].includes('protocolo')&&lines[1].includes('à direita')&&lines[2].includes('luz verde'));
 assert(source('objects/Obj_recepcionista/Draw_64.gml').includes('bunker_painel(170, 554, 1026, 164)'));
});
test('papéis mantêm o indício 02 e não disputam a tecla E com a secretária',()=>{
 const c=scene();c.player.x=320;c.player.y=203;inspect(c);assert.equal(c.indicio_perto,-1);assert.equal(c.global.evidencias.length,0);
 c.player.x=430;c.player.y=204;talk(c);assert(!c.npc.exibir_dialogo);inspect(c);
 assert.equal(c.global.evidencias.length,1);assert(c.global.evidencias[0].titulo.includes('02 / VERSÕES DOS LAUDOS'));
 inspect(c);assert.equal(c.global.evidencias.length,1);
});
test('portas só funcionam com E; conversa libera integração e retorno conserva progresso',()=>{
 const c=scene();c.global.modo_teste_portas_livres=false;const p=c.actors.find(a=>a.destino===refs.Room_Armadilha);
 c.player.x=580;c.player.y=217;objectEvent(c,p,'objects/Obj_porta/Step_0.gml');assert(!c.eventos.some(e=>e[0]==='goto'));
 use(c,p);assert(!c.eventos.some(e=>e[0]==='goto'));c.global.secretaria_orientou=true;use(c,p);
 assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Armadilha));assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[683,405]);
 const q=c.actors.find(a=>a.destino===refs.Room_Externa);c.player.x=320;c.player.y=370;c.global.inventario_cartao_acesso=true;use(c,q);
 assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Externa));assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[683,355]);assert(c.global.secretaria_orientou&&c.global.inventario_cartao_acesso);
});
test('balcão, bancada e vasos bloqueiam projéteis; máscaras acompanham seus tamanhos',()=>{
 const c=scene();for(const w of c.walls){assert.equal(w.image_xscale*64,w.largura);assert.equal(w.image_yscale*64,w.altura);}
 for(const kind of [refs.Obj_bala,refs.Obj_canoAremesado]){
  const a=c.projectile(kind,320,250,90);a.velocidade=300;c.bunker_projetil_passo(a);assert(a.deleted||!a.em_voo);assert(a.y>182);
 }
 assert(c.bunker_varrer_paredes(150,245,50,245,0).t<=1);assert(c.bunker_varrer_paredes(150,345,35,345,0).t<=1);
});
test('câmera preserva proporções, cobre a Room e recepção não recebe sombra subterrânea',()=>{
 for(const [w,h]of[[1366,768],[1024,768]]){
  const c=scene();c.window_get_width=()=>w;c.window_get_height=()=>h;c.bunker_configurar_tela();
  assert(c.global.tela_camera_w<=640&&c.global.tela_camera_h<=427);
  const positions=[];c.camera_set_view_pos=(_id,x,y)=>positions.push([x,y]);
  for(const pt of[[320,203],[580,217],[320,370]]){[c.player.x,c.player.y]=pt;c.bunker_camera_atualizar();}
  for(const [x,y]of positions)assert(x>=0&&y>=0&&x<=640-c.global.tela_camera_w&&y<=427-c.global.tela_camera_h);
 }
 assert(source('objects/Obj_mapa/Draw_73.gml').includes('if (room == Room_Recepcao) sombra = 0;'));
 assert(source('objects/Obj_mapa/Draw_64.gml').includes('room != Room_Armadilha && !global.dialogo_ativo'));
});
console.log(total+' testes da recepção passaram (GML simulado; sem runtime GameMaker).');
