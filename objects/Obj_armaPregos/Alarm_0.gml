

var faltando = municao_maxima - municao_atual;
var transferir = min(faltando, global.municao_reserva);
municao_atual += transferir;
global.municao_reserva -= transferir;
global.caixas_mecanicas = ceil(global.municao_reserva / 13);
if (dono != noone && instance_exists(dono)) dono.caixas_mecanicas = global.caixas_mecanicas;
recarregando = false;
pode_atirar = (municao_atual > 0);
global.municao_pistola = municao_atual;
