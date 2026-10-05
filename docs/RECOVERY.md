# Plano de recuperação e regressão

1. Preservar todos os artefatos históricos disponíveis antes de editar.
2. Recuperar v6.92 como baseline executável.
3. Testar ROM-base + projeto Brasil aprovado.
4. Registrar SHA-256 de toda ROM gerada.
5. Criar teste para garantir que projeto NO-OP = ROM-base.
6. Criar teste de alteração mínima: um único skill deve mudar apenas os bytes esperados.
7. Validar mirror conhecido do Brasil (slots 3–8 em 0x78C6–0x78EF).
8. Proibir patches persistidos de expansão integral em 0x200000.
9. Fazer bisect entre baseline funcional e primeira versão que trava.
10. Só depois reintegrar o header melhorado e mudanças posteriores.

## Regra arquitetural alvo

ROM-base limpa -> carregar estado semântico -> preparar infraestrutura estrutural canônica somente no build -> aplicar writers -> checksum -> saída.

O projeto não deve acumular cópias da expansão ou depender do estado mutável de uma sessão anterior.
