/// Sistemas compartilhados da V4.2. Estado persistente somente em memória.
function bunker_escala_inimigo() { return 0.45; }
function bunker_escala_protagonista() {
    var _altura_inimigo = sprite_get_bbox_bottom(Spr_inimigo_parado_baixo) + 1
        - sprite_get_bbox_top(Spr_inimigo_parado_baixo);
    var _altura_jogador = sprite_get_bbox_bottom(Spr_jogador_parado_baixo) + 1
        - sprite_get_bbox_top(Spr_jogador_parado_baixo);
    return (_altura_inimigo * 0.55 * 16 / 20) / max(1, _altura_jogador);
}

// A origem da imagem não é o ombro. Mantém o apoio no corpo mesmo quando
// a pose muda de direção. Cada direção do cano usa seu próprio GIF original.
function bunker_pose_bracos(_arma, _direcao, _cano) {
    var _s = bunker_escala_protagonista();
    var _dir = floor((_direcao + 45) / 90) % 4;
    var _ang = 0;
    var _sx = _s;
    var _apoio_x = 0;
    var _apoio_y = 0;
    if (_cano) {
        var _sprites = [Spr_cano_direita, Spr_cano_cima, Spr_cano_esquerda, Spr_cano_baixo];
        var _quadro_cano = clamp(floor(_arma.image_index), 0, 2);
        _arma.sprite_index = _sprites[_dir];
        _arma.image_index = _quadro_cano;
        // Ombros dos quatro GIFs: nenhum giro ou escala negativa.
        var _ombros = [[12, 10], [16, 7], [20, 10], [16, 7]];
        _apoio_x = (_ombros[_dir][0] - 16) * _s;
        _apoio_y = (_ombros[_dir][1] - 16) * _s;
    } else {
        var _quadros = [1, 2, 3, 0];
        _arma.image_index = _quadros[_dir];
        // O quadro 2 recebido aponta para baixo, tal como o quadro 0.
        // Sua meia-volta é compensada no ombro, e não na cabeça do jogador.
        _ang = angle_difference(_direcao, _dir * 90) + (_dir == 1 ? 180 : 0);
        var _apoios = [[11, 11], [16, 6], [21, 11], [16, 6]];
        _apoio_x = (_apoios[_dir][0] - 16) * _s;
        _apoio_y = (_apoios[_dir][1] - 16) * _s;
    }
    _arma.direcao_mira = _direcao;
    _arma.direcao_arma = _dir;
    _arma.image_angle = _ang;
    _arma.image_xscale = _sx;
    _arma.image_yscale = _s;
    _arma.x = _arma.dono.x - lengthdir_x(_apoio_x, _ang) + lengthdir_y(_apoio_y, _ang);
    _arma.y = _arma.dono.y - 18 * _s - lengthdir_y(_apoio_x, _ang) - lengthdir_x(_apoio_y, _ang);
}

// A sequência usa os pixels de metal dos quatro GIFs fornecidos.
// A varredura entre quadros acompanha a haste durante o arco.
function bunker_cano_impacto(_arma) {
    if (_arma.ataque_atingiu) return;
    var _pixels = bunker_cano_pixels(_arma.direcao_arma, floor(_arma.image_index));
    var _r = 0.5 * _arma.escala_ataque;
    if (bunker_varrer_paredes(_arma.dono.x, _arma.dono.y, _arma.x, _arma.y, _r).t <= 1) {
        _arma.ataque_atingiu = true;
        return;
    }
    var _atuais = [];
    for (var _i = 0; _i < array_length(_pixels); _i++) {
        var _p = _pixels[_i];
        var _tx = _arma.x + (_p[0] + 0.5 - 16) * _arma.image_xscale;
        var _ty = _arma.y + (_p[1] + 0.5 - 16) * _arma.image_yscale;
        _atuais[_i] = [_tx, _ty];
        var _sx = _tx;
        var _sy = _ty;
        if (_arma.ataque_ponta_valida) {
            var _anterior = _arma.ataque_pixels_anteriores[min(array_length(_arma.ataque_pixels_anteriores)-1,
                floor(_i * array_length(_arma.ataque_pixels_anteriores) / array_length(_pixels)))];
            _sx = _anterior[0]; _sy = _anterior[1];
        }
        // Varre o metal entre quadros. O braço e o fundo transparente não dão dano.
        var _hit = bunker_varrer_impacto(_sx, _sy, _tx, _ty, _r);
        if (_hit.t <= 1 && !_hit.parede) {
            var _hx = lerp(_sx, _tx, _hit.t);
            var _hy = lerp(_sy, _ty, _hit.t);
            if (bunker_varrer_paredes(_arma.dono.x, _arma.dono.y, _hx, _hy, _r).t <= 1) continue;
            _arma.ataque_atingiu = true;
            bunker_aplicar_impacto(_hit.alvo, _arma.dano_cano);
            return;
        }
    }
    _arma.ataque_pixels_anteriores = _atuais;
    _arma.ataque_ponta_valida = true;
}

// Transformação única: Draw e hit testing do pause usam as mesmas coordenadas.
function bunker_pause_layout(_gw, _gh) {
    var _s = max(0.01, min(_gw * 0.92 / 1376, _gh * 0.92 / 768));
    return [_s, round(_gw * 0.5 - 688 * _s), round(_gh * 0.5 - 384 * _s)];
}

// Fonte única de geometria para o Draw e a área clicável dos cartões.
function bunker_pause_cartoes() {
    return [[780, 780, 780, 174], [182, 255, 325, 255],
        [238, 307, 376, 307], [320, 320, 320, 224],
        [110, 110, 110, 104], [1.45, 1.45, 1.45, 1.35], 12];
}

// Silhueta do couro na textura original. Nenhum sprite é refeito ou alterado:
// o selo, as costuras e a granulação são os mesmos pixels do menu inicial.
function bunker_pause_recorte() {
    var _p = [[618,288],[659,291],[858,307],[889,315],[1258,309],
        [1283,315],[1304,334],[1296,448],[1325,453],[1354,469],
        [1360,489],[1353,508],[1324,522],[1291,520],[1286,637],
        [1277,656],[1264,666],[903,656],[874,649],[590,626],
        [574,613],[565,595],[567,557],[593,335],[602,311],[611,297]];
    var _faixas = [];
    for (var _y = 288; _y < 666; _y++) {
        var _xs = [];
        for (var _i = 0; _i < array_length(_p); _i++) {
            var _a = _p[_i];
            var _b = _p[(_i + 1) % array_length(_p)];
            var _ym = _y + 0.5;
            if ((_a[1] <= _ym && _b[1] > _ym) || (_b[1] <= _ym && _a[1] > _ym)) {
                var _x = _a[0] + (_ym - _a[1]) * (_b[0] - _a[0]) / (_b[1] - _a[1]);
                // Inserção ordenada: também lida com concavidades no contorno.
                var _j = array_length(_xs);
                _xs[_j] = _x;
                while (_j > 0 && _xs[_j - 1] > _x) {
                    _xs[_j] = _xs[_j - 1];
                    _j--;
                }
                _xs[_j] = _x;
            }
        }
        for (var _k = 0; _k + 1 < array_length(_xs); _k += 2) {
            var _l = ceil(_xs[_k]);
            var _r = floor(_xs[_k + 1]);
            if (_r > _l) _faixas[array_length(_faixas)] = [_l, _y, _r - _l];
        }
    }
    return _faixas;
}

function bunker_pause_couro(_faixas, _ox, _oy, _s) {
    for (var _i = 0; _i < array_length(_faixas); _i++) {
        var _f = _faixas[_i];
        // Limites inteiros compartilhados evitam frestas entre linhas na GUI.
        var _y1 = round(_oy + _f[1] * _s);
        var _y2 = round(_oy + (_f[1] + 1) * _s);
        if (_y2 > _y1) draw_sprite_part_ext(Spr_menu_fundo, 0, _f[0], _f[1], _f[2], 1,
            _ox + _f[0] * _s, _y1, _s, _y2 - _y1, c_white, 1);
    }
}

/// A mesma condição controla o aviso e a ativação da porta.
function bunker_porta_em_alcance(_porta, _jogador) {
    if (_jogador == noone) return false;
    if (_porta.usar_area_interacao) {
        return point_in_rectangle(_jogador.x, _jogador.y,
            _porta.area_esquerda, _porta.area_topo,
            _porta.area_direita, _porta.area_fundo);
    }
    return point_distance(_porta.x, _porta.y, _jogador.x, _jogador.y) <= _porta.raio_interacao;
}

function bunker_iniciar(_nova) {
    // Encerramento provisório da demonstração. Troque true por false para
    // restaurar a descida normal à fase 2, sem remover nenhuma Room.
    if (_nova || !variable_global_exists("demo_fim_na_escadaria")) global.demo_fim_na_escadaria = true;
    if (_nova || !variable_global_exists("demo_creditos")) global.demo_creditos = false;
    if (_nova || !variable_global_exists("inventario_cartao_acesso")) global.inventario_cartao_acesso = false;
    if (_nova || !variable_global_exists("visitou_ferramentas")) global.visitou_ferramentas = false;
    if (_nova || !variable_global_exists("deposito_ajuda_ouvida")) global.deposito_ajuda_ouvida = false;
    lab11_iniciar(_nova);
    if(_nova || !variable_global_exists("inventario_pe_cabra")) global.inventario_pe_cabra=false;

    // BUILD DE TESTES v5.8: todas as portas/passagens com trava de progressao
    // ficam liberadas. Mude para false para restaurar a progressao normal.
    global.modo_teste_portas_livres = true;
    if(_nova || !variable_global_exists("v53_arquivo_livre")) global.v53_arquivo_livre=false;
    if(_nova || !variable_global_exists("v53_chave_cientista")) global.v53_chave_cientista=false;
    if(_nova || !variable_global_exists("v54_cena")) global.v54_cena=0;
    if(_nova || !variable_global_exists("v54_entulho_tempo")) global.v54_entulho_tempo=0;
    if(_nova || !variable_global_exists("v54_entulho_perto")) global.v54_entulho_perto=false;
    if(_nova || !variable_global_exists("v53_chave_escada")) global.v53_chave_escada=false;
    if(_nova || !variable_global_exists("v5_respawn_pendente")) global.v5_respawn_pendente=false;
    if(_nova || !variable_global_exists("v5_checkpoint_room")) global.v5_checkpoint_room=-1;
    if(_nova || !variable_global_exists("v5_queda_pendente")) global.v5_queda_pendente=false;
    if(_nova || !variable_global_exists("v5_duto_ativo")) global.v5_duto_ativo=false;
    if(_nova || !variable_global_exists("v5_checkpoint_transicao_pendente")) global.v5_checkpoint_transicao_pendente=false;
    if(_nova || !variable_global_exists("v5_nivel2_visitado")) global.v5_nivel2_visitado=false;
    if(_nova || !variable_global_exists("chave_sala_ferramentas")) global.chave_sala_ferramentas=false;
    if(_nova || !variable_global_exists("funcionarios_chaves_coletadas")) global.funcionarios_chaves_coletadas=false;
    if(_nova || !variable_global_exists("manutencao_porta_aberta")) global.manutencao_porta_aberta=false;
    if (_nova || !variable_global_exists("evidencias")) global.evidencias = [];
    if (_nova || !variable_global_exists("coletas_municao")) global.coletas_municao = [];
    if (_nova || !variable_global_exists("diario_aberto")) global.diario_aberto = false;
    if (_nova || !variable_global_exists("diario_pagina")) global.diario_pagina = 0;
    if (_nova || !variable_global_exists("pause_aberto")) global.pause_aberto = false;
    if (_nova || !variable_global_exists("pause_selecionado")) global.pause_selecionado = 0;
    if (_nova || !variable_global_exists("camera_zoom")) global.camera_zoom = 1;
    if (_nova || !variable_global_exists("vitoria_ativa")) global.vitoria_ativa = false;
    if (_nova || !variable_global_exists("vitoria_tempo")) global.vitoria_tempo = 0;
    if (_nova || !variable_global_exists("saida_aberta")) global.saida_aberta = false;
    if (_nova || !variable_global_exists("creditos_scroll")) global.creditos_scroll = 0;
    if (_nova || !variable_global_exists("ruido_serial")) global.ruido_serial = 0;
    global.ruido_tempo = 0;
    global.ruido_x = 0;
    global.ruido_y = 0;
    global.ruido_raio = 0;
    if (_nova || !variable_global_exists("audio_estado")) {
        global.audio_estado = "SILENCIO";
        global.audio_desejado = "SILENCIO";
        global.audio_ganho = 0;
        global.musica_atual = -1;
        global.trilha_recurso_atual = -1;
    }
    // Preferências de áudio sobrevivem à troca de sala e ao retorno ao menu.
    // Só são criadas aqui na primeira execução, para não desfazer a escolha
    // do jogador ao iniciar uma nova partida.
    if (!variable_global_exists("audio_musica_mudo")) global.audio_musica_mudo = false;
    if (!variable_global_exists("audio_efeitos_mudo")) global.audio_efeitos_mudo = false;
    if (_nova || !variable_global_exists("config_aberta")) global.config_aberta = false;
    if (_nova || !variable_global_exists("config_selecionado")) global.config_selecionado = 0;
    if (_nova || !variable_global_exists("config_origem")) global.config_origem = "";
    if (_nova || !variable_global_exists("qualidade_visual")) global.qualidade_visual = 0;
    if (_nova || !variable_global_exists("desempenho_fps_baixo")) global.desempenho_fps_baixo = 0;
    if (_nova || !variable_global_exists("desempenho_fps_bom")) global.desempenho_fps_bom = 0;
    if (_nova || !variable_global_exists("cenario_reconstruir")) global.cenario_reconstruir = false;
    if (_nova || !variable_global_exists("tela_camera_w")) global.tela_camera_w = 960;
    if (_nova || !variable_global_exists("tela_camera_h")) global.tela_camera_h = 540;
}

function bunker_configurar_tela() {
    // O mundo continua autorado em 16:9, mas o viewport acompanha o monitor.
    // Em 4:3 a câmera mostra uma faixa horizontal menor em vez de esticar
    // sprites e textos. Em 16:9 o enquadramento original permanece intacto.
    var tela_w = window_get_width();
    var tela_h = window_get_height();
    if (tela_w <= 0 || tela_h <= 0) {
        tela_w = display_get_width();
        tela_h = display_get_height();
    }
    if (tela_w <= 0 || tela_h <= 0) return;

    var proporcao = tela_w / tela_h;
    var vista_h = 540;
    var vista_w = clamp(floor(vista_h * proporcao), 640, 960);
    if (proporcao >= 1.70) vista_w = 960;

    // Conserva a proporção cenário/jogador aprovada nesta sala compacta.
    if (room == Room_Corredor_Pos || room == Room_Biblioteca || room == Room_Pesquisa || room == Room_Corredor || room == Room_Desmoronada || room == Room_Recepcao || room == Room_Laboratorio_N2 || room == Room_Ferramentas_N2 || room == Room_Manutencao_N2 || room == Room_Funcionarios || room == Room_Corredor_N2) {
        var ajuste_sala = min(1, min(room_width / vista_w, room_height / vista_h));
        vista_w = floor(vista_w * ajuste_sala);
        vista_h = floor(vista_h * ajuste_sala);
    }
    global.tela_camera_w = vista_w;
    global.tela_camera_h = vista_h;
    // API de câmera atual: evita os avisos GM1024 das variáveis view_wview/
    // view_hview e mantém a proporção 4:3 sem esticar os sprites.
    var camera_atual = view_get_camera(0);
    var zoom_atual = variable_global_exists("camera_zoom") ? max(1, global.camera_zoom) : 1;
    if (camera_atual != -1) camera_set_view_size(camera_atual, max(320, floor(vista_w / zoom_atual)), max(240, floor(vista_h / zoom_atual)));
    view_set_wport(0, tela_w);
    view_set_hport(0, tela_h);
    view_set_xport(0, 0);
    view_set_yport(0, 0);
    display_set_gui_size(1366, 768);
    if (room == Room_Armadilha && camera_atual != -1) {
        // O viewport continua cobrindo o render target inteiro, na origem.
        // A margem da sala 4:3 é feita na câmera, não em um segundo viewport.
        var escala_espera = max(1, floor(min(tela_w/512,tela_h/384)));
        global.tela_camera_w = tela_w / escala_espera;
        global.tela_camera_h = tela_h / escala_espera;
        camera_set_view_size(camera_atual,global.tela_camera_w,global.tela_camera_h);
        camera_set_view_pos(camera_atual,
            floor((room_width-global.tela_camera_w)*0.5),
            floor((room_height-global.tela_camera_h)*0.5));
        gpu_set_texfilter(false);
    }
}

function bunker_camera_cinematica() {
    if (!(variable_global_exists("vitoria_ativa") && global.vitoria_ativa)
        && !(variable_global_exists("v54_cena") && global.v54_cena > 0)) return;
    var camera_atual = view_get_camera(0);
    if (camera_atual == -1) return;
    var vw = max(320, floor(global.tela_camera_w / max(1, global.camera_zoom)));
    var vh = max(240, floor(global.tela_camera_h / max(1, global.camera_zoom)));
    camera_set_view_size(camera_atual, vw, vh);
    var foco_x = variable_global_exists("camera_foco_x") ? global.camera_foco_x : room_width * 0.5;
    var foco_y = variable_global_exists("camera_foco_y") ? global.camera_foco_y : room_height * 0.5;
    camera_set_view_pos(camera_atual, clamp(foco_x - vw * 0.5, 0, max(0, room_width - vw)), clamp(foco_y - vh * 0.5, 0, max(0, room_height - vh)));
}

function bunker_camera_atualizar() {
    // A câmera da sala tem o jogador como alvo por padrão. Durante a
    // finalização, porém, o alvo correto é o centro da dupla; sem esta
    // atualização o zoom acontecia, mas permanecia no meio da tela/mapa.
    var camera_atual = view_get_camera(0);
    if (camera_atual == -1 || !instance_exists(Obj_jogador)) return;
    if (room == Room_Armadilha) {
        // Mantém as margens; não aplica o clamp da câmera que segue o jogador.
        camera_set_view_size(camera_atual,global.tela_camera_w,global.tela_camera_h);
        camera_set_view_pos(camera_atual,
            floor((room_width-global.tela_camera_w)*0.5),
            floor((room_height-global.tela_camera_h)*0.5));
        return;
    }


    var jogador_camera = instance_find(Obj_jogador, 0);
    var foco_x = jogador_camera.x;
    var foco_y = jogador_camera.y;
    if (jogador_camera.takedown_ativo && instance_exists(jogador_camera.takedown_alvo)) {
        foco_x = (jogador_camera.x + jogador_camera.takedown_alvo.x) * 0.5;
        foco_y = (jogador_camera.y + jogador_camera.takedown_alvo.y) * 0.5;
    }

    var zoom_atual = variable_global_exists("camera_zoom") ? max(1, global.camera_zoom) : 1;
    var vw = max(320, floor(global.tela_camera_w / zoom_atual));
    var vh = max(240, floor(global.tela_camera_h / zoom_atual));
    camera_set_view_size(camera_atual, vw, vh);
    camera_set_view_pos(camera_atual,
        clamp(foco_x - vw * 0.5, 0, max(0, room_width - vw)),
        clamp(foco_y - vh * 0.5, 0, max(0, room_height - vh)));
}

function bunker_vitoria_iniciar(_foco_x, _foco_y) {
    global.demo_creditos = room == Room_Corredor_Pos && global.demo_fim_na_escadaria;
    global.vitoria_ativa = true;
    global.vitoria_tempo = 0;
    global.creditos_scroll = 0;
    global.camera_zoom = 1;
    global.camera_foco_x = _foco_x;
    global.camera_foco_y = _foco_y;
    global.cutscene_ativa = true;
    global.saida_aberta = true;
    global.cenario_reconstruir = true;
}

function bunker_vitoria_atualizar() {
    if (!global.vitoria_ativa) return;
    global.vitoria_tempo++;
    if (global.vitoria_tempo < 52) {
        global.camera_zoom = 1 + 0.32 * clamp(global.vitoria_tempo / 52, 0, 1);
    } else if (global.vitoria_tempo < 94) {
        global.camera_zoom = 1.32;
    } else {
        global.camera_zoom = 1;
    }
    if (global.vitoria_tempo > 250) global.creditos_scroll += 0.52;
    bunker_camera_cinematica();
    if (global.vitoria_tempo > 720 && (keyboard_check_pressed(vk_enter) || keyboard_check_pressed(vk_escape))) {
        global.vitoria_ativa = false;
        global.demo_creditos = false;
        global.cutscene_ativa = false;
        global.camera_zoom = 1;
        room_goto(Room_Menu);
    }
}

function bunker_desempenho_tick() {
    // Fallback conservador: a qualidade só reduz depois de vários frames
    // abaixo de 30 FPS e só volta após uma folga sustentada. Assim uma queda
    // momentânea não fica alternando a surface do cenário.
    var leitura = fps_real;
    if (leitura > 0 && leitura < 28) {
        global.desempenho_fps_baixo++;
        global.desempenho_fps_bom = 0;
    } else if (leitura >= 48) {
        global.desempenho_fps_bom++;
        global.desempenho_fps_baixo = 0;
    } else {
        global.desempenho_fps_baixo = max(0, global.desempenho_fps_baixo - 1);
        global.desempenho_fps_bom = max(0, global.desempenho_fps_bom - 1);
    }

    if (global.qualidade_visual == 0 && global.desempenho_fps_baixo >= 45) {
        global.qualidade_visual = 1;
        global.cenario_reconstruir = true;
    }
    if (global.qualidade_visual == 1 && global.desempenho_fps_bom >= 300) {
        global.qualidade_visual = 0;
        global.cenario_reconstruir = true;
    }
}

function bunker_tem_id(_lista, _id) {
    for (var i = 0; i < array_length(_lista); i++) {
        if (_lista[i] == _id) return true;
    }
    return false;
}

function bunker_coletar_municao(_id, _quantidade) {
    if (bunker_tem_id(global.coletas_municao, _id)) return false;
    global.coletas_municao[array_length(global.coletas_municao)] = _id;
    global.municao_reserva += max(0, floor(_quantidade));
    return true;
}

function bunker_evidencia_indice(_id) {
    for (var i = 0; i < array_length(global.evidencias); i++) {
        if (global.evidencias[i].codigo == _id) return i;
    }
    return -1;
}

function bunker_registrar(_registro) {
    if (bunker_evidencia_indice(_registro.codigo) >= 0) return false;
    global.evidencias[array_length(global.evidencias)] = _registro;
    return true;
}

function bunker_emitir_ruido(_x, _y, _raio, _duracao) {
    global.ruido_serial++;
    global.ruido_x = _x;
    global.ruido_y = _y;
    global.ruido_raio = _raio;
    global.ruido_tempo = _duracao;
}

function bunker_visivel(_x, _y, _direcao, _px, _py, _furtivo) {
    var dist = point_distance(_x, _y, _px, _py);
    var alcance = _furtivo ? 145 : 270;
    if (dist > alcance) return false;
    if (collision_line(_x, _y, _px, _py, Obj_parede, false, true) != noone) return false;
    if (dist <= 30) return true;
    return abs(angle_difference(_direcao, point_direction(_x, _y, _px, _py))) <= 58;
}

function bunker_audio_recurso(_estado) {
    switch (_estado) {
        case "NORMAL": return Snd_menu_empresa;
        case "EXPLORACAO": return Snd_ambiente_bunker;
        case "TENSAO": return Snd_tensao;
        case "COMBATE": return Snd_combate;
    }
    return -1;
}

function bunker_audio_tocar_efeito(_recurso, _prioridade, _loop) {
    var instancia_efeito = audio_play_sound(_recurso, _prioridade, _loop);
    var efeito_mudo = variable_global_exists("audio_efeitos_mudo") && global.audio_efeitos_mudo;
    if (instancia_efeito != -1) audio_sound_gain(instancia_efeito, efeito_mudo ? 0 : 1, 0);
    return instancia_efeito;
}

function bunker_audio_aplicar_configuracao() {
    if (variable_global_exists("musica_atual") && global.musica_atual != -1
    && audio_is_playing(global.musica_atual)) {
        var musica_muda = variable_global_exists("audio_musica_mudo") && global.audio_musica_mudo;
        audio_sound_gain(global.musica_atual, musica_muda ? 0 : global.audio_ganho, 0);
    }
}

function bunker_configuracao_alternar(_indice) {
    if (_indice == 0) global.audio_musica_mudo = !global.audio_musica_mudo;
    if (_indice == 1) global.audio_efeitos_mudo = !global.audio_efeitos_mudo;
    bunker_audio_aplicar_configuracao();
}

function bunker_configuracoes_desenhar(_selecionado) {
    var gw = display_get_gui_width();
    var gh = display_get_gui_height();
    var sx = gw / 1366;
    var sy = gh / 768;
    var ys = [270, 382, 494];
    var nomes = ["MÚSICA", "EFEITOS", "VOLTAR"];
    var estados = [global.audio_musica_mudo ? "SILENCIADA" : "ATIVADA",
        global.audio_efeitos_mudo ? "SILENCIADOS" : "ATIVADOS", ""];

    draw_set_alpha(0.96);
    draw_set_color(make_color_rgb(12, 10, 8));
    draw_rectangle(154 * sx, 78 * sy, 1212 * sx, 690 * sy, false);
    draw_set_alpha(1);
    draw_set_color(make_color_rgb(181, 112, 58));
    draw_rectangle(154 * sx, 78 * sy, 1212 * sx, 690 * sy, true);
    draw_set_color(make_color_rgb(61, 31, 19));
    draw_rectangle(172 * sx, 96 * sy, 1194 * sx, 672 * sy, false);

    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_valign(fa_middle);
    draw_set_color(make_color_rgb(238, 205, 139));
    draw_text_transformed(gw * 0.5, 142 * sy, "CONFIGURAÇÕES", 3.0 * sx, 3.0 * sy, 0);
    draw_set_color(make_color_rgb(198, 168, 116));
    draw_text_transformed(gw * 0.5, 188 * sy, "ÁUDIO", 1.55 * sx, 1.55 * sy, 0);

    for (var i = 0; i < 3; i++) {
        var ativo = i == _selecionado;
        draw_set_color(ativo ? make_color_rgb(73, 117, 43) : make_color_rgb(83, 48, 29));
        draw_rectangle(330 * sx, (ys[i] - 38) * sy, 1036 * sx, (ys[i] + 38) * sy, false);
        draw_set_color(ativo ? make_color_rgb(136, 177, 65) : make_color_rgb(125, 73, 39));
        draw_rectangle(342 * sx, (ys[i] - 29) * sy, 1024 * sx, (ys[i] - 21) * sy, false);
        draw_set_color(make_color_rgb(244, 226, 190));
        draw_text_transformed(522 * sx, ys[i] * sy, nomes[i], 1.85 * sx, 1.85 * sy, 0);
        if (i < 2) {
            draw_set_color(make_color_rgb(35, 22, 14));
            draw_text_transformed(856 * sx, ys[i] * sy, estados[i], 1.55 * sx, 1.55 * sy, 0);
        }
    }

    draw_set_color(make_color_rgb(238, 205, 139));
    draw_text_transformed(gw * 0.5, 650 * sy, "W/S: SELECIONAR   A/D OU ENTER: ALTERAR   ESC: VOLTAR", 1.35 * sx, 1.35 * sy, 0);
    draw_set_font(-1);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_color(c_white);
    draw_set_alpha(1);
}

function bunker_audio_parar() {
    // Parar pelo recurso elimina inclusive eventuais cópias herdadas.
    audio_stop_sound(Snd_menu_empresa);
    audio_stop_sound(Snd_ambiente_bunker);
    audio_stop_sound(Snd_tensao);
    audio_stop_sound(Snd_combate);
    global.musica_atual = -1;
    global.trilha_recurso_atual = -1;
    global.audio_ganho = 0;
}

function bunker_audio_forcar(_estado) {
    bunker_audio_parar();
    global.audio_estado = _estado;
    global.audio_desejado = _estado;
    var recurso = bunker_audio_recurso(_estado);
    if (recurso != -1) {
        global.musica_atual = audio_play_sound(recurso, 1, true);
        global.trilha_recurso_atual = recurso;
        audio_sound_gain(global.musica_atual, 0, 0);
    }
}

function bunker_audio_contexto() {
    if (variable_global_exists("vitoria_ativa") && global.vitoria_ativa) return "SILENCIO";
    if (room == Room_Menu || room == Room_Externa || room == Room_Recepcao) return "NORMAL";
    if (room == Room_Armadilha) {
        if (global.armadilha_explodiu) return "SILENCIO";
        return "NORMAL";
    }
    if (instance_exists(Obj_homem_lagarto) || instance_exists(Obj_caracol_lab)) return "COMBATE";
    if (room == Room1 && !global.boss_derrotado && instance_exists(Obj_boss)) return "COMBATE";
    var resultado = "EXPLORACAO";
    for (var i = 0; i < instance_number(Obj_caracol); i++) {
        var inimigo = instance_find(Obj_caracol, i);
        if (inimigo.morrendo || inimigo.vida <= 0) continue;
        if (inimigo.estado == "PERSEGUINDO") return "COMBATE";
        if (inimigo.alerta >= 25 || inimigo.estado == "INVESTIGANDO") resultado = "TENSAO";
    }
    return resultado;
}

function bunker_audio_atualizar(_desejado) {
    global.audio_desejado = _desejado;
    if (global.audio_estado != _desejado) {
        global.audio_ganho = max(0, global.audio_ganho - 0.055);
        if (global.musica_atual != -1) {
            var musica_muda_transicao = variable_global_exists("audio_musica_mudo") && global.audio_musica_mudo;
            audio_sound_gain(global.musica_atual, musica_muda_transicao ? 0 : global.audio_ganho, 0);
        }
        // O novo loop só começa depois que o anterior foi encerrado.
        if (global.audio_ganho <= 0) bunker_audio_forcar(_desejado);
    } else {
        var recurso = bunker_audio_recurso(_desejado);
        if (recurso == -1) return;
        if (global.musica_atual == -1 || !audio_is_playing(global.musica_atual)) {
            bunker_audio_forcar(_desejado);
        }
        var alvo = (_desejado == "NORMAL") ? 0.44 : 0.34;
        global.audio_ganho = min(alvo, global.audio_ganho + 0.025);
        var musica_muda_alvo = variable_global_exists("audio_musica_mudo") && global.audio_musica_mudo;
        audio_sound_gain(global.musica_atual, musica_muda_alvo ? 0 : global.audio_ganho, 0);
    }
}

/// Derrama uma única vez por queda, compartilhado pelo Step e Animation End.
function bunker_barril_derramar(_barril) {
    if (!instance_exists(_barril) || !_barril.atingido || _barril.acido_criado) return false;
    var poca = instance_create_depth(_barril.x, _barril.y, 100, Obj_acido);
    poca.origem_barril = _barril;
    _barril.acido_id = poca;
    _barril.acido_criado = true;
    _barril.mostrar_chao = true;
    _barril.sumindo = true;
    _barril.image_speed = 0;
    _barril.image_index = max(0, sprite_get_number(Spr_barril_caindo) - 1);
    _barril.respawn_tempo = _barril.respawn_max;
    return true;
}

function bunker_derrubar_barril(_barril) {
    if (!instance_exists(_barril) || _barril.atingido) return false;
    _barril.atingido = true;
    _barril.sprite_index = Spr_barril_caindo;
    _barril.image_index = 0;
    _barril.image_speed = 1;
    bunker_audio_tocar_efeito(Snd_barril, 24, false);
    return true;
}

function bunker_impacto(_x, _y, _raio) {
    // Uma chamada por golpe. A onda é radial no chão; móveis bloqueiam sua passagem.
    for (var i = 0; i < instance_number(Obj_barril); i++) {
        var barril = instance_find(Obj_barril, i);
        if (point_distance(_x, _y, barril.x, barril.y) <= _raio
        && collision_line(_x, _y, barril.x, barril.y, Obj_parede, false, true) == noone) {
            bunker_derrubar_barril(barril);
        }
    }
    if (instance_exists(Obj_jogador)) {
        var jogador = instance_find(Obj_jogador, 0);
        if (!jogador.invulneravel && !global.cutscene_ativa && !global.dialogo_ativo
        && !global.diario_aberto && point_distance(_x, _y, jogador.x, jogador.y) <= _raio
        && collision_line(_x, _y, jogador.x, jogador.y, Obj_parede, false, true) == noone) {
            jogador.vida -= 24;
            jogador.invulneravel = true;
            jogador.alarm[0] = 75;
            global.vida_jogador = jogador.vida;
        }
    }
    bunker_audio_tocar_efeito(Snd_impacto_boss, 28, false);
    bunker_emitir_ruido(_x, _y, 620, 90);
}

// GEOMETRIA CANO V4.25
// Gerado por tools/import_cano_v425.py. Pixels de metal dos GIFs originais.
function bunker_cano_pixels(_dir, _quadro) {
    if (!variable_global_exists("cano_geometria")) global.cano_geometria = [[[[20,4],[21,4],[19,5],[20,5],[21,5],[22,5],[19,6],[20,6],[21,6],[22,6],[19,7],[20,7],[21,7],[22,7],[19,8],[20,8],[21,8],[22,8],[19,9],[20,9],[21,9],[22,9],[19,10],[20,10],[21,10],[22,10],[19,11],[20,11],[21,11],[22,11],[20,12],[21,12],[22,12],[20,13],[21,13],[20,14],[21,14],[21,15],[20,19],[21,19],[20,20],[21,20]],[[20,4],[20,5],[21,5],[21,6],[22,6],[21,7],[22,7],[23,7],[22,8],[23,8],[24,8],[22,9],[23,9],[24,9],[25,9],[22,10],[23,10],[24,10],[25,10],[26,10],[23,11],[24,11],[25,11],[26,11],[23,12],[24,12],[25,12],[26,12],[27,12],[23,13],[24,13],[25,13],[26,13],[27,13],[28,13],[23,14],[24,14],[25,14],[26,14],[27,14],[28,14],[23,15],[24,15],[25,15],[26,15],[27,15],[28,15],[29,15],[22,16],[23,16],[24,16],[25,16],[26,16],[27,16],[28,16],[29,16],[23,17],[24,17],[25,17],[26,17],[27,17],[28,17],[29,17],[19,18],[23,18],[24,18],[25,18],[26,18],[27,18],[28,18],[29,18],[18,19],[19,19],[20,19],[18,20],[19,20]],[[24,16],[25,16],[26,16],[27,16],[28,16],[29,16],[22,17],[23,17],[24,17],[25,17],[26,17],[27,17],[28,17],[29,17],[30,17],[19,18],[23,18],[24,18],[25,18],[26,18],[27,18],[28,18],[29,18],[30,18],[31,18],[19,19],[20,19],[24,19],[25,19],[26,19],[27,19],[28,19],[29,19],[30,19]]],[[[23,3],[24,3],[25,3],[22,4],[23,4],[24,4],[25,4],[26,4],[21,5],[22,5],[23,5],[24,5],[25,5],[26,5],[22,6],[23,6],[24,6],[25,6],[23,7],[24,7],[25,7],[18,8],[19,8],[23,8],[24,8],[17,9],[18,9],[19,9],[16,10],[17,10],[18,10],[19,10],[16,11],[17,11],[18,11],[15,12],[16,12],[17,12],[13,13],[14,13],[13,14],[14,14],[13,15],[14,15]],[[17,4],[18,4],[19,4],[20,4],[21,4],[22,4],[23,4],[24,4],[15,5],[16,5],[17,5],[18,5],[19,5],[20,5],[21,5],[22,5],[23,5],[24,5],[25,5],[14,6],[15,6],[16,6],[17,6],[18,6],[19,6],[23,6],[24,6],[25,6],[26,6],[13,7],[14,7],[15,7],[16,7],[17,7],[18,7],[19,7],[26,7],[13,8],[14,8],[15,8],[16,8],[17,8],[18,8],[26,8],[12,9],[13,9],[14,9],[12,10],[13,10],[16,11],[17,11],[18,11],[15,12],[16,12],[17,12],[13,13],[14,13],[9,14],[10,14],[11,14],[12,14],[14,14],[8,15],[9,15],[10,15],[11,15],[12,15],[8,16],[9,16],[10,16],[11,16],[12,16],[8,17],[9,17],[10,17],[11,17],[12,17],[8,18],[9,18],[10,18],[11,18],[12,18],[8,19],[9,19],[10,19],[11,19],[12,19],[8,20],[9,20],[10,20],[11,20],[12,20],[8,21],[9,21],[10,21],[11,21],[12,21],[8,22],[9,22],[11,22],[12,22],[13,22],[8,23],[9,23],[12,23],[13,23],[8,24],[9,24],[13,24],[8,25],[9,25],[10,25],[9,26],[10,26],[10,27],[11,27]],[[16,11],[17,11],[18,11],[15,12],[16,12],[17,12],[13,13],[14,13],[11,14],[12,14],[13,14],[14,14],[10,15],[11,15],[12,15],[13,15],[14,15],[8,16],[9,16],[10,16],[11,16],[12,16],[13,16],[14,16],[7,17],[8,17],[9,17],[10,17],[11,17],[12,17],[13,17],[14,17],[6,18],[7,18],[8,18],[9,18],[10,18],[11,18],[12,18],[5,19],[6,19],[7,19],[8,19],[9,19],[10,19],[11,19],[12,19],[5,20],[6,20],[7,20],[8,20],[9,20],[10,20],[11,20],[5,21],[6,21],[7,21],[8,21],[9,21],[10,21],[5,22],[6,22],[7,22],[8,22],[9,22],[6,23],[7,23],[8,23]]],[[[10,4],[11,4],[9,5],[10,5],[11,5],[12,5],[9,6],[10,6],[11,6],[12,6],[9,7],[10,7],[11,7],[12,7],[9,8],[10,8],[11,8],[12,8],[9,9],[10,9],[11,9],[12,9],[9,10],[10,10],[11,10],[12,10],[9,11],[10,11],[11,11],[12,11],[9,12],[10,12],[11,12],[10,13],[11,13],[10,14],[11,14],[10,15],[10,19],[11,19],[10,20],[11,20]],[[11,4],[10,5],[11,5],[9,6],[10,6],[8,7],[9,7],[10,7],[7,8],[8,8],[9,8],[6,9],[7,9],[8,9],[9,9],[5,10],[6,10],[7,10],[8,10],[9,10],[5,11],[6,11],[7,11],[8,11],[4,12],[5,12],[6,12],[7,12],[8,12],[3,13],[4,13],[5,13],[6,13],[7,13],[8,13],[3,14],[4,14],[5,14],[6,14],[7,14],[8,14],[2,15],[3,15],[4,15],[5,15],[6,15],[7,15],[8,15],[2,16],[3,16],[4,16],[5,16],[6,16],[7,16],[8,16],[9,16],[2,17],[3,17],[4,17],[5,17],[6,17],[7,17],[8,17],[2,18],[3,18],[4,18],[5,18],[6,18],[7,18],[8,18],[12,18],[11,19],[12,19],[13,19],[12,20],[13,20]],[[2,16],[3,16],[4,16],[5,16],[6,16],[7,16],[1,17],[2,17],[3,17],[4,17],[5,17],[6,17],[7,17],[8,17],[9,17],[0,18],[1,18],[2,18],[3,18],[4,18],[5,18],[6,18],[7,18],[8,18],[12,18],[1,19],[2,19],[3,19],[4,19],[5,19],[6,19],[7,19],[11,19],[12,19]]],[[[23,5],[24,5],[25,5],[26,5],[22,6],[23,6],[24,6],[25,6],[26,6],[27,6],[20,7],[21,7],[22,7],[23,7],[24,7],[25,7],[26,7],[27,7],[19,8],[20,8],[21,8],[22,8],[23,8],[24,8],[25,8],[26,8],[19,9],[20,9],[21,9],[22,9],[23,9],[24,9],[25,9],[18,10],[19,10],[20,10],[21,10],[22,10],[23,10],[24,10],[17,11],[18,11],[19,11],[20,11],[21,11],[22,11],[16,12],[17,12],[18,12],[19,12],[20,12],[15,13],[16,13],[17,13],[18,13],[19,13],[14,14],[15,14],[16,14],[17,14],[18,14],[16,15],[10,18],[11,18],[10,19],[11,19],[12,19],[13,19],[11,20],[12,20]],[[21,7],[21,8],[22,8],[23,8],[21,9],[22,9],[23,9],[24,9],[22,10],[23,10],[24,10],[22,11],[23,11],[24,11],[25,11],[22,12],[23,12],[24,12],[25,12],[22,13],[23,13],[24,13],[25,13],[26,13],[14,14],[15,14],[18,14],[22,14],[23,14],[24,14],[25,14],[26,14],[15,15],[18,15],[19,15],[22,15],[23,15],[24,15],[25,15],[26,15],[27,15],[19,16],[20,16],[22,16],[23,16],[24,16],[25,16],[26,16],[27,16],[19,17],[20,17],[23,17],[24,17],[25,17],[26,17],[27,17],[15,18],[16,18],[19,18],[20,18],[21,18],[23,18],[24,18],[25,18],[26,18],[27,18],[15,19],[16,19],[17,19],[18,19],[19,19],[20,19],[21,19],[24,19],[25,19],[26,19],[27,19],[15,20],[16,20],[17,20],[18,20],[19,20],[20,20],[21,20],[22,20],[24,20],[25,20],[26,20],[27,20],[15,21],[16,21],[17,21],[18,21],[19,21],[20,21],[21,21],[22,21],[23,21],[24,21],[25,21],[26,21],[27,21],[16,22],[17,22],[18,22],[19,22],[20,22],[21,22],[22,22],[23,22],[24,22],[25,22],[26,22],[27,22],[17,23],[18,23],[19,23],[20,23],[21,23],[22,23],[23,23],[24,23],[25,23],[26,23],[27,23],[19,24],[20,24],[21,24],[22,24],[23,24],[24,24],[25,24],[26,24],[21,25],[22,25],[23,25],[24,25],[25,25]],[[16,15],[16,16],[17,16],[15,17],[16,17],[17,17],[15,18],[16,18],[17,18],[18,18],[15,19],[16,19],[17,19],[18,19],[19,19],[16,20],[17,20],[18,20],[19,20],[20,20],[16,21],[17,21],[18,21],[19,21],[20,21],[21,21],[17,22],[18,22],[19,22],[20,22],[21,22],[22,22],[17,23],[18,23],[19,23],[20,23],[21,23],[22,23],[23,23],[18,24],[19,24],[20,24],[21,24],[22,24],[23,24],[24,24],[18,25],[19,25],[20,25],[21,25],[22,25],[23,25],[24,25],[25,25],[19,26],[20,26],[21,26],[22,26],[23,26],[24,26],[25,26],[26,26],[19,27],[20,27],[21,27],[22,27],[23,27],[24,27],[25,27],[26,27],[27,27],[20,28],[21,28],[22,28],[23,28],[24,28],[25,28],[26,28],[27,28],[21,29],[22,29],[23,29],[24,29],[25,29],[26,29],[27,29],[22,30],[23,30],[24,30],[25,30],[26,30],[27,30]]]];
    return global.cano_geometria[clamp(_dir, 0, 3)][clamp(_quadro, 0, 2)];
}

// v5.6: acabamento comum dos cartões. Coordenadas locais iguais às hitboxes.
// Cada célula usa limites arredondados compartilhados: sem filtro, sem frestas.
function bunker_cartao_bloco(_x,_y,_sx,_sy,_h,_a,_b,_c,_d,_cor) {
    _b=max(0,_b);_d=min(_h,_d);
    if(_d<=_b || _c<=_a) return;
    draw_set_color(_cor);
    draw_rectangle(round(_x+_a*_sx),round(_y+_b*_sy),round(_x+_c*_sx),round(_y+_d*_sy),false);
}
function bunker_cartao_letras(_tipo) {
    if(_tipo==0) return [[7, 2, 2, 2, 18, 18, 12, 0], [14, 17, 17, 17, 17, 17, 14, 0], [15, 16, 16, 23, 17, 17, 15, 0], [14, 17, 17, 31, 17, 17, 17, 0], [30, 17, 17, 30, 20, 18, 17, 0]];
    if(_tipo==1) return [[15, 16, 16, 16, 16, 16, 15, 0], [14, 17, 17, 17, 17, 17, 14, 0], [17, 25, 25, 21, 19, 19, 17, 0], [31, 4, 4, 4, 4, 4, 4, 0], [30, 17, 17, 30, 20, 18, 17, 0], [14, 17, 17, 17, 17, 17, 14, 0], [16, 16, 16, 16, 16, 16, 31, 0], [31, 16, 16, 30, 16, 16, 31, 0], [15, 16, 16, 14, 1, 1, 30, 0]];
    if(_tipo==2) return [[15, 16, 16, 16, 16, 16, 15, 0], [14, 17, 17, 17, 17, 17, 14, 0], [17, 25, 25, 21, 19, 19, 17, 0], [31, 16, 16, 30, 16, 16, 16, 0], [31, 4, 4, 4, 4, 4, 31, 0], [15, 16, 16, 23, 17, 17, 15, 0], [17, 17, 17, 17, 17, 17, 14, 0], [30, 17, 17, 30, 20, 18, 17, 0], [14, 17, 17, 31, 17, 17, 17, 0], [15, 16, 16, 16, 16, 16, 15, 1], [14, 17, 17, 17, 17, 17, 14, 2], [31, 16, 16, 30, 16, 16, 31, 0], [15, 16, 16, 14, 1, 1, 30, 0]];
    if(_tipo==3) return [[15, 16, 16, 14, 1, 1, 30, 0], [14, 17, 17, 31, 17, 17, 17, 0], [31, 4, 4, 4, 4, 4, 31, 0], [30, 17, 17, 30, 20, 18, 17, 0]];
    if(_tipo==4) return [[15, 16, 16, 16, 16, 16, 15, 0], [14, 17, 17, 17, 17, 17, 14, 0], [17, 25, 25, 21, 19, 19, 17, 0], [31, 4, 4, 4, 4, 4, 4, 0], [31, 4, 4, 4, 4, 4, 31, 0], [17, 25, 25, 21, 19, 19, 17, 0], [17, 17, 17, 17, 17, 17, 14, 0], [14, 17, 17, 31, 17, 17, 17, 0], [30, 17, 17, 30, 20, 18, 17, 0]];
    if(_tipo==5) return [[30, 17, 17, 30, 20, 18, 17, 0], [31, 16, 16, 30, 16, 16, 31, 0], [15, 16, 16, 16, 16, 16, 15, 0], [14, 17, 17, 17, 17, 17, 14, 0], [17, 27, 21, 21, 17, 17, 17, 0], [31, 16, 16, 30, 16, 16, 31, 0], [15, 16, 16, 16, 16, 16, 15, 1], [14, 17, 17, 31, 17, 17, 17, 0], [30, 17, 17, 30, 20, 18, 17, 0]];
    return [];
}
function bunker_cartao_desenhar(_tipo,_x,_y,_sx,_sy,_w,_h,_selecionado) {
    gpu_set_texfilter(false);draw_set_alpha(1);
    var _borda=make_color_rgb(27,19,14);
    var _ouro=make_color_rgb(195,147,65);
    var _luz=make_color_rgb(241,206,142);
    var _papel=make_color_rgb(194,165,117);
    var _base=make_color_rgb(45,67,78);
    var _sombra=make_color_rgb(25,41,51);
    var _texto=make_color_rgb(249,225,178);
    if(_tipo==1 || _tipo==5) {_base=_papel;_sombra=make_color_rgb(153,119,74);_texto=make_color_rgb(49,33,23);}
    if(_tipo==2) {_base=make_color_rgb(139,114,60);_sombra=make_color_rgb(95,74,34);}
    if(_tipo==3) {_base=make_color_rgb(126,49,35);_sombra=make_color_rgb(78,31,23);}
    // Cartão opaco até a borda: também serve à animação de saída em tela cheia.
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,0,0,_w,110,_borda);
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,3,3,_w-3,107,_sombra);
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,4,4,_w-6,103,_base);
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,4,3,_w-4,5,_selecionado ? _luz : _ouro);
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,3,5,5,103,_ouro);
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,6,36,_w-8,38,_sombra);
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,9,40,_w-10,41,_ouro);
    // Marcas discretas no papel/crachá, sempre longe das letras.
    for(var _i=0;_i<14;_i++) {
        var _px=10+((_i*43) % (_w-24));var _py=48+((_i*17) % 43);
        bunker_cartao_bloco(_x,_y,_sx,_sy,_h,_px,_py,_px+4,_py+2,_sombra);
    }
    for(var _costura=12;_costura<_w-12;_costura+=16)
        bunker_cartao_bloco(_x,_y,_sx,_sy,_h,_costura,96,_costura+7,98,_ouro);
    // Pequeno emblema com a mesma tinta e moldura do título.
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,10,8,35,33,_borda);
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,12,10,33,31,_ouro);
    bunker_cartao_bloco(_x,_y,_sx,_sy,_h,14,12,31,29,_sombra);
    var _icone=[0,0,0,0,0,0,0];
    if(_tipo==0 || _tipo==4) _icone=[16,24,28,30,28,24,16];
    if(_tipo==1) _icone=[14,31,21,31,17,0,0];
    if(_tipo==2) _icone=[10,31,14,27,14,31,10];
    if(_tipo==3) _icone=[24,20,23,21,23,20,24];
    if(_tipo==5) _icone=[14,17,16,23,21,5,2];
    for(var _iy=0;_iy<7;_iy++) for(var _ix=0;_ix<5;_ix++)
        if((_icone[_iy] & (1 << (4-_ix)))!=0)
            bunker_cartao_bloco(_x,_y,_sx,_sy,_h,17+_ix*2,13+_iy*2,19+_ix*2,15+_iy*2,_luz);
    // Letra de bloco 5x7, com cedilha e til próprios: a mesma nos dois menus.
    var _letras=bunker_cartao_letras(_tipo);
    var _inicio=floor((40+_w-(array_length(_letras)*18-3))*0.5);
    for(var _li=0;_li<array_length(_letras);_li++) {
        var _g=_letras[_li];var _gx=_inicio+_li*18;
        for(var _gy=0;_gy<7;_gy++) {
            var _col=0;
            while(_col<5) {
                if((_g[_gy] & (1 << (4-_col)))==0) {_col++;continue;}
                var _comeco=_col;
                while(_col<5 && (_g[_gy] & (1 << (4-_col)))!=0) _col++;
                bunker_cartao_bloco(_x,_y,_sx,_sy,_h,_gx+_comeco*3+1,10+_gy*3,_gx+_col*3+1,13+_gy*3,_sombra);
                bunker_cartao_bloco(_x,_y,_sx,_sy,_h,_gx+_comeco*3,9+_gy*3,_gx+_col*3,12+_gy*3,_texto);
            }
        }
        if(_g[7]==1) bunker_cartao_bloco(_x,_y,_sx,_sy,_h,_gx+6,30,_gx+9,33,_texto);
        if(_g[7]==2) {
            bunker_cartao_bloco(_x,_y,_sx,_sy,_h,_gx+3,5,_gx+8,7,_texto);
            bunker_cartao_bloco(_x,_y,_sx,_sy,_h,_gx+8,6,_gx+12,8,_texto);
        }
    }
    draw_set_color(c_white);draw_set_alpha(1);
}
