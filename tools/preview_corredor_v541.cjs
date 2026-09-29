/* Composição das instâncias reais da Room; não é captura do GameMaker. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8').replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
async function draw(d,n,x,y,sx=1,sy=sx){
 const s=read(`sprites/${n}/${n}.yy`),im=await loadImage(path.join(root,'sprites',n,s.frames[0].name+'.png'));
 d.drawImage(im,x-s.sequence.xorigin*sx,y-s.sequence.yorigin*sy,im.width*sx,im.height*sy);
}
(async()=>{
 const r=read('rooms/Room_Corredor_N2/Room_Corredor_N2.yy'),c=createCanvas(r.roomSettings.Width,r.roomSettings.Height),d=c.getContext('2d');d.imageSmoothingEnabled=false;
 for(const l of [...r.layers].sort((a,b)=>b.depth-a.depth))for(const i of l.instances||[]){
  const n=i.objectId.name;if(['Obj_parede','Obj_mapa','Obj_jogador'].includes(n))continue;
  const o=read(`objects/${n}/${n}.yy`);if(o.spriteId)await draw(d,o.spriteId.name,i.x,i.y,i.scaleX,i.scaleY);
 }
 const en=read('sprites/Spr_inimigo_parado_baixo/Spr_inimigo_parado_baixo.yy'),pl=read('sprites/Spr_jogador_parado_baixo/Spr_jogador_parado_baixo.yy');
 const scale=(en.bbox_bottom+1-en.bbox_top)*.55*.8/(pl.bbox_bottom+1-pl.bbox_top);
 await draw(d,'Spr_jogador_idle_baixo',850,185,scale);
 const out=createCanvas(c.width*2,c.height*2),g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0,out.width,out.height);
 fs.writeFileSync(path.join(root,'PREVIA_CORREDOR_FASE2_V5_41.png'),out.toBuffer('image/png'));
 console.log('PREVIA_CORREDOR_FASE2_V5_41.png');
})();
