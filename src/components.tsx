import { useEffect, useRef, type ReactNode } from "react";
import { HeartPulse, X, Check, ChevronRight, LoaderCircle } from "lucide-react";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"brand " + (compact ? "compact" : "")}>
      <div className="brand-symbol">
        <HeartPulse aria-hidden="true" strokeWidth={1.8} />
      </div>
      <div>
        <strong>
          cuidali<span>·</span>
        </strong>
        {!compact && <small>CUIDADO QUE CONECTA</small>}
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    el?.querySelector<HTMLElement>("button,input,select,textarea")?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && el) {
        const nodes = Array.from(
          el.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not(:disabled),select,textarea,a[href]",
          ),
        ).filter((n) => n.offsetParent !== null);
        if (!nodes.length) return;
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={ref}
      >
        <header>
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Fechar janela"
            onClick={close}
          >
            <X />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Status({ status }: { status?: string | null }) {
  const labels: Record<string, string> = {
    taken: "Tomado",
    not_taken: "Não tomei",
    snoozed: "Adiado",
    registered: "Registrado",
    acknowledged: "Visualizado",
  };
  return (
    <span className={"status " + (status || "pending")}>
      {status === "taken" && <Check size={13} />}{" "}
      {labels[status || ""] || "Sem confirmação"}
    </span>
  );
}
export function Busy() {
  return <LoaderCircle size={19} className="spin" aria-label="Carregando" />;
}
export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ChevronRight size={16} />
    </button>
  );
}
export function dateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
) {
  return new Intl.DateTimeFormat("pt-BR", options).format(
    new Date(date + "T12:00:00"),
  );
}
export function stampLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}
