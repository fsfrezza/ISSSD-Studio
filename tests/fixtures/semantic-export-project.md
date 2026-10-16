# Projeto fixo de regressão

`semantic-export-project.json` é uma cópia reduzida do estado histórico usado pelos testes de exportação. Mantém o Brasil recuperado, os textos legados de estratégias/controles, a composição do menu e os patches binários antigos necessários para reproduzir as regressões. Equipes alheias aos testes e assets de imagem da Tela Inicial foram removidos.

Os resultados esperados referem-se a esse estado fixo. Não carregar o `.issdproj` da pasta principal nos testes: esse arquivo é o projeto de trabalho do usuário, cujo conteúdo pode mudar a cada salvamento. A suíte não deve depender dele, sobrescrevê-lo ou exigir que seja restaurado para uma versão antiga.
