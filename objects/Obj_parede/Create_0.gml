/// Obstáculo genérico usado pelos mapas
// Respeita também as dimensões das instâncias posicionadas no Room Editor.
largura = max(1, round(sprite_get_width(Spr_parede) * abs(image_xscale)));
altura = max(1, round(sprite_get_height(Spr_parede) * abs(image_yscale)));
tipo = 0;
