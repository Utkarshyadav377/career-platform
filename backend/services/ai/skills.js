// Skill dictionary used for rule-based extraction and matching.
// canonical name -> [category, aliases]
const SKILLS = {
  Python: ['Languages', ['python']],
  JavaScript: ['Languages', ['javascript', 'js', 'es6']],
  TypeScript: ['Languages', ['typescript']],
  Java: ['Languages', ['java']],
  'C++': ['Languages', ['c++']],
  C: ['Languages', []],
  'C#': ['Languages', ['c#']],
  Go: ['Languages', ['golang']],
  Rust: ['Languages', ['rust']],
  SQL: ['Data', ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite']],
  MongoDB: ['Data', ['mongodb', 'mongo']],
  Redis: ['Data', ['redis']],
  Pandas: ['ML / Data Science', ['pandas']],
  NumPy: ['ML / Data Science', ['numpy']],
  'Scikit-learn': ['ML / Data Science', ['scikit-learn', 'sklearn', 'scikit learn']],
  'Machine Learning': ['ML / Data Science', ['machine learning', 'ml']],
  'Deep Learning': ['ML / Data Science', ['deep learning', 'neural network', 'neural networks', 'cnn', 'rnn', 'lstm']],
  NLP: ['ML / Data Science', ['nlp', 'natural language processing']],
  'Computer Vision': ['ML / Data Science', ['computer vision', 'opencv']],
  PyTorch: ['ML / Data Science', ['pytorch']],
  TensorFlow: ['ML / Data Science', ['tensorflow', 'keras']],
  XGBoost: ['ML / Data Science', ['xgboost', 'lightgbm']],
  Statistics: ['ML / Data Science', ['statistics', 'statistical', 'hypothesis testing']],
  'Data Visualization': ['ML / Data Science', ['matplotlib', 'seaborn', 'tableau', 'power bi', 'data visualization']],
  LLMs: ['GenAI', ['llm', 'llms', 'large language model', 'large language models', 'gpt', 'langchain', 'prompt engineering']],
  RAG: ['GenAI', ['rag', 'retrieval augmented generation', 'retrieval-augmented generation', 'vector database', 'faiss', 'pinecone', 'chromadb']],
  React: ['Web', ['react.js', 'reactjs']],
  'Node.js': ['Web', ['node.js', 'nodejs']],
  Express: ['Web', ['express.js', 'expressjs']],
  FastAPI: ['Web', ['fastapi']],
  Flask: ['Web', ['flask']],
  Django: ['Web', ['django']],
  'REST APIs': ['Web', ['restful', 'rest api', 'rest apis', 'restful apis']],
  'HTML/CSS': ['Web', ['html', 'css', 'tailwind', 'tailwind css']],
  'Next.js': ['Web', ['next.js', 'nextjs']],
  AWS: ['Cloud / DevOps', ['aws', 'amazon web services', 'ec2', 's3']],
  GCP: ['Cloud / DevOps', ['gcp', 'google cloud']],
  Azure: ['Cloud / DevOps', ['azure']],
  Docker: ['Cloud / DevOps', ['docker']],
  Kubernetes: ['Cloud / DevOps', ['kubernetes', 'k8s']],
  'CI/CD': ['Cloud / DevOps', ['ci/cd', 'github actions', 'jenkins']],
  Git: ['Cloud / DevOps', ['git', 'github']],
  Linux: ['Cloud / DevOps', ['linux']],
  'Data Structures & Algorithms': ['Fundamentals', ['data structures', 'algorithms', 'dsa', 'leetcode']],
  'System Design': ['Fundamentals', ['system design', 'distributed systems', 'microservices']],
  OOP: ['Fundamentals', ['oop', 'object oriented', 'object-oriented']],
  'Operating Systems': ['Fundamentals', ['operating systems', 'os concepts']],
  DBMS: ['Fundamentals', ['dbms', 'database management']],
  'Computer Networks': ['Fundamentals', ['computer networks', 'networking', 'tcp/ip']],
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');

// Aliases are authoritative (the canonical name is NOT auto-added) so ambiguous English words
// such as "go", "rest", "node" or "express" don't produce false positives.
const PATTERNS = {};
for (const [name, [, aliases]] of Object.entries(SKILLS)) {
  if (!aliases.length) continue;
  const alt = [...new Set(aliases)].sort((a, b) => b.length - a.length).map(escapeRe).join('|');
  PATTERNS[name] = new RegExp(`(?<![A-Za-z0-9+#.])(?:${alt})(?![A-Za-z0-9+#]|\\.[A-Za-z])`, 'i');
}

// Ambiguous bare words: only match capitalised, in a list-like context (e.g. "React, Node.js").
const CASE_SENSITIVE = {
  React: /(?<![A-Za-z])React(?![A-Za-z])(?=\s*[,/|;)]|\s+(?:and|&)\s+[A-Z]|\s*$|\s+(?:app|apps|component|components|hooks|frontend|front-end))/,
  Express: /(?<![A-Za-z])Express(?=\s*[,/|;)]|\s+(?:and|&)\s+(?:Mongo|Node|React|SQL)|\s*$)/,
  'Node.js': /(?<![A-Za-z])Node(?=\s*[,/|;)]|\s+(?:and|&)\s+[A-Z])/,
  Go: /(?<![A-Za-z])Go(?=\s*[,/|;)])/,
  Java: /(?<![A-Za-z])Java(?![A-Za-z])/,
};

const C_LANG = /(?:^|[\s,;/(])C(?=[\s,;/)]|$)(?!\+\+|#)/;

function extractSkills(text) {
  const found = [];
  for (const [name, pat] of Object.entries(PATTERNS)) {
    if (pat.test(text)) found.push(name);
  }
  for (const [name, pat] of Object.entries(CASE_SENSITIVE)) {
    if (!found.includes(name) && pat.test(text)) found.push(name);
  }
  if (C_LANG.test(text) && !found.includes('C')) found.push('C');
  return found;
}

const categoryOf = (skill) => (SKILLS[skill] ? SKILLS[skill][0] : 'Other');

module.exports = { SKILLS, extractSkills, categoryOf };
