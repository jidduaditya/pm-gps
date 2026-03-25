import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

// ── Types ───────────────────────────────────────────────

interface StageFromLLM {
  stage_number: number;
  name: string;
  duration: string;
  goal: string;
  practice: string;
  checkpoint: string;
  resources: { title: string; type: string; url: string }[];
}

interface RoadmapLLMResponse {
  stages: StageFromLLM[];
}

// ── System prompt ───────────────────────────────────────

function buildRoadmapPrompt(
  roleName: string,
  weakTopics: { topic: string; specific_gap: string }[],
  existingResources: { title: string; type: string; url: string }[]
): string {
  const weakList = weakTopics
    .map((w) => `- ${w.topic}: ${w.specific_gap}`)
    .join('\n');

  const resourcePool =
    existingResources.length > 0
      ? `\n\nAvailable verified resources (prefer these when relevant):\n${existingResources
          .map((r) => `- [${r.type}] ${r.title} — ${r.url}`)
          .join('\n')}`
      : '';

  return `You are PM-GPS, a career roadmap generator for Product Managers in the Indian tech industry.

A user targeting the "${roleName}" role just completed a diagnostic quiz.
Their weak areas are:

${weakList}

${resourcePool}

Generate a learning roadmap with 3 sequential stages that address these weaknesses, ordered by biggest gap first. Each stage should take 1–3 weeks.

For each stage, include:
- A short descriptive name (5-8 words)
- Duration estimate (e.g. "2–3 weeks")
- A one-sentence goal
- 3–5 learning resources (mix of Article, Book, Framework, Course, Video). Use real, well-known resources. Include URLs where possible.
- A hands-on practice prompt the user can complete
- A checkpoint question to self-assess understanding

Respond with ONLY valid JSON matching this exact schema:
{
  "stages": [
    {
      "stage_number": 1,
      "name": "string",
      "duration": "string",
      "goal": "string",
      "practice": "string",
      "checkpoint": "string",
      "resources": [
        { "title": "string", "type": "Article|Book|Framework|Course|Video", "url": "string" }
      ]
    }
  ]
}`;
}

// ── Generate Roadmap ────────────────────────────────────

export async function generateRoadmap(userId: string, quizSessionId: string) {
  // 1. Fetch quiz_session and verify ownership + completion
  const { data: quiz, error: quizError } = await supabase
    .from('quiz_sessions')
    .select('id, user_id, pm_role_id, topic_scores, weaknesses, status')
    .eq('id', quizSessionId)
    .single();

  if (quizError || !quiz) {
    throw new AppError('Quiz session not found', 404, 'QUIZ_NOT_FOUND');
  }
  if (quiz.user_id !== userId) {
    throw new AppError('Not your quiz session', 403, 'FORBIDDEN');
  }
  if (quiz.status !== 'completed') {
    throw new AppError('Quiz must be completed before generating a roadmap', 400, 'QUIZ_NOT_COMPLETED');
  }

  // 2. Fetch PM role
  const { data: role, error: roleError } = await supabase
    .from('pm_role_archetypes')
    .select('id, name')
    .eq('id', quiz.pm_role_id)
    .single();

  if (roleError || !role) {
    throw new AppError('PM role not found', 404, 'ROLE_NOT_FOUND');
  }

  // 3. Fetch existing resources from prior roadmaps for this role
  const { data: priorResources } = await supabase
    .from('roadmap_resources')
    .select('title, type, url, roadmap_stages!inner(roadmap_id, roadmaps!inner(pm_role_id))')
    .eq('roadmap_stages.roadmaps.pm_role_id', quiz.pm_role_id)
    .limit(30);

  const existingResources = (priorResources ?? []).map((r: any) => ({
    title: r.title,
    type: r.type,
    url: r.url || '',
  }));

  // Deduplicate by title
  const seen = new Set<string>();
  const uniqueResources = existingResources.filter((r) => {
    if (seen.has(r.title)) return false;
    seen.add(r.title);
    return true;
  });

  // 4. Build prompt and call Claude
  const weakTopics: { topic: string; specific_gap: string }[] = quiz.weaknesses || [];

  if (weakTopics.length === 0) {
    throw new AppError('No weaknesses found — roadmap not needed', 400, 'NO_WEAKNESSES');
  }

  // Rule-based roadmap generation (LLM not configured)
  const parsed: RoadmapLLMResponse = {
    stages: weakTopics.slice(0, 3).map((w, i) => ({
      stage_number: i + 1,
      name: `Master ${w.topic}`,
      duration: i === 0 ? '1–2 weeks' : '2–3 weeks',
      goal: `Close the gap in ${w.topic}: ${w.specific_gap}`,
      practice: `Find a real-world ${role.name} scenario involving ${w.topic}. Write a 1-page analysis covering the problem, your approach, and expected outcomes.`,
      checkpoint: `Can you explain ${w.topic} concepts and apply them to a ${role.name} interview question?`,
      resources: [
        ...(uniqueResources.filter(r => r.title.toLowerCase().includes(w.topic.toLowerCase())).slice(0, 2)),
        { title: `${w.topic} for Product Managers`, type: 'Article', url: '' },
        { title: `Cracking the PM Interview — ${w.topic}`, type: 'Book', url: '' },
        { title: `${w.topic} Frameworks`, type: 'Framework', url: '' },
      ].slice(0, 5),
    })),
  };

  if (parsed.stages.length === 0) {
    throw new AppError('No stages could be generated', 400, 'NO_STAGES');
  }

  // 5. Create roadmap record
  const { data: roadmap, error: roadmapError } = await supabase
    .from('roadmaps')
    .insert({
      user_id: userId,
      quiz_session_id: quizSessionId,
      pm_role_id: quiz.pm_role_id,
      role_name: role.name,
      status: 'active',
    })
    .select('id')
    .single();

  if (roadmapError) throw new AppError(roadmapError.message, 500, 'DB_ERROR');

  // 6. Insert stages
  const stageRows = parsed.stages.map((s) => ({
    roadmap_id: roadmap.id,
    stage_number: s.stage_number,
    name: s.name,
    duration: s.duration,
    goal: s.goal,
    practice: s.practice,
    checkpoint: s.checkpoint,
    status: 'not_started',
  }));

  const { data: insertedStages, error: stageError } = await supabase
    .from('roadmap_stages')
    .insert(stageRows)
    .select('id, stage_number');

  if (stageError) throw new AppError(stageError.message, 500, 'DB_ERROR');

  // 7. Insert resources, mapped to their stage IDs
  const stageIdMap = new Map(insertedStages!.map((s) => [s.stage_number, s.id]));

  const resourceRows: { stage_id: string; title: string; type: string; url: string }[] = [];
  for (const stage of parsed.stages) {
    const stageId = stageIdMap.get(stage.stage_number);
    if (!stageId) continue;
    for (const r of stage.resources || []) {
      resourceRows.push({
        stage_id: stageId,
        title: r.title,
        type: r.type,
        url: r.url || '',
      });
    }
  }

  if (resourceRows.length > 0) {
    const { error: resError } = await supabase
      .from('roadmap_resources')
      .insert(resourceRows);
    if (resError) throw new AppError(resError.message, 500, 'DB_ERROR');
  }

  // 8. Return full roadmap
  return buildRoadmapResponse(roadmap.id, role.name, role.id, parsed.stages);
}

// ── Get Roadmap ─────────────────────────────────────────

export async function getRoadmap(roadmapId: string, userId: string) {
  // Fetch roadmap + verify ownership
  const { data: roadmap, error: rmError } = await supabase
    .from('roadmaps')
    .select('id, user_id, pm_role_id, role_name, status')
    .eq('id', roadmapId)
    .single();

  if (rmError || !roadmap) {
    throw new AppError('Roadmap not found', 404, 'ROADMAP_NOT_FOUND');
  }
  if (roadmap.user_id !== userId) {
    throw new AppError('Not your roadmap', 403, 'FORBIDDEN');
  }

  // Fetch stages
  const { data: stages, error: stError } = await supabase
    .from('roadmap_stages')
    .select('id, stage_number, name, duration, goal, practice, checkpoint, status')
    .eq('roadmap_id', roadmapId)
    .order('stage_number', { ascending: true });

  if (stError) throw new AppError(stError.message, 500, 'DB_ERROR');

  // Fetch resources for all stages in one query
  const stageIds = (stages ?? []).map((s) => s.id);
  const { data: resources, error: resError } = await supabase
    .from('roadmap_resources')
    .select('stage_id, title, type, url')
    .in('stage_id', stageIds);

  if (resError) throw new AppError(resError.message, 500, 'DB_ERROR');

  // Group resources by stage_id
  const resourcesByStage = new Map<string, { title: string; type: string; url: string }[]>();
  for (const r of resources ?? []) {
    const list = resourcesByStage.get(r.stage_id) || [];
    list.push({ title: r.title, type: r.type, url: r.url || '' });
    resourcesByStage.set(r.stage_id, list);
  }

  return {
    roadmap_id: roadmap.id,
    role_name: roadmap.role_name,
    role_id: roadmap.pm_role_id,
    status: roadmap.status,
    stages: (stages ?? []).map((s) => ({
      stage_number: s.stage_number,
      name: s.name,
      duration: s.duration,
      status: s.status,
      goal: s.goal,
      resources: resourcesByStage.get(s.id) || [],
      practice: s.practice,
      checkpoint: s.checkpoint,
    })),
  };
}

// ── Update Stage ────────────────────────────────────────

export async function completeStage(
  roadmapId: string,
  userId: string,
  stageNumber: number
) {
  // Verify roadmap ownership
  const { data: roadmap, error: rmError } = await supabase
    .from('roadmaps')
    .select('id, user_id')
    .eq('id', roadmapId)
    .single();

  if (rmError || !roadmap) {
    throw new AppError('Roadmap not found', 404, 'ROADMAP_NOT_FOUND');
  }
  if (roadmap.user_id !== userId) {
    throw new AppError('Not your roadmap', 403, 'FORBIDDEN');
  }

  // Update the stage
  const { data: stage, error: stError } = await supabase
    .from('roadmap_stages')
    .update({
      status: 'complete',
      completed_at: new Date().toISOString(),
    })
    .eq('roadmap_id', roadmapId)
    .eq('stage_number', stageNumber)
    .select('id, stage_number, status')
    .single();

  if (stError || !stage) {
    throw new AppError('Stage not found', 404, 'STAGE_NOT_FOUND');
  }

  // Check if all stages are complete → mark roadmap complete
  const { data: allStages } = await supabase
    .from('roadmap_stages')
    .select('status')
    .eq('roadmap_id', roadmapId);

  const allComplete = (allStages ?? []).every((s) => s.status === 'complete');
  if (allComplete) {
    await supabase
      .from('roadmaps')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', roadmapId);
  }

  return { stage_number: stage.stage_number, status: stage.status };
}

// ── Helper ──────────────────────────────────────────────

function buildRoadmapResponse(
  roadmapId: string,
  roleName: string,
  roleId: string,
  stages: StageFromLLM[]
) {
  return {
    roadmap_id: roadmapId,
    role_name: roleName,
    role_id: roleId,
    status: 'active',
    stages: stages.map((s) => ({
      stage_number: s.stage_number,
      name: s.name,
      duration: s.duration,
      status: 'not_started',
      goal: s.goal,
      resources: (s.resources || []).map((r) => ({
        title: r.title,
        type: r.type,
        url: r.url || '',
      })),
      practice: s.practice,
      checkpoint: s.checkpoint,
    })),
  };
}
