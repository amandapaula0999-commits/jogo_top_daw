#region/////////------CONFIGURAÇÃO E STATUS DO CANO

dono = noone;// ID de quem está segurand
atacando = false;// Controla a animação/estado do golpe
dano_cano = 4;// Valor de dano aplicado nos inimigos
escala_visual = 0.55 * bunker_escala_protagonista(); // Item de chão/arremesso em resolução antiga.
escala_ataque = bunker_escala_protagonista(); // Mesmo fator dos novos quadros do protagonista.
ataque_tempo = 0;
ataque_recarga = 0;
ataque_pixels_anteriores = [];
ataque_direcao = 0;
direcao_mira = 0;
direcao_arma = 0;
ataque_atingiu = false;
ataque_ponta_valida = false;
ataque_ponta_x = x;
ataque_ponta_y = y;
image_speed = 0;
visible = true;
image_xscale = escala_visual;
image_yscale = escala_visual;

#endregion////////////////////////////////
