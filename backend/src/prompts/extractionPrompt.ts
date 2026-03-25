export function buildExtractionPrompt(cvText: string, questionnaireJson: string): string {
  return `You are a professional profile extractor. Extract structured information from the provided CV text and questionnaire responses. Return ONLY valid JSON matching the schema below. Do not infer or fabricate data not present in the input. If a field cannot be extracted with >70% confidence, set it to null and list the field name in confidence_flags.

All skill values must be lowercase, specific named skills — not categories.
Example correct: ["sql", "a/b testing", "figma", "stakeholder management", "agile"]
Example wrong: ["technical skills", "communication", "data"]

Schema:
{
  "total_years_experience": "number",
  "current_role": "string",
  "role_history": [{ "title": "string", "company": "string", "duration_months": "number", "industry": "string" }],
  "company_types": ["enum: startup | mid_size | large | enterprise"],
  "technical_skills": ["string — named technical skills found in CV: tools, languages, platforms, methodologies. Be specific, e.g. 'sql' not 'data skills'"],
  "domain_skills": ["string — domain knowledge areas found in CV, e.g. 'fintech', 'e-commerce saas', 'healthcare data'"],
  "soft_skills": ["string — PM-relevant soft skills inferred from CV and cover letter, e.g. 'stakeholder management', 'cross-functional collaboration', 'roadmapping'"],
  "pm_adjacent_skills": ["string — skills that are not PM titles but are directly transferable, e.g. 'a/b testing', 'sprint planning', 'user story writing', 'sql querying', 'data analysis'"],
  "education": [{ "degree": "string", "institution": "string", "year": "number" }],
  "awards": ["string"],
  "ai_ml_exposure": "enum: none | basic | working | deep",
  "stated_interests": ["string"],
  "company_stage_preference": ["string"],
  "geography_preference": "string",
  "confidence_flags": ["string"]
}

CV Text: ${cvText}
Questionnaire: ${questionnaireJson}`;
}
