if (global.cutscene_ativa || global.dialogo_ativo || global.diario_aberto || global.pause_aberto) exit;
bunker_projetil_passo(id);
instance_destroy();
