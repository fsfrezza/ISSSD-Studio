# Project import contract

Abrir um `.issdproj` deve restaurar automaticamente, sem botão auxiliar:

- `textWorkspaceV2.sections.direct`
- `textWorkspaceV2.sections.preKickoff`
- `textWorkspaceV2.sections.mainMenu`
- `textWorkspaceV2.sections.graphicIntents`
- `textWorkspaceV2.sections.title`
- `romInternalTitle` / `romInternalTitleDesired`
- `titleScreen` (textos, paletas e faixa)
- `state.titleComposerV2` e seus assets embutidos

O build deve falhar se não conseguir ligar o hook pós-`studioImportProject` ou o hook pré-`studioProjectObject`.

O painel de diagnóstico manual não faz parte da interface normal de produção.
