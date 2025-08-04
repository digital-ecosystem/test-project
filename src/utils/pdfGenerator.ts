import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Question, UserUpdate } from '@/types';

export const generatePDFFromHTML = async (questionsData: Question[], personalInfo: UserUpdate, productDescription: string) => {
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .page { min-height: 100vh; page-break-after: always; }
          .page:last-child { page-break-after: avoid; }
          h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 30px; }
          .question { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
          .question-text { font-weight: bold; margin-bottom: 8px; }
          .answer { color: #007bff; font-weight: 500; }
          .personal-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
          .info-item { padding: 10px; background: #f8f9fa; border-radius: 5px; }
          .info-label { font-weight: bold; color: #333; }
          .info-value { color: #666; margin-top: 5px; }
          .signature-section { margin-top: 50px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .signature-line { border-bottom: 1px solid #333; margin: 20px 0; height: 40px; }
          .description { line-height: 1.6; text-align: justify; }
        </style>
      </head>
      <body>
        <!-- Page 1: Questions & Answers -->
        <div class="page">
          <h1>Product Discovery Survey</h1>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          ${questionsData.map((question, index) => `
            <div class="question">
              <div class="question-text">${index + 1}. ${question.text}</div>
              <div class="answer">Answer: ${'Not answered'}</div>
            </div>
          `).join('')}
        </div>
        
        <!-- Page 2: Personal Information -->
        <div class="page">
          <h1>Personal Information</h1>
          
          <div class="personal-info">
            <div class="info-item">
              <div class="info-label">First Name</div>
              <div class="info-value">${personalInfo.first_name || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Last Name</div>
              <div class="info-value">${personalInfo.last_name || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Age</div>
              <div class="info-value">${personalInfo.age || 'Not provided'}</div>
            </div>
          </div>
          
          <div class="signature-section">
            <h2>Digital Signature</h2>
            <div class="signature-line"></div>
            <div style="display: flex; justify-content: space-between;">
              <span>Signature</span>
              <span>Date: ${new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <!-- Page 3: Product Description -->
        <div class="page">
          <h1>Recommended Product</h1>
          <div class="description">
            ${productDescription}
          </div>
        </div>
      </body>
      </html>
    `;

    // Convert HTML to PDF using html2canvas and jsPDF
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        document.body.removeChild(tempDiv);
        return pdf;
    } catch (error) {
        document.body.removeChild(tempDiv);
        throw error;
    }
};

export const generatePDF = async (questionsData: Question[],  answers: Record<string, string>, personalInfo: UserUpdate, productDescription: string) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Page 1: Questions & Answers
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Product Discovery Survey', margin, 30);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, 45);

    let yPosition = 60;

    questionsData.forEach((question, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 30;
        }

        // Question
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        const questionText = `${index + 1}. ${question.text}`;
        const questionLines = pdf.splitTextToSize(questionText, pageWidth - 2 * margin);
        pdf.text(questionLines, margin, yPosition);
        yPosition += questionLines.length * 6;

        // Answer
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        // Get the selected answer value
        const selectedValue = answers[question.id];
        // Find the option label
        const selectedOption = question.options.find(opt => opt.value === selectedValue);
        const answerValue = selectedOption ? selectedOption.label : 'Not answered';

        // const answerValue = answers[question.id] || 'Not answered';
        const answerText = `Answer: ${answerValue}`;
        // const answerText = `Answer: ${'Not answered'}`;
        const answerLines = pdf.splitTextToSize(answerText, pageWidth - 2 * margin);
        pdf.text(answerLines, margin + 5, yPosition);
        yPosition += answerLines.length * 6 + 8;
    });

    // Page 2: Personal Information
    pdf.addPage();
    yPosition = 30;

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Personal Information', margin, yPosition);
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    const personalFields = [
        { label: 'First Name', value: personalInfo.first_name },
        { label: 'Last Name', value: personalInfo.last_name },
        { label: 'Age', value: personalInfo.age },
    ];

    personalFields.forEach(field => {
        if (field.value) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${field.label}:`, margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(String(field.value), margin + 40, yPosition);
            yPosition += 12;
        }
    });

    // Add signature section
    yPosition += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Digital Signature:', margin, yPosition);
    yPosition += 15;

    // Signature line
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Signature', margin, yPosition);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, yPosition);

    // Page 3: Product Description
    pdf.addPage();
    yPosition = 30;

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recommended Product', margin, yPosition);
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    // Split the description into multiple lines
    const descriptionLines = pdf.splitTextToSize(productDescription, pageWidth - 2 * margin);
    pdf.text(descriptionLines, margin, yPosition);

    return pdf;
};