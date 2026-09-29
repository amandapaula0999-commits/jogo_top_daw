process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict');const {world}=require('./test_collisions.cjs');const {run,source,refs}=require('./test_regressions.cjs');
const r=JSON.parse(source('rooms/Room_Armadilha/Room_Armadilha.yy'));
const player=r.layers.flatMap(l=>l.instances||[]).find(i=>i.objectId.name==='Obj_jogador');assert.deepEqual([player.x,player.y],[256,250]);
const c=world();c.room=refs.Room_Recepcao;run(c,'objects/Obj_mapa/Create_0.gml');const door=c.actors.find(a=>a.destino===refs.Room_Armadilha);assert.deepEqual([door.spawn_x,door.spawn_y],[256,250]);c.v5_debug_avancar_room();assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[256,250]);
console.log('OK: entrada normal, atalho de teste e instância do jogador no mesmo ponto.');
for(const [w,h] of [[1280,720],[1920,1080],[2560,1440]]){
 const c=world(),v={};c.room=refs.Room_Armadilha;c.room_width=512;c.room_height=384;c.window_get_width=()=>w;c.window_get_height=()=>h;
 c.gpu_set_texfilter=v=>assert.equal(v,false);c.camera_set_view_size=(id,w,h)=>{v.cw=w;v.ch=h};c.camera_set_view_pos=()=>{};
 c.view_set_wport=(id,w)=>v.w=w;c.view_set_hport=(id,h)=>v.h=h;c.view_set_xport=(id,x)=>v.x=x;c.view_set_yport=(id,y)=>v.y=y;
 c.bunker_configurar_tela();assert.deepEqual([v.x,v.y,v.w,v.h],[0,0,w,h]);assert.equal(w/v.cw,h/v.ch);assert(Number.isInteger(w/v.cw));assert(v.cw>=512&&v.ch>=384);
}
console.log('OK: proporção 4:3 e ampliação inteira em três resoluções.');
{
 const c=world();c.room=refs.Room_Armadilha;let alpha;const overlays=[];
 Object.assign(c,{gpu_set_blendmode(){},draw_set_alpha(v){alpha=v},draw_set_color(){},draw_rectangle(){overlays.push(alpha)},bm_normal:0,c_black:0,c_white:0xffffff});
 run(c,'objects/Obj_mapa/Draw_73.gml');assert.deepEqual(overlays,[0]);
 const bg=r.layers.flatMap(l=>l.instances||[]).find(i=>i.objectId.name==='Obj_espera_cenario');const s=JSON.parse(source('sprites/Spr_espera_cenario/Spr_espera_cenario.yy'));assert.equal(s.width*bg.scaleX,512);assert.equal(s.height*bg.scaleY,384);
}
console.log('OK: sombra adicional zerada e fundo ocupa exatamente a sala.');
