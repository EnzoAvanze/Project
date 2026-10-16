# API REST Cuidali

Base: `/api`, JSON UTF-8. A interface e API usam a mesma origem. Sessão por cookie `cuidali_session`, HttpOnly/SameSite Strict, validade de 7 dias. Não há token de autenticação no localStorage. Todas as rotas, exceto saúde, cadastro, login, demonstração e recuperação, exigem sessão. Erros: `{ "error": "Mensagem compreensível" }`.

## Autenticação e vínculos

| Método | Rota                    | Corpo/resultado                                                                                                                                |
| ------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/health`               | `{status:"ok",storage:"sqlite"}`                                                                                                               |
| POST   | `/auth/register`        | `name,email,phone,password,role,consent:true`; `birth_date` obrigatório para idoso; `contact:{name,phone,relationship}` opcional. 201 e cookie |
| POST   | `/auth/login`           | `email,password`; 200 e cookie                                                                                                                 |
| POST   | `/auth/logout`          | Encerra a sessão atual                                                                                                                         |
| POST   | `/auth/demo`            | Cria família fictícia isolada e inicia sessão do idoso                                                                                         |
| POST   | `/auth/demo/switch`     | `role:elder\|caregiver`; disponível só na própria família de demonstração                                                                      |
| POST   | `/auth/recovery`        | 501: provedor de e-mail não configurado, nenhum envio alegado                                                                                  |
| GET    | `/me`                   | Dados públicos da conta e idosos autorizados                                                                                                   |
| DELETE | `/account`              | `{confirm:"EXCLUIR"}`; remove conta e dados conforme cascatas                                                                                  |
| POST   | `/links`                | `{code:"12345678"}`; apenas cuidador, consome convite                                                                                          |
| GET    | `/state?patient=<uuid>` | Estado completo do idoso autorizado; primeiro idoso quando omitido                                                                             |

Cadastro exige senha de 10 a 128 caracteres, e-mail único, telefone com DDD, data válida e consentimento. Nenhum hash, token ou segredo retorna na resposta de conta. Um cuidador sem vínculos recebe `patient:null` e lista vazia de pacientes.

## Recursos de um idoso

Prefixo abaixo: `/patients/:patientId`. Cada operação verifica o proprietário/vínculo atual, inclusive exportação e notificações. Ser cuidador não concede acesso global.

| Método | Sufixo                | Entrada                                                                                |
| ------ | --------------------- | -------------------------------------------------------------------------------------- |
| POST   | `/invite`             | Apenas idoso proprietário. Retorna código de uso único e `expires_in:600`              |
| DELETE | `/links/:caregiverId` | Idoso remove cuidador; cuidador só pode remover a si                                   |
| POST   | `/medications`        | `name,dosage,time,instructions?`                                                       |
| PUT    | `/medications/:id`    | Os campos acima e `version` atual                                                      |
| DELETE | `/medications/:id`    | `version` atual                                                                        |
| POST   | `/appointments`       | `doctor,specialty,date,time,location,notes?`                                           |
| PUT    | `/appointments/:id`   | Os campos acima e `version` atual                                                      |
| DELETE | `/appointments/:id`   | `version` atual                                                                        |
| POST   | `/contacts`           | `name,phone,relationship,notify`                                                       |
| PUT    | `/contacts/:id`       | Os campos acima e `version` atual                                                      |
| DELETE | `/contacts/:id`       | `version` atual                                                                        |
| POST   | `/confirmations`      | Ver exemplo abaixo                                                                     |
| POST   | `/sos`                | `action_id,source:web\|watch`                                                          |
| POST   | `/alerts/:id/ack`     | Apenas cuidador autorizado, confirma que visualizou                                    |
| POST   | `/pain`               | `action_id,region,side,kind,intensity,since,notes?,source`                             |
| POST   | `/assistant`          | `message`; retorna `answer` e `route` opcional                                         |
| PUT    | `/preferences`        | Booleanos `medication,appointment,pain,sos,missing` e `grace_minutes` 5–180            |
| POST   | `/devices`            | `name,kind:web\|watch`; atualiza último contato por nome/paciente                      |
| DELETE | `/devices/:id`        | Remove registro; não revoga sessões                                                    |
| POST   | `/notifications/read` | Marca avisos atuais como lidos apenas para a conta atual                               |
| GET    | `/export`             | JSON dos dados autorizados do idoso; inclui informações de saúde, tratar como sensível |

Listagem e leitura são fornecidas em `/state`, com medicamentos ordenados por horário, consultas por data, confirmações do dia e histórico recente. Para relatórios completos use a exportação. Não existe rota pública de lista de usuários.

## Exemplo de confirmação

```json
{
  "action_id": "c695c559-7805-4187-9d58-15150dcdbe40",
  "medication_id": "733728af-0e8e-43c7-a0e7-a451957239e",
  "day": "2026-10-16",
  "status": "taken",
  "expected_version": null,
  "minutes": 15,
  "source": "watch"
}
```

`status`: `taken`, `not_taken` ou `snoozed`. Ausência de registro = sem confirmação. `expected_version` é `null` se a dose não foi registrada; para alterar, envie `confirmed_at` retornado pelo estado. A API não aceita confirmação de data futura. `minutes` entre 5 e 120, usado para adiamento. Datas civis seguem `AAAA-MM-DD`; horários seguem `HH:mm` em São Paulo.

Reenviar o mesmo `action_id` pela mesma conta/paciente é idempotente. Uma alteração com versão antiga recebe 409. A fila deve manter o mesmo UUID em retries e criar outro UUID somente para uma nova ação deliberada. Nunca interprete um timeout como prova de não gravação; reenvie o mesmo UUID.

SOS retorna `{id,status:"registered",external_status:"not_configured"}`. Registro de dor retorna `{id,external_status:"not_configured"}`. Isso não significa push enviado, entrega confirmada nem chamada concluída.

Campos da dor: `side` Frente/Costas; `kind` Pontada/Queimação/Latejante/Aperto ou peso/Formigamento/Constante; `intensity` Leve/Média/Forte/Muito forte; `since` Hoje/Há alguns dias/Há mais de uma semana. O relato rápido do relógio usa local não informado e informa essa limitação na interface.

## Códigos e integridade

- 200/201: resultado confirmado pelo servidor.
- 400: campos/código inválidos; 401: sessão ausente/expirada; 403: acesso/origem negados.
- 404: registro/rota ausente; 409: conflito de versão/e-mail/identificador.
- 429: limite nas rotas de autenticação; 501: recuperação de senha não configurada.
- 500: erro inesperado sem expor detalhes internos. Um erro de rede no cliente não confirma gravação nem envio.

Não envie credenciais ou informações clínicas em URLs. Em produção use HTTPS e cookie Secure. O endpoint de exportação tem `Cache-Control:no-store`, assim como todas as respostas da API.
