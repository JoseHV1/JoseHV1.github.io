// Content structure shared by the DOM sections and the 3D scene.
// The copy itself lives in public/locales/{es,en}/lang.json.

export const PROCESS_STEPS = [1, 2, 3, 4, 5, 6];

// The agent session shown in the AI section: real commands and conventions.
export const AI_SESSION = [
  { cmd: "brainstorm · spec · plan", note: "term_spec" },
  { cmd: "/investigate-first", note: "term_investigate" },
  { cmd: "/surgical-patch", note: "term_patch" },
  { cmd: "/replicar-prod", note: "term_prod" },
  { cmd: "/code-review", note: "term_review" },
  { cmd: "/verify", note: "term_verify" },
];
export const AI_CONTEXT = [
  { label: "ctx", text: "term_ctx" },
  { label: "skills", text: "term_skills" },
  { label: "mcp", text: "term_mcp" },
  { label: "lean", text: "term_lean" },
  { label: "rules", text: "term_rules" },
];

export const CASES = [
  { id: "meddocs", client: "QSM", tools: ["n8n", "AI", "Gmail", "Google Drive", "Google Sheets", "SuiteCRM"] },
  { id: "midoctor", client: "QSM", tools: ["Angular", "NestJS", "PostgreSQL", "AWS"] },
  { id: "masterbook", client: "QSM", tools: ["Angular", "NestJS", "MongoDB"] },
  { id: "aws", client: "QSM", tools: ["EC2", "S3", "Lambda", "RDS", "VPC"] },
  { id: "docs", client: "Grupo GDA", tools: ["n8n", "Gemini", "Google Drive", "Google Sheets"] },
  { id: "legacy", client: "Grupo GDA", tools: ["Laravel", "PHP", "MySQL", "Angular"] },
  { id: "compress", client: "Vulister", tools: ["Laravel", "JavaScript"] },
  { id: "ui", client: "Fela", tools: ["Angular", "PrimeNG", "Figma", "SCSS"] },
];

export const STACK_GROUPS = [
  {
    key: "stack_group_prod",
    items: ["Laravel", "PHP", "Angular", "TypeScript", "Vue", "Livewire", "NestJS", "WordPress", "MySQL", "PostgreSQL", "MongoDB", "REST APIs"],
  },
  { key: "stack_group_auto", items: ["n8n", "Power Automate", "SuiteCRM", "Gemini", "Claude Code", "Prompt Engineering"] },
  { key: "stack_group_tools", items: ["Git", "GitHub", "GitLab", "Figma", "Postman", "Jira", "Scrum"] },
  { key: "stack_group_cloud", items: ["AWS EC2", "S3", "Lambda", "RDS", "VPC"] },
  { key: "stack_group_learning", items: ["Node.js"] },
];

export const EXPERIENCES = [5, 4, 0, 1, 2, 3].map((n) => ({
  id: `exp${n}`,
  date: `date_exp${n}`,
  title: `title_exp${n}`,
  description: `description_exp${n}`,
}));
