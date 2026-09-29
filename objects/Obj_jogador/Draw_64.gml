/// Interface do jogador, pausa e caderneta de vistoria.
// Estes dois menus vivem no Draw GUI do jogador. Como o jogador permanece
// ativo quando instance_deactivate_all(true) congela a sala, a interface não
// desaparece e não depende de uma instância de menu temporária.

if (global.config_aberta) {
    bunker_configuracoes_desenhar(global.config_selecionado);
    exit;
}

if (global.diario_aberto) {
    var diario_gw = display_get_gui_width();
    var diario_gh = display_get_gui_height();
    var diario_total = array_length(global.evidencias);
    var diario_pagina = clamp(global.diario_pagina, 0, max(0, diario_total - 1));
    draw_set_alpha(1);
    draw_set_color(make_color_rgb(14, 23, 20));
    draw_rectangle(0, 0, diario_gw, diario_gh, false);

    // Caderneta limpa, ocupando toda a GUI sem barras laterais artificiais.
    draw_set_color(make_color_rgb(50, 30, 20));
    draw_rectangle(84, 54, diario_gw - 84, diario_gh - 54, false);
    draw_set_color(make_color_rgb(184, 158, 112));
    draw_rectangle(96, 42, diario_gw - 96, diario_gh - 42, false);
    draw_set_color(make_color_rgb(229, 218, 181));
    draw_rectangle(112, 58, diario_gw * 0.5 - 8, diario_gh - 58, false);
    draw_rectangle(diario_gw * 0.5 + 8, 58, diario_gw - 112, diario_gh - 58, false);
    draw_set_color(make_color_rgb(111, 79, 51));
    draw_rectangle(diario_gw * 0.5 - 4, 58, diario_gw * 0.5 + 4, diario_gh - 58, false);
    for (var diario_esp = 92; diario_esp < diario_gh - 70; diario_esp += 42) {
        draw_set_color(make_color_rgb(65, 55, 46));
        draw_circle(diario_gw * 0.5, diario_esp, 6, false);
    }

    draw_set_font(Font_de_fala);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_color(make_color_rgb(75, 52, 34));
    draw_text_transformed(145, 82, "CADERNETA DE VISTORIA", 2.0, 2.0, 0);
    draw_set_color(make_color_rgb(102, 74, 49));
    draw_text(145, 124, string(diario_total) + " / 7 ANOTAÇÕES   |   COMPLEXO NEREIDA");

    if (diario_total == 0) {
        draw_set_color(make_color_rgb(75, 56, 38));
        draw_text_ext(145, 210, "Aproxime-se das pranchetas e pressione E para registrar uma irregularidade.\n\nVocê veio como inspetor ambiental. Observe, compare e anote: cada registro ajuda a reconstruir o que foi omitido da vistoria.", 27, 500);
        draw_set_color(make_color_rgb(102, 74, 49));
        draw_text_ext(diario_gw * 0.5 + 72, 220, "PROTOCOLO\n\nRegistre documentos, vazamentos e infrações sem tocar em materiais desconhecidos.\n\nAs anotações ficam salvas entre as salas.", 27, 440);
    } else {
        var diario_reg = global.evidencias[diario_pagina];
        draw_set_color(make_color_rgb(75, 52, 34));
        draw_text_transformed(145, 174, diario_reg.titulo, 1.35, 1.35, 0);
        draw_set_color(make_color_rgb(115, 82, 53));
        draw_text(145, 210, diario_reg.local);
        var diario_titulos = ["OBSERVAÇÃO", "AVALIAÇÃO", "PROCEDIMENTO REGISTRADO", "RELAÇÃO COM A VISTORIA"];
        var diario_textos = [diario_reg.observacao, diario_reg.avaliacao, diario_reg.procedimento, diario_reg.vinculo];
        var diario_linha = 255;
        for (var diario_i = 0; diario_i < 4; diario_i++) {
            draw_set_color(make_color_rgb(130, 88, 52));
            draw_text(145, diario_linha, diario_titulos[diario_i]);
            draw_set_color(make_color_rgb(75, 56, 38));
            draw_text_ext(145, diario_linha + 22, diario_textos[diario_i], 22, 500);
            diario_linha += 22 + string_height_ext(diario_textos[diario_i], 22, 500) + 22;
        }
        draw_set_color(make_color_rgb(102, 74, 49));
        draw_text_ext(diario_gw * 0.5 + 72, 220, "LEITURA DE CAMPO\n\nEsta página registra uma evidência observada no local. Use as setas ou A/D para comparar as páginas e encontrar o padrão das irregularidades.", 27, 440);
        draw_set_color(make_color_rgb(130, 88, 52));
        draw_text(diario_gw * 0.5 + 72, 480, "CÓDIGO DO REGISTRO");
        draw_set_color(make_color_rgb(75, 56, 38));
        draw_text(diario_gw * 0.5 + 72, 512, diario_reg.codigo);
    }

    draw_set_color(make_color_rgb(102, 74, 49));
    draw_text(145, diario_gh - 78, "A/D OU SETAS: FOLHAS     J / ESC: FECHAR");
    draw_text(diario_gw - 410, diario_gh - 78, string(min(diario_total, diario_pagina + 1)) + "/" + string(diario_total));
    draw_set_font(-1);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_alpha(1);
    draw_set_color(c_white);
    exit;
}

if (global.pause_aberto) {
    gpu_set_texfilter(false);
    var pause_gw = display_get_gui_width();
    var pause_gh = display_get_gui_height();
    var pause_selecionado = clamp(global.pause_selecionado, 0, 3);
    var pause_layout = bunker_pause_layout(pause_gw, pause_gh);
    var pause_sx = pause_layout[0];
    var pause_sy = pause_sx;
    var pause_ox = round(pause_layout[1]);
    var pause_oy = round(pause_layout[2]);
    var pause_cartoes = bunker_pause_cartoes();
    var pause_cartao_x = pause_cartoes[0];
    var pause_cartao_y = pause_cartoes[1];
    var pause_cartao_limite = pause_cartoes[2];
    var pause_cartao_largura = pause_cartoes[3];
    var pause_cartao_altura = pause_cartoes[4];
    var pause_cartao_escala = pause_cartoes[5];
    var pause_hover_altura = pause_cartoes[6];

    // Imagem recebida integral, sem redesenho. Somente cartões por cima.
    draw_set_alpha(1);
    draw_set_color(c_black);
    draw_rectangle(0, 0, pause_gw, pause_gh, false);
    draw_set_color(c_white);
    draw_sprite_ext(Spr_pause_fundo, 0, pause_ox, pause_oy, pause_sx, pause_sy, 0, c_white, 1);

    // Cartões primeiro; o couro frontal é desenhado depois para parecer que
    // cada opção está realmente inserida na ranhura correspondente.
    for (var pause_i = 0; pause_i < 4; pause_i++) {
        var pause_sprite = pause_i == 3 ? Spr_menu_sair : Spr_pause_cartoes;
        var pause_quadro = pause_i == 3 ? 0 : pause_i;
        var pause_y = pause_cartao_y[pause_i] - pause_hover_altura * pause_animacao_cartao[pause_i];
        var pause_escala = pause_cartao_escala[pause_i];
        var pause_altura_visivel = clamp((pause_cartao_limite[pause_i] - pause_y) / pause_escala,
            0, pause_cartao_altura[pause_i]);
        var pause_tipo=pause_i==0 ? 4 : (pause_i==1 ? 5 : pause_i);
        bunker_cartao_desenhar(pause_tipo,
            round(pause_ox+pause_cartao_x[pause_i]*pause_sx),round(pause_oy+pause_y*pause_sy),
            pause_escala*pause_sx,pause_escala*pause_sy,pause_cartao_largura[pause_i],pause_altura_visivel,
            pause_selecionado==pause_i);
    }
    // Os acabamentos são recortes exatos da nova arte, à frente dos cartões.
    for (var pause_b = 0; pause_b < 4; pause_b++) {
        var pause_bx = pause_b == 3 ? 120 : 765;
        var pause_bw = pause_b == 3 ? 415 : 490;
        var pause_by = pause_cartao_limite[pause_b];
        draw_sprite_part_ext(Spr_pause_fundo, 0, pause_bx, pause_by, pause_bw, 16,
            pause_ox + pause_bx * pause_sx, pause_oy + pause_by * pause_sy,
            pause_sx, pause_sy, c_white, 1);
    }

    draw_set_font(-1);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_alpha(1);
    draw_set_color(c_white);
    exit;
}

if (global.cutscene_ativa) exit;
var tem_equipamento = global.inventario_pistola || global.inventario_cano;
bunker_painel(16, 16, 276, tem_equipamento ? 143 : 72);
draw_set_font(Font_de_fala);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
draw_set_color(make_color_rgb(31, 42, 36));
draw_rectangle(30, 31, 274, 42, false);
draw_set_color(make_color_rgb(151, 68, 49));
draw_rectangle(30, 31, 30 + 244 * max(0, vida) / vida_max, 42, false);
draw_set_color(make_color_rgb(215, 208, 178));
draw_text(30, 51, "CONDIÇÃO " + string(max(0, floor(vida))) + "%");
// A arma não faz parte do equipamento inicial. O bloco só aparece depois
// que o jogador realmente coleta a pistola de pregos; antes disso a HUD fica
// limpa e não promete um recurso que ainda não existe.
if (tem_equipamento) {
    var equipamento = global.inventario_pistola ? "[2] PISTOLA DE PREGOS" : "[1] CANO";
    if (global.inventario_pistola && global.equipamento_ativo == "cano") equipamento = "[1] CANO  |  [2] PISTOLA";
    draw_text(30, 73, equipamento);
    if (global.inventario_pistola) {
        draw_set_color(make_color_rgb(161, 178, 155));
        draw_text(30, 96, "PENTE " + string(global.municao_pistola) + "  /  RESERVA " + string(global.municao_reserva));
    }
    draw_set_color(furtivo ? make_color_rgb(164, 190, 145) : make_color_rgb(184, 158, 106));
    draw_text(30, 122, furtivo ? "SHIFT: PASSOS LEVES" : "SHIFT: ANDAR EM SILÊNCIO");
}
bunker_painel(1094, 16, 256, 60);
draw_set_color(make_color_rgb(214, 197, 148));
draw_text(1110, 37, "[J] DIÁRIO  " + string(array_length(global.evidencias)) + " / 7");
draw_set_alpha(1);
draw_set_color(c_white);
draw_set_font(-1);
