interface ToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
}

export default function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={on}
      className={`toggle${on ? ' toggle--on' : ''}`}
      onClick={() => onChange(!on)}
      type="button"
    >
      <span className="toggle__k" />
    </button>
  );
}
