document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let photoDataUrls = []; // Store photo data URLs for PDF generation
    let videoDataUrl = null; // Store video data URL for reference
    let propertyID = generatePropertyID(); // Generate unique property ID
    let logoDataUrl = ''; // Store logo as data URL for PDF
    
    // DOM Elements
    const propertyForm = document.getElementById('propertyForm');
    const propertyTypeSelect = document.getElementById('propertyType');
    const otherPropertyTypeGroup = document.getElementById('otherPropertyTypeGroup');
    const otherPropertyTypeInput = document.getElementById('otherPropertyType');
    const roadConnectionSelect = document.getElementById('roadConnection');
    const roadSizeGroup = document.getElementById('roadSizeGroup');
    const roadSizeInput = document.getElementById('roadSize');
    const getLocationBtn = document.getElementById('getLocationBtn');
    const locationInput = document.getElementById('location');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const photosInput = document.getElementById('photos');
    const photoPreview = document.getElementById('photoPreview');
    const videoInput = document.getElementById('video');
    const videoPreview = document.getElementById('videoPreview');
    const pdfStatus = document.getElementById('pdfStatus');
    const pdfModal = document.getElementById('pdfModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const companyLogo = document.getElementById('companyLogo');
    const pdfPreview = document.getElementById('pdfPreview');
    
    // Google Sheet submission URL - Replace with your actual deployment URL
    const googleSheetURL = 'https://script.google.com/macros/s/AKfycbyqBp2cGm5kNvq1aMWZVgcgNokuMPyuvZZIZy3RxvKIpuzGUYSpKJAEAogEGtM5sduLDQ/exec';
    
    // Ensure jsPDF and other libraries are loaded
    if (typeof window.jspdf === 'undefined') {
        console.error("jsPDF library not loaded!");
        alert("PDF generation requires jsPDF library. Please check your internet connection and refresh the page.");
    }
    
    // Load company logo
    function loadLogo() {
        return new Promise((resolve, reject) => {
            if (!companyLogo) {
                return resolve('');
            }
            
            const img = new Image();
            img.crossOrigin = "Anonymous";
            
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    console.error("Error converting logo to data URL:", e);
                    resolve('');
                }
            };
            
            img.onerror = function() {
                console.error("Error loading logo image");
                resolve('');
            };
            
            img.src = companyLogo.src;
        });
    }
    
    // Load logo immediately when page loads
    loadLogo().then(dataUrl => {
        logoDataUrl = dataUrl;
    });
    
    // Function to generate a unique property ID
    function generatePropertyID() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `PROP-${year}${month}${day}-${random}`;
    }
    
    // Handle Property Type dropdown change
    propertyTypeSelect.addEventListener('change', function() {
        if (this.value === 'Others') {
            otherPropertyTypeGroup.style.display = 'block';
            otherPropertyTypeInput.required = true;
        } else {
            otherPropertyTypeGroup.style.display = 'none';
            otherPropertyTypeInput.required = false;
        }
    });
    
    // Handle Road Connection dropdown change
    roadConnectionSelect.addEventListener('change', function() {
        if (this.value === 'Yes') {
            roadSizeGroup.style.display = 'block';
            roadSizeInput.required = true;
        } else {
            roadSizeGroup.style.display = 'none';
            roadSizeInput.required = false;
        }
    });
    
    // Geolocation functionality
    getLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            pdfStatus.className = 'pdf-status loading';
            pdfStatus.style.display = 'block';
            pdfStatus.textContent = 'Getting current location...';
            
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    latitudeInput.value = lat;
                    longitudeInput.value = lng;
                    locationInput.value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
                    
                    pdfStatus.className = 'pdf-status success';
                    pdfStatus.textContent = 'Location captured successfully!';
                    
                    // Hide status after 3 seconds
                    setTimeout(() => {
                        pdfStatus.style.display = 'none';
                    }, 3000);
                },
                function(error) {
                    console.error("Geolocation error:", error);
                    pdfStatus.className = 'pdf-status error';
                    pdfStatus.textContent = 'Error getting location. Please try again.';
                    
                    // Hide status after 3 seconds
                    setTimeout(() => {
                        pdfStatus.style.display = 'none';
                    }, 3000);
                }
            );
        } else {
            pdfStatus.className = 'pdf-status error';
            pdfStatus.style.display = 'block';
            pdfStatus.textContent = 'Geolocation is not supported by this browser.';
            
            // Hide status after 3 seconds
            setTimeout(() => {
                pdfStatus.style.display = 'none';
            }, 3000);
        }
    });
    
    // Photo preview functionality with responsive handling
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
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.margin = '5px';
                    img.style.maxHeight = '150px';
                    
                    // Create wrapper for responsive layout
                    const wrapper = document.createElement('div');
                    wrapper.style.display = 'inline-block';
                    wrapper.style.margin = '5px';
                    wrapper.appendChild(img);
                    
                    photoPreview.appendChild(wrapper);
                    
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
    
    // Video preview functionality with responsive handling
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
                video.style.maxWidth = '100%';
                video.style.height = 'auto';
                video.style.maxHeight = '180px';
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
    
    // Reset button functionality - clear previews and conditional fields
    document.getElementById('resetBtn').addEventListener('click', function() {
        photoPreview.innerHTML = '';
        videoPreview.innerHTML = '';
        photoDataUrls = [];
        videoDataUrl = null;
        
        otherPropertyTypeGroup.style.display = 'none';
        otherPropertyTypeInput.required = false;
        
        roadSizeGroup.style.display = 'none';
        roadSizeInput.required = false;
        
        locationInput.value = '';
        latitudeInput.value = '';
        longitudeInput.value = '';
        
        // Generate new property ID for new form
        propertyID = generatePropertyID();
    });
    
    // Modal functionality
    closeModalBtn.addEventListener('click', function() {
        pdfModal.classList.remove('show');
    });
    
    // Close modal if clicked outside
    window.addEventListener('click', function(e) {
        if (e.target === pdfModal) {
            pdfModal.classList.remove('show');
        }
    });
    
    // Make modal responsive
    function adjustModalSize() {
        if (window.innerWidth < 768) {
            // Mobile styles
            if (pdfModal) {
                const modalContent = pdfModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.width = '95%';
                    modalContent.style.margin = '20px auto';
                    modalContent.style.maxHeight = '80vh';
                }
            }
        } else {
            // Desktop styles
            if (pdfModal) {
                const modalContent = pdfModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.width = '80%';
                    modalContent.style.margin = '50px auto';
                    modalContent.style.maxHeight = '80vh';
                }
            }
        }
    }
    
    // Call on load and window resize
    window.addEventListener('resize', adjustModalSize);
    adjustModalSize();
    
    // Form submission with Google Sheets integration
    propertyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate conditional fields
        if (propertyTypeSelect.value === 'Others' && !otherPropertyTypeInput.value.trim()) {
            alert('Please specify the other property type.');
            otherPropertyTypeInput.focus();
            return;
        }
        
        if (roadConnectionSelect.value === 'Yes' && !roadSizeInput.value) {
            alert('Please specify the road size.');
            roadSizeInput.focus();
            return;
        }
        
        // Show loading status
        pdfStatus.className = 'pdf-status loading';
        pdfStatus.style.display = 'block';
        pdfStatus.textContent = 'Submitting data and generating PDF preview...';
        
        // Get form data - collect all form fields
        const formData = new FormData(propertyForm);
        
        // Add property ID to form data
        formData.append('propertyID', propertyID);
        formData.append('submissionDate', new Date().toLocaleString('en-IN'));
        
        // Convert FormData to JSON object
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
        
        // Convert location coordinates if available
        if (latitudeInput.value && longitudeInput.value) {
            jsonData.locationCoordinates = `${latitudeInput.value},${longitudeInput.value}`;
        }
        
        // Note: We're not sending the actual images to Google Sheets as they're too large
        // Just recording that images were included
        if (photoDataUrls.length > 0) {
            jsonData.imagesCount = photoDataUrls.length;
        }
        
        if (videoDataUrl) {
            jsonData.videoIncluded = 'Yes';
        }
        
        // Send data to Google Sheet
        fetch(googleSheetURL, {
            method: 'POST',
            mode: 'no-cors', // This mode doesn't need CORS headers on the server
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
            body: JSON.stringify(jsonData)
        })
        .then(response => {
            console.log('Data submitted to Google Sheet');
            
            // Create PDF preview HTML
            try {
                const previewHTML = generatePDFPreviewHTML();
                pdfPreview.innerHTML = previewHTML;
                
                // Show modal with preview
                pdfModal.classList.add('show');
                adjustModalSize();
                
                // Update status
                pdfStatus.className = 'pdf-status success';
                pdfStatus.textContent = 'Data saved and PDF preview generated successfully!';
                
                // Hide status after 3 seconds
                setTimeout(() => {
                    pdfStatus.style.display = 'none';
                }, 3000);
            } catch (error) {
                console.error("Error generating PDF preview:", error);
                pdfStatus.className = 'pdf-status error';
                pdfStatus.textContent = 'Error generating PDF preview. Please try again.';
            }
        })
        .catch(error => {
            console.error('Error submitting data:', error);
            
            // Even if sheet submission fails, still generate PDF
            try {
                const previewHTML = generatePDFPreviewHTML();
                pdfPreview.innerHTML = previewHTML;
                
                // Show modal with preview
                pdfModal.classList.add('show');
                adjustModalSize();
                
                // Update status
                pdfStatus.className = 'pdf-status warning';
                pdfStatus.textContent = 'PDF generated, but data may not have been saved. Please try again later.';
                
                // Hide status after 5 seconds
                setTimeout(() => {
                    pdfStatus.style.display = 'none';
                }, 5000);
            } catch (error) {
                console.error("Error generating PDF preview:", error);
                pdfStatus.className = 'pdf-status error';
                pdfStatus.textContent = 'Error processing form. Please try again.';
            }
        });
    });
    
    // Generate PDF preview HTML - enhanced for responsiveness
    function generatePDFPreviewHTML() {
        // Get form values
        const agentName = document.getElementById('agentName').value || 'N/A';
        const propertyOwnerName = document.getElementById('propertyOwnerName').value || 'N/A';
        const landSize = document.getElementById('landSize').value || 'N/A';
        const price = document.getElementById('price').value || 'N/A';
        let propertyType = propertyTypeSelect.value || 'N/A';
        if (propertyType === 'Others') {
            propertyType = otherPropertyTypeInput.value || 'N/A';
        }
        
        const state = document.getElementById('state').value || 'N/A';
        const district = document.getElementById('district').value || 'N/A';
        const village = document.getElementById('village').value || 'N/A';
        const khasraNo = document.getElementById('khasraNo').value || 'N/A';
        let roadConnection = roadConnectionSelect.value || 'N/A';
        if (roadConnection === 'Yes') {
            roadConnection = `Yes (${roadSizeInput.value} feet)`;
        }
        
        const location = locationInput.value || 'N/A';
        const landmark = document.getElementById('landmark').value || 'N/A';
        const comments = document.getElementById('comments').value || 'N/A';
        
        // Current date
        const currentDate = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const currentTime = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Generate HTML that matches the image format with responsive adjustments
        let html = `
            <div class="pdf-preview-wrapper" style="position: relative; font-family: 'Helvetica', Arial, sans-serif; max-width: 100%;">
                <!-- Header -->
                <div class="pdf-header" style="background-color: #f0f9f0; padding: 15px; border-bottom: 1px solid #ddd; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;">
                    <div style="text-align: left; flex: 1; min-width: 200px;">
                        <h2 style="margin: 0; color: #165821; font-size: 18px;">Land Details Report</h2>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 120px; margin: 5px 0;">
                        ${logoDataUrl ? `<img src="logo.png" style="max-height: 40px; max-width: 100%;" alt="2BIGHA Logo">` : ''}
                    </div>
                    <div style="text-align: right; flex: 1; min-width: 200px;">
                        <p style="margin: 0; font-size: 12px;"><strong>Property ID:</strong> ${propertyID}</p>
                        <p style="margin: 0; font-size: 12px;"><strong>Date:</strong> ${currentDate}</p>
                        <p style="margin: 0; font-size: 12px;"><strong>Time:</strong> ${currentTime}</p>
                    </div>
                </div>
                
                <!-- Watermark -->
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; z-index: -1; text-align: center; width: 80%;">
                    ${logoDataUrl ? `<img src="${logoDataUrl}" style="max-width: 100%;" alt="Watermark">` : '<span style="font-size: 120px; color: #ddd; transform: rotate(-30deg); display: inline-block;">2 BIGHA</span>'}
                </div>
                
                <div style="padding: 20px;">
                    <!-- Title -->
                    <h1 style="margin: 10px 0; font-size: 20px; color: #333; text-align: center;">Property Details</h1>
                    
                    <!-- Basic Information Table -->
                    <div style="margin-bottom: 15px; overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; min-width: 280px;">
                            <caption style="background-color: #1c6405; color: white; padding: 8px; text-align: center; font-weight: bold;">Basic Information</caption>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Agent Name</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${agentName}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Property Owner</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${propertyOwnerName}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Land Size</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${landSize}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Price</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">Rs. ${price}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Property Type</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${propertyType}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Location Details Table -->  
                    <div style="margin-bottom: 15px; overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; min-width: 280px;">
                            <caption style="background-color: #1c6405; color: white; padding: 8px; text-align: center; font-weight: bold;">Location Details</caption>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">State</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${state}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">District/Tehsil</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${district}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Village</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${village}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Khasra no./Khata no.</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${khasraNo}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Road Connection</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${roadConnection}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">GPS Coordinates</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${location}</td>
                            </tr>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Nearest Landmark</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${landmark}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Additional Information -->
                    <div style="margin-bottom: 15px; overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; min-width: 280px;">
                            <caption style="background-color: #1c6405; color: white; padding: 8px; text-align: center; font-weight: bold;">Additional Information</caption>
                            <tr>
                                <th style="width: 30%; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; text-align: left;">Comments</th>
                                <td style="width: 70%; padding: 8px; border: 1px solid #ddd; word-break: break-word;">${comments}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Property Images -->
                    ${photoDataUrls.length > 0 ? `
                    <div style="margin: 15px 0;">
                        <h3 style="background-color: #f0f9f0; padding: 8px; border: 1px solid #ddd; margin-bottom: 10px; text-align: center; color: #1c6405;">Property Images</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                            ${photoDataUrls.map(photo => `
                                <div style="flex: 0 1 auto; margin: 5px; max-width: calc(33.33% - 10px); min-width: 120px;">
                                    <img src="${photo.dataUrl}" alt="Property Image" style="width: 100%; max-height: 120px; object-fit: cover; border: 1px solid #ddd;">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 30px; background-color: #f0f9f0; font-size: 11px; color: #777; text-align: center; border-top: 1px solid #ddd; padding: 10px;">
                    <p style="margin: 0;">Generated on ${currentDate} | Property ID: ${propertyID}</p>
                    <p style="margin: 0;">This document is for informational purposes only</p>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Download PDF functionality with improved page calculations
    downloadPdfBtn.addEventListener('click', function() {
        pdfStatus.className = 'pdf-status loading';
        pdfStatus.style.display = 'block';
        pdfStatus.textContent = 'Generating downloadable PDF...';
        
        try {
            generatePDF();
        } catch (error) {
            console.error("Error generating downloadable PDF:", error);
            pdfStatus.className = 'pdf-status error';
            pdfStatus.textContent = 'Error generating PDF. Please try again.';
            
            // Show more details in console
            console.error("Error details:", error);
        }
    });
    
    // Generate and download PDF 
    function generatePDF() {
        // Show loading message
        pdfStatus.className = 'pdf-status loading';
        pdfStatus.style.display = 'block';
        pdfStatus.textContent = 'Generating downloadable PDF...';
        
        try {
            // Get form values
            const agentName = document.getElementById('agentName').value || 'N/A';
            const propertyOwnerName = document.getElementById('propertyOwnerName').value || 'N/A';
            const landSize = document.getElementById('landSize').value || 'N/A';
            const price = document.getElementById('price').value || 'N/A';
            let propertyType = propertyTypeSelect.value || 'N/A';
            if (propertyType === 'Others') {
                propertyType = otherPropertyTypeInput.value || 'N/A';
            }
            
            const state = document.getElementById('state').value || 'N/A';
            const district = document.getElementById('district').value || 'N/A';
            const village = document.getElementById('village').value || 'N/A';
            const khasraNo = document.getElementById('khasraNo').value || 'N/A';
            let roadConnection = roadConnectionSelect.value || 'No';
            if (roadConnection === 'Yes') {
                roadConnection = `Yes (${roadSizeInput.value} feet)`;
            }
            
            const location = locationInput.value || 'N/A';
            const landmark = document.getElementById('landmark').value || 'N/A';
            const comments = document.getElementById('comments').value || 'N/A';
            
            // Current date
            const currentDate = new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const currentTime = new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Create PDF directly with jspdf
            // Fix: Reference jsPDF correctly
            if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
                throw new Error("jsPDF library not found! Make sure the library is loaded correctly.");
            }
            
            // Get jsPDF constructor - check both possible references
            const jsPDF = window.jspdf?.jsPDF || window.jsPDF || jspdf?.jsPDF;
            
            if (!jsPDF) {
                throw new Error("jsPDF constructor not found. Please check the library import.");
            }
            
            // Initialize PDF with A4 size
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Define colors to match the image
            const lightGreen = [240, 249, 240]; // RGB for header/footer background (f0f9f0)
            const darkGreen = [28, 100, 5];    // RGB for caption background (1c6405)
            const textDark = [51, 51, 51];     // RGB for normal text
            
            // Calculate total pages needed
            let totalPages = 1;
            
            // First page content calculation
            let currentY = 30; // Starting Y position after header

            // Add space for title
            currentY += 15;
            
            // Basic Info table height estimate
            currentY += 65; // Approximate height for basic info table
            
            // Location Details table height estimate
            currentY += 90; // Approximate height for location details table
            
            // Additional Info table height estimate
            currentY += 30; // Approximate height for additional info table
            
            // Property Images
            if (photoDataUrls.length > 0) {
                currentY += 20; // Title
                const imagesPerRow = 3;
                const rowCount = Math.ceil(photoDataUrls.length / imagesPerRow);
                currentY += rowCount * 60; // Approx 60mm per row of images
            }
            
            // Page height calculation for A4
            const pageHeight = 297 - 40; // A4 height minus margins and header/footer
            
            // Calculate if we need more pages
            if (currentY > pageHeight) {
                totalPages = Math.ceil(currentY / pageHeight);
            }
            
            // Function to add header for each page
            function addHeader(pageNumber) {
                const pageWidth = doc.internal.pageSize.getWidth();
                
                // Header background - light green color
                doc.setFillColor(...lightGreen);
                doc.rect(0, 0, pageWidth, 20, 'F');
                
                // Border at bottom of header
                doc.setDrawColor(221, 221, 221); // #ddd
                doc.setLineWidth(0.5);
                doc.line(0, 20, pageWidth, 20);
                
                // Left section - Title
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(22, 88, 33); // #165821
                doc.setFontSize(14);
                doc.text("Land Report", 15, 13);
                
                // Middle section - Logo if available
                if (logoDataUrl) {
                    try {
                        doc.addImage(
                            logoDataUrl,
                            'PNG',
                            pageWidth/2 - 15, // center - half of width
                            5,  // 5mm from top
                            30, // width
                            10  // height
                        );
                    } catch (e) {
                        console.error("Error adding logo to PDF header:", e);
                    }
                }
                
                // Right section - Property ID and Date
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...textDark);
                doc.setFontSize(9);
                doc.text(`Property ID: ${propertyID}`, pageWidth - 15, 8, {align: 'right'});
                doc.text(`Date: ${currentDate}`, pageWidth - 15, 12, {align: 'right'});
                doc.text(`Time: ${currentTime}`, pageWidth - 15, 16, {align: 'right'});
                
                // Page number if multi-page document
                if (totalPages > 1) {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(8);
                    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 15, 19, {align: 'right'});
                }
            }
            
            // Function to add watermark to all pages - with error handling
            function addWatermark() {
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    
                    try {
                        // Save current state - wrapped in try-catch for compatibility
                        if (typeof doc.saveGraphicsState === 'function') {
                            doc.saveGraphicsState();
                        }
                        
                        // Set transparency - handle different jsPDF versions
                        if (typeof doc.setGState === 'function' && typeof doc.GState === 'function') {
                            doc.setGState(new doc.GState({opacity: 0.1}));
                        } else {
                            // Fallback for older versions
                            doc.setFillOpacity(0.1);
                        }
                        
                        // Add logo watermark if available, otherwise text
                        if (logoDataUrl) {
                            try {
                                // Calculate center position
                                const pageWidth = doc.internal.pageSize.getWidth();
                                const pageHeight = doc.internal.pageSize.getHeight();
                                
                                doc.addImage(
                                    logoDataUrl,
                                    'PNG',
                                    pageWidth/2 - 50, // center - half of width
                                    pageHeight/2 - 50, // center - half of height
                                    100, // width
                                    100  // height
                                );
                            } catch (e) {
                                console.error("Error adding logo watermark to PDF:", e);
                                // Fallback to text watermark
                                addTextWatermark();
                            }
                        } else {
                            addTextWatermark();
                        }
                        
                        // Restore state - wrapped for compatibility
                        if (typeof doc.restoreGraphicsState === 'function') {
                            doc.restoreGraphicsState();
                        } else {
                            // Reset opacity if no restore function
                            doc.setFillOpacity(1);
                        }
                    } catch (e) {
                        console.error("Error applying watermark:", e);
                        // Continue without watermark
                    }
                }
                
                // Helper function for text watermark
                function addTextWatermark() {
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(221, 221, 221); // Light gray color
                    doc.setFontSize(60);
                    
                    // Calculate center position
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    
                    // Rotate text - handle compatibility differences
                    try {
                        // Try standard transformation
                        doc.translate(pageWidth/2, pageHeight/2);
                        doc.rotate(-30 * Math.PI / 180);
                        doc.text("2 BIGHA", 0, 0, {align: 'center'});
                        doc.rotate(30 * Math.PI / 180);
                        doc.translate(-pageWidth/2, -pageHeight/2);
                    } catch (e) {
                        // Fallback for older versions without transform support
                        doc.text("2 BIGHA", pageWidth/2, pageHeight/2, {
                            align: 'center',
                            angle: -30
                        });
                    }
                }
            }
            
            // Function to add footer for each page
            function addFooter(pageNumber) {
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                
                // Footer background - light green color
                doc.setFillColor(...lightGreen);
                doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
                
                // Border at top of footer
                doc.setDrawColor(221, 221, 221); // #ddd
                doc.setLineWidth(0.5);
                doc.line(0, pageHeight - 15, pageWidth, pageHeight - 15);
                
                // Footer text
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(119, 119, 119); // #777777
                doc.setFontSize(8);
                doc.text(`Generated on ${currentDate} | Property ID: ${propertyID}`, pageWidth/2, pageHeight - 9, {align: 'center'});
                doc.text("Corporate Address: Unit number 1714 B, 17th Floor, Magnum Global Park, Golf Course Extension Road, Sector 58, Gurugram, Haryana-1220011", pageWidth/2, pageHeight - 5, {align: 'center'});
            }
            
            // Add first page
            addHeader(1);
            
            let y = 30; // Starting Y position
            
            // Add title
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...textDark);
            doc.setFontSize(16);
            doc.text("Property Details", doc.internal.pageSize.getWidth() / 2, y, {align: 'center'});
            y += 10;
            
            // Create Basic Information table
            doc.setFillColor(...darkGreen);
            doc.rect(15, y, doc.internal.pageSize.getWidth() - 30, 8, 'F');
            doc.setTextColor(255, 255, 255); // White text
            doc.setFontSize(12);
            doc.text("Basic Information", doc.internal.pageSize.getWidth() / 2, y + 5.5, {align: 'center'});
            y += 8;
            
            // Table rows function
            function addTableRow(label, value, rowY) {
                const pageWidth = doc.internal.pageSize.getWidth();
                const leftMargin = 15;
                const rightMargin = pageWidth - 15;
                const labelWidth = 45;
                
                // Label cell
                doc.setFillColor(249, 249, 249); // #f9f9f9
                doc.rect(leftMargin, rowY, labelWidth, 8, 'F');
                doc.setDrawColor(221, 221, 221); // #ddd
                doc.rect(leftMargin, rowY, labelWidth, 8, 'S');
                
                // Value cell
                doc.setFillColor(255, 255, 255); // white
                doc.rect(leftMargin + labelWidth, rowY, rightMargin - leftMargin - labelWidth, 8, 'F');
                doc.setDrawColor(221, 221, 221); // #ddd
                doc.rect(leftMargin + labelWidth, rowY, rightMargin - leftMargin - labelWidth, 8, 'S');
                
                // Label text
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...textDark);
                doc.setFontSize(10);
                doc.text(label, leftMargin + 3, rowY + 5.5);
                
                // Value text - Handle long text with wrapping
                doc.setFont('helvetica', 'normal');
                const maxWidth = rightMargin - leftMargin - labelWidth - 6; // 3mm padding on each side
                
                // Check if text needs wrapping
                if (doc.getTextWidth(value) > maxWidth) {
                    const splitText = doc.splitTextToSize(value, maxWidth);
                    doc.text(splitText, leftMargin + labelWidth + 3, rowY + 5.5);
                } else {
                    doc.text(value, leftMargin + labelWidth + 3, rowY + 5.5);
                }
                
                return rowY + 8; // Return next row Y position
            }
            
            // Add basic info rows
            y = addTableRow("Agent Name", agentName, y);
            y = addTableRow("Property Owner", propertyOwnerName, y);
            y = addTableRow("Land Size", landSize, y);
            y = addTableRow("Price", `Rs. ${price}`, y);
            y = addTableRow("Property Type", propertyType, y);
            
            y += 5; // Add some spacing
            
            // Check if we need a new page
            if (y > 250) {
                addFooter(1);
                doc.addPage();
                doc.setPage(2);
                addHeader(2);
                y = 30;
            }
            
            // Create Location Details table
            doc.setFillColor(...darkGreen);
            doc.rect(15, y, doc.internal.pageSize.getWidth() - 30, 8, 'F');
            doc.setTextColor(255, 255, 255); // White text
            doc.setFontSize(12);
            doc.text("Location Details", doc.internal.pageSize.getWidth() / 2, y + 5.5, {align: 'center'});
            y += 8;
            
            // Add location details rows
            y = addTableRow("State", state, y);
            y = addTableRow("District/Tehsil", district, y);
            y = addTableRow("Village", village, y);
            y = addTableRow("Khasra no./Khata no.", khasraNo, y);
            y = addTableRow("Road Connection", roadConnection, y);
            y = addTableRow("GPS Coordinates", location, y);
            y = addTableRow("Nearest Landmark", landmark, y);
            
            y += 5; // Add some spacing
            
            // Check if we need a new page
            if (y > 250) {
                addFooter(1);
                doc.addPage();
                doc.setPage(2);
                addHeader(2);
                y = 30;
            }
            
            // Create Additional Information table
            doc.setFillColor(...darkGreen);
            doc.rect(15, y, doc.internal.pageSize.getWidth() - 30, 8, 'F');
            doc.setTextColor(255, 255, 255); // White text
            doc.setFontSize(12);
            doc.text("Additional Information", doc.internal.pageSize.getWidth() / 2, y + 5.5, {align: 'center'});
            y += 8;
            
            // Add comments row
            y = addTableRow("Comments", comments, y);
            
            y += 10; // Add some spacing
            
            // Add property images if available
            if (photoDataUrls.length > 0) {
                // Check if we need a new page for images
                if (y > 220) {
                    addFooter(doc.internal.getNumberOfPages());
                    doc.addPage();
                    addHeader(doc.internal.getNumberOfPages());
                    y = 30;
                }
                
                // Image section title
                doc.setFillColor(...lightGreen);
                doc.rect(15, y, doc.internal.pageSize.getWidth() - 30, 10, 'F');
                doc.setDrawColor(221, 221, 221); // #ddd border
                doc.rect(15, y, doc.internal.pageSize.getWidth() - 30, 10, 'S');
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(28, 100, 5); // #1c6405
                doc.setFontSize(12);
                doc.text("Property Images", doc.internal.pageSize.getWidth() / 2, y + 6.5, {align: 'center'});
                y += 15;
                
                // Add images in a grid with error handling
                const imagesPerRow = 3;
                const imageMargin = 5;
                const pageWidth = doc.internal.pageSize.getWidth();
                const availableWidth = pageWidth - 30 - ((imagesPerRow - 1) * imageMargin);
                const imageWidth = availableWidth / imagesPerRow;
                const imageHeight = imageWidth * 0.75; // 4:3 aspect ratio
                
                let imageX = 15;
                const startY = y;
                
                // Add images with error handling for each
                for (let i = 0; i < photoDataUrls.length; i++) {
                    // Check if we need a new row
                    if (i > 0 && i % imagesPerRow === 0) {
                        imageX = 15;
                        y += imageHeight + imageMargin;
                    }
                    
                    // Check if we need a new page
                    if (y + imageHeight > 270) {
                        addFooter(doc.internal.getNumberOfPages());
                        doc.addPage();
                        addHeader(doc.internal.getNumberOfPages());
                        y = 30;
                        imageX = 15;
                        
                        // Add images section title again on new page
                        doc.setFillColor(...lightGreen);
                        doc.rect(15, y, doc.internal.pageSize.getWidth() - 30, 10, 'F');
                        doc.setDrawColor(221, 221, 221); // #ddd border
                        doc.rect(15, y, doc.internal.pageSize.getWidth() - 30, 10, 'S');
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(28, 100, 5); // #1c6405
                        doc.setFontSize(12);
                        doc.text("Property Images (Continued)", doc.internal.pageSize.getWidth() / 2, y + 6.5, {align: 'center'});
                        y += 15;
                    }
                    
                    try {
                        // Try to add image - with error handling
                        const imgData = photoDataUrls[i].dataUrl;
                        
                        // Verify data URL is valid
                        if (imgData && imgData.startsWith('data:')) {
                            doc.addImage(
                                imgData,
                                'JPEG',
                                imageX,
                                y,
                                imageWidth,
                                imageHeight
                            );
                            
                            // Add border around image
                            doc.setDrawColor(221, 221, 221); // #ddd
                            doc.rect(imageX, y, imageWidth, imageHeight, 'S');
                        } else {
                            console.warn(`Image ${i} has invalid data URL`);
                            // Add placeholder box instead
                            doc.setDrawColor(221, 221, 221);
                            doc.setFillColor(249, 249, 249);
                            doc.rect(imageX, y, imageWidth, imageHeight, 'FD');
                            doc.setTextColor(119, 119, 119);
                            doc.setFontSize(8);
                            doc.text("Image not available", imageX + imageWidth/2, y + imageHeight/2, {align: 'center'});
                        }
                        
                        // Move to next position
                        imageX += imageWidth + imageMargin;
                    } catch (e) {
                        console.error(`Error adding image ${i} to PDF:`, e);
                        // Continue with next image
                        imageX += imageWidth + imageMargin;
                    }
                }
                
                // Update Y position after images
                const rowCount = Math.ceil(photoDataUrls.length / imagesPerRow);
                y = startY + (rowCount * (imageHeight + imageMargin));
            }
            
            // Add footer to last page
            addFooter(doc.internal.getNumberOfPages());
            
            // Try to add watermark - with error handling
            try {
                addWatermark();
            } catch (err) {
                console.error("Error adding watermark:", err);
                // Continue without watermark
            }
            
            // Save the PDF
            const fileName = `Property_${propertyID}_${currentDate.replace(/\//g, '-')}.pdf`;
            doc.save(fileName);
            
            // Update status
            pdfStatus.className = 'pdf-status success';
            pdfStatus.textContent = 'PDF downloaded successfully!';
            
            // Hide status after 3 seconds
            setTimeout(() => {
                pdfStatus.style.display = 'none';
            }, 3000);
    } catch (error) {
        console.error("Error generating downloadable PDF:", error);
        pdfStatus.className = 'pdf-status error';
        pdfStatus.textContent = 'Error generating PDF. Please try again.';
        
        // Show more details in console
        console.error("Error details:", error);
        
        // Hide status after 5 seconds
        setTimeout(() => {
            pdfStatus.style.display = 'none';
        }, 5000);
    }
}
    // Send email functionality
    sendEmailBtn.addEventListener('click', function() {
        // This is a placeholder for email functionality
        // Typically this would require server-side integration
        
        pdfStatus.className = 'pdf-status loading';
        pdfStatus.style.display = 'block';
        pdfStatus.textContent = 'Preparing email...';
        
        // Show mock email form or integration
        setTimeout(() => {
            const recipientEmail = prompt("Enter recipient email address:");
            
            if (recipientEmail && recipientEmail.includes('@')) {
                // In a real implementation, this would connect to a backend service
                // to generate and send the PDF via email
                
                pdfStatus.className = 'pdf-status info';
                pdfStatus.textContent = 'Email functionality requires server-side implementation. This is a front-end demo only.';
                
                // For demo purposes only - would actually send in production
                alert(`In a complete implementation, the PDF would be sent to: ${recipientEmail}`);
            } else if (recipientEmail) {
                pdfStatus.className = 'pdf-status error';
                pdfStatus.textContent = 'Please enter a valid email address.';
            } else {
                pdfStatus.className = 'pdf-status info';
                pdfStatus.textContent = 'Email sending cancelled.';
            }
            
            // Hide status after 5 seconds
            setTimeout(() => {
                pdfStatus.style.display = 'none';
            }, 5000);
        }, 1000);
    });
    
    // Check for mobile devices and apply mobile-specific optimizations
    function checkMobileDevice() {
        const isMobile = window.innerWidth < 768 || 
                         navigator.userAgent.match(/Android/i) || 
                         navigator.userAgent.match(/iPhone|iPad|iPod/i);
        
        if (isMobile) {
            // Optimize file inputs for mobile
            if (photosInput) {
                photosInput.setAttribute('capture', 'environment');
                photosInput.setAttribute('accept', 'image/*');
            }
            
            if (videoInput) {
                videoInput.setAttribute('capture', 'environment');
                videoInput.setAttribute('accept', 'video/*');
            }
            
            // Adjust UI for touch interfaces
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                button.style.padding = '12px';
                button.style.margin = '5px 0';
            });
            
            // Ensure form elements are large enough for touch
            const formElements = document.querySelectorAll('input, select, textarea');
            formElements.forEach(element => {
                element.style.padding = '10px 8px';
                element.style.margin = '5px 0';
            });
        }
    }
    
    // Call mobile check on load
    checkMobileDevice();
    
    // Handle window orientation changes
    window.addEventListener('orientationchange', function() {
        // Re-adjust UI when orientation changes
        adjustModalSize();
        
        // Redraw any active previews
        if (pdfModal.classList.contains('show')) {
            // Force redraw of PDF preview for better mobile display
            const currentHTML = pdfPreview.innerHTML;
            pdfPreview.innerHTML = "";
            setTimeout(() => {
                pdfPreview.innerHTML = currentHTML;
            }, 100);
        }
    });
    
    // Handle browser back button for modal
    window.addEventListener('popstate', function(event) {
        if (pdfModal.classList.contains('show')) {
            pdfModal.classList.remove('show');
        }
    });
    
    // Push state when opening modal to handle back button
    downloadPdfBtn.addEventListener('click', function() {
        history.pushState({modal: 'pdf'}, '');
    });
    
    closeModalBtn.addEventListener('click', function() {
        history.back();
    });
    
    // Initialize the form - generate property ID on page load
    document.getElementById('propertyIDDisplay').textContent = propertyID;
});
