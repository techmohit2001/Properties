document.addEventListener('DOMContentLoaded', function() {
  // Photo preview functionality
  const photosInput = document.getElementById('photos');
  const photoPreview = document.getElementById('photoPreview');
  let photoDataUrls = []; // Store photo data URLs for PDF generation
  
  photosInput.addEventListener('change', function() {
      photoPreview.innerHTML = '';
      photoDataUrls = [];
      
      if (this.files) {
          Array.from(this.files).forEach(file => {
              const reader = new FileReader();
              
              reader.onload = function(e) {
                  const img = document.createElement('img');
                  img.src = e.target.result;
                  img.alt = file.name;
                  img.title = file.name;
                  photoPreview.appendChild(img);
                  
                  // Store the data URL for PDF generation
                  photoDataUrls.push({
                      name: file.name,
                      dataUrl: e.target.result
                  });
              };
              
              reader.readAsDataURL(file);
          });
      }
  });
  
  // Video preview functionality
  const videoInput = document.getElementById('video');
  const videoPreview = document.getElementById('videoPreview');
  let videoDataUrl = null; // Store video data URL for reference
  
  videoInput.addEventListener('change', function() {
      videoPreview.innerHTML = '';
      videoDataUrl = null;
      
      if (this.files && this.files[0]) {
          const file = this.files[0];
          const reader = new FileReader();
          
          reader.onload = function(e) {
              const video = document.createElement('video');
              video.src = e.target.result;
              video.controls = true;
              video.height = 150;
              video.title = file.name;
              videoPreview.appendChild(video);
              
              // Store the data URL for reference
              videoDataUrl = {
                  name: file.name,
                  dataUrl: e.target.result
              };
          };
          
          reader.readAsDataURL(file);
      }
  });
  
  // Form submission and PDF generation
  const propertyForm = document.getElementById('propertyForm');
  const pdfStatus = document.getElementById('pdfStatus');
  
  propertyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Show loading status
      pdfStatus.className = 'pdf-status loading';
      pdfStatus.innerHTML = 'Generating PDF... Please wait.';
      
      // Create a modal for PDF preview (will help with PDF generation)
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'pdfModal';
      
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      
      const closeBtn = document.createElement('span');
      closeBtn.className = 'close-modal';
      closeBtn.innerHTML = '&times;';
      closeBtn.onclick = function() {
          document.body.removeChild(modal);
      };
      
      const pdfPreview = document.createElement('div');
      pdfPreview.className = 'pdf-preview';
      pdfPreview.id = 'pdfPreview';
      
      modalContent.appendChild(closeBtn);
      modalContent.appendChild(pdfPreview);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
      
      // Prepare form data for PDF
      const formData = new FormData(propertyForm);
      const formDataObj = {};
      
      for (const [key, value] of formData.entries()) {
          if (key !== 'photos' && key !== 'video') {
              formDataObj[key] = value;
          }
      }
      
      // Create PDF preview content
      createPdfPreviewContent(pdfPreview, formDataObj);
      
      // Delay to ensure content is properly rendered
      setTimeout(() => {
          generatePDF(pdfPreview, formDataObj);
      }, 500);
  });
  
  function createPdfPreviewContent(container, formData) {
      // Create header
      const header = document.createElement('div');
      header.className = 'pdf-header';
      const title = document.createElement('h2');
      title.textContent = 'Property Details';
      header.appendChild(title);
      container.appendChild(header);
      
      // Create body with table for property details
      const body = document.createElement('div');
      body.className = 'pdf-body';
      
      const table = document.createElement('table');
      const fieldNames = {
          landSize: 'Land Size (sq. ft.)',
          price: 'Price (₹)',
          propertyType: 'Property Type',
          state: 'State',
          district: 'District/Tehsil',
          village: 'Village',
          khasraNo: 'Khasra no./Khata no.'
      };
      
      // Add table rows
      for (const [key, value] of Object.entries(formData)) {
          const row = table.insertRow();
          const cell1 = row.insertCell(0);
          const cell2 = row.insertCell(1);
          
          cell1.textContent = fieldNames[key] || key;
          cell2.textContent = value;
      }
      
      body.appendChild(table);
      container.appendChild(body);
      
      // Add images section
      if (photoDataUrls.length > 0) {
          const imagesSection = document.createElement('div');
          imagesSection.className = 'pdf-images';
          
          const imagesTitle = document.createElement('h3');
          imagesTitle.textContent = 'Property Photos';
          imagesSection.appendChild(imagesTitle);
          
          photoDataUrls.forEach(photo => {
              const img = document.createElement('img');
              img.src = photo.dataUrl;
              img.alt = photo.name;
              imagesSection.appendChild(img);
          });
          
          container.appendChild(imagesSection);
      }
      
      // Note for video (if any)
      if (videoDataUrl) {
          const videoNote = document.createElement('p');
          videoNote.innerHTML = `<strong>Note:</strong> Video file "${videoDataUrl.name}" is attached but not shown in PDF.`;
          container.appendChild(videoNote);
      }
  }
  
  function generatePDF(contentElement, formData) {
      try {
          // Using jsPDF with autoTable
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          // Add title
          pdf.setFontSize(18);
          pdf.text('Property Details', pdf.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
          pdf.setLineWidth(0.5);
          pdf.line(20, 25, pdf.internal.pageSize.getWidth() - 20, 25);
          pdf.setFontSize(12);
          
          // Add table data
          const tableData = [];
          const fieldNames = {
              landSize: 'Land Size (sq. ft.)',
              price: 'Price (₹)',
              propertyType: 'Property Type',
              state: 'State',
              district: 'District/Tehsil',
              village: 'Village',
              khasraNo: 'Khasra no./Khata no.'
          };
          
          for (const [key, value] of Object.entries(formData)) {
              tableData.push([fieldNames[key] || key, value]);
          }
          
          // Add table to PDF
          pdf.autoTable({
              startY: 30,
              head: [['Property Field', 'Value']],
              body: tableData,
              theme: 'striped',
              headStyles: { fillColor: [52, 152, 219] }
          });
          
          // Add images if available
          if (photoDataUrls.length > 0) {
              let currentY = pdf.lastAutoTable.finalY + 10;
              
              // Check if we need a new page for images
              if (currentY > 240) {
                  pdf.addPage();
                  currentY = 20;
              }
              
              pdf.text('Property Photos', 20, currentY);
              currentY += 10;
              
              // Add images in a grid with 2 images per row
              const imgWidth = 80;
              const imgHeight = 60;
              const margin = 20;
              let xPos = margin;
              
              photoDataUrls.forEach((photo, index) => {
                  // Create new row if needed
                  if (index > 0 && index % 2 === 0) {
                      xPos = margin;
                      currentY += imgHeight + 10;
                      
                      // Add new page if needed
                      if (currentY > 240) {
                          pdf.addPage();
                          currentY = 20;
                      }
                  }
                  
                  try {
                      pdf.addImage(photo.dataUrl, 'JPEG', xPos, currentY, imgWidth, imgHeight);
                      xPos += imgWidth + 10;
                  } catch (error) {
                      console.error("Error adding image:", error);
                  }
              });
          }
          
          // Save the PDF
          pdf.save('property-details.pdf');
          
          // Update status and remove modal after delay
          pdfStatus.className = 'pdf-status success';
          pdfStatus.textContent = 'PDF generated successfully! Check your downloads.';
          
          setTimeout(() => {
              document.body.removeChild(document.getElementById('pdfModal'));
              
              // Reset status after 5 seconds
              setTimeout(() => {
                  pdfStatus.style.display = 'none';
              }, 5000);
          }, 1000);
      } catch (error) {
          console.error("PDF generation error:", error);
          
          // Show error status
          pdfStatus.className = 'pdf-status error';
          pdfStatus.textContent = 'Error generating PDF. Please try again.';
          
          // Remove modal
          document.body.removeChild(document.getElementById('pdfModal'));
      }
  }
});