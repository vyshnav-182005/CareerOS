/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileForm } from "./profile-form";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

const originalFetch = global.fetch;

describe("ProfileForm GitHub projects", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    mockPush.mockClear();
  });

  it("fetches GitHub project summaries when building a profile", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            rawText: "raw",
            sections: { summary: "summary" },
            profile: { candidate: { name: "Asha", headline: null, contacts: [], location: null, links: [] } },
            profileId: "profile-1",
            githubProjects: []
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
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
                techStack: ["TypeScript", "Next.js", "React"],
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

    fireEvent.change(screen.getByPlaceholderText("Your full name"), {
      target: { value: "Asha" }
    });
    fireEvent.change(screen.getByPlaceholderText("https://github.com/yourprofile"), {
      target: { value: "https://github.com/vyshn" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Build Profile" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/projects-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: "https://github.com/vyshn" })
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/profile-results");
  });

  it("skips GitHub fetch when no profile URL is provided", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ profiles: [] }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            rawText: "raw",
            sections: { summary: "summary" },
            profile: { candidate: { name: "Asha", headline: null, contacts: [], location: null, links: [] } },
            profileId: "profile-1",
            githubProjects: []
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );

    render(<ProfileForm />);

    fireEvent.change(screen.getByPlaceholderText("Your full name"), {
      target: { value: "Asha" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Build Profile" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const [url, options] = vi.mocked(global.fetch).mock.calls[1];
    expect(url).toBe("/api/create-profile");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(options?.body))).toEqual(expect.objectContaining({ name: "Asha" }));

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
