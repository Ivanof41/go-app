type IconProps = {
  className?: string;
};

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.5v2.1M10 15.4v2.1M17.5 10h-2.1M4.6 10H2.5M15.1 4.9l-1.5 1.5M6.4 13.6l-1.5 1.5M15.1 15.1l-1.5-1.5M6.4 6.4L4.9 4.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M12.5 5L7.5 10L12.5 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
