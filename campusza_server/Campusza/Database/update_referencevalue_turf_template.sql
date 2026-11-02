-- Update referencevalue table with a turf/playing ground HTML template
-- This query updates the template HTML for sports facility pages

UPDATE referencevalue 
SET description = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{organisationdetail.name}} - Sports Facility | Appointza</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #2E8B57;
            --secondary-color: #32CD32;
            --accent-color: #FFD700;
            --dark-green: #1B5E20;
            --light-green: #C8E6C9;
            --text-dark: #2E2E2E;
            --text-light: #666666;
            --white: #FFFFFF;
            --shadow: 0 4px 20px rgba(0,0,0,0.1);
            --shadow-hover: 0 8px 30px rgba(0,0,0,0.15);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ''Poppins'', sans-serif;
            line-height: 1.6;
            color: var(--text-dark);
            background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%);
        }

        /* Navigation */
        .navbar-sports {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
        }

        .navbar-brand {
            font-weight: 800;
            font-size: 1.8rem;
            color: var(--primary-color);
        }

        .nav-link {
            font-weight: 500;
            color: var(--text-dark) !important;
            position: relative;
            transition: all 0.3s ease;
        }

        .nav-link::after {
            content: '''';
            position: absolute;
            bottom: -5px;
            left: 50%;
            width: 0;
            height: 3px;
            background: var(--secondary-color);
            transition: all 0.3s ease;
            transform: translateX(-50%);
        }

        .nav-link:hover::after {
            width: 100%;
        }

        .btn-sports {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: 600;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: var(--shadow);
        }

        .btn-sports:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-hover);
            color: white;
        }

        /* Hero Section */
        .hero-sports {
            min-height: 100vh;
            background: linear-gradient(rgba(46, 139, 87, 0.8), rgba(50, 205, 50, 0.8)), 
                        url(''data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><pattern id="grass" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="%232E8B57"/><path d="M0,20 Q10,10 20,20 T40,20" stroke="%2332CD32" stroke-width="2" fill="none"/><path d="M10,20 Q15,15 20,20 T30,20" stroke="%2332CD32" stroke-width="1" fill="none"/></pattern></defs><rect width="1200" height="800" fill="url(%23grass)"/></svg>'') center/cover;
            display: flex;
            align-items: center;
            color: white;
            position: relative;
        }

        .hero-content {
            text-align: center;
            z-index: 2;
        }

        .hero-title {
            font-size: 4rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .hero-subtitle {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        .btn-hero-primary {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 15px 40px;
            border-radius: 30px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .btn-hero-primary:hover {
            background: white;
            color: var(--primary-color);
            transform: translateY(-3px);
        }

        .btn-hero-secondary {
            background: transparent;
            border: 2px solid white;
            color: white;
            padding: 15px 40px;
            border-radius: 30px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .btn-hero-secondary:hover {
            background: var(--accent-color);
            border-color: var(--accent-color);
            color: var(--text-dark);
            transform: translateY(-3px);
        }

        /* Logo */
        .logo-container {
            margin-bottom: 2rem;
            display: flex;
            justify-content: center;
        }

        .logo-sports {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            box-shadow: var(--shadow-hover);
            border: 4px solid white;
            object-fit: cover;
            transition: all 0.3s ease;
        }

        .logo-sports:hover {
            transform: scale(1.05);
        }

        /* Section Styling */
        .section-sports {
            padding: 80px 0;
        }

        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
            color: var(--primary-color);
            position: relative;
        }

        .section-title::after {
            content: '''';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 4px;
            background: var(--secondary-color);
            border-radius: 2px;
        }

        .section-subtitle {
            font-size: 1.1rem;
            color: var(--text-light);
            text-align: center;
            margin-bottom: 3rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        /* About Section */
        .about-card {
            background: white;
            border-radius: 20px;
            padding: 3rem;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
            height: 100%;
        }

        .about-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }

        .feature-card {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 15px;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
            height: 100%;
            border-top: 4px solid var(--secondary-color);
        }

        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }

        .feature-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 2rem;
        }

        /* Contact Info Card */
        .contact-card {
            background: linear-gradient(135deg, var(--primary-color), var(--dark-green));
            color: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: var(--shadow-hover);
            height: 100%;
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
            color: var(--accent-color);
        }

        /* Services Section */
        .service-card {
            background: white;
            border-radius: 20px;
            padding: 2.5rem;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
            height: 100%;
            text-align: center;
            border-top: 4px solid var(--secondary-color);
        }

        .service-card:hover {
            transform: translateY(-10px);
            box-shadow: var(--shadow-hover);
        }

        .service-icon {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, var(--accent-color), #FFA500);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 1.8rem;
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
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }

        .service-duration {
            color: var(--text-light);
            font-size: 0.9rem;
        }

        /* Timing Section */
        .timing-card {
            background: white;
            border-radius: 20px;
            padding: 2.5rem;
            box-shadow: var(--shadow);
            max-width: 600px;
            margin: 0 auto;
        }

        .timing-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
            border-bottom: 1px solid #eee;
            transition: all 0.3s ease;
        }

        .timing-item:hover {
            background: var(--light-green);
            border-radius: 10px;
            padding: 1rem 1.5rem;
            margin: 0 -1.5rem;
        }

        .timing-item:last-child {
            border-bottom: none;
        }

        .timing-day {
            font-weight: 600;
            color: var(--text-dark);
        }

        .timing-hours {
            color: var(--text-light);
            font-weight: 500;
        }

        /* Stats Section */
        .stats-section {
            background: linear-gradient(135deg, var(--primary-color), var(--dark-green));
            color: white;
            padding: 80px 0;
            position: relative;
            overflow: hidden;
        }

        .stats-section::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url(''data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><pattern id="sports" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="1000" height="1000" fill="url(%23sports)"/></svg>'') repeat;
            opacity: 0.3;
        }

        .stat-item {
            text-align: center;
            position: relative;
            z-index: 2;
        }

        .stat-number {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            color: var(--accent-color);
        }

        .stat-label {
            font-size: 1.1rem;
            font-weight: 500;
            opacity: 0.9;
        }

        /* Contact Section */
        .contact-section {
            background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%);
            padding: 80px 0;
        }

        .contact-card-main {
            background: white;
            border-radius: 20px;
            padding: 4rem;
            box-shadow: var(--shadow-hover);
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .contact-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: var(--primary-color);
        }

        .contact-description {
            font-size: 1.2rem;
            color: var(--text-light);
            margin-bottom: 3rem;
            line-height: 1.6;
        }

        /* Footer */
        .footer-sports {
            background: var(--dark-green);
            color: white;
            padding: 60px 0 30px;
        }

        .footer-section h5 {
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: var(--accent-color);
        }

        .footer-link {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: all 0.3s ease;
            display: block;
            margin-bottom: 0.5rem;
        }

        .footer-link:hover {
            color: var(--accent-color);
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
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .social-link:hover {
            background: var(--accent-color);
            transform: translateY(-3px);
            color: var(--text-dark);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2.5rem;
            }
            
            .hero-subtitle {
                font-size: 1.2rem;
            }
            
            .section-title {
                font-size: 2rem;
            }
            
            .hero-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .about-card,
            .contact-card {
                padding: 2rem;
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
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-sports fixed-top">
        <div class="container">
            <a class="navbar-brand" href="#">
                <i class="fas fa-futbol me-2"></i>{{organisationdetail.name}}
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="#about">About</a></li>
                    <li class="nav-item"><a class="nav-link" href="#services">Services</a></li>
                    <li class="nav-item"><a class="nav-link" href="#contact">Contact</a></li>
                    <li class="nav-item">
                        <a href="{{BOOKNOWURL}}" class="btn-sports">Book Now</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-sports">
        <div class="container">
            <div class="hero-content">
                <!-- Organization Logo -->
                {{#organizationlogo}}
                
                <h1 class="hero-title">{{organisationdetail.name}}</h1>
                <p class="hero-subtitle">{{organisationdetail.tagline}}</p>
                <div class="hero-buttons">
                    <a href="{{BOOKNOWURL}}" class="btn-hero-primary">
                        <i class="fas fa-calendar-check me-2"></i>Book Your Slot
                    </a>
                    <a href="#contact" class="btn-hero-secondary">
                        <i class="fas fa-phone me-2"></i>Contact Us
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="section-sports">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mb-5">
                    <div class="about-card">
                        <h2 class="section-title text-start">About Our Facility</h2>
                        <p class="fs-5 mb-4">Welcome to <strong>{{organisationdetail.name}}</strong>, your premier destination for sports and recreation. We provide top-quality facilities and equipment for all your sporting needs.</p>
                        
                        <div class="row mt-5">
                            <div class="col-md-6 mb-4">
                                <div class="feature-card">
                                    <div class="feature-icon">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <h4>Professional Quality</h4>
                                    <p class="text-muted">State-of-the-art facilities maintained to professional standards.</p>
                                </div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <div class="feature-card">
                                    <div class="feature-icon">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <h4>Expert Staff</h4>
                                    <p class="text-muted">Experienced professionals to assist with your sporting activities.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Organization Details -->
                        {{#gstnumber}}
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="contact-card">
                        <h4 class="mb-4"><i class="fas fa-map-marker-alt me-2"></i>Our Location</h4>
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
                        <div class="stat-label">Games Played</div>
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
                        <div class="stat-label">Available</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Location Images -->
    {{#locationimages}}

    <!-- Services Section -->
    <section id="services" class="section-sports">
        <div class="container">
            <h2 class="section-title">Our Services</h2>
            <p class="section-subtitle">We offer a wide range of sports and recreational services</p>
            <div class="row">
                {{#orgnaisatinservice}}
                <!-- Service cards will be dynamically inserted here -->
                {{/orgnaisatinservice}}
            </div>
        </div>
    </section>

    <!-- Service Timings -->
    <section class="section-sports" style="background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%);">
        <div class="container">
            <h2 class="section-title">Operating Hours</h2>
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
            <div class="contact-card-main">
                <h2 class="contact-title">Ready to Play?</h2>
                <p class="contact-description">Book your slot today and experience our world-class facilities. We are committed to providing you with the best sporting experience!</p>
                <div class="d-flex justify-content-center gap-3 flex-wrap">
                    <a href="{{BOOKNOWURL}}" class="btn-sports">
                        <i class="fas fa-calendar-plus me-2"></i>Book Now
                    </a>
                    {{#customurl}}
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer-sports">
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
                    <a href="#about" class="footer-link">About Us</a>
                    <a href="#services" class="footer-link">Services</a>
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
WHERE id = 63;
