# Exportação provisória de ROMs cumulativas

No perfil Plus, **Salvar ROM** baixa `ISSSD-Plus-ROMs-cumulativas.zip` diretamente,
sem executar os writers físicos legados do navegador. O servidor usa a ROM-base
imutável e o projeto semântico atual.

- A primeira ROM contém a expansão obrigatória para 4 MiB.
- Depois, cada patch, jogador, registro tático individual, texto de estratégia e
  metadado efetivamente alterado gera uma ROM que inclui as etapas anteriores.
- Uma alteração de jogador agrupa nome, camisa, posição, skills e aparência.
  Uma troca de identidades do elenco é atômica, evitando identidades duplicadas
  em ROMs intermediárias. A tática de cada jogador constitui outra etapa.
- Cada ROM recebe mirrors coerentes e checksum recalculado. Etapas sem efeito
  binário não duplicam ROMs. A ordem é de execução determinística, não cronológica.
- `indice.json` associa cada arquivo à etapa e aponta a ROM final.
- A última ROM precisa ser idêntica ao build canônico; divergência cancela o ZIP.
- Os arquivos são comprimidos individualmente em disco temporário. Não se
  acumulam centenas de buffers de ROM na memória. ZIP32 limita o arquivo a 4 GiB.

O modo cobre os writers disponíveis no pipeline. Domínios ainda sem writer nativo
(como grupos em quarentena e composições gráficas) não passam a ser implementados
por esta exportação. Seus dados continuam preservados no projeto. Não há promessa
de que cada ROM intermediária execute corretamente: localizar a etapa que quebra
no emulador é justamente a finalidade desta exportação diagnóstica.

## Organização e limpeza

Removido `docs/project-hydration-diagnostic.md`: descrevia um painel já removido.
Eliminadas do build a busca automática por cópias OLD/ANTIGO/Preview e a lógica
que descartava `.editor-vendor`. O build usa somente o baseline explícito protegido.
Scripts de migração, testes e arquivos de recuperação continuam necessários para
compatibilidade, reconstrução e auditoria; não são lixo pelo fato de serem antigos.
Nenhuma pasta local do usuário é limpa por comandos desta revisão.
