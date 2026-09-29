/// Desenho do jogador com respiração idle, arma na mão e feedback da finalização.
var sprite_desenho = sprite_index;
var quadro_desenho = image_index;
var lado_desenho = lado;
var arma_mao = noone;
var arma_tipo = global.equipamento_ativo;
var arma_objeto = (arma_tipo == "cano") ? Obj_cano : ((arma_tipo == "pistola") ? Obj_armaPregos : noone);
if (arma_objeto != noone) {
    for (var arma_i = 0; arma_i < instance_number(arma_objeto); arma_i++) {
        var candidata_arma = instance_find(arma_objeto, arma_i);
        if (candidata_arma.dono == id) { arma_mao = candidata_arma; break; }
    }
}
if (!takedown_ativo && (global.equipamento_ativo == "cano" || global.equipamento_ativo == "pistola")) {
    var angulo_desenho = point_direction(x, y - 12 * escala_personagem, mouse_x, mouse_y);
    if (instance_exists(arma_mao)) {
        if (arma_tipo == "cano" && arma_mao.atacando) angulo_desenho = arma_mao.ataque_direcao;
        // Atualiza o encaixe depois de todos os Steps, sem atraso de um quadro.
        bunker_pose_bracos(arma_mao, angulo_desenho, arma_tipo == "cano");
    }
    var direcao_desenho = floor((angulo_desenho + 45) / 90) mod 4;
    var lados_desenho = [2, 1, 3, 0];
    lado_desenho = lados_desenho[direcao_desenho];
    var andando_desenho = [Spr_jogador_andando_baixo, Spr_jogador_andando_cima,
        Spr_jogador_andando_direita, Spr_jogador_andando_esquerda];
    sprite_desenho = andando_desenho[lado_desenho];
}
if (abs(velh) + abs(velv) <= 0.01 && !takedown_ativo) {
    // A prancha fornecida possui uma pose idle para cada direção.
    if (lado_desenho == 0) sprite_desenho = Spr_jogador_idle_baixo;
    if (lado_desenho == 1) sprite_desenho = Spr_jogador_idle_cima;
    if (lado_desenho == 2) sprite_desenho = Spr_jogador_idle_direita;
    if (lado_desenho == 3) sprite_desenho = Spr_jogador_idle_esquerda;
    quadro_desenho = floor(idle_tempo * 0.75) mod max(1, sprite_get_number(sprite_desenho));
}
var escala_idle = escala_personagem * (1 + idle_breath);
draw_sprite_ext(sprite_desenho, quadro_desenho, x, y, escala_idle, escala_personagem, 0, c_white, image_alpha);

// A instância da arma continua existindo para lógica, munição e hitbox, mas o
// desenho da arma carregada passa por aqui. Assim ela sempre é renderizada
// depois do corpo, sobre as mãos, sem depender da ordem de criação da sala.
if (!global.cutscene_ativa && !global.dialogo_ativo && !global.diario_aberto && !global.pause_aberto) {
    if (instance_exists(arma_mao)) {
        draw_sprite_ext(arma_mao.sprite_index, arma_mao.image_index, arma_mao.x, arma_mao.y,
            arma_mao.image_xscale, arma_mao.image_yscale, arma_mao.image_angle, c_white, arma_mao.image_alpha);
        // De costas, o chapéu encobre somente o trecho dos braços que passa
        // atrás da cabeça. A arma continua na camada frontal do torso.
        if (lado_desenho == 1) {
            draw_sprite_part_ext(sprite_desenho, quadro_desenho, 0, 0, 32, 13,
                x - 16 * escala_idle, y - 32 * escala_personagem,
                escala_idle, escala_personagem, c_white, image_alpha);
        }
    }
}

if (takedown_pronto && instance_exists(takedown_alvo_pronto) && !takedown_ativo) {
    draw_set_alpha(0.95);
    draw_set_color(make_color_rgb(230, 205, 145));
    draw_set_halign(fa_center);
    draw_set_valign(fa_middle);
    draw_text_transformed(takedown_alvo_pronto.x, takedown_alvo_pronto.y - 45,
        "DIREITO: FINALIZAR", 0.68, 0.68, 0);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_alpha(1);
}

if (takedown_ativo) {
    var impacto = clamp(takedown_tempo / 44, 0, 1);
    var arco_x = x + lengthdir_x(29, takedown_direcao);
    var arco_y = y + lengthdir_y(29, takedown_direcao);
    draw_set_alpha(0.68 * (1 - impacto));
    draw_set_color(make_color_rgb(215, 181, 107));
    draw_circle(arco_x, arco_y, 18 + impacto * 18, true);
    draw_set_alpha(0.92);
    draw_line_width(x, y - 8, arco_x, arco_y, 3);
    draw_set_alpha(1);
}
