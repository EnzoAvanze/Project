import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Heart,
  ShieldCheck,
  Users,
  UserRound,
  Eye,
  EyeOff,
  ArrowLeft,
  Watch,
  Pill,
  CalendarDays,
  HeartHandshake,
} from "lucide-react";
import { api } from "./api";
import { Brand, Busy, Modal } from "./components";
export default function Auth({ onDone }: { onDone: () => void }) {
  const [screen, setScreen] = useState<
    "welcome" | "role" | "register" | "login"
  >("welcome");
  const [role, setRole] = useState<"elder" | "caregiver">("elder");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [privacy, setPrivacy] = useState(false);
  async function demo() {
    setBusy(true);
    setError("");
    try {
      await api("/auth/demo", "POST", {});
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      if (screen === "login") await api("/auth/login", "POST", data);
      else {
        if (data.password !== data.confirm)
          throw new Error("As senhas precisam ser iguais.");
        await api("/auth/register", "POST", {
          ...data,
          role,
          consent: data.consent === "on",
          birth_date: data.birth_date || undefined,
          contact: data.contact_name
            ? {
                name: data.contact_name,
                phone: data.contact_phone,
                relationship: data.relationship,
              }
            : undefined,
        });
      }
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const change = (s: typeof screen) => {
    setScreen(s);
    setError("");
  };
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <Brand />
        <div className="auth-story-main">
          <span className="pill-label">
            <Heart size={15} /> MAIS PERTO, MESMO DE LONGE
          </span>
          <h1>
            Cuidar é estar
            <br />
            presente.
            <br />
            <span>A gente ajuda.</span>
          </h1>
          <p>
            Mais autonomia para quem você ama.
            <br />
            Mais tranquilidade para toda a família.
          </p>
          <div className="care-illustration" aria-hidden="true">
            <div className="illustration-orbit orbit-one" />
            <div className="illustration-orbit orbit-two" />
            <div className="illustration-heart">
              <HeartHandshake size={94} strokeWidth={1.3} />
            </div>
            <span className="float-icon f-one">
              <Pill />
            </span>
            <span className="float-icon f-two">
              <CalendarDays />
            </span>
            <span className="float-icon f-three">
              <Watch />
            </span>
            <span className="illustration-dot dot-one" />
            <span className="illustration-dot dot-two" />
          </div>
        </div>
        <div className="auth-foot">
          <ShieldCheck size={18} /> Seus dados protegidos. Seu cuidado em
          primeiro lugar.
        </div>
      </div>
      <div className="auth-content">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-form-wrap">
          {screen === "welcome" ? (
            <>
              <span className="eyebrow">BEM-VINDO AO CUIDALI</span>
              <h2>
                Um cuidado a mais.
                <br />
                Todos os dias.
              </h2>
              <p className="auth-subtitle">
                Medicamentos, consultas e sua rede de apoio. Tudo junto, de um
                jeito simples.
              </p>
              <div className="welcome-features">
                <div>
                  <span className="feature-icon blue">
                    <Pill />
                  </span>
                  <div>
                    <strong>Sua rotina, mais leve</strong>
                    <p>Lembretes para cuidar de você.</p>
                  </div>
                </div>
                <div>
                  <span className="feature-icon gold">
                    <Users />
                  </span>
                  <div>
                    <strong>Quem você ama, por perto</strong>
                    <p>Uma conexão com sua rede de cuidado.</p>
                  </div>
                </div>
                <div>
                  <span className="feature-icon pink">
                    <Heart />
                  </span>
                  <div>
                    <strong>Ajuda ao seu alcance</strong>
                    <p>Um caminho simples para pedir apoio.</p>
                  </div>
                </div>
              </div>
              <button
                className="btn primary wide"
                onClick={() => change("role")}
              >
                Começar meu cuidado
                <ArrowRight size={19} />
              </button>
              <button
                className="btn secondary wide"
                onClick={() => change("login")}
              >
                Já tenho uma conta
              </button>
              <div className="divider">
                <span>ou conheça primeiro</span>
              </div>
              <button className="demo-button" disabled={busy} onClick={demo}>
                {busy ? (
                  <Busy />
                ) : (
                  <>
                    Explorar demonstração <ArrowRight size={17} />
                  </>
                )}
              </button>
              <p className="fine-print">
                Ambiente de demonstração com dados fictícios.
                <br />
                Nenhuma ligação ou mensagem será enviada.
              </p>
            </>
          ) : screen === "role" ? (
            <>
              <button className="back-link" onClick={() => change("welcome")}>
                <ArrowLeft size={18} /> Voltar
              </button>
              <span className="eyebrow">VAMOS NOS CONHECER</span>
              <h2>
                Como você vai usar
                <br />o Cuidali?
              </h2>
              <p className="auth-subtitle">
                Escolha seu perfil. Vamos preparar tudo do seu jeito.
              </p>
              <div className="role-options">
                {[
                  [
                    "elder",
                    "Sou o idoso",
                    "Quero receber lembretes e ter minha rede de apoio por perto.",
                    UserRound,
                  ],
                  [
                    "caregiver",
                    "Sou o cuidador(a)",
                    "Quero acompanhar a rotina e cuidar de quem eu amo.",
                    Users,
                  ],
                ].map(([id, title, desc, Icon]: any) => (
                  <button
                    key={id}
                    className={"role-card " + (role === id ? "selected" : "")}
                    onClick={() => setRole(id)}
                    aria-pressed={role === id}
                  >
                    <span
                      className={
                        "feature-icon " + (id === "elder" ? "blue" : "gold")
                      }
                    >
                      <Icon />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <p>{desc}</p>
                    </div>
                    <span className="radio-indicator" />
                  </button>
                ))}
              </div>
              <button
                className="btn primary wide"
                onClick={() => change("register")}
              >
                Continuar
                <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                className="back-link"
                onClick={() => change(screen === "login" ? "welcome" : "role")}
              >
                <ArrowLeft size={18} /> Voltar
              </button>
              <span className="eyebrow">
                {screen === "login"
                  ? "SEU CUIDADO CONTINUA AQUI"
                  : "UM NOVO COMEÇO"}
              </span>
              <h2>
                {screen === "login"
                  ? "Que bom ter você de volta."
                  : "Vamos criar sua conta"}
              </h2>
              <p className="auth-subtitle">
                {screen === "login"
                  ? "Entre para ver seus lembretes e se conectar com quem cuida de você."
                  : "É rápido e seguro. Vamos dar o primeiro passo juntos."}
              </p>
              <form onSubmit={submit} className="form-stack">
                {screen === "register" && (
                  <>
                    <label>
                      Nome completo
                      <input
                        name="name"
                        autoComplete="name"
                        required
                        maxLength={200}
                        placeholder="Como você se chama?"
                      />
                    </label>
                    <div className="form-row">
                      <label>
                        Data de nascimento
                        <input
                          name="birth_date"
                          type="date"
                          required={role === "elder"}
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </label>
                      <label>
                        Telefone com DDD
                        <input
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          placeholder="(11) 99999-9999"
                          pattern="[+0-9 ()\-]{10,22}"
                        />
                      </label>
                    </div>
                  </>
                )}
                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="voce@exemplo.com"
                  />
                </label>
                <label>
                  Senha
                  <div className="password-field">
                    <input
                      name="password"
                      type={show ? "text" : "password"}
                      minLength={screen === "register" ? 10 : 1}
                      maxLength={128}
                      autoComplete={
                        screen === "login" ? "current-password" : "new-password"
                      }
                      required
                      placeholder={
                        screen === "register"
                          ? "Pelo menos 10 caracteres"
                          : "Digite sua senha"
                      }
                    />
                    <button
                      type="button"
                      aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </label>
                {screen === "register" && (
                  <>
                    <label>
                      Confirme sua senha
                      <input
                        name="confirm"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={10}
                      />
                    </label>
                    {role === "elder" && (
                      <details className="contact-details">
                        <summary>
                          Adicionar contato de confiança (opcional)
                        </summary>
                        <label>
                          Nome do contato
                          <input name="contact_name" />
                        </label>
                        <label>
                          Telefone do contato
                          <input name="contact_phone" type="tel" />
                        </label>
                        <label>
                          Vínculo
                          <input
                            name="relationship"
                            placeholder="Ex.: filho(a)"
                          />
                        </label>
                        <p className="fine-print">
                          Cadastrar um contato não dá acesso aos seus dados.
                          Convide cuidadores pelo seu perfil.
                        </p>
                      </details>
                    )}
                    <label className="checkbox-label">
                      <input type="checkbox" name="consent" required />
                      <span>
                        Concordo com o uso dos meus dados para organizar meu
                        cuidado.{" "}
                        <button
                          type="button"
                          className="inline-link"
                          onClick={() => setPrivacy(true)}
                        >
                          Ler privacidade
                        </button>
                      </span>
                    </label>
                  </>
                )}
                {screen === "login" && (
                  <button
                    type="button"
                    className="inline-link forgot"
                    onClick={async () => {
                      try {
                        await api("/auth/recovery", "POST", {});
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Esqueci minha senha
                  </button>
                )}
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="btn primary wide" disabled={busy}>
                  {busy ? (
                    <Busy />
                  ) : screen === "login" ? (
                    "Entrar"
                  ) : (
                    "Criar minha conta"
                  )}
                  <ArrowRight size={18} />
                </button>
              </form>
              <p className="auth-switch">
                {screen === "login"
                  ? "Ainda não tem conta?"
                  : "Já tem uma conta?"}{" "}
                <button
                  className="inline-link"
                  onClick={() => change(screen === "login" ? "role" : "login")}
                >
                  {screen === "login" ? "Começar agora" : "Entrar"}
                </button>
              </p>
            </>
          )}
          {error && ["welcome", "role"].includes(screen) && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer>
          Uma iniciativa <strong>KANNALI CORP.</strong>
          <span>Conectando gerações, cuidando de vidas.</span>
        </footer>
      </div>
      {privacy && (
        <Modal title="Seus dados, seu cuidado" close={() => setPrivacy(false)}>
          <p>
            O Cuidali armazena seus dados de conta, medicamentos, consultas,
            relatos e alertas para organizar sua rotina. Somente você e
            cuidadores que você autorizar têm acesso.
          </p>
          <p>
            Você pode exportar seus dados, revogar cuidadores e excluir sua
            conta no perfil. Não comercializamos seus dados. Esta versão não
            envia SMS, e-mails ou push externos.
          </p>
          <p>
            Use somente dados fictícios até configurar HTTPS, política de
            retenção, responsável pelo tratamento e as demais medidas descritas
            na documentação de produção.
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
