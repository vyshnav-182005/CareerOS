# CareerOS Agent Architecture

## 1. Profile Analysis Agent

The Profile Analysis Agent processes the user's information, including resume data, skills, projects, education, work experience, GitHub repositories, and career preferences. It converts this information into a structured candidate profile that can be used consistently across the system.

**Input**

* Resume
* Skills
* Projects
* Education
* Experience
* GitHub Profile
* Career Preferences

**Output**

* Structured candidate profile containing roles, skills, experience level, location preferences, and relevant qualifications.

---

## 2. Job Search Agent

The Job Search Agent discovers relevant job opportunities based on the candidate profile. It generates search terms, queries job board APIs, searches company career pages, and collects job postings from multiple sources. Retrieved jobs are standardized into a common format for downstream processing.

**Input**

* Candidate profile

**Output**

* List of job postings with normalized job information.

---

## 3. Job Matching Agent

The Job Matching Agent evaluates how well each job aligns with the candidate profile. It compares required skills, experience levels, technologies, and role requirements to generate a match score. Jobs are ranked from most relevant to least relevant before being displayed to the user.

**Input**

* Candidate profile
* Retrieved job postings

**Output**

* Ranked job list with match scores and relevance explanations.

---

## 4. Resume Tailor Agent

The Resume Tailor Agent customizes the user's resume for a selected job description. It highlights the most relevant skills, projects, and experiences while optimizing content for applicant tracking systems (ATS). Each generated resume is specifically tailored to maximize relevance for the target role.

**Input**

* Candidate profile
* Selected job description

**Output**

* Tailored resume content optimized for the target job.

---

## 5. Application Agent

The Application Agent handles the job application process. It prepares the required documents, fills application forms when supported, uploads the tailored resume, and submits applications to the target platform. The agent also records application status for tracking purposes.

**Input**

* Tailored resume
* Job posting information
* Application URL

**Output**

* Application status and submission confirmation.

---

# Workflow

User Profile
→ Profile Analysis Agent
→ Job Search Agent
→ Job Matching Agent
→ Ranked Jobs Displayed in UI
→ User Selects a Job
→ Resume Tailor Agent
→ Application Agent
→ Application Submitted

---

# Goal

The goal of CareerOS is to automate the job discovery and application process by identifying relevant opportunities, ranking them according to candidate fit, generating job-specific resumes, and streamlining application submission through an agent-based workflow.
