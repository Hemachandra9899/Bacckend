import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthStatus() {
    return {
      success: true,
      message: 'Hemachandra Reddy Portfolio & Second Brain API is running',
      timestamp: new Date().toISOString(),
      owner: {
        name: 'Hemachandra Reddy Pottingari',
        title: 'AI & Full-Stack Engineer',
        github: 'https://github.com/Hemachandra9899',
        leetcode: 'https://leetcode.com/u/Hemachandra9899/',
      },
      endpoints: {
        chat: 'POST /api/chat { "message": "tell me about your AI projects" }',
        searchNotes: 'GET /api/getnotes?query=your_search',
        createNote: 'POST /api/note',
        getAllNotes: 'GET /api/notes?limit=10',
        deleteNote: 'DELETE /api/notes/:id',
        profile: 'GET /api/profile',
        projects: 'GET /api/projects',
        experience: 'GET /api/experience',
        skills: 'GET /api/skills',
        models: 'GET /api/models',
        seedPinecone: 'POST /api/seed',
      },
    };
  }
}
