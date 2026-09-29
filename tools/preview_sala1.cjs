// Prévia composta com sprites e escala reais; não é captura do runtime GameMaker.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8').replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
async function draw(ctx,name,x,y,s=1){const d=read(`sprites/${name}/${name}.yy`);const img=await loadImage(path.join(root,'sprites',name,d.frames[0].name+'.png'));ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);ctx.drawImage(img,-d.sequence.xorigin,-d.sequence.yorigin);ctx.restore();}
(async()=>{const canvas=createCanvas(525,340),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;await draw(ctx,'Spr_sala1_cenario',0,0,0.5);
const e=read('sprites/Spr_inimigo_parado_baixo/Spr_inimigo_parado_baixo.yy'),p=read('sprites/Spr_jogador_parado_baixo/Spr_jogador_parado_baixo.yy');const scale=(e.bbox_bottom+1-e.bbox_top)*.55*.8/(p.bbox_bottom+1-p.bbox_top);
await draw(ctx,'Spr_jogador_idle_baixo',105,180,scale);fs.writeFileSync(path.join(root,'PREVIA_SALA1.png'),canvas.toBuffer('image/png'));console.log('Prévia com jogador gerada.');})();
