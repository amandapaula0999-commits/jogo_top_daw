/* Composição dos sprites reais após derramamento, não captura de execução GameMaker. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const yy=n=>JSON.parse(fs.readFileSync(path.join(root,'sprites',n,n+'.yy'),'utf8').replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
(async()=>{
 const c=createCanvas(1366,768),d=c.getContext('2d');d.imageSmoothingEnabled=false;
 async function sprite(n,x,y,scale=1,alpha=1,frame=0){const s=yy(n),im=await loadImage(path.join(root,'sprites',n,s.frames[frame].name+'.png'));d.globalAlpha=alpha;d.drawImage(im,x-s.sequence.xorigin*scale,y-s.sequence.yorigin*scale,im.width*scale,im.height*scale);}
 await sprite('Spr_arena_cenario',0,0);
 await sprite('spr_acido',430,360,1,.78);
 await sprite('Spr_barril_chao',430,360,2.8);
 for(const [x,y]of[[880,220],[500,540],[980,530]])await sprite('Spr_barril',x,y,2.8);
 // Mesma compensação de origem usada no Draw real do boss.
 await sprite('Spr_boos_caido',485-16*3,363-20*3,3);
 const enemy=yy('Spr_inimigo_parado_baixo'),player=yy('Spr_jogador_parado_baixo');
 const scale=(enemy.bbox_bottom+1-enemy.bbox_top)*.55*.8/(player.bbox_bottom+1-player.bbox_top);
 await sprite('Spr_jogador_idle_cima',570,475,scale);
 fs.writeFileSync(path.join(root,'PREVIA_ARENA_V5_40.png'),c.toBuffer('image/png'));
 console.log('Prévia de composição salva: PREVIA_ARENA_V5_40.png');
})();
