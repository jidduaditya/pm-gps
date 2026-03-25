/**
 * Synthetic CV text with known skills for deterministic matching.
 *
 * Known extractable skills (from extractionService keyword list):
 *   SQL, Python, React, Node, TypeScript, AWS, Docker, Git,
 *   Agile, Scrum, JIRA, Figma, Analytics, Data Analysis,
 *   Product Management, Strategy, Leadership, API, REST, GraphQL
 */
export const SYNTHETIC_CV = `
RAHUL MEHTA
Senior Product Manager | Fintech & SaaS
Mumbai, India | rahul.mehta@example.com

SUMMARY
Product manager with 8 years of experience building data-intensive products in fintech and
enterprise SaaS. Strong technical background with hands-on SQL, Python, and API design skills.
Proven track record of driving cross-functional collaboration between engineering, design, and
business stakeholders.

EXPERIENCE

Senior Product Manager — PayStack (Fintech Startup)
Jan 2021 – Present
- Led a cross-functional team of 12 engineers to ship a real-time fraud detection dashboard,
  reducing false positives by 34%.
- Designed and documented REST APIs consumed by 3 partner integrations.
- Ran 15+ A/B tests using internal experimentation platform; improved conversion by 18%.
- Wrote technical PRDs with system architecture diagrams reviewed by engineering leads.
- Managed product roadmap in JIRA with quarterly OKR alignment.
- Conducted stakeholder management across 4 departments including compliance and legal.

Product Manager — DataFlow Analytics (Enterprise SaaS)
Mar 2018 – Dec 2020
- Owned the analytics dashboard product serving 200+ enterprise clients.
- Built self-serve SQL query builder feature; increased user engagement by 40%.
- Collaborated with data scientists on ML-powered anomaly detection feature.
- Led Agile Scrum ceremonies for a team of 8; maintained sprint velocity tracking.
- Designed user flows in Figma and ran usability testing with 30 customers.
- Managed data pipeline requirements with the data engineering team.

Associate Product Manager — TechBridge Solutions
Jun 2016 – Feb 2018
- Shipped 3 features from discovery to launch using user story mapping.
- Built analytics dashboards using Python and SQL for internal reporting.
- Supported product strategy sessions with competitive analysis and market research.

EDUCATION
MBA — Indian Institute of Management, Bangalore (2016)
B.Tech Computer Science — NIT Trichy (2014)

SKILLS
SQL, Python, TypeScript, React, Node.js, AWS, Docker, Git,
REST APIs, GraphQL, Agile, Scrum, JIRA, Figma,
Data Analysis, Product Management, Strategy, Leadership,
A/B Testing, User Research, Roadmap Planning, Stakeholder Management

CERTIFICATIONS
- Certified Scrum Product Owner (CSPO)
- AWS Cloud Practitioner
`;

/**
 * Questionnaire responses matching the fields read by extractionService.
 * See extractionService.ts lines 24-37 for field mapping.
 */
export const QUESTIONNAIRE_RESPONSES = {
  experience: '6-10 years',
  current_role: 'Senior Product Manager',
  industries: ['fintech', 'saas'],
  target_archetypes: ['Technical PM', 'Data Product Manager'],
  ai_exposure: 'Used AI tools in products',
  company_types: ['startup', 'mid_size'],
  preferred_company_stage: ['growth', 'late'],
  geography: 'Pan-India',
};
