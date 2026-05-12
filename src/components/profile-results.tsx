import type { ReactNode } from "react";
import {
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  Layers3,
  Target,
  TriangleAlert
} from "lucide-react";
import type { CareerProfile } from "@/lib/profile-schema";
import type { ResumeSections } from "@/lib/sections";
import { normalizeTextBlock } from "@/lib/text";

type Props = {
  result: { sections: ResumeSections; profile: CareerProfile } | null;
  isLoading: boolean;
};

export function ProfileResults({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#d8dbd7] bg-white p-8 text-[#404944]">
        Extracting PDF text, detecting sections, and asking the agent to reason over the resume.
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-[#d8dbd7] bg-white p-8 text-[#404944]">
        Upload a resume to see extracted sections, inferred skills, technical depth, role alignment,
        and evidence.
      </div>
    );
  }

  const { profile, sections } = result;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">
          Analysis Results
        </p>
        <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#191c1b]">
              {profile.candidate.name ?? "Resume profile"}
            </h2>
            {profile.candidate.headline ? (
              <p className="mt-1 text-sm font-medium text-[#064e3b]">{profile.candidate.headline}</p>
            ) : null}
          </div>
          {profile.roleAlignment[0] ? (
            <div className="rounded-md border border-[#bfc9c3] bg-[#f8faf6] px-3 py-2 text-sm">
              <span className="font-semibold text-[#064e3b]">
                {profile.roleAlignment[0].score}/100
              </span>{" "}
              {normalizeTextBlock(profile.roleAlignment[0].role)}
            </div>
          ) : null}
        </div>
        <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-6 text-[#404944]">
          {normalizeTextBlock(profile.executiveSummary)}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          icon={<CheckCircle2 />}
          title="Explicit Skills"
          items={profile.explicitSkills.map(
            (skill) => `${normalizeTextBlock(skill.name)} - ${normalizeTextBlock(skill.evidence)}`
          )}
        />
        <Panel
          icon={<Brain />}
          title="Inferred Skills"
          items={profile.inferredSkills.map(
            (skill) =>
              `${normalizeTextBlock(skill.name)} (${skill.confidence}) - ${normalizeTextBlock(skill.rationale)}`
          )}
        />
        <Panel
          icon={<Layers3 />}
          title="Technical Depth"
          items={profile.technicalDepth.map(
            (item) => `${normalizeTextBlock(item.area)}: ${item.level} - ${normalizeTextBlock(item.rationale)}`
          )}
        />
        <Panel
          icon={<Target />}
          title="Role Alignment"
          items={profile.roleAlignment.map(
            (item) =>
              `${normalizeTextBlock(item.role)}: ${item.score}/100 - ${normalizeTextBlock(item.rationale)}`
          )}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          icon={<BriefcaseBusiness />}
          title="Strengths"
          items={profile.strengths.map(
            (item) => `${normalizeTextBlock(item.title)} - ${normalizeTextBlock(item.evidence)}`
          )}
        />
        <Panel
          icon={<TriangleAlert />}
          title="Gaps"
          items={profile.gaps.map(
            (item) => `${normalizeTextBlock(item.title)} - ${normalizeTextBlock(item.recommendation)}`
          )}
        />
      </div>

      <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
        <div className="mb-4 flex items-center gap-2 text-[#064e3b]">
          <FileSearch className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-[#191c1b]">Evidence Vault</h3>
        </div>
        {profile.evidence.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {profile.evidence.map((item) => (
              <div
                className="rounded-md border border-[#d8dbd7] border-l-[#064e3b] border-l-4 bg-[#f8faf6] p-3"
                key={item.id}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">
                  {normalizeTextBlock(item.section)}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-5 text-[#404944]">
                  {normalizeTextBlock(item.snippet)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#707974]">No evidence snippets returned.</p>
        )}
      </div>

      <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <BriefcaseBusiness className="h-5 w-5 text-[#064e3b]" />
          <h3 className="text-lg font-semibold">Detected Sections</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(sections)
            .filter(([, value]) => value)
            .map(([name, value]) => (
              <div key={name} className="rounded-md border border-[#d8dbd7] bg-[#f8faf6] p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#064e3b]">
                  {normalizeTextBlock(name)}
                </p>
                <p className="line-clamp-5 whitespace-pre-line text-sm leading-5 text-[#404944]">
                  {normalizeTextBlock(value)}
                </p>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

function Panel({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-[#d8dbd7] bg-white p-5">
      <div className="mb-4 flex items-center gap-2 text-[#064e3b]">
        <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <h3 className="text-lg font-semibold text-[#191c1b]">{title}</h3>
      </div>
      {items.length ? (
        <ul className="space-y-2 text-sm leading-5 text-[#404944]">
          {items.map((item) => (
            <li className="border-t border-[#e1e3e0] pt-2 first:border-t-0 first:pt-0" key={item}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#707974]">No strong signal found.</p>
      )}
    </div>
  );
}
