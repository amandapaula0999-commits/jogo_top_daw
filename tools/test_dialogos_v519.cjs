/* Actual GML selection/rendering with simulated engine APIs, not VM/YYC. */
process.env.BUNKER_SKIP_TESTS='1';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {fixture,run,refs}=require('./test_regressions.cjs');
const root=path.resolve(__dirname,'..'),source=p=>fs.readFileSync(path.join(root,p),'utf8');
let passed=0;
function test(n,f){f();passed++;console.log('OK: '+n);}
function scene(name='Room_Funcionarios'){
 const c=fixture();c.room=refs[name];c.actors=[];c.walls=[];
 const find=c.instance_find;c.instance_find=(kind,n)=>find(kind,n)||c.noone;
 run(c,'objects/Obj_mapa/Create_0.gml');
 for(const p of c.actors.filter(a=>a.kind===refs.Obj_porta))Object.assign(p,{ativa:true,abrindo:false,mensagem_tempo:0,raio_interacao:82,usar_area_interacao:p.usar_area_interacao||false});
 c.tempo_apresentacao=0;c.fade_entrada=0;c.player.x=300;c.player.y=290;
 return c;
}
function content(c){return c.bunker_fase2_conteudo(c);}
function painter(c,w=1366,h=768){
 const out=[];c.string_height_ext=(t,sep,w)=>Math.max(20,Math.ceil(t.length*9/w)*sep);c.display_get_gui_width=()=>w;c.display_get_gui_height=()=>h;
 c.bm_normal=0;c.c_white='white';c.c_black='black';c.fa_left=0;c.fa_top=0;
 c.gpu_set_blendmode=c.draw_set_alpha=c.draw_set_color=c.draw_set_font=c.draw_set_halign=c.draw_set_valign=()=>{};
 c.draw_rectangle=(...a)=>out.push(['rectangle',...a]);
 c.draw_text_ext_transformed=(...a)=>out.push(['text',...a]);
 const visual=source('scripts/Scr_visual_bunker/Scr_visual_bunker.gml');
 const a=visual.indexOf('function bunker_painel('),b=visual.indexOf('\nfunction ',a+1);
 new vm.Script(visual.slice(a,b)).runInContext(c);
 const panel=c.bunker_painel;
 c.bunker_painel=(...a)=>{out.push(['panel',...a]);panel(...a);};
 return out;
}
test('todos os avisos do descanso usam textos correspondentes, incluindo café e chaves',()=>{
 const c=scene();
 for(const [type,label] of [['cafe','TOMAR CAFÉ'],['chaves','EXAMINAR CHAVES'],['dormitorio','EXAMINAR PORTA']]){
  c.func_interacao_proxima=type;assert(content(c).comando.includes(label));
 }
 c.func_mensagem_tempo=120;
 for(const [frame,label] of [[4,'vida recuperada'],[5,'vida cheia'],[6,'sala de ferramentas'],[7,'caixinha está vazia'],[8,'Dormitório trancado']]){
  c.func_feedback_frame=frame;assert(content(c).texto.includes(label));
 }
});
test('todas as dez falas de ferramentas usam a caixa comum; examinar/coletar continuam distintos',()=>{
 const c=scene('Room_Ferramentas_N2');c.player.x=290;c.player.y=115;c.s10_tempo=120;c.s10_perto='suporte';
 for(let f=0;f<10;f++){c.s10_frame=f;assert(content(c).texto.length>0);}
 c.s10_tempo=0;c.s10_examinada=false;assert.equal(content(c).comando,'[E] EXAMINAR PÉ DE CABRA');
 c.s10_examinada=true;assert.equal(content(c).comando,'[E] COLETAR');
 c.global.inventario_pe_cabra=true;assert(content(c).texto.includes('Já guardei'));
 for(const [target,label] of [['bancada','BANCADA'],['prateleira','PRATELEIRAS']]){c.s10_perto=target;assert(content(c).comando.includes(label));}
});
test('as cinco portas mantêm os rótulos e as mensagens de bloqueio',()=>{
 const c=scene('Room_Corredor_N2'),ports=c.actors.filter(a=>a.kind===refs.Obj_porta);assert.equal(ports.length,5);
 for(const p of ports){
  c.player.x=p.x;c.player.y=p.y+(p.y<160?50:-40);
  assert.equal(content(c).comando,'[E] '+p.rotulo);
  p.mensagem_tempo=90;p.mensagem_bloqueio='PRECISO DA CHAVE DA SALA DE FERRAMENTAS';
  assert.equal(content(c).texto,p.mensagem_bloqueio);assert.equal(content(c).comando,'');p.mensagem_tempo=0;
 }
});
test('porta interna de manutenção apresenta abrir, fechar e afastar-se',()=>{
 const c=scene('Room_Manutencao_N2');const p=c.instance_create_depth(257,253,0,refs.Obj_porta_manutencao);
 Object.assign(p,{raio_interacao:34,aberta:false,mensagem_tempo:0});c.player.x=257;c.player.y=273;
 assert.equal(content(c).comando,'[E] ABRIR PORTA');p.aberta=true;assert.equal(content(c).comando,'[E] FECHAR PORTA');
 p.mensagem_tempo=30;assert(content(c).texto.includes('Afaste-se'));
});
test('porta próxima vence narração, sem caixas sobrepostas nem acionamento pelo Draw',()=>{
 const c=scene('Room_Ferramentas_N2');c.player.x=256;c.player.y=299;c.s10_tempo=200;c.s10_frame=0;
 const old={...c.global},out=painter(c);run(c,'objects/Obj_mapa/Draw_64.gml');
 assert.equal(out.filter(x=>x[0]==='panel').length,0);
 assert(!out.some(x=>x[0]==='text'&&x[3].includes('VOLTAR AO CORREDOR')));
 assert.deepEqual(c.global,old);assert(!c.eventos.some(e=>e[0]==='goto'));
});
test('cinco portas: nome branco acima do sprite, sem caixa GUI, interação preservada',()=>{
 const c=scene('Room_Corredor_N2');const ports=c.actors.filter(a=>a.kind===refs.Obj_porta);const out=painter(c);
 c.fa_center=1;c.fa_bottom=2;c.string_width=t=>t.length*9;
 let color;const texts=[];c.draw_set_color=v=>color=v;
 c.draw_text_transformed=(...a)=>texts.push({color,args:a});
 for(const p of ports){
  out.length=0;texts.length=0;c.player.x=p.x;c.player.y=p.y+(p.y<160?50:-40);
  run(c,'objects/Obj_mapa/Draw_64.gml');assert(!out.some(a=>a[0]==='panel'));
  c.bunker_porta_rotulo_desenhar(p);assert.equal(texts.length,1);assert.equal(texts[0].color,c.c_white);
  const [x,y,t]=texts[0].args;assert.equal(t,'[E] '+p.rotulo);assert(y<(p.y<160?38:231));
  c.global.pause_aberto=true;texts.length=0;c.bunker_porta_rotulo_desenhar(p);assert.equal(texts.length,0);c.global.pause_aberto=false;
 }
 const rec=scene('Room_Recepcao');assert(rec.actors.some(a=>a.rotulo==='SALA DE ESPERA'));assert(!rec.actors.some(a=>a.rotulo==='SALA DE ESPERA / INTEGRAÇÃO'));
});
test('painel cabe entre os HUDs no topo e não ocupa a metade inferior',()=>{
 for(const [w,h] of [[1366,768],[1920,1080],[1024,768],[800,600]]){
  const c=scene();c.func_mensagem_tempo=100;c.func_feedback_frame=6;const out=painter(c,w,h);run(c,'objects/Obj_mapa/Draw_64.gml');
  const [,x,y,pw,ph]=out.find(x=>x[0]==='panel');assert(x>=292*w/1366&&y>=0&&x+pw<1094*w/1366&&y+ph<h*.5);
  for(const t of out.filter(x=>x[0]==='text'))assert(t[1]>=x&&t[2]>=y&&t[1]+t[5]*t[6]<=x+pw&&t[2]+18*t[7]<=y+ph);
 }
});
test('pause/diário/configuração/cutscene/diálogo ocultam a caixa; fade de entrada permanece',()=>{
 for(const flag of ['pause_aberto','diario_aberto','config_aberta','cutscene_ativa','dialogo_ativo','vitoria_ativa']){
  const c=scene();c.func_interacao_proxima='cafe';c.global[flag]=true;const out=painter(c);run(c,'objects/Obj_mapa/Draw_64.gml');assert(!out.some(x=>x[0]==='panel'),flag);
 }
 const c=scene();c.fade_entrada=.5;const out=painter(c);run(c,'objects/Obj_mapa/Draw_64.gml');assert(out.some(x=>x[0]==='rectangle'&&x[1]===0&&x[3]===1366));
});
test('painéis rasterizados antigos não são mais desenhados e parte 1 usa seu fluxo original',()=>{
 const c=scene();c.draw_sprite_ext=c.draw_self=()=>{throw Error('painel antigo reapareceu');};
 run(c,'objects/Obj_feedback_funcionarios/Draw_0.gml');run(c,'objects/Obj_sala10_feedback/Draw_0.gml');run(c,'objects/Obj_sala10_feedback/Draw_64.gml');
 for(const name of ['Room_Recepcao','Room_Pesquisa','Room_Biblioteca','Room1']){c.room=refs[name];assert(!c.bunker_interface_fase2());}
});
test('fala digitada mantém a altura reservada e texto longo fica dentro do painel',()=>{
 const c=scene();const out=painter(c);const full='SECRETÁRIA: Bom dia. O inspetor ambiental, correto? Seu protocolo já estava separado.';
 c.bunker_aviso_gui('', 'ESPAÇO: COMPLETAR / AVANÇAR', full);
 const first=out.find(a=>a[0]==='panel').slice(1);out.length=0;
 c.bunker_aviso_gui(full, 'ESPAÇO: COMPLETAR / AVANÇAR', full);
 assert.deepEqual(out.find(a=>a[0]==='panel').slice(1),first);
 const texts=out.filter(a=>a[0]==='text');assert(texts[1][2]>texts[0][2]+c.string_height_ext(full,24,texts[0][5]));
});
test('aviso da recepção fica no topo; pausa e diálogo não duplicam o painel',()=>{
 const c=scene('Room_Recepcao');c.tempo_apresentacao=100;c.indicio_perto=-1;c.indicio_tempo=0;
 const out=painter(c);run(c,'objects/Obj_mapa/Draw_64.gml');
 assert.equal(out.filter(a=>a[0]==='panel').length,1);assert.equal(out.find(a=>a[0]==='panel')[2],16);
 for(const flag of ['dialogo_ativo','pause_aberto','diario_aberto','config_aberta']){
  out.length=0;c.global[flag]=true;run(c,'objects/Obj_mapa/Draw_64.gml');assert(!out.some(a=>a[0]==='panel'));c.global[flag]=false;
 }
});
console.log(passed+' testes da interface v5.24 passaram (GML simulado; sem runtime GameMaker).');
