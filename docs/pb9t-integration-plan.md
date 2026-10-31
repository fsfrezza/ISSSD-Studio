# Integração ISSD Plus PB9T — implantação segura

Base de trabalho: `fix/goalkeeper-backpass-investigation` (f725337a6286d5e76b1aecba2e53012afdbb008b).
A ROM PB9T é uma referência para engenharia reversa, **não** substitui a ROM-base.

## Política obrigatória

1. Estabilidade e prevenção de travamentos: automática quando a rotina for identificada e validada. Exibir indicador somente leitura no Editor.
2. Expansão 4 MB já existente: preservar integralmente.
3. Equipes adicionais: manter 56 equipes, jamais reduzir a 54; validar International Cup e World Series para todas.
4. Não habilitar patch desconhecido; não aplicar diffs brutos sobre a ROM de 4 MB.
5. Nenhuma função deve ser marcada como implementada simplesmente porque aparece na UI.
6. Cada recurso exige (a) identificação de offsets/instruções, (b) teste isolado, (c) compatibilidade com o pipeline cumulativo, (d) persistência no .issdproj, (e) ROM gerada e testada.

## Registro de recursos e classificação

| Chave proposta | Nome UI | Classe | Inicial |
| --- | --- | --- | --- |
| `pb9tStability` | Correções de estabilidade e travamentos | Obrigatória, somente leitura | Pendente de validação |
| `pb9tTournamentCoverage` | Equipes adicionais em todos os torneios (56) | Obrigatória, somente leitura | Pendente de validação |
| `pb9tFinalWhistle` | Aguardar término do último ataque | Opcional | Indisponível |
| `pb9tPenaltyInputFix` | Impedir interferência P1/P2 nos pênaltis | Opcional (candidata a obrigatória) | Indisponível |
| `pb9tShortGoalKick` | Tiro de meta rasteiro (B) | Opcional | Indisponível |
| `pb9tOneMinute` | Permitir tempo de 1 minuto | Opcional | Indisponível |
| `pb9tTimeOfDayMenu` | Menu secreto de horário (SELECT + BAIXO) | Opcional | Indisponível |

## Compatibilidade e critérios de aceite

- Registrar origem e hash da ROM de referência, offsets PC e SNES, instruções 65816, bytes esperados e novos, dependências e efeitos colaterais.
- Detectar patch instalado sem reaplicar, rejeitar assinatura inesperada e preservar funções do goleiro, táticas, uniformes, traduções e equipes.
- Testar em ambas as direções do campo, 1P e 2P, torneios, jogo livre e exportação cumulativa.
- Desativar funcionalidade opcional restaura o comportamento original, sem eliminar outras alterações.
- Rodar a suíte Node e smoke test em emulador; fornecer ROM de teste por funcionalidade validada.

## Inventário preliminar

ROMs de 2.097.152 bytes, com 4.699 bytes distintos, divididos em 626 trechos contíguos. Esses números não estabelecem quais funcionalidades estão presentes. O analisador `scripts/analyze-pb9t.mjs` gera relatórios JSON sobre os arquivos locais sem alterá-los.

Exemplo:

```powershell
node scripts/analyze-pb9t.mjs "C:\\ROMs\\International Superstar Soccer Deluxe Plus.sfc" "C:\\ROMs\\ISSDPLUS_PB9T.sfc" "pb9t-relatorio.json"
```

**Status deste commit:** preparação técnica e inventário; patches binários e checkboxes de produção ainda não implementados.
