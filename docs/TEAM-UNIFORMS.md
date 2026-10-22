# Uniformes — linha e goleiros

A navegação usa **Jogadores** (todo o elenco, aparência e skills) e
**Uniformes** (linha titular/reserva e ambos os goleiros). O painel legado de
Goleiros fica oculto; seus IDs são preservados por compatibilidade de eventos.

## Dados confirmados na Plus

- `8B:CFD0` lê `82:8274`: 112 ponteiros, 56 equipes × 2 conjuntos.
- Cada paleta tem cabeçalho `$001F` e 16 palavras BGR555. A edição de uniforme
  altera somente índices 7–15, preservando 0–6 (incluindo cabelo e pele).
- As 112 paletas da base Plus verificada têm endereços distintos. O gravador
  recusa edição de paleta compartilhada para não alterar outra equipe.
- `84:E801` lê `81:FCEC`: um ponteiro de detalhe de camisa por equipe,
  compartilhado entre os uniformes titular e reserva.
- `98:C5D4–98:E5D4`: 32 desenhos × 256 bytes; cada desenho contém oito tiles
  SNES 4bpp de 8 × 8. A janela permite editar todos esses quadros, desfazer e
  confirmar o desenho no projeto. O modelo sem detalhe usa `98:F014`; existe
  ainda uma referência especial nativa a `98:F0D4`, mantida separadamente.

Esses gráficos são detalhes sobrepostos durante a partida. Não são uma
camisa inteira desenhada de frente, nem a imagem ampliada da seleção de equipe.
A interface exibe quais equipes compartilham o desenho em edição. Criar um
layout exclusivo adicional por equipe, ou unificar automaticamente os gráficos
aproximados de outras telas, exige um mapeamento posterior; a UI não promete
que editar o tile pequeno atualize esses outros recursos.

## Projeto e ROM

`state.semantic.uniformsV1` usa `isssd-team-uniforms-v1`, versão 1:
`kits[team:kit].colors` guarda as nove cores; `layouts[team]` guarda o ponteiro;
`patterns[style]` guarda os 512 índices de pixels dos oito quadros. As cores
são guardadas imediatamente no projeto em memória; o desenho tem confirmação
própria. Salvar projeto persiste os dados e abrir reidrata os controles.

O pipeline grava as alterações semânticas depois dos dados de jogadores.
A fase cumulativa **Jogadores** inclui uniformes e detalhes; desmarcá-la
exclui essas alterações. A aba Uniformes não altera a classificação da fase.
O projeto antigo sem `uniformsV1` continua válido e usa a base nativa.

As paletas dos goleiros continuam em `goalkeeperPalettesV1`, sem migração de
formato. Uniformes edita apenas seus índices 5–10; Jogadores → Aparência edita
0–4. Os dois controles preservam o outro conjunto ao aplicar e restaurar.

Testes: ida e volta JSON, independência titular/reserva, preservação de pele,
cabelo, outras equipes e ROM-base; todos os 32 desenhos em 4bpp; rejeição atômica
de dados inválidos; classificação cumulativa; salvamento/abertura no runtime.
