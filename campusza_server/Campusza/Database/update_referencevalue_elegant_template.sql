-- Update referencevalue table with an elegant HTML template
-- This query updates the template HTML for organization pages with a more sophisticated design

UPDATE referencevalue 
SET description = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{organisationdetail.name}} - Professional Services | Appointza</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            --dark-gradient: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            --text-primary: #2d3748;
            --text-secondary: #718096;
            --text-light: #a0aec0;
            --shadow-soft: 0 10px 25px rgba(0,0,0,0.1);
            --shadow-medium: 0 20px 40px rgba(0,0,0,0.15);
            --shadow-strong: 0 30px 60px rgba(0,0,0,0.2);
            --border-radius: 20px;
            --border-radius-small: 12px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;
            line-height: 1.7;
            color: var(--text-primary);
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            overflow-x: hidden;
        }

        /* Navigation */
        .navbar-elegant {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: var(--shadow-soft);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .navbar-elegant.scrolled {
            background: rgba(255, 255, 255, 0.98);
            box-shadow: var(--shadow-medium);
        }

        .navbar-brand {
            font-weight: 800;
            font-size: 1.5rem;
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .nav-link {
            font-weight: 500;
            color: var(--text-primary) !important;
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
            background: var(--primary-gradient);
            border-radius: 2px;
            transition: all 0.3s ease;
            transform: translateX(-50%);
        }

        .nav-link:hover::after {
            width: 100%;
        }

        .btn-elegant {
            background: var(--primary-gradient);
            border: none;
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: 600;
            color: white;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--shadow-soft);
        }

        .btn-elegant:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-medium);
            color: white;
        }

        /* Hero Section */
        .hero-elegant {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            position: relative;
            display: flex;
            align-items: center;
            overflow: hidden;
        }

        .hero-elegant::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url(''data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="a" cx="50%" cy="50%"><stop offset="0%" stop-color="rgba(255,255,255,0.1)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><circle cx="200" cy="200" r="100" fill="url(%23a)"/><circle cx="800" cy="300" r="150" fill="url(%23a)"/><circle cx="400" cy="700" r="120" fill="url(%23a)"/></svg>'') no-repeat center center;
            background-size: cover;
            opacity: 0.3;
        }

        .hero-content {
            position: relative;
            z-index: 2;
            text-align: center;
            color: white;
        }

        .hero-title {
            font-size: 4rem;
            font-weight: 800;
            margin-bottom: 1.5rem;
            line-height: 1.2;
            text-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .hero-subtitle {
            font-size: 1.5rem;
            font-weight: 300;
            margin-bottom: 2.5rem;
            opacity: 0.9;
        }

        .hero-buttons {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 2rem;
        }

        .btn-hero-primary {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .btn-hero-primary:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-3px);
            color: white;
        }

        .btn-hero-secondary {
            background: transparent;
            border: 2px solid white;
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .btn-hero-secondary:hover {
            background: white;
            color: var(--text-primary);
            transform: translateY(-3px);
        }

        /* Logo */
        .logo-container-elegant {
            margin-bottom: 2rem;
            display: flex;
            justify-content: center;
        }

        .logo-elegant {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            box-shadow: var(--shadow-strong);
            border: 6px solid rgba(255, 255, 255, 0.3);
            object-fit: cover;
            transition: all 0.3s ease;
        }

        .logo-elegant:hover {
            transform: scale(1.05);
            box-shadow: 0 40px 80px rgba(0,0,0,0.3);
        }

        /* Section Styling */
        .section-elegant {
            padding: 100px 0;
            position: relative;
        }

        .section-title-elegant {
            font-size: 3rem;
            font-weight: 800;
            text-align: center;
            margin-bottom: 1rem;
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .section-subtitle {
            font-size: 1.2rem;
            color: var(--text-secondary);
            text-align: center;
            margin-bottom: 4rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        /* About Section */
        .about-card {
            background: white;
            border-radius: var(--border-radius);
            padding: 3rem;
            box-shadow: var(--shadow-soft);
            transition: all 0.3s ease;
            height: 100%;
        }

        .about-card:hover {
            transform: translateY(-10px);
            box-shadow: var(--shadow-medium);
        }

        .feature-card {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: var(--border-radius-small);
            box-shadow: var(--shadow-soft);
            transition: all 0.3s ease;
            height: 100%;
        }

        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-medium);
        }

        .feature-icon-elegant {
            width: 80px;
            height: 80px;
            background: var(--primary-gradient);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 2rem;
            box-shadow: var(--shadow-soft);
        }

        /* Contact Info Card */
        .contact-card {
            background: var(--primary-gradient);
            color: white;
            padding: 3rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-medium);
            height: 100%;
        }

        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: var(--border-radius-small);
            backdrop-filter: blur(10px);
        }

        .contact-item i {
            font-size: 1.5rem;
            margin-right: 1rem;
            width: 30px;
        }

        /* Services Section */
        .service-card-elegant {
            background: white;
            border-radius: var(--border-radius);
            padding: 2.5rem;
            box-shadow: var(--shadow-soft);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            height: 100%;
            border: 1px solid rgba(0,0,0,0.05);
        }

        .service-card-elegant:hover {
            transform: translateY(-10px);
            box-shadow: var(--shadow-strong);
        }

        .service-icon-elegant {
            width: 60px;
            height: 60px;
            background: var(--accent-gradient);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
        }

        .service-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }

        .service-description {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }

        .service-price {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }

        .service-duration {
            color: var(--text-light);
            font-size: 0.9rem;
        }

        /* Timing Section */
        .timing-card {
            background: white;
            border-radius: var(--border-radius);
            padding: 2.5rem;
            box-shadow: var(--shadow-soft);
            max-width: 600px;
            margin: 0 auto;
        }

        .timing-item-elegant {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }

        .timing-item-elegant:hover {
            background: rgba(102, 126, 234, 0.05);
            border-radius: var(--border-radius-small);
            padding: 1rem 1.5rem;
            margin: 0 -1.5rem;
        }

        .timing-day {
            font-weight: 600;
            color: var(--text-primary);
        }

        .timing-hours {
            color: var(--text-secondary);
            font-weight: 500;
        }

        /* Stats Section */
        .stats-section-elegant {
            background: var(--dark-gradient);
            color: white;
            padding: 100px 0;
            position: relative;
            overflow: hidden;
        }

        .stats-section-elegant::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url(''data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="b" cx="50%" cy="50%"><stop offset="0%" stop-color="rgba(255,255,255,0.1)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><circle cx="100" cy="100" r="80" fill="url(%23b)"/><circle cx="900" cy="200" r="120" fill="url(%23b)"/><circle cx="500" cy="800" r="100" fill="url(%23b)"/></svg>'') no-repeat center center;
            background-size: cover;
            opacity: 0.3;
        }

        .stat-item {
            text-align: center;
            position: relative;
            z-index: 2;
        }

        .stat-number-elegant {
            font-size: 4rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .stat-label {
            font-size: 1.1rem;
            font-weight: 500;
            opacity: 0.9;
        }

        /* Contact Section */
        .contact-section-elegant {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 100px 0;
        }

        .contact-card-elegant {
            background: white;
            border-radius: var(--border-radius);
            padding: 4rem;
            box-shadow: var(--shadow-medium);
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .contact-title {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 1.5rem;
            color: var(--text-primary);
        }

        .contact-description {
            font-size: 1.2rem;
            color: var(--text-secondary);
            margin-bottom: 3rem;
            line-height: 1.6;
        }

        /* Footer */
        .footer-elegant {
            background: var(--text-primary);
            color: white;
            padding: 60px 0 30px;
        }

        .footer-section h5 {
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: white;
        }

        .footer-link {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: all 0.3s ease;
            display: block;
            margin-bottom: 0.5rem;
        }

        .footer-link:hover {
            color: white;
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
            background: var(--primary-gradient);
            transform: translateY(-3px);
            color: white;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2.5rem;
            }
            
            .hero-subtitle {
                font-size: 1.2rem;
            }
            
            .section-title-elegant {
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

        /* Scroll animations */
        .scroll-reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease-out;
        }

        .scroll-reveal.revealed {
            opacity: 1;
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-elegant fixed-top">
        <div class="container">
            <a class="navbar-brand" href="#">
                <i class="fas fa-calendar-check me-2"></i>{{organisationdetail.name}}
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
                        <a href="{{BOOKNOWURL}}" class="btn-elegant">Book Now</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-elegant">
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
                        <i class="fas fa-envelope me-2"></i>Get In Touch
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="section-elegant">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mb-5">
                    <div class="about-card">
                        <h2 class="section-title-elegant text-start">About Us</h2>
                        <p class="fs-5 mb-4">Welcome to <strong>{{organisationdetail.name}}</strong>, your trusted partner for professional services. We are committed to providing exceptional quality and customer satisfaction with years of experience in our field.</p>
                        
                        <div class="row mt-5">
                            <div class="col-md-6 mb-4">
                                <div class="feature-card">
                                    <div class="feature-icon-elegant">
                                        <i class="fas fa-award"></i>
                                    </div>
                                    <h4>Quality Service</h4>
                                    <p class="text-muted">We deliver top-notch services with attention to detail and excellence.</p>
                                </div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <div class="feature-card">
                                    <div class="feature-icon-elegant">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <h4>Expert Team</h4>
                                    <p class="text-muted">Our skilled professionals are dedicated to meeting your needs.</p>
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
    <section class="stats-section-elegant">
        <div class="container">
            <div class="row">
                <div class="col-md-3 col-6 mb-4">
                    <div class="stat-item">
                        <div class="stat-number-elegant">500+</div>
                        <div class="stat-label">Happy Clients</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-4">
                    <div class="stat-item">
                        <div class="stat-number-elegant">1000+</div>
                        <div class="stat-label">Services Done</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-4">
                    <div class="stat-item">
                        <div class="stat-number-elegant">5★</div>
                        <div class="stat-label">Customer Rating</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-4">
                    <div class="stat-item">
                        <div class="stat-number-elegant">24/7</div>
                        <div class="stat-label">Support</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Location Images -->
    {{#locationimages}}

    <!-- Services Section -->
    <section id="services" class="section-elegant">
        <div class="container">
            <h2 class="section-title-elegant">Our Services</h2>
            <p class="section-subtitle">We offer a wide range of professional services to meet your needs</p>
            <div class="row">
                {{#orgnaisatinservice}}
                <!-- Service cards will be dynamically inserted here -->
                {{/orgnaisatinservice}}
            </div>
        </div>
    </section>

    <!-- Service Timings -->
    <section class="section-elegant" style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
        <div class="container">
            <h2 class="section-title-elegant">Service Hours</h2>
            <p class="section-subtitle">We are here to serve you during these hours</p>
            <div class="timing-card">
                {{#OrganisationServiceTiming}}
                <!-- Timing items will be dynamically inserted here -->
                {{/OrganisationServiceTiming}}
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-section-elegant">
        <div class="container">
            <div class="contact-card-elegant">
                <h2 class="contact-title">Ready to Book Your Appointment?</h2>
                <p class="contact-description">Schedule your visit with us today and experience our exceptional service. We are looking forward to serving you!</p>
                <div class="d-flex justify-content-center gap-3 flex-wrap">
                    <a href="{{BOOKNOWURL}}" class="btn-elegant">
                        <i class="fas fa-calendar-plus me-2"></i>Book Now
                    </a>
                    {{#customurl}}
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer-elegant">
        <div class="container">
            <div class="row">
                <div class="col-lg-4 mb-4">
                    <h5>{{organisationdetail.name}}</h5>
                    <p class="text-light mb-3">{{organisationdetail.tagline}}</p>
                    <div class="social-links">
                        <a href="#" class="social-link"><i class="fab fa-facebook"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-linkedin"></i></a>
                    </div>
                </div>
                <div class="col-lg-4 mb-4">
                    <h5>Quick Links</h5>
                    <a href="#about" class="footer-link">About Us</a>
                    <a href="#services" class="footer-link">Services</a>
                    <a href="{{BOOKNOWURL}}" class="footer-link">Book Appointment</a>
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
        // Navbar scroll effect
        window.addEventListener(''scroll'', function() {
            const navbar = document.querySelector(''.navbar-elegant'');
            if (window.scrollY > 100) {
                navbar.classList.add(''scrolled'');
            } else {
                navbar.classList.remove(''scrolled'');
            }
        });

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

        // Scroll reveal animation
        const observerOptions = {
            threshold: 0.1,
            rootMargin: ''0px 0px -50px 0px''
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(''revealed'');
                }
            });
        }, observerOptions);

        document.querySelectorAll(''.scroll-reveal'').forEach(el => {
            observer.observe(el);
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
