import { Star } from "lucide-react";

const testimonials = [
  {
    name: "iTech Services",
    role: "Services IT",
    text: "SAHELIA AI nous aide à présenter nos services de manière claire et professionnelle. Le site inspire confiance et facilite le contact client.",
  },
  {
    name: "Watiri",
    role: "Marketplace automobile",
    text: "Une interface moderne, rapide et adaptée au marché tchadien. Le parcours est simple et orienté contact direct.",
  },
  {
    name: "Client PME",
    role: "Entreprise locale",
    text: "Communication claire, livraison rapide et accompagnement sérieux. Le site donne une image plus professionnelle à notre activité.",
  },
];

export function Testimonials() {
  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-sahelGold">
            Témoignages
          </p>

          <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">
            Ils nous font confiance.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Des entreprises qui ont choisi SAHELIA AI pour améliorer leur
            visibilité et recevoir davantage de demandes clients.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="
                glass
                rounded-3xl
                p-8
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-sahelGold/30
              "
            >
              <div className="flex gap-1 text-sahelGold">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-current"
                  />
                ))}
              </div>

              <p className="mt-6 text-lg leading-8 text-white/70">
                “{item.text}”
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-sahelGold
                    font-black
                    text-sahelBlack
                  "
                >
                  {item.name.charAt(0)}
                </div>

                <div>
                  <h3 className="font-black text-white">
                    {item.name}
                  </h3>

                  <p className="text-sm font-semibold text-sahelGold">
                    {item.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}