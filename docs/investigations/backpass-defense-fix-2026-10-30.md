# Correção da defesa e do destaque de cobradores — 2026-10-30

Continuação da matriz descrita em `backpass-defense-analysis-2026-10-30.md`.
A ROM e o projeto enviados foram preservados. A reconstrução pelo pipeline
cumulativo coincidiu com a ROM enviada fora da tela inicial e do checksum;
a conversão gráfica da tela inicial depende da etapa do navegador.

## Substituições / escolha do cobrador

A reprodução correta exige entrar na escolha C/K ou F/K, confirmar o modo e
percorrer os cobradores. Abrir apenas a escalação, inclusive durante uma
partida, não reproduziu os fragmentos. Restaurar gráficos de textos foi uma
hipótese descartada: não houve mudança de atlas ou de tradução nesta correção.

O disassembly completo de 86:AA3E..AA88 mostra que o destaque intermitente usa
dois operandos imediatos além das tabelas de quadros já relocadas. Em 86:AA56
(PC 032A56), 57D6 ainda apontava para nomes ampliados; em 86:AA62 (PC 032A62),
57DA tinha o mesmo problema. Ambos agora acompanham a relocação para 5EB2,
com os deslocamentos +4 e +8. Não foram alterados gráficos, atributos ou
permissões de jogadores para esconder os fragmentos.

No Snes9x, a navegação que reproduziu letras como RAND passou a exibir apenas
o indicador nativo do cobrador. Com a permissão habilitada, subir do índice 1
selecionou 0 (goleiro), confirmado pelo fluxo nativo; com a rejeição original
restaurada, a mesma ação ignorou 0. O teste de regressão verifica explicitamente
os dois operandos, além das tabelas e dos quatro planos após retornos de tela.

## Tiro livre por recuo: defesa v3

A base v2 permanece disponível em `buildBackpassFreeKickV2Rom` e seu fingerprint
aprovado continua testado. A punição por pênalti não foi modificada.

Somente o tiro livre privado por recuo, a menos de 0100 unidades da linha,
recebe a nova distribuição. A marcação e a posição da bola continuam nativas.
O limite estrito 255/256 e o ajuste de profundidade aprovado são mantidos.

- A barreira central (desvio lateral absoluto menor que 24) conserva a v2.
- Nos casos laterais, os membros têm intervalo de 12 unidades e destinos
  entre centro -40 e centro +40; os postes ficam em -48 e +48.
- O centro da barreira acompanha o lado da bola com limite que acomoda todos
  os membros; o espalhamento não depende da projeção perpendicular achatada.
- A chegada lateral assenta os pés no destino, além do ajuste longitudinal
  já existente. Isso impede que a tolerância nativa comprima o espaçamento.
- O goleiro defensor recebe um destino no lado complementar, 24 unidades
  dentro do campo. O hook distingue rank zero, papel de goleiro e lado do gol;
  o goleiro cobrador não recebe o destino do defensor adversário.
- Marcador ausente, reinício comum ou distância fora do limite conservam o
  caminho original. As rotinas mantêm pilha e registros exigidos pelo ABI.

A verificação no Snes9x usou 60 cenários preparados: dois gols, três distâncias,
cinco laterais (-160, -80, 0, 80, 160) e dois tipos de cobrador. Todos chegaram
à ação de cobrança. Foram conferidos 280 membros: nenhum atrás da linha nem
fora dos postes. Nenhum goleiro defensor ficou atrás da linha; a menor
profundidade medida foi 11 unidades dentro do campo. São posições na prontidão
dos cenários controlados, não uma garantia de cobertura de todos os chutes.
Uma rodada iniciada do zero com a ROM do projeto, seguida de recuo preparado,
seleção de goleiro e mais 120 frames de espera, manteve o estado 5 e imagem
íntegra. Os testes de instruções cobrem ambos os gols, laterais, contagens,
caminhos inativos e preservação de ABI; exportação e round-trip seguem nos
testes do pipeline.

## Validação final

`npm run validate:editor:local`: 746 testes, build completo e auditoria final
aprovados; diretórios protegidos e projetos inalterados. O caso adicional de
marcador obsoleto/caminhos inativos foi incluído e os cinco testes do módulo
defensivo foram executados novamente, todos aprovados.

O endpoint real `/__isssd/build-plus-project`, com o projeto enviado e as 11
fases selecionadas exceto tela inicial, respondeu HTTP 200, exportação completa
e arquivo cumulativo. Sua ROM da fase 12 coincide byte a byte com a construção
atual local (4 MiB). A ROM de teste fornecida conserva a tela inicial da ROM
original enviada e modifica apenas as rotinas defensivas, os dois operandos
de destaque e o checksum. SHA-256 da cópia de teste:
`2d598de97687e64dfb5f34192a81bc9f509a8ce01c6706f4001b3c529090689a`.

Estados salvos de uma versão anterior preservam descritores e RAM antiga;
a confirmação manual deve começar por uma partida nova.
