/// A poça dura tempo suficiente para atrair o chefe e some antes do respawn
if (global.pause_aberto || global.config_aberta || global.cutscene_ativa
|| global.dialogo_ativo || global.diario_aberto || global.vitoria_ativa) exit;
var passo = min(3, delta_time * 0.00006);
duracao -= passo;
pulso += 0.08 * passo;
if (duracao < 90) alpha_acido = 0.78 * max(0, duracao / 90);
image_alpha = alpha_acido;
if (duracao <= 0) instance_destroy();
