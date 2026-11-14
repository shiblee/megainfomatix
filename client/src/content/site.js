/**
 * Site-wide SEO content: the single source for the page metadata, FAQ and
 * structured data. Used by the Home page and by the build-time pre-renderer.
 */
export const SITE = {
  name: 'MegaInfomatix',
  url: (import.meta.env.VITE_SITE_URL || 'https://megainfomatix.com').replace(/\/+$/, ''),
  title: 'MegaInfomatix – Digital Product Marketplace to Host & Sell',
  description:
    'MegaInfomatix is a digital product marketplace to host, sell and deliver e-books, online courses, templates and software. Launching with our own products.',
  tagline: 'One place to host and sell digital products',
  locale: 'en_US',
  language: 'en',
  themeColor: '#2563eb',
  image: '/og-image.png',
  logo: '/icon-512.png',
};

export const FAQ = [
  {
    question: 'What is MegaInfomatix?',
    answer:
      'MegaInfomatix is an online marketplace for digital products. It hosts the products, handles the payment and delivers the files, so creators can sell and buyers can download in one place.',
  },
  {
    question: 'What kind of digital products can be sold on MegaInfomatix?',
    answer:
      'Any product that can be downloaded or accessed online: e-books and guides, online courses, templates, software and plugins, graphics and design assets, audio and music, documents, reports, data and tools.',
  },
  {
    question: 'Can I sell my own digital products on MegaInfomatix?',
    answer:
      'Not yet. MegaInfomatix is launching with our own products first. Opening the platform so anyone can host and sell their digital products is the next phase of our roadmap.',
  },
  {
    question: 'How will buyers receive their products?',
    answer:
      'Buyers pay online once and get instant access to the product, either as a download or as online access, straight after the payment.',
  },
  {
    question: 'Do I need technical skills to sell on MegaInfomatix?',
    answer:
      'No. The goal is that you upload your product, add a name, description and price, and publish. MegaInfomatix takes care of hosting, payments and delivery.',
  },
];

/** JSON-LD structured data for the home page (Organization, WebSite, WebPage, FAQPage). */
export function homeStructuredData() {
  const org = `${SITE.url}/#organization`;
  const website = `${SITE.url}/#website`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': org,
        name: SITE.name,
        url: `${SITE.url}/`,
        logo: { '@type': 'ImageObject', url: `${SITE.url}${SITE.logo}`, width: 512, height: 512 },
        description: SITE.description,
      },
      {
        '@type': 'WebSite',
        '@id': website,
        name: SITE.name,
        url: `${SITE.url}/`,
        description: SITE.description,
        inLanguage: SITE.language,
        publisher: { '@id': org },
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE.url}/#webpage`,
        url: `${SITE.url}/`,
        name: SITE.title,
        description: SITE.description,
        inLanguage: SITE.language,
        isPartOf: { '@id': website },
        about: { '@id': org },
        primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE.url}${SITE.image}` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE.url}/#faq`,
        mainEntity: FAQ.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  };
}
