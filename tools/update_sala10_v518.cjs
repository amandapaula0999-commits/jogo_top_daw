// Atualiza recursos estáticos: suporte vazio e falas rasterizadas.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const {createCanvas}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
function writeFrame(name,data,id,bytes){const folder=path.join(root,'sprites',name);fs.writeFileSync(path.join(folder,id+'.png'),bytes);fs.writeFileSync(path.join(folder,'layers',id,data.layers[0].name+'.png'),bytes);}
function reduce(name,keep){const p=path.join(root,'sprites',name,name+'.yy'),d=JSON.parse(fs.readFileSync(p,'utf8'));for(const f of d.frames.slice(keep)){fs.rmSync(path.join(root,'sprites',name,f.name+'.png'),{force:true});fs.rmSync(path.join(root,'sprites',name,'layers',f.name),{recursive:true,force:true});}d.frames=d.frames.slice(0,keep);d.sequence.length=keep;d.sequence.tracks[0].keyframes.Keyframes=d.sequence.tracks[0].keyframes.Keyframes.slice(0,keep);return {p,d};}
const n='Spr_sala10_suporte',p=path.join(root,'sprites',n,n+'.yy'),d=JSON.parse(fs.readFileSync(p,'utf8'));
if(d.frames.length>1){const bytes=fs.readFileSync(path.join(root,'sprites',n,d.frames[1].name+'.png'));writeFrame(n,d,d.frames[0].name,bytes);const r=reduce(n,1);fs.writeFileSync(r.p,JSON.stringify(r.d,null,2));}
const messages=[
 ['Ferramentas comuns, bancadas e prateleiras.','À primeira vista, nada de especial.'],
 ['Espere... tem um pé de cabra pendurado na parede.','Vou dar uma olhada.'],
 ['[E] EXAMINAR PÉ DE CABRA',''],
 ['Um pé de cabra. Pode ser útil para abrir a sala fria.','[E] COLETAR'],
 ['PÉ DE CABRA ADICIONADO AO INVENTÁRIO','Vou guardá-lo para abrir a sala fria.'],
 ['O suporte está vazio.','Já guardei o pé de cabra.'],
 ['[E] EXAMINAR BANCADA',''],
 ['Uma bancada com ferramentas de manutenção.',''],
 ['[E] EXAMINAR PRATELEIRAS',''],
 ['Caixas e ferramentas organizadas nas prateleiras.','']
];
const r=reduce('Spr_sala10_feedback',messages.length);r.d.height=46;r.d.bbox_bottom=45;r.d.sequence.backdropHeight=46;
messages.forEach((lines,i)=>{const c=createCanvas(472,46),ctx=c.getContext('2d');ctx.fillStyle='#0e1818';ctx.fillRect(0,0,472,46);ctx.strokeStyle='#59685f';ctx.strokeRect(.5,.5,471,45);ctx.fillStyle='#ddd3b0';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((t,k)=>ctx.fillText(t,236,15+k*16));writeFrame('Spr_sala10_feedback',r.d,r.d.frames[i].name,c.toBuffer('image/png'));});
fs.writeFileSync(r.p,JSON.stringify(r.d,null,2));
console.log('Suporte vazio e 10 falas estáticas atualizados.');
