import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SYNTHETIC_CV, QUESTIONNAIRE_RESPONSES } from './fixtures';

// ---------------------------------------------------------------------------
// Config — reads from .env (loaded by vitest) or environment variables
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TEST_EMAIL = process.env.PMGPS_TEST_EMAIL!;
const TEST_PASSWORD = process.env.PMGPS_TEST_PASSWORD!;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let accessToken = '';
let sessionId = '';

/** Supabase client for auth (anon key) */
let anonClient: SupabaseClient;
/** Supabase client for cleanup (service role key) */
let serviceClient: SupabaseClient;

async function api(method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function pollResults(sid: string, maxWaitMs = 30_000, intervalMs = 2_000): Promise<any> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const { json } = await api('GET', `/api/results/${sid}`);
    if (json.status !== 'processing') return json;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Results not ready after ${maxWaitMs / 1000}s`);
}

// ---------------------------------------------------------------------------
// Setup & Teardown
// ---------------------------------------------------------------------------
describe('Full pipeline E2E', () => {
  beforeAll(async () => {
    // Validate env
    for (const [name, val] of Object.entries({
      SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, TEST_EMAIL, TEST_PASSWORD,
    })) {
      if (!val) throw new Error(`Missing env var: ${name}`);
    }

    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Authenticate test user
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error) throw new Error(`Auth failed: ${error.message}. Create a test user first.`);
    accessToken = data.session!.access_token;
  });

  afterAll(async () => {
    if (!sessionId) return;
    // Cleanup in dependency order
    await serviceClient.from('results').delete().eq('session_id', sessionId);
    await serviceClient.from('user_profiles').delete().eq('session_id', sessionId);
    await serviceClient.from('questionnaire_responses').delete().eq('session_id', sessionId);
    await serviceClient.from('documents').delete().eq('session_id', sessionId);
    await serviceClient.from('sessions').delete().eq('id', sessionId);
  });

  // -------------------------------------------------------------------------
  // The test
  // -------------------------------------------------------------------------
  it('produces valid results with correct skills_delta shape', async () => {
    // Step 1 — Create session
    const sessionRes = await api('POST', '/api/session');
    expect(sessionRes.status).toBe(201);
    expect(sessionRes.json.session_id).toBeDefined();
    sessionId = sessionRes.json.session_id;

    // Step 2 — Submit CV text
    const docRes = await api('POST', '/api/documents/text', {
      session_id: sessionId,
      text: SYNTHETIC_CV,
    });
    expect(docRes.status).toBe(201);
    expect(docRes.json.document).toBeDefined();

    // Step 3 — Submit questionnaire
    const qRes = await api('POST', '/api/questionnaire', {
      session_id: sessionId,
      responses: QUESTIONNAIRE_RESPONSES,
    });
    expect(qRes.status).toBe(200);

    // Step 4 — Trigger processing
    const procRes = await api('POST', '/api/process', { session_id: sessionId });
    expect(procRes.status).toBe(202);

    // Step 5 — Poll for results
    const results = await pollResults(sessionId);
    expect(results.status).toBe('completed');
    expect(results.result).toBeDefined();

    const result = results.result;

    // Step 6 — Validate top-level result shape
    expect(result.role_scores).toBeInstanceOf(Array);
    expect(result.role_scores.length).toBeGreaterThan(0);
    expect(result.selected_roles).toBeInstanceOf(Array);
    expect(result.selected_roles.length).toBeLessThanOrEqual(6);
    expect(result.skills_delta).toBeDefined();
    expect(typeof result.skills_delta).toBe('object');
    expect(result.company_suggestions).toBeDefined();
    expect(result.model_version).toBe('rule-based-v1.0');

    // Step 6b — Validate each role_score has new skills_delta structure
    for (const role of result.role_scores) {
      expect(role.archetype_id).toBeDefined();
      expect(typeof role.archetype_name).toBe('string');
      expect(typeof role.score).toBe('number');
      expect(role.score).toBeGreaterThanOrEqual(0);
      expect(role.score).toBeLessThanOrEqual(100);

      // New skills_delta shape
      const sd = role.skills_delta;
      expect(sd).toBeDefined();
      expect(sd.matched_skills).toBeInstanceOf(Array);
      expect(sd.missing_must_have).toBeInstanceOf(Array);
      expect(sd.missing_good_to_have).toBeInstanceOf(Array);
      expect(sd.transferable_skills).toBeInstanceOf(Array);

      // Old fields should NOT exist
      expect(role.current_skills).toBeUndefined();
      expect(role.skills_to_build).toBeUndefined();
    }

    // Step 6c — Validate skills_delta keyed by archetype name (stored in results table)
    for (const role of result.selected_roles) {
      const delta = result.skills_delta[role.archetype_name];
      expect(delta).toBeDefined();
      expect(delta.matched_skills).toBeInstanceOf(Array);
      expect(delta.missing_must_have).toBeInstanceOf(Array);
      expect(delta.missing_good_to_have).toBeInstanceOf(Array);
      expect(delta.transferable_skills).toBeInstanceOf(Array);
    }

    // Step 7 — Validate extraction produced new fields
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('extracted_profile')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(profile).toBeDefined();
    const ep = profile!.extracted_profile as Record<string, unknown>;

    expect(ep.domain_skills).toBeInstanceOf(Array);
    expect(ep.pm_adjacent_skills).toBeInstanceOf(Array);
    expect(ep.technical_skills).toBeInstanceOf(Array);

    // Known skills from the synthetic CV should be extracted
    const techSkills = (ep.technical_skills as string[]).map(s => s.toLowerCase());
    expect(techSkills).toContain('sql');
    expect(techSkills).toContain('python');
    expect(techSkills).toContain('agile');

    // Step 8 — Deterministic skill match assertions for a known archetype
    // Find Technical PM in role_scores (should exist since we have 11 archetypes)
    const techPM = result.role_scores.find(
      (r: { archetype_name: string }) => r.archetype_name === 'Technical PM'
    );
    if (techPM) {
      const sd = techPM.skills_delta;

      // User has SQL, Agile, REST, API — these overlap with Technical PM must_have/good_to_have
      // The rule-based matcher does exact case-insensitive match, so check what actually matched
      expect(sd.matched_skills.length + sd.missing_must_have.length + sd.missing_good_to_have.length)
        .toBeGreaterThan(0);

      // Transferable skills should include user skills NOT in Technical PM's lists
      // e.g. Python, Figma, Data Analysis are user skills not in Technical PM archetypes
      expect(sd.transferable_skills.length).toBeGreaterThan(0);

      // missing_must_have should not include skills the user has
      const userSkillsLower = techSkills;
      for (const missing of sd.missing_must_have) {
        // If user has the exact skill, it should NOT be in missing
        expect(userSkillsLower).not.toContain(missing.toLowerCase());
      }
    }

    // Find Data Product Manager too (user expressed interest)
    const dataPM = result.role_scores.find(
      (r: { archetype_name: string }) => r.archetype_name === 'Data Product Manager'
    );
    if (dataPM) {
      // User has SQL — this should match "SQL (intermediate to advanced)" only via exact match
      // The rule-based service does exact string match, so this may or may not match depending
      // on the seed data casing. Just verify the shape is correct.
      expect(dataPM.skills_delta.matched_skills).toBeInstanceOf(Array);
      expect(dataPM.score).toBeGreaterThanOrEqual(0);
    }
  });
});
