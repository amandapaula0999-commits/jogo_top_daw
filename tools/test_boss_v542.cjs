/* Eventos GML reais com APIs GameMaker simuladas. Não compila nem executa VM/YYC. */
process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {world}=require('./test_collisions.cjs');
const {run,source,refs}=require('./test_regressions.cjs');
const yy=p=>JSON.parse(source(p).replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
const scripts=new Map();
function event(c,a,file){
 if(!scripts.has(file))scripts.set(file,new vm.Script('(function(){'+source(file).replace(/^\s*#(?:end)?region.*$/gm,'').replace(/\bexit\s*;/g,'return;').replace(/\bmod\b/g,'%')+'}).call(this)',{filename:file}));
 const local=vm.createContext({...c,...a});local.id=local;local.instance_destroy=(target=a)=>c.instance_destroy(target===local?a:target);
 scripts.get(file).runInContext(local,{timeout:1000});
 for(const k of Object.keys(local))if(k!=='id'&&(Object.hasOwn(a,k)||!Object.hasOwn(c,k)))a[k]=local[k];
}
function engine(){
 const c=world();c.c_white=0xffffff;
 c.collision_rectangle=(l,t,r,b,kind)=>{
  if(kind===refs.Obj_acido)return c.acid||c.noone;
  return c.walls.find(w=>l<w.x+w.largura&&r>=w.x&&t<w.y+w.altura&&b>=w.y)||c.noone;
 };
 c.collision_line=(x,y,tx,ty)=>c.bunker_varrer_paredes(x,y,tx,ty,0).alvo;
 c.path_add=()=>({points:[]});c.path_exists=p=>!!p&&!p.deleted;c.path_delete=p=>p.deleted=true;
 c.path_clear_points=p=>p.points=[];c.path_get_number=p=>p.points.length;
 c.path_get_point_x=(p,i)=>p.points[i][0];c.path_get_point_y=(p,i)=>p.points[i][1];
 c.mp_grid_create=(x,y,w,h,cw,ch)=>({w,h,cw,ch,rects:[]});
 c.mp_grid_add_rectangle=(g,...r)=>g.rects.push(r);c.mp_grid_destroy=g=>g.deleted=true;
 c.mp_grid_get_cell=(g,x,y)=>x<0||y<0||x>=g.w||y>=g.h||g.rects.some(([l,t,r,b])=>x>=Math.floor(l/g.cw)&&x<=Math.floor(r/g.cw)&&y>=Math.floor(t/g.ch)&&y<=Math.floor(b/g.ch))?-1:0;
 c.mp_grid_path=(g,p,x,y,tx,ty)=>{
  const key=(x,y)=>y*g.w+x;const sx=Math.floor(x/g.cw),sy=Math.floor(y/g.ch),gx=Math.floor(tx/g.cw),gy=Math.floor(ty/g.ch),goal=key(gx,gy);
  if(c.mp_grid_get_cell(g,sx,sy)<0||c.mp_grid_get_cell(g,gx,gy)<0)return false;
  const q=[[sx,sy]],prev=new Map([[key(sx,sy),null]]);
  for(let i=0;i<q.length&&!prev.has(goal);i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=q[i][0]+dx,ny=q[i][1]+dy,k=key(nx,ny);
   if(!prev.has(k)&&c.mp_grid_get_cell(g,nx,ny)>=0){prev.set(k,key(...q[i]));q.push([nx,ny]);}
  }
  if(!prev.has(goal))return false;
  const ps=[];for(let k=goal;k!==null;k=prev.get(k))ps.push([(k%g.w+.5)*g.cw,(Math.floor(k/g.w)+.5)*g.ch]);
  p.points=[[x,y],...ps.reverse().slice(1),[tx,ty]];return true;
 };
 c.room=refs.Room1;c.room_width=1366;c.room_height=768;c.actors=[];c.walls=[];
 for(const i of yy('rooms/Room1/Room1.yy').layers.flatMap(l=>l.instances||[])){if(i.objectId.name==='Obj_parede')c.wall(i.x,i.y,i.scaleX*64,i.scaleY*64);}
 run(c,'objects/Obj_mapa/Create_0.gml');
 c.global.v53_chave_escada=true;c.v54_boss_iniciar();const b=c.global.v54_boss;
 Object.assign(b,{alarm:[],image_index:0,sprite_index:refs.Spr_andando_baixo,image_alpha:1});
 event(c,b,'objects/Obj_boss/Create_0.gml');
 for(let t=0;t<264;t++)c.v54_atualizar();
 c.player.vida=100;c.player.x=130;c.player.y=230;
 return {c,b};
}
const step=(c,b,n=1)=>{for(let i=0;i<n&&!b.deleted;i++)event(c,b,'objects/Obj_boss/Step_0.gml');};
let count=0;function test(n,f){f();console.log('OK: '+n);count++;}
test('Golpe anunciado tem 1,1s, aplica uma vez e permite sair do círculo',()=>{
 const {c,b}=engine();c.player.x=b.x;c.player.y=b.y+35;b.ataque_intervalo=0;
 let hits=0;c.bunker_impacto=()=>hits++;
 step(c,b,65);assert.equal(hits,0);assert(b.ataque_ativo);assert.equal(b.impacto_raio,135);
 step(c,b);assert.equal(hits,1);step(c,b,40);assert.equal(hits,1);assert(!b.ataque_ativo);assert(b.contato_espera>0);
});
test('Ácido: uma aplicação por poça, 4,5s de vulnerabilidade, recuperação sem ficar preso',()=>{
 const {c,b}=engine();c.acid={name:'poca1'};
 step(c,b);assert.equal(b.vida,145);assert(b.derrotado);
 step(c,b,269);assert(!b.derrotado);assert.equal(b.vida,145);
 step(c,b,180);assert.equal(b.vida,145);assert(!b.derrotado);
 c.acid={name:'poca2'};step(c,b);assert.equal(b.vida,110);assert(b.derrotado);
});
test('Armadura bloqueia; cano e projétil causam dano durante a janela',()=>{
 const {c,b}=engine();c.bunker_aplicar_impacto(b,8);assert.equal(b.vida,180);
 c.acid={};step(c,b);c.bunker_aplicar_impacto(b,8);c.bunker_aplicar_impacto(b,5);assert.equal(b.vida,132);
});
test('Pausa, configuração, diário e diálogo congelam boss, ácido e barril',()=>{
 const {c,b}=engine();c.acid={};step(c,b);const acid={duracao:500,pulso:0,alpha_acido:.78};const barrel={respawn_tempo:100,atingido:false,sumindo:false};
 for(const key of ['pause_aberto','config_aberta','diario_aberto','dialogo_ativo']){
  c.global[key]=true;const before=[b.x,b.y,b.vulneravel_tempo,b.feedback_tempo];step(c,b,6);assert.deepEqual([b.x,b.y,b.vulneravel_tempo,b.feedback_tempo],before);
  event(c,acid,'objects/Obj_acido/Step_0.gml');event(c,barrel,'objects/Obj_barril/Step_0.gml');assert.equal(acid.duracao,500);assert.equal(barrel.respawn_tempo,100);c.global[key]=false;
 }
});
test('Preparação e vulnerabilidade têm duração equivalente a 30, 60 e 120 FPS',()=>{
 for(const fps of [30,60,120]){
  const {c,b}=engine();c.delta_time=1e6/fps;c.acid={};step(c,b,Math.round(fps*4.5));assert(!b.derrotado,'fps='+fps);
 }
});
test('Fuga contorna sólidos, quebra uma vez, abre porta e atravessa sem teleporte',()=>{
 for(const [x,y] of [[683,360],[1070,250],[1000,600],[295,145],[440,600],[1210,530],[1180,250],[170,340],[1050,610]]){
  const {c,b}=engine();b.x=x;b.y=y;b.vida=0;assert(!c.s8_pe_bloqueado(b,b.x,b.y));let frames=0,impacts=0;
  const conclude=c.v54_boss_concluir;c.v54_boss_concluir=()=>{impacts++;conclude();};
  while(!b.deleted&&frames<1200){const ox=b.x,oy=b.y;step(c,b);assert(Math.hypot(b.x-ox,b.y-oy)<=4.51,'salto');assert(!c.s8_pe_bloqueado(b,b.x,b.y),'parede');frames++;}
  assert(b.deleted,`fuga presa de ${x},${y}, atual ${b.x},${b.y}, etapa ${b.fuga_etapa}`);assert.equal(impacts,1);assert(c.global.boss_derrotado&&c.global.saida_aberta);assert(!c.instance_exists(c.global.parede_saida));assert(c.global.v54_porta.ativa);assert(!c.global.vitoria_ativa);
  event(c,b,'objects/Obj_boss/CleanUp_0.gml');assert.equal(b.grade,-1);assert(b.caminho.deleted);
 }
});
test('Contato não machuca durante fuga, vulnerabilidade, recuperação ou pausa',()=>{
 const {c,b}=engine();c.other=b;c.player.alarm=[];c.player.vida=100;c.place_meeting=()=>false;
 for(const state of ['fugindo','derrotado','ataque_ativo']){b[state]=true;event(c,c.player,'objects/Obj_jogador/Collision_Obj_boss.gml');assert.equal(c.player.vida,100);b[state]=false;}
 b.contato_espera=1;event(c,c.player,'objects/Obj_jogador/Collision_Obj_boss.gml');assert.equal(c.player.vida,100);
 b.contato_espera=0;event(c,c.player,'objects/Obj_jogador/Collision_Obj_boss.gml');assert.equal(c.player.vida,88);assert.equal(c.global.vida_jogador,88);
});
test('Carcaça só existe após vitória, fica fora da porta e não possui Draw nem combate',()=>{
 const {c}=engine();const rm=yy('rooms/Room_Corredor_Pos/Room_Corredor_Pos.yy');const placed=rm.layers.flatMap(l=>l.instances||[]).filter(i=>i.objectId.name==='Obj_boss_morto');assert.equal(placed.length,1);assert.deepEqual([placed[0].x,placed[0].y],[433,149]);
 const obj=yy('objects/Obj_boss_morto/Obj_boss_morto.yy');assert.equal(obj.eventList.length,1);assert.equal(obj.eventList[0].eventType,0);assert.equal(obj.spriteId.name,'Spr_boss_morto');
 let corpse={};event(c,corpse,'objects/Obj_boss_morto/Create_0.gml');assert(corpse.deleted);
 c.global.boss_derrotado=true;corpse={};event(c,corpse,'objects/Obj_boss_morto/Create_0.gml');assert(!corpse.deleted);assert.equal(corpse.image_speed,0);assert.equal(corpse.image_angle,0);assert.equal(corpse.depth,80);
 assert(!source('scripts/Scr_fluxo_v5/Scr_fluxo_v5.gml').includes('draw_sprite_ext(Spr_boos_caido,0,735'));
});
test('Retorno preserva vitória e passagem; novo jogo remove o corpo',()=>{
 const {c}=engine();c.global.boss_derrotado=true;
 for(const name of ['Room_Corredor_Pos','Room1','Room_Corredor_Pos']){
  c.actors=[];c.walls=[];c.room=refs[name];run(c,'objects/Obj_mapa/Create_0.gml');
  assert(c.global.boss_derrotado);assert(!c.instance_exists(refs.Obj_boss));
  if(name==='Room1'){assert(c.global.saida_aberta);assert(!c.instance_exists(c.global.parede_saida));}
  else {assert.equal(c.collision_rectangle(709,234,841,306,refs.Obj_parede),c.noone);}
 }
 run(c,'objects/Obj_menu/Create_0.gml');assert(!c.global.boss_derrotado);
 const corpse={};event(c,corpse,'objects/Obj_boss_morto/Create_0.gml');assert(corpse.deleted);
});
console.log(`${count} grupos de testes do boss na arena v5.40 aprovados. APIs simuladas; GameMaker não executado.`);
