#region/////////------POSSE E CONFIGURAÇÃO DA ARMA

dono = noone; // Começa no chão (sem dono)
escala_visual = bunker_escala_protagonista();
comprimento_cano = 13 * escala_visual;
image_speed = 0; // Os quatro quadros são direções, não um loop automático.
image_index = 1;
direcao_arma = 0;
direcao_mira = 0;

#endregion////////////////////////////////


#region/////////------SISTEMA DE MUNIÇÃO E RECARGA

municao_maxima = 13;          
municao_atual = 4;
if (variable_global_exists("inventario_pistola") && global.inventario_pistola
&& variable_global_exists("municao_pistola")) {
    municao_atual = global.municao_pistola;
}

recarregando = false; // Indica se está no tempo de recarga
pode_atirar = (municao_atual > 0);
visible = true;
image_xscale = escala_visual;
image_yscale = escala_visual;

#endregion////////////////////////////////
