import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
const PDFDocument = require('pdfkit');
import { PROFILE_DATA } from './profile.data';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private readonly publicDir = path.resolve(process.cwd(), 'public');
  private readonly pdfPath = path.join(this.publicDir, 'resume.pdf');

  /**
   * Returns path to existing PDF or generates it on the fly
   */
  async getOrGeneratePdf(): Promise<string> {
    if (!fs.existsSync(this.publicDir)) {
      fs.mkdirSync(this.publicDir, { recursive: true });
    }

    if (fs.existsSync(this.pdfPath)) {
      return this.pdfPath;
    }

    this.logger.log('📄 Generating Hemachandra Reddy Resume PDF via PDFKit...');
    await this.generatePdfFile(this.pdfPath);
    this.logger.log(`✅ Resume PDF successfully created at: ${this.pdfPath}`);
    return this.pdfPath;
  }

  generatePdfStream(): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    this.buildDocument(doc);
    return doc;
  }

  private generatePdfFile(outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);
      this.buildDocument(doc);
      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });
  }

  private buildDocument(doc: PDFKit.PDFDocument) {
    const primaryColor = '#1a365d';
    const textColor = '#2d3748';
    const subtextColor = '#4a5568';
    const margin = 40;

    // Header - Name
    doc
      .fillColor(primaryColor)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(PROFILE_DATA.name.toUpperCase(), { align: 'center' });

    doc.moveDown(0.2);

    // Contact line
    doc
      .fillColor(subtextColor)
      .fontSize(9.5)
      .font('Helvetica')
      .text(
        `${PROFILE_DATA.email}  |  ${PROFILE_DATA.phone}  |  LinkedIn  |  GitHub (${PROFILE_DATA.githubUrl})`,
        { align: 'center' },
      );

    doc.moveDown(0.8);

    const drawSectionHeader = (title: string) => {
      doc.moveDown(0.4);
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(title.toUpperCase());
      doc
        .strokeColor('#cbd5e0')
        .lineWidth(1)
        .moveTo(margin, doc.y + 2)
        .lineTo(555, doc.y + 2)
        .stroke();
      doc.moveDown(0.4);
    };

    // Summary
    drawSectionHeader('Summary');
    doc
      .fillColor(textColor)
      .fontSize(9.5)
      .font('Helvetica')
      .text(PROFILE_DATA.summary, { align: 'justify', lineGap: 2 });

    // Education
    drawSectionHeader('Education');
    doc
      .fillColor(textColor)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(PROFILE_DATA.education.institution, { continued: true })
      .font('Helvetica')
      .text(`  |  ${PROFILE_DATA.education.period}`, { align: 'right' });

    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .text(
        `${PROFILE_DATA.education.degree}, ${PROFILE_DATA.education.location}  —  CGPA: ${PROFILE_DATA.education.cgpa}`,
      );

    // Technical Skills
    drawSectionHeader('Technical Skills');
    const skills = [
      `Languages: ${PROFILE_DATA.skills.languages.join(', ')}`,
      `Frontend: ${PROFILE_DATA.skills.frontend.join(', ')}`,
      `Backend: ${PROFILE_DATA.skills.backend.join(', ')}`,
      `AI and Data: ${PROFILE_DATA.skills.aiAndData.join(', ')}`,
      `Databases: ${PROFILE_DATA.skills.databases.join(', ')}`,
      `Tools & DevOps: ${PROFILE_DATA.skills.tools.join(', ')}`,
    ];

    skills.forEach((skillLine) => {
      doc
        .fillColor(textColor)
        .fontSize(9)
        .font('Helvetica')
        .text(`• ${skillLine}`, { lineGap: 1.5 });
    });

    // Work Experience
    drawSectionHeader('Experience');
    PROFILE_DATA.experience.forEach((exp) => {
      doc.moveDown(0.2);
      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(exp.role, { continued: true })
        .fillColor(subtextColor)
        .font('Helvetica')
        .text(`  |  ${exp.company}`, { continued: true })
        .text(`  |  ${exp.period}`, { align: 'right' });

      doc.moveDown(0.1);
      exp.highlights.forEach((bullet) => {
        doc
          .fillColor(textColor)
          .fontSize(8.5)
          .font('Helvetica')
          .text(`•  ${bullet}`, { lineGap: 1.5, indent: 8 });
      });
    });

    // Projects
    drawSectionHeader('Key Projects');
    PROFILE_DATA.projects.slice(0, 4).forEach((proj) => {
      doc.moveDown(0.2);
      doc
        .fillColor(primaryColor)
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .text(proj.title, { continued: true })
        .fillColor('#2b6cb0')
        .font('Helvetica')
        .text(`  —  ${proj.githubUrl}`, { align: 'right' });

      doc
        .fillColor(subtextColor)
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text(`Tech: ${proj.techStack.join(', ')}`);

      doc
        .fillColor(textColor)
        .fontSize(8.5)
        .font('Helvetica')
        .text(`•  ${proj.description}`, { indent: 8, lineGap: 1 });
    });
  }
}
