type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionTitle({ eyebrow, title, description, align = "center" }: SectionTitleProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-sahelGold">{eyebrow}</p> : null}
      <h2 className="text-3xl font-black leading-tight text-white md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-8 text-white/68 md:text-lg">{description}</p> : null}
    </div>
  );
}
