/* Prévia com os sprites reais. Não é captura de execução no GameMaker. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8').replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
async function draw(d,n,x,y,scale=1){
 const s=read(`sprites/${n}/${n}.yy`),im=await loadImage(path.join(root,'sprites',n,s.frames[0].name+'.png'));
 d.drawImage(im,x-s.sequence.xorigin*scale,y-s.sequence.yorigin*scale,im.width*scale,im.height*scale);
}
(async()=>{
 const r=read('rooms/Room_Corredor_Pos/Room_Corredor_Pos.yy'),c=createCanvas(704,384),d=c.getContext('2d');d.imageSmoothingEnabled=false;
 await draw(d,'Spr_corredor_pos_cenario',0,0);
 const corpse=r.layers.flatMap(l=>l.instances||[]).find(i=>i.objectId.name==='Obj_boss_morto');await draw(d,'Spr_boss_morto',corpse.x,corpse.y,3);
 const en=read('sprites/Spr_inimigo_parado_baixo/Spr_inimigo_parado_baixo.yy'),pl=read('sprites/Spr_jogador_parado_baixo/Spr_jogador_parado_baixo.yy');
 const scale=(en.bbox_bottom+1-en.bbox_top)*.55*.8/(pl.bbox_bottom+1-pl.bbox_top);
 await draw(d,'Spr_jogador_idle_baixo',352,216,scale);
 const out=createCanvas(1408,768),g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0,1408,768);
 fs.writeFileSync(path.join(root,'PREVIA_CORREDOR_POS_V5_38.png'),out.toBuffer('image/png'));
 console.log('PREVIA_CORREDOR_POS_V5_38.png');
})();
