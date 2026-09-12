import { Injectable } from '@nestjs/common';
import {
  PROFILE_DATA,
  ProfileData,
  ProjectItem,
  ExperienceItem,
} from './profile.data';

export type UserIntent =
  | 'projects'
  | 'resume'
  | 'skills'
  | 'experience'
  | 'contact'
  | 'general';

@Injectable()
export class ProfileService {
  private readonly data: ProfileData = PROFILE_DATA;

  getProfile(): ProfileData {
    return this.data;
  }

  getProjects(category?: string): ProjectItem[] {
    if (category) {
      return this.data.projects.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase(),
      );
    }
    return this.data.projects;
  }

  getProjectById(id: string): ProjectItem | undefined {
    return this.data.projects.find(
      (p) => p.id === id || p.title.toLowerCase().includes(id.toLowerCase()),
    );
  }

  getExperience(): ExperienceItem[] {
    return this.data.experience;
  }

  getSkills() {
    return this.data.skills;
  }

  detectIntent(query: string): UserIntent {
    const q = query.toLowerCase();

    if (
      q.includes('project') ||
      q.includes('scout') ||
      q.includes('second brain') ||
      q.includes('github') ||
      q.includes('repo') ||
      q.includes('built') ||
      q.includes('what have you made') ||
      q.includes('rag assistant') ||
      q.includes('cognitalk')
    ) {
      return 'projects';
    }

    if (
      q.includes('resume') ||
      q.includes('cv') ||
      q.includes('education') ||
      q.includes('college') ||
      q.includes('b.tech') ||
      q.includes('degree') ||
      q.includes('cgpa') ||
      q.includes('qualification')
    ) {
      return 'resume';
    }

    if (
      q.includes('experience') ||
      q.includes('alignlabs') ||
      q.includes('codenebula') ||
      q.includes('work history') ||
      q.includes('job')
    ) {
      return 'experience';
    }

    if (
      q.includes('skill') ||
      q.includes('tech stack') ||
      q.includes('technologies') ||
      q.includes('programming language') ||
      q.includes('what do you know')
    ) {
      return 'skills';
    }

    if (
      q.includes('contact') ||
      q.includes('email') ||
      q.includes('phone') ||
      q.includes('hire') ||
      q.includes('linkedin') ||
      q.includes('reach out')
    ) {
      return 'contact';
    }

    return 'general';
  }

  /**
   * Builds an enriched, structured context string tailored to the query
   */
  getRelevantContext(query: string): string {
    const intent = this.detectIntent(query);
    const parts: string[] = [];

    parts.push(`PROFILE SUMMARY:
Name: ${this.data.name} (${this.data.title})
Email: ${this.data.email} | Phone: ${this.data.phone}
GitHub Profile: ${this.data.githubUrl}
LeetCode: ${this.data.leetcodeUrl}
Summary: ${this.data.summary}
Education: ${this.data.education.degree} at ${this.data.education.institution} (${this.data.education.period}, CGPA: ${this.data.education.cgpa})`);

    if (intent === 'projects' || intent === 'general') {
      const projectsText = this.data.projects
        .map(
          (p) =>
            `- [${p.title}](${p.githubUrl})\n  Category: ${p.category}\n  Tagline: ${p.tagline}\n  Tech Stack: ${p.techStack.join(', ')}\n  GitHub Repository: ${p.githubUrl}\n  Highlights: ${p.keyFeatures.join('; ')}`,
        )
        .join('\n\n');
      parts.push(`PROJECTS CATALOG:\n${projectsText}`);
    }

    if (intent === 'skills' || intent === 'resume' || intent === 'general') {
      parts.push(`TECHNICAL SKILLS:
- Languages: ${this.data.skills.languages.join(', ')}
- Frontend: ${this.data.skills.frontend.join(', ')}
- Backend: ${this.data.skills.backend.join(', ')}
- AI & Data: ${this.data.skills.aiAndData.join(', ')}
- Databases: ${this.data.skills.databases.join(', ')}
- Tools: ${this.data.skills.tools.join(', ')}`);
    }

    if (intent === 'experience' || intent === 'resume' || intent === 'general') {
      const expText = this.data.experience
        .map(
          (e) =>
            `- ${e.role} at ${e.company} (${e.period})\n  Highlights:\n${e.highlights.map((h) => `    * ${h}`).join('\n')}\n  Tech Stack: ${e.techStack.join(', ')}`,
        )
        .join('\n\n');
      parts.push(`WORK EXPERIENCE:\n${expText}`);
    }

    return parts.join('\n\n' + '='.repeat(40) + '\n\n');
  }

  /**
   * Chunks resume and projects into records ready for Pinecone ingestion
   */
  getPineconeSeedRecords(): Array<{
    id: string;
    text: string;
    title: string;
    description: string;
    category: string;
  }> {
    const records: Array<{
      id: string;
      text: string;
      title: string;
      description: string;
      category: string;
    }> = [];

    // Profile summary chunk
    records.push({
      id: 'profile_summary',
      title: 'About Hemachandra Reddy Pottingari - Summary & Bio',
      description: this.data.summary,
      text: `${this.data.name} - ${this.data.title}. ${this.data.summary} Location: ${this.data.location}. Contact: ${this.data.email}, ${this.data.phone}. GitHub: ${this.data.githubUrl}.`,
      category: 'bio',
    });

    // Education chunk
    records.push({
      id: 'profile_education',
      title: 'Education - Sreenidhi Institute of Science and Technology',
      description: `${this.data.education.degree}, CGPA ${this.data.education.cgpa}`,
      text: `Education: ${this.data.education.degree} at ${this.data.education.institution}, ${this.data.education.location} (${this.data.education.period}). CGPA: ${this.data.education.cgpa}.`,
      category: 'education',
    });

    // Technical Skills chunk
    records.push({
      id: 'profile_skills',
      title: 'Technical Skills & Competencies',
      description: 'Languages, Frameworks, AI/ML, Databases, and Tools',
      text: `Technical Skills for Hemachandra Reddy: Languages: ${this.data.skills.languages.join(', ')}. Frontend: ${this.data.skills.frontend.join(', ')}. Backend: ${this.data.skills.backend.join(', ')}. AI & Data: ${this.data.skills.aiAndData.join(', ')}. Databases: ${this.data.skills.databases.join(', ')}. DevOps & Tools: ${this.data.skills.tools.join(', ')}.`,
      category: 'skills',
    });

    // Experience chunks
    this.data.experience.forEach((exp, i) => {
      records.push({
        id: `profile_exp_${exp.company.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        title: `Work Experience: ${exp.role} at ${exp.company}`,
        description: exp.highlights[0],
        text: `Role: ${exp.role} at ${exp.company} (${exp.period}). Highlights: ${exp.highlights.join(' ')}. Technologies used: ${exp.techStack.join(', ')}.`,
        category: 'experience',
      });
    });

    // Project chunks
    this.data.projects.forEach((proj) => {
      records.push({
        id: `profile_proj_${proj.id}`,
        title: proj.title,
        description: proj.description,
        text: `Project: ${proj.title}. Category: ${proj.category}. GitHub URL: ${proj.githubUrl}. Overview: ${proj.description}. Key Features: ${proj.keyFeatures.join(' ')}. Technologies: ${proj.techStack.join(', ')}.`,
        category: 'projects',
      });
    });

    return records;
  }
}
