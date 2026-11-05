# Catálogo independente de pele e cabelo — primeira etapa

## Escopo entregue

A janela Aparência permite escolher pele e cor de cabelo separadamente a partir
das paletas existentes de todas as equipes. O tipo de cabelo mantém seu seletor
próprio. O catálogo elimina cores e rampas repetidas; referências de origem são
apenas rótulos. O projeto salva os valores BGR555, não índices frágeis de listas.

`state.semantic.playerColorsV1` tem schema `isssd-player-colors-v1`, versão 1 e
`players` indexado por `team:baseSlot`. Cada escolha contém `skin` (cinco tons)
e `hairColor`. Aplicar ao jogador confirma o rascunho; salvar/importar restaura
as escolhas, inclusive quando o jogador muda de slot. Copiar/trocar aparência
inclui escolhas explícitas de cores. O recurso participa da seleção de seções
na abertura e no salvamento do projeto.

Somente os jogadores de linha usam esse catálogo. Goleiros continuam com o
editor individual de cores existente. O projeto atual com equipes independentes
é necessário para usar a instalação de paletas privadas já validada.

## Disassembly e geração

A análise partiu de 8B:CFD0..D0EF: a rotina carrega duas paletas de corpo por
lado, depois substitui pele e cabelo da alternativa. 83:C9D7..CA47 usa o bit de
paleta do atributo ao formar o objeto. Isso permite combinar cores sem criar
novos sprites ou usar paletas extras. Os loaders Plus e os redirecionamentos
usados pela estrutura atual continuam sujeitos às verificações já existentes.

O planejador calcula os conjuntos exatos do elenco de linha, inclusive reservas,
e atribui o bit 0/1 por slot, preservando cabelo, uniforme e bits restantes.
Os registros novos são gerados no pool de paletas das equipes independentes,
sem escrever no registro compartilhado de outra seleção. Os cinco tons de pele
ocupam índices 2–6; o cabelo ocupa 1. Os índices 7–15 do uniforme são preservados.
As paletas do telão também recebem a escolha do jogador. Somente a fase Jogadores
aplica essas alterações; o projeto-base e os estados originais não são modificados.

## Limites explícitos

Esta etapa NÃO aumenta as duas combinações por elenco usadas pelo motor nativo.
Se houver três ou mais combinações exatas, o projeto continua guardando-as, mas
a exportação é recusada antes de gerar uma ROM. Não há aproximação nem substituição
silenciosa. A contagem considera os reservas porque eles podem entrar em campo.

Não foi eliminado o limite de três titulares com cabelos nativos 1–13. Separar
cabeça/corpo e reorganizar os slots gráficos e de paletas continua pendente.
Portanto, esta entrega é o catálogo, a persistência e o reaproveitamento dos dois
conjuntos nativos com combinações livres; não é a ampliação completa do renderizador.

## Verificações

- 714 testes, build do Editor e auditoria final aprovados.
- Testes de catálogo, combinações, recusa de terceiro conjunto, imutabilidade,
  identidade após troca de slots, validação e reabertura/cópia/troca de cores.
- Execução do runtime com DOM: seleção separada de pele/cabelo, aplicação ao
  jogador, JSON do projeto e reabertura com a mesma escolha.
- Plus real: duas combinações exportadas, verificação dos registros primário e
  alternativo, bits dos jogadores, preservação do uniforme e paleta do telão.
- Snes9x: partida iniciada após a seleção, modo 8, os valores BGR555 verificados foram 7FFF e 02B7 nos conjuntos da equipe.
  As duas paletas permaneceram carregadas durante a partida.

Auditoria reproduzível (sem modificar a ROM ou o projeto de entrada):

    node scripts/verify-player-colors-real-rom.mjs ROM-Plus projeto.issdproj [saida.sfc]

O script usa o Brasil do projeto de referência, escolhendo pele de um conjunto
de outra seleção e duas cores de cabelo, e valida também o telão. O arquivo de
saída é opcional e experimental. A sequência de emulação usada nesta sessão
partiu de um estado anterior à partida; não houve teste em ZSNES nesta etapa.
