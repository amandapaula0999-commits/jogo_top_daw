// Câmara fria na mesma Room. Pausa e soltar E interrompem o esforço.
if (global.pause_aberto || global.diario_aberto || global.config_aberta || global.vitoria_ativa) {
    esforco = 0;
    input_liberado = false;
    exit;
}
var dt = min(delta_time / 1000000, 0.1);
if (fala_etapa > 0) {
    esforco = 0;
    if (fala_espera > 0) fala_espera = max(0, fala_espera - dt);
    if (fala_etapa == 1 && fala_espera <= 0) {
        fala_etapa = 2;
        fala_texto = "VOZ ABAFADA: Socorro... Tem alguém aí? Por favor, abra a porta!";
        fala_espera = 0.6;
        global.deposito_ajuda_ouvida = true;
    } else if (fala_etapa != 1 && fala_espera <= 0 && keyboard_check_pressed(vk_space)) {
        fala_etapa = 0;
        global.dialogo_ativo = false;
        input_liberado = false;
    }
    exit;
}
if (global.cutscene_ativa || global.dialogo_ativo) {
    esforco = 0;
    input_liberado = false;
    exit;
}
var jogador = instance_nearest(x, y, Obj_jogador);
if (jogador == noone) { esforco = 0; exit; }
if (!keyboard_check(ord("E"))) input_liberado = true;
var perto = point_distance(x, y, jogador.x, jogador.y) <= raio_interacao;
if (!aberta) {
    if (!perto || !keyboard_check(ord("E"))) esforco = 0;
    if (perto && input_liberado) {
        if (!global.inventario_pe_cabra && keyboard_check_pressed(ord("E"))) {
            fala_texto = global.visitou_ferramentas
                ? "A porta está trancada e emperrada. Preciso voltar à sala de ferramentas e pegar o pé de cabra."
                : "A porta está trancada e emperrada. Não consigo abri-la com as mãos.";
            fala_etapa = global.deposito_ajuda_ouvida ? 3 : 1;
            fala_espera = global.deposito_ajuda_ouvida ? 0.4 : (global.visitou_ferramentas ? 3.5 : 1.8);
            global.dialogo_ativo = true;
            esforco = 0;
        } else if (global.inventario_pe_cabra && keyboard_check(ord("E"))) {
            esforco = min(3, esforco + dt);
            if (esforco >= 3 - 0.000001) {
                aberta = true;
                global.manutencao_porta_aberta = true;
                if (instance_exists(bloqueio)) instance_destroy(bloqueio);
                bloqueio = noone;
                esforco = 0;
                input_liberado = false;
                bunker_audio_tocar_efeito(Snd_porta, 12, false);
            }
        }
    }
} else {
    // Homem está sentado no chão, escorado na prateleira dentro da câmara.
    if (point_distance(jogador.x,jogador.y,317,163) <= 28
        && jogador.y >= 174 && input_liberado && keyboard_check_pressed(ord("E"))) {
        if (!global.inventario_cartao_acesso) {
            global.inventario_cartao_acesso = true;
            fala_texto = "HOMEM: Obrigado... Leve meu crachá. Ele dá acesso à sala de pesquisa.\n\nCrachá de Acesso adicionado ao inventário.";
            bunker_audio_tocar_efeito(Snd_item, 9, false);
        } else fala_texto = "Já estou com o crachá. Agora consigo entrar na sala de pesquisa.";
        fala_etapa = 3;
        fala_espera = 0.4;
        global.dialogo_ativo = true;
        input_liberado = false;
    }
}
// Troca de sprite pré-carregado, sem desenhar telhado, piso ou móveis por código.
var cenario = instance_find(Obj_sala_manutencao_cenario, 0);
if (cenario != noone) cenario.image_index = aberta ? 1 : 0;
