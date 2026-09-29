/// Carcaça decorativa: sprite pronto, sem Draw, IA ou colisão de dano.
if (!variable_global_exists("boss_derrotado") || !global.boss_derrotado) {
    instance_destroy();
    exit;
}
image_speed = 0;
image_index = 0;
image_angle = 0;
image_xscale = 3;
image_yscale = 3;
depth = 80; // Sobre o piso, atrás do jogador.
