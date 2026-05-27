import Link from "next/link";
import { ArrowRight, Brain, Code2, LineChart, Shield, Sparkles, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen" style={{ zIndex: 1 }}>
      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-30"
        style={{
          background: "rgba(9, 9, 15, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "rgba(52, 211, 153, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles style={{ width: 18, height: 18, color: "var(--accent-emerald)" }} />
            </div>
            <span
              className="gradient-text"
              style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}
            >
              CareerOS
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/login"
              style={{
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-secondary)",
                textDecoration: "none",
                borderRadius: "var(--radius-sm)",
                transition: "color 0.2s ease",
              }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="btn-primary"
              style={{ width: "auto", height: 40, padding: "0 20px", fontSize: 13 }}
            >
              <span>Get Started</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section
        style={{
          padding: "100px 24px 80px",
          textAlign: "center",
          maxWidth: 900,
          margin: "0 auto",
          animation: "fadeInUp 0.6s ease both",
        }}
      >
        <div
          className="status-badge"
          style={{
            margin: "0 auto 28px",
            width: "fit-content",
            animation: "fadeInUp 0.4s ease both",
          }}
        >
          AI-Powered Career Intelligence
        </div>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          Build Your{" "}
          <span className="gradient-text">Career Profile</span>
          <br />
          With AI Precision
        </h1>
        <p
          style={{
            marginTop: 24,
            fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            maxWidth: 640,
            margin: "24px auto 0",
          }}
        >
          Transform your experience into a structured, AI-analyzed career profile.
          Extract skills, gauge technical depth, and get role alignment scores — all in seconds.
        </p>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Link
            href="/signup"
            className="btn-primary"
            style={{
              width: "auto",
              height: 52,
              padding: "0 32px",
              fontSize: 16,
              borderRadius: "var(--radius-md)",
            }}
          >
            <span>Start Building Free</span>
            <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
          <Link
            href="/login"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 52,
              padding: "0 32px",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textDecoration: "none",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section
        style={{
          padding: "60px 24px 80px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeInUp 0.5s ease 0.2s both" }}>
          <p className="section-label" style={{ justifyContent: "center" }}>
            Features
          </p>
          <h2
            style={{
              marginTop: 12,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Everything You Need to Stand Out
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <FeatureCard
            icon={<Brain style={{ width: 24, height: 24 }} />}
            title="AI Profile Analysis"
            description="Deep analysis of your skills, experience, and career trajectory using advanced AI models."
            delay="0.3s"
          />
          <FeatureCard
            icon={<Code2 style={{ width: 24, height: 24 }} />}
            title="GitHub Integration"
            description="Automatically extract and analyze your open-source projects with ATS-ready bullet points."
            delay="0.4s"
          />
          <FeatureCard
            icon={<LineChart style={{ width: 24, height: 24 }} />}
            title="Role Alignment Scores"
            description="See how well your profile matches target roles with detailed scoring and gap analysis."
            delay="0.5s"
          />
          <FeatureCard
            icon={<Zap style={{ width: 24, height: 24 }} />}
            title="Inferred Skills"
            description="Discover hidden skills and competencies the AI detects from your experience and projects."
            delay="0.6s"
          />
          <FeatureCard
            icon={<Shield style={{ width: 24, height: 24 }} />}
            title="Secure Storage"
            description="Your career profiles are securely stored and always accessible from your dashboard."
            delay="0.7s"
          />
          <FeatureCard
            icon={<Sparkles style={{ width: 24, height: 24 }} />}
            title="Smart Recommendations"
            description="Get actionable recommendations to strengthen your profile and close skill gaps."
            delay="0.8s"
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        style={{
          padding: "60px 24px 80px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeInUp 0.5s ease 0.3s both" }}>
          <p className="section-label" style={{ justifyContent: "center" }}>
            How It Works
          </p>
          <h2
            style={{
              marginTop: 12,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Three Simple Steps
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <StepCard
            step="01"
            title="Fill In Your Details"
            description="Add your education, skills, experience, and link your GitHub profile."
            delay="0.4s"
          />
          <StepCard
            step="02"
            title="AI Analyzes Your Profile"
            description="Our engine extracts insights, infers hidden skills, and evaluates technical depth."
            delay="0.5s"
          />
          <StepCard
            step="03"
            title="Get Actionable Results"
            description="View role alignment scores, strengths, gaps, and personalized recommendations."
            delay="0.6s"
          />
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section
        style={{
          padding: "60px 24px 100px",
          textAlign: "center",
          animation: "fadeInUp 0.5s ease 0.5s both",
        }}
      >
        <div
          className="glass-card-highlight"
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "60px 40px",
          }}
        >
          <h2
            className="gradient-text"
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Ready to Build Your Career Profile?
          </h2>
          <p style={{ marginTop: 16, fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "16px auto 0" }}>
            Join CareerOS and get AI-powered insights that help you stand out to employers.
          </p>
          <Link
            href="/signup"
            className="btn-primary"
            style={{
              width: "auto",
              height: 52,
              padding: "0 40px",
              fontSize: 16,
              margin: "32px auto 0",
              display: "inline-flex",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span>Get Started for Free</span>
            <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} CareerOS. Built with AI-powered career intelligence.
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 28,
        animation: `fadeInUp 0.5s ease ${delay} both`,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "rgba(52, 211, 153, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent-emerald)",
          marginBottom: 16,
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
        {description}
      </p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  delay,
}: {
  step: string;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 28,
        display: "flex",
        alignItems: "flex-start",
        gap: 20,
        animation: `fadeInUp 0.5s ease ${delay} both`,
      }}
    >
      <div
        className="gradient-text"
        style={{
          fontSize: 32,
          fontWeight: 800,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {step}
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}
