/// Apresentação, luz ambiente e cutscene da armadilha
if(room==Room_Ferramentas_N2) sala10_step(id);
if(room==Room_Laboratorio_N2) lab11_step(id);
if (tempo_apresentacao > 0) tempo_apresentacao--;
if (fade_entrada > 0) fade_entrada = max(0, fade_entrada - 0.025);
tempo_visual += 0.045;
tempo_tela++;
if (global.vitoria_ativa) bunker_vitoria_atualizar();
if (tempo_tela >= 30) {
    tempo_tela = 0;
    bunker_configurar_tela();
}
bunker_desempenho_tick();
v54_atualizar();
if (global.vitoria_ativa || global.v54_cena>0) bunker_camera_cinematica();
else bunker_camera_atualizar();
if (global.ruido_tempo > 0) global.ruido_tempo--;
bunker_audio_atualizar(bunker_audio_contexto());

if (room == Room_Recepcao) {
    objetivo_area = global.secretaria_orientou ? "LEVE O PROTOCOLO À SALA INDICADA" : "CONFIRME A VISTORIA COM A SECRETARIA";
}

// Inspeção opcional dos indícios ambientais espalhados pelos mapas.
if (indicio_tempo > 0) indicio_tempo--;
indicio_perto = -1;

if (tempo_apresentacao <= 0 && !global.cutscene_ativa && !global.dialogo_ativo && !global.diario_aberto && instance_exists(Obj_jogador)) {
    var jogador_vistoria = instance_nearest(0, 0, Obj_jogador);
    // Na recepção compacta, falar com a secretária e ler os papéis são pontos distintos.
    var menor_distancia_indicio = room == Room_Recepcao ? 30 : 86;

    for (var indice_indicio = 0; indice_indicio < array_length(indicio_x); indice_indicio++) {
        var distancia_indicio = point_distance(
            jogador_vistoria.x,
            jogador_vistoria.y,
            indicio_x[indice_indicio],
            indicio_y[indice_indicio]
        );

        if (distancia_indicio < menor_distancia_indicio
        && collision_line(jogador_vistoria.x, jogador_vistoria.y, indicio_x[indice_indicio], indicio_y[indice_indicio], Obj_parede, false, true) == noone) {
            menor_distancia_indicio = distancia_indicio;
            indicio_perto = indice_indicio;
        }
    }

    if (indicio_perto >= 0 && keyboard_check_pressed(ord("E"))) {
        var novo = bunker_registrar(indicio_registro[indicio_perto]);
        indicio_mensagem = indicio_texto[indicio_perto] + " [J] ABRIR DIÁRIO";
        indicio_tempo = 360;
        if (novo) bunker_audio_tocar_efeito(Snd_item, 7, false);
    }
}

if (room == Room_Armadilha && armadilha_tempo >= 0) {
    armadilha_tempo++;

    if (armadilha_tempo == 48 && !explosao_tocou) {
        explosao_tocou = true;
        global.armadilha_explodiu = true;
        // Silencia toda instância das duas trilhas antes do efeito e informa
        // que não há música ativa até a chegada ao andar inferior.
        bunker_audio_forcar("SILENCIO");
        bunker_audio_tocar_efeito(Snd_explosao, 30, false);
    }

    if (armadilha_tempo >= 205) {
        global.armadilha_concluida = true;
        global.cutscene_ativa = false;
        global.spawn_room = Room_Desmoronada;
        global.spawn_x = 105;
        global.spawn_y = 180;
        global.v5_queda_pendente=true;
        room_goto(Room_Desmoronada);
    }
}


// INTERAÇÕES / SALA DOS FUNCIONÁRIOS
// A arte é estática na Room; este bloco trata apenas estado e interação.
if (room == Room_Funcionarios) {
    if (func_mensagem_tempo > 0) func_mensagem_tempo--;
    func_interacao_proxima = "";

    if (!global.cutscene_ativa && !global.dialogo_ativo && !global.diario_aberto && !global.pause_aberto && instance_exists(Obj_jogador)) {
        var func_jogador = instance_nearest(0, 0, Obj_jogador);
        var func_melhor = 26;

        var func_dist_cafe = point_distance(func_jogador.x, func_jogador.y, 489, 286);
        if (func_dist_cafe < func_melhor) { func_melhor = func_dist_cafe; func_interacao_proxima = "cafe"; }

        var func_dist_chaves = point_distance(func_jogador.x, func_jogador.y, 404, 119);
        if (func_dist_chaves < func_melhor) { func_melhor = func_dist_chaves; func_interacao_proxima = "chaves"; }

        var func_dist_dorm = point_distance(func_jogador.x, func_jogador.y, 509, 145);
        if (func_dist_dorm < func_melhor) { func_melhor = func_dist_dorm; func_interacao_proxima = "dormitorio"; }

        if (func_interacao_proxima != "" && keyboard_check_pressed(ord("E"))) {
            switch (func_interacao_proxima) {
                case "cafe":
                    if (func_jogador.vida < func_jogador.vida_max) {
                        var func_vida_antes = func_jogador.vida;
                        func_jogador.vida = min(func_jogador.vida_max, func_jogador.vida + 35);
                        global.vida_jogador = func_jogador.vida;
                        func_feedback_frame = 4;
                        bunker_audio_tocar_efeito(Snd_item, 7, false);
                    } else {
                        func_feedback_frame = 5;
                    }
                    func_mensagem_tempo = 150;
                break;

                case "chaves":
                    if (!global.funcionarios_chaves_coletadas) {
                        global.chave_sala_ferramentas = true;
                        global.funcionarios_chaves_coletadas = true;
                        objetivo_area = "USE A CHAVE PARA EXPLORAR A SALA DE FERRAMENTAS";
                        func_feedback_frame = 6;
                        bunker_audio_tocar_efeito(Snd_item, 9, false);
                    } else {
                        func_feedback_frame = 7;
                    }
                    func_mensagem_tempo = 210;
                break;

                case "dormitorio":
                    func_feedback_frame = 8;
                    func_mensagem_tempo = 180;
                    bunker_audio_tocar_efeito(Snd_luz_negada, 8, false);
                break;
            }
        }
    }

    // Mantém os estados legados; a apresentação usa o painel GUI da parte 1.
    var func_feedback = instance_find(Obj_feedback_funcionarios, 0);
    if (func_feedback != noone) {
        func_feedback.image_speed = 0;
        func_feedback.visible = false;
        if (func_mensagem_tempo > 0) {
            func_feedback.visible = true;
            func_feedback.image_index = func_feedback_frame;
        } else if (func_interacao_proxima == "cafe") {
            func_feedback.visible = true; func_feedback.image_index = 1;
        } else if (func_interacao_proxima == "chaves") {
            func_feedback.visible = true; func_feedback.image_index = 2;
        } else if (func_interacao_proxima == "dormitorio") {
            func_feedback.visible = true; func_feedback.image_index = 3;
        }
    }
}
