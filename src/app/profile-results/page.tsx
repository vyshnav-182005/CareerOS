"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Share2 } from "lucide-react";
import type { CareerProfile } from "../../lib/profile-schema";
import type { ResumeSections } from "../../lib/sections";
import type { GitHubProjectSummary } from "../../components/profile-results";
import { normalizeTextBlock } from "../../lib/text";

interface ResultData {
  rawText: string;
  sections: ResumeSections;
  profile: CareerProfile;
  githubProjects?: GitHubProjectSummary[];
  profileId?: string;
}

export default function ProfileResultsPage() {
  const router = useRouter();
  const [result] = useState<ResultData | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedResult = sessionStorage.getItem("profileAnalysisResult");
    if (!storedResult) {
      return null;
    }

    try {
      return JSON.parse(storedResult);
    } catch (error) {
      console.error("Failed to parse stored result:", error);
      return null;
    }
  });
  const isLoading = false;

  if (isLoading) {
    return (
      <main style={{ padding: "40px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="glass-card" style={{ padding: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="shimmer" style={{ height: 20, width: "60%" }} />
            <div className="shimmer" style={{ height: 14, width: "100%" }} />
            <div className="shimmer" style={{ height: 14, width: "85%" }} />
          </div>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main style={{ padding: "40px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "transparent",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 24,
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <div className="glass-card empty-state">
          <FileText style={{ width: 40, height: 40, color: "var(--accent-emerald)", marginBottom: 12 }} />
          <p style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 16 }}>
            No profile data found
          </p>
          <p style={{ color: "var(--text-secondary)" }}>
            Please analyze a profile first.
          </p>
        </div>
      </main>
    );
  }

  const { profile, sections, githubProjects = [], profileId } = result;

  return (
    <main style={{ padding: "40px 24px", maxWidth: 1200, margin: "0 auto", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "transparent",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "var(--border-primary)";
            (e.target as HTMLButtonElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "var(--border-subtle)";
            (e.target as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back to Form
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
            onClick={() => window.print()}
          >
            <Download style={{ width: 16, height: 16 }} />
            Download
          </button>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
            onClick={() => {
              const text = result.rawText;
              navigator.clipboard.writeText(text);
              alert("Profile copied to clipboard!");
            }}
          >
            <Share2 style={{ width: 16, height: 16 }} />
            Copy
          </button>
        </div>
      </div>

      {/* Profile ID Badge */}
      {profileId && (
        <div style={{ marginBottom: 24, padding: "12px 16px", background: "rgba(52, 211, 153, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Profile ID: <span style={{ color: "var(--accent-emerald)", fontFamily: "monospace" }}>{profileId}</span>
          </p>
        </div>
      )}

      {/* Main Content */}
      <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Candidate Details */}
        {profile && (
          <div
            className="glass-card-highlight result-card"
            style={{ animation: "fadeInUp 0.4s ease both" }}
          >
            <p className="section-label">📋 Candidate Details</p>
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
                  <DetailLabel>Email</DetailLabel>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {profile.candidate.contacts.map((contact) => (
                      <span key={contact} className="info-chip">
                        {contact}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {profile.candidate.links.filter((link) => !link.includes("@")).length > 0 ? (
                <div>
                  <DetailLabel>Links</DetailLabel>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {profile.candidate.links.filter((link) => !link.includes("@")).map((link) => (
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
              {profile.education && profile.education.length > 0 ? (
                <div>
                  <DetailLabel>Education</DetailLabel>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                    {profile.education.map((edu, index) => (
                      <div key={index} style={{ padding: 12, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                        {edu.institution ? (
                          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                            {edu.institution}
                          </p>
                        ) : null}
                        {edu.credential ? (
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                            {edu.credential}
                          </p>
                        ) : null}
                        {edu.dates ? (
                          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            {edu.dates}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {profile.explicitSkills.length > 0 ? (
                <div>
                  <DetailLabel>Skills</DetailLabel>
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {profile.explicitSkills.map((skill) => (
                      <span key={skill.name} className="skill-chip" style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(52, 211, 153, 0.1)", color: "var(--accent-emerald)", fontSize: 14, fontWeight: 500 }}>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}



        {/* GitHub Projects */}
        {githubProjects.length > 0 && (
          <div className="glass-card result-card" style={{ animation: "fadeInUp 0.55s ease both" }}>
            <p className="section-label">🚀 GitHub Projects</p>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              {githubProjects.map((project, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(255,255,255,0.06)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--accent-cyan)",
                          textDecoration: "none",
                          transition: "color 0.2s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-emerald)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent-cyan)")}
                      >
                        {project.title}
                      </a>
                      {project.language && (
                        <span
                          style={{
                            marginLeft: 12,
                            padding: "4px 8px",
                            fontSize: 12,
                            background: "rgba(52, 211, 153, 0.15)",
                            color: "var(--accent-emerald)",
                            borderRadius: 4
                          }}
                        >
                          {project.language}
                        </span>
                      )}
                      {project.stars > 0 && (
                        <span
                          style={{
                            marginLeft: 8,
                            padding: "4px 8px",
                            fontSize: 12,
                            background: "rgba(255,193,7,0.15)",
                            color: "#ffc107",
                            borderRadius: 4
                          }}
                        >
                          ⭐ {project.stars}
                        </span>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                      {project.description}
                    </p>
                  )}
                  {project.techStack.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                        Tech stack:
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {project.techStack.map((tech) => (
                          <span key={`${project.title}-${tech}`} className="info-chip">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.atsPoints.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                        ATS-Friendly Points:
                      </p>
                      <ul style={{ marginLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                        {project.atsPoints.map((point, i) => (
                          <li key={i} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {sections?.experience ? (
          <div className="glass-card result-card" style={{ animation: "fadeInUp 0.6s ease both" }}>
            <p className="section-label">💼 Experience</p>
            <p style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", marginTop: 16 }}>
              {normalizeTextBlock(sections.experience)}
            </p>
          </div>
        ) : null}

        {/* Education */}
        {sections?.education ? (
          <div className="glass-card result-card" style={{ animation: "fadeInUp 0.65s ease both" }}>
            <p className="section-label">🎓 Education</p>
            <p style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", marginTop: 16 }}>
              {normalizeTextBlock(sections.education)}
            </p>
          </div>
        ) : null}

        {/* Projects */}
        {sections?.projects ? (
          <div className="glass-card result-card" style={{ animation: "fadeInUp 0.7s ease both" }}>
            <p className="section-label">📁 Projects</p>
            <p style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", marginTop: 16 }}>
              {normalizeTextBlock(sections.projects)}
            </p>
          </div>
        ) : null}

        {/* Certifications */}
        {sections?.certifications ? (
          <div className="glass-card result-card" style={{ animation: "fadeInUp 0.75s ease both" }}>
            <p className="section-label">📜 Certifications</p>
            <p style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", marginTop: 16 }}>
              {normalizeTextBlock(sections.certifications)}
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <DetailLabel>{label}</DetailLabel>
      <p style={{ marginTop: 6, fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>
        {children}
      </p>
    </div>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
      {children}
    </p>
  );
}
