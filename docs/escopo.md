# Planejamento e rastreabilidade

O pedido colado orienta o desenvolvimento. Os dois DOCX fornecem contexto de produto e critérios acadêmicos. Este repositório entrega uma implementação executável para desenvolvimento, com diferenças técnicas e integrações pendentes registradas explicitamente.

## Sprint 1 — estrutura e planejamento

Entregues: arquitetura e decisões, MER, DER, dicionário derivado do esquema real, navegação, identidade visual e planejamento do smartwatch. Fontes e ícones são servidos localmente; não há dependência de fontes externas na interface.

## Sprint 2 — base funcional

Entregues: SQLite relacional, criação automática, API Express, autenticação, consentimento e controle de acesso por vínculo; CRUD de medicamentos, consultas e contatos; cliente responsivo/instalável e área do cuidador; sincronização por consultas periódicas e versões.

## Sprint 3 — integração e verificação

Entregues: assistente por regras com dados reais, voz conforme suporte, SOS confirmado e histórico, dor com mapa corporal, avisos internos e preferências, protótipo de relógio, fila offline idempotente, testes de API/navegador e acessibilidade, documentação e capturas.

| Requisito                    | Local principal                               | Situação                                                                                   |
| ---------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Abertura e escolha de perfil | `src/Auth.tsx`, splash em `src/App.tsx`       | Executável                                                                                 |
| Cadastro/login seguro        | `server/app.mjs`, `src/Auth.tsx`              | Executável; recuperação e biometria pendentes                                              |
| Meu dia, lembretes e dose    | `src/Screens.tsx`, `/confirmations`           | Executável                                                                                 |
| Consultas e agenda           | `src/Screens.tsx`, `/appointments`            | CRUD e exportação .ics                                                                     |
| SOS                          | `src/Screens.tsx`, `/sos`, `/alerts/:id/ack`  | Registro e aviso interno, sem push/SMS externo                                             |
| Assistente texto/voz         | `/assistant`, componente Assistant            | Regras reais; voz depende do navegador                                                     |
| Dor                          | BodyMap e PainScreen, `/pain`                 | Executável, sem diagnóstico                                                                |
| Relógio                      | `src/Watch.tsx`, `/relogio`                   | Protótipo web conectado; sem binário nativo                                                |
| Área do cuidador             | Perfil caregiver, vínculo e seletor de idosos | Executável, CRUD e histórico compartilhados                                                |
| Mobile                       | PWA e `mobile/App.tsx`                        | Cliente funcional e invólucro React Native; hardware nativo não validado                   |
| Persistência e segurança     | `server/schema.sql`, `server/app.mjs`         | SQLite; PostgreSQL e infraestrutura de produção futuros                                    |
| Notificações de fundo        | `docs/integracoes.md`                         | Não implementadas; avisos internos e tentativa em página aberta                            |
| Sincronização offline        | `src/api.ts`, `src/App.tsx`, `mutations`      | Ações em sessão aberta; não há cache clínico para reinício offline                         |
| Documentação acadêmica       | `docs/`                                       | Base técnica Markdown; não há documento final diagramado em ABNT ou apresentação exportada |

## Critérios para evolução

1. Revisar com usuários idosos em dispositivos físicos: leitura, toque, navegação e voz.
2. Implementar notificações push/alarme nativas e validar entrega em primeiro/segundo plano.
3. Criar clientes Wear OS/watchOS com SDKs, autenticação de dispositivo e testes reais.
4. Configurar recuperação segura, HTTPS, retenção, backups e revisão LGPD antes de usar dados reais.
5. Para escala, migrar para PostgreSQL, desacoplar agendador e implementar entrega externa com outbox/recibos.
6. Produzir documento acadêmico diagramado segundo o modelo da instituição e a apresentação final, usando os artefatos deste repositório como fonte.
