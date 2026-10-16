import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  HeartHandshake,
  History,
  Home as HomeIcon,
  LogOut,
  Menu,
  MessageCircle,
  Pill,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  Users,
  Watch as WatchIcon,
  WifiOff,
  X,
} from "lucide-react";
import Auth from "./Auth";
import { api, ApiError, outbox, type Queued } from "./api";
import { Context } from "./context";
import type { State, Page } from "./types";
import { Brand, Busy, Modal, stampLabel } from "./components";
import {
  Home,
  Medications,
  Appointments,
  Assistant,
  PainScreen,
  SOS,
  HistoryScreen,
  Profile,
  WatchSettings,
} from "./Screens";
import WatchExperience from "./Watch";
const navItems: [Page, string, typeof HomeIcon][] = [
  ["home", "Meu dia", HomeIcon],
  ["medications", "Medicamentos", Pill],
  ["appointments", "Consultas", CalendarDays],
  ["assistant", "Assistente", MessageCircle],
  ["pain", "Registro de dores", Activity],
  ["history", "Histórico", History],
];
export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("home");
  const [online, setOnline] = useState(navigator.onLine);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [notifs, setNotifs] = useState(false);
  const [editor, setEditor] = useState<{
    type: "medications" | "appointments" | "contacts";
    item?: any;
  } | null>(null);
  const [med, setMed] = useState<any>(null);
  const [pending, setPending] = useState<Queued[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("cuidali-large") === "true",
  );
  const patientRef = useRef("");
  const userRef = useRef("");
  const flushing = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const heading = useRef<HTMLElement>(null);
  const shownNotifications = useRef(new Set<string>());
  const isWatch = location.pathname.startsWith("/relogio");
  function say(message: string) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6500);
  }
  async function refresh() {
    try {
      const s = await api<State>(
        "/state" + (patientRef.current ? "?patient=" + patientRef.current : ""),
      );
      patientRef.current = s.patient?.id || "";
      userRef.current = s.user.id;
      setState(s);
      setError("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setState(null);
        patientRef.current = "";
        userRef.current = "";
      } else if (
        e instanceof ApiError &&
        e.status === 403 &&
        patientRef.current
      ) {
        patientRef.current = "";
        await refresh();
      } else {
        setError(
          navigator.onLine
            ? "Não foi possível atualizar. Seus dados podem estar desatualizados."
            : "Sem conexão. Mostrando os dados desta sessão.",
        );
      }
    } finally {
      setLoading(false);
    }
  }
  async function updatePending() {
    const all = await outbox.all();
    setPending(all.filter((x) => x.owner === userRef.current));
  }
  async function flush() {
    if (flushing.current || !navigator.onLine || !userRef.current) return;
    flushing.current = true;
    try {
      const items = (await outbox.all()).filter(
        (x) => x.owner === userRef.current,
      );
      let sent = 0;
      for (const item of items) {
        if (item.error) continue;
        try {
          await api(`/patients/${item.patient}${item.path}`, "POST", item.body);
          await outbox.remove(item.id);
          sent++;
        } catch (e) {
          if (e instanceof ApiError) {
            await outbox.put({ ...item, error: e.message });
          } else break;
        }
      }
      await updatePending();
      if (sent) {
        say(
          `${sent} ${sent === 1 ? "ação sincronizada" : "ações sincronizadas"} com o servidor.`,
        );
        await refresh();
      }
    } finally {
      flushing.current = false;
    }
  }
  useEffect(() => {
    void refresh();
    const on = () => {
      setOnline(true);
      void flush();
      void refresh();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  useEffect(() => {
    if (!state) return;
    void updatePending();
    void flush();
    const timer = setInterval(() => {
      if (navigator.onLine) {
        void refresh();
        void flush();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [state?.user.id]);
  useEffect(() => {
    document.documentElement.classList.toggle("large-text", fontSize);
    localStorage.setItem("cuidali-large", String(fontSize));
  }, [fontSize]);
  useEffect(() => {
    setMenu(false);
    heading.current?.focus();
    document.title = `${({ home: "Meu dia", medications: "Medicamentos", appointments: "Consultas", assistant: "Assistente", pain: "Registro de dores", sos: "SOS", history: "Histórico", watch: "Meu relógio", profile: "Meu perfil" } as Record<Page, string>)[page]} · Cuidali`;
    window.scrollTo(0, 0);
  }, [page]);
  useEffect(() => {
    if (!state?.notifications) return;
    const list = state.notifications;
    for (const n of list) {
      if (shownNotifications.current.has(n.id)) continue;
      shownNotifications.current.add(n.id);
      if (
        !n.is_read &&
        Date.now() - Date.parse(n.created_at) < 30000 &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const notice = new Notification(n.title, {
            body: n.body,
            tag: n.id,
            icon: "/icon.svg",
          });
          notice.onclick = () => {
            window.focus();
            setNotifs(true);
            notice.close();
          };
        } catch {
          /* The in-app notification remains available when the browser rejects delivery. */
        }
      }
    }
  }, [state?.notifications]);
  async function act(
    path: string,
    body: Record<string, unknown> = {},
    method = "POST",
    queueLabel?: string,
  ) {
    const payload = queueLabel
      ? { ...body, action_id: crypto.randomUUID() }
      : body;
    try {
      const r = await api(
        `/patients/${patientRef.current}${path}`,
        method,
        payload,
      );
      await refresh();
      return r;
    } catch (e) {
      if (queueLabel && !(e instanceof ApiError)) {
        const q = {
          id: String(payload.action_id),
          owner: userRef.current,
          patient: patientRef.current,
          path,
          body: payload,
          label: queueLabel,
        };
        await outbox.put(q);
        await updatePending();
        say(
          "Ação guardada neste dispositivo. Será sincronizada ao recuperar a conexão.",
        );
        return { queued: true };
      }
      throw e;
    }
  }
  async function logout() {
    setBusy(true);
    try {
      if (pending.length)
        throw new Error(
          "Sincronize ou descarte as ações pendentes antes de sair.",
        );
      await api("/auth/logout", "POST", {});
      await outbox.clearOwner(userRef.current);
      setState(null);
      patientRef.current = "";
      userRef.current = "";
      setPage("home");
    } catch (e) {
      say((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const context = state
    ? {
        state,
        page,
        go: setPage,
        refresh,
        act,
        toast: say,
        online,
        pendingCount: pending.length,
        openQueue: () => setQueueOpen(true),
        openEditor: (
          type: "medications" | "appointments" | "contacts",
          item?: any,
        ) => setEditor({ type, item }),
        confirmMedication: setMed,
      }
    : null;
  if (loading)
    return (
      <div className="splash">
        <Brand />
        <Busy />
        <p>Preparando seu cuidado…</p>
      </div>
    );
  if (!state)
    return (
      <>
        <Auth
          onDone={() => {
            setLoading(true);
            void refresh();
          }}
        />
        {error && (
          <div className="connection-banner">
            <WifiOff size={18} />
            {error}
            <button onClick={() => void refresh()}>Tentar novamente</button>
          </div>
        )}
      </>
    );
  async function saveEditor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editor) return;
    setBusy(true);
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await act(
        "/" + editor.type + (editor.item ? "/" + editor.item.id : ""),
        {
          ...d,
          ...(editor.item ? { version: editor.item.version } : {}),
          ...(editor.type === "contacts" ? { notify: d.notify === "on" } : {}),
        },
        editor.item ? "PUT" : "POST",
      );
      say(editor.item ? "Alterações salvas." : "Cadastro realizado.");
      setEditor(null);
    } catch (e) {
      say((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm(status: string) {
    setBusy(true);
    try {
      const r = await act(
        "/confirmations",
        {
          medication_id: med.id,
          status,
          day: state!.day,
          expected_version: med.confirmed_at || null,
          minutes: 15,
          source: isWatch ? "watch" : "web",
        },
        "POST",
        `${med.name} · ${{ taken: "Tomado", not_taken: "Não tomei", snoozed: "Adiado" }[status]}`,
      );
      say(
        r.queued
          ? "Ação guardada neste aparelho. Ainda não foi sincronizada."
          : status === "taken"
            ? "Confirmação registrada. Que bom cuidar de você!"
            : status === "snoozed"
              ? "Lembrete adiado em 15 minutos."
              : "Registrado como “Não tomei”.",
      );
      setMed(null);
    } catch (e) {
      say((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const unread = state.notifications?.filter((n) => !n.is_read).length || 0;
  return (
    <Context.Provider value={context!}>
      {isWatch ? (
        <WatchExperience />
      ) : (
        <div className="app-shell">
          <a className="skip-link" href="#main">
            Pular para o conteúdo
          </a>
          <aside className={"sidebar " + (menu ? "mobile-open" : "")}>
            <button
              className="sidebar-brand"
              onClick={() => setPage("home")}
              aria-label="Cuidali — início"
            >
              <Brand />
            </button>
            <div className="sidebar-label">SEU ESPAÇO DE CUIDADO</div>
            <nav aria-label="Navegação principal">
              {navItems.map(([id, title, Icon]) => (
                <button
                  key={id}
                  className={"nav-item " + (page === id ? "active" : "")}
                  onClick={() => setPage(id)}
                  aria-current={page === id ? "page" : undefined}
                >
                  <Icon size={21} />
                  <span>
                    {state.user.role === "caregiver" && id === "home"
                      ? "Visão do cuidado"
                      : title}
                  </span>
                  {page === id && <span className="nav-dot" />}
                </button>
              ))}
            </nav>
            <div className="sidebar-secondary">
              <button
                className={"nav-item " + (page === "watch" ? "active" : "")}
                onClick={() => setPage("watch")}
              >
                <WatchIcon size={21} />
                Meu relógio<span className="tiny-badge">NOVO</span>
              </button>
              <button
                className={"nav-item " + (page === "profile" ? "active" : "")}
                onClick={() => setPage("profile")}
              >
                <Settings size={21} />
                Perfil e ajustes
              </button>
            </div>
            <div className="sidebar-help">
              <span className="sidebar-help-icon">
                <HeartHandshake size={28} />
              </span>
              <strong>Cuidado que aproxima.</strong>
              <p>
                Você e sua rede de apoio,
                <br />
                sempre conectados.
              </p>
              <button onClick={() => setPage("assistant")}>
                Vamos conversar
                <ArrowRight size={15} />
              </button>
            </div>
            <button className="sidebar-sos" onClick={() => setPage("sos")}>
              <Heart size={20} />
              Preciso de ajuda<span>SOS</span>
            </button>
            <div className="sidebar-bottom">
              <span>Uma iniciativa</span>
              <strong>KANNALI CORP.</strong>
            </div>
            <button
              className="close-menu icon-button"
              onClick={() => setMenu(false)}
              aria-label="Fechar menu"
            >
              <X />
            </button>
          </aside>
          {menu && (
            <div className="sidebar-overlay" onClick={() => setMenu(false)} />
          )}
          <div className="main-shell">
            <header className="topbar">
              <div className="topbar-location">
                <button
                  className="icon-button mobile-menu"
                  onClick={() => setMenu(true)}
                  aria-label="Abrir menu"
                >
                  <Menu />
                </button>
                <HomeIcon size={17} />
                <span>Meu espaço</span>
                <span className="breadcrumb-slash">/</span>
                <strong>
                  {
                    (
                      {
                        home:
                          state.user.role === "caregiver"
                            ? "Visão do cuidado"
                            : "Meu dia",
                        medications: "Medicamentos",
                        appointments: "Consultas",
                        assistant: "Assistente",
                        pain: "Registro de dores",
                        sos: "Pedido de ajuda",
                        history: "Histórico",
                        watch: "Meu relógio",
                        profile: "Perfil e ajustes",
                      } as Record<Page, string>
                    )[page]
                  }
                </strong>
              </div>
              <div className="topbar-actions">
                <button
                  className="text-size"
                  onClick={() => setFontSize(!fontSize)}
                  aria-pressed={fontSize}
                  aria-label="Aumentar tamanho do texto"
                >
                  <span>A</span>A<span className="text-size-label">Texto</span>
                </button>
                <span className="topbar-separator" />
                <button
                  className="notification-button icon-button"
                  aria-label={`Notificações, ${unread} não lidas`}
                  onClick={() => {
                    setNotifs(true);
                    void act("/notifications/read").catch((e) =>
                      say(e.message),
                    );
                  }}
                >
                  <Bell size={21} />
                  {unread > 0 && <span />}
                </button>
                <button
                  className="user-button"
                  onClick={() => setPage("profile")}
                >
                  <span className="avatar">
                    {state.user.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <strong>
                      {state.user.name.split(" ").slice(0, 2).join(" ")}
                    </strong>
                    <small>
                      {state.user.role === "elder"
                        ? "Meu perfil"
                        : "Cuidador(a)"}
                    </small>
                  </div>
                  <ChevronDown size={15} />
                </button>
              </div>
            </header>
            {state.user.demo && (
              <div className="demo-strip">
                <span>
                  <span className="demo-dot" /> Você está explorando dados
                  fictícios.
                </span>
                <button
                  disabled={busy}
                  onClick={async () => {
                    if (pending.length) {
                      say(
                        "Sincronize as ações pendentes antes de trocar de perfil.",
                      );
                      return;
                    }
                    setBusy(true);
                    try {
                      await api("/auth/demo/switch", "POST", {
                        role:
                          state.user.role === "elder" ? "caregiver" : "elder",
                      });
                      patientRef.current = "";
                      await refresh();
                      setPage("home");
                    } catch (e) {
                      say((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Users size={14} />
                  {state.user.role === "elder"
                    ? "Ver como cuidador"
                    : "Ver como idoso"}
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
            {(!online || error || pending.length > 0) && (
              <div className="connection-banner" role="status">
                <WifiOff size={18} />
                <span>
                  {!online
                    ? "Sem conexão. SOS e registros ficam pendentes neste aparelho."
                    : error ||
                      `${pending.length} ação(ões) aguardando sincronização.`}
                </span>
                {pending.length > 0 && (
                  <button onClick={() => setQueueOpen(true)}>
                    Ver pendências
                  </button>
                )}
                {online && (
                  <button
                    onClick={() => {
                      void refresh();
                      void flush();
                    }}
                  >
                    Atualizar
                  </button>
                )}
              </div>
            )}
            <main
              id="main"
              className="main-content"
              ref={heading}
              tabIndex={-1}
            >
              {state.patients.length > 1 && (
                <label className="patient-switch">
                  Acompanhando
                  <select
                    value={state.patient?.id}
                    onChange={async (e) => {
                      patientRef.current = e.target.value;
                      await refresh();
                    }}
                  >
                    {state.patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!state.patient ? (
                <NoPatient reload={refresh} />
              ) : (
                <>
                  {page === "home" && <Home />}
                  {page === "medications" && <Medications />}
                  {page === "appointments" && <Appointments />}
                  {page === "assistant" && <Assistant />}
                  {page === "pain" && <PainScreen />}
                  {page === "sos" && <SOS />}
                  {page === "history" && <HistoryScreen />}
                  {page === "watch" && <WatchSettings />}
                  {page === "profile" && <Profile logout={logout} />}
                </>
              )}
              {!state.patient && (
                <button className="btn secondary" onClick={() => void logout()}>
                  <LogOut size={18} />
                  Sair da conta
                </button>
              )}
            </main>
            <footer className="main-footer">
              <span>
                <ShieldCheck size={14} /> Seu cuidado, com segurança e carinho.
              </span>
              <span>
                Cuidali <span className="footer-dot">·</span> Kannali Corp.
              </span>
            </footer>
          </div>
          <nav className="bottom-nav" aria-label="Navegação móvel">
            {(
              [
                ["home", "Início", HomeIcon],
                ["assistant", "Assistente", MessageCircle],
                ["sos", "SOS", TriangleAlert],
                ["profile", "Perfil", UserRound],
              ] as const
            ).map(([id, title, Icon]) => (
              <button
                key={id}
                className={
                  (page === id ? "active " : "") +
                  (id === "sos" ? "sos-nav" : "")
                }
                onClick={() => setPage(id)}
              >
                <Icon size={23} />
                {title}
              </button>
            ))}
          </nav>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={19} />
          <span>{toast}</span>
          <button aria-label="Fechar mensagem" onClick={() => setToast("")}>
            <X size={18} />
          </button>
        </div>
      )}
      {editor && (
        <Modal
          title={
            editor.item
              ? "Editar " +
                {
                  medications: "medicamento",
                  appointments: "consulta",
                  contacts: "contato",
                }[editor.type]
              : "Adicionar " +
                {
                  medications: "medicamento",
                  appointments: "consulta",
                  contacts: "contato",
                }[editor.type]
          }
          close={() => !busy && setEditor(null)}
        >
          <form className="form-stack" onSubmit={saveEditor}>
            {editor.type === "medications" ? (
              <>
                <label>
                  Nome do medicamento
                  <input
                    name="name"
                    required
                    maxLength={200}
                    defaultValue={editor.item?.name}
                    placeholder="Ex.: Losartana"
                  />
                </label>
                <div className="form-row">
                  <label>
                    Dosagem prescrita
                    <input
                      name="dosage"
                      required
                      maxLength={200}
                      defaultValue={editor.item?.dosage}
                      placeholder="Ex.: 50 mg"
                    />
                  </label>
                  <label>
                    Horário
                    <input
                      name="time"
                      type="time"
                      required
                      defaultValue={editor.item?.time || "08:00"}
                    />
                  </label>
                </div>
                <label>
                  Orientações da receita
                  <textarea
                    name="instructions"
                    maxLength={1000}
                    defaultValue={editor.item?.instructions}
                    placeholder="Inclua apenas as orientações do profissional de saúde."
                  />
                </label>
                <p className="info-note">
                  Cadastre um horário por lembrete. Não altere a receita sem
                  orientação profissional.
                </p>
              </>
            ) : editor.type === "appointments" ? (
              <>
                <label>
                  Nome do profissional
                  <input
                    name="doctor"
                    required
                    maxLength={200}
                    defaultValue={editor.item?.doctor}
                    placeholder="Ex.: Dra. Ana Souza"
                  />
                </label>
                <label>
                  Especialidade
                  <input
                    name="specialty"
                    required
                    maxLength={200}
                    defaultValue={editor.item?.specialty}
                    placeholder="Ex.: Cardiologia"
                  />
                </label>
                <div className="form-row">
                  <label>
                    Data
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={editor.item?.date || state.day}
                    />
                  </label>
                  <label>
                    Horário
                    <input
                      name="time"
                      type="time"
                      required
                      defaultValue={editor.item?.time || "14:00"}
                    />
                  </label>
                </div>
                <label>
                  Clínica e endereço
                  <input
                    name="location"
                    required
                    maxLength={200}
                    defaultValue={editor.item?.location}
                  />
                </label>
                <label>
                  Observações
                  <textarea
                    name="notes"
                    maxLength={1000}
                    defaultValue={editor.item?.notes}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Nome do contato
                  <input
                    name="name"
                    required
                    maxLength={200}
                    defaultValue={editor.item?.name}
                  />
                </label>
                <label>
                  Telefone com DDD
                  <input
                    name="phone"
                    type="tel"
                    pattern="[+0-9 ()\-]{10,22}"
                    required
                    defaultValue={editor.item?.phone}
                    placeholder="(11) 99999-9999"
                  />
                </label>
                <label>
                  Vínculo
                  <input
                    name="relationship"
                    required
                    maxLength={200}
                    defaultValue={editor.item?.relationship}
                    placeholder="Ex.: filho(a)"
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="notify"
                    defaultChecked={editor.item ? !!editor.item.notify : true}
                  />
                  Desejo receber avisos quando a integração externa estiver
                  disponível.
                </label>
                <p className="info-note">
                  O telefone é usado para abrir o discador. Notificações
                  externas ainda não estão configuradas.
                </p>
              </>
            )}
            <button className="btn primary wide" disabled={busy}>
              {busy ? <Busy /> : <Check size={18} />}Salvar{" "}
              {editor.item ? "alterações" : "cadastro"}
            </button>
          </form>
        </Modal>
      )}
      {med && (
        <Modal title="Hora do remédio" close={() => !busy && setMed(null)}>
          <div className="med-reminder">
            <span className="big-pill">
              <Pill size={52} />
            </span>
            <h3>
              {med.name} <span>{med.dosage}</span>
            </h3>
            <p className="reminder-time">{med.time}</p>
            {med.instructions && <p>{med.instructions}</p>}
            <p className="info-note">
              Confirme apenas se você tomou a dose de hoje. O registro será
              compartilhado com seus cuidadores autorizados.
            </p>
          </div>
          <div className="form-stack">
            <button
              className="btn success wide"
              disabled={busy}
              onClick={() => void confirm("taken")}
            >
              <Check size={20} />
              Sim, já tomei
            </button>
            <button
              className="btn secondary wide"
              disabled={busy}
              onClick={() => void confirm("not_taken")}
            >
              Ainda não tomei
            </button>
            <button
              className="btn ghost wide"
              disabled={busy}
              onClick={() => void confirm("snoozed")}
            >
              <RefreshCw size={18} />
              Lembrar em 15 minutos
            </button>
          </div>
        </Modal>
      )}
      {notifs && (
        <Modal title="Suas notificações" close={() => setNotifs(false)}>
          {state.notifications.length ? (
            state.notifications.map((n) => (
              <div className="notification-item" key={n.id}>
                <span
                  className={
                    "feature-icon " + (n.kind === "sos" ? "pink" : "blue")
                  }
                >
                  {n.kind === "sos" ? <TriangleAlert /> : <Bell />}
                </span>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <small>
                    {stampLabel(n.created_at)} · Aviso interno disponível
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">
              <Bell />
              <h3>Tudo tranquilo por aqui</h3>
              <p>Seus avisos aparecerão neste espaço.</p>
            </div>
          )}
          <p className="info-note">
            Os avisos ficam disponíveis para as contas autorizadas no Cuidali.
            Isso não confirma uma entrega por push ou SMS.
          </p>
        </Modal>
      )}
      {queueOpen && (
        <Modal title="Ações pendentes" close={() => setQueueOpen(false)}>
          <p>
            As ações abaixo ainda não foram confirmadas pelo servidor. Um SOS
            pendente não foi transmitido.
          </p>
          {pending.map((q) => (
            <div className="pending-item" key={q.id}>
              <strong>{q.label}</strong>
              <p>{q.error || "Aguardando conexão e sincronização."}</p>
              {q.error && (
                <p className="info-note">
                  Confira os dados atuais antes de refazer esta ação.
                </p>
              )}
              <button
                className="btn secondary"
                onClick={async () => {
                  await outbox.remove(q.id);
                  await updatePending();
                }}
              >
                Descartar ação
              </button>
            </div>
          ))}
          <button
            className="btn primary wide"
            onClick={() => void flush()}
            disabled={!online}
          >
            Tentar sincronizar
          </button>
        </Modal>
      )}
    </Context.Provider>
  );
}
function NoPatient({ reload }: { reload: () => Promise<void> }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="no-patient panel">
      <span className="feature-icon blue">
        <Users />
      </span>
      <p className="eyebrow">CUIDAR COMEÇA COM UMA CONEXÃO</p>
      <h1>Vamos formar sua rede de cuidado?</h1>
      <p>
        Peça ao idoso para abrir{" "}
        <strong>Perfil e ajustes → Convidar cuidador</strong>. Ele receberá um
        código de autorização válido por 10 minutos.
      </p>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/links", "POST", { code });
            await reload();
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Código de autorização
          <input
            required
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            placeholder="8 dígitos"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        {err && (
          <p role="alert" className="form-error">
            {err}
          </p>
        )}
        <button className="btn primary" disabled={busy}>
          {busy ? <Busy /> : <HeartHandshake size={20} />}Conectar ao idoso
        </button>
      </form>
    </div>
  );
}
