if (modo_diario) {
    var diario_gw = display_get_gui_width();
    var diario_gh = display_get_gui_height();
    draw_set_alpha(1);
    draw_set_color(make_color_rgb(14, 23, 20));
    draw_rectangle(0, 0, diario_gw, diario_gh, false);
    // Caderneta de anotações: duas páginas, papel envelhecido e espiral.
    draw_set_color(make_color_rgb(50, 30, 20));
    draw_rectangle(84, 54, diario_gw - 84, diario_gh - 54, false);
    draw_set_color(make_color_rgb(184, 158, 112));
    draw_rectangle(96, 42, diario_gw - 96, diario_gh - 42, false);
    draw_set_color(make_color_rgb(229, 218, 181));
    draw_rectangle(112, 58, diario_gw * 0.5 - 8, diario_gh - 58, false);
    draw_rectangle(diario_gw * 0.5 + 8, 58, diario_gw - 112, diario_gh - 58, false);
    draw_set_color(make_color_rgb(111, 79, 51));
    draw_rectangle(diario_gw * 0.5 - 4, 58, diario_gw * 0.5 + 4, diario_gh - 58, false);
    for (var esp = 92; esp < diario_gh - 70; esp += 42) {
        draw_set_color(make_color_rgb(65, 55, 46));
        draw_circle(diario_gw * 0.5, esp, 6, false);
    }
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_color(make_color_rgb(75, 52, 34));
    draw_text_transformed(145, 82, "CADERNETA DE VISTORIA", 2.0, 2.0, 0);
    draw_set_color(make_color_rgb(102, 74, 49));
    var total = array_length(global.evidencias);
    draw_text(145, 124, string(total) + " / 7 ANOTAÇÕES   |   COMPLEXO NEREIDA");
    if (total == 0) {
        draw_set_color(make_color_rgb(75, 56, 38));
        draw_text_ext(145, 210, "Aproxime-se das pranchetas e pressione E para registrar uma irregularidade.\n\nVocê veio como inspetor ambiental. Observe, compare e anote: cada registro ajuda a reconstruir o que foi omitido da vistoria.", 27, 500);
    } else {
        var reg = global.evidencias[pagina_diario];
        draw_set_color(make_color_rgb(75, 52, 34));
        draw_text_transformed(145, 174, reg.titulo, 1.35, 1.35, 0);
        draw_set_color(make_color_rgb(115, 82, 53));
        draw_text(145, 210, reg.local);
        var titulos = ["OBSERVAÇÃO", "AVALIAÇÃO", "PROCEDIMENTO REGISTRADO", "RELAÇÃO COM A VISTORIA"];
        var textos = [reg.observacao, reg.avaliacao, reg.procedimento, reg.vinculo];
        var linha = 255;
        for (var i = 0; i < 4; i++) {
            draw_set_color(make_color_rgb(130, 88, 52));
            draw_text(145, linha, titulos[i]);
            draw_set_color(make_color_rgb(75, 56, 38));
            draw_text_ext(145, linha + 22, textos[i], 22, 500);
            linha += 22 + string_height_ext(textos[i], 22, 500) + 22;
        }
    }
    draw_set_color(make_color_rgb(102, 74, 49));
    draw_text(145, 690, "A/D OU SETAS: FOLHAS     J / ESC: FECHAR     |     " + string(min(total, pagina_diario + 1)) + "/" + string(total));
    draw_set_font(-1);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_alpha(1);
    draw_set_color(c_white);
    exit;
}
/// Pause - carteira e cartões em pixel art
var gw = display_get_gui_width();
var gh = display_get_gui_height();
var sx = gw / 1366;
var sy = gh / 768;

draw_set_alpha(0.78);
draw_set_color(make_color_rgb(6, 7, 7));
draw_rectangle(0, 0, gw, gh, false);
draw_set_alpha(1);

draw_set_font(Font_de_fala);
draw_set_halign(fa_center);
draw_set_valign(fa_middle);
draw_set_color(make_color_rgb(235, 202, 135));
draw_text_transformed(683 * sx, 72 * sy, "PAUSADO", 3.5 * sx, 3.5 * sy, 0);

// Carteira marrom aberta.
draw_set_color(make_color_rgb(27, 15, 10));
draw_rectangle(188 * sx, 125 * sy, 1178 * sx, 648 * sy, false);
draw_set_color(make_color_rgb(91, 43, 25));
draw_rectangle(202 * sx, 139 * sy, 1164 * sx, 634 * sy, false);
draw_set_color(make_color_rgb(126, 64, 35));
draw_rectangle(216 * sx, 153 * sy, 1150 * sx, 620 * sy, false);

// Dobra central e bolsos da esquerda.
draw_set_color(make_color_rgb(59, 28, 18));
draw_rectangle(574 * sx, 153 * sy, 594 * sx, 620 * sy, false);
draw_rectangle(244 * sx, 210 * sy, 535 * sx, 335 * sy, false);
draw_rectangle(244 * sx, 366 * sy, 535 * sx, 548 * sy, false);
draw_set_color(make_color_rgb(158, 88, 45));
draw_rectangle(244 * sx, 210 * sy, 535 * sx, 218 * sy, false);
draw_rectangle(244 * sx, 366 * sy, 535 * sx, 374 * sy, false);

// Costuras.
draw_set_color(make_color_rgb(213, 143, 70));
for (var cost_x = 230; cost_x < 1135; cost_x += 34) {
    draw_rectangle(cost_x * sx, 166 * sy, (cost_x + 20) * sx, 170 * sy, false);
    draw_rectangle(cost_x * sx, 601 * sy, (cost_x + 20) * sx, 605 * sy, false);
}

var card_y = [278, 390, 502];
var card_cor = [make_color_rgb(73, 117, 43), make_color_rgb(222, 208, 179), make_color_rgb(142, 45, 39)];
var card_luz = [make_color_rgb(136, 177, 65), make_color_rgb(245, 233, 207), make_color_rgb(193, 66, 54)];
var card_texto = ["CONTINUAR", "RECOMEÇAR", "SAIR PARA O MENU"];

for (var i = quantidade_opcoes - 1; i >= 0; i--) {
    var px = 26 * puxado[i] + 3 * sin(pulso) * puxado[i];
    var x1 = (610 + px) * sx;
    var x2 = (1114 + px) * sx;
    var y1 = (card_y[i] - 43 - 10 * puxado[i]) * sy;
    var y2 = (card_y[i] + 43 - 10 * puxado[i]) * sy;

    draw_set_alpha(0.55);
    draw_set_color(c_black);
    draw_rectangle(x1 + 10 * sx, y1 + 11 * sy, x2 + 10 * sx, y2 + 11 * sy, false);
    draw_set_alpha(1);
    draw_set_color(make_color_rgb(20, 13, 9));
    draw_rectangle(x1 - 6 * sx, y1 - 6 * sy, x2 + 6 * sx, y2 + 6 * sy, false);
    draw_set_color(card_cor[i]);
    draw_rectangle(x1, y1, x2, y2, false);
    draw_set_color(card_luz[i]);
    draw_rectangle(x1 + 8 * sx, y1 + 8 * sy, x2 - 8 * sx, y1 + 15 * sy, false);
    draw_set_color(make_color_rgb(24, 15, 10));
    draw_text_transformed((862 + px) * sx, (card_y[i] - 10 * puxado[i]) * sy, card_texto[i], 2.25 * sx, 2.25 * sy, 0);
}

// Bolso frontal da carteira.
draw_set_color(make_color_rgb(43, 22, 15));
draw_rectangle(598 * sx, 544 * sy, 1150 * sx, 620 * sy, false);
draw_set_color(make_color_rgb(104, 51, 29));
draw_rectangle(610 * sx, 554 * sy, 1138 * sx, 608 * sy, false);

// Mascote formiga do próprio projeto.
var total_quadros = max(1, sprite_get_number(Spr_parado_baixo));
draw_sprite_ext(Spr_parado_baixo, floor(quadro_formiga) mod total_quadros, 390 * sx, 475 * sy, 2.2 * sx, 2.2 * sy, 0, c_white, 1);

draw_set_color(make_color_rgb(231, 205, 153));
draw_text_transformed(683 * sx, 704 * sy, "W/S OU SETAS: SELECIONAR     ENTER: CONFIRMAR     ESC/P: VOLTAR", 1.45 * sx, 1.45 * sy, 0);

draw_set_font(-1);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
draw_set_alpha(1);
draw_set_color(c_white);
