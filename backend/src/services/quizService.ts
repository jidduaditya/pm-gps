import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

// ── Start Quiz ──────────────────────────────────────────

export async function startQuiz(userId: string, pmRoleId: string) {
  // 1. Validate the PM role exists
  const { data: role, error: roleError } = await supabase
    .from('pm_role_archetypes')
    .select('id, name')
    .eq('id', pmRoleId)
    .single();

  if (roleError || !role) {
    throw new AppError('PM role not found', 404, 'ROLE_NOT_FOUND');
  }

  // 2. Fetch 10 random questions for this role
  //    Supabase doesn't support ORDER BY random(), so fetch all and shuffle in code
  const { data: allQuestions, error: qError } = await supabase
    .from('quiz_questions')
    .select('id, topic, question_number, question_text, options, explanation')
    .eq('pm_role_id', pmRoleId);

  if (qError) throw new AppError(qError.message, 500, 'DB_ERROR');
  if (!allQuestions || allQuestions.length === 0) {
    throw new AppError('No questions available for this role', 404, 'NO_QUESTIONS');
  }

  // Fisher-Yates shuffle, take first 10
  const shuffled = [...allQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const selected = shuffled.slice(0, 10);

  // 3. Create quiz_session record
  const { data: session, error: sessError } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      pm_role_id: pmRoleId,
      answers: {},
      status: 'in_progress',
    })
    .select('id')
    .single();

  if (sessError) throw new AppError(sessError.message, 500, 'DB_ERROR');

  // 4. Return questions without correct_answer (it's already excluded from select)
  return {
    quiz_id: session.id,
    role_name: role.name,
    questions: selected.map((q) => ({
      id: q.id,
      topic: q.topic,
      question_number: q.question_number,
      question_text: q.question_text,
      options: q.options,
    })),
  };
}

// ── Submit Quiz ─────────────────────────────────────────

export async function submitQuiz(
  quizId: string,
  userId: string,
  answers: Record<string, string>
) {
  // 1. Fetch quiz_session and verify ownership
  const { data: session, error: sessError } = await supabase
    .from('quiz_sessions')
    .select('id, user_id, pm_role_id, status')
    .eq('id', quizId)
    .single();

  if (sessError || !session) {
    throw new AppError('Quiz session not found', 404, 'QUIZ_NOT_FOUND');
  }
  if (session.user_id !== userId) {
    throw new AppError('Not your quiz session', 403, 'FORBIDDEN');
  }
  if (session.status === 'completed') {
    throw new AppError('Quiz already submitted', 400, 'ALREADY_SUBMITTED');
  }

  // 2. Fetch all questions for this role (with correct_answer)
  const { data: questions, error: qError } = await supabase
    .from('quiz_questions')
    .select('id, topic, question_text, options, correct_answer, explanation')
    .eq('pm_role_id', session.pm_role_id);

  if (qError) throw new AppError(qError.message, 500, 'DB_ERROR');

  const questionMap = new Map(questions!.map((q) => [q.id, q]));

  // 3. Score: exact match A/B/C/D
  let totalCorrect = 0;
  const topicResults: Record<string, { correct: number; total: number }> = {};

  for (const [questionId, userAnswer] of Object.entries(answers)) {
    const q = questionMap.get(questionId);
    if (!q) continue;

    if (!topicResults[q.topic]) {
      topicResults[q.topic] = { correct: 0, total: 0 };
    }
    topicResults[q.topic].total += 1;

    const isCorrect =
      userAnswer.toUpperCase().trim() === q.correct_answer.toUpperCase().trim();
    if (isCorrect) {
      totalCorrect += 1;
      topicResults[q.topic].correct += 1;
    }
  }

  // 4. Calculate topic_scores, strengths, weaknesses
  const topicScores = Object.entries(topicResults).map(([topic, { correct, total }]) => ({
    topic,
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
  }));

  const strengths = topicScores
    .filter((t) => t.score >= 70)
    .map((t) => ({
      topic: t.topic,
      explanation: `Scored ${t.score}% — solid understanding of ${t.topic}.`,
    }));

  const weaknesses = topicScores
    .filter((t) => t.score < 70)
    .map((t) => {
      // Find a missed question in this topic to surface as the specific gap
      const missedQ = questions!.find((q) => {
        if (q.topic !== t.topic) return false;
        const userAns = answers[q.id];
        return userAns && userAns.toUpperCase().trim() !== q.correct_answer.toUpperCase().trim();
      });
      return {
        topic: t.topic,
        specific_gap: missedQ?.explanation || `Needs improvement in ${t.topic} (scored ${t.score}%).`,
      };
    });

  // 5. Build answer review for frontend
  const questionsReview = Object.entries(answers).map(([questionId, userAnswer]) => {
    const q = questionMap.get(questionId);
    if (!q) return null;
    return {
      id: q.id,
      text: q.question_text,
      options: q.options as string[],
      correct: q.correct_answer.toUpperCase().trim(),
      user_answer: userAnswer.toUpperCase().trim(),
      explanation: q.explanation,
    };
  }).filter(Boolean);

  // 6. Update quiz_session with results
  const { error: updateError } = await supabase
    .from('quiz_sessions')
    .update({
      answers,
      score: totalCorrect,
      topic_scores: topicScores,
      strengths,
      weaknesses,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', quizId);

  if (updateError) throw new AppError(updateError.message, 500, 'DB_ERROR');

  return {
    quiz_id: quizId,
    score: totalCorrect,
    total: Object.keys(answers).length,
    topic_scores: topicScores,
    strengths,
    weaknesses,
    questions_review: questionsReview,
  };
}
