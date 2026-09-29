// Simulação do desenho usando GML real e sprites; não é captura do GameMaker.
process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {world}=require('./test_collisions.cjs'),{run,source,refs}=require('./test_regressions.cjs');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const read=f=>JSON.parse(source(f).replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
async function img(n){const meta=read(`sprites/${n}/${n}.yy`);return {meta,image:await loadImage(path.join(root,'sprites',n,meta.frames[0].name+'.png'))}}
(async()=>{
 const bg=await img('Spr_espera_cenario'),rec=await img('Spr_recepcao_cenario'),player=await img('Spr_jogador_idle_baixo');
 const room=read('rooms/Room_Armadilha/Room_Armadilha.yy');const i=room.layers.flatMap(l=>l.instances||[]).find(i=>i.objectId.name==='Obj_espera_cenario');
 const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 // Coloca recepção no buffer para comprovar que o Draw Begin a remove.
 ctx.drawImage(rec.image,0,0,1920,1080);
 const c=world(),v={};Object.assign(c,{room:refs.Room_Armadilha,room_width:512,room_height:384,armadilha_tempo:100,c_black:'#000',c_white:'#fff',window_get_width:()=>1920,window_get_height:()=>1080,gpu_set_texfilter(){},view_set_wport(){},view_set_hport(){},view_set_xport(){},view_set_yport(){},camera_set_view_size(id,w,h){v.w=w;v.h=h},camera_set_view_pos(id,x,y){v.x=x;v.y=y},draw_clear(color){ctx.save();ctx.resetTransform();ctx.fillStyle=color;ctx.fillRect(0,0,1920,1080);ctx.restore()},draw_set_alpha(a){ctx.globalAlpha=a},draw_set_color(color){ctx.fillStyle=color},make_color_rgb:(r,g,b)=>`rgb(${r},${g},${b})`,draw_rectangle(x,y,r,b){ctx.fillRect(x,y,r-x,b-y)}});
 c.bunker_configurar_tela();run(c,'objects/Obj_mapa/Draw_72.gml');assert.deepEqual([...ctx.getImageData(0,0,1,1).data],[0,0,0,255]);
 ctx.scale(1920/v.w,1080/v.h);ctx.translate(-v.x,-v.y);
 c.draw_self=()=>ctx.drawImage(bg.image,0,0,bg.meta.width*i.scaleX,bg.meta.height*i.scaleY);run(c,'objects/Obj_espera_cenario/Draw_0.gml');run(c,'objects/Obj_mapa/Draw_0.gml');
 const en=read('sprites/Spr_inimigo_parado_baixo/Spr_inimigo_parado_baixo.yy'),pl=read('sprites/Spr_jogador_parado_baixo/Spr_jogador_parado_baixo.yy');const scale=(en.bbox_bottom+1-en.bbox_top)*.55*.8/(pl.bbox_bottom+1-pl.bbox_top);
 ctx.translate(256,250);ctx.scale(scale,scale);ctx.drawImage(player.image,-player.meta.sequence.xorigin,-player.meta.sequence.yorigin);
 fs.writeFileSync(path.join(root,'PREVIA_TRANSICAO_CORRIGIDA.png'),canvas.toBuffer('image/png'));console.log('Prévia de transição gerada; fundo antigo limpo.');
})();
