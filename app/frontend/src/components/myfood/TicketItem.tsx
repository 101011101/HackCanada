export type TicketStatus = "pending" | "approved" | "completed";

interface TicketItemProps {
  title: string;
  subtitle: string;
  instructions: string;
  status: TicketStatus;
  icon?: React.ReactNode;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l3 2" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h10v8H3z" />
      <path d="M3 6h10" />
      <path d="M5 9h4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="3 8 6 11 13 4" />
    </svg>
  );
}

export default function TicketItem({ title, subtitle, instructions, status, icon }: TicketItemProps) {
  const statusLabel =
    status === "pending" ? "PENDING" : status === "approved" ? "APPROVED" : "COMPLETED";
  const stubRightContent =
    status === "pending" ? (
      <span>{statusLabel}</span>
    ) : (
      statusLabel
    );

  const iconContent = icon ?? (
    status === "completed" ? (
      <CheckIcon />
    ) : status === "approved" ? (
      <TicketIcon />
    ) : (
      <ClockIcon />
    )
  );

  return (
    <div className={`ticket ticket--${status}`}>
      <div className="ticket__stub-left">
        <div className="ticket__stub-left-box">{iconContent}</div>
      </div>
      <div className="ticket__body">
        <div className="ticket__title">{title}</div>
        <div className="ticket__sub">{subtitle}</div>
        <div className="ticket__instructions">
          {instructions ? (
            instructions
          ) : (
            <span className="ticket__instructions-placeholder">Pending instructions</span>
          )}
        </div>
      </div>
      <div className="ticket__stub-right">{stubRightContent}</div>
    </div>
  );
}
