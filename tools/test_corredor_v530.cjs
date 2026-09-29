process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict'),{world,objectEvent}=require('./test_collisions.cjs'),{run,source,refs}=require('./test_regressions.cjs');
const r=JSON.parse(source('rooms/Room_Corredor/Room_Corredor.yy')),walls=r.layers.flatMap(l=>l.instances||[]).filter(i=>i.objectId.name==='Obj_parede');
const c=world();c.room=refs.Room_Corredor;c.room_width=704;c.room_height=320;
for(const w of walls)c.wall(w.x,w.y,w.scaleX*64,w.scaleY*64);run(c,'objects/Obj_mapa/Create_0.gml');assert.equal(c.walls.length,7);
const free=(x,y)=>x>=11&&y>=4&&x<693&&y<309&&!walls.some(w=>x+11>=w.x&&x-11<=w.x+w.scaleX*64&&y+11>=w.y&&y-4<=w.y+w.scaleY*64);
const q=[[106,250]],seen=new Set(['106,250']);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[2,0],[-2,0],[0,2],[0,-2]]){const a=x+dx,b=y+dy,k=`${a},${b}`;if(!seen.has(k)&&free(a,b)){seen.add(k);q.push([a,b]);}}}
for(const [x,y]of [[250,250],[106,100],[552,164],[454,218],[510,156],[220,156],[390,220]])assert(seen.has(`${x},${y}`));assert(!q.some(([x])=>x>=600));
const doors=c.actors.filter(a=>a.kind===refs.Obj_porta);for(const d of doors){const saved={...d};objectEvent(c,d,'objects/Obj_porta/Create_0.gml');Object.assign(d,saved);}
c.keys.add(69);for(const [name,x,y,dest]of [['SALA 1',106,250,refs.Room_Desmoronada],['PESQUISA',250,250,refs.Room_Pesquisa]]){const d=doors.find(d=>d.rotulo===name);c.player.x=x;c.player.y=y;objectEvent(c,d,'objects/Obj_porta/Step_0.gml');assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===dest));}
c.player.x=106;c.player.y=100;const e=doors.find(d=>d.tipo_passagem==='elevador'),n=c.eventos.length;c.v5_passagem_atualizar(e);assert(e.mensagem_tempo>0);assert(!c.eventos.slice(n).some(e=>e[0]==='goto'));
console.log('OK: rotas, spawns, bloqueio total, portas Sala1/Pesquisa e elevador quebrado (APIs simuladas).');
