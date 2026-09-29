process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict'),{world,objectEvent}=require('./test_collisions.cjs'),{run,source,refs}=require('./test_regressions.cjs');
const r=JSON.parse(source('rooms/Room_Pesquisa/Room_Pesquisa.yy')),walls=r.layers.flatMap(l=>l.instances||[]).filter(i=>i.objectId.name==='Obj_parede');
const c=world();c.room=refs.Room_Pesquisa;c.room_width=600;c.room_height=400;for(const w of walls)c.wall(w.x,w.y,w.scaleX*64,w.scaleY*64);run(c,'objects/Obj_mapa/Create_0.gml');assert.equal(c.walls.length,9);
const free=(x,y)=>x>=11&&y>=4&&x<589&&y<389&&!walls.some(w=>x+11>=w.x&&x-11<=w.x+w.scaleX*64&&y+11>=w.y&&y-4<=w.y+w.scaleY*64);
const q=[[86,108]],seen=new Set(['86,108']);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[2,0],[-2,0],[0,2],[0,-2]]){const a=x+dx,b=y+dy,k=`${a},${b}`;if(!seen.has(k)&&free(a,b)){seen.add(k);q.push([a,b]);}}}
for(const [x,y]of [[386,282],[524,316],[490,270],[430,210],[174,222],[530,180],[220,190],[370,190],[300,160],[300,260]])assert(seen.has(`${x},${y}`),`rota ${x},${y}`);
const ds=c.actors.filter(a=>a.kind===refs.Obj_porta);for(const d of ds){const keep={...d};objectEvent(c,d,'objects/Obj_porta/Create_0.gml');Object.assign(d,keep);}
c.player.x=86;c.player.y=108;c.keys.add(69);objectEvent(c,ds.find(d=>d.tipo_passagem==='porta'),'objects/Obj_porta/Step_0.gml');assert.equal(c.global.spawn_x,250);assert.equal(c.global.spawn_y,250);
c.player.x=524;c.player.y=316;const d=ds.find(d=>d.tipo_passagem==='duto');c.v5_passagem_atualizar(d);assert(c.global.v5_duto_ativo);assert.equal(c.global.spawn_room,refs.Room_Biblioteca);assert.equal(c.global.spawn_x,110);assert.equal(c.global.spawn_y,510);c.keys.clear();c.delta_time=50000;for(let i=0;i<23;i++)c.v5_passagem_atualizar(d);assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Biblioteca));
c.global.cutscene_ativa=false;c.global.diario_aberto=false;c.global.dialogo_ativo=false;c.tempo_apresentacao=0;c.player.x=386;c.player.y=282;c.keys.add(69);c.collision_line=(x,y,xx,yy)=>c.bunker_varrer_paredes(x,y,xx,yy,0).alvo;
const s=source('objects/Obj_mapa/Step_0.gml'),a=s.indexOf('if (indicio_tempo > 0)'),b=s.indexOf('if (room == Room_Armadilha &&',a);run(c,'documento',s.slice(a,b));assert.equal(c.global.evidencias.length,1);
console.log('OK: rotas ao redor da mesa, spawns, porta, documento e duto para Arquivos com flag de tela preta (simulado).');
