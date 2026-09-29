/// Gerador das salas, progressão e direção de áudio
bunker_iniciar(false);
global.v5_duto_ativo=false;
global.v54_cena=0; global.v54_tempo=0; global.v54_boss=noone;
global.v54_porta=noone; global.v54_entulho_perto=false; global.v54_entulho_tempo=0;
global.camera_zoom=1;
global.diario_aberto = false;
global.diario_pagina = 0;
global.pause_aberto = false;
global.pause_selecionado = 0;
global.config_aberta = false;
global.config_origem = "";
if (room != Room1) {
    global.vitoria_ativa = false;
    global.vitoria_tempo = 0;
    global.saida_aberta = false;
    global.camera_zoom = 1;
}
nome_area = "BUNKER";
objetivo_area = "EXPLORE O AMBIENTE";
tempo_apresentacao = 240;
fade_entrada = 1;
tempo_visual = 0;
superficie_cenario = -1;
superficie_pronta = false;
cache_tentativa = 0;
camera_cenario = camera_create_view(0, 0, room_width, room_height, 0, noone, -1, -1, -1, -1);
bunker_configurar_tela();
tempo_tela = 0;
qualidade_cache = -1;
cor_chao_1 = make_color_rgb(42, 44, 40);
cor_chao_2 = make_color_rgb(48, 50, 45);
semente_visual = 1;
armadilha_tempo = -1;
explosao_tocou = false;
global.armadilha_explodiu = false;

// Pontos opcionais de storytelling. Eles explicam por que o protagonista
// entrou na empresa e transformam os defeitos do cenário em evidências de uma
// vistoria ambiental, sem interromper a progressão principal.
indicio_x = [];
indicio_y = [];
indicio_texto = [];
indicio_registro = [];
indicio_perto = -1;
indicio_mensagem = "";
indicio_tempo = 0;

// Sala dos Funcionários / interações sprite-first.
func_interacao_proxima = "";
func_mensagem_tempo = 0;
func_feedback_frame = 0;

if (!variable_global_exists("secretaria_orientou")) global.secretaria_orientou = false;
if (!variable_global_exists("armadilha_concluida")) global.armadilha_concluida = false;
// Estados transitórios pertencem à sala, não ao inventário. Recomeçar durante
// uma abertura ou conversa nunca deve deixar o jogador preso na nova room.
global.cutscene_ativa = false;
global.dialogo_ativo = false;
if (!variable_global_exists("boss_derrotado")) global.boss_derrotado = false;
if (!variable_global_exists("chave_pega")) global.chave_pega = false;
if (!variable_global_exists("inventario_cano")) global.inventario_cano = false;
if (!variable_global_exists("inventario_pistola")) global.inventario_pistola = false;
if (!variable_global_exists("equipamento_ativo")) global.equipamento_ativo = "nenhum";
if (!variable_global_exists("municao_pistola")) global.municao_pistola = 4;
if (!variable_global_exists("caixas_mecanicas")) global.caixas_mecanicas = 0;
if (!variable_global_exists("municao_reserva")) global.municao_reserva = global.caixas_mecanicas * 13;
if (!variable_global_exists("vida_jogador")) global.vida_jogador = 100;

var criar_parede = function(_x, _y, _w, _h, _tipo) {
    var p = instance_create_depth(_x, _y, 200, Obj_parede);
    bunker_parede_configurar(p, _w, _h);
    p.tipo = _tipo;
    return p;
};

var criar_porta = function(_x, _y, _destino, _spawn_x, _spawn_y, _rotulo, _verde, _requer) {
    var p = instance_create_depth(_x, _y, 50, Obj_porta);
    p.destino = _destino;
    p.spawn_x = _spawn_x;
    p.spawn_y = _spawn_y;
    p.rotulo = _rotulo;
    p.porta_verde = _verde;
    p.requer_orientacao = _requer;
    return p;
};

var adicionar_indicio = function(_x, _y, _texto) {
    var total_indicios = array_length(indicio_x);
    indicio_x[total_indicios] = _x;
    indicio_y[total_indicios] = _y;
    indicio_texto[total_indicios] = _texto;
    indicio_registro[total_indicios] = {
        codigo: room_get_name(room) + "_" + string(total_indicios),
        local: nome_area, titulo: "OBSERVAÇÃO DE CAMPO", observacao: _texto,
        avaliacao: "Comparar a observação com os registros disponíveis.",
        procedimento: "Registro visual, sem tocar nem recolher material desconhecido.",
        vinculo: "A vistoria exige evidências documentadas, não suposições."
    };
};

var detalhar_indicio = function(_titulo, _avaliacao, _procedimento, _vinculo) {
    var reg = indicio_registro[array_length(indicio_registro) - 1];
    reg.titulo = _titulo;
    reg.avaliacao = _avaliacao;
    reg.procedimento = _procedimento;
    reg.vinculo = _vinculo;
};

var criar_municao = function(_x, _y, _quantidade, _codigo) {
    if (bunker_tem_id(global.coletas_municao, _codigo)) return;
    var caixa = instance_create_depth(_x, _y, 0, Obj_caixaPregos);
    caixa.coleta_id = _codigo;
    caixa.quantidade = _quantidade;
};

// Estas salas já possuem seus colisores no Room Editor.
if (room != Room1 && room != Room_Corredor_Pos && room != Room_Biblioteca && room != Room_Pesquisa && room != Room_Corredor && room != Room_Desmoronada && room != Room_Armadilha && room != Room_Recepcao && room != Room_Laboratorio_N2 && room != Room_Ferramentas_N2 && room != Room_Manutencao_N2 && room != Room_Funcionarios && room != Room_Corredor_N2) {
// Limites comuns.
criar_parede(0, 0, room_width, 32, 0);
criar_parede(0, room_height - 32, room_width, 32, 0);
criar_parede(0, 0, 32, room_height, 0);
criar_parede(room_width - 32, 0, 32, room_height, 0);
}

props_cenario = room == Room1 ? [] : bunker_props_cenario(room);
for (var prop_i = 0; prop_i < array_length(props_cenario); prop_i++) {
    var prop = props_cenario[prop_i];
    var borda = prop[0] == 1 ? 5 : 3;
    var borda_topo = prop[0] == 2 ? 4 : borda;
    criar_parede(prop[1] - borda, prop[2] - borda_topo,
        prop[3] + borda * 2 + 1, prop[4] + borda + borda_topo + 1, 9);
}

if (room == Room_Externa) {
    nome_area = "ÁREA EXTERNA / COMPLEXO NEREIDA";
    objetivo_area = "APRESENTE-SE PARA A VISTORIA AMBIENTAL";
    semente_visual = 11;
    cor_chao_1 = make_color_rgb(61, 55, 42);
    cor_chao_2 = make_color_rgb(67, 60, 45);

    // A fachada é sólida, deixando somente a entrada central utilizável.
    criar_parede(32, 72, 600, 250, 9);
    criar_parede(734, 72, 600, 250, 9);
    criar_parede(632, 72, 102, 155, 9);
    criar_parede(110, 510, 150, 74, 1);
    criar_parede(1090, 500, 150, 78, 1);
    criar_porta(683, 286, Room_Recepcao, 320, 326, "ENTRAR", false, false);
    adicionar_indicio(930, 595, "A canaleta externa descarrega um líquido escuro fora da rede pluvial. NÃO CONFORMIDADE: possível efluente industrial.");
    detalhar_indicio("01 / DRENAGEM EXTERNA", "Há uma conexão improvisada entre o prédio e a vala. A cor, sozinha, não identifica a substância.", "Fotografar a saída e marcar sua posição na planta; manter distância da descarga.", "O protocolo recebido dizia que todo efluente seguia para tratamento. A primeira divergência está antes da portaria.");
}
else if (room == Room_Recepcao) {
    // Cenário, balcão, móveis, plantas e NPC estão posicionados na Room.
    nome_area = "RECEPÇÃO / SALA DE ESPERA";
    objetivo_area = global.secretaria_orientou ? "LEVE O PROTOCOLO À SALA INDICADA" : "CONFIRME A VISTORIA COM A SECRETARIA";
    semente_visual = 23;
    cor_chao_1 = make_color_rgb(38, 45, 43);
    cor_chao_2 = make_color_rgb(44, 52, 49);

    var rec_saida=criar_porta(320,390,Room_Externa,683,355,"SAIR / VOLTAR À FACHADA",false,false);
    rec_saida.visual_estatico=true;rec_saida.usar_area_interacao=true;
    rec_saida.area_esquerda=292;rec_saida.area_direita=347;
    rec_saida.area_topo=350;rec_saida.area_fundo=392;
    var rec_integracao=criar_porta(601,217,Room_Armadilha,256,250,"SALA DE ESPERA",true,true);
    rec_integracao.visual_estatico=true;rec_integracao.usar_area_interacao=true;
    rec_integracao.area_esquerda=560;rec_integracao.area_direita=603;
    rec_integracao.area_topo=192;rec_integracao.area_fundo=242;
    adicionar_indicio(378, 199, "Pasta: LICENÇA AMBIENTAL - RENOVAÇÃO. Os laudos antigos foram substituídos por páginas impressas nesta semana.");
    detalhar_indicio("02 / VERSÕES DOS LAUDOS", "A numeração salta entre anexos e faltam comprovantes que sustentem os resultados. Isso requer esclarecimento, não comprova fraude por si só.", "Anotar datas, páginas ausentes e responsáveis indicados. Preservar os originais no local.", "A secretaria tem um protocolo de visita, mas a sala indicada não aparece como setor ambiental na planta.");
}
else if (room == Room_Armadilha) {
    nome_area = "SALA DE ESPERA";
    objetivo_area = "ENTREGUE O PROTOCOLO DE INSPEÇÃO";
    semente_visual = 37;
    cor_chao_1 = make_color_rgb(48, 57, 55);
    cor_chao_2 = make_color_rgb(55, 65, 62);
    armadilha_tempo = 0;
    global.cutscene_ativa = true;
}
else if (room == Room_Desmoronada) {
    nome_area = "NÍVEL -1 / SALA DEMOLIDA";
    objetivo_area = "REGISTRE AS IRREGULARIDADES E ENCONTRE UMA SAÍDA";
    semente_visual = 41;
    cor_chao_1 = make_color_rgb(53, 49, 42);
    cor_chao_2 = make_color_rgb(59, 54, 46);
    global.cutscene_ativa = false;

    // Cenário e colisores da Sala 1 estão na Room.
    var saida_sala1 = criar_porta(262.5,41,Room_Corredor,106,250,"CORREDOR INDUSTRIAL",false,false);
    saida_sala1.visual_estatico = true;
    saida_sala1.usar_area_interacao = true;
    saida_sala1.area_esquerda = 243; saida_sala1.area_direita = 282;
    saida_sala1.area_topo = 48; saida_sala1.area_fundo = 72;
    if (!global.inventario_cano) instance_create_depth(145,165,0,Obj_cano);
    if (!global.inventario_pistola) instance_create_depth(130,225,0,Obj_armaPregos);
    instance_create_depth(300,260,0,Obj_caracol);
    instance_create_depth(410,140,0,Obj_caracol);
    criar_municao(145,280,2,"pregos_demolida");
    if (!global.chave_pega) instance_create_depth(420,250,0,Obj_chave_1);
    adicionar_indicio(417,173,"Os papéis apontam armazenamento inadequado de produtos químicos. Há recipientes no chão, caixas danificadas e identificação incompleta. Vou registrar isso na vistoria.");
    detalhar_indicio("03 / ARMAZENAMENTO QUÍMICO IRREGULAR", "O formulário descreve embalagens danificadas e recipientes sem identificação legível. A anotação é anterior ao desmoronamento; o problema já existia.", "Anotar as condições observadas e comparar com o inventário, sem mexer nos recipientes.", "Os registros da empresa não combinam com o que encontro neste depósito. A porta central leva ao corredor industrial.");
    adicionar_indicio(195,274,"Esta lista de estoque está incompleta. Produtos químicos foram deixados entre caixas comuns; faltam identificação e registro do local de armazenamento.");
    detalhar_indicio("ANEXO / INVENTÁRIO DO DEPÓSITO", "Há linhas sem identificação dos recipientes e caixas marcadas como provisórias, sem conferência de armazenamento.", "Registrar as lacunas e procurar os documentos correspondentes na sala de Pesquisa.", "Este papel complementa o registro de armazenamento inadequado da Sala 1.");
}
else if (room == Room_Corredor) {
    nome_area="CORREDOR INDUSTRIAL / PARTE 1";
    objetivo_area="PROCURE A PORTA DA PESQUISA À DIREITA DA ENTRADA";
    var p1=criar_porta(106,292,Room_Desmoronada,262.5,76,"SALA 1",false,false);
    p1.visual_estatico=true;p1.usar_area_interacao=true;
    p1.area_esquerda=86;p1.area_direita=126;p1.area_topo=240;p1.area_fundo=276;
    var p2=criar_porta(250,292,Room_Pesquisa,86,108,"PESQUISA",false,false);
    p2.visual_estatico=true;p2.usar_area_interacao=true;
    p2.area_esquerda=230;p2.area_direita=270;p2.area_topo=240;p2.area_fundo=276;
    var elevador=criar_porta(106,64,Room_Corredor,106,100,"ELEVADOR",false,false);
    elevador.tipo_passagem="elevador";elevador.visual_estatico=true;
    elevador.usar_area_interacao=true;elevador.area_esquerda=76;elevador.area_direita=144;
    elevador.area_topo=76;elevador.area_fundo=110;
    instance_create_depth(510,155,0,Obj_caracol);
    instance_create_depth(220,155,0,Obj_caracol);
    instance_create_depth(390,220,0,Obj_caracol);
    adicionar_indicio(552,164,"O teto cedeu e bloqueou toda a passagem. A porta da Pesquisa pode levar a outro caminho.");
    detalhar_indicio("04 / CORREDOR INTERROMPIDO", "Os escombros bloqueiam o corredor de uma parede à outra.", "Registrar o bloqueio e investigar a porta da Pesquisa.", "O elevador está quebrado. Preciso seguir pela Pesquisa.");
    adicionar_indicio(454,218,"Prancheta de manutenção: o elevador foi interditado. A manutenção não foi concluída.");
}
else if (room == Room_Pesquisa) {
    nome_area="SALA DE PESQUISA";
    objetivo_area="EXAMINE OS REGISTROS E ENCONTRE A VENTILAÇÃO";
    var entrada=criar_porta(86, 60,Room_Corredor,250,250,"CORREDOR INDUSTRIAL",false,false);
    entrada.visual_estatico=true;entrada.usar_area_interacao=true;
    entrada.area_esquerda= 60;entrada.area_direita=112;entrada.area_topo=80;entrada.area_fundo=118;
    var duto_arquivos=criar_porta(554,320,Room_Biblioteca,110,510,"DUTO / ARQUIVOS DE PESQUISA",false,false);
    duto_arquivos.tipo_passagem="duto";duto_arquivos.visual_estatico=true;
    duto_arquivos.usar_area_interacao=true;duto_arquivos.area_esquerda=516;duto_arquivos.area_direita=574;
    duto_arquivos.area_topo=290;duto_arquivos.area_fundo=340;
    criar_municao(490,270,3,"pregos_pesquisa");
    instance_create_depth(430,210,0,Obj_caracol);
    instance_create_depth(174,222,0,Obj_caracol);
    instance_create_depth(530,180,0,Obj_caracol);
    adicionar_indicio(386,282,"Planilha de descarte: amostras foram registradas como resíduo orgânico reaproveitável. O volume não fecha.");
    detalhar_indicio("05 / BALANÇO DE RESÍDUOS", "Os totais de entrada, armazenamento e destinação divergem. Faltam referências dos recipientes e comprovantes de saída.", "Transcrever os totais e as datas para confrontar com o arquivo. Não manipular as amostras.", "Um código de contenção aparece na margem da planilha. O material pode estar sendo transferido dentro do prédio.");
}
else if (room == Room_Biblioteca) {
    nome_area = "ARQUIVOS DE PESQUISA";
    objetivo_area = "AFASTE A CRIATURA E FALE COM O CIENTISTA AO FUNDO";
    semente_visual = 79;
    cor_chao_1 = make_color_rgb(52, 38, 30);
    cor_chao_2 = make_color_rgb(60, 43, 33);

    // Chegada pelo duto da Pesquisa; progressão para a contenção preservada.
    var porta_arquivo=criar_porta(800, 80,Room_Corredor_Pos,352,286,"CORREDOR / PÓS-ESCOMBROS",false,false);
    porta_arquivo.chave_exigida="cientista";
    porta_arquivo.visual_estatico=true;porta_arquivo.usar_area_interacao=true;
    porta_arquivo.area_esquerda=770;porta_arquivo.area_direita=830;
    porta_arquivo.area_topo=106;porta_arquivo.area_fundo=152;
    var retorno_duto=criar_porta(96,536,Room_Pesquisa,524,316,"DUTO / VOLTAR À PESQUISA",false,false);
    retorno_duto.tipo_passagem="duto";retorno_duto.visual_estatico=true;
    retorno_duto.usar_area_interacao=true;retorno_duto.area_esquerda= 70;retorno_duto.area_direita=138;
    retorno_duto.area_topo=488;retorno_duto.area_fundo=554;
    instance_create_depth(860,510,0,Obj_cientista1);
    if(!global.v53_arquivo_livre) {
        var vigia=instance_create_depth(834,432,0,Obj_caracol);
        vigia.guarda_arquivo=true;
    }
    adicionar_indicio(786,280, "Caixa de laudos ambientais recusados. Os responsáveis listados não aparecem no quadro atual da empresa.");
    detalhar_indicio("06 / ARQUIVO RETIDO", "Há pedidos de correção anteriores à renovação. A resposta oficial cita anexos que não estão na pasta da recepção.", "Relacionar números de protocolo e assinaturas sem retirar documentos. Separar fato observado de hipótese no relatório.", "Os laudos mencionam uma contenção subterrânea omitida da planta. Os indícios da visita agora formam uma sequência verificável.");
}
else if (room == Room_Corredor_Pos) {
    nome_area="CORREDOR INDUSTRIAL / NÍVEL 1";
    objetivo_area=(global.v53_chave_escada && global.boss_derrotado) ? "DESÇA A ESCADARIA À DIREITA PARA O NÍVEL 2" : (global.v53_chave_escada ? "LIBERE A SAÍDA DA ARENA" : "ENTRE NA CONTENÇÃO E PROCURE A CHAVE DA ESCADARIA");
    // v5.38: desenho, caixas, pedras e colisões ficam na própria Room.
    var arquivos=criar_porta(352,354,Room_Biblioteca,800,142,"ARQUIVOS DE PESQUISA",false,false);
    arquivos.visual_estatico=true;arquivos.usar_area_interacao=true;
    arquivos.area_esquerda=326;arquivos.area_direita=378;
    arquivos.area_topo=299;arquivos.area_fundo=330;
    var arena=criar_porta(352,58,Room1,615,523,"SALA DO BOSS",false,false);
    arena.visual_estatico=true;arena.usar_area_interacao=true;
    arena.area_esquerda=326;arena.area_direita=378;
    arena.area_topo=79;arena.area_fundo=108;
    // A opção de demonstração continua decidindo entre créditos e descida.
    var escada=criar_porta(644,184,Room_Corredor_N2,1030,186,"ESCADARIA",false,false);
    escada.visual_estatico=true;escada.usar_area_interacao=true;
    escada.area_esquerda=586;escada.area_direita=666;
    escada.area_topo=174;escada.area_fundo=201;
    escada.tipo_passagem="escada";
    escada.chave_exigida="escadaria";
    if (global.demo_fim_na_escadaria) {
        escada.rotulo="ESCADARIA / FIM DESTA VERSÃO";
        if (global.v53_chave_escada && global.boss_derrotado)
            objetivo_area="SIGA ATÉ A ESCADARIA / FIM DA FASE 1";
    }
}
else if (room == Room_Corredor_N2) {
    nome_area="NÍVEL 2 / CORREDOR INDUSTRIAL";
    objetivo_area="LABORATÓRIO: À ESQUERDA / FERRAMENTAS: AO CENTRO";
    semente_visual=109;
    cor_chao_1=make_color_rgb(39,43,42);
    cor_chao_2=make_color_rgb(45,49,47);

    // Arte, paredes e caixas estão na Room. Descanso e escadaria ficam
    // acima à direita; manutenção continua na parede inferior.
    var porta_funcionarios=criar_porta(850,95,Room_Funcionarios,90,310,"SALA DE DESCANSO",false,false);
    porta_funcionarios.visual_estatico=true;
    // Novo acesso inferior, independente da Sala dos Funcionários.
    var porta_manutencao=criar_porta(624,260,Room_Manutencao_N2,92,88,"DEPÓSITO",false,false);
    porta_manutencao.visual_estatico=true;
    var escada_retorno=criar_porta(1030,83,Room_Corredor_Pos,550,190,"ESCADARIA / SUBIR AO NÍVEL 1",false,false);
    escada_retorno.tipo_passagem="escada";
    escada_retorno.visual_estatico=true;
    var ferramentas=criar_porta(624,95,Room_Ferramentas_N2,256,274,"SALA 10 / FERRAMENTAS",false,false);
    ferramentas.visual_estatico=true;ferramentas.chave_exigida="ferramentas";
    ferramentas.usar_area_interacao=true;
    ferramentas.area_esquerda=600;ferramentas.area_direita=648;
    ferramentas.area_topo=108;ferramentas.area_fundo=160;
    var laboratorio=criar_porta(160,95,Room_Laboratorio_N2,320,344,"SALA DE PESQUISA",false,false);
    laboratorio.visual_estatico=true;laboratorio.chave_exigida="laboratorio";
    laboratorio.usar_area_interacao=true;
    laboratorio.area_esquerda=136;laboratorio.area_direita=184;
    laboratorio.area_topo=108;laboratorio.area_fundo=160;
    global.v5_nivel2_visitado=true;
}
else if (room == Room_Laboratorio_N2) {
    nome_area="NÍVEL 2 / SALA 11 / LABORATÓRIO";
    objetivo_area="EXAMINE AS CÁPSULAS E O TERMINAL";
    var saida_lab=criar_porta(320,392,Room_Corredor_N2,160,190,"SAIR DO LABORATÓRIO",false,false);
    saida_lab.visual_estatico=true;saida_lab.usar_area_interacao=true;
    saida_lab.area_esquerda=292;saida_lab.area_direita=347;
    saida_lab.area_topo=355;saida_lab.area_fundo=405;
    lab11_entrar(id);
}
else if (room == Room_Funcionarios) {
    nome_area="NÍVEL 2 / SALA DE DESCANSO";
    objetivo_area=global.funcionarios_chaves_coletadas ? "USE A CHAVE PARA EXPLORAR A SALA DE FERRAMENTAS" : "PROCURE A CAIXINHA DE CHAVES NA PAREDE";
    semente_visual=131;
    cor_chao_1=make_color_rgb(74,66,52);
    cor_chao_2=make_color_rgb(88,78,59);

    // Arte e Obj_parede estão colocados na Room, inclusive os móveis.
    // O corredor inferior é um vestíbulo: entrar nele NÃO muda de sala.
    var retorno_func=criar_porta(90,380,Room_Corredor_N2,850,190,"ABRIR PORTA / SAIR",false,false);
    retorno_func.visual_bunker=true;
    retorno_func.escala_visual=0.65;
    retorno_func.usar_area_interacao=true;
    retorno_func.area_esquerda=69;
    retorno_func.area_topo=336;
    retorno_func.area_direita=110;
    retorno_func.area_fundo=382;
}
else if(room==Room_Ferramentas_N2) {
    global.visitou_ferramentas = true;
    nome_area="NÍVEL 2 / SALA 10 / FERRAMENTAS";
    objetivo_area="EXAMINE AS FERRAMENTAS";
    tempo_apresentacao=0;
    var retorno=criar_porta(256,316,Room_Corredor_N2,624,184,"VOLTAR AO CORREDOR",false,false);
    retorno.visual_estatico=true;retorno.usar_area_interacao=true;
    retorno.area_esquerda=239;retorno.area_direita=274;
    retorno.area_topo=282;retorno.area_fundo=320;
    sala10_entrar(id);
}
else if (room == Room_Manutencao_N2) {
    nome_area = "NÍVEL 2 / DEPÓSITO";
    objetivo_area = "EXAMINE A PORTA DA CÂMARA FRIA";
    semente_visual = 137;
    // Cenário e paredes estão na Room; o jogador é a instância original.
    var retorno_manutencao = criar_porta(92,64,Room_Corredor_N2,624,160,"VOLTAR AO CORREDOR",false,false);
    retorno_manutencao.visual_estatico = true;
    retorno_manutencao.raio_interacao = 30;
}
else if (room == Room1) {
    nome_area = "CONTENÇÃO / SETOR NÃO DECLARADO";
    objetivo_area = "PROCURE A CHAVE NA CELA DA ESQUERDA";
    semente_visual = 97;
    global.chave_pega = true;
    cor_chao_1 = make_color_rgb(39, 37, 42);
    cor_chao_2 = make_color_rgb(45, 42, 48);

    global.parede_saida = noone;
    global.saida_aberta=global.boss_derrotado;
    global.v54_porta=criar_porta(615,599,Room_Corredor_Pos,352,126,"CORREDOR / ESCADARIA",false,false);
    // v5.42: a porta já pertence à arte, sem segunda porta gigante sobreposta.
    global.v54_porta.visual_estatico=true;
    global.v54_porta.usar_area_interacao=true;
    global.v54_porta.area_esquerda=583;global.v54_porta.area_direita=648;
    global.v54_porta.area_topo=554;global.v54_porta.area_fundo=643;
    v53_chave_boss_criar();
    if(global.v53_chave_escada && !global.boss_derrotado) v54_boss_iniciar();
    adicionar_indicio(99, 279, "Painel de contenção: o circuito repõe automaticamente os tambores de processo. O mesmo código consta na planilha de descarte.");
    detalhar_indicio("07 / CIRCUITO DE CONTENÇÃO", "A reposição interna não é destinação final. O processo mantém resíduos circulando em um setor não declarado.", "Registrar o código do painel de uma posição protegida. A prioridade é sair com as anotações da inspeção.", "Drenagem, volumes e protocolos convergem para esta instalação. O diário preserva a ligação entre cada observação.");
    adicionar_indicio(1126,450,"Relatório de experimentos: os registros descrevem alterações de comportamento e falhas no protocolo de contenção.");
    detalhar_indicio("08 / EXPERIMENTOS DE CONTENÇÃO", "As fichas relacionam o Homem-Formiga às celas deste setor. Há assinaturas e etapas sem aprovação.", "Registrar as inconsistências no diário e comparar as datas com os arquivos de Pesquisa.", "A empresa continuou os experimentos mesmo depois dos alertas de segurança.");
}

// A direção de áudio é resolvida por sala e estado no Step. Não reinicia o loop no Create.
