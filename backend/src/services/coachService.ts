import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

const MAX_TURNS = 10;

// ── Prompts ─────────────────────────────────────────────

function buildCoachSystemPrompt(roleName: string, mode: string): string {
  const modeLabel =
    mode === 'case_study' ? 'a product case study' :
    mode === 'product_decision' ? 'a product decision' :
    'a feature brief or PRD';

  return `You are PM-GPS Coach, an expert Product Management coach specialising in the Indian tech industry. You are coaching this user as a ${roleName}.

The user is working through ${modeLabel}. They will share their thinking and you will give precise, structured feedback.

For EVERY response, return valid JSON with exactly this structure:
{
  "did_well": [
    { "point": "What the user did well", "reference": "Direct quote or paraphrase from their message that shows this" }
  ],
  "broke_down": [
    { "point": "Where thinking broke down", "why_it_matters": "Why this matters in practice", "reference": "The part of their message where this happened" }
  ],
  "next_time": ["Specific, actionable advice for next time"]
}

Rules:
- Be specific. Reference exact parts of what the user said.
- "did_well" must have at least 1 item — always find something positive.
- "broke_down" should identify genuine gaps, not nitpicks. 0 items is fine if the thinking was strong.
- "next_time" should be 1–3 concrete, actionable suggestions.
- Do NOT repeat the same feedback across turns. Build on prior feedback.
- Calibrate to ${roleName} standards — what would a hiring manager for this role expect?
- Keep each point concise (1–2 sentences).`;
}

function buildSummaryPrompt(
  roleName: string,
  turns: { user_message: string; coach_feedback: any }[]
): string {
  const conversation = turns
    .map((t, i) => `Turn ${i + 1}:\nUser: ${t.user_message}\nFeedback: ${JSON.stringify(t.coach_feedback)}`)
    .join('\n\n');

  return `You are PM-GPS Coach. A coaching session for a ${roleName} just ended. Here is the full conversation:

${conversation}

Write a concise session summary. Return valid JSON with exactly this structure:
{
  "strength": "The user's single strongest skill demonstrated across the session (1–2 sentences)",
  "gap": "The user's single biggest gap that came up repeatedly (1–2 sentences)",
  "practice": "One specific exercise they should do before their next session (2–3 sentences)",
  "main_gap": "A short label for the main gap, suitable for a badge (3-6 words)"
}`;
}

// ── Resolve role ────────────────────────────────────────
// Frontend sends role as a name string, not UUID

async function resolveRoleId(pmRoleIdOrName: string): Promise<{ id: string; name: string }> {
  // Try UUID first
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(pmRoleIdOrName)) {
    const { data, error } = await supabase
      .from('pm_role_archetypes')
      .select('id, name')
      .eq('id', pmRoleIdOrName)
      .single();
    if (error || !data) throw new AppError('PM role not found', 404, 'ROLE_NOT_FOUND');
    return data;
  }

  // Fall back to name lookup
  const { data, error } = await supabase
    .from('pm_role_archetypes')
    .select('id, name')
    .eq('name', pmRoleIdOrName)
    .single();
  if (error || !data) throw new AppError(`PM role "${pmRoleIdOrName}" not found`, 404, 'ROLE_NOT_FOUND');
  return data;
}

// ── Create Session ──────────────────────────────────────

export async function createCoachSession(
  userId: string,
  pmRoleIdOrName: string,
  mode: string,
  inputMethod: string
) {
  const validModes = ['case_study', 'product_decision', 'feature_brief'];
  if (!validModes.includes(mode)) {
    throw new AppError(`mode must be one of: ${validModes.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  const role = await resolveRoleId(pmRoleIdOrName);

  const { data: session, error } = await supabase
    .from('coach_sessions')
    .insert({
      user_id: userId,
      pm_role_id: role.id,
      mode,
      input_method: inputMethod || 'type',
      status: 'active',
      turns_used: 0,
      max_turns: MAX_TURNS,
    })
    .select('id')
    .single();

  if (error) throw new AppError(error.message, 500, 'DB_ERROR');

  return { session_id: session.id };
}

// ── Submit Turn ─────────────────────────────────────────

export async function submitTurn(
  sessionId: string,
  userId: string,
  content: string
) {
  // 1. Fetch session + verify ownership + active
  const { data: session, error: sessError } = await supabase
    .from('coach_sessions')
    .select('id, user_id, pm_role_id, mode, turns_used, max_turns, status')
    .eq('id', sessionId)
    .single();

  if (sessError || !session) {
    throw new AppError('Coach session not found', 404, 'SESSION_NOT_FOUND');
  }
  if (session.user_id !== userId) {
    throw new AppError('Not your session', 403, 'FORBIDDEN');
  }
  if (session.status !== 'active') {
    throw new AppError('Session has ended', 400, 'SESSION_ENDED');
  }
  if (session.turns_used >= MAX_TURNS) {
    throw new AppError(`Maximum ${MAX_TURNS} turns reached. Please end the session.`, 400, 'MAX_TURNS_EXCEEDED');
  }

  // 2. Fetch role name
  const { data: role } = await supabase
    .from('pm_role_archetypes')
    .select('name')
    .eq('id', session.pm_role_id)
    .single();

  const roleName = role?.name || 'Product Manager';

  // 3. Fetch conversation history from coach_turns
  const { data: priorTurns } = await supabase
    .from('coach_turns')
    .select('user_message, coach_feedback')
    .eq('coach_session_id', sessionId)
    .order('turn_number', { ascending: true });

  // 4. Generate rule-based feedback (LLM not configured)
  const turnCount = (priorTurns ?? []).length;
  const feedback = {
    did_well: [
      { point: 'You structured your thinking clearly', reference: content.slice(0, 80) },
    ],
    broke_down: turnCount === 0 ? [
      { point: 'Consider adding more specific metrics or data points', why_it_matters: 'Quantitative reasoning is key for PM roles', reference: 'Your overall response' },
    ] : [],
    next_time: [
      `Try framing your answer using the CIRCLES framework for ${roleName} scenarios`,
      'Include specific success metrics you would track',
    ],
  };

  const newTurnNumber = session.turns_used + 1;

  // 6. Insert turn
  const { error: turnError } = await supabase
    .from('coach_turns')
    .insert({
      coach_session_id: sessionId,
      turn_number: newTurnNumber,
      user_message: content,
      coach_feedback: feedback,
    });

  if (turnError) throw new AppError(turnError.message, 500, 'DB_ERROR');

  // 7. Update session turn count + auto-generate title on first turn
  const updates: Record<string, any> = { turns_used: newTurnNumber };
  if (newTurnNumber === 1) {
    updates.title = content.slice(0, 80) + (content.length > 80 ? '…' : '');
  }

  await supabase
    .from('coach_sessions')
    .update(updates)
    .eq('id', sessionId);

  // 8. Return feedback + remaining turns
  return {
    turn_number: newTurnNumber,
    turns_remaining: MAX_TURNS - newTurnNumber,
    feedback,
  };
}

// ── Get Session ─────────────────────────────────────────

export async function getCoachSession(sessionId: string, userId: string) {
  const { data: session, error } = await supabase
    .from('coach_sessions')
    .select('id, user_id, pm_role_id, mode, input_method, title, turns_used, max_turns, status, main_gap, strength_summary, gap_summary, practice_summary, completed_at, created_at')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    throw new AppError('Coach session not found', 404, 'SESSION_NOT_FOUND');
  }
  if (session.user_id !== userId) {
    throw new AppError('Not your session', 403, 'FORBIDDEN');
  }

  // Fetch role name
  const { data: role } = await supabase
    .from('pm_role_archetypes')
    .select('name')
    .eq('id', session.pm_role_id)
    .single();

  // Fetch all turns
  const { data: turns } = await supabase
    .from('coach_turns')
    .select('turn_number, user_message, coach_feedback, created_at')
    .eq('coach_session_id', sessionId)
    .order('turn_number', { ascending: true });

  // Build messages array matching frontend Message type
  const messages = (turns ?? []).flatMap((t) => [
    { id: `u_${t.turn_number}`, role: 'user' as const, content: t.user_message },
    { id: `c_${t.turn_number}`, role: 'coach' as const, feedback: t.coach_feedback },
  ]);

  return {
    session_id: session.id,
    title: session.title,
    mode: session.mode,
    role: role?.name || '',
    input_method: session.input_method,
    turns_used: session.turns_used,
    turns_remaining: MAX_TURNS - session.turns_used,
    status: session.status,
    messages,
    summary: session.status === 'completed' ? {
      strength: session.strength_summary,
      gap: session.gap_summary,
      practice: session.practice_summary,
    } : null,
  };
}

// ── End Session ─────────────────────────────────────────

export async function endCoachSession(sessionId: string, userId: string) {
  // Fetch session
  const { data: session, error: sessError } = await supabase
    .from('coach_sessions')
    .select('id, user_id, pm_role_id, mode, status')
    .eq('id', sessionId)
    .single();

  if (sessError || !session) {
    throw new AppError('Coach session not found', 404, 'SESSION_NOT_FOUND');
  }
  if (session.user_id !== userId) {
    throw new AppError('Not your session', 403, 'FORBIDDEN');
  }
  if (session.status === 'completed') {
    throw new AppError('Session already ended', 400, 'ALREADY_ENDED');
  }

  // Fetch role name
  const { data: role } = await supabase
    .from('pm_role_archetypes')
    .select('name')
    .eq('id', session.pm_role_id)
    .single();

  const roleName = role?.name || 'Product Manager';

  // Fetch all turns for summary
  const { data: turns } = await supabase
    .from('coach_turns')
    .select('user_message, coach_feedback')
    .eq('coach_session_id', sessionId)
    .order('turn_number', { ascending: true });

  let summary = { strength: '', gap: '', practice: '', main_gap: '' };

  if (turns && turns.length > 0) {
    // Rule-based summary (LLM not configured)
    summary = {
      strength: `You showed strong analytical thinking across ${turns.length} turn(s) as a ${roleName}.`,
      gap: 'Consider going deeper into quantitative analysis and user research methodology.',
      practice: `Pick a real product you use daily. Write a 1-page ${roleName} brief covering the problem, proposed solution, success metrics, and risks.`,
      main_gap: 'Quantitative depth',
    };
  }

  // Update session
  const { error: updateError } = await supabase
    .from('coach_sessions')
    .update({
      status: 'completed',
      strength_summary: summary.strength,
      gap_summary: summary.gap,
      practice_summary: summary.practice,
      main_gap: summary.main_gap,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (updateError) throw new AppError(updateError.message, 500, 'DB_ERROR');

  return {
    strength: summary.strength,
    gap: summary.gap,
    practice: summary.practice,
  };
}

// ── History ─────────────────────────────────────────────

export async function getCoachHistory(userId: string) {
  const { data: sessions, error } = await supabase
    .from('coach_sessions')
    .select('id, title, mode, pm_role_id, main_gap, created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new AppError(error.message, 500, 'DB_ERROR');

  // Batch-fetch role names
  const roleIds = [...new Set((sessions ?? []).map((s) => s.pm_role_id))];
  const { data: roles } = await supabase
    .from('pm_role_archetypes')
    .select('id, name')
    .in('id', roleIds);

  const roleMap = new Map((roles ?? []).map((r) => [r.id, r.name]));

  const modeLabels: Record<string, string> = {
    case_study: 'Case Study',
    product_decision: 'Product Decision',
    feature_brief: 'Feature Brief',
  };

  return (sessions ?? []).map((s) => ({
    id: s.id,
    title: s.title || 'Untitled session',
    mode: modeLabels[s.mode] || s.mode,
    role: roleMap.get(s.pm_role_id) || '',
    date: s.created_at?.split('T')[0] || '',
    main_gap: s.main_gap || '',
  }));
}

// ── Transcribe ──────────────────────────────────────────

export async function transcribeAudio(_audioBuffer: Buffer, _mimetype: string) {
  // Audio transcription requires a dedicated speech-to-text service.
  // Claude does not offer audio transcription. This feature needs a
  // separate provider (e.g. Deepgram, AssemblyAI, or Google Speech-to-Text).
  throw new AppError('Audio transcription is not yet configured', 501, 'NOT_IMPLEMENTED');
}
