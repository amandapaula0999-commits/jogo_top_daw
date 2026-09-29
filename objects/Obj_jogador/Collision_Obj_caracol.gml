#region/////////------COLISÃO E RECEBMENTO DE DANO
if (global.cutscene_ativa || global.dialogo_ativo) exit;


if (!invulneravel && !other.morrendo) {
    // Aplica o dano
    vida -= 10;
    
    // Ativa a invulnerabilidade
    invulneravel = true;
    image_alpha = 0.2;
    
    // Tempo de invulnerabilidade (180 frames = 3 segundos)
    alarm[0] = 180; 
    
    // Empurrão
    var _dir = point_direction(other.x, other.y, x, y);
    x += lengthdir_x(12, _dir);
    y += lengthdir_y(12, _dir);
}

#endregion////////////////////////////////
