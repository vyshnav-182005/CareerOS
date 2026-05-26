import type { ReactNode } from "react";
import { BookOpen, BriefcaseBusiness, FileText } from "lucide-react";
import type { CareerProfile } from "../lib/profile-schema";
import type { ResumeSections } from "../lib/sections";
import { normalizeTextBlock } from "../lib/text";

export type GitHubProjectSummary = {
  title: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  atsPoints: string[];
};

type Props = {
  result: { sections: ResumeSections; profile: CareerProfile } | null;
  isLoading: boolean;
  githubProjects?: GitHubProjectSummary[];
};

export function ProfileResults({ result, isLoading, githubProjects = [] }: Props) {
  if (isLoading) {
    return (
      <div className="glass-card" style={{ padding: 32, animation: "fadeInUp 0.4s ease both" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="shimmer" style={{ height: 20, width: "60%" }} />
          <div className="shimmer" style={{ height: 14, width: "100%" }} />
          <div className="shimmer" style={{ height: 14, width: "85%" }} />
          <div className="shimmer" style={{ height: 14, width: "70%" }} />
          <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
            <div className="shimmer" style={{ height: 32, width: 80, borderRadius: 100 }} />
            <div className="shimmer" style={{ height: 32, width: 100, borderRadius: 100 }} />
            <div className="shimmer" style={{ height: 32, width: 70, borderRadius: 100 }} />
          </div>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          Analyzing your profile and generating insights...
        </p>
      </div>
    );
  }

  if (!result && githubProjects.length === 0) {
    return (
      <div className="glass-card empty-state" style={{ animation: "fadeInUp 0.5s ease both" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(52, 211, 153, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4
          }}
        >
          <FileText style={{ width: 28, height: 28, color: "var(--accent-emerald)" }} />
        </div>
        <p style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 15 }}>
          No analysis yet
        </p>
        <p style={{ maxWidth: 380 }}>
          Fill in your career details and click &quot;Analyze Profile&quot; to see extracted
          information, inferred skills, technical depth, role alignment, and evidence.
        </p>
      </div>
    );
  }

  const profile = result?.profile;
  const sections = result?.sections;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {profile ? <CandidateDetails profile={profile} /> : null}
      {profile ? <AnalysisSummary profile={profile} /> : null}
      {githubProjects.length > 0 ? <GitHubProjects projects={githubProjects} /> : null}

      {sections?.experience ? (
        <SectionCard
          icon={<BriefcaseBusiness style={{ width: 20, height: 20 }} />}
          title="Experience"
          delay="0.55s"
        >
          <p style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
            {normalizeTextBlock(sections.experience)}
          </p>
        </SectionCard>
      ) : null}

      {sections?.projects ? (
        <SectionCard
          icon={<FileText style={{ width: 20, height: 20 }} />}
          title="Projects"
          delay="0.6s"
        >
          <p style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
            {normalizeTextBlock(sections.projects)}
          </p>
        </SectionCard>
      ) : null}

      {sections?.education ? (
        <SectionCard
          icon={<BookOpen style={{ width: 20, height: 20 }} />}
          title="Education"
          delay="0.65s"
        >
          <p style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
            {normalizeTextBlock(sections.education)}
          </p>
        </SectionCard>
      ) : null}

      {sections?.certifications ? (
        <SectionCard
          icon={<BookOpen style={{ width: 20, height: 20 }} />}
          title="Certifications"
          delay="0.7s"
        >
          <p style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
            {normalizeTextBlock(sections.certifications)}
          </p>
        </SectionCard>
      ) : null}
    </section>
  );
}

function CandidateDetails({ profile }: { profile: CareerProfile }) {
  return (
    <div
      className="glass-card-highlight result-card"
      style={{ animation: "fadeInUp 0.4s ease both" }}
    >
      <p className="section-label">Candidate Details</p>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {profile.candidate.name ? (
          <DetailBlock label="Name">{profile.candidate.name}</DetailBlock>
        ) : null}
        {profile.candidate.headline ? (
          <DetailBlock label="Headline">{profile.candidate.headline}</DetailBlock>
        ) : null}
        {profile.candidate.location ? (
          <DetailBlock label="Location">{profile.candidate.location}</DetailBlock>
        ) : null}
        {profile.candidate.contacts.length > 0 ? (
          <div>
            <DetailLabel>Contacts</DetailLabel>
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {profile.candidate.contacts.map((contact) => (
                <span key={contact} className="info-chip">
                  {contact}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {profile.candidate.links.length > 0 ? (
          <div>
            <DetailLabel>Links</DetailLabel>
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {profile.candidate.links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-chip"
                >
                  {normalizeTextBlock(link)}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AnalysisSummary({ profile }: { profile: CareerProfile }) {
  return (
    <div className="glass-card result-card" style={{ animation: "fadeInUp 0.5s ease both" }}>
      <p className="section-label">Analysis Results</p>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2
            className="gradient-text"
            style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.01em" }}
          >
            {profile.candidate.name ?? "Resume profile"}
          </h2>
          {profile.roleAlignment[0] ? (
            <div className="score-badge">
              <span style={{ fontWeight: 700 }}>{profile.roleAlignment[0].score}/100</span>{" "}
              <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                {normalizeTextBlock(profile.roleAlignment[0].role)}
              </span>
            </div>
          ) : null}
        </div>
        <p style={{ maxWidth: 720, whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
          {normalizeTextBlock(profile.executiveSummary)}
        </p>
      </div>
    </div>
  );
}

function GitHubProjects({ projects }: { projects: GitHubProjectSummary[] }) {
  return (
    <SectionCard
      icon={<FileText style={{ width: 20, height: 20 }} />}
      title="GitHub Projects"
      delay="0.52s"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {projects.map((project) => (
          <article key={project.url || project.title} className="entry-card">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 700, textDecoration: "none" }}
                >
                  {project.title}
                </a>
                {project.description ? (
                  <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {project.description}
                  </p>
                ) : null}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {project.language ? <span className="info-chip">{project.language}</span> : null}
                <span className="info-chip">{project.stars} stars</span>
              </div>
            </div>
            {project.topics.length > 0 ? (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {project.topics.map((topic) => (
                  <span key={`${project.title}-${topic}`} className="skill-tag">
                    {topic}
                  </span>
                ))}
              </div>
            ) : null}
            <ul style={{ marginTop: 12, paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
              {project.atsPoints.map((point) => (
                <li key={`${project.title}-${point}`}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function DetailBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <DetailLabel>{label}</DetailLabel>
      <p style={{ marginTop: 4, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
        {children}
      </p>
    </div>
  );
}

function DetailLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
      {children}
    </p>
  );
}

function SectionCard({
  icon,
  title,
  delay,
  children
}: {
  icon: ReactNode;
  title: string;
  delay: string;
  children: ReactNode;
}) {
  return (
    <div
      className="glass-card result-card"
      style={{ animation: `fadeInUp 0.5s ease ${delay} both` }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div className="result-card-icon">{icon}</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}
