process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict'),{world,objectEvent}=require('./test_collisions.cjs'),{run,source,refs}=require('./test_regressions.cjs');
const r=JSON.parse(source('rooms/Room_Biblioteca/Room_Biblioteca.yy')),walls=r.layers.flatMap(l=>l.instances||[]).filter(i=>i.objectId.name==='Obj_parede');
const c=world();c.room=refs.Room_Biblioteca;c.room_width=960;c.room_height=640;for(const w of walls)c.wall(w.x,w.y,w.scaleX*64,w.scaleY*64);run(c,'objects/Obj_mapa/Create_0.gml');assert.equal(c.walls.length,17);
const free=(x,y)=>x>=11&&y>=4&&x<949&&y<629&&!walls.some(w=>x+11>=w.x&&x-11<=w.x+w.scaleX*64&&y+11>=w.y&&y-4<=w.y+w.scaleY*64);
const q=[[110,510]],seen=new Set(['110,510']);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[2,0],[-2,0],[0,2],[0,-2]]){const a=x+dx,b=y+dy,k=`${a},${b}`;if(!seen.has(k)&&free(a,b)){seen.add(k);q.push([a,b]);}}}
for(const [x,y]of [[800,142],[860,510],[834,432],[786,280],[370,300],[566,300],[370,170],[566,470]])assert(seen.has(`${x},${y}`),`rota ${x},${y}`);
const ds=c.actors.filter(a=>a.kind===refs.Obj_porta);for(const d of ds){const keep={...d};objectEvent(c,d,'objects/Obj_porta/Create_0.gml');Object.assign(d,keep);}
c.global.modo_teste_portas_livres=false;
const door=ds.find(d=>d.chave_exigida==='cientista');assert(!c.v53_porta_liberada(door));assert(!c.v53_arquivo_liberado());const enemy=c.actors.find(a=>a.guarda_arquivo);enemy.vida=0;assert(c.v53_arquivo_liberado());c.global.v53_chave_cientista=true;assert(c.v53_porta_liberada(door));c.player.x=800;c.player.y=142;c.keys.add(69);objectEvent(c,door,'objects/Obj_porta/Step_0.gml');assert.equal(c.global.spawn_room,refs.Room_Corredor_Pos);
c.player.x=110;c.player.y=510;const d=ds.find(d=>d.tipo_passagem==='duto');c.v5_passagem_atualizar(d);assert(c.global.v5_duto_ativo);assert.equal(c.global.spawn_room,refs.Room_Pesquisa);assert.equal(c.global.spawn_x,524);assert.equal(c.global.spawn_y,316);
console.log('OK: chegada, corredores entre estantes, cientista/guarda, bloqueio por chave, saida e retorno pelo duto (simulado).');
