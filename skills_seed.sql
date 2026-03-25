-- PM-GPS: Update pm_role_archetypes with real must-have and good-to-have skills
-- Run in Supabase SQL Editor. Uses UPDATE (not INSERT) — rows must already exist.

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "API design and documentation",
    "System architecture understanding",
    "Software development lifecycle (SDLC)",
    "Agile and Scrum methodology",
    "Technical PRD writing",
    "SQL and basic data querying",
    "A/B testing and experimentation",
    "Roadmap planning and prioritisation",
    "Stakeholder management",
    "Cross-functional team collaboration",
    "User story writing",
    "Technical feasibility assessment"
  ]',
  good_to_have_skills = '[
    "Cloud platform knowledge (AWS/GCP/Azure)",
    "CI/CD pipeline understanding",
    "REST and GraphQL API knowledge",
    "Basic coding ability (Python or JS)",
    "System design fundamentals",
    "DevOps tooling awareness",
    "Security and compliance basics",
    "Performance and scalability thinking"
  ]'
WHERE name = 'Technical PM';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "Funnel analysis and optimisation",
    "A/B testing and experimentation",
    "User acquisition metrics",
    "Retention and engagement analysis",
    "Product analytics (Amplitude/Mixpanel)",
    "Growth model and AARRR framework",
    "Conversion rate optimisation",
    "Cohort analysis",
    "North star metric definition",
    "SQL for data querying",
    "Cross-channel attribution",
    "Prioritisation frameworks (ICE/RICE)"
  ]',
  good_to_have_skills = '[
    "SEO and SEM fundamentals",
    "Email marketing and lifecycle campaigns",
    "Push notification strategy",
    "Viral loop design",
    "Statistical significance and p-values",
    "Feature flag and experimentation tooling",
    "Mobile app analytics",
    "Referral programme design"
  ]'
WHERE name = 'Growth PM';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "LLM and generative AI understanding",
    "Prompt engineering",
    "AI product failure mode analysis",
    "Model evaluation metrics (precision/recall/F1)",
    "Responsible AI and ethics",
    "AI feature specification",
    "Human-in-the-loop design",
    "Data requirements for AI features",
    "AI product metrics (acceptance rate/task completion)",
    "Stakeholder communication on AI limitations",
    "Hallucination and bias mitigation",
    "A/B testing AI features"
  ]',
  good_to_have_skills = '[
    "Fine-tuning and RAG pipeline understanding",
    "Vector database concepts",
    "Model deployment and MLOps basics",
    "AI regulatory landscape (EU AI Act)",
    "Multimodal AI product design",
    "AI cost and latency tradeoffs",
    "Python for AI prototyping",
    "OpenAI/Anthropic API usage"
  ]'
WHERE name = 'AI PM';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "Machine learning model lifecycle",
    "Training data quality and labelling",
    "Model evaluation and validation",
    "Feature engineering concepts",
    "A/B testing ML models",
    "Model versioning and rollback",
    "ML metrics (AUC/RMSE/accuracy)",
    "Cross-functional alignment with data scientists",
    "SQL and data pipeline understanding",
    "Experiment design for ML",
    "Bias and fairness in ML",
    "ML infrastructure basics"
  ]',
  good_to_have_skills = '[
    "Deep learning concepts",
    "MLflow or similar ML tracking tools",
    "Real-time vs batch inference tradeoffs",
    "Data drift and model degradation monitoring",
    "Statistical modelling fundamentals",
    "Python for data exploration",
    "Feature store concepts",
    "Shadow mode and canary deployments for ML"
  ]'
WHERE name = 'ML PM';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "CI/CD pipeline understanding",
    "DORA metrics (deployment frequency/MTTR/CFR/lead time)",
    "SLI/SLO/SLA definition",
    "Incident management and post-mortems",
    "Developer experience (DX) principles",
    "Toil reduction strategies",
    "Infrastructure as code concepts",
    "Observability and monitoring",
    "On-call culture and escalation design",
    "Agile and DevOps methodology",
    "Release management",
    "Security and compliance in delivery pipelines"
  ]',
  good_to_have_skills = '[
    "Kubernetes and containerisation basics",
    "Cloud cost optimisation",
    "Chaos engineering principles",
    "Platform engineering concepts",
    "FinOps fundamentals",
    "Feature flag management",
    "Site reliability engineering (SRE) practices",
    "Developer tooling evaluation"
  ]'
WHERE name = 'DevOps PM';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "Data pipeline and ETL understanding",
    "SQL (intermediate to advanced)",
    "Metric definition and governance",
    "Data product design (dashboards/APIs/datasets)",
    "Data quality management",
    "Data lineage and documentation",
    "Self-serve analytics design",
    "Stakeholder requirements for data products",
    "Data warehouse concepts (Snowflake/BigQuery/Redshift)",
    "KPI framework design",
    "Business intelligence tool knowledge",
    "Cross-functional data alignment"
  ]',
  good_to_have_skills = '[
    "dbt and data transformation",
    "Data observability tools (Monte Carlo/Great Expectations)",
    "Python for data exploration",
    "Real-time streaming data concepts",
    "Data governance and cataloguing",
    "ML feature store understanding",
    "Privacy-preserving analytics",
    "GDPR and data compliance"
  ]'
WHERE name = 'Data PM';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "API design and versioning",
    "Developer experience (DX) principles",
    "Platform adoption metrics",
    "Internal vs external customer management",
    "Build vs buy decision frameworks",
    "Platform governance and deprecation",
    "Multi-team dependency management",
    "Service level objectives",
    "Technical documentation",
    "Cross-functional roadmap alignment",
    "Platform abstraction and self-service design",
    "Scalability and reliability thinking"
  ]',
  good_to_have_skills = '[
    "Microservices architecture",
    "API marketplace design",
    "Developer portal design",
    "SDK and tooling strategy",
    "Billing and usage metering for platforms",
    "Open source contribution strategy",
    "Partner ecosystem management",
    "Event-driven architecture understanding"
  ]'
WHERE name = 'Platform PM';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "Product positioning and messaging",
    "Go-to-market strategy",
    "Competitive analysis and battlecards",
    "Sales enablement",
    "Customer segmentation",
    "Launch planning and execution",
    "Win/loss analysis",
    "Persona development",
    "Pricing strategy",
    "Product narrative and storytelling",
    "Cross-functional launch coordination",
    "Analyst and press relations"
  ]',
  good_to_have_skills = '[
    "Content marketing strategy",
    "Digital marketing fundamentals",
    "CRM and marketing automation",
    "Customer advisory boards",
    "Partner marketing",
    "Product demo and trial optimisation",
    "Community building",
    "Revenue enablement"
  ]'
WHERE name = 'Product Marketing Manager';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "Web analytics (GA4/Adobe Analytics)",
    "Conversion rate optimisation",
    "SEO fundamentals for PMs",
    "A/B and multivariate testing",
    "User journey mapping",
    "Omnichannel experience design",
    "Digital product metrics (sessions/bounce/CVR)",
    "Agile product development",
    "Customer segmentation",
    "UX and accessibility fundamentals",
    "CMS and digital platform management",
    "Personalisation strategy"
  ]',
  good_to_have_skills = '[
    "SEM and paid acquisition basics",
    "Tag management (GTM)",
    "Progressive web app concepts",
    "CDN and page performance basics",
    "Headless CMS architecture",
    "Email and push notification strategy",
    "Heat mapping and session recording tools",
    "Digital compliance (cookie consent/GDPR)"
  ]'
WHERE name = 'Digital PM';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "Multi-stakeholder management",
    "Enterprise sales cycle understanding",
    "Requirements gathering for complex accounts",
    "Customisation vs standardisation decision-making",
    "Customer success alignment",
    "Account expansion and upsell strategy",
    "Enterprise security and compliance knowledge",
    "Contract and procurement cycle understanding",
    "SLA management",
    "Executive stakeholder communication",
    "B2B product metrics (NRR/ARR/churn/NPS)",
    "Long release cycle management"
  ]',
  good_to_have_skills = '[
    "Salesforce and CRM integration awareness",
    "Enterprise integration patterns (SSO/SCIM/API)",
    "Implementation and onboarding process design",
    "Partner and reseller channel management",
    "Analyst relations (Gartner/Forrester)",
    "Professional services coordination",
    "Multi-tenant architecture understanding",
    "Procurement and legal negotiation basics"
  ]'
WHERE name = 'Enterprise/B2B PM';

---

UPDATE pm_role_archetypes
SET
  must_have_skills = '[
    "Consumer behaviour and psychology",
    "Mobile product design and patterns",
    "Retention and engagement metrics",
    "Viral loop and referral mechanics",
    "App store optimisation (ASO)",
    "Push notification strategy",
    "Cohort and funnel analysis",
    "User research and usability testing",
    "Consumer product metrics (DAU/MAU/retention/LTV)",
    "Rapid iteration and experimentation",
    "Personalisation and recommendation design",
    "Social features and network effects"
  ]',
  good_to_have_skills = '[
    "Mobile A/B testing tools",
    "Subscription and monetisation model design",
    "Live ops and content strategy",
    "Consumer trust and safety",
    "Internationalisation and localisation",
    "Accessibility for consumer apps",
    "Influencer and social growth strategy",
    "Consumer data privacy (GDPR/DPDP)"
  ]'
WHERE name = 'Consumer/B2C PM';
