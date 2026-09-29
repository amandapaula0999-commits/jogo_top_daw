/* Executa eventos GML no harness do projeto e testa a geometria real da Room.
 * Não compila GML nem substitui a execução no GameMaker.
 */
process.env.BUNKER_SKIP_TESTS = '1';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {fixture, run, refs} = require('./test_regressions.cjs');
const root = path.resolve(__dirname, '..');
const load = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const room = load('rooms/Room_Manutencao_N2/Room_Manutencao_N2.yy');
const instances = room.layers.flatMap(l => l.instances || []);
const wallData = instances.filter(i => i.objectId.name === 'Obj_parede');
const maskData = fs.readFileSync(path.join(root,'sprites/Spr_mascara_jogador/Spr_mascara_jogador.yy'),'utf8');
assert(maskData.includes('"bbox_right":21'));

let total = 0;
function test(label, fn) { fn(); total++; console.log('OK: '+label); }

function makeRoom(open=false) {
    const c=fixture();
    c.room=refs.Room_Manutencao_N2;
    c.room_width=room.roomSettings.Width; c.room_height=room.roomSettings.Height;
    c.actors=[];c.walls=[];
    for(const w of wallData) {
        const a=c.instance_create_depth(w.x,w.y,200,refs.Obj_parede);
        c.image_xscale=w.scaleX;c.image_yscale=w.scaleY;
        run(c,'objects/Obj_parede/Create_0.gml');
        Object.assign(a,{largura:c.largura,altura:c.altura});
    }
    c.scene=c.instance_create_depth(0,0,900,refs.Obj_sala_manutencao_cenario);
    run(c,'objects/Obj_mapa/Create_0.gml');
    c.x=257;c.y=253;
    c.global.manutencao_porta_aberta=open;
    c.instance_destroy=a=>{
        c.actors=c.actors.filter(v=>v!==a);
        c.walls=c.walls.filter(v=>v!==a);
    };
    c.collision_rectangle=(l,t,r,b)=>{
        const p=c.player;
        return p.x+10>=l && p.x-11<=r && p.y+11>=t && p.y-4<=b ? p : c.noone;
    };
    run(c,'objects/Obj_porta_manutencao/Create_0.gml');
    return c;
}
function step(c,key='',frames=1){
 for(let i=0;i<frames;i++){
  c.keys.clear();const code=key==='SPACE'?c.vk_space:c.ord('E');
  if(key&&key!==c.held)c.keys.add(code);
  c.held=key;c.keyboard_check=k=>!!key&&k===code;
  run(c,'objects/Obj_porta_manutencao/Step_0.gml');
 }
 c.keys.clear();
}
function start(c){c.player.x=257;c.player.y=275;step(c);return c;}
function open(c){start(c);c.global.inventario_pe_cabra=true;step(c,'E',180);assert(c.aberta);}
function clear(c,x,y) {
    if(x<40||x>c.room_width-40||y<40||y>c.room_height-40)return false;
    return !c.walls.some(w=>x+10>=w.x && x-11<w.x+w.largura && y+11>=w.y && y-4<w.y+w.altura);
}
function reachable(c, start) {
    const seen=new Set(),queue=[start];
    const key=(x,y)=>y*c.room_width+x;
    assert(clear(c,...start),'spawn dentro de parede');
    seen.add(key(...start));
    for(let i=0;i<queue.length;i++) {
        const [x,y]=queue[i];
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx=x+dx,ny=y+dy,k=key(nx,ny);
            if(!seen.has(k)&&clear(c,nx,ny)){seen.add(k);queue.push([nx,ny]);}
        }
    }
    return (x,y)=>seen.has(key(x,y));
}

test('porta sem ferramenta fica bloqueada; mensagem precede pedido de ajuda',()=>{
 const c=start(makeRoom());assert(!c.aberta&&!reachable(c,[92,88])(257,180));
 step(c,'E');assert(c.fala_texto.includes('trancada'));assert(c.global.dialogo_ativo&&!c.aberta);
 step(c,'',120);assert(c.fala_texto.includes('Socorro'));assert(c.global.deposito_ajuda_ouvida);
 step(c,'',40);step(c,'SPACE');assert(!c.global.dialogo_ativo&&!c.aberta);
});
test('visita à sala de ferramentas muda orientação para voltar e pegar pé de cabra',()=>{
 const c=start(makeRoom());c.global.visitou_ferramentas=true;step(c,'E');assert(c.fala_texto.includes('voltar à sala de ferramentas'));
});
test('segurar E exige três segundos em 30/60/120 FPS; abre sem trocar de room',()=>{
 for(const fps of [30,60,120]){
  const c=start(makeRoom());c.global.inventario_pe_cabra=true;c.delta_time=1e6/fps;
  step(c,'E',fps*3-1);assert(!c.aberta);step(c,'E');assert(c.aberta&&c.global.manutencao_porta_aberta);assert.equal(c.scene.image_index,1);assert(!c.eventos.some(e=>e[0]==='goto'));
 }
});
test('soltar E, afastar e pausar interrompem esforço; não basta clicar',()=>{
 const c=start(makeRoom());c.global.inventario_pe_cabra=true;step(c,'E',90);step(c);assert.equal(c.esforco,0);
 step(c,'E',90);c.player.x=100;step(c,'E');assert.equal(c.esforco,0);c.player.x=257;step(c);step(c,'E',90);
 c.global.pause_aberto=true;step(c,'E',100);assert(!c.aberta&&c.esforco===0);c.global.pause_aberto=false;step(c);step(c,'E',180);assert(c.aberta);
});
test('porta aberta permite chegar ao homem; caixas/prateleiras/corpo bloqueiam',()=>{
 const c=makeRoom();open(c);const can=reachable(c,[92,88]);assert(can(257,181));assert(can(317,185));
 for(const xy of [[175,130],[310,127],[310,163]])assert(!can(...xy));
});
test('crachá só no homem, libera pesquisa e persiste ao reiniciar no checkpoint',()=>{
 const c=makeRoom();open(c);assert(!c.global.inventario_cartao_acesso);c.player.x=317;c.player.y=185;step(c);step(c,'E');assert(c.global.inventario_cartao_acesso&&c.fala_texto.includes('Crachá'));
 assert(c.v53_porta_liberada({chave_exigida:'laboratorio'}));c.v5_checkpoint_gravar(refs.Room_Manutencao_N2,92,88);c.v5_reiniciar_checkpoint();assert(c.global.inventario_cartao_acesso&&c.global.manutencao_porta_aberta);
 c.bunker_iniciar(true);assert(!c.global.inventario_cartao_acesso&&!c.global.manutencao_porta_aberta&&!c.global.visitou_ferramentas);
});
test('caixinha dá apenas chave; ferramentas registra visita persistente',()=>{
 const c=fixture();const find=c.instance_find;c.instance_find=(k,i)=>find(k,i)||c.noone;c.room=refs.Room_Funcionarios;c.player.x=404;c.player.y=119;run(c,'objects/Obj_mapa/Create_0.gml');c.keys.add(c.ord('E'));run(c,'objects/Obj_mapa/Step_0.gml');assert(c.global.chave_sala_ferramentas&&!c.global.inventario_cartao_acesso);
 c.room=refs.Room_Ferramentas_N2;run(c,'objects/Obj_mapa/Create_0.gml');assert(c.global.visitou_ferramentas);c.bunker_iniciar(false);assert(c.global.visitou_ferramentas);
});
test('reentrada mantém cobertura removida e porta aberta',()=>{
 const c=makeRoom(true);assert(c.aberta&&c.bloqueio===c.noone);assert.equal(c.scene.image_index,1);
});
test('fala de socorro aparece mesmo com diálogo travando movimento; esforço informa segundos',()=>{
 const c=start(makeRoom());const find=c.instance_find;c.instance_find=(k,i)=>k===refs.Obj_porta_manutencao?c:(find(k,i)||c.noone);
 step(c,'E');assert(c.bunker_fase2_conteudo(c).texto.includes('trancada'));step(c,'',120);assert(c.bunker_fase2_conteudo(c).texto.includes('Socorro'));
 step(c,'',40);step(c,'SPACE');step(c);c.global.inventario_pe_cabra=true;step(c,'E',60);assert(c.bunker_fase2_conteudo(c).comando.includes('SEGURE E'));
});
console.log(total+' testes da câmara fria passaram (GML/APIs simulados; sem VM/YYC).');
