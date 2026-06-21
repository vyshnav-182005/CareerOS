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
  Search,
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  Clock,
  ArrowRight,
  FileText,
  Download,
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

interface JobPosting {
  title: string;
  company: string;
  location: string;
  remote: boolean;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  technologies: string[];
  salaryRange: string;
  source: string;
  sourceUrl: string;
  postedAt: string;
  applicationUrl: string;
}

interface JobSearchResult {
  searchTerms: string[];
  targetRoles: string[];
  sources: string[];
  jobs: JobPosting[];
}

interface UserSession {
  name?: string | null;
  email?: string | null;
}

export function DashboardView({ user }: { user?: UserSession }) {
  const [profiles, setProfiles] = useState<CareerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Job search state
  const [jobResults, setJobResults] = useState<Record<string, JobSearchResult>>({});
  const [jobLoading, setJobLoading] = useState<Record<string, boolean>>({});
  const [jobErrors, setJobErrors] = useState<Record<string, string>>({});
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Resume builder state
  const [resumeLoading, setResumeLoading] = useState<Record<string, boolean>>({});
  const [resumeError, setResumeError] = useState<Record<string, string>>({});
  const [resumeSuccess, setResumeSuccess] = useState<Record<string, boolean>>({});

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

  const handleFindJobs = async (profileId: string, forceRefresh = false) => {
    setJobLoading((prev) => ({ ...prev, [profileId]: true }));
    setJobErrors((prev) => {
      const next = { ...prev };
      delete next[profileId];
      return next;
    });

    try {
      const response = await fetch("/api/job-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, forceRefresh }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setJobResults((prev) => ({
        ...prev,
        [profileId]: {
          searchTerms: data.searchTerms ?? [],
          targetRoles: data.targetRoles ?? [],
          sources: data.sources ?? [],
          jobs: data.jobs ?? [],
        },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search jobs";
      console.error("✗ Job search failed:", message);
      setJobErrors((prev) => ({ ...prev, [profileId]: message }));
    } finally {
      setJobLoading((prev) => ({ ...prev, [profileId]: false }));
    }
  };

  const handleBuildResume = async (
    profileId: string,
    job: JobPosting,
    jobIdx: number
  ) => {
    const key = `${profileId}-${jobIdx}`;
    setResumeLoading((prev) => ({ ...prev, [key]: true }));
    setResumeError((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setResumeSuccess((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      const response = await fetch("/api/build-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          jobDescription: job.description || "",
          jobTitle: job.title || "Unknown Role",
          companyName: job.company || "Unknown Company",
        }),
      });

      // Error responses come back as JSON; success is a PDF binary
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Trigger download of the PDF file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = (job.company || "company")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 30);
      const safeTitle = (job.title || "resume")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 30);
      a.href = url;
      a.download = `resume_${safeName}_${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setResumeSuccess((prev) => ({ ...prev, [key]: true }));
      // Clear success indicator after 5 seconds
      setTimeout(() => {
        setResumeSuccess((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 5000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to build resume";
      console.error("✗ Resume build failed:", message);
      setResumeError((prev) => ({ ...prev, [key]: message }));
    } finally {
      setResumeLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

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

                {/* ── Find Jobs Button ── */}
                <div
                  style={{
                    paddingTop: 20,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    gap: 12
                  }}
                >
                  <button
                    onClick={() => handleFindJobs(profile._id, false)}
                    disabled={jobLoading[profile._id]}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 24px",
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background: jobResults[profile._id]
                        ? "linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)"
                        : "linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)",
                      color: "rgb(52, 211, 153)",
                      cursor: jobLoading[profile._id] ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      opacity: jobLoading[profile._id] ? 0.7 : 1,
                      boxShadow: jobLoading[profile._id]
                        ? "none"
                        : "0 0 20px rgba(52, 211, 153, 0.1)",
                    }}
                  >
                    {jobLoading[profile._id] ? (
                      <>
                        <Loader2
                          style={{
                            width: 16,
                            height: 16,
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Searching jobs...
                      </>
                    ) : jobResults[profile._id] ? (
                      <>
                        <Search style={{ width: 16, height: 16 }} />
                        Update Job Recommendations
                      </>
                    ) : (
                      <>
                        <Search style={{ width: 16, height: 16 }} />
                        Find Matching Jobs
                      </>
                    )}
                  </button>
                  {jobResults[profile._id] && (
                    <button
                      onClick={() => handleFindJobs(profile._id, true)}
                      disabled={jobLoading[profile._id]}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 24px",
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.02)",
                        color: "var(--text-secondary)",
                        cursor: jobLoading[profile._id] ? "not-allowed" : "pointer",
                        transition: "all 0.3s ease",
                        opacity: jobLoading[profile._id] ? 0.7 : 1,
                      }}
                    >
                      <Zap style={{ width: 16, height: 16 }} />
                      Force Refresh
                    </button>
                  )}
                </div>

                {/* ── Job Search Error ── */}
                {jobErrors[profile._id] && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 14,
                      borderRadius: "var(--radius-md)",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "rgb(239, 68, 68)",
                      fontSize: 13,
                    }}
                  >
                    {jobErrors[profile._id]}
                  </div>
                )}

                {/* ── Job Loading Skeleton ── */}
                {jobLoading[profile._id] && (
                  <div style={{ marginTop: 24 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 20,
                      }}
                    >
                      <Briefcase style={{ width: 18, height: 18, color: "rgb(6, 182, 212)" }} />
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 650,
                          color: "var(--text-primary)",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        Finding your best matches...
                      </h3>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          style={{
                            padding: 20,
                            borderRadius: "var(--radius-md)",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div
                            style={{
                              height: 18,
                              width: "70%",
                              borderRadius: 6,
                              background: "rgba(255,255,255,0.06)",
                              marginBottom: 12,
                              animation: "pulse 1.5s ease-in-out infinite",
                            }}
                          />
                          <div
                            style={{
                              height: 14,
                              width: "50%",
                              borderRadius: 6,
                              background: "rgba(255,255,255,0.04)",
                              marginBottom: 8,
                              animation: "pulse 1.5s ease-in-out 0.2s infinite",
                            }}
                          />
                          <div
                            style={{
                              height: 40,
                              width: "100%",
                              borderRadius: 6,
                              background: "rgba(255,255,255,0.03)",
                              animation: "pulse 1.5s ease-in-out 0.4s infinite",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Job Results ── */}
                {jobResults[profile._id] && !jobLoading[profile._id] && (
                  <div style={{ marginTop: 24 }}>
                    {/* Search Info Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(52, 211, 153, 0.2) 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Briefcase style={{ width: 16, height: 16, color: "rgb(6, 182, 212)" }} />
                        </div>
                        <div>
                          <h3
                            style={{
                              fontSize: 16,
                              fontWeight: 650,
                              color: "var(--text-primary)",
                              letterSpacing: "-0.3px",
                            }}
                          >
                            Job Recommendations
                          </h3>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            {jobResults[profile._id].jobs.length} jobs found
                            {jobResults[profile._id].targetRoles.length > 0 &&
                              ` • Targeting: ${jobResults[profile._id].targetRoles.slice(0, 3).join(", ")}`}
                          </p>
                        </div>
                      </div>

                      {/* Search terms pills */}
                      {jobResults[profile._id].searchTerms.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {jobResults[profile._id].searchTerms.slice(0, 4).map((term) => (
                            <span
                              key={term}
                              style={{
                                padding: "4px 10px",
                                fontSize: 11,
                                borderRadius: "var(--radius-full)",
                                background: "rgba(6, 182, 212, 0.1)",
                                border: "1px solid rgba(6, 182, 212, 0.2)",
                                color: "rgb(6, 182, 212)",
                                fontWeight: 500,
                              }}
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Job Cards Grid */}
                    {jobResults[profile._id].jobs.length === 0 ? (
                      <div
                        style={{
                          padding: 32,
                          textAlign: "center",
                          borderRadius: "var(--radius-md)",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <Briefcase
                          style={{
                            width: 32,
                            height: 32,
                            color: "var(--text-muted)",
                            margin: "0 auto 12px",
                          }}
                        />
                        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                          No matching jobs found. Try updating your profile with more skills or target roles.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                          gap: 16,
                        }}
                      >
                        {jobResults[profile._id].jobs.map((job, idx) => {
                          const jobKey = `${profile._id}-${idx}`;
                          const isExpanded = expandedJob === jobKey;

                          return (
                            <div
                              key={idx}
                              style={{
                                padding: 0,
                                borderRadius: "var(--radius-md)",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                overflow: "hidden",
                                transition: "all 0.2s ease",
                                position: "relative",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(6, 182, 212, 0.3)";
                                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(6, 182, 212, 0.08)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                              }}
                            >
                              {/* Card Header */}
                              <div style={{ padding: "18px 18px 14px" }}>
                                <h4
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 650,
                                    color: "var(--text-primary)",
                                    marginBottom: 6,
                                    lineHeight: 1.3,
                                    letterSpacing: "-0.2px",
                                  }}
                                >
                                  {job.title || "Untitled Position"}
                                </h4>

                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  {job.company && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 13,
                                        color: "var(--text-secondary)",
                                      }}
                                    >
                                      <Building2 style={{ width: 13, height: 13, flexShrink: 0 }} />
                                      {job.company}
                                    </div>
                                  )}
                                  {job.location && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 12,
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
                                      {job.location}
                                      {job.remote && (
                                        <span
                                          style={{
                                            padding: "2px 6px",
                                            fontSize: 10,
                                            borderRadius: 4,
                                            background: "rgba(52, 211, 153, 0.12)",
                                            color: "rgb(52, 211, 153)",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Remote
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Meta badges */}
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    flexWrap: "wrap",
                                    marginTop: 10,
                                  }}
                                >
                                  {job.employmentType && (
                                    <span
                                      style={{
                                        padding: "3px 8px",
                                        fontSize: 10,
                                        borderRadius: 4,
                                        background: "rgba(168, 85, 247, 0.1)",
                                        color: "rgb(168, 85, 247)",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {job.employmentType}
                                    </span>
                                  )}
                                  {job.experienceLevel && (
                                    <span
                                      style={{
                                        padding: "3px 8px",
                                        fontSize: 10,
                                        borderRadius: 4,
                                        background: "rgba(59, 130, 246, 0.1)",
                                        color: "rgb(59, 130, 246)",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {job.experienceLevel}
                                    </span>
                                  )}
                                  {job.salaryRange && (
                                    <span
                                      style={{
                                        padding: "3px 8px",
                                        fontSize: 10,
                                        borderRadius: 4,
                                        background: "rgba(52, 211, 153, 0.1)",
                                        color: "rgb(52, 211, 153)",
                                        fontWeight: 500,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 3,
                                      }}
                                    >
                                      <DollarSign style={{ width: 10, height: 10 }} />
                                      {job.salaryRange}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              {job.description && (
                                <div style={{ padding: "0 18px 14px" }}>
                                  <p
                                    style={{
                                      fontSize: 12,
                                      color: "var(--text-muted)",
                                      lineHeight: 1.6,
                                      maxHeight: isExpanded ? "none" : 60,
                                      overflow: "hidden",
                                      transition: "max-height 0.3s ease",
                                    }}
                                  >
                                    {job.description}
                                  </p>
                                  {job.description.length > 150 && (
                                    <button
                                      onClick={() =>
                                        setExpandedJob(isExpanded ? null : jobKey)
                                      }
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "rgb(6, 182, 212)",
                                        fontSize: 11,
                                        cursor: "pointer",
                                        padding: "4px 0",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {isExpanded ? "Show less" : "Show more"}
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Skills/Technologies */}
                              {(job.skills.length > 0 || job.technologies.length > 0) && (
                                <div
                                  style={{
                                    padding: "0 18px 14px",
                                    display: "flex",
                                    gap: 4,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {[...new Set([...job.skills, ...job.technologies])]
                                    .slice(0, 6)
                                    .map((skill) => (
                                      <span
                                        key={skill}
                                        style={{
                                          padding: "2px 7px",
                                          fontSize: 10,
                                          borderRadius: 4,
                                          background: "rgba(255,255,255,0.05)",
                                          border: "1px solid rgba(255,255,255,0.08)",
                                          color: "var(--text-muted)",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div
                                style={{
                                  padding: "12px 18px",
                                  borderTop: "1px solid rgba(255,255,255,0.05)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    {(job.applicationUrl || job.sourceUrl) ? (
                                      <a
                                        href={job.applicationUrl || job.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 6,
                                          padding: "8px 16px",
                                          fontSize: 12,
                                          fontWeight: 600,
                                          borderRadius: 6,
                                          background: "linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)",
                                          color: "rgb(52, 211, 153)",
                                          textDecoration: "none",
                                          transition: "all 0.2s ease",
                                          border: "1px solid rgba(52, 211, 153, 0.2)",
                                        }}
                                      >
                                        Apply Now
                                        <ArrowRight style={{ width: 12, height: 12 }} />
                                      </a>
                                    ) : (
                                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                        No application link
                                      </span>
                                    )}

                                    {/* Build Resume Button */}
                                    <button
                                      onClick={() => handleBuildResume(profile._id, job, idx)}
                                      disabled={resumeLoading[`${profile._id}-${idx}`]}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "8px 16px",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        borderRadius: 6,
                                        background: resumeSuccess[`${profile._id}-${idx}`]
                                          ? "linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(34, 197, 94, 0.2) 100%)"
                                          : "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
                                        color: resumeSuccess[`${profile._id}-${idx}`]
                                          ? "rgb(34, 197, 94)"
                                          : "rgb(168, 85, 247)",
                                        border: resumeSuccess[`${profile._id}-${idx}`]
                                          ? "1px solid rgba(34, 197, 94, 0.3)"
                                          : "1px solid rgba(168, 85, 247, 0.2)",
                                        cursor: resumeLoading[`${profile._id}-${idx}`]
                                          ? "not-allowed"
                                          : "pointer",
                                        transition: "all 0.2s ease",
                                        opacity: resumeLoading[`${profile._id}-${idx}`] ? 0.7 : 1,
                                      }}
                                    >
                                      {resumeLoading[`${profile._id}-${idx}`] ? (
                                        <>
                                          <Loader2
                                            style={{
                                              width: 12,
                                              height: 12,
                                              animation: "spin 1s linear infinite",
                                            }}
                                          />
                                          Building...
                                        </>
                                      ) : resumeSuccess[`${profile._id}-${idx}`] ? (
                                        <>
                                          <Download style={{ width: 12, height: 12 }} />
                                          Downloaded!
                                        </>
                                      ) : (
                                        <>
                                          <FileText style={{ width: 12, height: 12 }} />
                                          Build Resume
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {job.source && (
                                      <span
                                        style={{
                                          fontSize: 10,
                                          color: "var(--text-muted)",
                                          opacity: 0.7,
                                        }}
                                      >
                                        via {job.source}
                                      </span>
                                    )}
                                    {job.postedAt && (
                                      <span
                                        style={{
                                          fontSize: 10,
                                          color: "var(--text-muted)",
                                          opacity: 0.5,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 3,
                                        }}
                                      >
                                        <Clock style={{ width: 10, height: 10 }} />
                                        {job.postedAt}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Resume Build Error */}
                                {resumeError[`${profile._id}-${idx}`] && (
                                  <div
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: 4,
                                      background: "rgba(239, 68, 68, 0.08)",
                                      border: "1px solid rgba(239, 68, 68, 0.2)",
                                      color: "rgb(239, 68, 68)",
                                      fontSize: 11,
                                    }}
                                  >
                                    {resumeError[`${profile._id}-${idx}`]}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
