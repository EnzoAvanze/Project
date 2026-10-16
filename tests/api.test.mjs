import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.mjs";
import { day } from "../server/db.mjs";
async function fixture(t, dbPath = ":memory:") {
  const { app, db, tickAll } = createApp({ dbPath });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => {
    server.closeAllConnections();
    server.close();
    db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  function client() {
    let cookie = "";
    return async (path, method = "GET", data, headers = {}) => {
      const res = await fetch(base + "/api" + path, {
        method,
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      const c = res.headers.get("set-cookie");
      if (c) cookie = c.split(";")[0];
      return {
        status: res.status,
        data: await res.json(),
        headers: res.headers,
      };
    };
  }
  return { db, client, tickAll };
}
const account = (role = "elder") => ({
  name: role === "elder" ? "Maria Teste" : "Ana Cuidadora",
  email: `${randomUUID()}@example.test`,
  phone: "11987654321",
  birth_date: "1950-04-20",
  password: "SenhaSegura123!",
  role,
  consent: true,
});
async function register(c, role = "elder") {
  const data = account(role);
  const r = await c("/auth/register", "POST", data);
  assert.equal(r.status, 201);
  return data;
}
async function state(c) {
  const r = await c("/state");
  assert.equal(r.status, 200);
  return r.data;
}
async function med(c, p) {
  const r = await c(`/patients/${p}/medications`, "POST", {
    name: "Losartana",
    dosage: "50 mg",
    time: "08:00",
    instructions: "Conforme a receita.",
  });
  assert.equal(r.status, 201);
  return r.data.id;
}
test("cadastro, hash, sessão segura, login, validação e logout", async (t) => {
  const { db, client } = await fixture(t);
  const c = client();
  assert.equal((await c("/state")).status, 401);
  const a = await register(c);
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(a.email);
  assert.notEqual(u.password_hash, a.password);
  assert.match(u.password_hash, /^[a-f0-9]+:[a-f0-9]+$/);
  assert.equal((await c("/auth/register", "POST", a)).status, 409);
  const s = await state(c);
  assert.equal(s.patient.name, a.name);
  assert.equal(s.medications.length, 0);
  assert.equal((await c("/auth/logout", "POST", {})).status, 200);
  assert.equal((await c("/state")).status, 401);
  assert.equal(
    (await c("/auth/login", "POST", { email: a.email, password: "errada" }))
      .status,
    401,
  );
  const login = await c("/auth/login", "POST", a);
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /HttpOnly/);
  assert.match(login.headers.get("set-cookie"), /SameSite=Strict/);
  assert.equal(
    (await c("/auth/register", "POST", { ...account(), password: "123" }))
      .status,
    400,
  );
  assert.equal(
    (
      await c("/auth/register", "POST", {
        ...account(),
        birth_date: "2020-02-31",
      })
    ).status,
    400,
  );
});
test("vínculo de uso único, autorização em todas as entidades e revogação", async (t) => {
  const { client } = await fixture(t);
  const elder = client(),
    caregiver = client(),
    stranger = client();
  await register(elder);
  await register(caregiver, "caregiver");
  await register(stranger);
  const p = (await state(elder)).patient.id;
  assert.equal((await state(caregiver)).patient, null);
  for (const c of [stranger, caregiver]) {
    assert.equal((await c("/state?patient=" + p)).status, 403);
    for (const route of [
      "/medications",
      "/sos",
      "/pain",
      "/devices",
      "/invite",
    ])
      assert.equal((await c(`/patients/${p}${route}`, "POST", {})).status, 403);
    assert.equal((await c(`/patients/${p}/export`)).status, 403);
  }
  const invite = await elder(`/patients/${p}/invite`, "POST", {});
  assert.equal(invite.data.code.length, 8);
  assert.equal(
    (await caregiver("/links", "POST", { code: invite.data.code })).status,
    200,
  );
  assert.equal(
    (await stranger("/links", "POST", { code: invite.data.code })).status,
    403,
  );
  const other = client();
  await register(other, "caregiver");
  assert.equal(
    (await other("/links", "POST", { code: invite.data.code })).status,
    400,
  );
  const caregiverId = (await state(caregiver)).user.id;
  assert.equal((await state(caregiver)).patient.id, p);
  assert.equal(
    (await caregiver(`/patients/${p}/invite`, "POST", {})).status,
    403,
  );
  await elder(`/patients/${p}/links/${caregiverId}`, "DELETE", {});
  assert.equal((await caregiver("/state?patient=" + p)).status, 403);
});
test("CRUD de medicamento, consulta e contato; versões e validação de entrada", async (t) => {
  const { client } = await fixture(t);
  const c = client();
  await register(c);
  const p = (await state(c)).patient.id;
  const data = { name: "Losartana", dosage: "50 mg", time: "08:00" };
  const m = await med(c, p);
  assert.equal(
    (
      await c(`/patients/${p}/medications/${m}`, "PUT", {
        ...data,
        name: "Atualizado",
        version: 1,
      })
    ).status,
    200,
  );
  assert.equal(
    (await c(`/patients/${p}/medications/${m}`, "PUT", { ...data, version: 1 }))
      .status,
    409,
  );
  assert.equal(
    (await c(`/patients/${p}/medications`, "POST", { ...data, time: "25:90" }))
      .status,
    400,
  );
  assert.equal(
    (await c(`/patients/${p}/medications/${m}`, "DELETE", { version: 1 }))
      .status,
    409,
  );
  assert.equal(
    (await c(`/patients/${p}/medications/${m}`, "DELETE", { version: 2 }))
      .status,
    200,
  );
  const a = {
    doctor: "Dra. Ana",
    specialty: "Cardiologia",
    date: day(),
    time: "14:00",
    location: "Clínica 1",
    notes: "Levar exames",
  };
  const appt = await c(`/patients/${p}/appointments`, "POST", a);
  assert.equal(appt.status, 201);
  assert.equal(
    (
      await c(`/patients/${p}/appointments/${appt.data.id}`, "PUT", {
        ...a,
        time: "15:00",
        version: 1,
      })
    ).status,
    200,
  );
  assert.equal((await state(c)).appointments[0].time, "15:00");
  assert.equal(
    (
      await c(`/patients/${p}/appointments/${appt.data.id}`, "DELETE", {
        version: 2,
      })
    ).status,
    200,
  );
  const contact = {
    name: "Filho",
    phone: "11999999999",
    relationship: "Filho",
    notify: true,
  };
  const cr = await c(`/patients/${p}/contacts`, "POST", contact);
  assert.equal(cr.status, 201);
  assert.equal(
    (
      await c(`/patients/${p}/contacts/${cr.data.id}`, "PUT", {
        ...contact,
        name: "Contato 2",
        version: 1,
      })
    ).status,
    200,
  );
  assert.equal(
    (await c(`/patients/${p}/contacts/${cr.data.id}`, "DELETE", { version: 2 }))
      .status,
    200,
  );
});
test("confirmações, adiamento, sincronização idempotente e conflito entre dispositivos", async (t) => {
  const { client, db } = await fixture(t);
  const c = client();
  const credentials = await register(c);
  const second = client();
  await second("/auth/login", "POST", credentials);
  const p = (await state(c)).patient.id;
  const m = await med(c, p);
  const body = {
    medication_id: m,
    status: "taken",
    day: day(),
    source: "watch",
    action_id: randomUUID(),
    expected_version: null,
  };
  const first = await c(`/patients/${p}/confirmations`, "POST", body);
  assert.equal(first.status, 200);
  assert.equal(
    (await second(`/patients/${p}/confirmations`, "POST", body)).status,
    200,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM confirmations").get().n, 1);
  assert.equal(
    (
      await second(`/patients/${p}/confirmations`, "POST", {
        ...body,
        action_id: randomUUID(),
        status: "not_taken",
      })
    ).status,
    409,
  );
  const s = await state(second);
  assert.equal(s.medications[0].status, "taken");
  const snooze = await second(`/patients/${p}/confirmations`, "POST", {
    ...body,
    action_id: randomUUID(),
    status: "snoozed",
    minutes: 15,
    expected_version: s.medications[0].confirmed_at,
  });
  assert.equal(snooze.status, 200);
  assert.ok(Date.parse(snooze.data.snooze_until) > Date.now() + 14 * 60000);
  const after = await state(c);
  assert.equal(after.medications[0].status, "snoozed");
  assert.equal(after.confirmations.length, 1);
  assert.equal(
    (
      await c(`/patients/${p}/confirmations`, "POST", {
        ...body,
        action_id: randomUUID(),
        status: "not_taken",
        expected_version: after.medications[0].confirmed_at,
      })
    ).status,
    200,
  );
  assert.equal((await state(c)).medications[0].status, "not_taken");
});
test("SOS registrado sem alegar envio externo, recebido pelo cuidador e deduplicado", async (t) => {
  const { client, db } = await fixture(t);
  const elder = client(),
    caregiver = client();
  await register(elder);
  await register(caregiver, "caregiver");
  const p = (await state(elder)).patient.id;
  const {
    data: { code },
  } = await elder(`/patients/${p}/invite`, "POST", {});
  await caregiver("/links", "POST", { code });
  const body = { source: "watch", action_id: randomUUID() };
  const r = await elder(`/patients/${p}/sos`, "POST", body);
  assert.equal(r.status, 201);
  assert.equal(r.data.external_status, "not_configured");
  await elder(`/patients/${p}/sos`, "POST", body);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM alerts").get().n, 1);
  const s = await state(caregiver);
  assert.equal(s.alerts[0].status, "registered");
  assert.ok(s.notifications.some((n) => n.kind === "sos"));
  assert.equal(
    (await elder(`/patients/${p}/alerts/${r.data.id}/ack`, "POST", {})).status,
    403,
  );
  assert.equal(
    (await caregiver(`/patients/${p}/alerts/${r.data.id}/ack`, "POST", {}))
      .status,
    200,
  );
  assert.equal((await state(elder)).alerts[0].status, "acknowledged");
});
test("registro de dor, histórico, assistente baseado nos dados e exportação", async (t) => {
  const { client, db } = await fixture(t);
  const c = client();
  await register(c);
  const p = (await state(c)).patient.id;
  const body = {
    action_id: randomUUID(),
    region: "Joelho esquerdo",
    side: "Frente",
    kind: "Pontada",
    intensity: "Forte",
    since: "Hoje",
    notes: "Ao caminhar",
    source: "web",
  };
  assert.equal((await c(`/patients/${p}/pain`, "POST", body)).status, 201);
  await c(`/patients/${p}/pain`, "POST", body);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM pain_reports").get().n, 1);
  assert.equal(
    (await c(`/patients/${p}/pain`, "POST", { ...body, intensity: "inválida" }))
      .status,
    400,
  );
  const assistant = await c(`/patients/${p}/assistant`, "POST", {
    message: "Meus remédios",
  });
  assert.match(assistant.data.answer, /ainda não tem medicamentos/);
  await med(c, p);
  assert.match(
    (await c(`/patients/${p}/assistant`, "POST", { message: "Meus remédios" }))
      .data.answer,
    /Losartana/,
  );
  assert.equal(
    (
      await c(`/patients/${p}/assistant`, "POST", {
        message: "Quero registrar uma dor",
      })
    ).data.route,
    "pain",
  );
  const exportR = await c(`/patients/${p}/export`);
  assert.equal(exportR.data.pain_reports[0].notes, "Ao caminhar");
  assert.ok(!JSON.stringify(exportR.data).includes("password_hash"));
});
test("automação sem duplicar avisos, sem confirmação não é não tomou; preferências e leitura individual", async (t) => {
  const { client, db, tickAll } = await fixture(t);
  const c = client();
  await register(c);
  const p = (await state(c)).patient.id;
  const r = await c(`/patients/${p}/medications`, "POST", {
    name: "Teste",
    dosage: "10 mg",
    time: "00:00",
  });
  tickAll();
  tickAll();
  const count = db
    .prepare("SELECT count(*) n FROM notifications WHERE kind='medication'")
    .get().n;
  assert.equal(count, 1);
  const s = await state(c);
  assert.equal(s.medications[0].status, null);
  assert.equal(s.confirmations.length, 0);
  await c(`/patients/${p}/notifications/read`, "POST", {});
  assert.ok((await state(c)).notifications.every((n) => n.is_read));
  assert.equal(
    (
      await c(`/patients/${p}/preferences`, "PUT", {
        medication: false,
        appointment: false,
        pain: false,
        sos: true,
        missing: false,
        grace_minutes: 15,
      })
    ).status,
    200,
  );
  const before = db.prepare("SELECT COUNT(*) n FROM notifications").get().n;
  await c(`/patients/${p}/pain`, "POST", {
    action_id: randomUUID(),
    region: "Cabeça",
    side: "Frente",
    kind: "Constante",
    intensity: "Leve",
    since: "Hoje",
  });
  assert.equal(
    db.prepare("SELECT COUNT(*) n FROM notifications").get().n,
    before,
  );
});
test("persistência após reabrir SQLite e exclusão em cascata", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "cuidali-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "db.sqlite");
  const { client, db } = await fixture(t, path);
  const c = client();
  const a = await register(c);
  const p = (await state(c)).patient.id;
  await med(c, p);
  const second = await fixture(t, path);
  const c2 = second.client();
  assert.equal((await c2("/auth/login", "POST", a)).status, 200);
  assert.equal((await state(c2)).medications.length, 1);
  assert.equal(
    (await c2("/account", "DELETE", { confirm: "não" })).status,
    400,
  );
  assert.equal(
    (await c2("/account", "DELETE", { confirm: "EXCLUIR" })).status,
    200,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM patients").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM medications").get().n, 0);
  assert.equal((await c("/state")).status, 401);
});
test("proteção de origem e recuperação transparente sem provedor", async (t) => {
  const { client } = await fixture(t);
  const c = client();
  assert.equal(
    (
      await c("/auth/register", "POST", account(), {
        Origin: "https://malicioso.example",
      })
    ).status,
    403,
  );
  const r = await c("/auth/recovery", "POST", {});
  assert.equal(r.status, 501);
  assert.match(r.data.error, /Não enviamos/);
});
test("demonstrações isoladas e alternância restrita ao próprio grupo", async (t) => {
  const { client } = await fixture(t);
  const a = client(),
    b = client();
  assert.equal((await a("/auth/demo", "POST", {})).status, 200);
  await b("/auth/demo", "POST", {});
  const s = await state(a),
    s2 = await state(b);
  assert.notEqual(s.patient.id, s2.patient.id);
  assert.equal(s.medications.length, 3);
  assert.equal((await b("/state?patient=" + s.patient.id)).status, 403);
  await a("/auth/demo/switch", "POST", { role: "caregiver" });
  assert.equal((await state(a)).user.role, "caregiver");
  assert.equal((await state(a)).patient.id, s.patient.id);
});

test("excluir conta de cuidador preserva confirmações e SOS pertencentes ao idoso", async (t) => {
  const { client } = await fixture(t);
  const elder = client(),
    caregiver = client();
  await register(elder);
  await register(caregiver, "caregiver");
  const p = (await state(elder)).patient.id;
  const invite = await elder(`/patients/${p}/invite`, "POST", {});
  await caregiver("/links", "POST", { code: invite.data.code });
  const m = await med(caregiver, p);
  await caregiver(`/patients/${p}/confirmations`, "POST", {
    medication_id: m,
    day: day(),
    status: "taken",
    expected_version: null,
    action_id: randomUUID(),
  });
  await caregiver(`/patients/${p}/sos`, "POST", {
    source: "web",
    action_id: randomUUID(),
  });
  assert.equal(
    (await caregiver("/account", "DELETE", { confirm: "EXCLUIR" })).status,
    200,
  );
  const s = await state(elder);
  assert.equal(s.medications[0].status, "taken");
  assert.equal(s.alerts.length, 1);
  assert.equal(s.alerts[0].actor, "Conta excluída");
  assert.equal(s.caregivers.length, 0);
});
