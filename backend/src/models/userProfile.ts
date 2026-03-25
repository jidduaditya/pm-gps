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
