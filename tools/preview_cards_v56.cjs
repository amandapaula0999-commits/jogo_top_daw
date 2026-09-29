process.env.BUNKER_SKIP_TESTS='1';
const fs=require('node:fs'),path=require('node:path');
const {renderer}=require('./menu_preview_v419.cjs');
const {run,root}=require('./test_regressions.cjs');
async function main(){
 const r=await renderer();r.c.animacao_cartao=[1,0,0,0];r.draw();
 fs.writeFileSync(path.join(root,'PREVIA_MENU_V5_6.png'),r.screen.toBuffer('image/png'));
 r.c.global.pause_aberto=true;r.c.pause_animacao_cartao=[1,0,0,0];
 run(r.c,'objects/Obj_jogador/Draw_64.gml');
 fs.writeFileSync(path.join(root,'PREVIA_PAUSE_V5_6.png'),r.screen.toBuffer('image/png'));
 console.log('Prévias dos eventos Draw reais, via Canvas; não são execução GameMaker.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
