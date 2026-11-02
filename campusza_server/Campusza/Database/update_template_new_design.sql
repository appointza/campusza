-- UPDATE New Template Design in ReferenceValue table
-- This template includes facilities, services, and service timings with modern design
-- Using dollar-quoting ($HTML$) to handle HTML content with single quotes

UPDATE ReferenceValue 
SET description = $HTML$
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{organisationdetail.name}}</title>
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
      /* Small custom styles */
      body {
        font-family: "Poppins", sans-serif;
      }
      .hero {
        background: linear-gradient(135deg, #0d6efd22, #6f42c122);
        border-radius: 0.5rem;
        padding: 3rem 1.5rem;
      }
      .dept-card img {
        height: 160px;
        object-fit: cover;
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
      }
      .faculty-photo {
        width: 86px;
        height: 86px;
        object-fit: cover;
        border-radius: 50%;
      }
      footer {
        background: #0b5ed7;
        color: #fff;
      }
      .primarycolour {
        color: #00416a;
      }
      .bg-primary {
        background-color: #00416a !important;
      }
      /* Define matching outline style */
      .btn-outline-bg-primary {
        color: #00416a;
        border: 1px solid #00416a;
      }
      .btn-outline-bg-primary:hover {
        background-color: #00416a;
        color: #fff;
      }
      img {
        width: 100%;
        border-radius: 8px;
        object-fit: cover;
      }
      .backgroundcolour {
        background-color: #f8f8ff;
      }
      .service-timing-row:not(:first-child) {
        margin-top: 0.5rem;
      }
    </style>
  </head>
  <body>
    <div class="d-flex flex-column p-5">
      <div class="row mb-3 align-items-center">
        <div
          class="col-12 col-md-6 d-flex flex-column align-items-start justify-content-center"
        >
          <div>
            <div class="h3 primarycolour mb-2 fw-semibold text-start">{{organisationdetail.name}}</div>
            <div class="primarycolour mb-3 text-start">{{organisationdetail.tagline}}</div>

            <div class="d-flex">
              <a
                href="{{BOOKNOWURL}}"
                class="btn btn-outline-bg-primary me-2"
                id="bookAppointment"
              >
                Book Appointment
              </a>
            
            </div>
          </div>
        </div>

        <div
          class="col-12 col-md-6 text-center mt-4 mt-md-0 d-flex align-items-center justify-content-center"
        >
          {{#organizationlogo}}
          <img
            src="http://appointza.com/api/Files/get?id={{organisationdetail.organisationlogo}}"
            alt="{{organisationdetail.name}}"
            class="img-fluid"
            style="max-width: 400px; width: 100%; height: auto;"
          />
          {{/organizationlogo}}
        </div>
      </div>
      <div class="row mb-2">
        <div class="col-6">
          <div class="text-dark h3">About</div>
          <div class="text-small">
            <p>
              Font Awesome is the internet's icon library and toolkit used by
              millions of designers, developers, and content creators. Made with
              and in Bentonville, Boston, Chicago, Grand Rapids, Joplin, Kansas
              City, Seattle, Tampa, and Vergennes.
            </p>
          </div>
        </div>
        <div class="col-12 col-md-3 ms-auto">
          <div class="backgroundcolour rounded py-2 px-3">
            <div class="mb-1 text-dark">Contact Info</div>
            <div class="mb-2">
              <i class="primarycolour fa-solid fa-location-dot me-2"></i>
              {{#googlemaps}}
              <a 
                href="https://www.google.com/maps/search/?api=1&query={{locationdetail.googlelocation}}" 
                target="_blank" 
                class="text-decoration-none primarycolour"
                style="text-decoration: none;"
              >
                {{locationdetail.addressline1}}{{#addressline2}}, {{locationdetail.addressline2}}{{/addressline2}}, {{locationdetail.city}}, {{locationdetail.state}}, {{locationdetail.pincode}}
              </a>
              {{/googlemaps}}
            </div>
            <div class="mb-2">
              <i class="primarycolour fa-solid fa-phone me-2"></i>
              <span>{{locationdetail.mobile}}</span>
            </div>
            <div class="mb-3">
              <i class="primarycolour fa-solid fa-envelope me-2"></i>
              <span>{{organizationemail}}</span>
            </div>
            {{#googlemaps}}
            <div class="text-center mt-3">
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination={{locationdetail.googlelocation}}" 
                target="_blank"
                class="btn btn-outline-bg-primary btn-sm w-100"
              >
                <i class="fa-solid fa-directions me-2"></i>Get Direction
              </a>
            </div>
            {{/googlemaps}}
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-2 me-2">
          <div class="rounded py-3 text-center backgroundcolour">
            <i class="fa-solid fa-star primarycolour mb-2"></i>
            <div class="primarycolour">Quality</div>
          </div>
        </div>
        <div class="col-2">
          <div class="rounded py-3 text-center backgroundcolour">
            <i class="fa-solid fa-star primarycolour mb-2"></i>
            <div class="primarycolour">Quality</div>
          </div>
        </div>
      </div>
    </div>
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
    {{#locationimages}}
    <div class="p-5">
      <div class="primarycolour h4 mb-4 text-center">Our Location</div>
      <div class="row g-3">
        <div class="col-6 col-md-4 col-lg-3">
          <img src="http://appointza.com/api/Files/get?id={{location_image_id}}" alt="Location Image" class="img-fluid" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
        </div>
      </div>
    </div>
    {{/locationimages}}
    {{#facilities}}
    <div class="p-5">
      <div class="primarycolour h4 mb-4 text-center">Facilities</div>
      <div class="row g-3">
        <div class="col-6 col-md-3">
          <div class="backgroundcolour border rounded p-3 text-center h-100">
            <i class="fa-solid fa-{{facility_identifier_lower}} primarycolour mb-2"></i>
            <div class="primarycolour">{{facility_identifier}}</div>
          </div>
        </div>
      </div>
    </div>
    {{/facilities}}
    <div class="p-5">
      <div class="primarycolour h4 mb-4">Services</div>
      <div class="row g-3">
         {{#orgnaisatinservice}}
         <div class="col-12 col-sm-6 col-md-4 col-lg-3">
           <div class="shadow-sm border rounded p-3 h-100">
             {{#service_image_id}}
             <img src="http://appointza.com/api/Files/get?id={{service_image_id}}" alt="{{Servicename}}" class="img-fluid mb-2" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;" />
             {{/service_image_id}}
             <div class="h4 primarycolour">{{Servicename}}</div>
             {{#notes}}
             <div class="small primarycolour mb-2">{{notes}}</div>
             {{/notes}}
             <div class="primarycolour h5">${{prize}} | {{timetaken}} min</div>
           </div>
         </div>
         {{/orgnaisatinservice}}
      </div>
    </div>
    <div class="p-5">
      <div class="primarycolour h4 mb-4">Upcoming Events</div>
      <div class="row g-3">
        {{#events}}
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="shadow-sm border rounded p-3 h-100 d-flex flex-column">
            {{#event_image_id}}
            <img src="http://appointza.com/api/Files/get?id={{event_image_id}}" alt="{{event_name}}" class="img-fluid mb-2" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px;" />
            {{/event_image_id}}
            <div class="h5 primarycolour mb-2">{{event_name}}</div>
            {{#description}}
            <div class="small primarycolour mb-2 flex-grow-1">{{description}}</div>
            {{/description}}
            <div class="mt-auto">
              {{#event_date}}
              <div class="small primarycolour mb-1">
                <i class="fa-solid fa-calendar me-2"></i>{{event_date}}
              </div>
              {{/event_date}}
              {{#from_date}}
              <div class="small primarycolour mb-1">
                <i class="fa-solid fa-calendar me-2"></i>{{from_date}}{{#to_date}} - {{to_date}}{{/to_date}}
              </div>
              {{/from_date}}
              {{#entry_amount}}
              <div class="primarycolour h6 mb-2">
                <i class="fa-solid fa-tag me-2"></i>${{entry_amount}}
              </div>
              {{/entry_amount}}
              {{#remainingslot}}
              <div class="small primarycolour mb-2">
                <i class="fa-solid fa-users me-2"></i>{{remainingslot}} slots remaining
              </div>
              {{/remainingslot}}
            </div>
            <div class="mt-3 pt-3 border-top">
              <a href="{{EVENTBOOKURL}}" class="btn btn-outline-bg-primary w-100">
                <i class="fa-solid fa-calendar-check me-2"></i>Book Event
              </a>
            </div>
          </div>
        </div>
        {{/events}}
      </div>
    </div>
    <div class="row p-5">
      <div class="col-12 col-md-6 mb-4 mb-md-0">
        <div class="primarycolour mb-3 h4">Service Timings</div>
        <div class="backgroundcolour p-3 rounded">
          {{#OrganisationServiceTiming}}
          <div class="row">
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
    </div>
    <!-- Bootstrap JS (bundle includes Popper) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // small JS helpers
      document.getElementById("year").textContent = new Date().getFullYear();
    </script>
  </body>
</html>
$HTML$
WHERE identifier = 'Pastel Template'
  AND referencetypeid = 5
  AND isactive = true;

-- Verify the update
SELECT 
    id,
    identifier,
    displaytext,
    LENGTH(description) as template_length,
    isactive
FROM ReferenceValue
WHERE identifier = 'Pastel Template'
  AND referencetypeid = 5;

