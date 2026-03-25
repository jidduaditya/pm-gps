import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

const COMPANY_TYPE_DISPLAY: Record<string, string> = {
  startup: 'Startup',
  mid_size: 'Mid-size',
  large: 'Large',
  enterprise: 'Enterprise',
};

function normalizeToIndustry(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('fintech') || lower.includes('finance') || lower.includes('payment')) return 'Fintech';
  if (lower.includes('health') || lower.includes('medical') || lower.includes('pharma')) return 'Healthtech';
  if (lower.includes('saas') || lower.includes('software as a service')) return 'SaaS';
  if (lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('retail')) return 'E-commerce';
  if (lower.includes('edtech') || lower.includes('education') || lower.includes('learning')) return 'Edtech';
  if (lower.includes('logistics') || lower.includes('supply chain') || lower.includes('shipping')) return 'Logistics';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildIndustriesList(
  domainExpertise: string[] | null,
  roleHistory: Array<{ industry?: string }> | null
): string[] {
  const rawSources: string[] = [
    ...(domainExpertise ?? []),
    ...(roleHistory ?? []).map((r) => r.industry).filter((i): i is string => Boolean(i)),
  ];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of rawSources) {
    const normalized = normalizeToIndustry(raw);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

export const profileController = {
  getPrefill: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id } = req.params;

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    if (session.user_id !== req.user!.id) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('extracted_profile, confidence_flags')
      .eq('session_id', session_id)
      .single();

    if (profileError || !profile) {
      return res.json({ status: 'not_ready' });
    }

    const extracted = profile.extracted_profile as any;
    const lowConfidenceFields: string[] = profile.confidence_flags?.flags ?? [];
    const isLowConfidence = (field: string) => lowConfidenceFields.includes(field);

    const industries = buildIndustriesList(
      isLowConfidence('domain_expertise') ? null : extracted.domain_expertise,
      extracted.role_history
    );

    return res.json({
      current_role: isLowConfidence('current_role') ? null : (extracted.current_role ?? null),
      total_years_experience: isLowConfidence('total_years_experience') ? null : (extracted.total_years_experience ?? null),
      company_types: extracted.company_types?.length
        ? extracted.company_types.map((t: string) => COMPANY_TYPE_DISPLAY[t] ?? t)
        : null,
      industries: industries.length > 0 ? industries : null,
    });
  }),
};
