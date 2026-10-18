# Plano de edição da ROM existente

## Prioridade acordada

1. Editar o que existe: foco principal.
2. Adicionar/remover conteúdo e reestruturar o jogo: bônus.

Ordem: 1.1 Identidade das equipes; 1.2 Uniformes; 1.3 Bandeiras/símbolos; 1.5 Regras/opções; 1.6 Competições; 1.9 Áudio; 1.7 Cenários; 1.4 Estádios; 1.8 Apresentação.
Completar os demais elencos/formações depois de uniformes e símbolos. Separar recursos compartilhados, quando necessário para editar as identidades existentes, é suporte à primeira parte.

## 1.1 — Escopo confirmado pelo usuário

A definição dos grupos deve ser livre, como nas versões anteriores: mover equipes existentes entre grupos e editar seus nomes. Isso pertence à edição do conteúdo existente, não deve ser adiado como bônus estrutural. Os nomes personalizados precisam aparecer na ROM, além do Studio/JSON.

As restrições remanescentes de quantidade/ocupação do primeiro gravador são limites temporários de implementação, não o escopo final aprovado. Completar esse suporte antes de encerrar 1.1; conferir os fluxos anteriores para recuperar o comportamento sem reintroduzir as gravações incorretas em DATA_81E82E.

Depois, investigar a reabilitação de todos os times do grupo ALL STAR. Distinguir registros nativos preservados e desabilitados na Plus de equipes novas; conferir seleção, loaders, elencos, identidade, táticas, uniformes e símbolos antes de habilitar. O usuário está se referindo à recuperação dos Special Teams existentes, não à criação imediata de novas equipes.

## 1.1 — Auditoria e primeira correção

### Organização dos grupos e ordem de seleção

A UI já salva `semantic.plusGroups` no projeto, mas faltava um gravador dedicado no pipeline canônico. Agora a fase Seleção de equipes aplica diretamente esse estado, sem depender de snapshots binários legados.

Mapa Plus confirmado:

- PC E7F2: 54 referências, nove grupos de seis posições, equipe codificada como ID × 2.
- PC E828: seis posições secretas; 70 marca posição vazia.
- Ordem lógica para física: [6,7,8,0,1,2,3,4,5].
- PC 3FAC8: dez ponteiros de títulos gráficos. Mover grupos pode mover os respectivos títulos nativos.
- E82E/E82F NÃO são terminador/contador dos grupos: são o início de `DATA_81E82E`, um stream de registros de três bytes. O disassembly o lê em `CODE_A4905A`; a Plus preserva as leituras nos PCs 12105C e 121069. Removidas as gravações desses dois bytes do fluxo normal da UI e descartados seus mirrors legados na exportação com grupos semânticos.

O gravador preserva a quantidade e as posições ocupadas atuais, impede IDs inválidos e duplicações, valida antes de gravar e respeita a seleção de fases. Nomes personalizados dos grupos agora são rasterizados na exportação: ver `docs/FREE-GROUP-TITLES-AND-ALL-STARS.md`. Quando os nomes não mudam, a arte original permanece intacta.

### Nomes e abreviações — trabalho ainda necessário

A UI tem nome lógico e editor do gráfico superior (Layer 3). O próprio código limita o botão atual a esse gráfico; o nome sob a bandeira e o Big OAM são recursos distintos. Não há campo canônico de abreviação independente confirmado para todas as telas.

Portanto, não considerar 1.1 encerrado: ainda é necessário conferir o round-trip e exportação dos nomes gráficos, mapear cada ocorrência de nome/abreviação e implementar o que faltar. Um nome lógico alterado no projeto não deve ser confundido com todos os gráficos do jogo alterados.

## Invariantes

ROM-base imutável; projeto como fonte das alterações; geração determinística; fases cumulativas isoladas; sem alterações nos arquivos protegidos. A infraestrutura automática de 4 MB e individualização tática permanece.

## Verificação desta alteração

Validação local completa aprovada; testes adicionais cobrem ordem física/lógica, títulos, isolamento de fases, preservação de DATA_81E82E, patches legados e rejeição atômica de alterações inválidas/estruturais. Conferência com a ROM Plus real e o projeto canônico: 4 MB, zero textos pendentes, zero alterações sem fase, grupos iguais ao projeto e ROM-base intacta. Não foi feita nova conferência visual no emulador nesta alteração.
