// APIs simuladas: testa regressão de viewport, limpeza, câmera e cobertura dos blocos.
process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'..');
const {world}=require(path.join(root,'tools/test_collisions.cjs'));const {run,source,refs}=require(path.join(root,'tools/test_regressions.cjs'));
let count=0;
function setup(w,h){const c=world(),v={};c.room=refs.Room_Armadilha;c.room_width=512;c.room_height=384;
 Object.assign(c,{window_get_width:()=>w,window_get_height:()=>h,gpu_set_texfilter(){},camera_set_view_size(id,w,h){v.cw=w;v.ch=h},camera_set_view_pos(id,x,y){v.cx=x;v.cy=y},view_set_wport(id,w){v.w=w},view_set_hport(id,h){v.h=h},view_set_xport(id,x){v.x=x},view_set_yport(id,y){v.y=y}});return {c,v};}
for(const [w,h] of [[1366,768],[1920,1080],[1280,720],[2560,1440]]){
 const {c,v}=setup(w,h);c.bunker_configurar_tela();assert.deepEqual([v.x,v.y,v.w,v.h],[0,0,w,h]);
 const scale=w/v.cw;assert.equal(scale,h/v.ch);assert(Number.isInteger(scale));assert(v.cw>=512&&v.ch>=384);
 const left=-v.cx*scale,top=-v.cy*scale;assert(Math.abs(left-(w-512*scale)/2)<=scale);assert(Math.abs(top-(h-384*scale)/2)<=scale);
 const pos=[v.cx,v.cy];c.player.x=80;c.player.y=100;c.bunker_camera_atualizar();assert.deepEqual([v.cx,v.cy],pos);
 // Voltar para outra room elimina o enquadramento específico da espera.
 c.room=refs.Room_Desmoronada;c.room_width=960;c.room_height=700;c.bunker_configurar_tela();assert.deepEqual([v.x,v.y,v.w,v.h],[0,0,w,h]);count++;
}
console.log('OK: viewport completo e câmera centralizada, sem seguir o jogador, em quatro resoluções.');
{
 const {c}=setup(1920,1080);let clears=0;c.c_black=0;c.draw_clear=color=>{assert.equal(color,0);clears++};
 run(c,'objects/Obj_mapa/Draw_72.gml');assert.equal(clears,1);c.room=refs.Room_Recepcao;run(c,'objects/Obj_mapa/Draw_72.gml');assert.equal(clears,1);
 const room=JSON.parse(source('rooms/Room_Armadilha/Room_Armadilha.yy'));assert(room.viewSettings.clearDisplayBuffer&&room.viewSettings.clearViewBackground);assert.equal(room.views.find(v=>v.visible).objectId,null);
 const obj=JSON.parse(source('objects/Obj_mapa/Obj_mapa.yy'));assert(obj.eventList.some(e=>e.eventType===8&&e.eventNum===72));count++;
}
console.log('OK: Draw Begin limpa o fundo antigo e os buffers da room estão habilitados.');
{
 const {c}=setup(1920,1080);const rects=[];Object.assign(c,{armadilha_tempo:100,c_white:0xffffff,draw_set_alpha(){},draw_set_color(){},draw_rectangle(...args){rects.push(args)}});
 run(c,'objects/Obj_mapa/Draw_0.gml');assert(rects.length>0);
 for(const [l,t,r,b] of rects){assert.equal(r-l,4);assert.equal(b-t,4)}
 const row=rects.filter(r=>r[1]===250).sort((a,b)=>a[0]-b[0]);assert(row.length>1);for(let i=1;i<row.length;i++)assert.equal(row[i-1][2],row[i][0]);count++;
}
console.log('OK: blocos da queda encostam sem frestas. '+count+' verificações passaram.');
