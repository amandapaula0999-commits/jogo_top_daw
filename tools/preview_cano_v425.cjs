// Monta uma prancha dos três quadros já renderizados pelos eventos do jogo.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{
 paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
(async()=>{
 const c=createCanvas(1200,660),d=c.getContext('2d');d.imageSmoothingEnabled=false;
 d.fillStyle='#111610';d.fillRect(0,0,1200,660);
 d.fillStyle='#e0c47d';d.font='24px sans-serif';d.fillText('CANO DIRECIONAL — GIFs originais, sem giro ou espelhamento',30,38);
 for(let i=0;i<3;i++){
  const im=await loadImage(path.join(__dirname,'preview_assets_frames',`0${i}.png`));
  d.drawImage(im,0,660,1200,160,0,85+i*190,1200,160);
  d.fillStyle='#d7c79b';d.font='16px sans-serif';
  d.fillText(`Quadro ${i+1} · direita / frente / costas / esquerda`,30,73+i*190);
 }
 fs.writeFileSync(path.join(root,'PREVIA_CANO_V4_25.png'),c.toBuffer('image/png'));
 console.log('PREVIA_CANO_V4_25.png');
})().catch(e=>{console.error(e);process.exitCode=1;});
