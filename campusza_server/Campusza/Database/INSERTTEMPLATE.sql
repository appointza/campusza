INSERT INTO ReferenceValue (
    id,
    identifier,
    displaytext,
    description,
    langcode,
    organizationid,
    referencetypeid,
    version,
    createdby,
    createdon,
    modifiedby,
    modifiedon,
    attributes,
    isactive,
    issuspended,
    parentid,
    isfactory,
    notes
)
VALUES (
    61,
    'Vedathri Template',
    'VEDATHRI TEMPLATE',
    '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    
    :root {
      --primary: hsl(217, 91%, 60%);
      --primary-foreground: hsl(0, 0%, 100%);
      --background: hsl(0, 0%, 100%);
      --foreground: hsl(222, 47%, 11%);
      --card: hsl(0, 0%, 100%);
      --muted: hsl(220, 14%, 96%);
      --muted-foreground: hsl(220, 9%, 46%);
      --border: hsl(220, 13%, 91%);
      --secondary: hsl(220, 14%, 96%);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: var(--foreground);
      background: var(--background);
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      min-height: 70vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 5rem 2rem;
      background: linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(240, 91%, 65%) 100%);
      overflow: hidden;
    }

    .hero-glow-1, .hero-glow-2 {
      position: absolute;
      width: 24rem;
      height: 24rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      filter: blur(3rem);
      animation: pulse 3s ease-in-out infinite;
    }

    .hero-glow-1 {
      top: 25%;
      left: 25%;
      animation-delay: 0s;
    }

    .hero-glow-2 {
      bottom: 25%;
      right: 25%;
      animation-delay: 1s;
    }

    .hero-content {
      position: relative;
      z-index: 10;
      max-width: 56rem;
      margin: 0 auto;
    }

    .hero-title {
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 700;
      color: var(--primary-foreground);
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }

    .hero-subtitle {
      font-size: clamp(1.125rem, 2vw, 1.25rem);
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
      max-width: 32rem;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--background);
      color: var(--foreground);
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
      text-decoration: none;
    }

    .hero-button:hover {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: scale(1.05);
    }

    .hero-arrow {
      width: 1.25rem;
      height: 1.25rem;
    }

    .hero-bottom-gradient {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 8rem;
      background: linear-gradient(to top, rgba(255, 255, 255, 0.1), transparent);
    }

    /* Header Section */
    .header-section {
      position: sticky;
      top: 0;
      z-index: 50;
      width: 100%;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
    }

    .header-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 4rem;
    }

    .header-logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--foreground);
    }

    .header-logo img {
      height: 2rem;
      width: auto;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .nav-link {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted-foreground);
      text-decoration: none;
      transition: color 0.2s;
    }

    .nav-link:hover {
      color: var(--foreground);
    }

    .header-cta {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      background: var(--primary);
      color: var(--primary-foreground);
      font-size: 0.875rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }

    /* Footer Section */
    .footer-section {
      padding: 4rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.2), var(--background));
      border-top: 1px solid var(--border);
      position: relative;
      overflow: hidden;
    }

    .footer-glow-1, .footer-glow-2 {
      position: absolute;
      width: 24rem;
      height: 24rem;
      border-radius: 50%;
      background: rgba(217, 91%, 60%, 0.05);
      filter: blur(3rem);
    }

    .footer-glow-1 {
      bottom: 0;
      left: 0;
    }

    .footer-glow-2 {
      top: 0;
      right: 0;
    }

    .footer-container {
      max-width: 75rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .footer-col h3 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .footer-col h4 {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }

    .footer-col p {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin-bottom: 1rem;
    }

    .footer-col ul {
      list-style: none;
    }

    .footer-col ul li {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin-bottom: 0.5rem;
    }

    .footer-col ul a {
      display: block;
      font-size: 0.875rem;
      color: var(--muted-foreground);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-col ul a:hover {
      color: var(--foreground);
    }

    .footer-copyright {
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }

    /* Features Section */
    .features-section {
      padding: 5rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.2), var(--background));
      position: relative;
      overflow: hidden;
    }

    .features-glow-1, .features-glow-2 {
      position: absolute;
      width: 24rem;
      height: 24rem;
      border-radius: 50%;
      background: rgba(217, 91%, 60%, 0.05);
      filter: blur(3rem);
    }

    .features-glow-1 {
      top: 0;
      left: 25%;
    }

    .features-glow-2 {
      bottom: 0;
      right: 25%;
    }

    .features-container {
      max-width: 75rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .features-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 4rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      background: var(--card);
      padding: 2rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      transition: all 0.3s;
    }

    .feature-card:hover {
      border-color: var(--primary);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .feature-icon {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 0.75rem;
      background: rgba(217, 91%, 60%, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
    }

    .feature-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .feature-card p {
      color: var(--muted-foreground);
      line-height: 1.75;
    }

    /* Text Section */
    .text-section {
      padding: 4rem 2rem;
      background: var(--background);
      border-top: 1px solid rgba(220, 13%, 91%, 0.5);
      border-bottom: 1px solid rgba(220, 13%, 91%, 0.5);
    }

    .text-container {
      max-width: 48rem;
      margin: 0 auto;
    }

    .text-content {
      color: var(--foreground);
      line-height: 1.75;
      font-size: 1.125rem;
      white-space: pre-wrap;
    }

    /* Image Section */
    .image-section {
      padding: 4rem 2rem;
      background: rgba(220, 14%, 96%, 0.3);
      position: relative;
      overflow: hidden;
    }

    .image-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .image-wrapper {
      position: relative;
    }

    .image-wrapper img {
      width: 100%;
      height: auto;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(220, 13%, 91%, 0.5);
    }

    /* Carousel Section */
    .carousel-section {
      padding: 4rem 2rem;
      background: linear-gradient(to bottom right, rgba(220, 14%, 96%, 0.5), rgba(220, 14%, 96%, 0.3));
      position: relative;
      overflow: hidden;
    }

    .carousel-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .carousel-wrapper {
      position: relative;
      overflow: hidden;
      border-radius: 1rem;
      aspect-ratio: 16/9;
      background: var(--muted);
    }

    .carousel-slide {
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .carousel-slide.active {
      opacity: 1;
    }

    .carousel-slide img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* CTA Section */
    .cta-section {
      padding: 6rem 2rem;
      background: linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(240, 91%, 65%) 100%);
      position: relative;
      overflow: hidden;
    }

    .cta-glow {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24rem;
      height: 24rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      filter: blur(3rem);
      animation: pulse 3s ease-in-out infinite;
    }

    .cta-container {
      max-width: 48rem;
      margin: 0 auto;
      text-align: center;
      position: relative;
      z-index: 10;
    }

    .cta-container h2 {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      color: var(--primary-foreground);
      margin-bottom: 1rem;
    }

    .cta-container p {
      font-size: 1.125rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--background);
      color: var(--foreground);
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
      text-decoration: none;
    }

    .cta-button:hover {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: scale(1.05);
    }

    /* Testimonial Section */
    .testimonial-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, rgba(220, 14%, 96%, 0.4), rgba(220, 14%, 96%, 0.2), rgba(220, 14%, 96%, 0.4));
      position: relative;
      overflow: hidden;
    }

    .testimonial-quote-1, .testimonial-quote-2 {
      position: absolute;
      font-size: 9rem;
      font-family: serif;
      line-height: 1;
      color: rgba(217, 91%, 60%, 0.05);
    }

    .testimonial-quote-1 {
      top: 2.5rem;
      left: 2.5rem;
    }

    .testimonial-quote-2 {
      bottom: 2.5rem;
      right: 2.5rem;
      transform: rotate(180deg);
    }

    .testimonial-container {
      max-width: 48rem;
      margin: 0 auto;
      text-align: center;
      position: relative;
      z-index: 10;
    }

    .testimonial-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: linear-gradient(to bottom right, rgba(217, 91%, 60%, 0.2), rgba(217, 91%, 60%, 0.1));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin: 0 auto 2rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(217, 91%, 60%, 0.2);
    }

    .testimonial-container blockquote {
      font-size: clamp(1.5rem, 3vw, 1.875rem);
      font-weight: 500;
      font-style: italic;
      margin-bottom: 2.5rem;
      line-height: 1.75;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .testimonial-author img {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(217, 91%, 60%, 0.2);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .testimonial-name {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .testimonial-role {
      color: var(--muted-foreground);
    }

    /* Benefits Section */
    .benefits-section {
      padding: 5rem 2rem;
      background: linear-gradient(to bottom, rgba(220, 14%, 96%, 0.2), var(--background), rgba(220, 14%, 96%, 0.2));
      position: relative;
      overflow: hidden;
    }

    .benefits-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .benefits-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 3rem;
    }

    .benefits-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .benefit-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--card);
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      transition: all 0.3s;
    }

    .benefit-item:hover {
      border-color: var(--primary);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .benefit-check {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: rgba(217, 91%, 60%, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      font-weight: 600;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .benefit-item p {
      font-size: 1.125rem;
      line-height: 1.75;
      flex: 1;
    }

    /* Stats Section */
    .stats-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom right, rgba(217, 91%, 60%, 0.05), var(--background), rgba(217, 91%, 60%, 0.05));
      position: relative;
      overflow: hidden;
    }

    .stats-container {
      max-width: 75rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .stats-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 4rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: clamp(2.5rem, 5vw, 3.75rem);
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      font-weight: 500;
    }

    /* Gallery Section */
    .gallery-section {
      padding: 5rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.2), var(--background));
      position: relative;
      overflow: hidden;
    }

    .gallery-container {
      max-width: 80rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .gallery-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 3rem;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .gallery-item {
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--muted);
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    .gallery-item:hover img {
      transform: scale(1.1);
    }

    .gallery-empty {
      text-align: center;
      padding: 4rem;
      color: var(--muted-foreground);
      border: 2px dashed var(--border);
      border-radius: 1rem;
    }

    /* Video Section */
    .video-section {
      padding: 5rem 2rem;
      background: linear-gradient(to bottom right, rgba(220, 14%, 96%, 0.3), var(--background), rgba(220, 14%, 96%, 0.3));
      position: relative;
      overflow: hidden;
    }

    .video-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .video-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .video-description {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 2rem;
    }

    .video-wrapper {
      position: relative;
      aspect-ratio: 16/9;
      border-radius: 1rem;
      overflow: hidden;
      border: 2px solid var(--border);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .video-wrapper iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .video-placeholder {
      aspect-ratio: 16/9;
      border: 2px dashed var(--border);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--muted);
      color: var(--muted-foreground);
    }

    /* Form Section */
    .form-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.2), var(--background));
      position: relative;
      overflow: hidden;
    }

    .form-container {
      max-width: 32rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .form-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
    }

    .form-subtitle {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 3rem;
    }

    .form-wrapper {
      background: var(--card);
      padding: 2rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .form-field input,
    .form-field textarea {
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      font-size: 1rem;
      font-family: inherit;
    }

    .form-field textarea {
      min-height: 120px;
      resize: vertical;
    }

    .form-submit {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--primary) 0%, hsl(240, 91%, 65%) 100%);
      color: var(--primary-foreground);
      border: none;
      border-radius: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .form-submit:hover {
      transform: scale(1.02);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    /* Pricing Section */
    .pricing-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.1), var(--background));
      position: relative;
      overflow: hidden;
    }

    .pricing-container {
      max-width: 80rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .pricing-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
    }

    .pricing-subtitle {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 4rem;
      max-width: 32rem;
      margin-left: auto;
      margin-right: auto;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .pricing-plan {
      position: relative;
      background: var(--card);
      border-radius: 1rem;
      border: 2px solid var(--border);
      padding: 2rem;
      transition: all 0.3s;
    }

    .pricing-plan:hover {
      border-color: var(--primary);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .pricing-plan.popular {
      border-color: var(--primary);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      transform: scale(1.05);
    }

    .popular-badge {
      position: absolute;
      top: -0.75rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: var(--primary-foreground);
      padding: 0.25rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .pricing-plan h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .plan-description {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin-bottom: 1rem;
    }

    .plan-price {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      margin-bottom: 2rem;
    }

    .price-amount {
      font-size: 3rem;
      font-weight: 700;
    }

    .price-period {
      color: var(--muted-foreground);
    }

    .plan-features {
      list-style: none;
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .feature-included {
      color: var(--foreground);
    }

    .feature-excluded {
      color: var(--muted-foreground);
      text-decoration: line-through;
    }

    .plan-button {
      width: 100%;
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s;
    }

    .pricing-plan.popular .plan-button {
      background: linear-gradient(135deg, var(--primary) 0%, hsl(240, 91%, 65%) 100%);
      color: var(--primary-foreground);
    }

    .pricing-plan:not(.popular) .plan-button {
      background: transparent;
      color: var(--foreground);
      border: 1px solid var(--border);
    }

    .plan-button:hover {
      transform: scale(1.02);
    }

    /* Reviews Section */
    .reviews-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, rgba(220, 14%, 96%, 0.3), var(--background), rgba(220, 14%, 96%, 0.3));
      position: relative;
      overflow: hidden;
    }

    .reviews-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .reviews-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 4rem;
    }

    .review-card {
      background: var(--card);
      padding: 3rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .review-stars {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
      margin-bottom: 1.5rem;
      color: #fbbf24;
      font-size: 1.25rem;
    }

    .review-card blockquote {
      font-size: clamp(1.5rem, 3vw, 1.875rem);
      font-weight: 500;
      font-style: italic;
      text-align: center;
      margin-bottom: 2rem;
      line-height: 1.75;
    }

    .review-author {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .review-author img {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(217, 91%, 60%, 0.2);
    }

    .review-name {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .review-role {
      color: var(--muted-foreground);
      font-size: 0.875rem;
    }

    /* Logos Section */
    .logos-section {
      padding: 4rem 2rem;
      background: var(--background);
      border-top: 1px solid rgba(220, 13%, 91%, 0.5);
      border-bottom: 1px solid rgba(220, 13%, 91%, 0.5);
    }

    .logos-container {
      max-width: 75rem;
      margin: 0 auto;
    }

    .logos-title {
      font-size: 1.25rem;
      font-weight: 600;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted-foreground);
      margin-bottom: 3rem;
    }

    .logos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 2rem;
      align-items: center;
    }

    .logo-item {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      filter: grayscale(100%);
      opacity: 0.6;
      transition: all 0.3s;
    }

    .logo-item:hover {
      filter: grayscale(0%);
      opacity: 1;
    }

    .logo-item img {
      max-height: 3rem;
      max-width: 100%;
      object-fit: contain;
    }

    /* FAQ Section */
    .faq-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, rgba(220, 14%, 96%, 0.2), var(--background), rgba(220, 14%, 96%, 0.2));
      position: relative;
      overflow: hidden;
    }

    .faq-container {
      max-width: 48rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .faq-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 3rem;
    }

    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .faq-item {
      background: var(--card);
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      overflow: hidden;
      transition: all 0.3s;
    }

    .faq-item:hover {
      border-color: var(--primary);
    }

    .faq-question {
      padding: 1.5rem;
      font-weight: 600;
      cursor: pointer;
    }

    .faq-answer {
      padding: 0 1.5rem 1.5rem;
      color: var(--muted-foreground);
      line-height: 1.75;
    }

    /* Steps Section */
    .steps-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.1), var(--background));
      position: relative;
      overflow: hidden;
    }

    .steps-container {
      max-width: 80rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .steps-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
    }

    .steps-subtitle {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 4rem;
      max-width: 32rem;
      margin-left: auto;
      margin-right: auto;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      position: relative;
    }

    .step-item {
      text-align: center;
      position: relative;
    }

    .step-number {
      width: 6rem;
      height: 6rem;
      border-radius: 50%;
      background: linear-gradient(to bottom right, rgba(217, 91%, 60%, 0.2), rgba(217, 91%, 60%, 0.1));
      border: 4px solid var(--background);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
      margin: 0 auto 1.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .step-number::after {
      content: '';
      position: absolute;
      top: -0.5rem;
      right: -0.5rem;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .step-item h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .step-item p {
      color: var(--muted-foreground);
      line-height: 1.75;
    }

    /* Team Section */
    .team-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.2), var(--background));
      position: relative;
      overflow: hidden;
    }

    .team-container {
      max-width: 75rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .team-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
    }

    .team-subtitle {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 4rem;
      max-width: 32rem;
      margin-left: auto;
      margin-right: auto;
    }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .team-member {
      background: var(--card);
      border-radius: 1rem;
      border: 1px solid var(--border);
      padding: 2rem;
      text-align: center;
      transition: all 0.3s;
    }

    .team-member:hover {
      border-color: var(--primary);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .team-member img {
      width: 8rem;
      height: 8rem;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto 1.5rem;
      border: 4px solid var(--background);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .team-member h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .member-role {
      color: var(--primary);
      font-weight: 500;
      margin-bottom: 1rem;
    }

    .member-bio {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      line-height: 1.75;
    }

    /* Appointza Blocks */
    .appointza-org-section,
    .appointza-location-section,
    .appointza-services-section,
    .appointza-timings-section,
    .appointza-events-section,
    .appointza-reviews-section,
    .appointza-facilities-section,
    .appointza-location-images-section {
      padding: 6rem 2rem;
      position: relative;
      overflow: hidden;
    }

    .appointza-services-section,
    .appointza-events-section,
    .appointza-location-section {
      background: linear-gradient(to bottom, var(--background), rgba(59, 130, 246, 0.05), var(--background));
    }

    .appointza-services-bg,
    .appointza-events-bg,
    .appointza-location-bg {
      position: absolute;
      inset: 0;
      opacity: 0.2;
      pointer-events: none;
    }

    .appointza-services-bg::before,
    .appointza-events-bg::before,
    .appointza-location-bg::before {
      content: '';
      position: absolute;
      top: 25%;
      right: 25%;
      width: 24rem;
      height: 24rem;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 50%;
      filter: blur(3rem);
    }

    .appointza-services-bg::after,
    .appointza-events-bg::after,
    .appointza-location-bg::after {
      content: '';
      position: absolute;
      bottom: 25%;
      left: 25%;
      width: 24rem;
      height: 24rem;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 50%;
      filter: blur(3rem);
    }

    .appointza-org-container,
    .appointza-location-container,
    .appointza-services-container,
    .appointza-timings-container,
    .appointza-events-container,
    .appointza-reviews-container,
    .appointza-facilities-container,
    .appointza-location-images-container {
      max-width: 72rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .appointza-location-container {
      max-width: 64rem;
    }

    .appointza-location-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 768px) {
      .appointza-location-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .appointza-location-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .appointza-location-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      background: rgba(59, 130, 246, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--primary);
      margin-top: 0.25rem;
    }

    .appointza-location-content {
      flex: 1;
    }

    .appointza-location-content h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 0.5rem;
    }

    .appointza-location-text {
      color: var(--muted-foreground);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .appointza-location-text p {
      margin: 0;
      font-size: 0.875rem;
    }

    .appointza-location-label {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin: 0 0 0.25rem 0;
    }

    .appointza-location-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--foreground);
      margin: 0;
    }

    .appointza-location-link {
      color: var(--primary);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      transition: opacity 0.2s;
    }

    .appointza-location-link:hover {
      opacity: 0.8;
      text-decoration: underline;
    }

    .appointza-org-logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 1rem;
    }

    .appointza-org-section h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .appointza-org-tagline {
      font-size: 1.125rem;
      color: var(--muted-foreground);
      margin-bottom: 1rem;
    }

    .appointza-org-notes {
      font-size: 1rem;
      color: var(--foreground);
      margin-bottom: 0.5rem;
    }

    .appointza-location-section h2,
    .appointza-services-section h2,
    .appointza-timings-section h2,
    .appointza-events-section h2,
    .appointza-reviews-section h2,
    .appointza-facilities-section h2,
    .appointza-location-images-section h2 {
      font-size: 2.25rem;
      font-weight: 700;
      text-align: center;
      color: var(--foreground);
      margin-bottom: 2rem;
    }

    @media (min-width: 768px) {
      .appointza-location-section h2 {
        font-size: 2.5rem;
        margin-bottom: 2rem;
      }
    }

    @media (min-width: 768px) {
      .appointza-services-section h2,
      .appointza-events-section h2 {
        font-size: 2.5rem;
      }
    }

    .appointza-location-container p,
    .appointza-facility-item p {
      color: var(--foreground);
      margin-bottom: 0.5rem;
    }

    .appointza-location-container a {
      color: var(--primary);
      text-decoration: none;
    }

    .appointza-services-list,
    .appointza-events-list {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
    }

    @media (min-width: 768px) {
      .appointza-services-list {
        grid-template-columns: repeat(2, 1fr);
      }
      .appointza-events-list {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .appointza-services-list {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .appointza-service-card,
    .appointza-event-card {
      background: var(--card);
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      overflow: hidden;
      transition: all 0.3s ease;
      text-align: left;
    }

    .appointza-service-card:hover,
    .appointza-event-card:hover {
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .appointza-service-image,
    .appointza-event-image {
      height: 12rem;
      background: var(--muted);
      overflow: hidden;
    }

    .appointza-service-image img,
    .appointza-event-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .appointza-service-content,
    .appointza-event-content {
      padding: 1.5rem;
    }

    .appointza-service-card h3,
    .appointza-event-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 1rem;
    }

    .appointza-service-details,
    .appointza-event-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .appointza-service-detail-item,
    .appointza-event-detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }

    .appointza-icon {
      flex-shrink: 0;
      color: var(--muted-foreground);
    }

    .appointza-service-price,
    .appointza-event-amount {
      font-weight: 600;
      color: var(--primary);
    }

    .appointza-event-price .appointza-icon {
      color: var(--primary);
    }

    .appointza-service-notes {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .appointza-service-notes .appointza-icon {
      margin-top: 0.125rem;
    }

    .appointza-service-notes p {
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--muted-foreground);
      margin: 0;
    }

    .appointza-book-button,
    .appointza-service-button {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      margin-top: 1rem;
      padding: 0.625rem 1.25rem;
      background: hsl(217, 91%, 60%) !important;
      color: white !important;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      width: 100%;
      border: none;
      cursor: pointer;
    }

    .appointza-book-button:hover,
    .appointza-service-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: hsl(217, 91%, 55%) !important;
    }

    .appointza-event-description {
      font-size: 0.875rem;
      line-height: 1.625;
      color: var(--muted-foreground);
      margin: 1rem 0;
    }

    .appointza-event-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .appointza-event-status {
      flex: 1;
    }

    .appointza-event-button {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      padding: 0.625rem 1.25rem;
      background: hsl(217, 91%, 60%) !important;
      color: white !important;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
      border: none;
      cursor: pointer;
    }

    .appointza-event-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: hsl(217, 91%, 55%) !important;
    }

    .appointza-status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      background-color: rgb(243, 244, 246);
      color: rgb(31, 41, 55);
    }

    .appointza-status-badge[data-status="Active"] {
      background-color: rgb(220, 252, 231);
      color: rgb(22, 101, 52);
    }

    .appointza-timings-list,
    .appointza-reviews-list,
    .appointza-facilities-list,
    .appointza-location-images-grid {
      display: grid;
      gap: 1rem;
    }

    .appointza-timing-item,
    .appointza-review-item,
    .appointza-facility-item {
      background: var(--background);
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      text-align: left;
    }

    .appointza-timing-item p,
    .appointza-review-item p {
      font-size: 0.9rem;
      color: var(--muted-foreground);
      margin-bottom: 0.25rem;
    }

    .appointza-review-stars {
      color: gold;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .appointza-review-item blockquote {
      font-size: 1rem;
      font-style: italic;
      margin-bottom: 0.5rem;
      color: var(--foreground);
    }

    .appointza-location-images-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .appointza-location-image-item {
      width: 100%;
      height: 16rem;
      overflow: hidden;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.3s ease;
      background: var(--muted);
    }

    .appointza-location-image-item:hover {
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .appointza-location-image-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .appointza-location-image-item:hover img {
      transform: scale(1.1);
    }

    /* Image Preview Modal */
    .appointza-image-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.9);
      align-items: center;
      justify-content: center;
      padding: 2rem;
      cursor: pointer;
    }

    .appointza-image-modal.active {
      display: flex;
    }

    .appointza-image-modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      font-size: 2rem;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      z-index: 10000;
    }

    .appointza-image-modal-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .appointza-image-modal-img {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 0.5rem;
      cursor: default;
    }

    /* Default Section */
    .default-section {
      padding: 4rem 2rem;
      text-align: center;
    }

    /* Animations */
    @keyframes pulse {
      0%, 100% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.6;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-nav {
        display: none;
      }

      .features-grid,
      .pricing-grid,
      .team-grid,
      .steps-grid {
        grid-template-columns: 1fr;
      }

      .footer-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .pricing-plan.popular {
        transform: scale(1);
      }
    }
  
    .page-content {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  
    <div id="page-home" class="page-content" style="display: block;">
      

    <section style="position: relative; min-height: 90vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 5rem 2rem; overflow: hidden;">
      <div style="position: absolute; inset: 0;"><img src="data:image/webp;base64,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" alt="PANRUTI BANGALA THERU THAVAMAIYAM" style="width: 100%; height: 100%; object-fit: cover;" /><div style="position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5);"></div></div>
      <div style="position: relative; z-index: 10; max-width: 56rem; margin: 0 auto;">
        <h1 style="font-size: clamp(2.25rem, 4vw, 3.75rem); font-weight: 700; color: white; margin-bottom: 1.5rem; line-height: 1.2; filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.3));">PANRUTI BANGALA THERU THAVAMAIYAM</h1>
        <p style="font-size: clamp(1.125rem, 2vw, 1.25rem); color: rgba(255, 255, 255, 0.9); margin-bottom: 2rem; max-width: 32rem; margin-left: auto; margin-right: auto; filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.2));">Individual Peace leads to World Peace</p>
        <a href="#" style="display: inline-flex; align-items: center; gap: 0.5rem; background: white; color: var(--foreground); padding: 1rem 2rem; border-radius: 0.75rem; font-weight: 600; font-size: 1.125rem; text-decoration: none; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); transition: all 0.3s;">Get Started <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
      </div>
    </section>

    <section class="appointza-location-section">
      <div class="appointza-location-bg"></div>
      <div class="appointza-location-container">
        <h2>Location Details</h2>
        <div class="appointza-location-grid">
          <div class="appointza-location-col">
            <div class="appointza-location-item">
              <div class="appointza-location-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="appointza-location-content">
                <h3>Address</h3>
                <div class="appointza-location-text">
                  <p>{{locationdetail.addressline1}}</p>
                  {{#addressline2}}<p>{{locationdetail.addressline2}}</p>{{/addressline2}}
                  <p>{{locationdetail.city}}, {{locationdetail.state}} - {{locationdetail.pincode}}</p>
                  {{#country}}<p>{{locationdetail.country}}</p>{{/country}}
                </div>
              </div>
            </div>
            <div class="appointza-location-item">
              <div class="appointza-location-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div class="appointza-location-content">
                <p class="appointza-location-label">Phone</p>
                <p class="appointza-location-value">{{locationdetail.mobile}}</p>
              </div>
            </div>
          </div>
          <div class="appointza-location-col">
            {{#googlemaps}}
            <div class="appointza-location-item">
              <div class="appointza-location-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <div class="appointza-location-content">
                <h3>Location</h3>
                <a href="{{locationdetail.googlelocation}}" target="_blank" rel="noopener noreferrer" class="appointza-location-link">
                  View on Google Maps
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>
            </div>
            {{/googlemaps}}
            {{#coordinates}}
            <div class="appointza-location-item">
              <div class="appointza-location-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
              <div class="appointza-location-content">
                <p class="appointza-location-label">Coordinates</p>
                <p class="appointza-location-value">{{locationdetail.latitude}}, {{locationdetail.longitude}}</p>
              </div>
            </div>
            {{/coordinates}}
          </div>
        </div>
      </div>
    </section>

    <section class="appointza-services-section">
      <div class="appointza-services-bg"></div>
      <div class="appointza-services-container">
        <h2>Our Services</h2>
        <div class="appointza-services-list">
          {{#orgnaisatinservice}}
          <div class="appointza-service-card">
            {{#service_image_id}}
            <div class="appointza-service-image">
              <img src="/api/Files/Get?id={{service_image_id}}" alt="{{Servicename}}" />
            </div>
            {{/service_image_id}}
            <div class="appointza-service-content">
              <h3>{{Servicename}}</h3>
              <div class="appointza-service-details">
                <div class="appointza-service-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span class="appointza-service-price">₹{{prize}}</span>
                </div>
                <div class="appointza-service-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{timetaken}} minutes</span>
                </div>
              </div>
              <div class="appointza-service-notes">
                <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 9 11"></polyline>
                </svg>
                <p>{{notes}}</p>
              </div>
              <a href="{{BOOKNOWURL}}" class="appointza-service-button">Book Appointment</a>
            </div>
          </div>
          {{/orgnaisatinservice}}
        </div>
      </div>
    </section>

    <section class="appointza-events-section">
      <div class="appointza-events-bg"></div>
      <div class="appointza-events-container">
        <h2>Upcoming Events</h2>
        {{#hasevents}}
        <div class="appointza-events-list">
          {{#events}}
          <div class="appointza-event-card">
            {{#event_image_id}}
            <div class="appointza-event-image">
              <img src="/api/Files/Get?id={{event_image_id}}" alt="{{event_name}}" />
            </div>
            {{/event_image_id}}
            <div class="appointza-event-content">
              <h3>{{event_name}}</h3>
              <div class="appointza-event-details">
                <div class="appointza-event-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{{event_date}}</span>
                </div>
                <div class="appointza-event-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{from_date}}{{#to_date}} - {{to_date}}{{/to_date}}</span>
                </div>
                <div class="appointza-event-detail-item appointza-event-price">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span class="appointza-event-amount">₹{{entry_amount}}</span>
                </div>
                <div class="appointza-event-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>{{remainingslot}} slots remaining</span>
                </div>
              </div>
              <p class="appointza-event-description">{{description}}</p>
              <div class="appointza-event-footer">
                <div class="appointza-event-status">
                  <span class="appointza-status-badge" data-status="{{status}}">{{status}}</span>
                </div>
                <a href="{{EVENTBOOKURL}}" class="appointza-event-button">Book Now</a>
              </div>
            </div>
          </div>
          {{/events}}
        </div>
        {{/hasevents}}
      </div>
    </section>

    <section class="appointza-timings-section">
      <div class="appointza-timings-container">
        <h2>Service Timings</h2>
        <div class="appointza-timings-list">
          {{#OrganisationServiceTiming}}
          <div class="appointza-timing-item">
            <p>Day: {{day_name}}</p>
            <p>Time: {{start_time}} - {{end_time}}</p>
          </div>
          {{/OrganisationServiceTiming}}
        </div>
      </div>
    </section>
<script>
  function openImagePreview(imageSrc) {
    const modal = document.getElementById("imagePreviewModal");
    const img = document.getElementById("previewImage");
    if (modal && img) {
      img.src = imageSrc;
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeImagePreview() {
    const modal = document.getElementById("imagePreviewModal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  // Close on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      closeImagePreview();
    }
  });
</script>

    </div>
  
    <script>
      // Page data
      const pages = [{"id":"home","name":"home"}];
      const defaultPageId = ''home'';
      
      // Get page ID from URL path
      function getPageIdFromPath() {
        const path = window.location.pathname;
        if (path === ''/'' || path === '''') {
          return defaultPageId;
        }
        const pathName = path.replace(/^\\//, '''').replace(/\\/$/, '''');
        const page = pages.find(p => p.name === pathName);
        return page ? page.id : defaultPageId;
      }
      
      // Get page name from ID
      function getPageNameFromId(pageId) {
        const page = pages.find(p => p.id === pageId);
        return page ? page.name : defaultPageId;
      }
      
      // Page navigation function
      function navigateToPage(pageId) {
        // Hide all pages
        document.querySelectorAll(''.page-content'').forEach(page => {
          page.style.display = ''none'';
        });
        // Show target page
        const targetPage = document.getElementById(''page-'' + pageId);
        if (targetPage) {
          targetPage.style.display = ''block'';
          // Scroll to top
          window.scrollTo(0, 0);
          // Update URL using History API
          const pageName = getPageNameFromId(pageId);
          const newPath = pageId === defaultPageId ? ''/'' : ''/'' + pageName;
          window.history.pushState({ pageId: pageId }, '''', newPath);
          // Update document title
          const pageData = pages.find(p => p.id === pageId);
          if (pageData) {
            document.title = pageData.name.replace(/-/g, '' '').replace(/\\b\\w/g, l => l.toUpperCase()) + '' - '' + document.title.split('' - '').pop();
          }
        }
      }

      // Convert page links to navigation
      function convertPageLinks() {
        document.querySelectorAll(''a[href^="#page:"]'').forEach(link => {
          const href = link.getAttribute(''href'');
          if (href) {
            const pageId = href.replace(''#page:'', '''');
            link.addEventListener(''click'', function(e) {
              e.preventDefault();
              navigateToPage(pageId);
            });
            link.setAttribute(''href'', ''javascript:void(0)'');
          }
        });
      }

      // Initialize on page load
      document.addEventListener(''DOMContentLoaded'', function() {
        convertPageLinks();
        
        // Handle initial page load
        const pageId = getPageIdFromPath();
        if (document.getElementById(''page-'' + pageId)) {
          navigateToPage(pageId);
        } else {
          navigateToPage(defaultPageId);
        }
      });
      
      // Handle browser back/forward buttons
      window.addEventListener(''popstate'', function(event) {
        const pageId = event.state ? event.state.pageId : getPageIdFromPath();
        if (document.getElementById(''page-'' + pageId)) {
          navigateToPage(pageId);
        }
      });

      // Re-convert links after dynamic content loads
      setTimeout(convertPageLinks, 100);
    </script>
</body>
</html>',
    'en',
    0,
    5,
    3,
    0,
    '2025-04-19 15:56:52.248385',
    0,
    '2025-10-24 14:46:59.479341',
    '{}',
    true,
    false,
    0,
    true,
    'MEDITATION'
);
