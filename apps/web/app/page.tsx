import Link from "next/link";

const pillars = [
  [
    "WhatsApp-first",
    "Répondez, qualifiez et relancez vos prospects depuis leur canal préféré.",
  ],
  [
    "CRM intelligent",
    "Transformez les conversations en prospects, opportunités et ventes suivies.",
  ],
  [
    "Pensé pour l’Afrique",
    "Une expérience mobile, multilingue et adaptée aux entreprises africaines.",
  ],
] as const;

export default function HomePage() {
  return (
    <div className="home-shell">
      <header className="site-header">
        <Link href="/" className="brand">
          SAHELIA AI
        </Link>
        <nav className="header-actions" aria-label="Navigation principale">
          <Link href="/login" className="button secondary">
            Connexion
          </Link>
          <Link href="/register" className="button primary">
            Créer un compte
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Assistant commercial WhatsApp</p>
          <h1>Votre prochain client est déjà sur WhatsApp.</h1>
          <p className="lead">
            SAHELIA AI aide les entreprises africaines à répondre plus vite,
            qualifier chaque opportunité et vendre avec méthode.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="button primary">
              Créer mon espace entreprise
            </Link>
            <Link href="/login" className="button secondary">
              Accéder à mon compte
            </Link>
          </div>
        </section>

        <section className="pillars" aria-label="Notre vision">
          {pillars.map(([title, text]) => (
            <article key={title} className="panel">
              <h2>{title}</h2>
              <p className="muted">{text}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="site-footer">
        <span>SAHELIA AI</span>
        <span>Comprendre · Convertir · Grandir</span>
      </footer>
    </div>
  );
}
