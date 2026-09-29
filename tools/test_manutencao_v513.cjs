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
function step(c,press=false) {
    c.keys.clear();
    if(press)c.keys.add(c.ord('E'));
    run(c,'objects/Obj_porta_manutencao/Step_0.gml');
}
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

test('porta inferior adicionada após a escada sem substituir Funcionários ou retorno',()=>{
    const c=fixture();c.room=refs.Room_Corredor_N2;c.actors=[];c.walls=[];
    run(c,'objects/Obj_mapa/Create_0.gml');
    const doors=c.actors.filter(a=>a.kind===refs.Obj_porta);
    assert.equal(doors.length,6);
    const access=doors.find(a=>a.destino===refs.Room_Manutencao_N2);
    assert.deepEqual([access.x,access.y,access.spawn_x,access.spawn_y],[624,260,92,88]);
    assert(doors.some(a=>a.destino===refs.Room_Funcionarios));
    assert(doors.some(a=>a.destino===refs.Room_Corredor_Pos&&a.tipo_passagem==='escada'));
    const corr=load('rooms/Room_Corredor_N2/Room_Corredor_N2.yy');
    assert(corr.layers.flatMap(l=>l.instances||[]).some(i=>i.objectId.name==='Obj_acesso_manutencao_visual'));
});

test('entrada e volta com E preservam vida/inventário e usam spawns seguros',()=>{
    const c=fixture();c.room=refs.Room_Corredor_N2;c.actors=[];c.walls=[];
    run(c,'objects/Obj_mapa/Create_0.gml');
    const access=c.actors.find(a=>a.destino===refs.Room_Manutencao_N2);
    run(c,'objects/Obj_porta/Create_0.gml');Object.assign(c,access);
    c.player.x=624;c.player.y=220;c.keys.add(c.ord('E'));
    run(c,'objects/Obj_porta/Step_0.gml');
    assert.equal(c.global.spawn_room,refs.Room_Manutencao_N2);
    assert.equal(c.global.vida_jogador,72);
    assert.equal(c.global.caixas_mecanicas,3);
    assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Manutencao_N2));
    const s=makeRoom();
    assert(clear(s,c.global.spawn_x,c.global.spawn_y));
    const back=s.actors.find(a=>a.destino===refs.Room_Corredor_N2);
    run(s,'objects/Obj_porta/Create_0.gml');Object.assign(s,back);
    s.player.x=92;s.player.y=88;s.keys.add(s.ord('E'));
    run(s,'objects/Obj_porta/Step_0.gml');
    assert.equal(s.global.spawn_room,refs.Room_Corredor_N2);
    assert.deepEqual([s.global.spawn_x,s.global.spawn_y],[624,160]);
    assert(s.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Corredor_N2));
});

test('12 paredes na Room: limites, bancos e bloco central, sem duplicação no Create',()=>{
    const c=makeRoom();
    assert.equal(wallData.length,12);
    assert.equal(c.walls.length,13); // 12 da room + porta fechada
    for(const w of c.walls)assert(w.largura>0&&w.altura>0);
    const can=reachable(c,[92,88]);
    for(const pt of [[257,80],[108,155],[412,155],[257,274],[92,88]])assert(can(...pt),pt+' inacessível');
    assert(!can(257,174),'atravessou porta fechada');
});

test('porta fechada bloqueia jogador, bala e cano; aberta libera o interior',()=>{
    const c=makeRoom();
    assert.equal(c.bunker_varrer_paredes(257,280,257,170,2).alvo,c.bloqueio);
    assert.equal(c.bunker_varrer_paredes(257,280,257,170,7).alvo,c.bloqueio);
    c.player.x=257;c.player.y=273;step(c,true);
    assert(c.aberta);assert(c.global.manutencao_porta_aberta);
    assert.equal(c.walls.length,12);
    assert.equal(c.bunker_varrer_paredes(257,280,257,170,2).alvo,c.noone);
    const can=reachable(c,[92,88]);
    assert(can(257,174));assert(can(180,140));assert(can(340,180));
    assert.equal(c.scene.image_index,1);
    assert.notEqual(c.bunker_varrer_paredes(320,150,400,150,2).alvo,c.noone);
});

test('fechar sobre os pés é impedido; fechar de dentro permite reabrir e sair',()=>{
    const c=makeRoom(true);
    c.player.x=257;c.player.y=250;step(c,true);
    assert(c.aberta);assert.equal(c.mensagem_tempo,90);assert.equal(c.walls.length,12);
    c.player.y=230;step(c,true);
    assert(!c.aberta);assert.equal(c.walls.length,13);assert.equal(c.scene.image_index,2);
    assert(clear(c,c.player.x,c.player.y));
    step(c,true);
    assert(c.aberta);assert.equal(c.walls.length,12);
    assert(reachable(c,[257,230])(92,88));
});

test('pause/diário/cutscene não acionam porta; manter E não alterna a cada frame',()=>{
    for(const flag of ['pause_aberto','diario_aberto','config_aberta','cutscene_ativa','dialogo_ativo']) {
        const c=makeRoom();c.player.x=257;c.player.y=273;c.global[flag]=true;step(c,true);
        assert(!c.aberta,flag);
    }
    const c=makeRoom();c.player.x=257;c.player.y=273;step(c,true);
    for(let i=0;i<120;i++)step(c,false);
    assert(c.aberta);assert.equal(c.walls.length,12);
});

test('estado da porta persiste na reentrada; novo jogo reinicia o estado',()=>{
    const c=makeRoom(true);assert(c.aberta);assert.equal(c.walls.length,12);
    c.bunker_iniciar(false);assert(c.global.manutencao_porta_aberta);
    c.bunker_iniciar(true);assert(!c.global.manutencao_porta_aberta);
});

test('camera cabe na sala e segue personagem sem aumentar sua escala',()=>{
    const c=makeRoom();
    assert.equal(c.global.tela_camera_w,516);
    assert.equal(c.global.tela_camera_h,290);
    assert.equal(room.roomSettings.Width,516);assert.equal(room.roomSettings.Height,344);
    let pos;
    c.camera_set_view_pos=(_id,x,y)=>{pos=[x,y];};
    c.player.x=400;c.player.y=275;c.player.takedown_ativo=false;
    c.bunker_camera_atualizar();
    assert(pos[0]>=0 && pos[0]<=516-c.global.tela_camera_w);
    assert(pos[1]>=0 && pos[1]<=344-c.global.tela_camera_h);
});

test('arte estática, sprite original do jogador e recursos referenciados existem',()=>{
    const meta=load('sprites/Spr_sala_manutencao_cenario/Spr_sala_manutencao_cenario.yy');
    assert.equal(meta.frames.length,3);
    assert.equal(meta.width,516);assert.equal(meta.height,344);
    const player=instances.filter(i=>i.objectId.name==='Obj_jogador');
    assert.equal(player.length,1);assert.equal(player[0].scaleX,1);
    const project=load('tcc.yyp');
    assert(project.RoomOrderNodes.some(r=>r.roomId.name==='Room_Manutencao_N2'));
    for(const r of project.resources)assert(fs.existsSync(path.join(root,r.id.path)),r.id.path);
    const draw=fs.readFileSync(path.join(root,'objects/Obj_mapa/Draw_0.gml'),'utf8');
    assert(draw.includes('room == Room_Funcionarios || room == Room_Manutencao_N2) exit;'));
    assert(room.instanceCreationOrder.findIndex(i=>i.name==='inst_MAN_JOGADOR')>
           room.instanceCreationOrder.findIndex(i=>i.name==='inst_MAN_PORTA'));
});
console.log(total+' testes da integração v5.13 passaram (GML simulado + geometria real; sem runtime GameMaker).');
