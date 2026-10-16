import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  Home,
  MessageCircle,
  Phone,
  Pill,
  RefreshCw,
  Watch,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useApp } from "./context";
import { Brand, Busy } from "./components";
export default function WatchExperience() {
  const {
    state,
    act,
    online,
    confirmMedication,
    toast,
    pendingCount,
    openQueue,
  } = useApp();
  const [screen, setScreen] = useState("home");
  const [clock, setClock] = useState(new Date());
  const [round, setRound] = useState(false);
  const [confirmSOS, setConfirmSOS] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [intensity, setIntensity] = useState("Leve");
  const [sent, setSent] = useState(false);
  const [registered, setRegistered] = useState(false);
  const med =
    state.medications.find((m) => m.status !== "taken") || state.medications[0];
  const appt = state.appointments.find((a) => a.date >= state.day);
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!registered) return;
    const timer = setInterval(() => {
      if (navigator.onLine)
        void act("/devices", {
          name: "Relógio · protótipo web",
          kind: "watch",
        }).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [registered, state.patient?.id]);
  async function sos() {
    setBusy(true);
    try {
      const r = await act(
        "/sos",
        { source: "watch" },
        "POST",
        "SOS pelo relógio",
      );
      setMessage(
        r.queued
          ? "Pendente neste aparelho. O pedido não foi transmitido."
          : "Registrado no Cuidali. Sem push ou SMS externo.",
      );
      setConfirmSOS(false);
      setSent(true);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function discomfort() {
    setBusy(true);
    try {
      const r = await act(
        "/pain",
        {
          region: "Não informado · relato rápido",
          side: "Frente",
          kind: "Constante",
          intensity,
          since: "Hoje",
          notes:
            "Registro rápido pelo protótipo de relógio. Detalhes e região precisam ser complementados no aplicativo.",
          source: "watch",
        },
        "POST",
        "Desconforto pelo relógio",
      );
      setMessage(
        r.queued
          ? "Guardado aqui. Ainda não foi transmitido."
          : "Relato disponível no painel. Sem notificação externa.",
      );
      setSent(true);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function go(s: string) {
    setScreen(s);
    setMessage("");
    setSent(false);
    setConfirmSOS(false);
  }
  return (
    <div className="watch-stage">
      <header className="watch-stage-header">
        <a href="/" aria-label="Voltar para o aplicativo">
          <Brand />
        </a>
        <a href="/" className="btn secondary">
          <ArrowLeft size={17} />
          Voltar ao aplicativo
        </a>
      </header>
      <div className="watch-stage-intro">
        <span className="eyebrow">CUIDALI NO SEU PULSO</span>
        <h1>O essencial. Sempre perto.</h1>
        <p>
          Protótipo web conectado à mesma API do aplicativo.
          <br />
          Não é uma aplicação nativa de relógio.
        </p>
      </div>
      <div className="watch-shape-picker">
        <button
          className={!round ? "active" : ""}
          onClick={() => setRound(false)}
        >
          Retangular
        </button>
        <button
          className={round ? "active" : ""}
          onClick={() => setRound(true)}
        >
          Circular
        </button>
      </div>
      <div className={"watch-hardware " + (round ? "round" : "")}>
        <div className="watch-strap strap-top" />
        <div className="watch-crown" />
        <div className="watch-display">
          <div className="watch-status">
            <span>
              {clock.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>
              {online ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span className="watch-battery" />
            </span>
          </div>
          <div className="watch-screen">
            {screen !== "home" && (
              <button
                className="watch-back"
                onClick={() => go("home")}
                aria-label="Voltar ao início do relógio"
              >
                <ArrowLeft size={17} />
                <span>Cuidali</span>
              </button>
            )}
            {!state.patient ? (
              <>
                <Heart size={34} />
                <h2>Conecte seu cuidado</h2>
                <p>Vincule um idoso no aplicativo para ver seus lembretes.</p>
                <a href="/" className="watch-button">
                  Abrir aplicativo
                </a>
              </>
            ) : screen === "home" ? (
              <>
                <div className="watch-greeting">
                  Olá, {state.patient.name.split(" ")[0]}
                  <Heart size={13} />
                </div>
                <div className="watch-clock">
                  {clock.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="watch-date">
                  {clock.toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <button
                  className="watch-med-card"
                  onClick={() => go("medications")}
                >
                  <Pill size={25} />
                  <div>
                    <small>{med ? "SEU LEMBRETE" : "MEDICAMENTOS"}</small>
                    <strong>
                      {med ? `${med.name} ${med.dosage}` : "Nenhum cadastrado"}
                    </strong>
                    <span>{med?.time || "Veja no aplicativo"}</span>
                  </div>
                  <ChevronRight size={15} />
                </button>
                {appt && (
                  <p className="watch-appt">
                    <Clock3 size={12} />
                    {appt.time} · Consulta{" "}
                    {appt.date === state.day
                      ? "hoje"
                      : appt.date.split("-").reverse().join("/")}
                  </p>
                )}
                <button className="watch-sos" onClick={() => go("sos")}>
                  <Phone size={18} />
                  SOS · Pedir ajuda
                </button>
                <div className="watch-quick-nav">
                  <button onClick={() => go("assistant")}>
                    <MessageCircle size={19} />
                    Assistente
                  </button>
                  <button onClick={() => go("pain")}>
                    <Heart size={19} />
                    Sinto dor
                  </button>
                </div>
              </>
            ) : screen === "medications" ? (
              <>
                <span className="watch-eyebrow">SEUS MEDICAMENTOS</span>
                {state.medications.length ? (
                  state.medications.map((m) => (
                    <button
                      className={
                        "watch-med-item " +
                        (m.status === "taken" ? "is-taken" : "")
                      }
                      key={m.id}
                      onClick={() => confirmMedication(m)}
                    >
                      <Pill size={23} />
                      <div>
                        <strong>
                          {m.name} {m.dosage}
                        </strong>
                        <span>
                          {m.time} ·{" "}
                          {m.status === "taken"
                            ? "Tomado"
                            : m.status === "snoozed"
                              ? "Adiado"
                              : m.status === "not_taken"
                                ? "Não tomei"
                                : "Sem confirmação"}
                        </span>
                      </div>
                      {m.status === "taken" ? (
                        <Check size={18} />
                      ) : (
                        <ChevronRight size={15} />
                      )}
                    </button>
                  ))
                ) : (
                  <p>Nenhum medicamento cadastrado.</p>
                )}
                <a href="/" className="watch-text-link">
                  Gerenciar no aplicativo
                  <ArrowRight size={13} />
                </a>
              </>
            ) : screen === "sos" ? (
              <>
                <h2>
                  {sent
                    ? "Estado do pedido"
                    : confirmSOS
                      ? "Confirmar ajuda?"
                      : "Precisa de ajuda?"}
                </h2>
                {!sent ? (
                  <>
                    <button
                      className="watch-sos-circle"
                      disabled={busy}
                      onClick={() =>
                        confirmSOS ? void sos() : setConfirmSOS(true)
                      }
                    >
                      {busy ? <Busy /> : <Phone size={32} />}
                      <strong>{confirmSOS ? "Confirmar" : "SOS"}</strong>
                    </button>
                    <p>
                      {confirmSOS
                        ? "Registrar o pedido no Cuidali? Sem envio externo de push/SMS."
                        : "Toque para abrir a confirmação."}
                    </p>
                    {confirmSOS && (
                      <button
                        className="watch-button secondary"
                        onClick={() => setConfirmSOS(false)}
                      >
                        Cancelar
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="watch-recorded">
                      <Check size={32} />
                    </span>
                    <p role="status">{message}</p>
                  </>
                )}
                {state.contacts[0] && (
                  <a
                    href={
                      "tel:" + state.contacts[0].phone.replace(/[^+\d]/g, "")
                    }
                    className="watch-button"
                  >
                    <Phone size={16} />
                    Abrir ligação
                  </a>
                )}
                <a href="tel:192" className="watch-text-link">
                  Emergência médica: 192
                </a>
              </>
            ) : screen === "pain" ? (
              <>
                <span className="watch-pain-heart">
                  <Heart size={31} />
                </span>
                <h2>{sent ? "Relato registrado" : "Está sentindo dor?"}</h2>
                {sent ? (
                  <p role="status">{message}</p>
                ) : (
                  <>
                    <p>Qual a intensidade?</p>
                    <div className="watch-intensity">
                      {["Leve", "Média", "Forte", "Muito forte"].map((i) => (
                        <button
                          key={i}
                          className={i === intensity ? "active" : ""}
                          onClick={() => setIntensity(i)}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                    {["Forte", "Muito forte"].includes(intensity) && (
                      <p className="watch-urgent">
                        Dor intensa ou repentina? Procure atendimento. SAMU 192.
                      </p>
                    )}
                    <button
                      className="watch-button"
                      disabled={busy}
                      onClick={() => void discomfort()}
                    >
                      {busy ? <Busy /> : "Confirmar relato"}
                    </button>
                    <p className="watch-fine">
                      Local não informado. Complete o relato no celular.
                    </p>
                  </>
                )}
                <a href="/" className="watch-text-link">
                  Continuar no aplicativo
                  <ArrowRight size={13} />
                </a>
              </>
            ) : (
              <>
                <span className="watch-eyebrow">SEU ASSISTENTE</span>
                <h2>Como posso ajudar?</h2>
                {message ? (
                  <div className="watch-answer">
                    <p>{message}</p>
                    <button
                      className="watch-button secondary"
                      onClick={() => setMessage("")}
                    >
                      Outra pergunta
                    </button>
                  </div>
                ) : (
                  ["Próximo remédio", "Que horas são?", "Preciso de ajuda"].map(
                    (q) => (
                      <button
                        className="watch-button secondary"
                        disabled={busy}
                        key={q}
                        onClick={async () => {
                          if (q === "Preciso de ajuda") {
                            go("sos");
                            return;
                          }
                          setBusy(true);
                          try {
                            const r = await act("/assistant", { message: q });
                            setMessage(r.answer);
                          } catch (e) {
                            setMessage((e as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {q}
                        <ChevronRight size={14} />
                      </button>
                    ),
                  )
                )}
                <a href="/" className="watch-text-link">
                  Continuar no celular
                  <ArrowRight size={13} />
                </a>
              </>
            )}
          </div>
          <div className={"watch-sync " + (!online ? "offline" : "")}>
            <span />
            {online ? "Conectado à API" : "Sem conexão · ações pendentes"}
          </div>
        </div>
        <div className="watch-strap strap-bottom" />
      </div>
      <div className="watch-stage-footer">
        {pendingCount > 0 && (
          <div className="watch-pending">
            <strong>{pendingCount} ação(ões) pendente(s)</strong>
            <p>Ainda não confirmadas pelo servidor.</p>
            <button className="btn secondary" onClick={openQueue}>
              Revisar pendências
            </button>
          </div>
        )}
        <button
          className="btn secondary"
          disabled={busy || !state.patient}
          onClick={async () => {
            setBusy(true);
            try {
              await act("/devices", {
                name: "Relógio · protótipo web",
                kind: "watch",
              });
              setRegistered(true);
              toast("Sincronização do protótipo ativada.");
            } catch (e) {
              toast((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {registered ? <Check size={18} /> : <RefreshCw size={18} />}{" "}
          {registered
            ? "Sincronização ativada"
            : "Ativar sincronização deste protótipo"}
        </button>
        <p>
          Ações offline exigem uma sessão aberta e serão reenviadas quando
          houver conexão.
          <br />
          Ligação, vibração e notificações nativas dependem de hardware e
          integração nativa.
        </p>
      </div>
    </div>
  );
}
