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
- transferable_skills: user skills that are NOT in the archetype's skills lists but are relevant and transferable to this PM role (e.g. a QA engineer's "test case design" is transferable to a Technical PM role)

Also return company_suggestions: select up to 8 companies from the provided list that match this role. Label each as apply_now (matches current skills) or apply_after_upskilling (matches current + required skills).

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
