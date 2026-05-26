import { ProfileForm } from "@/components/profile-form";

export default function Home() {
  return (
    <main className="relative min-h-screen" style={{ zIndex: 1 }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(9, 9, 15, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div style={{ animation: "fadeInUp 0.5s ease both" }}>
            <p
              className="gradient-text"
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              CareerOS
            </p>
            <h1
              style={{
                marginTop: 4,
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Career Profile Builder
            </h1>
          </div>
          <div className="status-badge" style={{ animation: "fadeInUp 0.6s ease both" }}>
            Engine: Active
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <ProfileForm />
    </main>
  );
}
