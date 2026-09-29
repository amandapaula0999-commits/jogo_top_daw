# Correção do evento Step de Obj_porta

Corrigido o trecho anteriormente na linha 49: a cadeia de operadores ternários foi substituída por if/else, mantendo as cinco mensagens de bloqueio.

Os dois erros apresentados (“unexpected symbol ?” e “malformed assignment”) apontavam para a mesma expressão.

A lógica das mensagens e as interações da Sala 10 foram verificadas novamente com eventos simulados. O ZIP foi conferido por CRC. Não houve compilação nativa do GameMaker: o compilador não está disponível neste ambiente.

Extraia este projeto completo em uma pasta nova e abra tcc.yyp. A prévia visual incluída permanece válida, pois esta correção é de código.
