/* GML real e geometrias das Rooms com APIs simuladas. NÃO compila/executa GameMaker. */
process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict');
const {world,objectEvent}=require('./test_collisions.cjs');
const {run,source,refs}=require('./test_regressions.cjs');
const yy=p=>JSON.parse(source(p).replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
let passed=0;
function test(n,f){f();passed++;console.log('OK: '+n);}
function engine(){
 const c=world();c.c_white=0xffffff;
 const find=c.instance_find;c.instance_find=(r,n)=>r===refs.Obj_mapa?c:(find(r,n)||c.noone);
 const spawn=c.instance_create_depth;
 c.instance_create_depth=(x,y,d,k)=>{
  const a=spawn(x,y,d,k);Object.assign(a,{image_xscale:1,image_yscale:1,image_index:0,image_speed:0,alarm:[],visible:true});
  if(k===refs.Obj_homem_lagarto||k===refs.Obj_caracol_lab)c.s8_lagarto_iniciar(a);
  return a;
 };
 c.collision_rectangle=(l,t,r,b)=>c.walls.find(w=>l<w.x+w.largura&&r>=w.x&&t<w.y+w.altura&&b>=w.y)||c.noone;
 c.collision_line=(x,y,tx,ty)=>c.bunker_varrer_paredes(x,y,tx,ty,0).alvo;
 c.path_add=()=>({points:[]});c.path_exists=p=>!!p&&!p.deleted;c.path_delete=p=>p.deleted=true;
 c.path_clear_points=p=>p.points=[];c.path_get_number=p=>p.points.length;
 c.path_get_point_x=(p,i)=>p.points[i][0];c.path_get_point_y=(p,i)=>p.points[i][1];
 c.mp_grid_create=(x,y,w,h,cw,ch)=>({w,h,cw,ch,rects:[]});
 c.mp_grid_add_rectangle=(g,...r)=>g.rects.push(r);c.mp_grid_destroy=g=>g.deleted=true;
 c.mp_grid_path=(g,p,x,y,tx,ty)=>{
  const key=(x,y)=>y*g.w+x,cell=(x,y)=>[Math.floor(x/g.cw),Math.floor(y/g.ch)];
  const [sx,sy]=cell(x,y),[gx,gy]=cell(tx,ty),start=key(sx,sy),goal=key(gx,gy);
  const blocked=(ix,iy)=>ix<0||iy<0||ix>=g.w||iy>=g.h||g.rects.some(([l,t,r,b])=>ix>=Math.floor(l/g.cw)&&ix<=Math.floor(r/g.cw)&&iy>=Math.floor(t/g.ch)&&iy<=Math.floor(b/g.ch));
  if(blocked(sx,sy)||blocked(gx,gy))return false;
  const q=[[sx,sy]],prev=new Map([[start,null]]);
  for(let i=0;i<q.length&&!prev.has(goal);i++)for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=q[i][0]+dx,ny=q[i][1]+dy,k=key(nx,ny);
   if(!prev.has(k)&&!blocked(nx,ny)){prev.set(k,key(...q[i]));q.push([nx,ny]);}
  }
  if(!prev.has(goal))return false;
  const path=[];for(let k=goal;k!==null;k=prev.get(k))path.push([(k%g.w+.5)*g.cw,(Math.floor(k/g.w)+.5)*g.ch]);
  p.points=[[x,y],...path.reverse().slice(1),[tx,ty]];return true;
 };
 return c;
}
function enter(c,name){
 const r=yy(`rooms/${name}/${name}.yy`);c.room=refs[name];c.room_width=r.roomSettings.Width;c.room_height=r.roomSettings.Height;
 c.actors=[];c.walls=[];c.keys.clear();
 const all=r.layers.flatMap(l=>l.instances||[]),byName=new Map(all.map(i=>[i.name,i]));
 for(const o of r.instanceCreationOrder){const i=byName.get(o.name),n=i.objectId.name;
  if(n==='Obj_mapa'||n==='Obj_jogador')continue;
  const a=c.instance_create_depth(i.x,i.y,0,refs[n]);a.image_xscale=i.scaleX;a.image_yscale=i.scaleY;
  if(n==='Obj_parede')c.bunker_parede_configurar(a,64*i.scaleX,64*i.scaleY);
 }
 run(c,'objects/Obj_mapa/Create_0.gml');
 for(const p of c.actors.filter(a=>a.kind===refs.Obj_porta)){const keep={...p};objectEvent(c,p,'objects/Obj_porta/Create_0.gml');Object.assign(p,keep);}
 const p=all.find(i=>i.objectId.name==='Obj_jogador');c.player.x=p.x;c.player.y=p.y;c.player.vida=100;c.player.invulneravel=false;
 c.tempo_apresentacao=0;return c;
}
const depot=()=>enter(engine(),'Room_Deposito_N2');
const lab=()=>enter(engine(),'Room_Laboratorio_N2');
const actor=(c,n)=>c.actors.find(a=>a.kind===refs[n]);
function tick(c,key,frames=1){
 if(key)c.keys.add(key==='SPACE'?c.vk_space:key==='ESC'?c.vk_escape:c.ord(key));
 for(let i=0;i<frames;i++)(c.room===refs.Room_Deposito_N2?c.s8_step:c.lab11_step)(c);
 c.keys.clear();
}
function press(c,key){tick(c,null,13);tick(c,key);}
function openCold(c){c.global.inventario_pe_cabra=true;c.player.x=320;c.player.y=165;press(c,'E');for(const k of ['E','SPACE','E','SPACE'])press(c,k);}
function collect(c){openCold(c);press(c,'SPACE');tick(c,null,13);c.player.x=500;c.player.y=175;press(c,'E');}
function reflect(c){collect(c);for(let i=0;i<3;i++)press(c,'SPACE');tick(c,null,13);}
function ambush(c){reflect(c);c.player.x=320;c.player.y=165;tick(c);}
function use(c,p){c.keys.add(c.ord('E'));if(p.tipo_passagem!=='porta')c.v5_passagem_atualizar(p);else objectEvent(c,p,'objects/Obj_porta/Step_0.gml');c.keys.clear();}
function walkable(c,start){
 const clear=(x,y)=>x>=40&&x<=c.room_width-40&&y>=40&&y<=c.room_height-40&&c.collision_rectangle(x-11,y-4,x+10,y+11)===c.noone;
 assert(clear(...start),'spawn obstruído '+start);
 const q=[start],seen=new Set([start.join(',')]);
 for(let i=0;i<q.length;i++)for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){
  const x=q[i][0]+dx,y=q[i][1]+dy,k=[x,y].join(',');if(!seen.has(k)&&clear(x,y)){seen.add(k);q.push([x,y]);}
 }
 return (x,y,r=8)=>q.some(([px,py])=>Math.hypot(px-x,py-y)<=r);
}
test('seis acessos separados; Depósito exige chave e laboratório exige cartão mesmo em debug',()=>{
 const c=enter(engine(),'Room_Corredor_N2'),ports=c.actors.filter(a=>a.kind===refs.Obj_porta);
 assert.equal(ports.length,6);const can=walkable(c,[1030,186]);
 for(const [name,x,key]of[['Room_Deposito_N2',380,'chave_deposito'],['Room_Laboratorio_N2',160,'inventario_cartao_acesso']]){
  const p=ports.find(p=>p.destino===refs[name]);assert(p&&can(x,145));c.player.x=x;c.player.y=145;
  assert(!c.v53_porta_liberada(p));use(c,p);assert(!c.eventos.some(e=>e[0]==='goto'));
  c.global[key]=true;use(c,p);assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs[name]));c.eventos.length=0;
 }
});
test('câmara fechada bloqueia passagem e oculta corpo/cartão; pé de cabra é obrigatório',()=>{
 const c=depot(),can=walkable(c,[236,345]);assert.equal(c.walls.length,17);
 assert(!actor(c,'Obj_s8_corpo').visible&&!actor(c,'Obj_s8_cartao').visible);
 assert(can(320,165));assert(!can(500,175));c.player.x=320;c.player.y=165;press(c,'E');
 assert(!c.s8_esforco&&c.s8_aviso.includes('pé de cabra'));
});
test('esforço alterna E/Espaço, permite erro, expiração e nova tentativa sem abrir',()=>{
 for(const fail of ['wrong','timeout','cancel']){
  const c=depot();c.global.inventario_pe_cabra=true;c.player.x=320;c.player.y=165;press(c,'E');assert(c.s8_esforco);
  if(fail==='wrong')press(c,'SPACE');else if(fail==='cancel')press(c,'ESC');else tick(c,null,105);
  assert(!c.s8_esforco&&!c.global.s8_porta_aberta&&!c.global.cutscene_ativa);assert.equal(c.global.s8_estado,'fechada');
  press(c,'E');assert(c.s8_esforco);
 }
});
test('quatro esforços abrem a porta, removem só seu colisor e revelam o corpo',()=>{
 const c=depot();openCold(c);assert(c.global.s8_porta_aberta&&c.global.dialogo_ativo);assert.equal(c.walls.length,16);
 assert.equal(c.global.s8_estado,'corpo');assert(actor(c,'Obj_s8_corpo').visible&&actor(c,'Obj_s8_cartao').visible);
 assert(c.s8_conteudo(c).texto.includes('cheguei tarde'));assert(walkable(c,[236,345])(500,175));
 assert(!actor(c,'Obj_homem_lagarto'));
});
test('cartão é salvo antes da reflexão; ruído único vem depois do texto; emboscada só ao sair',()=>{
 const c=depot();collect(c);assert(c.global.inventario_cartao_acesso);assert(!actor(c,'Obj_s8_cartao').visible);
 assert.equal(c.global.s8_estado,'reflexao');assert(!c.global.s8_ruido_tocou);
 for(let p=0;p<3;p++){assert.equal(c.global.s8_pagina,p);press(c,'SPACE');if(p<2)assert(!c.global.s8_ruido_tocou);}
 assert(c.global.dialogo_ativo,'proteção contra arremesso pelo mesmo Espaço');tick(c,null,13);assert(!c.global.dialogo_ativo);
 assert(c.global.s8_ruido_tocou);assert.equal(c.eventos.filter(e=>e[0]==='play'&&e[1]===refs.Snd_barril).length,1);
 tick(c,null,20);assert(!actor(c,'Obj_homem_lagarto'));c.player.x=320;c.player.y=165;tick(c);
 assert.equal(c.global.s8_estado,'combate');assert(actor(c,'Obj_homem_lagarto'));tick(c,null,20);
 assert.equal(c.actors.filter(a=>a.kind===refs.Obj_homem_lagarto).length,1);
 assert.equal(c.eventos.filter(e=>e[0]==='play'&&e[1]===refs.Snd_barril).length,1);
});
test('emboscada fecha saída; vitória libera porta e não reaparece na volta',()=>{
 const c=depot();ambush(c);const p=c.actors.find(a=>a.chave_exigida==='s8_saida');
 c.player.x=236;c.player.y=370;use(c,p);assert(!c.eventos.some(e=>e[0]==='goto'));assert(!c.v53_porta_liberada(p));
 const e=actor(c,'Obj_homem_lagarto');c.bunker_aplicar_impacto(e,40);c.s8_lagarto_step(e);
 assert.equal(c.global.s8_estado,'resolvido');assert(c.v53_porta_liberada(p));use(c,p);
 assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Corredor_N2));
 enter(c,'Room_Deposito_N2');assert(!actor(c,'Obj_homem_lagarto')&&c.global.inventario_cartao_acesso);
});
test('duto inativo antes do evento; fuga válida preserva cartão e vida do inimigo',()=>{
 const c=depot();c.player.x=55;c.player.y=185;use(c,c.s8_duto);assert(!c.global.v5_duto_ativo);
 ambush(c);const e=actor(c,'Obj_homem_lagarto');c.bunker_aplicar_impacto(e,5);
 c.player.x=100;c.player.y=185;use(c,c.s8_duto);assert(!c.global.v5_duto_ativo);
 c.player.x=55;c.player.y=185;use(c,c.s8_duto);assert.equal(c.global.s8_estado,'fugiu');assert(c.global.v5_duto_ativo);
 for(let i=0;i<70;i++)c.v5_passagem_atualizar(c.s8_duto);
 assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Corredor_N2));
 enter(c,'Room_Deposito_N2');assert.equal(actor(c,'Obj_homem_lagarto').vida,35);assert(c.global.inventario_cartao_acesso);
 assert(c.v53_porta_liberada(c.actors.find(a=>a.chave_exigida==='s8_saida')));
});
test('checkpoint conserva cartão, câmara, reflexão e combate; novo jogo limpa ambos os setores',()=>{
 const c=depot();collect(c);press(c,'SPACE');enter(c,'Room_Deposito_N2');assert.equal(c.global.s8_pagina,1);assert(c.global.dialogo_ativo);
 press(c,'SPACE');press(c,'SPACE');tick(c,null,13);c.v5_reiniciar_checkpoint();enter(c,'Room_Deposito_N2');
 assert(c.global.inventario_cartao_acesso&&c.global.s8_porta_aberta);assert(!actor(c,'Obj_s8_cartao').visible);
 c.global.lab11_derrotados[1]=true;c.global.lab11_leituras[3]=true;c.bunker_iniciar(false);assert(c.global.lab11_derrotados[1]);
 c.bunker_iniciar(true);assert(!c.global.inventario_cartao_acesso&&!c.global.s8_porta_aberta&&!c.global.lab11_derrotados.some(Boolean)&&!c.global.lab11_leituras.some(Boolean));
});
test('perseguição contorna cápsulas/parede; ataques têm aviso e não acertam através da parede',()=>{
 const c=lab();assert.equal(c.actors.filter(a=>a.kind===refs.Obj_homem_lagarto).length,2);assert(actor(c,'Obj_caracol_lab'));
 for(const e of c.actors.filter(a=>a.kind===refs.Obj_homem_lagarto||a.kind===refs.Obj_caracol_lab)){
  c.player.x=320;c.player.y=344;
  for(let i=0;i<1800&&Math.hypot(e.x-c.player.x,e.y-c.player.y)>39;i++){
   c.s8_lagarto_step(e);assert(!c.s8_pe_bloqueado(e,e.x,e.y),'inimigo invadiu parede/cápsula');
  }
  assert(Math.hypot(e.x-c.player.x,e.y-c.player.y)<=39,'perseguição presa '+e.kind.description+' em '+e.x+','+e.y+' rota '+JSON.stringify(e.caminho.points)+' índice '+e.rota_indice);
 }
 const e=actor(c,'Obj_homem_lagarto');e.x=300;e.y=344;e.ataque_espera=0;e.ataque_tempo=0;c.player.invulneravel=false;c.player.vida=100;
 c.s8_lagarto_step(e);assert.equal(e.ataque_tempo,20);assert.equal(c.player.vida,100);
 for(let i=0;i<20;i++)c.s8_lagarto_step(e);assert.equal(c.player.vida,88);
 c.player.invulneravel=false;c.player.vida=100;e.ataque_tempo=1;c.wall(309,300,2,70);c.s8_lagarto_step(e);assert.equal(c.player.vida,100);
});
test('bala e cano atingem os novos inimigos, mas cápsulas impedem impacto',()=>{
 for(const kind of [refs.Obj_homem_lagarto,refs.Obj_caracol_lab])for(const proj of [refs.Obj_bala,refs.Obj_canoAremesado]){
  const c=engine();c.room=refs.Room_Laboratorio_N2;const e=c.instance_create_depth(240,200,0,kind),hp=e.vida;
  const b=c.bunker_caixa_dano(e),p=c.projectile(proj,b.l-70,b.t+15);p.velocidade=250;c.bunker_projetil_passo(p);assert(e.vida<hp);
  const hp2=e.vida;c.wall(b.l-35,b.t-20,10,100);const p2=c.projectile(proj,b.l-90,b.t+15);p2.velocidade=250;c.bunker_projetil_passo(p2);assert.equal(e.vida,hp2);
 }
});
test('laboratório tem rotas livres para cinco inspeções, saída e spawns sem sobrepor cápsulas',()=>{
 const c=lab();assert.equal(c.walls.length,17);const can=walkable(c,[320,344]);
 for(const [x,y]of c.lab11_pontos)assert(can(x,y),[x,y]+' sem acesso');assert(can(320,375));
 for(const e of c.actors.filter(a=>a.kind===refs.Obj_homem_lagarto||a.kind===refs.Obj_caracol_lab))assert(!c.s8_pe_bloqueado(e,e.x,e.y));
 for(const [x,y]of[[173,150],[173,310],[465,150],[465,310],[320,80]])assert(c.bunker_varrer_paredes(x,y,x,y,0).t<=1);
});
test('quatro espécimes e terminal: duas páginas, hipóteses e pista da cobra; leituras ficam registradas',()=>{
 const c=lab();
 for(let i=0;i<5;i++){
  [c.player.x,c.player.y]=c.lab11_pontos[i];press(c,'E');assert.equal(c.lab11_leitura,i);assert(c.global.dialogo_ativo);
  assert(c.lab11_conteudo(c).texto.length>40);press(c,'SPACE');assert.equal(c.lab11_pagina,1);
  if(i===3)assert(c.lab11_conteudo(c).texto.includes('exemplar adulto'));
  press(c,'SPACE');assert(c.global.lab11_leituras[i]);assert(c.global.dialogo_ativo);tick(c,null,13);assert(!c.global.dialogo_ativo);
 }
 enter(c,'Room_Laboratorio_N2');assert(c.global.lab11_leituras.every(Boolean));
 assert(c.lab11_texto(1,1).includes('confrontos'));assert(c.lab11_texto(2,1).includes('raças meio-humanas'));
});
test('matar no laboratório não altera a emboscada; derrotados não reaparecem; pode sair em combate',()=>{
 const c=lab();c.global.s8_estado='fugiu';c.global.s8_lagarto_vida=27;
 const e=actor(c,'Obj_homem_lagarto'),slot=e.lab11_slot;c.bunker_aplicar_impacto(e,99);c.s8_lagarto_step(e);
 assert(c.global.lab11_derrotados[slot]);assert.equal(c.global.s8_estado,'fugiu');assert.equal(c.global.s8_lagarto_vida,27);
 c.player.x=320;c.player.y=375;use(c,actor(c,'Obj_porta'));assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Corredor_N2));
 enter(c,'Room_Laboratorio_N2');assert(!c.actors.some(a=>a.lab11_slot===slot));
});
test('pausa/interfaces congelam esforço e leitura; inimigos não atacam durante o texto',()=>{
 for(const flag of ['pause_aberto','config_aberta','diario_aberto']){
  const c=depot();c.global.inventario_pe_cabra=true;c.player.x=320;c.player.y=165;press(c,'E');const t=c.s8_janela;c.global[flag]=true;tick(c,'E',100);assert.equal(c.s8_janela,t);
  const d=lab();d.player.x=231;d.player.y=159;press(d,'E');d.global[flag]=true;tick(d,'SPACE',50);assert.equal(d.lab11_pagina,0);
 }
 const c=lab(),e=actor(c,'Obj_homem_lagarto');e.ataque_tempo=1;c.global.dialogo_ativo=true;c.s8_lagarto_step(e);assert.equal(e.ataque_tempo,1);
});
test('sprites pré-carregados sem Draw/GUI nos novos objetos; colisores antes do mapa; recursos de rota liberados',()=>{
 for(const name of ['Obj_s8_cenario','Obj_s8_corpo','Obj_s8_cartao','Obj_s8_porta_fria','Obj_s8_acesso','Obj_homem_lagarto','Obj_laboratorio_cenario','Obj_caracol_lab']){
  const o=yy(`objects/${name}/${name}.yy`);assert(o.spriteId&&!o.parentObjectId);assert(!o.eventList.some(e=>e.eventType===8),name);
 }
 for(const name of ['Room_Deposito_N2','Room_Laboratorio_N2']){
  const r=yy(`rooms/${name}/${name}.yy`),a=r.layers.flatMap(l=>l.instances||[]),order=r.instanceCreationOrder.map(i=>i.name);
  assert.equal(a.filter(i=>i.objectId.name==='Obj_jogador').length,1);const map=a.find(i=>i.objectId.name==='Obj_mapa');
  for(const w of a.filter(i=>i.objectId.name==='Obj_parede'))assert(order.indexOf(w.name)<order.indexOf(map.name));
 }
 const c=lab(),e=actor(c,'Obj_homem_lagarto');objectEvent(c,e,'objects/Obj_homem_lagarto/CleanUp_0.gml');assert(e.grade.deleted&&e.caminho.deleted);
});
console.log(passed+' testes das Salas 8 e 11 passaram (GML/APIs simulados; sem VM/YYC).');
