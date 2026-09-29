// Eventos GML e APIs simuladas. Não substitui compilação VM/YYC.
process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict');const {world,objectEvent}=require('./test_collisions.cjs');const {run,source,refs}=require('./test_regressions.cjs');
const room=JSON.parse(source('rooms/Room_Desmoronada/Room_Desmoronada.yy'));const all=room.layers.flatMap(l=>l.instances||[]),walls=all.filter(i=>i.objectId.name==='Obj_parede');assert.equal(walls.length,23);
const c=world();c.room=refs.Room_Desmoronada;c.room_width=525;c.room_height=340;for(const w of walls)c.wall(w.x,w.y,w.scaleX*64,w.scaleY*64);run(c,'objects/Obj_mapa/Create_0.gml');assert.equal(c.walls.length,23);assert.equal(c.bunker_props_cenario().length,0);
const free=(x,y)=>x>=11&&y>=4&&x<515&&y<329&&!walls.some(w=>x+11>=w.x&&x-11<=w.x+w.scaleX*64&&y+11>=w.y&&y-4<=w.y+w.scaleY*64);
const queue=[[105,180]],seen=new Set(['105,180']);assert(free(105,180));for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=`${a},${b}`;if(!seen.has(k)&&free(a,b)){seen.add(k);queue.push([a,b]);}}}
for(const [x,y] of [[263,60],[417,173],[195,274],[145,165],[130,225],[300,260],[410,140],[145,280],[420,250]])assert(seen.has(`${x},${y}`),`Rota indisponível ${x},${y}`);
console.log('OK: colisores estáticos, chegada e rotas para papéis, itens, inimigos e saída.');
c.global.cutscene_ativa=false;c.global.dialogo_ativo=false;c.global.diario_aberto=false;c.tempo_apresentacao=0;c.keys.add(69);
const full=source('objects/Obj_mapa/Step_0.gml');const start=full.indexOf('if (indicio_tempo > 0)');const end=full.indexOf('if (room == Room_Armadilha &&',start);assert(start>=0&&end>start);
c.collision_line=(x,y,xx,yy)=>c.bunker_varrer_paredes(x,y,xx,yy,0).alvo;
for(let i=0;i<2;i++){c.player.x=c.indicio_x[i];c.player.y=c.indicio_y[i];run(c,'interacao_papeis',full.slice(start,end));}
assert.equal(c.global.evidencias.length,2);assert(c.global.evidencias[0].titulo.includes('QUÍMICO'));run(c,'interacao_repetida',full.slice(start,end));assert.equal(c.global.evidencias.length,2);
console.log('OK: E registra os dois documentos no diário sem duplicação.');
const door=c.actors.find(a=>a.kind===refs.Obj_porta);assert(door.visual_estatico);const configured={...door};objectEvent(c,door,'objects/Obj_porta/Create_0.gml');Object.assign(door,configured);c.player.x=262.5;c.player.y=60;assert(c.bunker_porta_em_alcance(door,c.player));objectEvent(c,door,'objects/Obj_porta/Step_0.gml');assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Corredor));assert.equal(c.global.spawn_x,106);assert.equal(c.global.spawn_y,250);
const playerCreate=source('objects/Obj_jogador/Create_0.gml');const m=playerCreate.match(/if\s*\(room\s*==\s*Room_Desmoronada[^\n]*\{[\s\S]*?\n\}/);assert(m);c.x=105;c.y=180;c.global.v5_queda_pendente=true;run(c,'checkpoint_queda',m[0]);assert.equal(c.global.v5_checkpoint_room,refs.Room_Desmoronada);assert.equal(c.global.v5_checkpoint_x,105);assert.equal(c.global.v5_checkpoint_y,180);assert(!c.global.v5_queda_pendente);
console.log('OK: porta alcançável leva ao corredor e chegada grava checkpoint na Sala 1.');
