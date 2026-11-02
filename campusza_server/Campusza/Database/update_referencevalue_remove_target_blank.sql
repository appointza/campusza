-- Update referencevalue table to remove target="_blank" from Book Now button
-- This ensures the booking URL opens in the same tab instead of a new tab

UPDATE referencevalue 
SET description = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{organisationdetail.name}} - Book Appointment | Appointza</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { 
            --primary-color: #1AAFCC; 
            --secondary-color: #2D3748; 
            --accent-color: #F7FAFC; 
            --text-dark: #2D3748; 
            --text-light: #718096; 
            --border-color: #E2E8F0; 
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ''Inter'', sans-serif; line-height: 1.6; color: var(--text-dark); background-color: #ffffff; }
        
        /* Header Styles */
        .header {
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px 0;
        }
        .logo-container {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .logo {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            object-fit: cover;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .organisation-name {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--secondary-color);
            margin: 0;
        }
        .organisation-tagline {
            color: var(--text-light);
            font-size: 1rem;
            margin: 0;
        }
        
        .hero-section { 
            background: linear-gradient(135deg, var(--primary-color) 0%, #2B6CB0 100%); 
            color: white; 
            padding: 60px 0; 
            position: relative; 
            overflow: hidden; 
        }
        .hero-content { position: relative; z-index: 2; }
        .booking-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .service-card { background: white; border-radius: 16px; padding: 30px; margin-bottom: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid var(--border-color); transition: all 0.3s ease; }
        .service-card:hover { transform: translateY(-5px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
        .location-card { background: white; border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid var(--border-color); }
        .timing-section { background: linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%); padding: 30px; border-radius: 16px; margin-bottom: 30px; }
        .price { font-size: 2rem; font-weight: 700; color: var(--primary-color); }
        .btn-primary { background: linear-gradient(135deg, var(--primary-color) 0%, #2B6CB0 100%); border: none; padding: 15px 40px; font-size: 1.1rem; font-weight: 600; border-radius: 50px; transition: all 0.3s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(26, 175, 204, 0.3); }
        
        /* Full Width Carousel Gallery */
        .carousel-container {
            margin: 40px 0;
            position: relative;
            background: linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 100%;
        }
        .carousel-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 25px;
            text-align: center;
        }
        .image-gallery-scroll {
            display: flex;
            overflow-x: auto;
            gap: 20px;
            padding: 20px 0;
            scroll-behavior: smooth;
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
            align-items: stretch;
        }
        .image-gallery-scroll::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }
        .gallery-image {
            flex: 0 0 450px;
            width: 450px;
            height: 350px;
            object-fit: contain;
            object-position: center;
            border-radius: 16px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            border: 3px solid transparent;
            display: block;
            background-color: #f8f9fa;
        }
        .gallery-image:hover {
            transform: scale(1.08);
            box-shadow: 0 15px 40px rgba(0,0,0,0.25);
            border-color: var(--primary-color);
        }
        .gallery-image.error {
            display: none;
        }
        .scroll-button {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.9);
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10;
            opacity: 0;
            transition: all 0.3s ease;
            color: var(--primary-color);
            font-size: 1.2rem;
        }
        .scroll-button:hover {
            background: var(--primary-color);
            color: white;
            transform: translateY(-50%) scale(1.1);
        }
        .carousel-container:hover .scroll-button {
            opacity: 1;
        }
        .scroll-button-left {
            left: 20px;
        }
        .scroll-button-right {
            right: 20px;
        }
        
        .single-image-container { width: 100%; height: 250px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .single-image { width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.3s ease; }
        .single-image:hover { transform: scale(1.05); }
        .footer { background: linear-gradient(135deg, #2D3748 0%, #1A202C 100%); color: white; padding: 60px 0 30px; margin-top: 80px; }
        .footer-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .footer-logo { font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 15px; }
        .footer-description { color: #A0AEC0; margin-bottom: 30px; max-width: 400px; }
        .footer-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; margin-bottom: 40px; }
        .footer-section h5 { color: white; margin-bottom: 20px; font-weight: 600; }
        .footer-section a { color: #A0AEC0; text-decoration: none; display: block; margin-bottom: 10px; transition: color 0.3s ease; }
        .footer-section a:hover { color: var(--primary-color); }
        .footer-bottom { border-top: 1px solid #4A5568; padding-top: 30px; text-align: center; color: #A0AEC0; }
        .badge { background: linear-gradient(135deg, var(--primary-color) 0%, #2B6CB0 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 500; }
        .section-title { font-size: 2rem; font-weight: 700; margin-bottom: 30px; color: var(--text-dark); }
        .section-subtitle { color: var(--text-light); font-size: 1.1rem; margin-bottom: 40px; }
        
        @media (max-width: 768px) { 
            .hero-section { padding: 40px 0; } 
            .booking-container { padding: 0 15px; } 
            .service-card, .location-card { padding: 20px; } 
            .footer-links { grid-template-columns: 1fr; gap: 30px; } 
            .header-content {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }
            .logo-container {
                flex-direction: column;
                gap: 10px;
            }
            .organisation-name {
                font-size: 1.5rem;
            }
            .gallery-image {
                flex: 0 0 350px;
                width: 350px;
                height: 280px;
                object-fit: contain;
                object-position: center;
                background-color: #f8f9fa;
            }
            .carousel-container {
                padding: 25px;
                margin: 30px 0;
            }
            .scroll-button {
                width: 40px;
                height: 40px;
                font-size: 1rem;
            }
            .scroll-button-left {
                left: 10px;
            }
            .scroll-button-right {
                right: 10px;
            }
        }
    </style>
</head>
<body>
    <!-- Header with Logo and Organisation Name -->
    <header class="header">
        <div class="booking-container">
            <div class="header-content">
                <div class="logo-container">
                    <img src="http://www.appointza.com/api/Files/get?id=9" alt="{{organisationdetail.name}} Logo" class="logo">
                    <div>
                        <h1 class="organisation-name">{{organisationdetail.name}}</h1>
                        <p class="organisation-tagline">{{organisationdetail.tagline}}</p>
                    </div>
                </div>
                <div class="header-actions">
                    <button class="btn btn-outline-primary">
                        <i class="fas fa-phone me-2"></i>Call Now
                    </button>
                </div>
            </div>
        </div>
    </header>
    
    <div class="hero-section">
        <div class="booking-container">
            <div class="hero-content text-center">
                <h1 class="display-4 fw-bold mb-4">Book Your Appointment</h1>
                <p class="lead fs-4 mb-0">Expert healthcare services at your convenience</p>
            </div>
        </div>
    </div>
    <div class="booking-container">
        <div class="location-card">
            <h2 class="section-title"><i class="fas fa-map-marker-alt text-primary me-3"></i>Location Details</h2>
            <div class="row">
                <div class="col-md-8">
                    <p class="fs-5 mb-2"><strong>Address:</strong> {{locationdetail.addressline1}}</p>
                    <p class="fs-5 mb-2"><strong>Area:</strong> {{locationdetail.addressline2}}</p>
                    <p class="fs-5 mb-2"><strong>City:</strong> {{locationdetail.city}}, {{locationdetail.state}}</p>
                    <p class="fs-5 mb-2"><strong>Pincode:</strong> {{locationdetail.pincode}}</p>
                </div>
             
            </div>
        </div>
        
        <!-- Full Width Gallery Section -->
        <div class="carousel-container">
            <h3 class="carousel-title"><i class="fas fa-images text-primary me-2"></i>Gallery</h3>
            <button class="scroll-button scroll-button-left" onclick="scrollGallery(-1)">
                <i class="fas fa-chevron-left"></i>
            </button>
            <div class="image-gallery-scroll" id="imageGallery">
                <!-- Sample gallery images - replace with dynamic content from backend -->
                <img src="http://www.appointza.com/api/Files/get?id=9" alt="MediCare Center Interior" class="gallery-image" onerror="handleImageError(this)">
                <img src="http://www.appointza.com/api/Files/get?id=10" alt="Waiting Area" class="gallery-image" onerror="handleImageError(this)">
                <img src="http://www.appointza.com/api/Files/get?id=11" alt="Consultation Room" class="gallery-image" onerror="handleImageError(this)">
                <img src="http://www.appointza.com/api/Files/get?id=12" alt="Reception Area" class="gallery-image" onerror="handleImageError(this)">
                <img src="http://www.appointza.com/api/Files/get?id=13" alt="Medical Equipment" class="gallery-image" onerror="handleImageError(this)">
                <!-- 
                Backend should replace the above static images with dynamic content from imageList
                For each image in imageList, generate:
                <img src="http://www.appointza.com/api/Files/get?id={imageId}" alt="{imageAltText}" class="gallery-image" onerror="handleImageError(this)">
                -->
            </div>
            <button class="scroll-button scroll-button-right" onclick="scrollGallery(1)">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        
        <div class="service-card">
            <h2 class="section-title"><i class="fas fa-briefcase text-primary me-3"></i>Our Services</h2>
            <p class="section-subtitle">Choose from our professional services</p>
            
            <!-- Sample services - replace with dynamic content from backend -->
            <div class="service-card">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h4 class="fw-bold mb-2">Web Development</h4>
                        <p class="text-muted mb-3">Professional website development services</p>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="price mb-2">₹150000</div>
                        <span class="badge">60 minutes</span>
                    </div>
                </div>
            </div>
            
            <div class="service-card">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h4 class="fw-bold mb-2">Mobile App Development</h4>
                        <p class="text-muted mb-3">Custom mobile applications for iOS and Android</p>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="price mb-2">₹200000</div>
                        <span class="badge">90 minutes</span>
                    </div>
                </div>
            </div>
            
            <div class="service-card">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h4 class="fw-bold mb-2">Consultation</h4>
                        <p class="text-muted mb-3">Expert technical consultation and advice</p>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="price mb-2">₹5000</div>
                        <span class="badge">30 minutes</span>
                    </div>
                </div>
            </div>
            
            <!-- 
            Backend should replace the above static services with dynamic content
            For each service in servicesList, generate:
            <div class="service-card">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h4 class="fw-bold mb-2">{serviceName}</h4>
                        <p class="text-muted mb-3">{serviceNotes}</p>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="price mb-2">₹{servicePrice}</div>
                        <span class="badge">{serviceDuration} minutes</span>
                    </div>
                </div>
            </div>
            -->
        </div>
        
        <div class="timing-section">
            <h3 class="section-title"><i class="fas fa-clock text-primary me-3"></i>Business Hours</h3>
            <div class="row">
                <!-- Sample business hours - replace with dynamic content from backend -->
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Monday</span>
                        <span class="text-primary fw-semibold">09:00 - 12:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Monday</span>
                        <span class="text-primary fw-semibold">14:00 - 17:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Tuesday</span>
                        <span class="text-primary fw-semibold">09:00 - 12:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Tuesday</span>
                        <span class="text-primary fw-semibold">14:00 - 17:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Wednesday</span>
                        <span class="text-primary fw-semibold">09:00 - 12:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Wednesday</span>
                        <span class="text-primary fw-semibold">14:00 - 17:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Thursday</span>
                        <span class="text-primary fw-semibold">09:00 - 12:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Thursday</span>
                        <span class="text-primary fw-semibold">14:00 - 17:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Friday</span>
                        <span class="text-primary fw-semibold">09:00 - 12:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Friday</span>
                        <span class="text-primary fw-semibold">14:00 - 17:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Saturday</span>
                        <span class="text-primary fw-semibold">09:00 - 12:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Saturday</span>
                        <span class="text-primary fw-semibold">14:00 - 17:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Sunday</span>
                        <span class="text-primary fw-semibold">09:00 - 12:00</span>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">Sunday</span>
                        <span class="text-primary fw-semibold">14:00 - 17:00</span>
                    </div>
                </div>
                
                <!-- 
                Backend should replace the above static hours with dynamic content
                For each timing in timingList, generate:
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
                        <span class="fw-semibold">{dayOfWeek}</span>
                        <span class="text-primary fw-semibold">{startTime} - {endTime}</span>
                    </div>
                </div>
                -->
            </div>
        </div>
        
        <div class="text-center my-5">
            <a href="{{BOOKNOWURL}}" class="btn btn-primary btn-lg px-5 py-3">
                <i class="fas fa-calendar-plus me-2"></i>Book Appointment Now
            </a>
        </div>
    </div>
    
    <footer class="footer">
        <div class="footer-content">
            <div class="row">
                <div class="col-lg-4 mb-4">
                    <div class="footer-logo">Appointza</div>
                    <p class="footer-description">Appointza simplifies scheduling for every kind of service — from healthcare to salons.</p>
                </div>
                <div class="col-lg-8">
                    <div class="footer-links">
                        <div class="footer-section">
                            <h5>Quick Links</h5>
                            <a href="/">Home</a>
                            <a href="/features">Features</a>
                            <a href="/use-cases">Use Cases</a>
                            <a href="/contact">Contact</a>
                        </div>
                        <div class="footer-section">
                            <h5>Resources</h5>
                            <a href="/login">Login</a>
                            <a href="/register">Sign Up</a>
                            <a href="/help">Help Center</a>
                            <a href="/blog">Blog</a>
                        </div>
                        <div class="footer-section">
                            <h5>Legal</h5>
                            <a href="/terms">Terms</a>
                            <a href="/privacy">Privacy</a>
                            <a href="/contact">Contact Us</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Appointza. All rights reserved.</p>
            </div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Function to handle image loading errors
        function handleImageError(img) {
            img.classList.add(''error'');
            console.log(''Image failed to load:'', img.src);
        }
        
        // Function to scroll the image gallery
        function scrollGallery(direction) {
            const gallery = document.getElementById(''imageGallery'');
            const scrollAmount = 470; // Adjust this value based on your image width + gap (450px + 20px gap)
            
            if (direction === 1) {
                gallery.scrollBy({ left: scrollAmount, behavior: ''smooth'' });
            } else {
                gallery.scrollBy({ left: -scrollAmount, behavior: ''smooth'' });
            }
        }
        
        // Auto-scroll functionality (optional)
        let autoScrollInterval;
        
        function startAutoScroll() {
            autoScrollInterval = setInterval(() => {
                const gallery = document.getElementById(''imageGallery'');
                const maxScroll = gallery.scrollWidth - gallery.clientWidth;
                
                if (gallery.scrollLeft >= maxScroll) {
                    gallery.scrollTo({ left: 0, behavior: ''smooth'' });
                } else {
                    gallery.scrollBy({ left: 470, behavior: ''smooth'' });
                }
            }, 4000);
        }
        
        function stopAutoScroll() {
            clearInterval(autoScrollInterval);
        }
        
        // Start auto-scroll when page loads
        document.addEventListener(''DOMContentLoaded'', function() {
            // Uncomment the line below if you want auto-scrolling
            // startAutoScroll();
            
            // Pause auto-scroll when user interacts with gallery
            const gallery = document.getElementById(''imageGallery'');
            gallery.addEventListener(''mouseenter'', stopAutoScroll);
            gallery.addEventListener(''mouseleave'', startAutoScroll);
        });
    </script>
</body>
</html>',
    modifiedon = NOW(),
    version = version + 1
WHERE id = 58;
