// Typed JSON-LD builders for Schema.org structured data

export interface CourseSchema {
  name: string;
  description: string;
  provider: string;
  url: string;
  educationalCredentialAwarded?: string;
  timeRequired?: string; // ISO 8601 duration e.g. "P6M"
}

export interface LocalBusinessSchema {
  name: string;
  description: string;
  url: string;
  telephone?: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    addressCountry: string;
  };
  image?: string;
  openingHours?: string[];
  geo?: { latitude: number; longitude: number };
}

export interface ArticleSchema {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  image?: string;
}

export interface WebSiteSchema {
  name: string;
  url: string;
  description: string;
}

export function buildCourseSchema(data: CourseSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: data.name,
    description: data.description,
    provider: {
      "@type": "Organization",
      name: data.provider,
      sameAs: data.url,
    },
    url: data.url,
    ...(data.educationalCredentialAwarded && {
      educationalCredentialAwarded: data.educationalCredentialAwarded,
    }),
    ...(data.timeRequired && { timeRequired: data.timeRequired }),
  };
}

export function buildLocalBusinessSchema(data: LocalBusinessSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.name,
    description: data.description,
    url: data.url,
    ...(data.telephone && { telephone: data.telephone }),
    address: {
      "@type": "PostalAddress",
      ...data.address,
    },
    ...(data.image && { image: data.image }),
    ...(data.openingHours && { openingHours: data.openingHours }),
    ...(data.geo && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: data.geo.latitude,
        longitude: data.geo.longitude,
      },
    }),
  };
}

export function buildArticleSchema(data: ArticleSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.headline,
    description: data.description,
    url: data.url,
    datePublished: data.datePublished,
    dateModified: data.dateModified ?? data.datePublished,
    author: {
      "@type": "Person",
      name: data.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "CompuTrain",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com",
    },
    ...(data.image && { image: data.image }),
  };
}

export function buildWebSiteSchema(data: WebSiteSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: data.name,
    url: data.url,
    description: data.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${data.url}/courses?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
