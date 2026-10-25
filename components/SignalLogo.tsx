export default function SignalLogo() {
  return (
    <span className="signal-logo">
      <span className="signal-symbol" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M8 18v-4m5 10V8m6 19V5m5 15v-8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>
        signal<span className="logo-period">.</span>
      </span>
    </span>
  );
}
