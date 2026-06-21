import type { ResumeData } from "./resume-schema";

// ── LaTeX special character escaping ─────────────────────────────────────────
const LATEX_SPECIAL: Record<string, string> = {
  "&": "\\&",
  "%": "\\%",
  $: "\\$",
  "#": "\\#",
  _: "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

function escapeLatex(text: string): string {
  // First escape backslashes, then other specials
  let result = text.replace(/\\/g, "\\textbackslash{}");
  result = result.replace(/[&%$#_{}~^]/g, (ch) => LATEX_SPECIAL[ch] || ch);
  return result;
}

/** Escape text but preserve intentional LaTeX commands like \textbf */
function escapeLatexSoft(text: string): string {
  // Only escape the truly problematic characters in free-text fields
  return text
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

// ── Jake's Resume LaTeX Template ─────────────────────────────────────────────

function generatePreamble(): string {
  return `%-------------------------
% Resume in LaTeX — Jake's Resume Template
% Based on: https://github.com/sb2nov/resume
% License: MIT
%-------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

%----------FONT OPTIONS----------
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
`;
}

function generateHeader(data: ResumeData): string {
  const c = data.contactInfo;
  const name = escapeLatex(c.name);

  // Build the contact line with pipes between items
  const parts: string[] = [];

  if (c.phone) {
    parts.push(`\\small ${escapeLatex(c.phone)}`);
  }
  if (c.email) {
    parts.push(`\\href{mailto:${c.email}}{\\underline{${escapeLatexSoft(c.email)}}}`);
  }
  if (c.linkedin) {
    const linkedinDisplay = c.linkedin
      .replace(/^https?:\/\/(www\.)?/i, "")
      .replace(/\/$/, "");
    parts.push(
      `\\href{${c.linkedin}}{\\underline{${escapeLatexSoft(linkedinDisplay)}}}`
    );
  }
  if (c.github) {
    const githubDisplay = c.github
      .replace(/^https?:\/\/(www\.)?/i, "")
      .replace(/\/$/, "");
    parts.push(
      `\\href{${c.github}}{\\underline{${escapeLatexSoft(githubDisplay)}}}`
    );
  }
  if (c.website) {
    const websiteDisplay = c.website
      .replace(/^https?:\/\/(www\.)?/i, "")
      .replace(/\/$/, "");
    parts.push(
      `\\href{${c.website}}{\\underline{${escapeLatexSoft(websiteDisplay)}}}`
    );
  }

  const contactLine = parts.join(" $|$ ");

  return `\\begin{center}
    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    ${contactLine}
\\end{center}
`;
}

function generateEducation(data: ResumeData): string {
  if (data.education.length === 0) return "";

  let tex = `%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
`;

  for (const edu of data.education) {
    const line1Left = escapeLatex(edu.institution);
    const line1Right = escapeLatex(edu.location);
    const degreeText = edu.gpa
      ? `${escapeLatex(edu.degree)} (GPA: ${escapeLatex(edu.gpa)})`
      : escapeLatex(edu.degree);
    const line2Right = escapeLatex(edu.dates);

    tex += `    \\resumeSubheading
      {${line1Left}}{${line1Right}}
      {${degreeText}}{${line2Right}}
`;

    if (edu.highlights.length > 0) {
      tex += `      \\resumeItemListStart
`;
      for (const h of edu.highlights) {
        tex += `        \\resumeItem{${escapeLatexSoft(h)}}
`;
      }
      tex += `      \\resumeItemListEnd
`;
    }
  }

  tex += `  \\resumeSubHeadingListEnd
`;
  return tex;
}

function generateExperience(data: ResumeData): string {
  if (data.experience.length === 0) return "";

  let tex = `%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
`;

  for (const exp of data.experience) {
    tex += `    \\resumeSubheading
      {${escapeLatex(exp.title)}}{${escapeLatex(exp.dates)}}
      {${escapeLatex(exp.company)}}{${escapeLatex(exp.location)}}
      \\resumeItemListStart
`;
    for (const bullet of exp.bullets) {
      tex += `        \\resumeItem{${escapeLatexSoft(bullet)}}
`;
    }
    tex += `      \\resumeItemListEnd
`;
  }

  tex += `  \\resumeSubHeadingListEnd
`;
  return tex;
}

function generateProjects(data: ResumeData): string {
  if (data.projects.length === 0) return "";

  let tex = `%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
`;

  for (const proj of data.projects) {
    const techPart = proj.technologies
      ? ` $|$ \\emph{\\small ${escapeLatexSoft(proj.technologies)}}`
      : "";
    tex += `      \\resumeProjectHeading
          {\\textbf{${escapeLatex(proj.name)}}${techPart}}{}
          \\resumeItemListStart
`;
    for (const bullet of proj.bullets) {
      tex += `            \\resumeItem{${escapeLatexSoft(bullet)}}
`;
    }
    tex += `          \\resumeItemListEnd
`;
  }

  tex += `    \\resumeSubHeadingListEnd
`;
  return tex;
}

function generateTechnicalSkills(data: ResumeData): string {
  if (data.technicalSkills.length === 0) return "";

  let tex = `%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
`;

  const lines: string[] = [];
  for (const cat of data.technicalSkills) {
    lines.push(
      `     \\textbf{${escapeLatex(cat.category)}}{: ${escapeLatexSoft(cat.skills)}}`
    );
  }
  tex += lines.join(" \\\\\n");

  tex += `
    }}
 \\end{itemize}
`;
  return tex;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Converts a structured `ResumeData` object into a complete, compilable
 * LaTeX document using Jake's Resume template.
 */
export function generateResumeLatex(data: ResumeData): string {
  let tex = generatePreamble();
  tex += "\\begin{document}\n\n";
  tex += generateHeader(data);
  tex += "\n";
  tex += generateEducation(data);
  tex += "\n";
  tex += generateExperience(data);
  tex += "\n";
  tex += generateProjects(data);
  tex += "\n";
  tex += generateTechnicalSkills(data);
  tex += "\n%-------------------------------------------\n";
  tex += "\\end{document}\n";
  return tex;
}

/**
 * Compiles a LaTeX source string into a PDF using the latex.ytotech.com API.
 * Returns the PDF as a Buffer.
 *
 * @throws Error if compilation fails or the API is unreachable.
 */
export async function compileLatexToPdf(latexSource: string): Promise<Buffer> {
  const apiUrl = "https://latex.ytotech.com/builds/sync";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      compiler: "pdflatex",
      resources: [
        {
          main: true,
          content: latexSource,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `LaTeX compilation failed (HTTP ${response.status}): ${errorText}`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/pdf")) {
    // The API returns error details as non-PDF content
    const errorText = await response.text().catch(() => "Unknown compilation error");
    throw new Error(`LaTeX compilation error: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

