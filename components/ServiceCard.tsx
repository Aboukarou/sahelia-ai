import type { LucideIcon } from "lucide-react";

type ServiceCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function ServiceCard({
  icon: Icon,
  title,
  description,
}: ServiceCardProps) {
  return (
    <article
      className="
        glass
        flex
        h-full
        flex-col
        rounded-3xl
        border
        border-white/10
        p-6
        transition-all
        duration-300
        hover:-translate-y-2
        hover:border-sahelGold/40
        hover:shadow-[0_20px_50px_rgba(255,183,0,0.10)]
      "
    >
      <div
        className="
          mb-5
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-sahelGreen/20
          text-sahelGold
        "
      >
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="text-xl font-black text-white">
        {title}
      </h3>

      <p className="mt-4 flex-1 leading-8 text-white/65">
        {description}
      </p>
    </article>
  );
}