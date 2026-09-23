import { useId } from "react";

// Кубок «Мастер Игорей» — векторный приз: чаша, ручки, постамент, звезда
export function MITrophy({ size = "sm", className = "" }) {
  const uid = useId().replace(/:/g, "");
  const px =
    size === "lg" ? "text-[110px]" : size === "md" ? "text-4xl" : size === "xs" ? "text-base" : "text-2xl";

  return (
    <span
      className={"relative inline-flex items-center justify-center " + className}
      title="Кубок «Мастер Игорей» — игра участвовала в МИ"
      aria-label="Кубок Мастера Игорей"
      role="img"
    >
      <span className={`trophy-spin ${px} leading-none`}>
        <svg
          viewBox="0 0 64 72"
          width="100%"
          height="100%"
          style={{ filter: "drop-shadow(0 1px 5px rgba(255,214,120,.75))" }}
        >
          <defs>
            <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF3C4" />
              <stop offset="35%" stopColor="#F5CE6E" />
              <stop offset="70%" stopColor="#D9A233" />
              <stop offset="100%" stopColor="#9C6F1E" />
            </linearGradient>
            <linearGradient id={`r${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFF3C4" />
              <stop offset="50%" stopColor="#E8B84A" />
              <stop offset="100%" stopColor="#B8862A" />
            </linearGradient>
          </defs>

          {/* Ручки (за чашей) */}
          <path d="M15 21 C3 21 3 41 17 41" fill="none" stroke={`url(#g${uid})`} strokeWidth="6" strokeLinecap="round" />
          <path d="M49 21 C61 21 61 41 47 41" fill="none" stroke={`url(#g${uid})`} strokeWidth="6" strokeLinecap="round" />
          <path d="M15 21 C3 21 3 41 17 41" fill="none" stroke="#7A5514" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
          <path d="M49 21 C61 21 61 41 47 41" fill="none" stroke="#7A5514" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />

          {/* Постамент */}
          <rect x="16" y="65" width="32" height="6" rx="3" fill={`url(#r${uid})`} stroke="#7A5514" strokeWidth="1.4" />
          <path d="M22 59 L42 59 L46 65 L18 65 Z" fill={`url(#g${uid})`} stroke="#7A5514" strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="29" y="52" width="6" height="8" fill={`url(#g${uid})`} stroke="#7A5514" strokeWidth="1.2" />
          <circle cx="32" cy="53.5" r="3.6" fill={`url(#g${uid})`} stroke="#7A5514" strokeWidth="1.2" />

          {/* Чаша */}
          <path
            d="M13 17 L51 17 L50 31 C49 43 42 51 32 53 C22 51 15 43 14 31 Z"
            fill={`url(#g${uid})`} stroke="#7A5514" strokeWidth="1.6" strokeLinejoin="round"
          />
          {/* Венчик */}
          <rect x="11" y="10" width="42" height="8" rx="4" fill={`url(#r${uid})`} stroke="#7A5514" strokeWidth="1.4" />
          <ellipse cx="32" cy="14.2" rx="15.5" ry="3.2" fill="#5E4210" opacity=".8" />

          {/* Блик чаша + звезда победителя */}
          <path d="M20 23 C19 33 23 41 28 46" fill="none" stroke="#FFF7D6" strokeWidth="3" strokeLinecap="round" opacity=".55" />
          <polygon
            points="32,26 34.4,32.2 41,32.6 36,36.8 37.6,43.2 32,39.6 26.4,43.2 28,36.8 23,32.6 29.6,32.2"
            fill="#FFF3C0" opacity=".95"
          />

          {/* Блик основания */}
          <rect x="21" y="66.6" width="12" height="2" rx="1" fill="#FFF7D6" opacity=".6" />
        </svg>
      </span>
      {/* Золотая пыль */}
      <span className="trophy-dust absolute h-1 w-1 rounded-full bg-pastel-amber" style={{ left: "10%", top: "15%", boxShadow: "0 0 6px #ffd880" }} />
      <span className="trophy-dust absolute h-0.5 w-0.5 rounded-full bg-pastel-pink" style={{ right: "8%", top: "30%", animationDelay: ".7s", boxShadow: "0 0 4px #ffb6c1" }} />
      <span className="trophy-dust absolute h-1 w-1 rounded-full bg-pastel-amber" style={{ left: "25%", bottom: "5%", animationDelay: "1.3s", boxShadow: "0 0 6px #ffd880" }} />
      <span className="trophy-dust absolute h-0.5 w-0.5 rounded-full bg-pastel-amber" style={{ right: "20%", bottom: "20%", animationDelay: ".3s", boxShadow: "0 0 4px #ffd880" }} />
    </span>
  );
}
