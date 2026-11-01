// Build-time SEO: the app renders everything with JS, but search and AI
// crawlers (GPTBot, ClaudeBot, PerplexityBot...) mostly read raw HTML. This
// plugin writes the same content, from the same locales and data the app
// uses, as static HTML inside #root, plus llms.txt and a dated sitemap.
import { readFileSync } from "node:fs";
import { CASES, EXPERIENCES, PROCESS_STEPS, PROJECTS, STACK_GROUPS } from "../src/data/content.js";
import { CONTACTS } from "../src/data/contacts.js";

const SITE = "https://jose-hernandez.dev/";
const load = (lng) => JSON.parse(readFileSync(new URL(`../public/locales/${lng}/lang.json`, import.meta.url)));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const label = (t, name) => t[name] ?? name;

function staticHtml(t) {
  const steps = PROCESS_STEPS.map(
    (n) => `<li><h3>${esc(t[`process_step${n}_title`])}</h3><p>${esc(t[`process_step${n}_desc`])}</p><p>${esc(t.proof)} ${esc(t[`process_step${n}_proof`])}</p></li>`
  ).join("");
  const cases = CASES.map(
    (c) =>
      `<article><h4>${esc(t[`case_${c.id}_title`])} · ${esc(c.client)}</h4>` +
      ["problem", "solution", "result"].map((p) => `<p><strong>${esc(t[`case_${p}`])}:</strong> ${esc(t[`case_${c.id}_${p}`])}</p>`).join("") +
      `<p>${esc(c.tools.join(", "))}</p></article>`
  ).join("");
  const stack = STACK_GROUPS.map((g) => `<li><strong>${esc(t[g.key])}:</strong> ${esc(g.items.join(", "))}</li>`).join("");
  const jobs = EXPERIENCES.map((e) => `<li><h3>${esc(t[e.title])}</h3><p>${esc(t[e.date])}</p><p>${esc(t[e.description])}</p></li>`).join("");
  const projects = PROJECTS.map((p) => `<li><a href="${esc(p.urlProject)}">${esc(p.title)}</a></li>`).join("");
  const contacts = CONTACTS.map((c) => `<li><a href="${esc(c.url)}">${esc(label(t, c.name))}</a></li>`).join("");
  return `<div class="prerender">
<header><h1>José Hernández</h1><p>${esc(t.hero_kicker.replace(/^José Hernández · /, ""))}</p><p>${esc(t.hero_line1)} ${esc(t.hero_line2)}</p></header>
<main>
<section id="process"><h2>${esc(t.process_title)}</h2><p>${esc(t.process_lead)}</p><ol>${steps}</ol></section>
<section id="automation"><h2>${esc(t.ai_title)}</h2><p>${esc(t.ai_lead)}</p><p>${esc(t.ai_in_product)}</p><h3>${esc(t.cases_title)}</h3>${cases}</section>
<section id="stack"><h2>${esc(t.stack_title)}</h2><ul>${stack}</ul></section>
<section id="work"><h2>${esc(t.title_exp)}</h2><ol>${jobs}</ol><h2>${esc(t.title_projects)}</h2><ul>${projects}</ul></section>
<section id="contact"><h2>${esc(t.contact_title)}</h2><p>${esc(t.contact_about)}</p><ul>${contacts}</ul></section>
</main>
</div>`;
}

function llmsTxt(es, en) {
  const md = (t) =>
    [
      `## ${t.title_exp}`,
      ...EXPERIENCES.map((e) => `- **${t[e.title]}** (${t[e.date]}): ${t[e.description]}`),
      "",
      `## ${t.cases_title}`,
      ...CASES.map((c) => `- **${t[`case_${c.id}_title`]}** (${c.client}): ${t[`case_${c.id}_solution`]} ${t[`case_${c.id}_result`]}`),
      "",
      `## ${t.stack_title}`,
      ...STACK_GROUPS.map((g) => `- ${t[g.key]}: ${g.items.join(", ")}`),
    ].join("\n");
  return [
    "# José Hernández",
    "",
    `> ${es.contact_about}`,
    "",
    md(es),
    "",
    `## ${es.title_projects}`,
    ...PROJECTS.map((p) => `- [${p.title}](${p.urlProject})`),
    "",
    `## ${es.contact}`,
    ...CONTACTS.map((c) => `- [${label(es, c.name)}](${/^(https?:|mailto:)/.test(c.url) ? c.url : SITE + c.url.replace(/^\//, "")})`),
    `- [Portfolio](${SITE})`,
    "",
    "---",
    "",
    "# José Hernández (English)",
    "",
    `> ${en.contact_about}`,
    "",
    md(en),
    "",
  ].join("\n");
}

const sitemap = (date) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

export default function seoStatic() {
  return {
    name: "seo-static",
    transformIndexHtml(html) {
      return html.replace('<div id="root"></div>', `<div id="root">${staticHtml(load("es"))}</div>`);
    },
    generateBundle() {
      const es = load("es");
      const en = load("en");
      this.emitFile({ type: "asset", fileName: "llms.txt", source: llmsTxt(es, en) });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap(new Date().toISOString().slice(0, 10)) });
    },
  };
}
