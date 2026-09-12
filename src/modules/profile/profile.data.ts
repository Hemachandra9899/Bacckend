export interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  keyFeatures: string[];
  techStack: string[];
  githubUrl: string;
  liveUrl?: string;
  category: 'AI / Research' | 'Knowledge Management' | 'Document AI' | 'Conversational AI' | 'Machine Learning' | 'Web3';
  featured: boolean;
}

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  location?: string;
  highlights: string[];
  techStack: string[];
}

export interface ProfileData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  githubUrl: string;
  leetcodeUrl: string;
  linkedinUrl: string;
  summary: string;
  education: {
    institution: string;
    degree: string;
    period: string;
    location: string;
    cgpa: string;
  };
  skills: {
    languages: string[];
    frontend: string[];
    backend: string[];
    aiAndData: string[];
    databases: string[];
    tools: string[];
  };
  experience: ExperienceItem[];
  projects: ProjectItem[];
}

export const PROFILE_DATA: ProfileData = {
  name: 'Hemachandra Reddy Pottingari',
  title: 'AI and Full-Stack Engineer',
  email: 'pottingari@gmail.com',
  phone: '+91 63059 84164',
  location: 'Hyderabad, Telangana, India',
  githubUrl: 'https://github.com/Hemachandra9899',
  leetcodeUrl: 'https://leetcode.com/u/Hemachandra9899/',
  linkedinUrl: 'https://www.linkedin.com/in/hemachandra-reddy-pottingari/',
  summary:
    'AI and Full-Stack Engineer with extensive experience building production-grade AI-powered applications, LLM integrations, RAG pipelines, and scalable microservices using Python, TypeScript, FastAPI, Next.js, NestJS, and PostgreSQL. Experienced in vector databases (Pinecone, Qdrant), background job queues (BullMQ, Redis), containerization with Docker, and agentic workflows.',
  education: {
    institution: 'Sreenidhi Institute of Science and Technology',
    degree: 'B.Tech. in Information Technology',
    period: '2021 – 2025',
    location: 'Hyderabad, Telangana',
    cgpa: '7.14 / 10',
  },
  skills: {
    languages: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'C', 'C++', 'Rust (Basics)'],
    frontend: ['Next.js', 'React', 'Tailwind CSS', 'HTML5', 'CSS3'],
    backend: ['FastAPI', 'NestJS', 'Node.js', 'Express.js', 'Fastify', 'REST APIs', 'Microservices'],
    aiAndData: [
      'LLM APIs (NVIDIA NIM, Groq, OpenAI)',
      'RAG Pipelines',
      'Intent Detection',
      'Prompt Engineering',
      'Embeddings & Semantic Search',
      'LangChain',
      'Data Pipelines',
      'Document Analysis',
    ],
    databases: ['PostgreSQL', 'Pinecone', 'Qdrant', 'MongoDB', 'MySQL', 'FAISS', 'Redis'],
    tools: ['Docker', 'Docker Compose', 'Git', 'GitHub Actions', 'CI/CD', 'BullMQ', 'Prisma'],
  },
  experience: [
    {
      company: 'AlignLabs',
      role: 'AI and Data Engineer',
      period: 'Feb 2026 – Present',
      highlights: [
        'Built full-stack AI applications using Next.js, TypeScript, FastAPI, Python, and PostgreSQL, integrating LLMs and third-party APIs.',
        'Developed automated pipelines that collected marketing-platform data, transformed it, and populated structured Google Sheets for reporting and campaign tracking.',
        'Built an Ask AI system with intent detection, contextual retrieval, and answer generation for marketing and analytics queries.',
        'Developed analytics dashboards for campaign performance, platform metrics, and AI-generated business insights.',
        'Implemented AI-assisted workflows that performed actions such as generating content, updating records, creating reports, and sending automated emails.',
        'Built document-analysis features for information extraction, summarization, and question answering over uploaded enterprise documents.',
      ],
      techStack: ['Next.js', 'TypeScript', 'FastAPI', 'Python', 'PostgreSQL', 'LLMs', 'RAG'],
    },
    {
      company: 'CodeNebula',
      role: 'SDET Intern',
      period: 'Jul 2024 – Dec 2024',
      highlights: [
        'Developed and tested web application features using React, Node.js, Tailwind CSS, HTML, and CSS.',
        'Performed end-to-end testing, API validation, debugging, and performance testing for an application serving 500+ active users.',
        'Created comprehensive test cases, documented defects, and worked with developers to verify fixes and prevent regressions.',
      ],
      techStack: ['React', 'Node.js', 'Tailwind CSS', 'API Validation', 'E2E Testing'],
    },
  ],
  projects: [
    {
      id: 'scout',
      title: 'Scout – Evidence-First AI Research Engine',
      tagline: 'Deep research engine with multi-source crawling, citation verification, and code exploration',
      description:
        'An evidence-first AI research engine that conducts intent routing, multi-source search, web crawling, evidence extraction, reranking, citation verification, and grounded answer generation.',
      keyFeatures: [
        'Intent routing and multi-source parallel web crawling',
        'Scoped memory, semantic retrieval, and source-quality tracking',
        'GitHub repository analysis and graph-based code exploration',
        'Persistent storage with PostgreSQL and Qdrant vector store',
        'Asynchronous background processing with Redis and BullMQ',
        'Fully containerized microservices via Docker Compose',
      ],
      techStack: ['Next.js', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Qdrant', 'Redis', 'BullMQ', 'Docker'],
      githubUrl: 'https://github.com/Hemachandra9899/Scout',
      category: 'AI / Research',
      featured: true,
    },
    {
      id: 'second-brain',
      title: 'Second Brain – AI Knowledge Management System',
      tagline: 'Personal AI assistant with semantic search, Pinecone RAG, and NVIDIA LLMs',
      description:
        'A comprehensive personal knowledge-management platform featuring task management, semantic vector search, and AI-assisted information retrieval.',
      keyFeatures: [
        'Enterprise NestJS/FastAPI architecture with vector embeddings via Xenova/Transformers',
        'Pinecone vector database integration for sub-second semantic retrieval',
        'Powered by NVIDIA NIM LLMs for synthesis and conversational answers',
        'Notion task synchronization and automated WhatsApp messaging workflows',
        'PostgreSQL as source of truth and Redis for caching and session management',
      ],
      techStack: ['Next.js', 'NestJS', 'FastAPI', 'Pinecone', 'NVIDIA NIM', 'PostgreSQL', 'Redis', 'Docker'],
      githubUrl: 'https://github.com/Hemachandra9899/second-brain',
      category: 'Knowledge Management',
      featured: true,
    },
    {
      id: 'pdf-rag-assistant',
      title: 'PDF RAG Assistant',
      tagline: 'Document Q&A and analysis assistant powered by RAG',
      description:
        'An intelligent document-analysis application that enables users to upload complex PDF documents and ask questions with contextual retrieval and grounded citations.',
      keyFeatures: [
        'Intelligent PDF text chunking and metadata preservation',
        'Vector embedding generation and similarity search',
        'Grounded question answering with direct page references',
      ],
      techStack: ['Python', 'LangChain', 'FastAPI', 'Vector DB', 'LLMs'],
      githubUrl: 'https://github.com/Hemachandra9899/Pdf-Rag-Assistant',
      category: 'Document AI',
      featured: true,
    },
    {
      id: 'cognitalk',
      title: 'CogniTalk',
      tagline: 'Real-time interactive AI chat application',
      description:
        'A modern conversational AI application featuring streaming responses, custom personas, and responsive user interfaces.',
      keyFeatures: [
        'Low-latency streaming responses via SSE/WebSockets',
        'Context-aware conversational memory',
        'Clean modern UI built with Next.js and Tailwind CSS',
      ],
      techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'LLM APIs'],
      githubUrl: 'https://github.com/Hemachandra9899/CogniTalk',
      category: 'Conversational AI',
      featured: false,
    },
    {
      id: 'credit-card-fraud-detection',
      title: 'Credit Card Fraud Detection',
      tagline: 'Machine learning pipeline for imbalanced financial anomaly detection',
      description:
        'A machine learning pipeline designed to detect fraudulent transactions in highly imbalanced financial datasets with high precision and recall.',
      keyFeatures: [
        'Data preprocessing and anomaly detection algorithms',
        'Imbalanced data handling using SMOTE and robust sampling techniques',
        'High-recall evaluation metrics for fraud prevention',
      ],
      techStack: ['Python', 'Scikit-learn', 'Pandas', 'NumPy', 'Machine Learning'],
      githubUrl: 'https://github.com/Hemachandra9899/Credit-Card-Fraud-detection',
      category: 'Machine Learning',
      featured: false,
    },
    {
      id: 'tools-simpleweb3',
      title: 'tools.simpleweb3.ch',
      tagline: 'Web3 developer utilities and decentralized smart contract interactions',
      description:
        'A suite of Web3 tools for blockchain developers to interact with smart contracts, verify wallet signatures, and inspect decentralized transactions.',
      keyFeatures: [
        'Decentralized wallet connection and contract invocation',
        'Transaction debugging and payload verification',
      ],
      techStack: ['Next.js', 'TypeScript', 'Ethers.js', 'Web3.js', 'Ethereum'],
      githubUrl: 'https://github.com/Hemachandra9899/tools.simpleweb3.ch',
      category: 'Web3',
      featured: false,
    },
  ],
};
