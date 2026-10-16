import express from "express";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import { openDb, uid, now, day, transaction } from "./db.mjs";
const hash = (s) => createHash("sha256").update(s).digest("hex");
const passwordHash = (p) => {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(p, salt, 64).toString("hex");
};
const passwordMatches = (p, h) => {
  const [salt, key] = h.split(":");
  return timingSafeEqual(Buffer.from(key, "hex"), scryptSync(p, salt, 64));
};
const text = z.string().trim().min(1).max(200);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s,
    "Data inválida.",
  );
const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s()\-]{10,22}$/, "Informe um telefone válido com DDD.");
const optionalNotes = z.string().trim().max(1000).default("");
const registration = z
  .object({
    name: text,
    email: z
      .string()
      .email()
      .max(200)
      .transform((s) => s.toLowerCase()),
    phone,
    birth_date: date.optional(),
    password: z
      .string()
      .min(10, "Use uma senha com pelo menos 10 caracteres.")
      .max(128),
    role: z.enum(["elder", "caregiver"]),
    consent: z.literal(true),
    contact: z.object({ name: text, phone, relationship: text }).optional(),
  })
  .refine(
    (x) => x.role !== "elder" || !!x.birth_date,
    "Informe sua data de nascimento.",
  )
  .refine(
    (x) => !x.birth_date || x.birth_date <= day(),
    "A data de nascimento não pode ser futura.",
  );
const schemas = {
  medications: z.object({
    name: text,
    dosage: text,
    time,
    instructions: optionalNotes,
  }),
  appointments: z.object({
    doctor: text,
    specialty: text,
    date,
    time,
    location: text,
    notes: optionalNotes,
  }),
  contacts: z.object({
    name: text,
    phone,
    relationship: text,
    notify: z.boolean().default(true),
  }),
};
export function createApp({
  dbPath = process.env.DB_PATH || ".data/cuidali.sqlite",
  secure = process.env.COOKIE_SECURE === "true",
} = {}) {
  const db = openDb(dbPath);
  const app = express();
  app.disable("x-powered-by");
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const fail = (status, message) => {
    throw Object.assign(new Error(message), { status });
  };
  app.use(express.json({ limit: "64kb" }));
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), geolocation=()",
    });
    if (req.path.startsWith("/api")) res.set("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin
    ) {
      let origin;
      try {
        origin = new URL(req.headers.origin).host;
      } catch {
        return res.status(403).json({ error: "Origem inválida." });
      }
      if (origin !== req.headers.host)
        return res.status(403).json({
          error: "Esta solicitação precisa vir do próprio aplicativo.",
        });
    }
    next();
  });
  const attempts = new Map();
  function rateLimit(req, res, next) {
    const key = req.socket.remoteAddress;
    const entry = attempts.get(key) || { count: 0, reset: Date.now() + 60000 };
    if (Date.now() > entry.reset) {
      entry.count = 0;
      entry.reset = Date.now() + 60000;
    }
    entry.count++;
    attempts.set(key, entry);
    if (attempts.size > 10000)
      for (const [k, v] of attempts)
        if (v.reset < Date.now()) attempts.delete(k);
    if (entry.count > 30)
      return res.status(429).json({
        error: "Muitas tentativas. Aguarde um minuto e tente novamente.",
      });
    next();
  }
  app.use("/api/auth", rateLimit);
  function session(res, id) {
    const token = randomBytes(32).toString("hex");
    run(
      "INSERT INTO sessions VALUES (?,?,?)",
      hash(token),
      id,
      Date.now() + 7 * 86400000,
    );
    res.cookie("cuidali_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure,
      maxAge: 7 * 86400000,
      path: "/",
    });
  }
  const publicUser = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    birth_date: u.birth_date,
    role: u.role,
    demo: !!u.demo_group,
  });
  function patientFor(userId) {
    return all(
      "SELECT p.id,u.name,u.birth_date FROM patients p JOIN users u ON u.id=p.user_id WHERE p.user_id=? OR p.id IN (SELECT patient_id FROM links WHERE caregiver_id=?)",
      userId,
      userId,
    );
  }
  function patientSetup(userId) {
    const p = uid();
    run("INSERT INTO patients VALUES (?,?)", p, userId);
    run("INSERT INTO preferences(patient_id) VALUES (?)", p);
    return p;
  }
  function event(p, actor, type, title, details = "") {
    run(
      "INSERT INTO events VALUES (?,?,?,?,?,?,?)",
      uid(),
      p,
      actor,
      type,
      title,
      details,
      now(),
    );
  }
  function notify(p, kind, title, body, key = null) {
    const pref = get("SELECT * FROM preferences WHERE patient_id=?", p);
    if (!pref?.[kind]) return;
    run(
      "INSERT OR IGNORE INTO notifications VALUES (?,?,?,?,?,?,?)",
      uid(),
      p,
      kind,
      title,
      body,
      now(),
      key,
    );
  }
  app.get("/api/health", (_, res) =>
    res.json({ status: "ok", storage: "sqlite" }),
  );
  app.post("/api/auth/register", (req, res) => {
    const data = registration.parse(req.body);
    if (get("SELECT id FROM users WHERE email=?", data.email))
      return fail(409, "Este e-mail já está cadastrado. Entre na sua conta.");
    const id = uid();
    transaction(db, () => {
      run(
        "INSERT INTO users(id,name,email,phone,birth_date,password_hash,role,consent_at) VALUES (?,?,?,?,?,?,?,?)",
        id,
        data.name,
        data.email,
        data.phone,
        data.birth_date || null,
        passwordHash(data.password),
        data.role,
        now(),
      );
      if (data.role === "elder") {
        const p = patientSetup(id);
        if (data.contact)
          run(
            "INSERT INTO contacts VALUES (?,?,?,?,?,?,?)",
            uid(),
            p,
            data.contact.name,
            data.contact.phone,
            data.contact.relationship,
            1,
            1,
          );
      }
    });
    session(res, id);
    res
      .status(201)
      .json({ user: publicUser(get("SELECT * FROM users WHERE id=?", id)) });
  });
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = z
      .object({ email: z.string().max(200), password: z.string().max(128) })
      .parse(req.body);
    const u = get(
      "SELECT * FROM users WHERE email=?",
      email.trim().toLowerCase(),
    );
    if (!u || !passwordMatches(password, u.password_hash))
      return fail(
        401,
        "E-mail ou senha incorretos. Confira e tente novamente.",
      );
    session(res, u.id);
    res.json({ user: publicUser(u) });
  });
  app.post("/api/auth/recovery", (_, res) =>
    res.status(501).json({
      error:
        "A recuperação por e-mail ainda precisa de um provedor configurado. Não enviamos nenhuma mensagem.",
    }),
  );
  app.post("/api/auth/demo", (req, res) => {
    const group = uid();
    const elder = uid(),
      caregiver = uid();
    transaction(db, () => {
      for (const [id, name, role] of [
        [elder, "Gerson Canali", "elder"],
        [caregiver, "Enzo Avanze", "caregiver"],
      ])
        run(
          "INSERT INTO users(id,name,email,phone,birth_date,password_hash,role,demo_group,consent_at) VALUES (?,?,?,?,?,?,?,?,?)",
          id,
          name,
          `${id}@demo.invalid`,
          "11999990000",
          role === "elder" ? "1954-08-28" : null,
          passwordHash(randomBytes(24).toString("hex")),
          role,
          group,
          now(),
        );
      const p = patientSetup(elder);
      run("INSERT INTO links VALUES (?,?)", p, caregiver);
      for (const [name, dosage, t, instructions] of [
        ["Losartana", "50 mg", "08:00", "Siga as orientações da sua receita."],
        [
          "Metformina",
          "500 mg",
          "12:00",
          "Siga as orientações da sua receita.",
        ],
        [
          "Sinvastatina",
          "20 mg",
          "20:00",
          "Siga as orientações da sua receita.",
        ],
      ])
        run(
          "INSERT INTO medications VALUES (?,?,?,?,?,?,1)",
          uid(),
          p,
          name,
          dosage,
          t,
          instructions,
        );
      run(
        "INSERT INTO appointments VALUES (?,?,?,?,?,?,?,?,1)",
        uid(),
        p,
        "Dra. Ana Souza",
        "Cardiologia",
        day(),
        "14:00",
        "Clínica Bem-Estar · Sala 3",
        "Leve seus exames e a lista de medicamentos.",
      );
      run(
        "INSERT INTO contacts VALUES (?,?,?,?,?,?,1)",
        uid(),
        p,
        "Enzo Avanze",
        "11999990000",
        "Filho",
        1,
      );
      event(
        p,
        elder,
        "welcome",
        "Sua rede de cuidado está pronta",
        "Dados fictícios para conhecer o Cuidali.",
      );
    });
    session(res, elder);
    res.json({
      user: publicUser(get("SELECT * FROM users WHERE id=?", elder)),
    });
  });
  app.use("/api", (req, res, next) => {
    const token = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("cuidali_session="))
      ?.slice(16);
    const s =
      token &&
      get(
        "SELECT user_id FROM sessions WHERE token_hash=? AND expires_at>?",
        hash(token),
        Date.now(),
      );
    if (!s)
      return res
        .status(401)
        .json({ error: "Entre na sua conta para continuar." });
    req.user = get("SELECT * FROM users WHERE id=?", s.user_id);
    req.token = token;
    next();
  });
  app.get("/api/me", (req, res) =>
    res.json({ user: publicUser(req.user), patients: patientFor(req.user.id) }),
  );
  app.post("/api/auth/logout", (req, res) => {
    run("DELETE FROM sessions WHERE token_hash=?", hash(req.token));
    res.clearCookie("cuidali_session", { path: "/" });
    res.json({ ok: true });
  });
  app.post("/api/auth/demo/switch", (req, res) => {
    if (!req.user.demo_group)
      return fail(403, "Disponível apenas na demonstração.");
    const role = z.enum(["elder", "caregiver"]).parse(req.body.role);
    const u = get(
      "SELECT * FROM users WHERE demo_group=? AND role=?",
      req.user.demo_group,
      role,
    );
    run("DELETE FROM sessions WHERE token_hash=?", hash(req.token));
    session(res, u.id);
    res.json({ user: publicUser(u) });
  });
  app.delete("/api/account", (req, res) => {
    if (req.body.confirm !== "EXCLUIR")
      return fail(400, "Confirme a exclusão da conta.");
    run("DELETE FROM users WHERE id=?", req.user.id);
    res.clearCookie("cuidali_session", { path: "/" });
    res.json({ ok: true });
  });
  app.post("/api/links", (req, res) => {
    if (req.user.role !== "caregiver")
      return fail(403, "Apenas cuidadores podem aceitar convites.");
    const code = z
      .string()
      .regex(/^\d{8}$/)
      .parse(req.body.code);
    transaction(db, () => {
      const invite = get(
        "SELECT * FROM invites WHERE code_hash=? AND expires_at>?",
        hash(code),
        Date.now(),
      );
      if (!invite)
        return fail(
          400,
          "Código inválido ou expirado. Peça um novo código ao idoso.",
        );
      run(
        "INSERT OR IGNORE INTO links VALUES (?,?)",
        invite.patient_id,
        req.user.id,
      );
      run("DELETE FROM invites WHERE code_hash=?", hash(code));
      event(
        invite.patient_id,
        req.user.id,
        "link",
        "Novo cuidador autorizado",
        req.user.name,
      );
    });
    res.json({ ok: true });
  });
  function tick(p) {
    const current = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    const minutes = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
    const prefs = get("SELECT * FROM preferences WHERE patient_id=?", p);
    for (const m of all("SELECT * FROM medications WHERE patient_id=?", p)) {
      const c = get(
        "SELECT * FROM confirmations WHERE medication_id=? AND day=?",
        m.id,
        day(),
      );
      const target =
        c?.status === "snoozed" ? c.snooze_until?.slice(11, 16) : m.time;
      if (c && c.status !== "snoozed") continue;
      if (c?.status === "snoozed") {
        if (Date.parse(c.snooze_until) <= Date.now())
          notify(
            p,
            "medication",
            `Lembrete: ${m.name}`,
            `${m.dosage} · Lembrete adiado`,
            `${p}:${m.id}:${c.snooze_until}`,
          );
      } else if (minutes(current) >= minutes(target)) {
        notify(
          p,
          "medication",
          `Hora de ${m.name}`,
          `${m.dosage} · ${m.time}`,
          `${p}:${m.id}:${day()}`,
        );
        if (minutes(current) >= minutes(m.time) + (prefs?.grace_minutes || 30))
          notify(
            p,
            "missing",
            `${m.name}: sem confirmação`,
            "Ainda não há confirmação. Isso não significa que o medicamento não foi tomado.",
            `${p}:${m.id}:${day()}:missing`,
          );
      }
    }
    for (const a of all(
      "SELECT * FROM appointments WHERE patient_id=? AND date=?",
      p,
      day(),
    ))
      if (
        minutes(a.time) - minutes(current) <= 60 &&
        minutes(a.time) >= minutes(current)
      )
        notify(
          p,
          "appointment",
          "Sua consulta está próxima",
          `${a.doctor} · ${a.time} · ${a.location}`,
          `${p}:${a.id}:${day()}`,
        );
  }
  app.get("/api/state", (req, res) => {
    const patients = patientFor(req.user.id);
    const p = req.query.patient || patients[0]?.id;
    if (p && !patients.some((x) => x.id === p))
      return fail(403, "Você não tem autorização para acessar este idoso.");
    if (!p)
      return res.json({
        user: publicUser(req.user),
        patients,
        patient: null,
        medications: [],
        appointments: [],
        contacts: [],
        alerts: [],
        pain: [],
        events: [],
        confirmations: [],
        devices: [],
        notifications: [],
        caregivers: [],
        interactions: [],
        preferences: {
          medication: 1,
          appointment: 1,
          pain: 1,
          sos: 1,
          missing: 1,
          grace_minutes: 30,
        },
        day: day(),
        server_time: now(),
      });
    tick(p);
    res.json({
      user: publicUser(req.user),
      patients,
      patient: patients.find((x) => x.id === p),
      medications: all(
        "SELECT m.*,c.status,c.snooze_until,c.created_at AS confirmed_at,c.day FROM medications m LEFT JOIN confirmations c ON c.medication_id=m.id AND c.day=? WHERE m.patient_id=? ORDER BY m.time",
        day(),
        p,
      ),
      appointments: all(
        "SELECT * FROM appointments WHERE patient_id=? ORDER BY date,time",
        p,
      ),
      contacts: all("SELECT * FROM contacts WHERE patient_id=?", p),
      alerts: all(
        "SELECT a.*,COALESCE(u.name,'Conta excluída') AS actor FROM alerts a LEFT JOIN users u ON u.id=a.actor_id WHERE a.patient_id=? ORDER BY a.created_at DESC LIMIT 100",
        p,
      ),
      pain: all(
        "SELECT * FROM pain_reports WHERE patient_id=? ORDER BY created_at DESC LIMIT 100",
        p,
      ),
      events: all(
        "SELECT * FROM events WHERE patient_id=? ORDER BY created_at DESC LIMIT 100",
        p,
      ),
      confirmations: all(
        "SELECT c.*,m.name,m.dosage,m.time FROM confirmations c JOIN medications m ON m.id=c.medication_id WHERE c.patient_id=? ORDER BY c.created_at DESC LIMIT 100",
        p,
      ),
      devices: all("SELECT * FROM devices WHERE patient_id=?", p),
      preferences: get("SELECT * FROM preferences WHERE patient_id=?", p),
      notifications: all(
        "SELECT n.*,CASE WHEN r.user_id IS NULL THEN 0 ELSE 1 END AS is_read FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.user_id=? WHERE n.patient_id=? ORDER BY n.created_at DESC LIMIT 100",
        req.user.id,
        p,
      ),
      caregivers: all(
        "SELECT u.id,u.name FROM users u JOIN links l ON u.id=l.caregiver_id WHERE l.patient_id=?",
        p,
      ),
      interactions: all(
        "SELECT * FROM (SELECT * FROM interactions WHERE patient_id=? AND user_id=? ORDER BY created_at DESC LIMIT 30) ORDER BY created_at",
        p,
        req.user.id,
      ),
      server_time: now(),
      day: day(),
    });
  });
  app.use("/api/patients/:patientId", (req, res, next) => {
    const p = req.params.patientId;
    if (!patientFor(req.user.id).some((x) => x.id === p))
      return res
        .status(403)
        .json({ error: "Você não tem autorização para acessar este idoso." });
    req.patient = p;
    next();
  });
  const base = "/api/patients/:patientId";
  app.post(base + "/invite", (req, res) => {
    const p = get("SELECT * FROM patients WHERE id=?", req.patient);
    if (p.user_id !== req.user.id)
      return fail(403, "Somente o idoso pode autorizar um novo cuidador.");
    const code = String((randomBytes(4).readUInt32BE() % 90000000) + 10000000);
    run("DELETE FROM invites WHERE patient_id=?", req.patient);
    run(
      "INSERT INTO invites VALUES (?,?,?)",
      hash(code),
      req.patient,
      Date.now() + 10 * 60000,
    );
    res.json({ code, expires_in: 600 });
  });
  app.delete(base + "/links/:id", (req, res) => {
    const p = get("SELECT * FROM patients WHERE id=?", req.patient);
    if (p.user_id !== req.user.id && req.params.id !== req.user.id)
      return fail(403, "Somente o idoso pode revogar outro cuidador.");
    run(
      "DELETE FROM links WHERE patient_id=? AND caregiver_id=?",
      req.patient,
      req.params.id,
    );
    res.json({ ok: true });
  });
  for (const [table, schema] of Object.entries(schemas)) {
    app.post(base + "/" + table, (req, res) => {
      const data = schema.parse(req.body);
      const id = uid();
      const fields = Object.keys(data);
      transaction(db, () => {
        run(
          `INSERT INTO ${table}(id,patient_id,${fields.join(",")}) VALUES (?, ?, ${fields.map(() => "?").join(",")})`,
          id,
          req.patient,
          ...Object.values(data).map((v) =>
            typeof v === "boolean" ? Number(v) : v,
          ),
        );
        event(
          req.patient,
          req.user.id,
          table,
          "Cadastro realizado",
          data.name || data.doctor,
        );
      });
      res.status(201).json({ id, version: 1 });
    });
    app.put(base + "/" + table + "/:id", (req, res) => {
      const data = schema.parse(req.body);
      const version = z.number().int().positive().parse(req.body.version);
      const fields = Object.keys(data);
      const change = run(
        `UPDATE ${table} SET ${fields.map((f) => f + "=?").join(",")},version=version+1 WHERE id=? AND patient_id=? AND version=?`,
        ...Object.values(data).map((v) =>
          typeof v === "boolean" ? Number(v) : v,
        ),
        req.params.id,
        req.patient,
        version,
      );
      if (!change.changes)
        return fail(
          409,
          "Este registro mudou em outro dispositivo ou foi excluído. Atualize antes de editar.",
        );
      event(
        req.patient,
        req.user.id,
        table,
        "Cadastro atualizado",
        data.name || data.doctor,
      );
      res.json({ ok: true, version: version + 1 });
    });
    app.delete(base + "/" + table + "/:id", (req, res) => {
      const item = get(
        `SELECT * FROM ${table} WHERE id=? AND patient_id=?`,
        req.params.id,
        req.patient,
      );
      if (!item) return fail(404, "Registro não encontrado.");
      if (req.body.version !== item.version)
        return fail(409, "Este registro mudou. Atualize antes de excluir.");
      transaction(db, () => {
        run(
          `DELETE FROM ${table} WHERE id=? AND patient_id=?`,
          item.id,
          req.patient,
        );
        event(
          req.patient,
          req.user.id,
          table,
          "Cadastro excluído",
          item.name || item.doctor,
        );
      });
      res.json({ ok: true });
    });
  }
  function mutate(req, fn) {
    const action = z.string().uuid().parse(req.body.action_id);
    return transaction(db, () => {
      const cached = get(
        "SELECT * FROM mutations WHERE patient_id=? AND action_id=?",
        req.patient,
        action,
      );
      if (cached) {
        if (cached.user_id !== req.user.id)
          return fail(409, "Identificador já utilizado.");
        return JSON.parse(cached.result);
      }
      const result = fn();
      run(
        "INSERT INTO mutations VALUES (?,?,?,?)",
        req.patient,
        action,
        req.user.id,
        JSON.stringify(result),
      );
      return result;
    });
  }
  app.post(base + "/confirmations", (req, res) => {
    const d = z
      .object({
        medication_id: z.string().uuid(),
        status: z.enum(["taken", "not_taken", "snoozed"]),
        day: date,
        minutes: z.number().int().min(5).max(120).default(15),
        source: z.enum(["web", "watch"]).default("web"),
        expected_version: z.string().nullable().default(null),
      })
      .parse(req.body);
    res.json(
      mutate(req, () => {
        const m = get(
          "SELECT * FROM medications WHERE id=? AND patient_id=?",
          d.medication_id,
          req.patient,
        );
        if (!m) return fail(404, "Medicamento não encontrado.");
        if (d.day > day())
          return fail(400, "Não é possível confirmar uma dose futura.");
        const c = get(
          "SELECT * FROM confirmations WHERE medication_id=? AND day=?",
          m.id,
          d.day,
        );
        if ((c?.created_at || null) !== d.expected_version)
          return fail(
            409,
            "A confirmação mudou em outro dispositivo. Confira o status atual antes de tentar de novo.",
          );
        const stamp = now();
        const snooze =
          d.status === "snoozed"
            ? new Date(Date.now() + d.minutes * 60000).toISOString()
            : null;
        run(
          "INSERT INTO confirmations VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(medication_id,day) DO UPDATE SET status=excluded.status,snooze_until=excluded.snooze_until,actor_id=excluded.actor_id,created_at=excluded.created_at",
          uid(),
          req.patient,
          m.id,
          d.day,
          d.status,
          snooze,
          req.user.id,
          stamp,
        );
        const label = {
          taken: "Tomado",
          not_taken: "Não tomei",
          snoozed: "Adiado",
        }[d.status];
        event(
          req.patient,
          req.user.id,
          "confirmation",
          `${m.name} · ${label}`,
          d.source === "watch"
            ? "Registrado pelo relógio"
            : "Registrado pelo aplicativo",
        );
        notify(
          req.patient,
          "medication",
          `${m.name} · ${label}`,
          `${d.day} · ${m.time}`,
        );
        return {
          ok: true,
          status: d.status,
          created_at: stamp,
          snooze_until: snooze,
        };
      }),
    );
  });
  app.post(base + "/sos", (req, res) => {
    const source = z.enum(["web", "watch"]).parse(req.body.source || "web");
    res.status(201).json(
      mutate(req, () => {
        const id = uid();
        run(
          "INSERT INTO alerts VALUES (?,?,?,?,?,?,?)",
          id,
          req.patient,
          req.user.id,
          "registered",
          "not_configured",
          source,
          now(),
        );
        event(
          req.patient,
          req.user.id,
          "sos",
          "Pedido de ajuda registrado",
          source === "watch" ? "Pelo relógio" : "Pelo aplicativo",
        );
        notify(
          req.patient,
          "sos",
          "Pedido de ajuda SOS",
          "Um pedido de ajuda foi registrado. Abra o Cuidali para acompanhar.",
        );
        return { id, status: "registered", external_status: "not_configured" };
      }),
    );
  });
  app.post(base + "/alerts/:id/ack", (req, res) => {
    if (req.user.role !== "caregiver")
      return fail(403, "A confirmação é feita pelo cuidador.");
    const changes = run(
      "UPDATE alerts SET status='acknowledged' WHERE id=? AND patient_id=?",
      req.params.id,
      req.patient,
    );
    if (!changes.changes) return fail(404, "Alerta não encontrado.");
    event(
      req.patient,
      req.user.id,
      "sos",
      "Cuidador visualizou o SOS",
      req.user.name,
    );
    res.json({ ok: true });
  });
  app.post(base + "/pain", (req, res) => {
    const d = z
      .object({
        region: text,
        side: z.enum(["Frente", "Costas"]),
        kind: z.enum([
          "Pontada",
          "Queimação",
          "Latejante",
          "Aperto ou peso",
          "Formigamento",
          "Constante",
        ]),
        intensity: z.enum(["Leve", "Média", "Forte", "Muito forte"]),
        since: z.enum(["Hoje", "Há alguns dias", "Há mais de uma semana"]),
        notes: optionalNotes,
        source: z.enum(["web", "watch"]).default("web"),
      })
      .parse(req.body);
    res.status(201).json(
      mutate(req, () => {
        const id = uid();
        run(
          "INSERT INTO pain_reports VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          id,
          req.patient,
          d.region,
          d.side,
          d.kind,
          d.intensity,
          d.since,
          d.notes,
          d.source,
          now(),
          "not_configured",
        );
        event(
          req.patient,
          req.user.id,
          "pain",
          "Novo registro de dor",
          `${d.region} · ${d.intensity}`,
        );
        notify(
          req.patient,
          "pain",
          "Novo relato de dor",
          `${d.region} · ${d.intensity}`,
        );
        return { id, external_status: "not_configured" };
      }),
    );
  });
  app.put(base + "/preferences", (req, res) => {
    const d = z
      .object({
        medication: z.boolean(),
        appointment: z.boolean(),
        pain: z.boolean(),
        sos: z.boolean(),
        missing: z.boolean(),
        grace_minutes: z.number().int().min(5).max(180),
      })
      .parse(req.body);
    run(
      "UPDATE preferences SET medication=?,appointment=?,pain=?,sos=?,missing=?,grace_minutes=? WHERE patient_id=?",
      +d.medication,
      +d.appointment,
      +d.pain,
      +d.sos,
      +d.missing,
      d.grace_minutes,
      req.patient,
    );
    res.json({ ok: true });
  });
  app.post(base + "/devices", (req, res) => {
    const d = z
      .object({ name: text, kind: z.enum(["web", "watch"]) })
      .parse(req.body);
    run(
      "INSERT INTO devices VALUES (?,?,?,?,?) ON CONFLICT(patient_id,name) DO UPDATE SET last_sync=excluded.last_sync",
      uid(),
      req.patient,
      d.name,
      now(),
      d.kind,
    );
    res.json({ ok: true });
  });
  app.delete(base + "/devices/:id", (req, res) => {
    run(
      "DELETE FROM devices WHERE id=? AND patient_id=?",
      req.params.id,
      req.patient,
    );
    res.json({ ok: true });
  });
  app.post(base + "/notifications/read", (req, res) => {
    run(
      "INSERT OR IGNORE INTO notification_reads SELECT id,? FROM notifications WHERE patient_id=?",
      req.user.id,
      req.patient,
    );
    res.json({ ok: true });
  });
  app.post(base + "/assistant", (req, res) => {
    const question = z.string().trim().min(1).max(1000).parse(req.body.message);
    const q = question
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    let answer,
      route = null;
    const p = req.patient;
    if (/ajuda|socorro|emergencia/.test(q)) {
      answer =
        "Vou abrir o SOS para você escolher como pedir ajuda. Se houver uma emergência, procure o serviço de emergência local: SAMU 192.";
      route = "sos";
    } else if (/dor|doendo/.test(q)) {
      answer =
        "Vamos registrar onde está incomodando e como você está se sentindo. Não faço diagnósticos. Se a dor for intensa ou repentina, procure atendimento.";
      route = "pain";
    } else if (/remedio|medicamento|dose/.test(q)) {
      const meds = all(
        "SELECT * FROM medications WHERE patient_id=? ORDER BY time",
        p,
      );
      answer = meds.length
        ? `Seus horários cadastrados são: ${meds.map((m) => `${m.name} ${m.dosage} às ${m.time}`).join("; ")}. Siga sempre a receita do seu profissional de saúde.`
        : "Você ainda não tem medicamentos cadastrados. Peça ajuda ao seu cuidador para cadastrar a receita.";
      route = "medications";
    } else if (/consulta|medico/.test(q)) {
      const a = get(
        "SELECT * FROM appointments WHERE patient_id=? AND date>=? ORDER BY date,time LIMIT 1",
        p,
        day(),
      );
      answer = a
        ? `Sua próxima consulta é com ${a.doctor}, em ${a.date.split("-").reverse().join("/")}, às ${a.time}, em ${a.location}.`
        : "Você não tem consultas futuras cadastradas.";
      route = "appointments";
    } else if (/dia|data|horas|hora/.test(q)) {
      answer =
        new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "full",
          timeStyle: "short",
        }).format(new Date()) + ".";
    } else {
      answer =
        "Posso ajudar com seus medicamentos, consultas, a data de hoje, um registro de dor ou um pedido de ajuda. Qual dessas opções você precisa?";
    }
    run(
      "INSERT INTO interactions VALUES (?,?,?,?,?,?)",
      uid(),
      p,
      req.user.id,
      question,
      answer,
      now(),
    );
    res.json({ answer, route });
  });
  app.get(base + "/export", (req, res) => {
    res.json({
      user: publicUser(req.user),
      patient: get(
        "SELECT p.id,u.name,u.birth_date FROM patients p JOIN users u ON p.user_id=u.id WHERE p.id=?",
        req.patient,
      ),
      ...Object.fromEntries(
        [
          "medications",
          "confirmations",
          "appointments",
          "contacts",
          "pain_reports",
          "alerts",
          "events",
          "devices",
          "preferences",
          "interactions",
        ].map((t) => [
          t,
          all(`SELECT * FROM ${t} WHERE patient_id=?`, req.patient),
        ]),
      ),
    });
  });
  app.use("/api", (_, res) =>
    res.status(404).json({ error: "Esta rota não existe." }),
  );
  const dist = resolve("dist");
  if (existsSync(dist)) {
    app.use((req, res, next) => {
      res.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      );
      next();
    });
    app.use(express.static(dist));
    app.get("/{*path}", (_, res) => res.sendFile(resolve(dist, "index.html")));
  }
  app.use((err, req, res, next) => {
    if (err instanceof z.ZodError)
      return res.status(400).json({
        error:
          "Confira os campos: " +
          err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
    if (err.type === "entity.parse.failed")
      return res
        .status(400)
        .json({ error: "Não foi possível ler os dados enviados." });
    res.status(err.status || 500).json({
      error: err.status
        ? err.message
        : "Não foi possível concluir. Tente novamente.",
    });
  });
  return {
    app,
    db,
    tickAll: () => {
      for (const p of all("SELECT id FROM patients")) tick(p.id);
      run("DELETE FROM sessions WHERE expires_at<?", Date.now());
      run("DELETE FROM invites WHERE expires_at<?", Date.now());
    },
  };
}
