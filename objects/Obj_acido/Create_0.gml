/// Poça de ácido de área ampla
alpha_acido = 0.78;
image_xscale = 1.0;
image_yscale = 1.0;
duracao = 540; // 9 segundos em unidades de 60 Hz, avançadas por delta_time.
pulso = random(100);
origem_barril = noone;

// A poça é piso: fica atrás do jogador, do chefe e do barril (depth 0),
// mas à frente do mapa (depth 1000).
depth = 100;
image_speed = 0;

image_alpha = alpha_acido;
