/// Menu v5.5: imagem selecionada em resolução nativa e cartões alinhados.
gpu_set_texfilter(false);
var gw = display_get_gui_width();
var gh = display_get_gui_height();
var sx = gw / 1366;
var sy = gh / 768;
var zoom_menu = 1;
var origem_x = 0;
var origem_y = 0;
var progresso_jogar = 0;
if (iniciando_jogo) {
    progresso_jogar = clamp(tempo_transicao / 120, 0, 1);
    var e = progresso_jogar * progresso_jogar * (3 - 2 * progresso_jogar);
    var foco_x = lerp(1095, 430, e);
    var foco_y = lerp(344, 430, e);
    zoom_menu = lerp(1, 2.45, e);
    var recorte_w = 1366 / zoom_menu;
    var recorte_h = 768 / zoom_menu;
    origem_x = -clamp(foco_x - recorte_w * 0.5, 0, 1366 - recorte_w) * zoom_menu * sx;
    origem_y = -clamp(foco_y - recorte_h * 0.5, 0, 768 - recorte_h) * zoom_menu * sy;
}
var desenho_sx = sx * zoom_menu;
var desenho_sy = sy * zoom_menu;
draw_set_alpha(1);
draw_set_color(c_white);
draw_sprite_ext(Spr_menu_fundo, 0, origem_x, origem_y, desenho_sx * 1366 / sprite_get_width(Spr_menu_fundo), desenho_sy * 768 / sprite_get_height(Spr_menu_fundo), 0, c_white, 1);

var extracao = clamp(saida_tempo / saida_extrair_duracao, 0, 1);
var extracao_suave = extracao * extracao * (3 - 2 * extracao);
var saida_y_livre = cartao_y[3] - cartao_altura[3] * cartao_escala[3] - 12;
var saida_y = lerp(saida_y_inicial, saida_y_livre, extracao_suave);
var zoom_saida = saindo_jogo && saida_tempo >= saida_extrair_duracao;
for (var i = 0; i < quantidade_opcoes; i++) {
    if (i == 3 && zoom_saida) continue;
    var cartao_sprite = i == 3 ? Spr_menu_sair : Spr_menu_cartoes;
    var quadro = i == 3 ? 0 : i;
    var cy = cartao_y[i] - hover_altura * animacao_cartao[i];
    if (i == 3 && saindo_jogo) cy = saida_y;
    var escala = cartao_escala[i];
    var altura_visivel = clamp((cartao_limite[i] - cy) / escala, 0, cartao_altura[i]);
    bunker_cartao_desenhar(i, origem_x+cartao_x[i]*desenho_sx, origem_y+cy*desenho_sy,
        escala*desenho_sx, escala*desenho_sy, cartao_largura[i], altura_visivel, selecionado==i);
}
// A borda do bolso fica à frente, sem apagar o texto da parte exposta.
// Spr_menu_bolsos antigo não é sobreposto à nova arte.
// Recompõe apenas o couro diagonal usando pixels do próprio fundo.
if(!saindo_jogo) {
    var bx=sprite_get_width(Spr_menu_fundo)/1366;
    var by=sprite_get_height(Spr_menu_fundo)/768;
    for(var linha=floor(404*by);linha<ceil(cartao_limite[3]*by);linha++) {
        var dy=linha/by;
        var direita=clamp(596+(dy-404)*229/22,cartao_x[3],cartao_x[3]+cartao_largura[3]*cartao_escala[3]);
        if(direita>cartao_x[3]) draw_sprite_part_ext(Spr_menu_fundo,0,
            cartao_x[3]*bx,linha,(direita-cartao_x[3])*bx,1,
            origem_x+cartao_x[3]*desenho_sx,origem_y+dy*desenho_sy,
            desenho_sx/bx,desenho_sy/by,c_white,1);
    }
}

if (zoom_saida) {
    var p_saida = clamp((saida_tempo - saida_extrair_duracao) / saida_zoom_duracao, 0, 1);
    var e_saida = p_saida * p_saida * (3 - 2 * p_saida);
    // O sprite é integralmente opaco; escala uniforme cobre toda proporção.
    var escala_inicial = cartao_escala[3] * min(sx, sy);
    var escala_final = max(gw / cartao_largura[3], gh / cartao_altura[3]) + 0.35;
    var escala_saida = lerp(escala_inicial, escala_final, e_saida);
    var centro_x = lerp((cartao_x[3] + cartao_largura[3] * cartao_escala[3] * 0.5) * sx, gw * 0.5, e_saida);
    var centro_y = lerp((saida_y_livre + cartao_altura[3] * cartao_escala[3] * 0.5) * sy, gh * 0.5, e_saida);
    var largura_saida = cartao_largura[3] * escala_saida;
    var altura_saida = cartao_altura[3] * escala_saida;
    var saida_x1 = centro_x - largura_saida * 0.5;
    var saida_y1 = centro_y - altura_saida * 0.5;
    draw_sprite_ext(Spr_menu_sair, 0, saida_x1, saida_y1, escala_saida, escala_saida, 0, c_white, 1);
    bunker_cartao_desenhar(3,saida_x1,saida_y1,escala_saida,escala_saida,cartao_largura[3],cartao_altura[3],true);
    saida_coberta_desenhada = p_saida >= 1 && saida_x1 <= 0 && saida_y1 <= 0
        && saida_x1 + largura_saida >= gw && saida_y1 + altura_saida >= gh;
}
if (saindo_jogo) exit;
if (iniciando_jogo) {
    draw_set_alpha(clamp((progresso_jogar - 0.78) / 0.22, 0, 1));
    draw_set_color(c_black);
    draw_rectangle(0, 0, gw, gh, false);
    draw_set_alpha(1);
}
if (global.config_aberta) {
    bunker_configuracoes_desenhar(global.config_selecionado);
    exit;
}
draw_set_font(Font_de_fala);
draw_set_halign(fa_center);
draw_set_valign(fa_middle);

if (mostrar_controles) {
    draw_set_alpha(0.93);
    draw_set_color(make_color_rgb(12, 10, 8));
    draw_rectangle(180 * sx, 105 * sy, 1186 * sx, 665 * sy, false);
    draw_set_alpha(1);
    draw_set_color(make_color_rgb(181, 112, 58));
    draw_rectangle(180 * sx, 105 * sy, 1186 * sx, 665 * sy, true);
    draw_rectangle(188 * sx, 113 * sy, 1178 * sx, 657 * sy, true);

    draw_set_color(make_color_rgb(238, 205, 139));
    draw_text_transformed(gw * 0.5, 160 * sy, "CONTROLES", 3.2 * sx, 3.2 * sy, 0);
    draw_set_color(c_white);
    draw_text_transformed(gw * 0.5, 245 * sy, "WASD  -  MOVER     SHIFT  -  FURTIVIDADE", 1.8 * sx, 1.8 * sy, 0);
    draw_text_transformed(gw * 0.5, 305 * sy, "E  -  INTERAGIR / PEGAR ITEM / USAR PORTA", 2.0 * sx, 2.0 * sy, 0);
    draw_text_transformed(gw * 0.5, 365 * sy, "MOUSE DIREITO  -  ATACAR OU DISPARAR", 2.0 * sx, 2.0 * sy, 0);
    draw_text_transformed(gw * 0.5, 415 * sy, "1 / 2  -  TROCAR CANO E PISTOLA", 1.8 * sx, 1.8 * sy, 0);
    draw_text_transformed(gw * 0.5, 465 * sy, "MOUSE ESQUERDO  -  RECARREGAR", 1.8 * sx, 1.8 * sy, 0);
    draw_text_transformed(gw * 0.5, 515 * sy, "ESPAÇO  -  ARREMESSAR CANO / AVANÇAR FALA", 1.8 * sx, 1.8 * sy, 0);
    draw_text_transformed(gw * 0.5, 560 * sy, "ESC  -  PAUSAR     J  -  DIÁRIO DE INSPEÇÃO", 1.8 * sx, 1.8 * sy, 0);
    draw_set_color(make_color_rgb(238, 205, 139));
    draw_text_transformed(gw * 0.5, 620 * sy, "ENTER, ESC OU CLIQUE PARA VOLTAR", 1.5 * sx, 1.5 * sy, 0);
}

draw_set_font(-1);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
draw_set_color(c_white);
