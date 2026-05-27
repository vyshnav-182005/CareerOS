"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  GitBranch,
  Mail,
  Code,
  BookOpen,
  Target,
  Zap,
  ExternalLink,
  Star,
  Tag,
  Calendar,
} from "lucide-react";

/* Brand icons were removed from lucide-react; inline SVG replacement */
function LinkedInIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 14, height: 14, ...style }}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface Education {
  institution: string;
  degree: string;
  branch: string;
  dates: string;
  cgpa?: string;
}

interface GitHubProject {
  title: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  techStack: string[];
  atsPoints: string[];
}

interface CareerProfile {
  _id: string;
  name: string;
  email: string;
  github: string;
  linkedin: string;
  skills: string[];
  interests: string;
  targetRoles: string;
  education: Education[];
  experience?: Array<{
    title: string;
    organization: string;
    dates: string;
    summary: string;
  }>;
  githubProjects: GitHubProject[];
  createdAt: string;
  updatedAt: string;
}

interface UserSession {
  name?: string | null;
  email?: string | null;
}

export function DashboardView({ user }: { user?: UserSession }) {
  const [profiles, setProfiles] = useState<CareerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/my-profiles");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log("✓ Profiles fetched from MongoDB:", data);
        
        // Normalize fields so .length / .map never crash on undefined
        const normalized = (data.profiles || []).map((p: CareerProfile) => ({
          ...p,
          skills: p.skills ?? [],
          education: p.education ?? [],
          githubProjects: (p.githubProjects ?? []).map((gp: GitHubProject) => ({
            ...gp,
            topics: gp.topics ?? [],
            techStack: gp.techStack ?? [],
            atsPoints: gp.atsPoints ?? [],
          })),
        }));
        setProfiles(normalized);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error occurred";
        console.error("✗ Failed to fetch profiles from MongoDB:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 12,
          color: "var(--text-muted)",
        }}
      >
        <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
        Loading profiles...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: "var(--radius-md)",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "rgb(239, 68, 68)",
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {profiles.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            borderRadius: "var(--radius-md)",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p style={{ color: "var(--text-muted)", marginBottom: 8 }}>No profiles yet</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Create your first career profile to see your data here
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {profiles.map((profile) => (
            <div
              key={profile._id}
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(255,255,255,0.1)",
                overflow: "hidden",
                background: "rgba(255,255,255,0.02)",
                transition: "all 0.2s ease",
              }}
            >
              {/* ── Profile Header ── */}
              <div
                style={{
                  padding: 28,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                      {profile.name}
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                      {profile.email}
                    </p>
                    <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                      <a
                        href={`https://github.com/${profile.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "7px 12px",
                          fontSize: 12,
                          borderRadius: "var(--radius-sm)",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "var(--text-secondary)",
                          textDecoration: "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <GitBranch style={{ width: 14, height: 14 }} />
                        {profile.github}
                      </a>
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "7px 12px",
                          fontSize: 12,
                          borderRadius: "var(--radius-sm)",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "var(--text-secondary)",
                          textDecoration: "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <LinkedInIcon />
                        LinkedIn
                      </a>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      textAlign: "right",
                      minWidth: 80,
                    }}
                  >
                    <p style={{ marginBottom: 6 }}>Last Updated</p>
                    <p style={{ fontSize: 12, fontWeight: 500 }}>
                      {new Date(profile.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Profile Details ── */}
              <div style={{ padding: 28, background: "rgba(255,255,255,0.01)" }}>
                {/* ── Target Roles & Interests ── */}
                {(profile.targetRoles || profile.interests) && (
                  <div style={{ marginBottom: 28 }}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 650,
                        color: "var(--text-primary)",
                        marginBottom: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        letterSpacing: "-0.3px",
                      }}
                    >
                      <Target style={{ width: 16, height: 16, color: "var(--accent-emerald)" }} />
                      Career Focus
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: profile.targetRoles && profile.interests ? "1fr 1fr" : "1fr", gap: 20 }}>
                      {profile.targetRoles && (
                        <div>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginBottom: 8,
                              fontWeight: 500,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Target Roles
                          </p>
                          <p
                            style={{
                              fontSize: 14,
                              color: "var(--text-secondary)",
                              lineHeight: 1.6,
                            }}
                          >
                            {profile.targetRoles}
                          </p>
                        </div>
                      )}
                      {profile.interests && (
                        <div>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginBottom: 8,
                              fontWeight: 500,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Interests
                          </p>
                          <p
                            style={{
                              fontSize: 14,
                              color: "var(--text-secondary)",
                              lineHeight: 1.6,
                            }}
                          >
                            {profile.interests}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Skills ── */}
                {profile.skills.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 650,
                        color: "var(--text-primary)",
                        marginBottom: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        letterSpacing: "-0.3px",
                      }}
                    >
                      <Zap style={{ width: 16, height: 16, color: "rgb(59, 130, 246)" }} />
                      Skills ({profile.skills.length})
                    </h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            padding: "7px 14px",
                            fontSize: 12,
                            borderRadius: "var(--radius-full)",
                            background: "rgba(59, 130, 246, 0.1)",
                            border: "1px solid rgba(59, 130, 246, 0.2)",
                            color: "rgb(59, 130, 246)",
                            fontWeight: 500,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Education ── */}
                {profile.education.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 650,
                        color: "var(--text-primary)",
                        marginBottom: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        letterSpacing: "-0.3px",
                      }}
                    >
                      <BookOpen style={{ width: 16, height: 16, color: "rgb(168, 85, 247)" }} />
                      Education
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {profile.education.map((edu, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: 14,
                            borderRadius: "var(--radius-md)",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                              marginBottom: 8,
                            }}
                          >
                            <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                              {edu.degree}
                            </p>
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Calendar style={{ width: 12, height: 12 }} />
                              {edu.dates}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                            {edu.institution}
                          </p>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                            {edu.branch}
                            {edu.cgpa && ` • CGPA: ${edu.cgpa}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── GitHub Projects ── */}
                {profile.githubProjects.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 650,
                        color: "var(--text-primary)",
                        marginBottom: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        letterSpacing: "-0.3px",
                      }}
                    >
                      <GitBranch style={{ width: 16, height: 16, color: "rgb(168, 85, 247)" }} />
                      GitHub Projects ({profile.githubProjects.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {profile.githubProjects.map((project) => (
                        <a
                          key={project.url}
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: 14,
                            borderRadius: "var(--radius-md)",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            textDecoration: "none",
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <div style={{ flex: 1 }}>
                              <p
                                style={{
                                  fontWeight: 600,
                                  color: "var(--text-primary)",
                                  marginBottom: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  fontSize: 14,
                                }}
                              >
                                {project.title}
                                <ExternalLink style={{ width: 12, height: 12 }} />
                              </p>
                              {project.description && (
                                <p
                                  style={{
                                    fontSize: 13,
                                    color: "var(--text-secondary)",
                                    marginBottom: 10,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {project.description}
                                </p>
                              )}
                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                {project.language && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      padding: "3px 9px",
                                      borderRadius: "var(--radius-sm)",
                                      background: "rgba(59, 130, 246, 0.1)",
                                      color: "rgb(59, 130, 246)",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {project.language}
                                  </span>
                                )}
                                {project.stars > 0 && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "var(--text-muted)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <Star style={{ width: 12, height: 12, fill: "currentColor" }} />
                                    {project.stars}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {(() => {
                            const languageKey = project.language?.trim().toLowerCase();
                            const topicKeys = new Set(project.topics.map((topic) => topic.trim().toLowerCase()));
                            const uniqueTechStack = Array.from(
                              new Map(project.techStack.map((tech) => [tech.trim().toLowerCase(), tech.trim()])).values()
                            ).filter((tech) => {
                              const normalized = tech.trim().toLowerCase();
                              if (!normalized) return false;
                              if (languageKey && normalized === languageKey) return false;
                              if (topicKeys.has(normalized)) return false;
                              return true;
                            });

                            if (uniqueTechStack.length === 0 && project.topics.length === 0) {
                              return null;
                            }

                            return (
                              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {uniqueTechStack.map((tech) => (
                                  <span
                                    key={tech}
                                    style={{
                                      fontSize: 11,
                                      padding: "3px 9px",
                                      borderRadius: "var(--radius-sm)",
                                      background: "rgba(52, 211, 153, 0.1)",
                                      color: "rgb(52, 211, 153)",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {tech}
                                  </span>
                                ))}
                                {project.topics.map((topic) => (
                                  <span
                                    key={topic}
                                    style={{
                                      fontSize: 11,
                                      padding: "3px 9px",
                                      borderRadius: "var(--radius-sm)",
                                      background: "rgba(168, 85, 247, 0.1)",
                                      color: "rgb(168, 85, 247)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 3,
                                      fontWeight: 500,
                                    }}
                                  >
                                    <Tag style={{ width: 10, height: 10 }} />
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
