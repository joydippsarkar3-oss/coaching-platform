/** @type {import('@lhci/utils/src/manifest').LighthouseRcConfig} */
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/courses',
        'http://localhost:3000/verify',
      ],
      numberOfRuns: 3,
      settings: {
        // Simulate a mid-tier mobile device on a fast 4G network
        preset: 'desktop',
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      assertions: {
        // Category score thresholds
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Additional performance guards
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],

        // Accessibility: enforce no violations for critical rules
        'color-contrast': ['error', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'html-has-lang': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'link-name': ['error', { minScore: 1 }],

        // SEO essentials
        'meta-description': ['warn', { minScore: 1 }],
        'robots-txt': ['warn', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
