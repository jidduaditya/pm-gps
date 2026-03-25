# PM-GPS — Final State Before LLM Integration

**Date:** 2026-03-26
**Status:** Rule-based pipeline working end-to-end. Ready for LLM-1 (extraction) and LLM-2 (recommendation) integration.

---

## What Was Done This Session

### 1. Skills Seed Data (`skills_seed.sql`)
Created real must_have_skills and good_to_have_skills for all 11 PM role archetypes:
- Technical PM, Growth PM, AI PM, ML PM, DevOps PM, Data PM, Platform PM
- Product Marketing Manager, Digital PM, Enterprise/B2B PM, Consumer/B2C PM

Each archetype has 12 must-have and 8 good-to-have skills. Applied to Supabase DB.

### 2. Extraction Pipeline Update
- **`backend/src/models/userProfile.ts`** — Renamed `domain_expertise` → `domain_skills`, added `pm_adjacent_skills`
- **`backend/src/prompts/extractionPrompt.ts`** — Updated schema to extract 4 skill arrays with lowercase instruction
- **`backend/src/services/extractionService.ts`** — Rule-based extractor outputs `domain_skills` and `pm_adjacent_skills` (empty for now, LLM will populate)

### 3. Recommendation Pipeline Update
- **`backend/src/prompts/recommendationPrompt.ts`** — New prompt matching against all 4 skill arrays with semantic matching
- **`backend/src/services/recommendationService.ts`** — New skills_delta shape, fuzzy substring matching, backward compat for `domain_expertise`

### 4. Frontend Fix
- **`frontend/src/pages/ResultsPage.tsx`** — Updated RoleScore type from old `current_skills`/`skills_to_build` to new `skills_delta` structure. Added "Build My Roadmap" button per ScoreCard. Moved "Practice with AI Coach" to header. Removed "What's next?" section.

### 5. E2E Test Infrastructure
- **`backend/src/test/e2e/pipeline.test.ts`** — Full pipeline test: auth → session → CV → questionnaire → process → poll → validate
- **`backend/src/test/e2e/fixtures.ts`** — Synthetic CV with known skills + questionnaire responses
- **`backend/vitest.config.ts`** — Vitest config with 60s timeout

---

## Architecture: Current Pipeline

```
Upload CV → POST /api/documents/text
Submit Questionnaire → POST /api/questionnaire
Trigger → POST /api/process
  └→ BullMQ: extractionJob (rule-based keyword matching)
     └→ BullMQ: recommendationJob (rule-based scoring + fuzzy match)
        └→ INSERT results → WebSocket emit results_ready
Poll → GET /api/results/:session_id
```

**Scoring formula (rule-based):**
```
score = (matchedMustHave / totalMustHave) × 60
      + (matchedGoodToHave / totalGoodToHave) × 25
      + min(yearsExp, 10) × 1.5
      + interestBoost (10 if user expressed interest)
```

**Fuzzy matching:** `archetypeSkill.toLowerCase().includes(userSkill)` or `userSkill.includes(archetypeSkill.toLowerCase())`

---

## Data Contracts

### ExtractedProfile (user_profiles.extracted_profile)

```typescript
{
  total_years_experience: number | null;
  current_role: string | null;
  role_history: Array<{ title, company, duration_months, industry }>;
  company_types: Array<'startup' | 'mid_size' | 'large' | 'enterprise'>;
  technical_skills: string[];    // tools, languages, platforms
  domain_skills: string[];       // domain knowledge (fintech, saas, etc.)
  soft_skills: string[];         // PM soft skills
  pm_adjacent_skills: string[];  // transferable non-PM skills
  education: Array<{ degree, institution, year }>;
  awards: string[];
  ai_ml_exposure: 'none' | 'basic' | 'working' | 'deep';
  stated_interests: string[];
  company_stage_preference: string[];
  geography_preference: string | null;
  confidence_flags: string[];
}
```

### skills_delta (per role in results)

```typescript
{
  matched_skills: string[];        // user skills matching must_have or good_to_have
  missing_must_have: string[];     // must_have skills user lacks
  missing_good_to_have: string[];  // good_to_have skills user lacks
  transferable_skills: string[];   // user skills not in archetype lists
}
```

### Results table row

```typescript
{
  session_id: string;
  role_scores: RoleScore[];       // all 11 archetypes scored
  selected_roles: RoleScore[];    // top 2 per category (max 6)
  skills_delta: Record<string, SkillsDelta>;       // keyed by archetype_name
  company_suggestions: Record<string, Company[]>;  // keyed by archetype_name
  model_version: 'rule-based-v1.0';
}
```

---

## Modified Files — Final State

### backend/src/models/userProfile.ts

```typescript
export interface ExtractedProfile {
  total_years_experience: number | null;
  current_role: string | null;
  role_history: Array<{
    title: string;
    company: string;
    duration_months: number;
    industry: string;
  }>;
  company_types: Array<'startup' | 'mid_size' | 'large' | 'enterprise'>;
  technical_skills: string[];
  soft_skills: string[];
  domain_skills: string[];
  pm_adjacent_skills: string[];
  education: Array<{ degree: string; institution: string; year: number }>;
  awards: string[];
  ai_ml_exposure: 'none' | 'basic' | 'working' | 'deep';
  stated_interests: string[];
  company_stage_preference: string[];
  geography_preference: string | null;
  confidence_flags: string[];
}
```

### backend/src/prompts/extractionPrompt.ts

```typescript
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
```

### backend/src/prompts/recommendationPrompt.ts

```typescript
export function buildRecommendationPrompt(
  userProfileJson: string,
  archetypesJson: string,
  companiesJson: string
): string {
  return `You are a PM career analyst. Given a structured user profile and PM role archetypes, calculate a fit score (0-100) for each archetype.

The user profile contains four skill arrays: technical_skills, domain_skills, soft_skills, and pm_adjacent_skills. You MUST match against ALL four arrays when calculating fit — not just technical_skills.

Scoring formula:
- (matched must_have_skills / total must_have_skills) × 60
- + (matched good_to_have_skills / total good_to_have_skills) × 25
- + (contextual_alignment: domain overlap + company type + years experience) × 15

Use semantic matching — "sql querying" matches "SQL and basic data querying", "agile" matches "Agile and Scrum methodology", etc.

For each archetype return a skills_delta with:
- matched_skills: user skills that appear in must_have_skills or good_to_have_skills for this role (exact or semantic match)
- missing_must_have: must_have_skills from the archetype that the user does NOT have
- missing_good_to_have: good_to_have_skills the user does not have
- transferable_skills: user skills that are NOT in the archetype's skills lists but are relevant and transferable to this PM role

Also return company_suggestions: select up to 8 companies from the provided list that match this role. Label each as apply_now (matches current skills) or apply_after_upskilling.

Return ONLY valid JSON in this format:
{
  "role_scores": [
    {
      "archetype_id": "string",
      "archetype_name": "string",
      "score": "number (0-100)",
      "skills_delta": {
        "matched_skills": ["string"],
        "missing_must_have": ["string"],
        "missing_good_to_have": ["string"],
        "transferable_skills": ["string"]
      },
      "company_suggestions": [
        { "company_name": "string", "label": "apply_now | apply_after_upskilling" }
      ]
    }
  ]
}

Do not generate company names — select only from the provided companies list.

User Profile: ${userProfileJson}
Archetypes: ${archetypesJson}
Companies: ${companiesJson}`;
}
```

### backend/src/services/extractionService.ts

Key changes:
- `domain_skills: responses.industries || []` (was `domain_expertise`)
- `pm_adjacent_skills: []` (new field, empty until LLM populates)
- 27 keyword list for rule-based skill extraction from CV text

### backend/src/services/recommendationService.ts

Key changes:
- Builds `userSkills` from union of all 4 arrays + legacy `domain_expertise` fallback
- Fuzzy substring matching: `lower.includes(us) || us.includes(lower)`
- Returns `skills_delta` per role with matched/missing/transferable
- Caps at 2 roles per category (Excellent Match >80, Need Some Work 50-80, Long Shot <50)

### frontend/src/pages/ResultsPage.tsx

Key changes:
- `RoleScore.skills_delta` replaces old `current_skills`/`skills_to_build`
- Skills panel reads `matched_skills`, `missing_must_have`, `missing_good_to_have`
- "Build My Roadmap" button in each ScoreCard links to `/roadmap/start?role_id=...`
- "Practice with AI Coach" button in header
- "What's next?" section removed

---

## Known Limitations (Rule-Based)

1. **False positive fuzzy matches**: "Strategy" matches "Pricing strategy", "Go-to-market strategy" — acceptable for MVP, LLM-2 will use semantic matching
2. **pm_adjacent_skills always empty**: Rule-based extractor doesn't populate this. LLM-1 will.
3. **Soft skills hardcoded**: Always returns `['Communication', 'Problem Solving', 'Stakeholder Management']`
4. **Company suggestions naive**: Takes first 8 companies regardless of role fit
5. **No semantic matching**: Can't match "data pipelines" → "Data pipeline and ETL understanding"

---

## What's Next: LLM Integration

### LLM-1 (Extraction)
- Replace rule-based `extractionService.ts` with Claude API call using `extractionPrompt.ts`
- Will properly populate all 4 skill arrays from CV text
- Will extract `pm_adjacent_skills` (currently empty)

### LLM-2 (Recommendation)
- Replace rule-based `recommendationService.ts` with Claude API call using `recommendationPrompt.ts`
- Will use semantic skill matching instead of substring
- Will produce more accurate scores and company suggestions

### Prerequisites
- Add `ANTHROPIC_API_KEY` to backend `.env`
- Install `@anthropic-ai/sdk` in backend
- Add retry/fallback logic for API failures
- Keep rule-based as fallback if LLM call fails

---

## Running the E2E Test

```bash
cd backend
npm run test:e2e
# Requires: backend running, Redis running, Supabase accessible
# Env vars: PMGPS_TEST_EMAIL, PMGPS_TEST_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
```
