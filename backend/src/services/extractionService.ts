import { Job } from 'bullmq';
import { supabase } from '../lib/supabase';
import { recommendationQueue } from './queueService';
import { getSocketIO } from './socketService';

const EXTRACTION_VERSION = 'v1.0-mock';

export async function runExtractionJob(job: Job) {
  const { session_id } = job.data;

  try {
    const [{ data: documents, error: docsError }, { data: questionnaire }] = await Promise.all([
      supabase.from('documents').select('*').eq('session_id', session_id),
      supabase.from('questionnaire_responses').select('*').eq('session_id', session_id).single(),
    ]);

    if (docsError) throw new Error(docsError.message);

    const cvText = (documents ?? []).map((d: any) => d.raw_text || '').join('\n\n');
    const responses = (questionnaire?.responses || {}) as Record<string, any>;

    // Build extracted profile from questionnaire + CV text (no LLM needed)
    const extracted: Record<string, any> = {
      total_years_experience: parseExperience(responses.experience),
      current_role: responses.current_role || 'Professional',
      role_history: [{ title: responses.current_role || 'Professional', company: 'Current Company', duration_months: parseExperience(responses.experience) * 12, industry: (responses.industries || [])[0] || 'Technology' }],
      company_types: responses.company_types || [],
      technical_skills: extractSkillsFromText(cvText),
      soft_skills: ['Communication', 'Problem Solving', 'Stakeholder Management'],
      domain_skills: responses.industries || [],
      pm_adjacent_skills: [],
      education: [],
      awards: [],
      ai_ml_exposure: mapAiExposure(responses.ai_exposure),
      stated_interests: responses.target_archetypes || [],
      company_stage_preference: responses.preferred_company_stage || [],
      geography_preference: responses.geography || 'Pan-India',
      confidence_flags: [],
    };

    const { error: insertError } = await supabase.from('user_profiles').insert({
      session_id,
      extracted_profile: extracted,
      extraction_version: EXTRACTION_VERSION,
      confidence_flags: { flags: [] },
    });
    if (insertError) throw new Error(insertError.message);

    await recommendationQueue.add('recommend', { session_id }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    });

  } catch (err: any) {
    console.error(`[ExtractionService] session=${session_id} error=${err.message}`);
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ status: 'failed' })
      .eq('id', session_id);
    if (updateError) console.error(`[ExtractionService] failed to update session status: ${updateError.message}`);

    const io = getSocketIO();
    io.to(session_id).emit('processing_failed', { session_id });

    throw err;
  }
}

function parseExperience(exp: string | undefined): number {
  if (!exp) return 3;
  if (exp.includes('10')) return 12;
  if (exp.includes('6')) return 8;
  if (exp.includes('3')) return 4;
  return 1;
}

function mapAiExposure(exposure: string | undefined): string {
  if (!exposure) return 'none';
  if (exposure.includes('Built')) return 'deep';
  if (exposure.includes('Used')) return 'working';
  if (exposure.includes('Basic')) return 'basic';
  return 'none';
}

function extractSkillsFromText(text: string): string[] {
  const skillKeywords = ['JavaScript', 'Python', 'SQL', 'React', 'Node', 'TypeScript', 'Java', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum', 'JIRA', 'Figma', 'Analytics', 'Data Analysis', 'Machine Learning', 'Product Management', 'Strategy', 'Leadership', 'API', 'REST', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Redis'];
  const lower = text.toLowerCase();
  const found = skillKeywords.filter(s => lower.includes(s.toLowerCase()));
  return found.length > 0 ? found : ['Problem Solving', 'Analytical Thinking', 'Communication'];
}
