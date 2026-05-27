"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Sparkles, Save, Loader2, CheckCircle } from "lucide-react";
import { ProfileForm } from "../../components/profile-form";
import { DashboardView } from "../../components/dashboard-view";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "edit">("dashboard");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleSaveProfile = async (formData: Record<string, unknown>, profile: Record<string, unknown>, githubProjects: unknown[]) => {
    setSaveStatus("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, profile, githubProjects, source: "manual-profile" }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setSaveError(payload.error ?? "Failed to save profile.");
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveError("Failed to save profile. Check your connection.");
      setSaveStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <main className="relative min-h-screen" style={{ zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: 12,
            color: "var(--text-muted)",
            fontSize: 15,
          }}
        >
          <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
          Loading...
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(52, 211, 153, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles style={{ width: 15, height: 15, color: "var(--accent-emerald)" }} />
              </div>
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
            </div>
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

          <div style={{ display: "flex", alignItems: "center", gap: 16, animation: "fadeInUp 0.6s ease both" }}>
            {/* Save Button - Only Show on Edit Tab */}
            {activeTab === "edit" && (
              <button
                id="save-profile-btn"
                onClick={() => {
                  // Dispatch a custom event that ProfileForm will listen to
                  window.dispatchEvent(new CustomEvent("careeros:save-profile"));
                }}
                disabled={saveStatus === "saving"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(52, 211, 153, 0.25)",
                  background: saveStatus === "saved" ? "rgba(52, 211, 153, 0.15)" : "rgba(52, 211, 153, 0.08)",
                  color: "var(--accent-emerald)",
                  cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: saveStatus === "saving" ? 0.6 : 1,
              }}
            >
              {saveStatus === "saving" && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              {saveStatus === "saved" && <CheckCircle style={{ width: 14, height: 14 }} />}
              {saveStatus === "idle" && <Save style={{ width: 14, height: 14 }} />}
              {saveStatus === "error" && <Save style={{ width: 14, height: 14 }} />}
              <span>
                {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save Profile"}
              </span>
              </button>
            )}

            {/* User info + logout */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 100,
                }}
              >
                {session?.user?.name || session?.user?.email}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "none",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "color 0.2s ease, border-color 0.2s ease",
                }}
              >
                <LogOut style={{ width: 14, height: 14 }} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: "100%",
            margin: "0 auto",
            paddingLeft: 76,
            paddingRight: 32,
            display: "flex",
            gap: 0,
          }}
          className="max-w-7xl"
        >
          <button
            onClick={() => setActiveTab("dashboard")}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === "dashboard" ? "var(--accent-emerald)" : "var(--text-secondary)",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === "dashboard" ? "2px solid var(--accent-emerald)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === "edit" ? "var(--accent-emerald)" : "var(--text-secondary)",
              background: "none",
              border: "none",
              borderBottom: activeTab === "edit" ? "2px solid var(--accent-emerald)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {saveError && (
        <div
          className="error-banner"
          style={{ maxWidth: 600, margin: "16px auto", animation: "fadeInUp 0.3s ease" }}
        >
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Content ── */}
      {activeTab === "dashboard" ? (
        <DashboardView user={session?.user} />
      ) : (
        <ProfileForm onSaveProfile={handleSaveProfile} />
      )}
    </main>
  );
}
