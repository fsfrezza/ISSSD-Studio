# Recursos visuais do projeto GG

O campo opcional `changes.teamVisuals` guarda os recursos da ROM de referência por identidade Plus (0–59). A estrutura do projeto mantém seus próprios slots Deluxe: o escritor resolve cada equipe por `plusId`, sem renumerar jogadores ou grupos.

Inclui bandeiras da seleção e da partida, uniformes titular/reserva/goleiro, padrão da camisa e aparência de pele/cabelo dos vinte jogadores. Os nomes gráficos são gerados a partir dos nomes atuais do projeto. Recursos e código usam reservas privadas da expansão de 4 MiB; os jogadores mantêm seus nomes, números, posições e atributos editáveis. Exportações sem esse campo conservam o comportamento anterior. Fotografias, retratos e animações de aproximação ainda usam os recursos Deluxe e não fazem parte desta etapa.

O catálogo fica dentro do projeto, portanto abrir, salvar e gerar a ROM não exige a referência Plus. O editor identifica os recursos como próprios, em vez de oferecer uma equipe-base que não controla mais esses gráficos.

Para preparar um projeto a partir da referência independente de 60 equipes, use:

```text
node scripts/attach-deluxe-team-visuals.mjs projeto.issdproj deluxe.smc plus.sfc referencia.sfc saida.issdproj
```

A operação valida a Plus original, os registros da referência e a geração completa antes de escrever a saída. Não importa um projeto do Editor Plus. A edição por pixels dos uniformes e bandeiras ainda precisa de interface própria no Editor Deluxe.
