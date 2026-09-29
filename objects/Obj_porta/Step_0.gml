/// Usa a porta com E e salva o estado antes da troca de room
if (global.pause_aberto || global.diario_aberto || global.config_aberta) exit;
if (variable_instance_exists(id,"tipo_passagem") && tipo_passagem!="porta") {
    v5_passagem_atualizar(id);
    exit;
}
pulso_luz += 0.06;
if (mensagem_tempo > 0) mensagem_tempo--;

visual_bunker = (
    room == Room_Desmoronada
    || room == Room_Corredor_Pos
    || room == Room_Corredor_N2
    || room == Room_Funcionarios
    || room == Room_Corredor
    || room == Room_Pesquisa
    || room == Room_Biblioteca
    || room == Room1
);
visual_restrita = visual_bunker && (room == Room1 || destino == Room1);

// Mantém o quadro final visível por cinco Steps antes de trocar de sala.
// room_goto no mesmo Step que alcança o último quadro impediria seu Draw.
if (abrindo) {
    var sprite_animacao = visual_restrita ? Spr_porta_bunker_restrita : Spr_porta_bunker_comum;
    var quadro_final = sprite_get_number(sprite_animacao) - 1;
    if (quadro_porta < quadro_final) {
        quadro_porta = min(quadro_final, quadro_porta + velocidade_porta);
    } else {
        espera_aberta--;
        if (espera_aberta <= 0) {
            // Obj_mapa da próxima sala libera o controle no Create.
            if(variable_instance_exists(id,"saida_final") && saida_final) {
                abrindo=false;
                bunker_vitoria_iniciar(x,y);
            } else room_goto(destino);
        }
    }
    exit;
}

if (global.cutscene_ativa || global.dialogo_ativo) exit;

var jogador = instance_nearest(x, y, Obj_jogador);
if (ativa && bunker_porta_em_alcance(id, jogador)) {
    if (keyboard_check_pressed(ord("E"))) {
        if (!v53_porta_liberada(id)) {
            mensagem_tempo=180;
            if (chave_exigida == "laboratorio") {
                mensagem_bloqueio = "PRECISO DE UM CRACHÁ DE ACESSO PARA ENTRAR NA SALA DE PESQUISA.";
            } else if (chave_exigida == "pe_cabra") {
                mensagem_bloqueio = "PRECISO DO PÉ DE CABRA PARA ABRIR A SALA FRIA";
            } else if (chave_exigida == "ferramentas") {
                mensagem_bloqueio = "PRECISO DA CHAVE DA SALA DE FERRAMENTAS";
            } else if (chave_exigida == "cientista") {
                mensagem_bloqueio = "PRECISO DA CHAVE DO CIENTISTA";
            } else if (global.v53_chave_escada) {
                mensagem_bloqueio = "PRECISO LIBERAR A SAÍDA DA ARENA";
            } else {
                mensagem_bloqueio = "PRECISO DA CHAVE DA SALA DO BOSS";
            }
            bunker_audio_tocar_efeito(Snd_luz_negada,15,false);
        } else if (requer_orientacao && !global.secretaria_orientou && !(variable_global_exists("modo_teste_portas_livres") && global.modo_teste_portas_livres)) {
            mensagem_tempo = 150;
            bunker_audio_tocar_efeito(Snd_luz_negada, 15, false);
        } else {
            global.vida_jogador = jogador.vida;
            global.caixas_mecanicas = jogador.caixas_mecanicas;
            global.spawn_room = destino;
            global.spawn_x = spawn_x;
            global.spawn_y = spawn_y;
            bunker_audio_tocar_efeito(Snd_porta, 12, false);
            if (visual_bunker && !visual_estatico) {
                ativa = false;
                abrindo = true;
                quadro_porta = 0;
                espera_aberta = 5;
                global.cutscene_ativa = true;
            } else {
                room_goto(destino);
            }
        }
    }
}
