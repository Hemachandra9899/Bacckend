import { Controller, Get, Param, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { ProfileService } from './profile.service';
import { PdfGeneratorService } from './pdf-generator.service';

@Controller('api')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  @Get('profile')
  getProfile(@Res() res: Response) {
    return res.json({
      success: true,
      data: this.profileService.getProfile(),
    });
  }

  @Get('resume')
  getResumeJson(@Res() res: Response) {
    const profile = this.profileService.getProfile();
    return res.json({
      success: true,
      downloadUrl: '/api/resume/download',
      viewUrl: '/api/resume/view',
      resume: profile,
    });
  }

  @Get('resume/download')
  async downloadResumePdf(@Res() res: Response) {
    try {
      const pdfPath = await this.pdfGeneratorService.getOrGeneratePdf();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="Hemachandra_Reddy_Resume.pdf"',
      );
      return res.download(pdfPath, 'Hemachandra_Reddy_Resume.pdf');
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: `Failed to generate resume PDF: ${err.message}`,
      });
    }
  }

  @Get('resume/view')
  async viewResumePdf(@Res() res: Response) {
    try {
      const pdfPath = await this.pdfGeneratorService.getOrGeneratePdf();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="Hemachandra_Reddy_Resume.pdf"',
      );
      const stream = fs.createReadStream(pdfPath);
      return stream.pipe(res);
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: `Failed to view resume PDF: ${err.message}`,
      });
    }
  }

  @Get('projects')
  getProjects(@Query('category') category: string, @Res() res: Response) {
    const projects = this.profileService.getProjects(category);
    return res.json({
      success: true,
      count: projects.length,
      projects,
    });
  }

  @Get('projects/:id')
  getProjectById(@Param('id') id: string, @Res() res: Response) {
    const project = this.profileService.getProjectById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project '${id}' not found`,
      });
    }
    return res.json({
      success: true,
      project,
    });
  }

  @Get('experience')
  getExperience(@Res() res: Response) {
    return res.json({
      success: true,
      experience: this.profileService.getExperience(),
    });
  }

  @Get('skills')
  getSkills(@Res() res: Response) {
    return res.json({
      success: true,
      skills: this.profileService.getSkills(),
    });
  }
}
