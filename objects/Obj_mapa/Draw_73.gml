/// Iluminação estável no Draw End, antes da interface.
///
/// A versão anterior usava uma malha de triângulos com alpha por vértice.
/// Em alguns drivers do Windows essa malha era recompilada com a superfície
/// da sala e produzia flashes verdes. Uma única camada normal é previsível,
/// não depende de interpolation de GPU e mantém a leitura do cenário.
gpu_set_blendmode(bm_normal);
draw_set_alpha(1);
draw_set_color(c_black);
var sombra = 0.30;
if (room == Room_Corredor_Pos) sombra = 0; // Sombras integradas na arte.
if (room == Room_Biblioteca || room == Room_Pesquisa || room == Room_Desmoronada || room == Room_Corredor) sombra = 0; // Paleta já sombreada no sprite.
// A nova arte já inclui o sombreado aprovado; evita escurecimento duplicado.
if (room == Room_Manutencao_N2 || room == Room_Funcionarios) sombra = 0;
if (room == Room_Laboratorio_N2 || room == Room_Corredor_N2 || room == Room_Ferramentas_N2) sombra = 0;
if (room == Room_Externa) sombra = 0.08;
if (room == Room_Recepcao) sombra = 0; // Luz acolhedora já faz parte do sprite.
if (room == Room_Armadilha) sombra = 0; // Cores originais da imagem enviada.
if (room == Room1) sombra = 0.24;
draw_set_alpha(sombra);
draw_rectangle(0, 0, room_width, room_height, false);
draw_set_alpha(1);
draw_set_color(c_white);
gpu_set_blendmode(bm_normal);
