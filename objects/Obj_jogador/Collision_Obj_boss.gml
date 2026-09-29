/// Dano de contato com o chefe
if (global.pause_aberto || global.config_aberta || global.cutscene_ativa || global.dialogo_ativo || global.diario_aberto) exit;
if (!invulneravel && !other.morto && !other.fugindo && other.vida > 0
&& !other.derrotado && !other.ataque_ativo && other.contato_espera <= 0) {
    vida = max(0, vida - 12);
    global.vida_jogador = vida;
    invulneravel = true;
    image_alpha = 0.35;
    alarm[0] = 90;

    var direcao_empurrao = point_direction(other.x, other.y, x, y);
    var nx = x + lengthdir_x(18, direcao_empurrao);
    var ny = y + lengthdir_y(18, direcao_empurrao);
    if (!place_meeting(nx, y, Obj_parede)) x = nx;
    if (!place_meeting(x, ny, Obj_parede)) y = ny;
}
