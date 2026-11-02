-- UPDATE Pastel Template in ReferenceValue table
-- This template includes all functionality placeholders while keeping Pastel UI design
-- Using dollar-quoting ($HTML$) to handle HTML content with single quotes

UPDATE ReferenceValue 
SET description = $HTML$
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{organisationdetail.name}} - Book Appointment | Appointza</title>
    <!-- Bootstrap 5 CSS (CDN) -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <!-- Optional: Bootstrap Icons -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.4/font/bootstrap-icons.css"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
    />
    <style>
      /* Pastel Template Styles */
      * {
        box-sizing: border-box;
      }
      html,
      body {
        overflow-x: hidden;
        max-width: 100%;
        font-family: "Poppins", sans-serif;
        background-color: #f8f9fa;
      }
      .navbar-custom {
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      }
      .hero-section {
        background: linear-gradient(135deg, #0d6efd22, #6f42c122);
        border-radius: 0.5rem;
        padding: 80px 0 60px;
        text-align: center;
        position: relative;
        overflow: hidden;
        margin-top: 76px;
      }
      .primarycolour {
        color: #00416a;
      }
      .bg-primary {
        background-color: #00416a !important;
      }
      .btn-outline-bg-primary {
        color: #00416a;
        border: 1px solid #00416a;
      }
      .btn-outline-bg-primary:hover {
        background-color: #00416a;
        color: #fff;
      }
      .btn-book {
        background: linear-gradient(135deg, #00416a 0%, #0066cc 100%);
        border: none;
        padding: 15px 40px;
        font-size: 18px;
        font-weight: 600;
        border-radius: 50px;
        color: white;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px rgba(0, 65, 106, 0.4);
      }
      .btn-book:hover {
        transform: scale(1.08);
        box-shadow: 0 8px 25px rgba(0, 65, 106, 0.6);
        color: white;
      }
      img {
        width: 100%;
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        object-fit: cover;
      }
      .backgroundcolour {
        background-color: #f8f8ff;
      }
      .event-image {
        height: 200px;
        width: 100%;
        object-fit: cover;
        border-radius: 12px 12px 0 0;
      }
      .location-image {
        height: 200px;
        width: 100%;
        object-fit: cover;
        border-radius: 12px;
        transition: all 0.3s ease;
      }
      .location-image:hover {
        transform: scale(1.02);
      }
      .image-card {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        background: white;
        height: 100%;
      }
      .image-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      }
      .service-card {
        border: none;
        border-radius: 12px;
        padding: 25px;
        margin-bottom: 25px;
        background: white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        transition: all 0.3s ease;
        height: 100%;
      }
      .service-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 30px rgba(0,0,0,0.15);
      }
      .timing-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #eee;
        transition: background-color 0.2s;
      }
      .timing-item:hover {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 12px 15px;
        margin: 0 -15px;
      }
      .section-title {
        position: relative;
        padding-bottom: 15px;
        margin-bottom: 30px;
        text-align: center;
      }
      .section-title::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 4px;
        background: linear-gradient(135deg, #00416a 0%, #0066cc 100%);
        border-radius: 2px;
      }
      .stats-section {
        background: linear-gradient(135deg, #00416a22 0%, #0066cc22 100%);
        color: #00416a;
        padding: 60px 0;
        border-radius: 20px;
        margin: 60px 0;
      }
      .stat-number {
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 10px;
      }
      footer {
        background: #00416a;
        color: #fff;
      }
    </style>
  </head>
  <body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-light navbar-custom fixed-top">
      <div class="container">
        <a class="navbar-brand fw-bold" href="#" style="color: #00416a;">
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
              <a href="{{BOOKNOWURL}}" class="btn btn-book ms-2">Book Now</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Header Section -->
    <div class="container">
      <div class="d-flex flex-column p-5">
        <div class="row mb-3 align-items-center">
          <div class="col-12 col-md-6 d-flex flex-column align-items-start justify-content-center">
            <div>
              <div class="h3 primarycolour mb-2 fw-semibold text-start">{{organisationdetail.name}}</div>
              <div class="primarycolour mb-3 text-start">{{organisationdetail.tagline}}</div>
              <div class="d-flex">
                <a href="{{BOOKNOWURL}}" class="btn btn-outline-bg-primary me-2" id="bookAppointment">
                  Book Appointment
                </a>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-6 text-center mt-4 mt-md-0 d-flex align-items-center justify-content-center">
            {{#organizationlogo}}
            <img
              src="http://appointza.com/api/Files/get?id={{organisationdetail.organisationlogo}}"
              alt="{{organisationdetail.name}}"
              class="img-fluid"
              style="max-width: 300px; width: 100%; height: auto;"
            />
            {{/organizationlogo}}
          </div>
        </div>
        <div class="row mb-2 g-3">
          <div class="col-12 col-md-6">
            <div class="text-dark h3">About</div>
            <div class="text-small">
              <p>
                Welcome to {{organisationdetail.name}}, your trusted partner for professional services. We are committed to providing exceptional quality and customer satisfaction with years of experience in our field.
              </p>
            </div>
          </div>
          <div class="col-12 col-md-3 ms-auto">
            <div class="backgroundcolour rounded py-2 px-3">
              <div class="mb-1 text-dark">Contact Info</div>
              <div class="mb-2">
                <i class="primarycolour fa-solid fa-location-dot me-2"></i>
                <a 
                  href="{{#googlemaps}}{{locationdetail.googlelocation}}{{/googlemaps}}" 
                  target="_blank" 
                  class="text-decoration-none primarycolour"
                  style="text-decoration: none;"
                >
                  {{locationdetail.addressline1}}
                </a>
              </div>
              {{#addressline2}}
              <div class="mb-2">
                <i class="primarycolour fa-solid fa-location-dot me-2"></i>
                <span>{{locationdetail.addressline2}}</span>
              </div>
              {{/addressline2}}
              <div class="mb-2">
                <i class="primarycolour fa-solid fa-phone me-2"></i>
                <span>{{locationdetail.mobile}}</span>
              </div>
              <div class="mb-3">
                <i class="primarycolour fa-solid fa-envelope me-2"></i>
                <span>{{organizationemail}}</span>
              </div>
              <div class="text-center mt-3">
                <a 
                  href="{{#googlemaps}}{{locationdetail.googlelocation}}{{/googlemaps}}" 
                  target="_blank"
                  class="btn btn-outline-bg-primary btn-sm w-100"
                >
                  <i class="fa-solid fa-directions me-2"></i>Get Direction
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-6 col-sm-4 col-md-3 col-lg-2">
            <div class="rounded py-3 text-center backgroundcolour">
              <i class="fa-solid fa-award primarycolour mb-2"></i>
              <div class="primarycolour small">Quality service</div>
            </div>
          </div>
          <div class="col-6 col-sm-4 col-md-3 col-lg-2">
            <div class="rounded py-3 text-center backgroundcolour">
              <i class="fa-solid fa-users primarycolour mb-2"></i>
              <div class="primarycolour small">Expert team</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="backgroundcolour">
      <div class="row g-3 p-5">
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">500+</div>
            <div class="primarycolour text-center">Happy Client</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">1000+</div>
            <div class="primarycolour text-center">Service Done</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">4.8</div>
            <div class="primarycolour text-center">Rating</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">24/7</div>
            <div class="primarycolour text-center">Support</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">10+</div>
            <div class="primarycolour text-center">Years Experience</div>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="p-5">
        <div class="primarycolour h4 mb-4 text-center">Facilities</div>
        <div class="row g-3">
          <div class="col-6 col-md-3">
            <div class="backgroundcolour border rounded p-3 text-center h-100">
              <i class="fa-solid fa-square-parking primarycolour mb-2"></i>
              <div class="primarycolour">Parking Facility</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="backgroundcolour border rounded p-3 text-center h-100">
              <i class="fa-solid fa-wifi primarycolour mb-2"></i>
              <div class="primarycolour">Wi-Fi Available</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="backgroundcolour border rounded p-3 text-center h-100">
              <i class="fa-solid fa-couch primarycolour mb-2"></i>
              <div class="primarycolour">Waiting Area</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="backgroundcolour border rounded p-3 text-center h-100">
              <i class="fa-regular fa-snowflake primarycolour mb-2"></i>
              <div class="primarycolour">Air Conditioned</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Location Images -->
      {{#locationimages}}

      <div class="p-5">
        <div class="primarycolour h4 mb-4">Services</div>
        <div class="row g-3">
          {{#orgnaisatinservice}}
          <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <div class="shadow-sm border rounded p-3 h-100">
              <div class="h4 primarycolour">{{Servicename}}</div>
              <div class="small primarycolour mb-2">{{notes}}</div>
              <div class="primarycolour h5">₹{{prize}}|{{timetaken}} min</div>
            </div>
          </div>
          {{/orgnaisatinservice}}
        </div>
      </div>
      <div class="row p-5">
        <div class="col-12 col-md-6 mb-4 mb-md-0">
          <div class="primarycolour mb-3 h4">Service Timings</div>
          <div class="backgroundcolour p-3 rounded">
            {{#OrganisationServiceTiming}}
            <div class="row mt-2">
              <div class="col-6">
                <div>{{day_name}}</div>
              </div>
              <div class="col-6 text-end">
                <div>{{start_time}} - {{end_time}}</div>
              </div>
            </div>
            {{/OrganisationServiceTiming}}
          </div>
        </div>
        <div class="col-12 col-md-3 offset-md-3">
          <div class="backgroundcolour p-4 rounded text-center text-md-start">
            <div class="primarycolour h4 mb-3">Ready to Book?</div>
            <a href="{{BOOKNOWURL}}" class="btn btn-outline-bg-primary" id="bookAppointment">
              Book Now
            </a>
          </div>
        </div>
      </div>

      <!-- Events Section -->
      {{#events}}
      <div class="p-5">
        <div class="primarycolour h4 mb-4">Upcoming Events</div>
        <div class="row g-3">
          {{/events}}
        </div>
      </div>
      {{/events}}

      <!-- Reviews Section -->
      {{#reviews}}
      <div class="p-5">
        <div class="primarycolour h4 mb-4">Customer Reviews</div>
        <div class="row g-3">
          {{/reviews}}
        </div>
      </div>
      {{/reviews}}
    </div>

    <!-- Footer -->
    <footer class="py-5" style="background: #00416a; color: #fff;">
      <div class="container">
        <div class="row">
          <div class="col-lg-4 mb-4">
            <h5 class="mb-3">{{organisationdetail.name}}</h5>
            <p class="text-light">{{organisationdetail.tagline}}</p>
            <div class="d-flex gap-3 mt-3">
              <a href="#" class="text-light"><i class="fab fa-facebook fa-lg"></i></a>
              <a href="#" class="text-light"><i class="fab fa-twitter fa-lg"></i></a>
              <a href="#" class="text-light"><i class="fab fa-instagram fa-lg"></i></a>
              <a href="#" class="text-light"><i class="fab fa-linkedin fa-lg"></i></a>
            </div>
          </div>
          <div class="col-lg-4 mb-4">
            <h5 class="mb-3">Quick Links</h5>
            <ul class="list-unstyled">
              <li><a href="#about" class="text-light text-decoration-none">About Us</a></li>
              <li><a href="#services" class="text-light text-decoration-none">Services</a></li>
              <li><a href="{{BOOKNOWURL}}" class="text-light text-decoration-none">Book Appointment</a></li>
            </ul>
          </div>
          <div class="col-lg-4 mb-4">
            <h5 class="mb-3">Contact Info</h5>
            <p class="mb-2"><i class="fas fa-map-marker-alt me-2"></i>{{locationdetail.addressline1}}, {{locationdetail.city}}</p>
            <p class="mb-2"><i class="fas fa-phone me-2"></i>{{locationdetail.mobile}}</p>
            <p class="mb-0"><i class="fas fa-envelope me-2"></i>{{organizationemail}}</p>
          </div>
        </div>
        <hr class="my-4">
        <div class="row align-items-center">
          <div class="col-md-6 text-center text-md-start">
            <p class="mb-0">&copy; {{currentyear}} {{organisationdetail.name}}. All rights reserved.</p>
          </div>
          <div class="col-md-6 text-center text-md-end">
            <p class="mb-0">Powered by <a href="https://appointza.com" class="text-light text-decoration-none">Appointza</a></p>
          </div>
        </div>
      </div>
    </footer>

    <!-- Bootstrap JS (bundle includes Popper) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // Smooth scrolling for navigation links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });

      // Navbar background change on scroll
      window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar-custom');
        if (window.scrollY > 100) {
          navbar.style.background = 'rgba(255,255,255,0.98)';
          navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
          navbar.style.background = 'rgba(255,255,255,0.95)';
          navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        }
      });
    </script>
  </body>
</html>
$HTML$
WHERE identifier = 'Pastel Template' AND referencetypeid = 5;

-- Verify the update
SELECT 'Pastel Template updated successfully with all functionality placeholders!' AS status;
