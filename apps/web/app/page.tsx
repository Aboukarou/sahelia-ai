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
    "Pensé pour l'Afrique",
    "Une expérience mobile, multilingue et adaptée aux entreprises africaines.",
  ],
] as const;

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", padding: "24px" }}>
      <nav
        style={{
          margin: "0 auto",
          display: "flex",
          maxWidth: 1180,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <strong style={{ color: "var(--gold)", letterSpacing: "0.12em" }}>
          SAHELIA AI
        </strong>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          Comprendre · Convertir · Grandir
        </span>
      </nav>
      <section
        style={{ margin: "96px auto 56px", maxWidth: 900, textAlign: "center" }}
      >
        <p
          style={{
            color: "var(--gold)",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
          }}
        >
          Commercial IA WhatsApp
        </p>
        <h1
          style={{
            margin: "18px 0",
            fontSize: "clamp(2.5rem, 8vw, 5.8rem)",
            lineHeight: 0.98,
          }}
        >
          Votre prochain client est déjà sur WhatsApp.
        </h1>
        <p
          style={{
            margin: "0 auto",
            maxWidth: 700,
            color: "var(--muted)",
            fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
            lineHeight: 1.7,
          }}
        >
          SAHELIA AI aide les entreprises africaines à répondre plus vite,
          qualifier chaque opportunité et vendre avec méthode.
        </p>
      </section>
      <section
        style={{
          margin: "0 auto",
          display: "grid",
          maxWidth: 1180,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {pillars.map(([title, text]) => (
          <article
            key={title}
            style={{
              border: "1px solid rgba(250,204,21,.22)",
              borderRadius: 28,
              padding: 28,
              background: "rgba(16,33,24,.82)",
              boxShadow: "0 24px 80px rgba(0,0,0,.25)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.65 }}>{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
