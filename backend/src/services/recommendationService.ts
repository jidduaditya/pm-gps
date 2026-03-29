import { supabase } from '../lib/supabase';
import { getSocketIO } from './socketService';

const MODEL_VERSION = 'rule-based-v1.0';

type ScoreCategory = 'Excellent Match' | 'Need Some Work' | 'Long Shot';

function categorise(score: number): ScoreCategory {
  if (score > 80) return 'Excellent Match';
  if (score >= 50) return 'Need Some Work';
  return 'Long Shot';
}

export async function runRecommendationJob(session_id: string) {
  try {
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (profileError || !userProfile) throw new Error('User profile not found');

    const profile = userProfile.extracted_profile as any;

    const { data: archetypes, error: archetypesError } = await supabase
      .from('pm_role_archetypes')
      .select('*');
    if (archetypesError) throw new Error(archetypesError.message);

    const geographyFilter = profile.geography_preference;

    let companiesQuery = supabase.from('companies').select('*').eq('is_active', true);
    if (geographyFilter) {
      companiesQuery = companiesQuery.ilike('geography', `%${geographyFilter}%`);
    }
    const { data: companies, error: companiesError } = await companiesQuery;
    if (companiesError) throw new Error(companiesError.message);

    // Rule-based scoring (no LLM required)
    const allUserSkillArrays = [
      ...(profile.technical_skills || []),
      ...(profile.domain_skills || profile.domain_expertise || []),
      ...(profile.soft_skills || []),
      ...(profile.pm_adjacent_skills || []),
    ];
    const userSkills = new Set(allUserSkillArrays.map((s: string) => s.toLowerCase()));
    const userInterests = new Set((profile.stated_interests || []).map((s: string) => s.toLowerCase()));
    const yearsExp = profile.total_years_experience || 3;

    const userSkillsArr = Array.from(userSkills);
    function fuzzyMatch(archetypeSkill: string): boolean {
      const lower = archetypeSkill.toLowerCase();
      return userSkills.has(lower) || userSkillsArr.some(us => lower.includes(us) || us.includes(lower));
    }

    const roleScores: any[] = (archetypes ?? []).map((arch: any) => {
      const mustHave: string[] = arch.must_have_skills || [];
      const goodToHave: string[] = arch.good_to_have_skills || [];

      const matchedMustHave = mustHave.filter(s => fuzzyMatch(s));
      const matchedGoodToHave = goodToHave.filter(s => fuzzyMatch(s));
      const matchedSkills = [...matchedMustHave, ...matchedGoodToHave];
      const missingMustHave = mustHave.filter(s => !fuzzyMatch(s));
      const missingGoodToHave = goodToHave.filter(s => !fuzzyMatch(s));

      const allArchSkillsLower = [...mustHave, ...goodToHave].map(s => s.toLowerCase());
      const transferableSkills = allUserSkillArrays.filter((s: string) => {
        const sl = s.toLowerCase();
        return !allArchSkillsLower.some(as => as.includes(sl) || sl.includes(as));
      });

      const interestBoost = userInterests.has(arch.name.toLowerCase()) ? 10 : 0;
      const expBoost = Math.min(yearsExp, 10) * 1.5;

      const score = Math.min(100, Math.round(
        (mustHave.length > 0 ? (matchedMustHave.length / mustHave.length) * 60 : 30) +
        (goodToHave.length > 0 ? (matchedGoodToHave.length / goodToHave.length) * 25 : 12) +
        expBoost + interestBoost
      ));

      const matchedCompanies = (companies ?? []).slice(0, 8).map((c: any) => ({
        company_name: c.name || c.company_name,
        label: score > 60 ? 'apply_now' : 'apply_after_upskilling',
      }));

      return {
        archetype_id: arch.id,
        archetype_name: arch.name,
        score,
        skills_delta: {
          matched_skills: matchedSkills,
          missing_must_have: missingMustHave,
          missing_good_to_have: missingGoodToHave,
          transferable_skills: transferableSkills,
        },
        company_suggestions: matchedCompanies,
      };
    });

    const buckets: Record<ScoreCategory, any[]> = {
      'Excellent Match': [],
      'Need Some Work': [],
      'Long Shot': [],
    };

    for (const role of roleScores) {
      const category = categorise(role.score);
      buckets[category].push({ ...role, category });
    }

    const selectedRoles: any[] = [];
    for (const [category, roles] of Object.entries(buckets)) {
      const top2 = roles.sort((a, b) => b.score - a.score).slice(0, 2);
      selectedRoles.push(...top2);
    }

    const skillsDelta: Record<string, any> = {};
    for (const role of selectedRoles) {
      skillsDelta[role.archetype_name] = role.skills_delta;
    }

    const companySuggestions: Record<string, any> = {};
    for (const role of selectedRoles) {
      companySuggestions[role.archetype_name] = role.company_suggestions;
    }

    const { error: resultError } = await supabase.from('results').insert({
      session_id,
      role_scores: roleScores,
      selected_roles: selectedRoles,
      skills_delta: skillsDelta,
      company_suggestions: companySuggestions,
      model_version: MODEL_VERSION,
    });
    if (resultError) throw new Error(resultError.message);

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', session_id);
    if (updateError) throw new Error(updateError.message);

    const io = getSocketIO();
    io.to(session_id).emit('results_ready', { session_id });

  } catch (err: any) {
    console.error(`[RecommendationService] session=${session_id} error=${err.message}`);
    await supabase.from('sessions').update({ status: 'failed' }).eq('id', session_id);

    const io = getSocketIO();
    io.to(session_id).emit('processing_failed', { session_id });

    throw err;
  }
}
