"use client";

import { AlertCircle, FileText, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { ProfileResults } from "./profile-results";
import type { CareerProfile } from "@/lib/profile-schema";
import type { ResumeSections } from "@/lib/sections";

type ParseResult = {
  rawText: string;
  sections: ResumeSections;
  profile: CareerProfile;
};

export function ResumeUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function analyzeResume() {
    if (!file) {
      setError("Choose a PDF resume first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Resume analysis failed.");
        return;
      }

      setResult(payload);
    } catch {
      setError("Resume analysis failed. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-lg border border-[#d8dbd7] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">
            Intake
          </p>
          <label className="mt-4 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#bfc9c3] bg-[#f8faf6] p-6 text-center transition hover:bg-[#f2f4f1]">
            <Upload className="mb-4 h-8 w-8 text-[#064e3b]" />
            <span className="text-base font-semibold">Upload resume PDF</span>
            <span className="mt-2 text-sm leading-5 text-[#404944]">
              Text-based PDFs up to 5 MB work best.
            </span>
            <input
              className="sr-only"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError(null);
              }}
            />
          </label>

          {file ? (
            <div className="mt-3 flex items-center gap-3 rounded-md border border-[#d8dbd7] bg-white p-3 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-[#064e3b]" />
              <span className="min-w-0 truncate">{file.name}</span>
            </div>
          ) : null}

          <button
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#064e3b] px-4 text-sm font-semibold text-white transition hover:bg-[#003527] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={analyzeResume}
            type="button"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isLoading ? "Analyzing" : "Analyze resume"}
          </button>
        </div>

        {error ? (
          <div className="flex gap-2 rounded-md border border-[#ffb4a9] bg-[#ffdad6] p-3 text-sm text-[#93000a]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </aside>

      <ProfileResults result={result} isLoading={isLoading} />
    </div>
  );
}
