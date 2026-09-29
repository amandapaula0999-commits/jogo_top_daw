draw_self();
var jogador=instance_nearest(x,y,Obj_jogador);
if(jogador!=noone && point_distance(x,y,jogador.x,jogador.y)<=70 && !global.cutscene_ativa) {
    draw_set_font(Font_de_fala);draw_set_halign(fa_center);
    draw_set_color(make_color_rgb(225,196,94));
    draw_text(x,y-40,"[E] CHAVE DA ESCADARIA");
    draw_set_halign(fa_left);draw_set_font(-1);draw_set_color(c_white);
}
