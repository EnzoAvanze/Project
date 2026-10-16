import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  Edit3,
  Heart,
  HeartHandshake,
  History,
  Link2,
  MapPin,
  MessageCircle,
  Mic,
  MicOff,
  MoreHorizontal,
  Phone,
  Pill,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  UserRound,
  Users,
  Volume2,
  Watch,
  Wifi,
} from "lucide-react";
import { api, outbox } from "./api";
import { useApp } from "./context";
import {
  Brand,
  Busy,
  Empty,
  Modal,
  SectionTitle,
  Status,
  TextLink,
  dateLabel,
  stampLabel,
} from "./components";
import type { Appointment, Medication, Page } from "./types";
export function Home() {
  const { state, go, confirmMedication } = useApp();
  const [filter, setFilter] = useState("all");
  const caregiver = state.user.role === "caregiver";
  const taken = state.medications.filter((m) => m.status === "taken").length;
  const next = state.appointments.find((a) => a.date >= state.day);
  const reminders = [
    ...state.medications.map((m) => ({
      ...m,
      type: "medication",
      title: m.name + " " + m.dosage,
    })),
    ...state.appointments
      .filter((a) => a.date === state.day)
      .map((a) => ({ ...a, type: "appointment", title: a.doctor })),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const date = dateLabel(state.day, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const first = state.patient!.name.split(" ")[0];
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <span className="blue-dot" />
            {caregiver
              ? "CUIDAR É ESTAR PRESENTE"
              : "UM NOVO DIA PARA SE CUIDAR"}
          </p>
          <h1>
            {caregiver ? `Cuidando de ${first}` : `Olá, ${first}`}
            <span className="greeting-dot">.</span>
            <span className="greeting-sun" aria-hidden="true">
              ☀
            </span>
          </h1>
          <p>
            {caregiver
              ? "Acompanhe a rotina e esteja por perto, mesmo à distância."
              : "Que bom ter você por aqui. Vamos cuidar de hoje, juntos?"}
          </p>
        </div>
        <div className="date-chip">
          <CalendarDays size={18} />
          <span>{date}</span>
        </div>
      </div>
      <section className="care-banner">
        <div className="care-banner-copy">
          <span className="pill-label">
            <Heart size={14} /> SEU BEM-ESTAR IMPORTA
          </span>
          <h2>
            Pequenos cuidados.
            <br />
            Dias mais tranquilos.
          </h2>
          <p>
            Seus lembretes e as pessoas que cuidam de você,
            <br className="desktop-br" /> sempre ao seu alcance.
          </p>
          <button onClick={() => go("assistant")}>
            Converse com seu assistente
            <ArrowRight size={17} />
          </button>
        </div>
        <CareIllustration />
        <div className="banner-note">
          <span>
            <ShieldCheck size={16} />
          </span>
          <div>
            Um cuidado a mais.<strong>Todos os dias.</strong>
          </div>
        </div>
      </section>
      <div className="summary-grid">
        <button className="summary-card" onClick={() => go("medications")}>
          <span className="summary-icon blue">
            <Pill size={25} />
          </span>
          <div>
            <span>Medicamentos de hoje</span>
            <strong>
              {taken}
              <small> de {state.medications.length} confirmados</small>
            </strong>
          </div>
          <span
            className="mini-progress"
            style={{
              background: `conic-gradient(#2B6CB0 ${state.medications.length ? (taken / state.medications.length) * 100 : 0}%,#e8eff7 0)`,
            }}
          >
            <Check size={15} />
          </span>
        </button>
        <button className="summary-card" onClick={() => go("appointments")}>
          <span className="summary-icon gold">
            <CalendarDays size={24} />
          </span>
          <div>
            <span>Próxima consulta</span>
            <strong>
              {next
                ? dateLabel(next.date, { day: "2-digit", month: "short" })
                : "Sem consultas"}
              <small>{next ? " · " + next.time : " agendadas"}</small>
            </strong>
          </div>
          <ChevronRight size={18} />
        </button>
        <button className="summary-card" onClick={() => go("profile")}>
          <span className="summary-icon mint">
            <Users size={25} />
          </span>
          <div>
            <span>Sua rede de apoio</span>
            <strong>
              {state.caregivers.length}
              <small>
                {" "}
                {state.caregivers.length === 1
                  ? "cuidador conectado"
                  : "cuidadores conectados"}
              </small>
            </strong>
          </div>
          <span className="online-dot" />
        </button>
      </div>
      {caregiver && state.alerts.some((a) => a.status === "registered") && (
        <section className="alert-banner">
          <TriangleAlert size={28} />
          <div>
            <strong>Há um pedido SOS aguardando sua atenção.</strong>
            <p>Abra os alertas para visualizar e registrar seu recebimento.</p>
          </div>
          <button className="btn danger" onClick={() => go("sos")}>
            Ver pedido
          </button>
        </section>
      )}
      <div className="home-columns">
        <section className="panel reminders-panel">
          <SectionTitle
            title="Lembretes de hoje"
            action={
              <span className="count-label">{reminders.length} lembretes</span>
            }
          />
          <div className="tab-row" aria-label="Filtrar lembretes">
            {[
              ["all", "Todos"],
              ["medication", "Medicamentos"],
              ["appointment", "Consultas"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={filter === id ? "active" : ""}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="reminder-list">
            {reminders
              .filter((r) => filter === "all" || r.type === filter)
              .map((r: any) => (
                <button
                  className={
                    "reminder-row " +
                    (r.type === "appointment" ? "appointment-row" : "")
                  }
                  key={r.id}
                  onClick={() =>
                    r.type === "medication"
                      ? confirmMedication(r)
                      : go("appointments")
                  }
                >
                  <span className="reminder-time-col">
                    <strong>{r.time}</strong>
                    <span>
                      {r.type === "medication" ? "Medicamento" : "Consulta"}
                    </span>
                  </span>
                  <span
                    className={
                      "reminder-icon " +
                      (r.type === "appointment" ? "gold" : "blue")
                    }
                  >
                    {r.type === "medication" ? (
                      <Pill size={22} />
                    ) : (
                      <CalendarDays size={22} />
                    )}
                  </span>
                  <span className="reminder-detail">
                    <strong>{r.title}</strong>
                    <span>
                      {r.type === "medication"
                        ? r.instructions || "Conforme sua receita"
                        : r.specialty + " · " + r.location}
                    </span>
                  </span>
                  {r.type === "medication" ? (
                    <Status status={r.status} />
                  ) : (
                    <span className="status appointment-status">Agendada</span>
                  )}
                  <ChevronRight size={17} />
                </button>
              ))}
            {reminders.filter((r) => filter === "all" || r.type === filter)
              .length === 0 && (
              <Empty
                icon={<CalendarDays />}
                title="Seu dia está livre por aqui"
                text="Adicione medicamentos ou consultas para organizar sua rotina."
              />
            )}
          </div>
          <div className="panel-footnote">
            <ShieldCheck size={14} /> Um lembrete de cada vez. Cada cuidado faz
            a diferença.
          </div>
        </section>
        <aside className="home-right">
          <section className="wellbeing-card">
            <div className="wellbeing-top">
              <span className="feature-icon pink">
                <Heart size={23} />
              </span>
              <span className="eyebrow">ESTAMOS AQUI PARA VOCÊ</span>
            </div>
            <h2>
              Como você está
              <br />
              se sentindo hoje?
            </h2>
            <p>
              Conte se alguma coisa está incomodando. Sua rede de apoio pode
              acompanhar.
            </p>
            <button className="btn secondary wide" onClick={() => go("pain")}>
              Registrar uma dor
              <ArrowRight size={17} />
            </button>
          </section>
          <section className="next-appointment">
            <div className="section-title">
              <h3>Sua próxima consulta</h3>
              <CalendarDays size={19} />
            </div>
            {next ? (
              <>
                <span className="specialty-label">{next.specialty}</span>
                <h3>{next.doctor}</h3>
                <p>
                  <Clock3 size={15} />
                  {dateLabel(next.date)} · {next.time}
                </p>
                <p>
                  <MapPin size={15} />
                  {next.location}
                </p>
                <button onClick={() => go("appointments")}>
                  Ver detalhes
                  <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <p>Nenhuma consulta futura cadastrada.</p>
                <button onClick={() => go("appointments")}>
                  Organizar consultas
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </section>
        </aside>
      </div>
      <section className="support-strip">
        <span className="support-heart">
          <HeartHandshake size={31} />
        </span>
        <div>
          <strong>Você não está sozinho.</strong>
          <p>Quando precisar, sua rede de cuidado está a um toque.</p>
        </div>
        <button className="text-link" onClick={() => go("sos")}>
          <Phone size={17} />
          Preciso de ajuda
          <ArrowRight size={17} />
        </button>
      </section>
    </div>
  );
}
function CareIllustration() {
  return (
    <svg
      className="care-art"
      viewBox="0 0 420 300"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="228" cy="158" r="122" fill="#E3EDF7" />
      <circle cx="228" cy="158" r="96" stroke="#C4D8EB" strokeDasharray="4 8" />
      <path
        d="M122 262h221"
        stroke="#B1CCE4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M172 263v-56c0-37 20-59 48-59 29 0 50 23 50 59v56"
        fill="#3676B7"
      />
      <path d="M202 160l17 25 17-25" fill="#F7FAFC" />
      <path d="M206 138h27v26c0 16-27 16-27 0v-26Z" fill="#E6B69B" />
      <ellipse cx="219" cy="115" rx="35" ry="42" fill="#F1CFB7" />
      <path
        d="M183 119c-6-31 9-58 36-58 28 0 41 18 37 48-8-1-11-15-15-21-12 9-28 11-46 7l-7 27"
        fill="#E4E7EC"
      />
      <path
        d="M183 112c-6-24 4-49 28-52"
        stroke="#CFD5DD"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M200 115h14m12 0h14m-26 0h12"
        stroke="#53677B"
        strokeWidth="2.5"
      />
      <rect
        x="197"
        y="108"
        width="20"
        height="15"
        rx="5"
        stroke="#53677B"
        strokeWidth="2"
      />
      <rect
        x="224"
        y="108"
        width="20"
        height="15"
        rx="5"
        stroke="#53677B"
        strokeWidth="2"
      />
      <path
        d="M211 136c5 4 11 4 16 0"
        stroke="#AA7762"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M253 262v-44c0-43 17-67 46-67 30 0 48 24 48 67v44"
        fill="#E8B46C"
      />
      <path d="M285 143h25v24c0 15-25 15-25 0v-24Z" fill="#C58E70" />
      <ellipse cx="297" cy="121" rx="31" ry="37" fill="#E9B596" />
      <path
        d="M265 124c-10-28 4-52 30-52 28 0 41 21 34 48l-11-9-5-17c-13 15-26 9-38 14l-5 20"
        fill="#273E56"
      />
      <path
        d="M287 138c5 4 11 4 16 0"
        stroke="#A76D55"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M267 185c-9 13-25 29-46 30l-29-14"
        stroke="#E9B596"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        d="M176 186c5 13 17 29 38 31"
        stroke="#3676B7"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M182 196l24 14"
        stroke="#F1CFB7"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M286 262v-54m-79 54v-37"
        stroke="#1A365D"
        strokeOpacity=".15"
        strokeWidth="2"
      />
      <circle cx="123" cy="105" r="26" fill="white" />
      <path
        d="M123 118s-17-10-13-19c3-7 10-5 13 0 3-5 10-7 13 0 4 9-13 19-13 19Z"
        fill="#89B4D8"
      />
      <circle cx="345" cy="64" r="23" fill="#FFF" />
      <path
        d="M336 65l6 6 12-13"
        stroke="#57A485"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M110 214c-22-5-20-23-20-23s23 0 20 23Zm1 16c-2-26 18-31 18-31s9 23-18 31Z"
        fill="#9FBFAE"
      />
      <path d="M109 258v-46" stroke="#81A68F" strokeWidth="3" />
      <path d="M97 242h26l-4 20h-18l-4-20Z" fill="#C8DCD1" />
      <circle cx="345" cy="200" r="4" fill="#94B5D4" />
      <circle cx="162" cy="43" r="4" fill="#E2BD82" />
      <path
        d="M364 132h12m-6-6v12"
        stroke="#B7CBE0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Medications() {
  const { state, openEditor, confirmMedication, act, toast } = useApp();
  const [deleting, setDeleting] = useState<Medication | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="UM CUIDADO DE CADA VEZ"
        title="Meus medicamentos"
        text="Seus horários organizados. Sempre conforme sua receita."
        action={
          <button
            className="btn primary"
            onClick={() => openEditor("medications")}
          >
            <Plus size={19} />
            Adicionar medicamento
          </button>
        }
      />
      <div className="info-banner">
        <ShieldCheck size={22} />
        <p>
          Confirme somente a dose de hoje. A falta de confirmação não significa
          que você não tomou o medicamento.
        </p>
      </div>
      <div className="medication-grid">
        {state.medications.map((m) => (
          <article className="panel medication-card" key={m.id}>
            <div className="card-top">
              <span className="feature-icon blue">
                <Pill />
              </span>
              <Status status={m.status} />
            </div>
            <h2>{m.name}</h2>
            <p className="med-dosage">{m.dosage}</p>
            <div className="med-time">
              <Clock3 size={19} />
              <strong>{m.time}</strong>
              <span>todos os dias</span>
            </div>
            <p className="med-instructions">
              {m.instructions ||
                "Siga as orientações do seu profissional de saúde."}
            </p>
            {m.status === "snoozed" && m.snooze_until && (
              <p className="info-note">
                Novo lembrete: {stampLabel(m.snooze_until)}
              </p>
            )}
            <button
              className={
                "btn wide " + (m.status === "taken" ? "secondary" : "primary")
              }
              onClick={() => confirmMedication(m)}
            >
              {m.status === "taken" ? (
                <>
                  <Check size={18} />
                  Revisar confirmação
                </>
              ) : (
                <>
                  Registrar dose de hoje
                  <ArrowRight size={17} />
                </>
              )}
            </button>
            <div className="card-tools">
              <button onClick={() => openEditor("medications", m)}>
                <Edit3 size={16} />
                Editar
              </button>
              <button onClick={() => setDeleting(m)}>
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>
      {!state.medications.length && (
        <div className="panel">
          <Empty
            icon={<Pill size={34} />}
            title="Vamos organizar seus remédios?"
            text="Cadastre os medicamentos e horários da sua receita."
            action={
              <button
                className="btn primary"
                onClick={() => openEditor("medications")}
              >
                <Plus size={18} />
                Adicionar medicamento
              </button>
            }
          />
        </div>
      )}
      {deleting && (
        <Modal title="Excluir medicamento?" close={() => setDeleting(null)}>
          <p>
            O lembrete de <strong>{deleting.name}</strong> e seu histórico de
            confirmações serão excluídos. Esta ação não altera sua receita
            médica.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setDeleting(null)}>
              Manter medicamento
            </button>
            <button
              className="btn danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await act(
                    "/medications/" + deleting.id,
                    { version: deleting.version },
                    "DELETE",
                  );
                  setDeleting(null);
                  toast("Medicamento excluído.");
                } catch (e) {
                  toast((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sim, excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function Appointments() {
  const { state, openEditor, act, toast } = useApp();
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const [past, setPast] = useState(false);
  const list = state.appointments.filter((a) =>
    past ? a.date < state.day : a.date >= state.day,
  );
  function calendar(a: Appointment) {
    const esc = (s: string) =>
      s
        .replaceAll("\\", "\\\\")
        .replaceAll("\n", "\\n")
        .replaceAll(",", "\\,")
        .replaceAll(";", "\\;");
    const date =
      a.date.replaceAll("-", "") + "T" + a.time.replace(":", "") + "00";
    const blob = new Blob(
      [
        `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Kannali//Cuidali//PT\r\nBEGIN:VEVENT\r\nUID:${a.id}@cuidali\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z\r\nDTSTART:${date}\r\nDURATION:PT1H\r\nSUMMARY:${esc(a.doctor + " · " + a.specialty)}\r\nLOCATION:${esc(a.location)}\r\nDESCRIPTION:${esc(a.notes)}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`,
      ],
      { type: "text/calendar" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "consulta-cuidali.ics";
    link.click();
    URL.revokeObjectURL(url);
    toast(
      "Arquivo de agenda baixado. Abra-o para adicionar ao seu calendário.",
    );
  }
  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="TEMPO PARA CUIDAR DE VOCÊ"
        title="Minhas consultas"
        text="Tudo preparado para o seu próximo cuidado."
        action={
          <button
            className="btn primary"
            onClick={() => openEditor("appointments")}
          >
            <Plus size={19} />
            Agendar consulta
          </button>
        }
      />
      <div className="tab-row stand-alone">
        <button
          className={!past ? "active" : ""}
          onClick={() => setPast(false)}
        >
          Próximas consultas
        </button>
        <button className={past ? "active" : ""} onClick={() => setPast(true)}>
          Consultas anteriores
        </button>
      </div>
      <div className="appointment-grid">
        {list.map((a) => (
          <article key={a.id} className="panel appointment-card">
            <div className="appointment-card-head">
              <div className="calendar-block">
                <span>{dateLabel(a.date, { month: "short" })}</span>
                <strong>{a.date.slice(8)}</strong>
              </div>
              <span className="specialty-label">{a.specialty}</span>
            </div>
            <h2>{a.doctor}</h2>
            <p>
              <Clock3 size={18} />
              {dateLabel(a.date, { weekday: "long" })} · {a.time}
            </p>
            <p>
              <MapPin size={18} />
              {a.location}
            </p>
            <button className="btn secondary wide" onClick={() => setDetail(a)}>
              Ver detalhes
              <ArrowRight size={17} />
            </button>
            <div className="card-tools">
              <button onClick={() => openEditor("appointments", a)}>
                <Edit3 size={16} />
                Editar
              </button>
              <button onClick={() => setDeleting(a)}>
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>
      {!list.length && (
        <div className="panel">
          <Empty
            icon={<CalendarDays size={34} />}
            title={past ? "Nenhuma consulta anterior" : "Sua agenda está livre"}
            text="As consultas cadastradas aparecem aqui, com data, horário e local."
            action={
              !past && (
                <button
                  className="btn primary"
                  onClick={() => openEditor("appointments")}
                >
                  Adicionar consulta
                </button>
              )
            }
          />
        </div>
      )}
      {detail && (
        <Modal title="Sua consulta" close={() => setDetail(null)}>
          <div className="consult-detail">
            <span className="feature-icon gold">
              <CalendarDays />
            </span>
            <h3>{detail.doctor}</h3>
            <span className="specialty-label">{detail.specialty}</span>
            <p>
              <CalendarDays size={18} />
              {dateLabel(detail.date)} · {detail.time}
            </p>
            <p>
              <MapPin size={18} />
              {detail.location}
            </p>
            {detail.notes && <p className="info-note">{detail.notes}</p>}
            <button
              className="btn primary wide"
              onClick={() => calendar(detail)}
            >
              <Download size={18} />
              Adicionar à agenda
            </button>
            <p className="fine-print">
              Baixa um arquivo .ics para importar no calendário do dispositivo.
              Confira o fuso horário ao importar.
            </p>
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal title="Excluir consulta?" close={() => setDeleting(null)}>
          <p>
            Deseja excluir a consulta com <strong>{deleting.doctor}</strong>, em{" "}
            {dateLabel(deleting.date)}? O compromisso no calendário do seu
            dispositivo não será removido automaticamente.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setDeleting(null)}>
              Manter consulta
            </button>
            <button
              className="btn danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await act(
                    "/appointments/" + deleting.id,
                    { version: deleting.version },
                    "DELETE",
                  );
                  setDeleting(null);
                  toast("Consulta excluída.");
                } catch (e) {
                  toast((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sim, excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function Assistant() {
  const { state, act, go, toast } = useApp();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<
    { role: string; text: string; route?: Page | null }[]
  >(() =>
    state.interactions.flatMap((i) => [
      { role: "user", text: i.question },
      { role: "assistant", text: i.answer },
    ]),
  );
  const [listening, setListening] = useState(false);
  const [canVoice] = useState(
    () =>
      !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      ),
  );
  const recognition = useRef<any>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);
  useEffect(
    () => () => {
      recognition.current?.abort();
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    },
    [],
  );
  async function send(text: string) {
    if (!text.trim() || busy) return;
    setMessage("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text }]);
    try {
      const r = await act("/assistant", { message: text });
      setMessages((m) => [
        ...m,
        { role: "assistant", text: r.answer, route: r.route },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: (e as Error).message },
      ]);
    } finally {
      setBusy(false);
    }
  }
  function listen() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast(
        "Seu navegador não oferece reconhecimento de voz. Você pode escrever a mensagem.",
      );
      return;
    }
    const r = new SR();
    recognition.current = r;
    r.lang = "pt-BR";
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      toast(
        "Não foi possível usar o microfone. Confira a permissão ou digite sua mensagem.",
      );
    };
    r.onresult = (e: any) => setMessage(e.results[0][0].transcript);
    r.start();
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      toast("Leitura em voz alta indisponível neste navegador.");
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    speechSynthesis.speak(u);
  }
  return (
    <div className="page-enter assistant-page">
      <PageHeading
        eyebrow="UMA CONVERSA QUE ACOLHE"
        title="Seu assistente"
        text="Ajuda simples para organizar o seu dia."
      />
      <section className="panel chat-panel">
        <div className="chat-header">
          <span className="assistant-avatar">
            <Sparkles size={24} />
          </span>
          <div>
            <strong>Assistente Cuidali</strong>
            <span>
              <span className="online-dot" />
              Assistente de rotina · respostas por regras
            </span>
          </div>
          <span className="chat-privacy">
            <ShieldCheck size={16} />
            Conversa protegida
          </span>
        </div>
        <div
          className="chat-messages"
          aria-live="polite"
          aria-relevant="additions"
        >
          <div className="assistant-welcome">
            <span className="assistant-avatar large">
              <Sparkles size={32} />
            </span>
            <h2>
              Olá, {state.user.name.split(" ")[0]}!<br />
              Como posso te ajudar hoje?
            </h2>
            <p>
              Seus lembretes, suas consultas e sua rede de apoio.
              <br />
              Vamos cuidar de uma coisa de cada vez.
            </p>
          </div>
          <div className="quick-prompts">
            {[
              "Meus remédios",
              "Que dia é hoje?",
              "Minhas consultas",
              "Quero registrar uma dor",
              "Preciso de ajuda",
            ].map((q) => (
              <button key={q} onClick={() => void send(q)} disabled={busy}>
                {q}
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
          {messages.map((m, i) => (
            <div key={i} className={"chat-message " + m.role}>
              {m.role === "assistant" && (
                <span className="assistant-avatar">
                  <Sparkles size={17} />
                </span>
              )}
              <div>
                <p>{m.text}</p>
                {m.role === "assistant" && (
                  <div className="chat-message-actions">
                    {m.route && (
                      <button onClick={() => go(m.route!)}>
                        Abrir{" "}
                        {
                          (
                            {
                              medications: "medicamentos",
                              appointments: "consultas",
                              pain: "registro de dor",
                              sos: "SOS",
                            } as any
                          )[m.route]
                        }
                        <ArrowRight size={15} />
                      </button>
                    )}
                    <button
                      aria-label="Ouvir resposta"
                      onClick={() => speak(m.text)}
                    >
                      <Volume2 size={16} />
                      Ouvir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="chat-loading">
              <Busy />
              Um momento, estou conferindo…
            </div>
          )}
          <div ref={end} />
        </div>
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send(message);
          }}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            placeholder="Escreva como posso ajudar…"
            aria-label="Sua mensagem"
            required
          />
          <button
            type="button"
            className={"icon-button " + (listening ? "listening" : "")}
            disabled={!canVoice}
            onClick={listen}
            aria-label={listening ? "Parar gravação" : "Falar mensagem"}
          >
            {listening ? <MicOff /> : <Mic />}
          </button>
          <button
            className="send-button"
            disabled={busy || !message.trim()}
            aria-label="Enviar mensagem"
          >
            <Send size={21} />
          </button>
        </form>
        <p className="chat-disclaimer">
          Seu assistente ajuda com a rotina. Não faz diagnósticos nem substitui
          um profissional de saúde.
        </p>
      </section>
    </div>
  );
}
export function PainScreen() {
  const { state, act, toast, go } = useApp();
  const [step, setStep] = useState(1);
  const [side, setSide] = useState<"Frente" | "Costas">("Frente");
  const [region, setRegion] = useState("");
  const [kind, setKind] = useState("Pontada");
  const [intensity, setIntensity] = useState("Leve");
  const [since, setSince] = useState("Hoje");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [queued, setQueued] = useState(false);
  async function send() {
    setBusy(true);
    try {
      const r = await act(
        "/pain",
        { region, side, kind, intensity, since, notes, source: "web" },
        "POST",
        `Registro de dor · ${region}`,
      );
      setQueued(!!r.queued);
      setStep(3);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="SUA SAÚDE MERECE ATENÇÃO"
        title="Registro de dores"
        text="Conte como você se sente. Sua rede de apoio pode acompanhar."
      />
      {step < 3 && (
        <div className="steps">
          <span className={step === 1 ? "active" : "complete"}>
            1<span>Onde dói</span>
          </span>
          <i />
          <span className={step === 2 ? "active" : ""}>
            2<span>Como é a dor</span>
          </span>
        </div>
      )}
      <section className="panel pain-panel">
        {step === 1 ? (
          <>
            <div className="pain-intro">
              <h2>Onde está incomodando?</h2>
              <p>Toque em uma região do corpo ou escolha na lista.</p>
              <div className="segmented">
                <button
                  className={side === "Frente" ? "active" : ""}
                  onClick={() => {
                    setSide("Frente");
                    setRegion("");
                  }}
                >
                  Frente
                </button>
                <button
                  className={side === "Costas" ? "active" : ""}
                  onClick={() => {
                    setSide("Costas");
                    setRegion("");
                  }}
                >
                  Costas
                </button>
              </div>
            </div>
            <div className="body-map-layout">
              <BodyMap side={side} region={region} setRegion={setRegion} />
              <div className="body-regions">
                <label>
                  Região do corpo
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    <option value="">Escolha uma região</option>
                    {regions(side).map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <div className="selected-region">
                  <span className="feature-icon blue">
                    <MapPin />
                  </span>
                  <div>
                    <small>REGIÃO SELECIONADA</small>
                    <strong>{region || "Toque para escolher"}</strong>
                  </div>
                </div>
                <p className="info-note">
                  Escolha a região que mais se aproxima do local. Você pode
                  explicar melhor na próxima etapa.
                </p>
                <button
                  className="btn primary wide"
                  disabled={!region}
                  onClick={() => setStep(2)}
                >
                  Continuar
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </>
        ) : step === 2 ? (
          <div className="pain-description">
            <button className="back-link" onClick={() => setStep(1)}>
              <ArrowLeft size={17} />
              Mudar região
            </button>
            <h2>Conte mais sobre a dor</h2>
            <div className="location-banner">
              <MapPin size={18} />
              {region} · {side}
            </div>
            <Choice
              label="Como é a dor?"
              options={[
                "Pontada",
                "Queimação",
                "Latejante",
                "Aperto ou peso",
                "Formigamento",
                "Constante",
              ]}
              value={kind}
              set={setKind}
            />
            <Choice
              label="Qual é a intensidade?"
              options={["Leve", "Média", "Forte", "Muito forte"]}
              value={intensity}
              set={setIntensity}
              intensity
            />
            <Choice
              label="Desde quando?"
              options={["Hoje", "Há alguns dias", "Há mais de uma semana"]}
              value={since}
              set={setSince}
            />
            <label>
              Quer contar mais alguma coisa?{" "}
              <span className="optional">(opcional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                placeholder="Descreva o que está sentindo…"
              />
            </label>
            {["Forte", "Muito forte"].includes(intensity) && (
              <div className="urgent-note">
                <TriangleAlert size={20} />
                <p>
                  Se a dor for intensa, repentina, vier com falta de ar ou dor
                  no peito, procure atendimento urgente. No Brasil, ligue 192.
                </p>
              </div>
            )}
            <button
              className="btn primary wide"
              disabled={busy}
              onClick={() => void send()}
            >
              {busy ? <Busy /> : <Send size={18} />}Enviar para o cuidador
            </button>
            <p className="fine-print">
              O relato ficará disponível para seus cuidadores autorizados. Não
              há envio externo de push ou SMS nesta versão.
            </p>
          </div>
        ) : (
          <div className="success-state">
            <span
              className={"success-circle " + (queued ? "pending-circle" : "")}
            >
              <CheckCheck size={40} />
            </span>
            <h2>
              {queued
                ? "Relato salvo neste dispositivo"
                : "Seu relato foi registrado"}
            </h2>
            <p>
              {queued
                ? "Ainda não foi transmitido. A sincronização será tentada quando a conexão voltar."
                : "Seus cuidadores autorizados podem consultar este registro no Cuidali. Nenhuma notificação externa foi enviada."}
            </p>
            <p className="info-note">
              {region} · {intensity} · {since}
            </p>
            <button className="btn primary" onClick={() => go("home")}>
              Voltar para meu dia
              <ArrowRight size={18} />
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                setStep(1);
                setRegion("");
                setNotes("");
              }}
            >
              Registrar outra dor
            </button>
          </div>
        )}
      </section>
      {step === 1 && state.pain.length > 0 && (
        <section className="panel recent-pain">
          <SectionTitle title="Seus últimos relatos" />
          {state.pain.slice(0, 3).map((p) => (
            <div className="history-row" key={p.id}>
              <span className="feature-icon pink">
                <Activity />
              </span>
              <div>
                <strong>
                  {p.region} · {p.intensity}
                </strong>
                <p>
                  {p.kind} · {stampLabel(p.created_at)}
                </p>
              </div>
              <span className="status">Registrado</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
const regions = (side: string) => [
  "Cabeça",
  "Pescoço",
  "Ombro direito",
  "Ombro esquerdo",
  side === "Frente" ? "Peito" : "Costas superiores",
  side === "Frente" ? "Abdômen" : "Lombar",
  "Braço direito",
  "Braço esquerdo",
  "Mão direita",
  "Mão esquerda",
  "Quadril",
  "Joelho direito",
  "Joelho esquerdo",
  "Perna direita",
  "Perna esquerda",
  "Pé direito",
  "Pé esquerdo",
];
export function BodyMap({
  side,
  region,
  setRegion,
}: {
  side: string;
  region: string;
  setRegion: (s: string) => void;
}) {
  const front = side === "Frente";
  const right = front ? "direito" : "esquerdo",
    left = front ? "esquerdo" : "direito";
  const shapes: [string, string, any][] = [
    ["Cabeça", "ellipse", { cx: 120, cy: 39, rx: 22, ry: 27 }],
    ["Pescoço", "rect", { x: 109, y: 70, width: 22, height: 14, rx: 7 }],
    [`Ombro ${right}`, "ellipse", { cx: 85, cy: 94, rx: 17, ry: 13 }],
    [`Ombro ${left}`, "ellipse", { cx: 155, cy: 94, rx: 17, ry: 13 }],
    [
      front ? "Peito" : "Costas superiores",
      "rect",
      { x: 96, y: 88, width: 48, height: 37, rx: 13 },
    ],
    [
      front ? "Abdômen" : "Lombar",
      "rect",
      { x: 96, y: 131, width: 48, height: 41, rx: 13 },
    ],
    [`Braço ${right}`, "rect", { x: 66, y: 113, width: 17, height: 69, rx: 8 }],
    [`Braço ${left}`, "rect", { x: 157, y: 113, width: 17, height: 69, rx: 8 }],
    [`Mão ${right}`, "ellipse", { cx: 72, cy: 199, rx: 11, ry: 15 }],
    [`Mão ${left}`, "ellipse", { cx: 168, cy: 199, rx: 11, ry: 15 }],
    ["Quadril", "rect", { x: 94, y: 178, width: 52, height: 30, rx: 13 }],
    [
      `Perna ${right}`,
      "rect",
      { x: 94, y: 214, width: 22, height: 58, rx: 11 },
    ],
    [
      `Perna ${left}`,
      "rect",
      { x: 124, y: 214, width: 22, height: 58, rx: 11 },
    ],
    [`Joelho ${right}`, "ellipse", { cx: 105, cy: 285, rx: 12, ry: 11 }],
    [`Joelho ${left}`, "ellipse", { cx: 135, cy: 285, rx: 12, ry: 11 }],
    [
      `Perna ${right}`,
      "rect",
      { x: 95, y: 302, width: 20, height: 51, rx: 10 },
    ],
    [
      `Perna ${left}`,
      "rect",
      { x: 125, y: 302, width: 20, height: 51, rx: 10 },
    ],
    [`Pé ${right}`, "ellipse", { cx: 101, cy: 368, rx: 17, ry: 9 }],
    [`Pé ${left}`, "ellipse", { cx: 139, cy: 368, rx: 17, ry: 9 }],
  ];
  return (
    <svg
      className="body-map"
      viewBox="0 0 240 400"
      role="img"
      aria-label={`Mapa corporal: ${side}. Use também a lista de regiões ao lado.`}
    >
      {shapes.map(([name, tag, props], i) => {
        const Tag = tag as any;
        return (
          <g
            key={i}
            onClick={() => setRegion(name)}
            className={region === name ? "selected" : ""}
          >
            <title>{name}</title>
            <Tag {...props} />
          </g>
        );
      })}
    </svg>
  );
}
function Choice({
  label,
  options,
  value,
  set,
  intensity = false,
}: {
  label: string;
  options: string[];
  value: string;
  set: (s: string) => void;
  intensity?: boolean;
}) {
  return (
    <fieldset className="choice-field">
      <legend>{label}</legend>
      <div
        className={"choice-options " + (intensity ? "intensity-options" : "")}
      >
        {options.map((o, i) => (
          <button
            type="button"
            key={o}
            className={value === o ? "selected" : ""}
            aria-pressed={value === o}
            onClick={() => set(o)}
          >
            {intensity && (
              <span aria-hidden="true" className={"intensity-face face-" + i}>
                {["☺", "◡", "◠", "☹"][i]}
              </span>
            )}
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
export function SOS() {
  const { state, act, toast } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<"registered" | "queued" | null>(null);
  const [busy, setBusy] = useState(false);
  const contact = state.contacts[0];
  async function trigger() {
    setBusy(true);
    try {
      const r = await act("/sos", { source: "web" }, "POST", "Pedido SOS");
      setResult(r.queued ? "queued" : "registered");
      setConfirm(false);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="SUA REDE DE APOIO ESTÁ POR PERTO"
        title="Precisa de ajuda?"
        text="Um caminho simples para pedir o apoio de quem cuida de você."
      />
      <div className="sos-layout">
        <section className="panel sos-panel">
          <span className="eyebrow">PEDIDO DE AJUDA</span>
          <h2>
            {result === "registered"
              ? "Seu pedido foi registrado"
              : result === "queued"
                ? "Seu pedido ainda está pendente"
                : "Estamos aqui com você."}
          </h2>
          <button
            className="sos-big"
            onClick={() => setConfirm(true)}
            aria-label="Pedir ajuda SOS — abrir confirmação"
          >
            <Phone size={47} strokeWidth={1.8} />
            <strong>SOS</strong>
            <span>Pedir ajuda</span>
          </button>
          {result ? (
            <div
              className={
                "sos-result " + (result === "queued" ? "is-pending" : "")
              }
            >
              <strong>
                {result === "queued"
                  ? "Sem confirmação de envio"
                  : "Disponível no painel do cuidador"}
              </strong>
              <p>
                {result === "queued"
                  ? "O pedido está apenas neste aparelho e não foi transmitido. Se precisar de ajuda agora, ligue diretamente."
                  : "O sistema registrou seu pedido. Não enviamos push ou SMS. Ligue para o contato se precisar de ajuda agora."}
              </p>
            </div>
          ) : (
            <p className="sos-instruction">
              Toque para solicitar ajuda.
              <br />
              Você poderá confirmar antes de registrar.
            </p>
          )}
          {contact ? (
            <a
              className="btn secondary"
              href={"tel:" + contact.phone.replace(/[^+\d]/g, "")}
            >
              <Phone size={19} />
              Ligar para {contact.name.split(" ")[0]}
            </a>
          ) : (
            <p className="info-note">
              Cadastre um contato em Perfil e ajustes para abrir uma ligação.
            </p>
          )}
          <p className="fine-print">
            Abrir o discador não confirma que a ligação foi realizada.
          </p>
        </section>
        <aside className="sos-aside">
          <section className="panel">
            <SectionTitle title="Seu contato de confiança" />
            {contact ? (
              <div className="trust-contact">
                <span className="avatar large">
                  {contact.name
                    .split(" ")
                    .slice(0, 2)
                    .map((x) => x[0])
                    .join("")}
                </span>
                <h3>{contact.name}</h3>
                <p>{contact.relationship}</p>
                <span>{contact.phone}</span>
              </div>
            ) : (
              <p>Nenhum contato cadastrado.</p>
            )}
          </section>
          <div className="emergency-info">
            <TriangleAlert size={24} />
            <h3>Em uma emergência médica</h3>
            <p>
              Procure o serviço público de emergência. O Cuidali não substitui o
              atendimento médico.
            </p>
            <a className="btn danger wide" href="tel:192">
              <Phone size={18} />
              SAMU · 192
            </a>
          </div>
        </aside>
      </div>
      {state.alerts.length > 0 && (
        <section className="panel recent-pain">
          <SectionTitle title="Histórico de pedidos" />
          {state.alerts.map((a) => (
            <div className="history-row" key={a.id}>
              <span className="feature-icon pink">
                <Phone />
              </span>
              <div>
                <strong>
                  Pedido SOS · {a.source === "watch" ? "Relógio" : "Aplicativo"}
                </strong>
                <p>
                  {stampLabel(a.created_at)} · {a.actor}
                </p>
                <small>
                  {a.status === "acknowledged"
                    ? "Visualizado pelo cuidador"
                    : "Registrado no servidor"}{" "}
                  · Sem push/SMS externo
                </small>
              </div>
              <Status status={a.status} />
              {state.user.role === "caregiver" && a.status === "registered" && (
                <button
                  className="btn secondary"
                  onClick={async () => {
                    try {
                      await act("/alerts/" + a.id + "/ack");
                      toast("Seu recebimento foi registrado.");
                    } catch (e) {
                      toast((e as Error).message);
                    }
                  }}
                >
                  Confirmar recebimento
                </button>
              )}
            </div>
          ))}
        </section>
      )}
      {confirm && (
        <Modal
          title="Confirmar pedido de ajuda?"
          close={() => !busy && setConfirm(false)}
        >
          <div className="confirm-sos">
            <span className="feature-icon pink">
              <Phone />
            </span>
            <p>
              Vamos registrar seu pedido no Cuidali para os cuidadores
              autorizados.{" "}
              <strong>Não há envio de push ou SMS configurado.</strong>
            </p>
            <p>
              Se estiver sem conexão, o pedido ficará pendente neste aparelho.
              Para falar com alguém agora, use o botão de ligação.
            </p>
            <button
              className="btn danger wide"
              disabled={busy}
              onClick={() => void trigger()}
            >
              {busy ? <Busy /> : <Phone size={19} />}Sim, preciso de ajuda
            </button>
            <button
              className="btn secondary wide"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function HistoryScreen() {
  const { state } = useApp();
  const [filter, setFilter] = useState("all");
  const events = state.events.filter(
    (e) => filter === "all" || e.type === filter,
  );
  const icons: Record<string, typeof Heart> = {
    confirmation: Pill,
    sos: Phone,
    pain: Activity,
    appointments: CalendarDays,
    link: Users,
  };
  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="CADA CUIDADO CONTA"
        title="Histórico de cuidado"
        text="Acompanhe os registros e as ações da sua rede de apoio."
      />
      <div className="tab-row stand-alone">
        {[
          ["all", "Tudo"],
          ["confirmation", "Medicamentos"],
          ["appointments", "Consultas"],
          ["pain", "Dores"],
          ["sos", "SOS"],
        ].map(([v, l]) => (
          <button
            className={filter === v ? "active" : ""}
            onClick={() => setFilter(v)}
            key={v}
          >
            {l}
          </button>
        ))}
      </div>
      <section className="panel history-panel">
        {events.length ? (
          events.map((e) => {
            const Icon = icons[e.type] || Heart;
            return (
              <div className="history-row" key={e.id}>
                <span
                  className={
                    "feature-icon " +
                    (e.type === "sos"
                      ? "pink"
                      : e.type === "appointments"
                        ? "gold"
                        : "blue")
                  }
                >
                  <Icon />
                </span>
                <div>
                  <strong>{e.title}</strong>
                  <p>{e.details}</p>
                </div>
                <time dateTime={e.created_at}>{stampLabel(e.created_at)}</time>
              </div>
            );
          })
        ) : (
          <Empty
            icon={<History size={32} />}
            title="Seu histórico começa aqui"
            text="As próximas ações ficarão registradas para você acompanhar."
          />
        )}
      </section>
      {state.pain.length > 0 && (
        <section className="panel recent-pain">
          <SectionTitle title="Relatos de dor" />
          {state.pain.map((p) => (
            <div className="pain-report" key={p.id}>
              <div>
                <strong>
                  {p.region} · {p.side}
                </strong>
                <span>{stampLabel(p.created_at)}</span>
              </div>
              <p>
                {p.kind} · Intensidade {p.intensity.toLowerCase()} · {p.since}
              </p>
              {p.notes && <p>{p.notes}</p>}
              <small>
                Disponível no Cuidali · Notificação externa não configurada
              </small>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
export function WatchSettings() {
  const { state, act, toast } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="SEU CUIDADO VAI COM VOCÊ"
        title="Meu relógio"
        text="Os lembretes e sua rede de apoio, também no pulso."
      />
      <div className="watch-settings-layout">
        <section className="panel watch-presentation">
          <div className="watch-mini">
            <div>
              <Heart size={30} />
              <strong>cuidali</strong>
              <span>
                Seu cuidado.
                <br />
                Sempre por perto.
              </span>
            </div>
          </div>
          <span className="pill-label">EXPERIÊNCIA COMPLEMENTAR</span>
          <h2>
            Pequeno no pulso.
            <br />
            Grande no cuidado.
          </h2>
          <p>
            Veja medicamentos, confirme doses, registre desconforto e peça ajuda
            em uma interface feita para telas pequenas.
          </p>
          <a
            className="btn primary"
            href="/relogio"
            target="_blank"
            rel="noreferrer"
          >
            Abrir experiência do relógio
            <ArrowRight size={18} />
          </a>
          <p className="fine-print">
            Protótipo web navegável. Não é um aplicativo nativo Wear OS ou
            watchOS.
          </p>
        </section>
        <div className="watch-settings-right">
          <section className="panel">
            <SectionTitle title="Como conectar" />
            <ol className="connect-steps">
              <li>
                <span>1</span>
                <div>
                  <strong>Abra a experiência do relógio</strong>
                  <p>
                    Use o botão ao lado, neste navegador ou em outro dispositivo
                    com acesso ao servidor.
                  </p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Entre com a mesma conta</strong>
                  <p>
                    Em outro dispositivo, faça login com sua conta. A
                    demonstração não cria uma senha reutilizável.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Ative a sincronização</strong>
                  <p>
                    As confirmações usam a mesma API. Ações offline ficam
                    pendentes até a conexão voltar.
                  </p>
                </div>
              </li>
            </ol>
            <button
              className="btn secondary wide"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await act("/devices", {
                    name: "Aplicativo neste navegador",
                    kind: "web",
                  });
                  toast("Este navegador foi registrado.");
                } catch (e) {
                  toast((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Link2 size={18} />
              Registrar este navegador
            </button>
          </section>
          <section className="panel">
            <SectionTitle title="Dispositivos registrados" />
            {state.devices.length ? (
              state.devices.map((d) => (
                <div className="device-row" key={d.id}>
                  <span className="feature-icon blue">
                    <Watch />
                  </span>
                  <div>
                    <strong>{d.name}</strong>
                    <p>Última sincronização: {stampLabel(d.last_sync)}</p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={"Remover " + d.name}
                    onClick={async () => {
                      try {
                        await act("/devices/" + d.id, {}, "DELETE");
                        toast(
                          "Registro de dispositivo removido. Isso não encerra sessões de outros dispositivos.",
                        );
                      } catch (e) {
                        toast((e as Error).message);
                      }
                    }}
                  >
                    <XIcon />
                  </button>
                </div>
              ))
            ) : (
              <p className="muted">Nenhum dispositivo registrado ainda.</p>
            )}
            <p className="info-note">
              Um registro recente indica comunicação com a API. Ele não comprova
              uma conexão Bluetooth nem entrega de notificação.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
function XIcon() {
  return <Trash2 size={18} />;
}
export function Profile({ logout }: { logout: () => Promise<void> }) {
  const { state, act, toast, refresh, openEditor } = useApp();
  const [invite, setInvite] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState(false);
  const [deletingContact, setDeletingContact] = useState<any>(null);
  const [revoke, setRevoke] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [privacy, setPrivacy] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const prefs = state.preferences;
  async function preference(key: string, value: boolean | number) {
    try {
      await act(
        "/preferences",
        {
          ...Object.fromEntries(
            Object.entries(prefs)
              .filter(([k]) => k !== "patient_id")
              .map(([k, v]) => [k, k === "grace_minutes" ? v : !!v]),
          ),
          [key]: value,
        },
        "PUT",
      );
      toast("Preferências salvas.");
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="DO SEU JEITO, COM SEGURANÇA"
        title="Perfil e ajustes"
        text="Suas informações e as pessoas que fazem parte do seu cuidado."
      />
      <div className="profile-grid">
        <section className="panel profile-card">
          <span className="avatar extra-large">
            {state.user.name
              .split(" ")
              .slice(0, 2)
              .map((x) => x[0])
              .join("")}
          </span>
          <h2>{state.user.name}</h2>
          <span className="specialty-label">
            {state.user.role === "elder" ? "Pessoa idosa" : "Cuidador(a)"}
          </span>
          <p>{state.user.demo ? "Conta de demonstração" : state.user.email}</p>
          <p>{state.user.phone}</p>
          {state.user.birth_date && (
            <p>
              {dateLabel(state.user.birth_date, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          <button className="btn secondary wide" onClick={() => void logout()}>
            Sair da conta
            <ArrowRight size={18} />
          </button>
        </section>
        <div className="profile-right">
          <section className="panel">
            <SectionTitle title="Sua rede de cuidado" />
            {state.caregivers.map((c) => (
              <div className="contact-row" key={c.id}>
                <span className="avatar">
                  {c.name
                    .split(" ")
                    .slice(0, 2)
                    .map((x) => x[0])
                    .join("")}
                </span>
                <div>
                  <strong>{c.name}</strong>
                  <p>Cuidador autorizado</p>
                </div>
                {(state.user.role === "elder" || c.id === state.user.id) && (
                  <button
                    className="icon-button"
                    aria-label={"Revogar acesso de " + c.name}
                    onClick={() => setRevoke(c)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            {!state.caregivers.length && (
              <p className="muted">
                Você ainda não tem cuidadores autorizados.
              </p>
            )}
            {state.user.role === "elder" ? (
              <>
                <button
                  className="btn secondary wide"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const r = await act("/invite");
                      setInvite(r.code);
                    } catch (e) {
                      toast((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Plus size={18} />
                  Convidar cuidador
                </button>
                {invite && (
                  <div className="invite-code">
                    <small>CÓDIGO VÁLIDO POR 10 MINUTOS · USO ÚNICO</small>
                    <strong>{invite}</strong>
                    <p>
                      Compartilhe apenas com quem você autoriza a acessar seus
                      dados de cuidado.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <form
                className="form-stack"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await api("/links", "POST", { code });
                    setCode("");
                    await refresh();
                    toast("Novo idoso vinculado.");
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
              >
                <label>
                  Adicionar outro idoso
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    placeholder="Código de autorização com 8 dígitos"
                    required
                  />
                </label>
                <button className="btn secondary">Conectar</button>
              </form>
            )}
          </section>
          <section className="panel">
            <SectionTitle
              title="Contatos de confiança"
              action={
                <button
                  className="icon-button"
                  aria-label="Adicionar contato"
                  onClick={() => openEditor("contacts")}
                >
                  <Plus size={21} />
                </button>
              }
            />
            {state.contacts.map((c) => (
              <div className="contact-row" key={c.id}>
                <span className="feature-icon gold">
                  <UserRound />
                </span>
                <div>
                  <strong>{c.name}</strong>
                  <p>
                    {c.relationship} · {c.phone}
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label={"Editar contato " + c.name}
                  onClick={() => openEditor("contacts", c)}
                >
                  <Edit3 size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={"Excluir contato " + c.name}
                  onClick={() => setDeletingContact(c)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            {!state.contacts.length && (
              <p className="muted">
                Adicione uma pessoa de confiança para ligar pelo SOS.
              </p>
            )}
            <p className="fine-print">
              Cadastrar um telefone não autoriza acesso aos seus dados.
            </p>
          </section>
          <section className="panel">
            <SectionTitle title="Lembretes e avisos" />
            <p className="muted">
              Avisos internos no Cuidali. Push, e-mail e SMS externos não estão
              configurados.
            </p>
            {[
              ["medication", "Lembretes e confirmações de medicamentos"],
              ["appointment", "Consultas próximas"],
              ["pain", "Novos relatos de dor"],
              ["sos", "Pedidos de ajuda SOS"],
              ["missing", "Medicamentos sem confirmação"],
            ].map(([k, l]) => (
              <label key={k} className="toggle-label">
                <span>{l}</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={!!(prefs as any)[k]}
                  onChange={(e) => void preference(k, e.target.checked)}
                />
              </label>
            ))}
            <label className="grace-label">
              Avisar sem confirmação após
              <select
                value={prefs.grace_minutes}
                onChange={(e) =>
                  void preference("grace_minutes", Number(e.target.value))
                }
              >
                {[5, 15, 30, 60, 120, 180].map((n) => (
                  <option key={n} value={n}>
                    {n} minutos
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn secondary wide"
              onClick={async () => {
                if (!("Notification" in window)) {
                  toast("Este navegador não oferece notificações.");
                  return;
                }
                try {
                  const permission = await Notification.requestPermission();
                  toast(
                    permission === "granted"
                      ? "Permissão concedida. Os lembretes podem aparecer enquanto o aplicativo estiver aberto."
                      : "Notificações não autorizadas. Os avisos continuam disponíveis no aplicativo.",
                  );
                } catch {
                  toast("Não foi possível solicitar a permissão.");
                }
              }}
            >
              <Bell size={18} />
              Permitir avisos neste navegador
            </button>
            <p className="fine-print">
              Lembretes em segundo plano exigem push externo ou integração
              nativa.
            </p>
          </section>
          <section className="panel">
            <SectionTitle title="Privacidade e seus dados" />
            <p className="muted">
              Você pode revisar seus registros, exportar uma cópia ou excluir
              sua conta.
            </p>
            <div className="privacy-actions">
              <button
                className="btn secondary"
                onClick={async () => {
                  try {
                    const data = await api(
                      "/patients/" + state.patient!.id + "/export",
                    );
                    const blob = new Blob([JSON.stringify(data, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "meus-dados-cuidali.json";
                    a.click();
                    URL.revokeObjectURL(url);
                    toast("Cópia dos dados baixada. Guarde-a com segurança.");
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
              >
                <Download size={18} />
                Exportar meus dados
              </button>
              <button className="btn ghost" onClick={() => setPrivacy(true)}>
                <ShieldCheck size={18} />
                Sobre privacidade
              </button>
              <button className="danger-link" onClick={() => setRemove(true)}>
                <Trash2 size={17} />
                Excluir minha conta
              </button>
            </div>
          </section>
        </div>
      </div>
      {revoke && (
        <Modal title="Revogar acesso?" close={() => setRevoke(null)}>
          <p>
            <strong>{revoke.name}</strong> deixará de acessar os dados deste
            idoso. Você poderá autorizar novamente com um novo convite.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setRevoke(null)}>
              Cancelar
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                try {
                  await act("/links/" + revoke.id, {}, "DELETE");
                  setRevoke(null);
                  toast("Acesso revogado.");
                } catch (e) {
                  toast((e as Error).message);
                }
              }}
            >
              Revogar acesso
            </button>
          </div>
        </Modal>
      )}
      {deletingContact && (
        <Modal title="Excluir contato?" close={() => setDeletingContact(null)}>
          <p>
            Deseja remover <strong>{deletingContact.name}</strong> dos contatos
            de confiança?
          </p>
          <div className="modal-actions">
            <button
              className="btn secondary"
              onClick={() => setDeletingContact(null)}
            >
              Cancelar
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                try {
                  await act(
                    "/contacts/" + deletingContact.id,
                    { version: deletingContact.version },
                    "DELETE",
                  );
                  setDeletingContact(null);
                  toast("Contato removido.");
                } catch (e) {
                  toast((e as Error).message);
                }
              }}
            >
              Excluir contato
            </button>
          </div>
        </Modal>
      )}
      {remove && (
        <Modal title="Excluir sua conta?" close={() => setRemove(false)}>
          <p>
            Esta ação é definitiva.{" "}
            {state.user.role === "elder"
              ? "Sua conta, medicamentos, consultas, relatos e vínculos serão excluídos. Seus cuidadores perderão o acesso."
              : "Sua conta e seus vínculos serão removidos. Os dados dos idosos continuam pertencendo a eles."}
          </p>
          <label>
            Digite EXCLUIR para confirmar
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </label>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setRemove(false)}>
              Cancelar
            </button>
            <button
              className="btn danger"
              disabled={confirmText !== "EXCLUIR" || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api("/account", "DELETE", { confirm: "EXCLUIR" });
                  await outbox.clearOwner(state.user.id);
                  await refresh();
                } catch (e) {
                  toast((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Excluir definitivamente
            </button>
          </div>
        </Modal>
      )}
      {privacy && (
        <Modal title="Privacidade no Cuidali" close={() => setPrivacy(false)}>
          <p>
            Seus dados de saúde são acessíveis somente pela sua conta e por
            cuidadores autorizados. Os vínculos podem ser revogados a qualquer
            momento.
          </p>
          <p>
            Armazenamos as informações necessárias para os lembretes e
            registros. As senhas são protegidas com scrypt. As sessões usam
            cookies HttpOnly. Não há compartilhamento com serviços externos de
            IA.
          </p>
          <p>
            Voz: se você ativar o microfone, o reconhecimento poderá usar
            serviços do fornecedor do navegador. Consulte a política do seu
            navegador antes de usar informações pessoais.
          </p>
          <p>
            Esta é uma implementação de desenvolvimento. Antes de usar dados
            reais, configure HTTPS, backups, política de retenção e os
            responsáveis e bases legais pela LGPD. Veja a documentação técnica.
          </p>
          <button
            className="btn primary wide"
            onClick={() => setPrivacy(false)}
          >
            Entendi
          </button>
        </Modal>
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">
          <span className="blue-dot" />
          {eyebrow}
        </p>
        <h1>
          {title}
          <span className="greeting-dot">.</span>
        </h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
