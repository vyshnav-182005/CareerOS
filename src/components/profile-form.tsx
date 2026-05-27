"use client";

import { AlertCircle, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProfileResults, type GitHubProjectSummary } from "./profile-results";
import type { CareerProfile } from "../lib/profile-schema";
import type { ResumeSections } from "../lib/sections";

type ParseResult = {
  rawText: string;
  sections: ResumeSections;
  profile: CareerProfile;
};

type Education = {
  institution: string;
  degree: string;
  branch: string;
  dates: string;
  cgpa?: string;
};

type Experience = {
  title: string;
  organization: string;
  dates: string;
  summary: string;
};

type ProfileFormProps = {
  onSaveProfile?: (formData: Record<string, unknown>, profile: Record<string, unknown>, githubProjects: unknown[]) => void;
};

export function ProfileForm({ onSaveProfile }: ProfileFormProps = {}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    linkedIn: "",
    github: "",
    skills: [] as string[],
    interests: "",
    targetRoles: "",
    education: [] as Education[],
    experience: [] as Experience[]
  });
  const [skillInput, setSkillInput] = useState("");
  const skillInputRef = useRef<HTMLInputElement>(null);

  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);

  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [githubProjects, setGithubProjects] = useState<GitHubProjectSummary[]>([]);

  useEffect(() => {
    const hasAnyFormData = (data: typeof formData) => {
      return Boolean(
        data.name ||
          data.email ||
          data.linkedIn ||
          data.github ||
          data.skills.length ||
          data.interests ||
          data.targetRoles ||
          data.education.length ||
          data.experience.length
      );
    };

    const prefillFromLatestProfile = async () => {
      if (hasAnyFormData(formData)) {
        return;
      }

      try {
        const response = await fetch("/api/my-profiles");
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const latestProfile = payload?.profiles?.[0];
        if (!latestProfile) {
          return;
        }

        setFormData((prev) =>
          hasAnyFormData(prev)
            ? prev
            : {
                ...prev,
                name: latestProfile.name ?? "",
                email: latestProfile.email ?? "",
                linkedIn: latestProfile.linkedin ?? "",
                github: latestProfile.github ?? "",
                skills: Array.isArray(latestProfile.skills) ? latestProfile.skills : [],
                interests: latestProfile.interests ?? "",
                targetRoles: latestProfile.targetRoles ?? "",
                education: Array.isArray(latestProfile.education) ? latestProfile.education : [],
                experience: Array.isArray(latestProfile.experience) ? latestProfile.experience : [],
              }
        );

        if (Array.isArray(latestProfile.githubProjects)) {
          setGithubProjects(latestProfile.githubProjects);
        }
      } catch {
        // No-op: prefill is best-effort only.
      }
    };

    void prefillFromLatestProfile();
  }, [formData]);

  // Listen for save event from dashboard header
  const handleSaveEvent = useCallback(() => {
    if (result && onSaveProfile) {
      onSaveProfile(
        formData as unknown as Record<string, unknown>,
        result.profile as unknown as Record<string, unknown>,
        githubProjects as unknown[]
      );
    }
  }, [result, formData, githubProjects, onSaveProfile]);

  useEffect(() => {
    window.addEventListener("careeros:save-profile", handleSaveEvent);
    return () => window.removeEventListener("careeros:save-profile", handleSaveEvent);
  }, [handleSaveEvent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillInput = (value: string) => {
    setSkillInput(value);
  };

  const handleAddSkillFromInput = () => {
    const skill = skillInput.trim();
    if (skill.length > 0 && !formData.skills.includes(skill)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
      setSkillInput("");
      skillInputRef.current?.focus();
    }
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkillFromInput();
    }
  };

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    }
    setSkillInput("");
    skillInputRef.current?.focus();
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill)
    }));
  };

  const addEducation = () => {
    const newIndex = formData.education.length;
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { institution: "", degree: "", branch: "", dates: "", cgpa: "" }]
    }));
    setEditingEducationIndex(newIndex);
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const addExperience = () => {
    const newIndex = formData.experience.length;
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { title: "", organization: "", dates: "", summary: "" }]
    }));
    setEditingExperienceIndex(newIndex);
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const buildProfile = async () => {
    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Profile building failed.");
        return;
      }

      // Fetch GitHub projects if GitHub URL is provided
      let projectsToDisplay = payload.githubProjects || [];
      if (formData.github.trim()) {
        try {
          const projectsResponse = await fetch("/api/projects-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ githubUrl: formData.github.trim() })
          });

          const projectsPayload = await projectsResponse.json();
          if (projectsResponse.ok && Array.isArray(projectsPayload.projects)) {
            projectsToDisplay = projectsPayload.projects;
            setGithubProjects(projectsToDisplay);
          }
        } catch {
          // If GitHub projects fetching fails, continue with response data
          console.warn("Failed to fetch GitHub projects");
        }
      }

      // Store result in sessionStorage and navigate to results page
      const resultData = {
        rawText: payload.rawText,
        sections: payload.sections,
        profile: payload.profile,
        githubProjects: projectsToDisplay,
        profileId: payload.profileId
      };
      
      sessionStorage.setItem("profileAnalysisResult", JSON.stringify(resultData));
      
      // Navigate to profile results page
      router.push("/profile-results");
    } catch {
      setError("Profile building failed. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[380px_1fr]">
      {/* ── Sidebar ── */}
      <aside className="space-y-5">
        <div
          className="glass-card-highlight"
          style={{ padding: 24, animation: "fadeInUp 0.4s ease both" }}
        >
          <p className="section-label">Career Profile</p>

          {/* Basic Info */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                Name <span style={{ color: "var(--accent-emerald)" }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                className="input-field"
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="input-field"
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                LinkedIn Profile
              </label>
              <input
                type="url"
                name="linkedIn"
                value={formData.linkedIn}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/yourprofile"
                className="input-field"
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                GitHub Profile
              </label>
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleInputChange}
                placeholder="https://github.com/yourprofile"
                className="input-field"
                style={{ marginTop: 6 }}
              />

            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                Interests
              </label>
              <textarea
                name="interests"
                value={formData.interests}
                onChange={handleInputChange}
                placeholder="Your interests separated by commas"
                rows={2}
                className="input-field"
                style={{ marginTop: 6, resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                Target Roles
              </label>
              <textarea
                name="targetRoles"
                value={formData.targetRoles}
                onChange={handleInputChange}
                placeholder="Roles you're interested in"
                rows={2}
                className="input-field"
                style={{ marginTop: 6, resize: "vertical" }}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            disabled={isLoading}
            onClick={buildProfile}
            type="button"
            style={{ marginTop: 20 }}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>{isLoading ? "Building…" : "Build Profile"}</span>
          </button>

          {error ? (
            <div className="error-banner" style={{ marginTop: 14 }}>
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <section className="space-y-5">
        {/* Education Section */}
        <div
          className="glass-card"
          style={{ padding: 24, animation: "fadeInUp 0.45s ease both" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p className="section-label">Education</p>
            <button onClick={addEducation} className="btn-add" type="button">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {formData.education.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No education added yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {formData.education.map((edu, index) => (
                <div key={index} className="entry-card" style={{ animationDelay: `${index * 0.08}s` }}>
                  {editingEducationIndex === index ? (
                    <>
                      {/* Edit Mode */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, "institution", e.target.value)}
                            placeholder="Institution"
                            className="input-field input-field-sm"
                            style={{ flex: 1 }}
                          />
                          <button onClick={() => removeEducation(index)} className="btn-delete" type="button">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, "degree", e.target.value)}
                            placeholder="Degree"
                            className="input-field input-field-sm"
                            style={{ flex: "0 0 30%" }}
                          />
                          <input
                            type="text"
                            value={edu.branch}
                            onChange={(e) => updateEducation(index, "branch", e.target.value)}
                            placeholder="Branch"
                            className="input-field input-field-sm"
                            style={{ flex: 1 }}
                          />
                        </div>
                        <input
                          type="text"
                          value={edu.dates}
                          onChange={(e) => updateEducation(index, "dates", e.target.value)}
                          placeholder="Dates (e.g., 2020 – 2024)"
                          className="input-field input-field-sm"
                        />
                        <input
                          type="text"
                          value={edu.cgpa || ""}
                          onChange={(e) => updateEducation(index, "cgpa", e.target.value)}
                          placeholder="CGPA (optional)"
                          className="input-field input-field-sm"
                        />
                        <button
                          onClick={() => setEditingEducationIndex(null)}
                          className="btn-primary"
                          type="button"
                          style={{ marginTop: 8, fontSize: 13 }}
                        >
                          Done
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Display Mode */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          {edu.institution && (
                            <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                              {edu.institution}
                            </p>
                          )}
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {edu.degree && <span>{edu.degree}</span>}
                            {edu.branch && <span>{edu.branch}</span>}
                            {edu.dates && <span>{edu.dates}</span>}
                            {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingEducationIndex(index)}
                          className="btn-secondary"
                          type="button"
                          style={{ marginLeft: 12, whiteSpace: "nowrap", fontSize: 12, padding: "6px 12px" }}
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div
          className="glass-card"
          style={{ padding: 24, animation: "fadeInUp 0.5s ease both" }}
        >
          <p className="section-label">Skills</p>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <input
              ref={skillInputRef}
              type="text"
              value={skillInput}
              onChange={(e) => handleSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Enter a skill and press Enter"
              className="input-field"
              style={{ flex: 1 }}
            />
            <button
              onClick={handleAddSkillFromInput}
              className="btn-add"
              type="button"
              style={{ whiteSpace: "nowrap" }}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {formData.skills.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {formData.skills.map((skill) => (
                <div key={skill} className="skill-tag">
                  {skill}
                  <button onClick={() => removeSkill(skill)} type="button">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Experience Section */}
        <div
          className="glass-card"
          style={{ padding: 24, animation: "fadeInUp 0.55s ease both" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p className="section-label">Experience</p>
            <button onClick={addExperience} className="btn-add" type="button">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {formData.experience.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No experience added yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {formData.experience.map((exp, index) => (
                <div key={index} className="entry-card" style={{ animationDelay: `${index * 0.08}s` }}>
                  {editingExperienceIndex === index ? (
                    <>
                      {/* Edit Mode */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateExperience(index, "title", e.target.value)}
                            placeholder="Job Title"
                            className="input-field input-field-sm"
                            style={{ flex: 1 }}
                          />
                          <button onClick={() => removeExperience(index)} className="btn-delete" type="button">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={exp.organization}
                          onChange={(e) => updateExperience(index, "organization", e.target.value)}
                          placeholder="Organization"
                          className="input-field input-field-sm"
                        />
                        <input
                          type="text"
                          value={exp.dates}
                          onChange={(e) => updateExperience(index, "dates", e.target.value)}
                          placeholder="Dates (e.g., 2020 – 2024)"
                          className="input-field input-field-sm"
                        />
                        <textarea
                          value={exp.summary}
                          onChange={(e) => updateExperience(index, "summary", e.target.value)}
                          placeholder="Job description/summary"
                          rows={2}
                          className="input-field input-field-sm"
                          style={{ resize: "vertical" }}
                        />
                        <button
                          onClick={() => setEditingExperienceIndex(null)}
                          className="btn-primary"
                          type="button"
                          style={{ marginTop: 8, fontSize: 13 }}
                        >
                          Done
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Display Mode */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          {exp.title && (
                            <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                              {exp.title}
                            </p>
                          )}
                          {exp.organization && (
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                              {exp.organization}
                            </p>
                          )}
                          {exp.dates && (
                            <p style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
                              {exp.dates}
                            </p>
                          )}
                          {exp.summary && (
                            <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                              {exp.summary}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingExperienceIndex(index)}
                          className="btn-secondary"
                          type="button"
                          style={{ marginLeft: 12, whiteSpace: "nowrap", fontSize: 12, padding: "6px 12px" }}
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <ProfileResults result={result} isLoading={isLoading} githubProjects={githubProjects} />
      </section>
    </div>
  );
}
