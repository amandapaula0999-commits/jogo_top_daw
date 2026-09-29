const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../scripts/Scr_deposito/Scr_deposito.gml'),'utf8');
const code=s.slice(s.indexOf('function s34_lagarto_animar')).replace(/\bmod\b/g,'%');
const c={abs:Math.abs,floor:Math.floor,point_direction:(a,b,x,y)=>(Math.atan2(-y,x)*180/Math.PI+360)%360};
for(const d of ['direita','cima','esquerda','baixo'])for(const st of ['andando','parado'])c['Spr_lagarto_'+st+'_'+d]=st+'_'+d;
vm.createContext(c);vm.runInContext(code,c);
for(const [d,x,y] of [['direita',1,0],['cima',0,-1],['esquerda',-1,0],['baixo',0,1]]){
 const e={lado_anim:3,sprite_index:'old',image_index:0};c.s34_lagarto_animar(e,x,y);assert.equal(e.sprite_index,'andando_'+d);assert.equal(e.image_speed,1);
 e.image_index=2;c.s34_lagarto_animar(e,x,y);assert.equal(e.image_index,2);
 c.s34_lagarto_animar(e,0,0);assert.equal(e.sprite_index,'parado_'+d);assert.equal(e.image_speed,0);assert.equal(e.image_index,0);
}
console.log('OK: quatro direções, caminhada/repouso e continuidade dos quadros (simulado).');
