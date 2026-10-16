# Relatório de validação

Execução em 16 de outubro de 2026, Linux, Node.js 24.19.0, npm 11.9.0 e Chromium headless. Dados de teste fictícios. O relatório diferencia testes automatizados de integrações que ainda exigem dispositivos ou serviços externos.

## Resultados

| Verificação                         | Resultado           | Evidência                                                              |
| ----------------------------------- | ------------------- | ---------------------------------------------------------------------- |
| `npm run build`                     | Aprovado            | TypeScript e build Vite de produção                                    |
| `npm test`                          | 11 testes aprovados | Integração HTTP real com Express e SQLite; zero ignorados              |
| `npm run test:e2e`                  | 5 testes aprovados  | Chromium, fluxos completos, mobile, relógio/offline e axe              |
| `npm --prefix mobile run typecheck` | Aprovado            | TypeScript do contêiner React Native/Expo                              |
| Exportação Metro Android            | Aprovado            | 578 módulos, bundle Hermes gerado; não é APK nem validação em hardware |
| Instalação pelo lockfile            | Aprovado            | `npm ci` nos projetos raiz e mobile                                    |

## API: cenários executados

1. Cadastro, validação de nascimento/senha, unicidade de e-mail, hash scrypt, sessão HttpOnly/SameSite, login incorreto/correto e logout.
2. Proibição de acesso por outra família; acesso negado a mutações/exportação; convite de uso único; cuidador sem vínculos; revogação.
3. CRUD de medicamento, consulta e contato; horário inválido; versões antigas recusadas em edição e exclusão.
4. Confirmação de dose, reenvio idempotente, conflito entre dispositivos, adiamento e estado “Não tomei”.
5. SOS persistido sem alegação de entrega externa; aviso ao cuidador autorizado; recebimento explícito e deduplicação.
6. Registro de dor com validação e deduplicação; assistente com/sem dados reais; exportação sem hashes de senha.
7. Agendador sem repetição de notificações; falta de confirmação permanece distinta de não ingestão; preferências e leitura individual.
8. Persistência ao reabrir SQLite e exclusão de conta do idoso em cascata.
9. Origem indevida bloqueada e recuperação sem provedor respondendo explicitamente que não enviou mensagem.
10. Demonstrações isoladas e alternância somente no próprio grupo.
11. Exclusão da conta do cuidador preserva as confirmações e pedidos SOS pertencentes ao idoso.

## Navegador: jornadas executadas

- Cadastro de medicamento, confirmação, recarregamento com persistência, cadastro de consulta, relato de dor, SOS e confirmação de recebimento no perfil do cuidador.
- Tela 390 × 844, navegação inferior e menu, texto ampliado, assistente sobre medicamentos cadastrados, seleção de região corporal e ausência de rolagem horizontal nas telas verificadas.
- Protótipo do relógio retangular/circular, ativação de sincronização, dose confirmada offline, recuperação da rede e uma única confirmação no servidor. SOS offline mostra pendência e é reenviado ao reconectar.
- Cadastro/login reais em duas sessões independentes; convite, acesso autorizado, revogação e perda efetiva do acesso.
- Axe WCAG 2 A/AA e 2.1 AA nas telas de boas-vindas, início e descrição de dor: nenhuma violação automática encontrada nesses alvos.

Capturas de referência visual em `docs/screenshots`: desktop, mobile, boas-vindas mobile e relógio. Elas usam dados da demonstração. Os testes funcionais não dependem de comparação pixel a pixel.

## Não executado / não implementado

- APK/IPA, instalação em Android/iOS, Xcode, Wear OS/watchOS, Bluetooth e relógio físico.
- Push FCM/APNs, SMS/e-mail, confirmação de chamada ou localização: não integrados.
- Reconhecimento de voz, microfone, síntese e permissão de notificação em dispositivos reais; código com detecção de suporte e fallback disponível.
- Auditoria manual completa com leitor de tela, testes com pessoas idosas, auditoria de segurança, carga e conformidade legal.
- Notificações com aplicativo fechado e reinício integral offline com dados clínicos: não oferecidos nesta versão.

A ausência de violações no axe não comprova acessibilidade integral. O empacotamento Metro não comprova funcionamento nativo. O ambiente é uma base funcional de desenvolvimento, e as limitações estão descritas em `integracoes.md`.
