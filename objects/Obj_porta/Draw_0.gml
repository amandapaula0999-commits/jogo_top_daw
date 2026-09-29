if (variable_instance_exists(id,"tipo_passagem") && tipo_passagem!="porta") {
    v5_passagem_desenhar(id);
    exit;
}
/// Porta metálica; a sala indicada usa luz verde de brilho contido
if (!visual_estatico) {
if (porta_verde) {
    var brilho = 0.08 + 0.025 * sin(pulso_luz);
    draw_set_alpha(brilho);
    draw_set_color(make_color_rgb(78, 210, 118));
    draw_circle(x, y - altura * 0.38, 42, false);
    draw_set_alpha(1);
}

if (visual_bunker) {
    var sprite_porta = visual_restrita ? Spr_porta_bunker_restrita : Spr_porta_bunker_comum;
    var ultimo_quadro = sprite_get_number(sprite_porta) - 1;
    var quadro_desenho = clamp(floor(quadro_porta), 0, ultimo_quadro);
    if(room==Room1 && global.boss_derrotado) quadro_desenho=ultimo_quadro;
    // O quadro tem margens transparentes: preencher o vão estreito da saída.
    var escala_horizontal = room == Room_Funcionarios ? 1.2 : escala_visual;
    if (x < room_width * 0.5) escala_horizontal = -escala_horizontal;

    // Sombra discreta para integrar o sprite de 64px às paredes industriais.
    if (room != Room_Funcionarios) {
        draw_set_alpha(0.28);
        draw_set_color(c_black);
        draw_ellipse(x - 28, y + 34, x + 28, y + 43, false);
        draw_set_alpha(1);
    }
    draw_sprite_ext(sprite_porta, quadro_desenho, x, y, escala_horizontal, escala_visual, 0, c_white, 1);
} else {
    // Fachada e recepção mantêm a porta metálica maior já existente.
    draw_set_color(make_color_rgb(18, 19, 18));
    draw_rectangle(x - largura * 0.5 - 5, y - altura * 0.5 - 5, x + largura * 0.5 + 5, y + altura * 0.5 + 5, false);
    draw_set_color(make_color_rgb(64, 70, 67));
    draw_rectangle(x - largura * 0.5, y - altura * 0.5, x + largura * 0.5, y + altura * 0.5, false);
    draw_set_color(make_color_rgb(102, 111, 104));
    draw_rectangle(x - largura * 0.5 + 6, y - altura * 0.5 + 6, x - 2, y + altura * 0.5 - 6, false);
    draw_set_color(make_color_rgb(38, 41, 39));
    draw_rectangle(x + 2, y - altura * 0.5 + 6, x + largura * 0.5 - 6, y + altura * 0.5 - 6, false);

    draw_set_color(porta_verde ? make_color_rgb(77, 211, 112) : make_color_rgb(221, 164, 58));
    draw_rectangle(x + 10, y - 5, x + 17, y + 4, false);
    if (porta_verde) {
        draw_set_alpha(0.28);
        draw_set_color(make_color_rgb(95, 255, 133));
        draw_rectangle(x + 7, y - 8, x + 20, y + 7, false);
        draw_set_alpha(1);
    }
}
}

// Fase 2: nome branco acima da porta, sem painel de interação.
if (bunker_interface_fase2() || room == Room_Corredor_Pos) {
    bunker_porta_rotulo_desenhar(id);
    draw_set_halign(fa_left);
    draw_set_font(-1);
    draw_set_alpha(1);
    draw_set_color(c_white);
    exit;
}
var jogador = instance_nearest(x, y, Obj_jogador);
if (ativa && !abrindo && !global.pause_aberto && !global.diario_aberto && !global.config_aberta && !global.cutscene_ativa && !global.dialogo_ativo && bunker_porta_em_alcance(id, jogador)) {
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_color(c_white);
    if (room == Room_Funcionarios) {
        draw_text_transformed(125, y-60,"[E] " + rotulo,0.6,0.6,0);
    } else if (room == Room_Recepcao) {
        // Centraliza na porta real; a margem acompanha a largura do texto.
        // A margem fixa antiga (160) empurrava o nome para o meio da sala.
        var texto_porta = "[E] " + rotulo;
        var escala_texto = 0.60;
        var meia_largura = string_width(texto_porta) * escala_texto * 0.5;
        var texto_x = clamp(x, meia_largura + 4, room_width - meia_largura - 4);
        var texto_y = max(20, y - (destino == Room_Armadilha ? 60 : 44));
        draw_set_valign(fa_bottom);
        draw_text_transformed(texto_x,texto_y,texto_porta,escala_texto,escala_texto,0);
        draw_set_valign(fa_top);
    } else if (room == Room_Corredor_N2) {
        draw_text_transformed(x,max(12,y-64),"[E] " + rotulo,0.65,0.65,0);
    } else if (room == Room_Manutencao_N2 || room == Room_Ferramentas_N2) {
        draw_text_transformed(clamp(x,110,room_width-110),max(12,y-42),"[E] " + rotulo,0.75,0.75,0);
    } else draw_text(x, y - 64, "[E] " + rotulo);
}

if (mensagem_tempo > 0) {
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_color(make_color_rgb(135, 210, 146));
    if (room == Room_Recepcao) draw_text_transformed(clamp(x,160,room_width-160),max(12,y-70),mensagem_bloqueio,0.55,0.55,0);
    else if(chave_exigida=="ferramentas" || chave_exigida=="pe_cabra") draw_text_transformed(x,max(12,y-70),mensagem_bloqueio,0.55,0.55,0);
    else draw_text(x, y - 90, mensagem_bloqueio);
}
draw_set_halign(fa_left);
draw_set_font(-1);
draw_set_alpha(1);
draw_set_color(c_white);

if(room==Room1 && id==global.v54_porta) v54_bloqueio_desenhar();
