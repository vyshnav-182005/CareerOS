import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const samplePdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 170 >>
stream
BT
/F1 12 Tf
72 720 Td
(SUMMARY) Tj
0 -18 Td
(Full-stack engineer with React and Node.js experience) Tj
0 -18 Td
(SKILLS) Tj
0 -18 Td
(React TypeScript Node.js PostgreSQL) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000461 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
531
%%EOF`;

describe("POST /api/parse-resume integration", () => {
  it("parses a text PDF and returns OpenRouter analysis", async () => {
    const form = new FormData();
    form.append("resume", new File([samplePdf], "resume.pdf", { type: "application/pdf" }));

    const response = await POST(
      new Request("http://localhost/api/parse-resume", { method: "POST", body: form })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sections.summary).toContain("Full-stack engineer");
    expect(body.profile.explicitSkills[0].name).toContain("React TypeScript Node.js PostgreSQL");
  });
});
