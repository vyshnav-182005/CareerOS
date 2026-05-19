import type { ReactNode } from "react";
import {
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Layers3,
  MapPin,
  Target,
  TriangleAlert,
  BookOpen,
  FileText
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
      {/* Details Section */}
      <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">
          Candidate Details
        </p>
        <div className="mt-4 space-y-3">
          {profile.candidate.name && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">Name</p>
              <p className="mt-1 text-sm font-medium text-[#191c1b]">{profile.candidate.name}</p>
            </div>
          )}
          {profile.candidate.headline && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">Headline</p>
              <p className="mt-1 text-sm text-[#404944]">{profile.candidate.headline}</p>
            </div>
          )}
          {profile.candidate.location && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">Location</p>
              <div className="mt-1 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#064e3b]" />
                <p className="text-sm text-[#404944]">{profile.candidate.location}</p>
              </div>
            </div>
          )}
          {profile.candidate.contacts.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">Contacts</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {profile.candidate.contacts.map((contact) => (
                  <span key={contact} className="inline-block rounded-md bg-[#f8faf6] px-2 py-1 text-sm text-[#404944]">
                    {contact}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.candidate.links.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">Links</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {profile.candidate.links.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-md bg-[#f8faf6] px-2 py-1 text-sm text-[#064e3b] underline hover:bg-[#f2f4f1]"
                  >
                    {normalizeTextBlock(link)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results Header */}
      <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">
          Analysis Results
        </p>
        <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-[#191c1b]">
              {profile.candidate.name ?? "Resume profile"}
            </h2>
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

      {/* Skills in Tiled Format */}
      <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
        <div className="mb-4 flex items-center gap-2 text-[#064e3b]">
          <CheckCircle2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-[#191c1b]">Explicit Skills</h3>
        </div>
        {profile.explicitSkills.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.explicitSkills.map((skill) => (
              <div
                key={skill.name}
                className="inline-flex items-center rounded-full bg-[#e8f5e9] px-3 py-1 text-sm font-medium text-[#064e3b] border border-[#c8e6c9]"
                title={normalizeTextBlock(skill.evidence)}
              >
                {normalizeTextBlock(skill.name)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#707974]">No skills found.</p>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
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
        <Panel
          icon={<BriefcaseBusiness />}
          title="Strengths"
          items={profile.strengths.map(
            (item) => `${normalizeTextBlock(item.title)} - ${normalizeTextBlock(item.evidence)}`
          )}
        />
      </div>

      <Panel
        icon={<TriangleAlert />}
        title="Gaps"
        items={profile.gaps.map(
          (item) => `${normalizeTextBlock(item.title)} - ${normalizeTextBlock(item.recommendation)}`
        )}
      />

      {/* Sections Display - Experience, Projects, Education (other than skills) */}
      {sections.experience && (
        <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-[#064e3b]" />
            <h3 className="text-lg font-semibold text-[#191c1b]">Experience</h3>
          </div>
          <p className="whitespace-pre-line text-sm leading-6 text-[#404944]">
            {normalizeTextBlock(sections.experience)}
          </p>
        </div>
      )}

      {sections.projects && (
        <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#064e3b]" />
            <h3 className="text-lg font-semibold text-[#191c1b]">Projects</h3>
          </div>
          <p className="whitespace-pre-line text-sm leading-6 text-[#404944]">
            {normalizeTextBlock(sections.projects)}
          </p>
        </div>
      )}

      {sections.education && (
        <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#064e3b]" />
            <h3 className="text-lg font-semibold text-[#191c1b]">Education</h3>
          </div>
          <p className="whitespace-pre-line text-sm leading-6 text-[#404944]">
            {normalizeTextBlock(sections.education)}
          </p>
        </div>
      )}

      {sections.certifications && (
        <div className="rounded-lg border border-[#d8dbd7] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#064e3b]" />
            <h3 className="text-lg font-semibold text-[#191c1b]">Certifications</h3>
          </div>
          <p className="whitespace-pre-line text-sm leading-6 text-[#404944]">
            {normalizeTextBlock(sections.certifications)}
          </p>
        </div>
      )}
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
