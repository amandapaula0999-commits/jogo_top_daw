// Composição com os sprites e escalas reais; não é captura do GameMaker.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8').replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
async function draw(ctx,name,x,y,sx=1,sy=sx){const d=read(`sprites/${name}/${name}.yy`);const img=await loadImage(path.join(root,'sprites',name,d.frames[0].name+'.png'));ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);ctx.drawImage(img,-d.sequence.xorigin,-d.sequence.yorigin);ctx.restore()}
(async()=>{
 const room=read('rooms/Room_Armadilha/Room_Armadilha.yy');const all=room.layers.flatMap(l=>l.instances||[]),bg=all.find(i=>i.objectId.name==='Obj_espera_cenario'),player=all.find(i=>i.objectId.name==='Obj_jogador');
 const canvas=createCanvas(512,384),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 await draw(ctx,'Spr_espera_cenario',bg.x,bg.y,bg.scaleX,bg.scaleY);
 const e=read('sprites/Spr_inimigo_parado_baixo/Spr_inimigo_parado_baixo.yy'),p=read('sprites/Spr_jogador_parado_baixo/Spr_jogador_parado_baixo.yy');
 const scale=(e.bbox_bottom+1-e.bbox_top)*.55*.8/(p.bbox_bottom+1-p.bbox_top);
 await draw(ctx,'Spr_jogador_idle_baixo',player.x,player.y,scale);
 const out=createCanvas(1024,768),d=out.getContext('2d');d.imageSmoothingEnabled=false;d.drawImage(canvas,0,0,1024,768);
 fs.writeFileSync(path.join(root,'PREVIA_SALA_ESPERA.png'),out.toBuffer('image/png'));console.log('Prévia atualizada.');
})();
