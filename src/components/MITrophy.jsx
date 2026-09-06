// 3D-кубок «Мастер Игорей»: вращение, пульс-свечение, золотая пыль.
export function MITrophy({ size = "sm", className = "" }) {
  const px =
    size === "lg" ? "text-[110px]" : size === "md" ? "text-4xl" : size === "xs" ? "text-base" : "text-2xl";
  return (
    <span
      className={"relative inline-flex items-center justify-center " + className}
      title="Кубок «Мастер Игорей» — игра участвовала в МИ"
      aria-label="Кубок Мастера Игорей"
      role="img"
    >
      <span
        className={`trophy-spin ${px} leading-none`}
        style={{
          filter:
            "drop-shadow(0 0 10px rgba(255,217,160,.8)) drop-shadow(0 0 22px rgba(255,182,193,.45))",
        }}
      >
        🏆
      </span>
      <span className="trophy-dust absolute h-1 w-1 rounded-full bg-pastel-amber" style={{ left: "12%", top: "20%" }} />
      <span className="trophy-dust absolute h-0.5 w-0.5 rounded-full bg-pastel-pink" style={{ right: "10%", top: "35%", animationDelay: ".7s" }} />
      <span className="trophy-dust absolute h-1 w-1 rounded-full bg-pastel-amber" style={{ left: "30%", bottom: "10%", animationDelay: "1.3s" }} />
    </span>
  );
}
