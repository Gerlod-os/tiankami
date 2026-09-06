// Стильные SVG-иконки подборок (единый пастельный стиль)
export function CollectionIcon({ name, size = 30 }) {
  const n = String(name || "").toLowerCase();
  const p = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true };

  if (/золотой/.test(n)) return null; // у золотого — яйцо Legendary
  if (/карточ/.test(n))
    return (
      <svg {...p} fill="none">
        <rect x="5" y="4" width="12" height="16" rx="2" fill="#C9A0DC" opacity=".9" />
        <rect x="8" y="6" width="12" height="16" rx="2" fill="#1a1a2e" stroke="#C9A0DC" strokeWidth="1.5" />
        <path d="M14 10l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L11 12.3l2-.3 1-2Z" fill="#FFB6C1" />
      </svg>
    );
  if (/экшен|action/.test(n))
    return (
      <svg {...p} fill="none" stroke="#FF8FA3" strokeWidth="2" strokeLinecap="round">
        <path d="M4 4l13 13M20 4L7 17" />
        <path d="M15 17l2 2M9 17l-2 2" stroke="#FFD9A0" />
        <circle cx="4.5" cy="4.5" r="1.4" fill="#FF8FA3" />
        <circle cx="19.5" cy="4.5" r="1.4" fill="#FF8FA3" />
      </svg>
    );
  if (/нович/.test(n))
    return (
      <svg {...p} fill="none">
        <path d="M12 3l2.2 5.4L20 9l-4.4 3.8L17 19l-5-3.2L7 19l1.4-6.2L4 9l5.8-.6L12 3Z" fill="#FFD9A0" />
        <circle cx="12" cy="11" r="2.2" fill="#fff" opacity=".8" />
      </svg>
    );
  if (/уникаль/.test(n))
    return (
      <svg {...p} fill="none" stroke="#A0C4FF" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M7 4h10l4 5-9 11L3 9l4-5Z" fill="#A0C4FF" fillOpacity=".25" />
        <path d="M3 9h18M12 20L9 9l3-5 3 5-3 11" />
      </svg>
    );
  if (/кооп/.test(n))
    return (
      <svg {...p} fill="none" stroke="#9FE2B9" strokeWidth="2" strokeLinecap="round">
        <circle cx="9" cy="8" r="3.2" fill="#9FE2B9" fillOpacity=".3" />
        <circle cx="16" cy="9" r="2.6" fill="#9FE2B9" fillOpacity=".3" />
        <path d="M4 19c.6-3.4 2.6-5 5-5s4.4 1.6 5 5M13.5 14.6c2 .2 3.6 1.6 4.2 4.4" />
      </svg>
    );
  return (
    <svg {...p} fill="none" stroke="#C9A0DC" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 7l4-3h10l4 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M3 7h18" />
    </svg>
  );
}
