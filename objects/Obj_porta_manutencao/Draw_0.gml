// Somente o texto de interação. Arte inteira em sprites pré-carregados.
if (global.pause_aberto || global.diario_aberto || global.config_aberta
    || global.cutscene_ativa || global.dialogo_ativo || global.vitoria_ativa) exit;
var jogador = instance_nearest(x,y,Obj_jogador);
if (jogador == noone) exit;
var texto = "";
var tx = x;
var ty = y - 48;
if (!aberta && point_distance(x,y,jogador.x,jogador.y) <= raio_interacao)
    texto = global.inventario_pe_cabra ? "[SEGURE E / 3 s] ABRIR CÂMARA FRIA" : "[E] TENTAR ABRIR";
else if (aberta && jogador.y >= 174 && point_distance(jogador.x,jogador.y,317,163) <= 28) {
    texto = global.inventario_cartao_acesso ? "[E] FALAR" : "[E] PEGAR CRACHÁ";
    tx = 315;
    ty = 137;
}
if (texto != "") {
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    draw_set_alpha(1);
    draw_set_color(c_white);
    draw_text_transformed(tx,ty,texto,0.6,0.6,0);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_font(-1);
}
