import { ResumeUploader } from "@/components/resume-uploader";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-[#d8dbd7] bg-[#ffffff]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#586377]">
              CareerOS
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#191c1b]">
              Resume Intelligence Workspace
            </h1>
          </div>
          <div className="w-fit rounded-md border border-[#bfc9c3] bg-[#ecfdf5] px-3 py-2 text-sm font-medium text-[#064e3b]">
            Engine: Active
          </div>
        </div>
      </section>
      <ResumeUploader />
    </main>
  );
}
