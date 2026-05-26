/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileForm } from "./profile-form";

const originalFetch = global.fetch;

describe("ProfileForm GitHub projects", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fetches and displays GitHub project summaries from the entered profile URL", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          projects: [
            {
              title: "career-os",
              url: "https://github.com/vyshn/career-os",
              description: "AI career profile builder",
              language: "TypeScript",
              topics: ["nextjs", "ats"],
              stars: 12,
              atsPoints: [
                "Built an AI career profile builder.",
                "Implemented ATS-friendly project summaries."
              ]
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    render(<ProfileForm />);

    fireEvent.change(screen.getByPlaceholderText("https://github.com/yourprofile"), {
      target: { value: "https://github.com/vyshn" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Fetch GitHub Projects" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/projects-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: "https://github.com/vyshn" })
      });
    });

    expect(await screen.findByText("GitHub Projects")).toBeTruthy();
    expect(screen.getByText("career-os")).toBeTruthy();
    expect(screen.getByText("AI career profile builder")).toBeTruthy();
    expect(screen.getByText("TypeScript")).toBeTruthy();
    expect(screen.getByText("nextjs")).toBeTruthy();
    expect(screen.getByText("12 stars")).toBeTruthy();
    expect(screen.getByText("Built an AI career profile builder.")).toBeTruthy();
    expect(screen.getByText("Implemented ATS-friendly project summaries.")).toBeTruthy();
  });

  it("shows a validation error before fetching when GitHub profile is empty", async () => {
    render(<ProfileForm />);

    fireEvent.click(screen.getByRole("button", { name: "Fetch GitHub Projects" }));

    expect(screen.getByText("Enter a GitHub profile URL first.")).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
