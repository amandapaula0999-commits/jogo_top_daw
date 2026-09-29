/// Barril ampliado com respawn para impedir softlock na arena
atingido = false;
mostrar_chao = false;
sumindo = false;
alfa_caindo = 1;
acido_criado = false;
acido_id = noone;
respawn_tempo = -1;
respawn_max = 600; // 10 segundos em unidades de 60 Hz, avançadas por delta_time.
escala_barril = 2.8;
image_xscale = escala_barril;
image_yscale = escala_barril;

sprite_index = Spr_barril;
image_index = 0;
image_speed = 0;
