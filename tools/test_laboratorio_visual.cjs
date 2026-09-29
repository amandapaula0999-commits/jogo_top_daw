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
const lab=()=>enter(engine(),'Room_Laboratorio_N2');
const actor=(c,n)=>c.actors.find(a=>a.kind===refs[n]);
function tick(c,key,frames=1){
 if(key)c.keys.add(key==='SPACE'?c.vk_space:key==='ESC'?c.vk_escape:c.ord(key));
 for(let i=0;i<frames;i++)c.lab11_step(c);
 c.keys.clear();
}
function press(c,key){tick(c,null,13);tick(c,key);}
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

console.log(passed+" testes de combate e colisão do laboratório passaram (simulação).");
