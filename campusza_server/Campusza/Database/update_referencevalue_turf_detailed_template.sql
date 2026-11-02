-- Update referencevalue table with a detailed turf website template
-- This query updates the template HTML for turf/sports facility pages

UPDATE referencevalue 
SET description = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{organisationdetail.name}} - Premium Turf Facility | Appointza</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-green: #2E8B57;
            --secondary-green: #32CD32;
            --accent-green: #90EE90;
            --dark-green: #1B5E20;
            --white: #FFFFFF;
            --black: #000000;
            --light-gray: #F8F9FA;
            --text-dark: #2C3E50;
            --text-light: #6C757D;
            --shadow: 0 4px 20px rgba(0,0,0,0.1);
            --shadow-hover: 0 8px 30px rgba(0,0,0,0.15);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ''Inter'', sans-serif;
            line-height: 1.6;
            color: var(--text-dark);
            overflow-x: hidden;
        }

        /* Navigation Bar */
        .navbar-turf {
            background: var(--white);
            box-shadow: var(--shadow);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            transition: all 0.3s ease;
        }

        .navbar-brand {
            font-weight: 800;
            font-size: 1.8rem;
            color: var(--primary-green);
            text-decoration: none;
        }

        .navbar-brand:hover {
            color: var(--primary-green);
        }

        .nav-link {
            font-weight: 500;
            color: var(--text-dark) !important;
            position: relative;
            transition: all 0.3s ease;
            margin: 0 15px;
        }

        .nav-link::after {
            content: '''';
            position: absolute;
            bottom: -5px;
            left: 50%;
            width: 0;
            height: 3px;
            background: var(--primary-green);
            transition: all 0.3s ease;
            transform: translateX(-50%);
        }

        .nav-link:hover::after {
            width: 100%;
        }

        .btn-book-nav {
            background: var(--primary-green);
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: 600;
            color: var(--white);
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: var(--shadow);
        }

        .btn-book-nav:hover {
            background: var(--dark-green);
            transform: translateY(-2px);
            box-shadow: var(--shadow-hover);
            color: var(--white);
        }

        /* Hero Section */
        .hero-turf {
            min-height: 100vh;
            background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), 
                        url(''data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><pattern id="turf" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="%232E8B57"/><path d="M0,30 Q15,20 30,30 T60,30" stroke="%2332CD32" stroke-width="3" fill="none"/><path d="M15,30 Q22,25 30,30 T45,30" stroke="%2332CD32" stroke-width="2" fill="none"/><circle cx="30" cy="30" r="2" fill="%23FFFFFF"/></pattern></defs><rect width="1200" height="800" fill="url(%23turf)"/></svg>'') center/cover;
            display: flex;
            align-items: center;
            color: var(--white);
            text-align: center;
            position: relative;
        }

        .hero-content {
            position: relative;
            z-index: 2;
        }

        .hero-title {
            font-size: 4.5rem;
            font-weight: 800;
            margin-bottom: 1.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            line-height: 1.2;
        }

        .hero-subtitle {
            font-size: 1.8rem;
            font-weight: 300;
            margin-bottom: 3rem;
            opacity: 0.9;
        }

        .hero-buttons {
            display: flex;
            gap: 2rem;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 2rem;
        }

        .btn-hero-primary {
            background: var(--primary-green);
            border: none;
            color: var(--white);
            padding: 18px 40px;
            border-radius: 30px;
            font-weight: 600;
            font-size: 1.1rem;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: var(--shadow);
        }

        .btn-hero-primary:hover {
            background: var(--dark-green);
            transform: translateY(-3px);
            box-shadow: var(--shadow-hover);
            color: var(--white);
        }

        .btn-hero-secondary {
            background: transparent;
            border: 2px solid var(--white);
            color: var(--white);
            padding: 18px 40px;
            border-radius: 30px;
            font-weight: 600;
            font-size: 1.1rem;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .btn-hero-secondary:hover {
            background: var(--white);
            color: var(--primary-green);
            transform: translateY(-3px);
        }

        /* Logo */
        .logo-container {
            margin-bottom: 2rem;
            display: flex;
            justify-content: center;
        }

        .logo-turf {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            box-shadow: var(--shadow-hover);
            border: 4px solid var(--white);
            object-fit: cover;
            transition: all 0.3s ease;
        }

        .logo-turf:hover {
            transform: scale(1.05);
        }

        /* Section Styling */
        .section-turf {
            padding: 100px 0;
        }

        .section-title {
            font-size: 3rem;
            font-weight: 800;
            text-align: center;
            margin-bottom: 1rem;
            color: var(--text-dark);
        }

        .section-subtitle {
            font-size: 1.2rem;
            color: var(--text-light);
            text-align: center;
            margin-bottom: 4rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        /* About Section */
        .about-content {
            background: var(--white);
            border-radius: 20px;
            padding: 4rem;
            box-shadow: var(--shadow);
            margin-bottom: 3rem;
        }

        .about-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 2rem;
            color: var(--text-dark);
        }

        .about-text {
            font-size: 1.1rem;
            line-height: 1.8;
            color: var(--text-light);
            margin-bottom: 3rem;
        }

        .feature-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .feature-card {
            text-align: center;
            padding: 2rem;
            background: var(--light-gray);
            border-radius: 15px;
            transition: all 0.3s ease;
            border-top: 4px solid var(--primary-green);
        }

        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }

        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: var(--primary-green);
        }

        .feature-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-dark);
        }

        .feature-description {
            color: var(--text-light);
            font-size: 0.95rem;
        }

        /* Contact Info Card */
        .contact-info-card {
            background: linear-gradient(135deg, var(--primary-green), var(--dark-green));
            color: var(--white);
            padding: 3rem;
            border-radius: 20px;
            box-shadow: var(--shadow-hover);
            height: 100%;
        }

        .contact-info-title {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 2rem;
            color: var(--white);
        }

        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }

        .contact-item i {
            font-size: 1.5rem;
            margin-right: 1rem;
            width: 30px;
            color: var(--accent-green);
        }

        .contact-item div {
            flex: 1;
        }

        /* Stats Section */
        .stats-section {
            background: linear-gradient(135deg, var(--accent-green), var(--secondary-green));
            color: var(--white);
            padding: 80px 0;
        }

        .stat-item {
            text-align: center;
            padding: 2rem 1rem;
        }

        .stat-number {
            font-size: 4rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            color: var(--white);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .stat-label {
            font-size: 1.2rem;
            font-weight: 500;
            opacity: 0.9;
        }

        /* Gallery Section */
        .gallery-section {
            background: var(--light-gray);
            padding: 80px 0;
        }

        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .gallery-item {
            position: relative;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
        }

        .gallery-item:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }

        .gallery-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
            transition: all 0.3s ease;
        }

        .gallery-item:hover .gallery-image {
            transform: scale(1.05);
        }

        /* Services Section */
        .service-card {
            background: var(--white);
            border-radius: 20px;
            padding: 2.5rem;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
            height: 100%;
            text-align: center;
            border-top: 4px solid var(--primary-green);
        }

        .service-card:hover {
            transform: translateY(-10px);
            box-shadow: var(--shadow-hover);
        }

        .service-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--primary-green), var(--secondary-green));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: var(--white);
            font-size: 2rem;
        }

        .service-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--text-dark);
        }

        .service-description {
            color: var(--text-light);
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }

        .service-price {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--primary-green);
            margin-bottom: 0.5rem;
        }

        .service-duration {
            color: var(--text-light);
            font-size: 1rem;
        }

        /* Timing Section */
        .timing-card {
            background: var(--white);
            border-radius: 20px;
            padding: 3rem;
            box-shadow: var(--shadow);
            max-width: 700px;
            margin: 0 auto;
        }

        .timing-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.2rem 0;
            border-bottom: 1px solid #eee;
            transition: all 0.3s ease;
        }

        .timing-item:hover {
            background: var(--light-gray);
            border-radius: 10px;
            padding: 1.2rem 1.5rem;
            margin: 0 -1.5rem;
        }

        .timing-item:last-child {
            border-bottom: none;
        }

        .timing-day {
            font-weight: 600;
            color: var(--text-dark);
            font-size: 1.1rem;
        }

        .timing-hours {
            color: var(--text-light);
            font-weight: 500;
            font-size: 1rem;
        }

        /* Contact Section */
        .contact-section {
            background: linear-gradient(135deg, var(--light-gray), var(--white));
            padding: 100px 0;
        }

        .contact-card {
            background: var(--white);
            border-radius: 20px;
            padding: 4rem;
            box-shadow: var(--shadow-hover);
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .contact-title {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 2rem;
            color: var(--text-dark);
        }

        .contact-description {
            font-size: 1.3rem;
            color: var(--text-light);
            margin-bottom: 3rem;
            line-height: 1.6;
        }

        .contact-buttons {
            display: flex;
            gap: 2rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        /* Footer */
        .footer-turf {
            background: var(--black);
            color: var(--white);
            padding: 60px 0 30px;
        }

        .footer-section h5 {
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: var(--accent-green);
        }

        .footer-link {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: all 0.3s ease;
            display: block;
            margin-bottom: 0.5rem;
        }

        .footer-link:hover {
            color: var(--accent-green);
            transform: translateX(5px);
        }

        .social-links {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }

        .social-link {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--white);
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .social-link:hover {
            background: var(--primary-green);
            transform: translateY(-3px);
            color: var(--white);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .hero-title {
                font-size: 3rem;
            }
            
            .hero-subtitle {
                font-size: 1.4rem;
            }
            
            .section-title {
                font-size: 2.5rem;
            }
            
            .hero-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .about-content,
            .contact-info-card {
                padding: 2rem;
            }
            
            .feature-cards {
                grid-template-columns: 1fr;
            }
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .fade-in-up {
            animation: fadeInUp 0.6s ease-out;
        }
    </style>
</head>
<body>
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-turf">
        <div class="container">
            <a class="navbar-brand" href="#">
                <i class="fas fa-futbol me-2"></i>{{organisationdetail.name}}
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="#home">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="#about">About</a></li>
                    <li class="nav-item"><a class="nav-link" href="#services">Services</a></li>
                    <li class="nav-item"><a class="nav-link" href="#contact">Contact</a></li>
                    <li class="nav-item">
                        <a href="{{BOOKNOWURL}}" class="btn-book-nav">Book Now</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="hero-turf">
        <div class="container">
            <div class="hero-content">
                <!-- Organization Logo -->
                {{#organizationlogo}}
                
                <h1 class="hero-title">{{organisationdetail.name}}</h1>
                <p class="hero-subtitle">{{organisationdetail.tagline}}</p>
                <div class="hero-buttons">
                    <a href="{{BOOKNOWURL}}" class="btn-hero-primary">
                        <i class="fas fa-calendar-check me-2"></i>Book Appointment
                    </a>
                    <a href="#contact" class="btn-hero-secondary">
                        <i class="fas fa-phone me-2"></i>Get In Touch
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="section-turf">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mb-5">
                    <div class="about-content">
                        <h2 class="about-title">About {{organisationdetail.name}}</h2>
                        <p class="about-text">Welcome to <strong>{{organisationdetail.name}}</strong>, your premier destination for premium turf facilities. We provide state-of-the-art artificial grass surfaces, professional lighting, and top-notch amenities for all your sporting needs. Our facility is designed to offer the perfect environment for training, practice, and competitive play.</p>
                        
                        <div class="feature-cards">
                            <div class="feature-card">
                                <div class="feature-icon">🌿</div>
                                <h4 class="feature-title">Quality Turf</h4>
                                <p class="feature-description">Premium artificial grass with professional maintenance</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">💡</div>
                                <h4 class="feature-title">LED Lighting</h4>
                                <p class="feature-description">Bright LED lights for evening and night games</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">🚗</div>
                                <h4 class="feature-title">Free Parking</h4>
                                <p class="feature-description">Convenient parking space for all visitors</p>
                            </div>
                        </div>

                        <!-- Organization Details -->
                        {{#gstnumber}}
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="contact-info-card">
                        <h4 class="contact-info-title"><i class="fas fa-map-marker-alt me-2"></i>Our Location</h4>
                        <div class="contact-item">
                            <i class="fas fa-building"></i>
                            <div>
                                <strong>{{organisationdetail.name}}</strong>
                            </div>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-location-dot"></i>
                            <div>{{locationdetail.addressline1}}</div>
                        </div>
                        {{#addressline2}}
                        <div class="contact-item">
                            <i class="fas fa-city"></i>
                            <div>{{locationdetail.city}}, {{locationdetail.state}}</div>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-mail-bulk"></i>
                            <div>{{locationdetail.pincode}}</div>
                        </div>
                        {{#country}}
                        
                        <!-- Google Location -->
                        {{#googlemaps}}
                        
                        <!-- Coordinates -->
                        {{#coordinates}}
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
        <div class="container">
            <div class="row">
                <div class="col-md-3 col-6 mb-4">
                    <div class="stat-item">
                        <div class="stat-number">500+</div>
                        <div class="stat-label">Happy Players</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-4">
                    <div class="stat-item">
                        <div class="stat-number">1000+</div>
                        <div class="stat-label">Matches Played</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-4">
                    <div class="stat-item">
                        <div class="stat-number">5★</div>
                        <div class="stat-label">Rating</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-4">
                    <div class="stat-item">
                        <div class="stat-number">24/7</div>
                        <div class="stat-label">Open</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Gallery Section -->
    {{#locationimages}}

    <!-- Services Section -->
    <section id="services" class="section-turf">
        <div class="container">
            <h2 class="section-title">Our Services</h2>
            <p class="section-subtitle">Choose from our range of premium turf services</p>
            <div class="row">
                {{#orgnaisatinservice}}
                <!-- Service cards will be dynamically inserted here -->
                {{/orgnaisatinservice}}
            </div>
        </div>
    </section>

    <!-- Service Timings Section -->
    <section class="section-turf" style="background: var(--light-gray);">
        <div class="container">
            <h2 class="section-title">Service Timings</h2>
            <p class="section-subtitle">We are open for your convenience</p>
            <div class="timing-card">
                {{#OrganisationServiceTiming}}
                <!-- Timing items will be dynamically inserted here -->
                {{/OrganisationServiceTiming}}
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-section">
        <div class="container">
            <div class="contact-card">
                <h2 class="contact-title">Ready to Book?</h2>
                <p class="contact-description">Book your slot today and experience our world-class turf facilities. We are committed to providing you with the best sporting experience!</p>
                <div class="contact-buttons">
                    <a href="{{BOOKNOWURL}}" class="btn-hero-primary">
                        <i class="fas fa-calendar-plus me-2"></i>Book Now
                    </a>
                    {{#customurl}}
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer-turf">
        <div class="container">
            <div class="row">
                <div class="col-lg-4 mb-4">
                    <h5>{{organisationdetail.name}}</h5>
                    <p class="text-light mb-3">{{organisationdetail.tagline}}</p>
                    <div class="social-links">
                        <a href="#" class="social-link"><i class="fab fa-facebook"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="col-lg-4 mb-4">
                    <h5>Quick Links</h5>
                    <a href="#about" class="footer-link">About</a>
                    <a href="#services" class="footer-link">Services</a>
                    <a href="#contact" class="footer-link">Contact</a>
                    <a href="{{BOOKNOWURL}}" class="footer-link">Book Now</a>
                </div>
                <div class="col-lg-4 mb-4">
                    <h5>Contact Info</h5>
                    <p class="text-light mb-2"><i class="fas fa-map-marker-alt me-2"></i>{{locationdetail.addressline1}}, {{locationdetail.city}}</p>
                    <p class="text-light mb-2"><i class="fas fa-phone me-2"></i>+1 (555) 123-4567</p>
                    <p class="text-light mb-0"><i class="fas fa-envelope me-2"></i>{{organizationemail}}</p>
                </div>
            </div>
            <hr class="my-4" style="border-color: rgba(255,255,255,0.2);">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <p class="mb-0 text-light">&copy; {{currentyear}} {{organisationdetail.name}}. All rights reserved.</p>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <p class="mb-0 text-light">Powered by <a href="https://appointza.com" class="text-light text-decoration-none">Appointza</a></p>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll(''a[href^="#"]'').forEach(anchor => {
            anchor.addEventListener(''click'', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute(''href''));
                if (target) {
                    target.scrollIntoView({
                        behavior: ''smooth'',
                        block: ''start''
                    });
                }
            });
        });

        // Add loading animation to images
        document.addEventListener(''DOMContentLoaded'', function() {
            const images = document.querySelectorAll(''img'');
            images.forEach(img => {
                img.addEventListener(''load'', function() {
                    this.style.opacity = ''1'';
                });
                img.style.transition = ''opacity 0.3s ease'';
                img.style.opacity = ''0'';
            });
        });
    </script>
</body>
</html>'
WHERE id = 62;
