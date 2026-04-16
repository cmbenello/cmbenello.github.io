export const ABOUT_PARAGRAPHS = [
  "I'm a software engineer and systems researcher at the University of Chicago, currently interning at Alter Domus where I improve internal and client-facing AI systems for financial asset management. My background spans database internals, high-performance computing, and full-stack development.",
  "I design and implement large-scale systems - from parallel sorting algorithms in Rust to GPU-accelerated query processing in CUDA to production AI pipelines in Python. I've published in VLDB and CIDR, working with Professor Aaron Elmore at UChicago's ChiData Lab and Professor Anastasia Ailamaki at EPFL's DIAS Lab.",
];

export const EDUCATION = [
  {
    school: "University of Chicago",
    degree: "Master's degree",
    field: "Financial Mathematics",
    dates: "Jun 2025 - Dec 2026",
    notes: "",
  },
  {
    school: "University of Chicago",
    degree: "BS",
    field:
      "Mathematics and Computer Science (Systems specialization); Minor in Korean",
    dates: "Sep 2021 - Jun 2025",
    notes: "Dean's List",
  },
  {
    school: "St Paul's School",
    degree: "",
    field: "",
    dates: "2015 - 2021",
    notes: "Mathematics: A*; Further Mathematics: A*; Computer Science: D1",
  },
];

export const CURRENT_WORK = [
  "Research: adaptive sort configuration across disaggregated and cloud-native hardware",
  "Research: GPU-accelerated compression for analytical databases",
  "Evaluating policy compliance gaps in Rust LLM code generation benchmarks",
  "CovTSP: near-optimal transit coverage solver using real GTFS network data",
  "New IDE interface designed around LLM-assisted development workflows",
];

export const EXPERIENCE = [
  {
    title: "Database Research Assistant",
    company: "ChiData Research Lab",
    dates: "Aug 2023 - Present",
    logo: "/logos/chidata.png",
    description:
      "Two published papers (VLDB, CIDR) and ongoing research on external sort - building predictive models for sort configuration on disaggregated and cloud-native hardware, with prior work on resource-adaptive query execution and engine internals.",
    highlights: [
      "First-authored CrocSort (VLDB 2026): a parallel external merge sort that completes under tight memory budgets where PostgreSQL, DuckDB, and ClickHouse abort, by jointly planning memory and phase-specific thread counts",
      "Co-authored Resource-Adaptive Query Execution with Paged Memory Management (CIDR 2025): enabling query execution to adapt to available memory at runtime",
      "Building a predictive model for CrocSort's configuration knobs on disaggregated and cloud-native hardware - recommending near-optimal (memory, threads) configs without brute-force sweeps, with small-scale calibration transferring to production within ~3% of optimal",
      "Implemented Small String Optimization for more compact string storage, reducing memory usage by 40% and improving query speeds",
    ],
    skills: ["Rust", "DuckDB", "Query Optimization", "Parallel Programming", "Performance Modelling"],
    papers: [
      { label: "CrocSort - VLDB 2026", url: "https://github.com/rotaki/ES" },
      { label: "Resource-Adaptive Query Execution - CIDR 2025", url: "https://vldb.org/cidrdb/papers/2025/p2-otaki.pdf" },
      { label: "Getting the Most Out of External Sorting - HPTS 2026" },
    ],
  },
  {
    title: "Software Engineering Intern",
    company: "Alter Domus",
    dates: "Mar 2026 - Present",
    logo: "/logos/alterdomus.png",
    description:
      "Improving internal and client-facing AI systems for a financial asset management platform: reducing hallucinations, adding personalization, cutting LLM inference costs, and increasing extraction accuracy and response speed.",
    highlights: [
      "Built an LLM-as-a-Judge evaluation framework with automated benchmarks for faithfulness, numerical accuracy, and completeness, creating a benchmark suite to evaluate extraction quality across document types",
      "Architected a multi-stage extraction pipeline for 100+ page financial documents (prospectuses, capital calls, regulatory filings), lifting accuracy from ~50% baseline to 92-97% through schema-enforced output and cross-reference verification",
      "Reduced LLM inference costs and improved response speed through context optimization and pipeline restructuring",
      "Added personalization capabilities to the client-facing AI assistant for tailored portfolio insights",
    ],
    skills: ["Python", "LLM Evaluation", "RAG", "Document Processing", "System Design"],
  },
  {
    title: "Quantitative Researcher",
    company: "PayPal",
    dates: "Mar 2026 - Present",
    logo: "/logos/paypal.png",
    description:
      "Exploring representation design and architecture choices for a transaction foundation model in a PayPal x UChicago collaboration - investigating how to encode financial transactions for self-supervised pretraining that generalizes across markets without labeled data.",
    highlights: [
      "Comparing multi-token vs. single-token encoding strategies and time-delta approaches (score-relative vs. inter-event) to find optimal transaction representations over 24M+ transactions",
      "Benchmarking BERT-style masked prediction against GPT-style next-token prediction architectures, with ablations across tokenization, time encoding, and context window size",
      "Built end-to-end data pipeline (CSV to Parquet to tokenized PyTorch datasets) with user-level splits, sliding-window batching, and automated vocabulary construction",
      "Evaluating learned embeddings against traditional ML baselines (XGBoost, MLP) on downstream fraud detection with highly imbalanced data (~0.12% positive rate)",
    ],
    skills: ["PyTorch", "Transformers", "Python", "XGBoost", "Self-Supervised Learning"],
  },
  {
    title: "Quantitative Researcher",
    company: "Bank of America",
    dates: "Sept - Dec 2025",
    logo: "/logos/bofa.png",
    description:
      "Quantitative research through the University of Chicago's Project Lab. Built AI-powered infrastructure for optimizing Bank of America's HQLA (High Quality Liquid Assets) portfolio - generating forward-looking risk scenarios, modeling macro shocks, and surfacing reallocation suggestions through agentic pipelines.",
    highlights: [
      "Engineered a multi-agent debate (MAD) system where competing LLM agents generate and challenge macro stress scenarios, producing probability-weighted portfolio reallocation recommendations",
      "Built a daily UST yield curve ingestion pipeline pulling real-time market, macro, and news data into structured curve snapshots used as model inputs",
      "Prototyped liquidity coverage and profitability risk metrics, and developed a FastAPI service exposing the optimizer to downstream dashboards",
      "Shipped full-stack interfaces: a Next.js scenario explorer, a Flask yield curve dashboard, and a React Native mobile app for on-the-go portfolio monitoring",
    ],
    skills: ["LLM Agents", "Python", "Quantitative Finance", "Risk Modeling", "Next.js", "React Native"],
    link: { label: "View Repository", url: "https://github.com/cmbenello/bofa_hqla" },
  },
  {
    title: "GPU Systems Researcher",
    company: "EPFL",
    dates: "Jun - Sep 2025",
    logo: "/logos/epfl.png",
    description:
      "Researched GPU-accelerated compression for large-scale analytical databases at EPFL's DIAS Lab under Professor Anastasia Ailamaki - focusing on decompression strategies, workload modelling, and cost-based performance trade-offs.",
    highlights: [
      "Engineered a macroblock-based GPU decompression strategy cutting out-of-memory query times by 50–200%",
      "Built simulation models to predict query performance across workload complexities, enabling adaptive decompression strategies",
      "Designed join patterns for TPC-DS benchmarks with resource contention models across I/O, decompression, and compute",
      "Benchmarked GPU compression trade-offs, shaping a new cost-based research direction and contributing to a forthcoming publication",
    ],
    skills: ["CUDA", "C++", "Python", "GPU Computing"],
  },
  {
    title: "Teaching Assistant",
    company: "UChicago CS & Mathematics",
    dates: "Sep 2022 - March 2026",
    logo: "/logos/uchicago-cs.jpg",
    description:
      "TAed across CS and math for 3+ years, consistently earning some of the highest discussion scores in my sections - and picked up a TA award nomination along the way.",
    highlights: [],
    courses: [
      "Winter 2026 · CMSC 235 - Database Systems",
      "Fall 2025 · CMSC 141 - Intro to CS I",
      "Spring 2025 · CMSC 235 - Database Systems",
      "Winter 2025 · CMSC 142 - Intro to CS II",
      "Fall 2024 · CMSC 144 - Systems Programming II",
      "Spring 2024 · CMSC 235 - Database Systems",
      "Fall 2023 · CMSC 143 - Systems Programming I",
      "Fall 2023 · Math 131 - Calculus I",
      "Spring 2023 · Math 159 - Intro to Proofs in Analysis",
      "Winter 2023 · Math 159 - Intro to Proofs in Analysis",
      "Fall 2022 · Math 159 - Intro to Proofs in Analysis",
    ],
    skills: ["Python", "C", "Analysis", "Calculus"],
  },
  {
    title: "Lead Residential Assistant",
    company: "University of Chicago",
    dates: "2022 -2024",
    logo: "/logos/uchicago.png",
    description:
      "Led a staff of 8 RAs across three summers supporting ~1,000 high school students in UChicago's collegiate summer programme - students simultaneously taking university courses, holding part-time jobs, and conducting research.",
    highlights: [
      "Managed a team of 8 residential assistants: coordinating schedules, staff development, and on-call crisis response across a large residential community",
      "Designed and ran a full programme of activities, events, and community initiatives to support student wellbeing throughout each summer term",
      "Acted as primary point of contact for student welfare, mediating conflicts and escalating where appropriate",
      "Returned for three consecutive summers, taking on increasing leadership responsibility each year",
    ],
    skills: ["Leadership", "Team Management", "Event Planning", "Crisis Response"],
  },
  {
    title: "Business Analyst",
    company: "TSM",
    dates: "Jul - Sep 2023",
    logo: "/logos/tsm.png",
    description:
      "Business strategy internship at a leading esports organization, spanning market entry research, competitive intelligence, and content development.",
    highlights: [
      "Sole subject-matter expert on a new title entry strategy - conducted market research and product analysis, and presented findings and opportunity predictions directly to executives",
      "Audited a competitor's digital map product and pricing, sourcing intelligence from 40+ companies to model build costs, platform strategy, and expansion potential into emerging virtual platforms",
      "Directed production of three video campaigns, writing the storyboards - achieving 6.5× the channel's typical viewership on a platform with 2.3M subscribers",
    ],
    skills: ["Market Research", "Competitive Intelligence", "Strategy", "Content Strategy"],
  },
];

export const RESEARCH_FOCUS = [
  "Large-scale data processing",
  "Database internals",
  "High-performance systems",
  "GPU-accelerated compression",
];

export const RESEARCH_HIGHLIGHTS = [
  "Predictive modelling for CrocSort configuration on disaggregated and cloud-native hardware - finding diminishing returns in thread counts and near-optimal config selection without brute-force sweeps",
  "Resource-adaptive query execution with paged memory management",
  "GPU-accelerated compression: decompression strategies, workload modelling, and cost-based trade-offs",
  "Policy gap in Rust code generation benchmarks: showing that code passing SWE-bench tests can still violate project-defined safety and style policies",
  "Exploring external sort on GPUs, disaggregated hardware, and cloud-native environments - understanding how storage/compute separation and elastic resources reshape sorting performance",
];

export const PUBLICATIONS = [
  {
    title: "CrocSort: Resource-Efficient, Skew-Resilient Parallel External Merge Sort",
    authors: ["Riki Otaki*", "Charles Benello*", "Fuheng Zhao", "Aaron J. Elmore", "Goetz Graefe"],
    venue: "VLDB 2026",
    note: "* Equal contribution",
    link: "https://github.com/rotaki/ES",
  },
  {
    title: "Getting the Most Out of External Sorting in Cloud and Disaggregated Environments",
    authors: ["Charles Benello"],
    venue: "HPTS 2026",
    note: "",
    link: "",
  },
  {
    title: "Resource-Adaptive Query Execution with Paged Memory Management",
    authors: ["Riki Otaki", "Jun Hyuk Chang", "Charles Benello", "Aaron J. Elmore", "Goetz Graefe"],
    venue: "CIDR 2025",
    note: "",
    link: "https://vldb.org/cidrdb/papers/2025/p2-otaki.pdf",
  },
  {
    title: "Benchmarks Pass, Policies Fail: A Policy Gap in Rust Code Generation Evaluation",
    authors: ["Matt Gaughan", "Charles Benello", "Keixin Pei"],
    venue: "In preparation",
    note: "WIP",
    link: "",
  },
];

export const ADVISORS = [
  "Professor Aaron Elmore (ChiData Lab, University of Chicago)",
  "Professor Anastasia Ailamaki (DIAS Lab, EPFL)",
];

export const formatMetaLine = (parts: Array<string | undefined>) =>
  parts.filter((part) => part && part.trim().length > 0).join(" / ");
