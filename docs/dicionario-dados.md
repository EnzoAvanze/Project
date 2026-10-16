# Dicionário de dados

Gerado a partir de `server/schema.sql`, o esquema executado pela aplicação. UUIDs em TEXT; datas civis ISO `AAAA-MM-DD`; instantes UTC ISO 8601; horários civis `HH:mm` em America/Sao_Paulo. Booleanos são INTEGER 0/1.

## alerts

| Campo           | Tipo | Obrigatório | Chave            | Padrão           |
| --------------- | ---- | ----------- | ---------------- | ---------------- |
| id              | TEXT | Sim         | PK 1             | —                |
| patient_id      | TEXT | Sim         | FK → patients.id | —                |
| actor_id        | TEXT | Não         | FK → users.id    | —                |
| status          | TEXT | Sim         | —                | 'registered'     |
| external_status | TEXT | Sim         | —                | 'not_configured' |
| source          | TEXT | Sim         | —                | —                |
| created_at      | TEXT | Sim         | —                | —                |

## appointments

| Campo      | Tipo    | Obrigatório | Chave            | Padrão |
| ---------- | ------- | ----------- | ---------------- | ------ |
| id         | TEXT    | Sim         | PK 1             | —      |
| patient_id | TEXT    | Sim         | FK → patients.id | —      |
| doctor     | TEXT    | Sim         | —                | —      |
| specialty  | TEXT    | Sim         | —                | —      |
| date       | TEXT    | Sim         | —                | —      |
| time       | TEXT    | Sim         | —                | —      |
| location   | TEXT    | Sim         | —                | —      |
| notes      | TEXT    | Sim         | —                | ''     |
| version    | INTEGER | Sim         | —                | 1      |

## confirmations

| Campo         | Tipo | Obrigatório | Chave               | Padrão |
| ------------- | ---- | ----------- | ------------------- | ------ |
| id            | TEXT | Sim         | PK 1                | —      |
| patient_id    | TEXT | Sim         | FK → patients.id    | —      |
| medication_id | TEXT | Sim         | FK → medications.id | —      |
| day           | TEXT | Sim         | —                   | —      |
| status        | TEXT | Sim         | —                   | —      |
| snooze_until  | TEXT | Não         | —                   | —      |
| actor_id      | TEXT | Não         | FK → users.id       | —      |
| created_at    | TEXT | Sim         | —                   | —      |

## contacts

| Campo        | Tipo    | Obrigatório | Chave            | Padrão |
| ------------ | ------- | ----------- | ---------------- | ------ |
| id           | TEXT    | Sim         | PK 1             | —      |
| patient_id   | TEXT    | Sim         | FK → patients.id | —      |
| name         | TEXT    | Sim         | —                | —      |
| phone        | TEXT    | Sim         | —                | —      |
| relationship | TEXT    | Sim         | —                | —      |
| notify       | INTEGER | Sim         | —                | 1      |
| version      | INTEGER | Sim         | —                | 1      |

## devices

| Campo      | Tipo | Obrigatório | Chave            | Padrão |
| ---------- | ---- | ----------- | ---------------- | ------ |
| id         | TEXT | Sim         | PK 1             | —      |
| patient_id | TEXT | Sim         | FK → patients.id | —      |
| name       | TEXT | Sim         | —                | —      |
| last_sync  | TEXT | Sim         | —                | —      |
| kind       | TEXT | Sim         | —                | —      |

## events

| Campo      | Tipo | Obrigatório | Chave            | Padrão |
| ---------- | ---- | ----------- | ---------------- | ------ |
| id         | TEXT | Sim         | PK 1             | —      |
| patient_id | TEXT | Sim         | FK → patients.id | —      |
| actor_id   | TEXT | Não         | FK → users.id    | —      |
| type       | TEXT | Sim         | —                | —      |
| title      | TEXT | Sim         | —                | —      |
| details    | TEXT | Sim         | —                | ''     |
| created_at | TEXT | Sim         | —                | —      |

## interactions

| Campo      | Tipo | Obrigatório | Chave            | Padrão |
| ---------- | ---- | ----------- | ---------------- | ------ |
| id         | TEXT | Sim         | PK 1             | —      |
| patient_id | TEXT | Sim         | FK → patients.id | —      |
| user_id    | TEXT | Sim         | FK → users.id    | —      |
| question   | TEXT | Sim         | —                | —      |
| answer     | TEXT | Sim         | —                | —      |
| created_at | TEXT | Sim         | —                | —      |

## invites

| Campo      | Tipo    | Obrigatório | Chave            | Padrão |
| ---------- | ------- | ----------- | ---------------- | ------ |
| code_hash  | TEXT    | Sim         | PK 1             | —      |
| patient_id | TEXT    | Sim         | FK → patients.id | —      |
| expires_at | INTEGER | Sim         | —                | —      |

## links

| Campo        | Tipo | Obrigatório | Chave | Padrão |
| ------------ | ---- | ----------- | ----- | ------ |
| patient_id   | TEXT | Sim         | PK 1  | —      |
| caregiver_id | TEXT | Sim         | PK 2  | —      |

## medications

| Campo        | Tipo    | Obrigatório | Chave            | Padrão |
| ------------ | ------- | ----------- | ---------------- | ------ |
| id           | TEXT    | Sim         | PK 1             | —      |
| patient_id   | TEXT    | Sim         | FK → patients.id | —      |
| name         | TEXT    | Sim         | —                | —      |
| dosage       | TEXT    | Sim         | —                | —      |
| time         | TEXT    | Sim         | —                | —      |
| instructions | TEXT    | Sim         | —                | ''     |
| version      | INTEGER | Sim         | —                | 1      |

## mutations

| Campo      | Tipo | Obrigatório | Chave         | Padrão |
| ---------- | ---- | ----------- | ------------- | ------ |
| patient_id | TEXT | Sim         | PK 1          | —      |
| action_id  | TEXT | Sim         | PK 2          | —      |
| user_id    | TEXT | Sim         | FK → users.id | —      |
| result     | TEXT | Sim         | —             | —      |

## notification_reads

| Campo           | Tipo | Obrigatório | Chave | Padrão |
| --------------- | ---- | ----------- | ----- | ------ |
| notification_id | TEXT | Sim         | PK 1  | —      |
| user_id         | TEXT | Sim         | PK 2  | —      |

## notifications

| Campo      | Tipo | Obrigatório | Chave            | Padrão |
| ---------- | ---- | ----------- | ---------------- | ------ |
| id         | TEXT | Sim         | PK 1             | —      |
| patient_id | TEXT | Sim         | FK → patients.id | —      |
| kind       | TEXT | Sim         | —                | —      |
| title      | TEXT | Sim         | —                | —      |
| body       | TEXT | Sim         | —                | —      |
| created_at | TEXT | Sim         | —                | —      |
| dedupe_key | TEXT | Não         | —                | —      |

## pain_reports

| Campo           | Tipo | Obrigatório | Chave            | Padrão           |
| --------------- | ---- | ----------- | ---------------- | ---------------- |
| id              | TEXT | Sim         | PK 1             | —                |
| patient_id      | TEXT | Sim         | FK → patients.id | —                |
| region          | TEXT | Sim         | —                | —                |
| side            | TEXT | Sim         | —                | —                |
| kind            | TEXT | Sim         | —                | —                |
| intensity       | TEXT | Sim         | —                | —                |
| since           | TEXT | Sim         | —                | —                |
| notes           | TEXT | Sim         | —                | ''               |
| source          | TEXT | Sim         | —                | —                |
| created_at      | TEXT | Sim         | —                | —                |
| external_status | TEXT | Sim         | —                | 'not_configured' |

## patients

| Campo   | Tipo | Obrigatório | Chave         | Padrão |
| ------- | ---- | ----------- | ------------- | ------ |
| id      | TEXT | Sim         | PK 1          | —      |
| user_id | TEXT | Sim         | FK → users.id | —      |

## preferences

| Campo         | Tipo    | Obrigatório | Chave | Padrão |
| ------------- | ------- | ----------- | ----- | ------ |
| patient_id    | TEXT    | Sim         | PK 1  | —      |
| medication    | INTEGER | Sim         | —     | 1      |
| appointment   | INTEGER | Sim         | —     | 1      |
| pain          | INTEGER | Sim         | —     | 1      |
| sos           | INTEGER | Sim         | —     | 1      |
| missing       | INTEGER | Sim         | —     | 1      |
| grace_minutes | INTEGER | Sim         | —     | 30     |

## sessions

| Campo      | Tipo    | Obrigatório | Chave         | Padrão |
| ---------- | ------- | ----------- | ------------- | ------ |
| token_hash | TEXT    | Sim         | PK 1          | —      |
| user_id    | TEXT    | Sim         | FK → users.id | —      |
| expires_at | INTEGER | Sim         | —             | —      |

## users

| Campo         | Tipo | Obrigatório | Chave | Padrão            |
| ------------- | ---- | ----------- | ----- | ----------------- |
| id            | TEXT | Sim         | PK 1  | —                 |
| name          | TEXT | Sim         | —     | —                 |
| email         | TEXT | Sim         | —     | —                 |
| phone         | TEXT | Sim         | —     | —                 |
| birth_date    | TEXT | Não         | —     | —                 |
| password_hash | TEXT | Sim         | —     | —                 |
| role          | TEXT | Sim         | —     | —                 |
| demo_group    | TEXT | Não         | —     | —                 |
| consent_at    | TEXT | Sim         | —     | —                 |
| created_at    | TEXT | Sim         | —     | CURRENT_TIMESTAMP |

## Restrições e retenção

- E-mail único; senhas somente em `password_hash`, usando salt aleatório + scrypt. Sessões e convites armazenam somente hashes de tokens/códigos.
- Um perfil de idoso por conta; vínculo M:N com cuidadores. Convites têm expiração e são consumidos uma única vez.
- Uma confirmação por medicamento/dia. O histórico de mudanças é preservado em `events`; a confirmação guarda o estado final.
- Estados de dose: `taken`, `not_taken`, `snoozed`; sem linha de confirmação significa `Sem confirmação`.
- Índices por paciente, dia e data; chaves compostas impedem duplicação de notificações lidas, dispositivos e ações de sincronização.
- As referências usam exclusão em cascata. Excluir medicamento elimina suas confirmações; excluir idoso elimina os dados do cuidado.
- Antes de uso real, defina retenção, acesso a backups e descarte seguro. SQLite DELETE não equivale a eliminação física forense; backups e IndexedDB também exigem política de descarte.
