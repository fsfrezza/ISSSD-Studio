# Diagnóstico de hidratação de projeto

O Visual Bridge deve restaurar os valores persistidos em `state.semantic.textWorkspaceV2` e `romInternalTitle` somente depois que a importação do projeto terminar.

A instrumentação Git exibe um painel `Diagnóstico do projeto` comparando, para alguns campos-chave:

- valor presente no arquivo `.issdproj` selecionado;
- valor presente no snapshot interno de `window.ISSSDTextWorkspace`;
- valor atualmente exibido no campo do Editor.

O painel também informa se o lifecycle recebeu o log `Projetos / Projeto aberto`.
