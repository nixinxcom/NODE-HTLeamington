// Placeholders de branding para desarrollo y pruebas
// Los datos del cliente de primer carga se ponen en "./branding.json" para que
// puedan ser editados sin tocar el código.
// Ambos serán reemplazados después de la primer carga en la UI de branding
// para su almacenamiento en la Nube, que después es la única versión alineada y válida.

import iBranding from '@/app/lib/branding/interface';

export const baseBranding: iBranding = {
  company: {
    // Estos son textos de ejemplo que el cliente podrá sobreescribir desde la BUI
    legalName: 'Example Company LLC Default',
    brandName: 'Example Company',
    logo: 'https://example.com/assets/logo-square.png',
    tagline: 'Your trusted partner in solutions',
    contact: {
      website: 'https://example.com',
      phone: '+52 55 1234 5678',
      email: 'contact@example.com',
      address: {
        street: 'Sample Street',
        number: 'External number',
        interior: 'Interior number',
        city: 'Montréal',
        state: 'QC',
        zip: 'H3B 1A5',
        country: 'CA',
      },
    },
    terms: 'https://example.com/terms',
    privacy: 'https://example.com/privacy',
    mission:
      'To provide exceptional solutions that drive client success.',
    vision:
      'To be a global leader in innovative business solutions.',
    // Estos "values" son el contenido editable de la empresa, no labels de UI
    values: [
      'Customer Satisfaction',
      'Innovation',
      'Integrity',
    ],
    branches: [
      {
        name: 'Branch 1',
        url: 'https://branch1example.com/',
        icon: 'https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/PWAStorage%2FWebContent%2FBranch_700x700.webp?alt=media&token=376f3a28-b3d5-4067-8d0f-015f22321e86',
      },
      {
        name: 'Branch 2',
        url: 'https://branch2example.com/',
        icon: 'https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/PWAStorage%2FWebContent%2FBranch_700x700.webp?alt=media&token=376f3a28-b3d5-4067-8d0f-015f22321e86',
      },
    ],
  },

  agentAI: {
    name: 'ExampleBot',
    // Estos textos son prompts y descripciones, también editables por el cliente
    displayName: 'El Patrón Agent',
    role:
      "You are ExampleBot, an AI assistant for Example Company. Provide helpful and accurate information about our services and products.",
    tone: 'Professional and friendly',
    description:
      "ExampleBot assists users with inquiries related to Example Company's offerings.",
    greeting:
      "Hello! I'm ExampleBot, your virtual assistant. How can I help you today?",
    farewell:
      'Thank you for visiting Example Company. Have a great day!',
    unknown_response:
      "I'm sorry, I don't have that information right now. Please contact us directly for assistance.",
    fallback_when_unsure:
      'If I do not have the information, I offer WhatsApp or call the location.',
  },

  // Horarios de ejemplo (contenido editable), los labels de días vienen de i18n en la UI
  schedule: [
    { day: 'defaultTSXMonday',    open: '09:00', close: '17:00', closed: false },
    { day: 'defaultTSXTuesday',   open: '09:00', close: '17:00', closed: false },
    { day: 'defaultTSXWednesday', open: '09:00', close: '17:00', closed: false },
    { day: 'defaultTSXThursday',  open: '09:00', close: '17:00', closed: false },
    { day: 'defaultTSXFriday',    open: '09:00', close: '17:00', closed: false },
    { day: 'defaultTSXSaturday',  open: '10:00', close: '14:00', closed: false },
    { day: 'defaultTSXSunday',    open: null,    close: null,    closed: true  },
  ],

  socials: [
    { name: 'facebook',  url: 'https://www.facebook.com/example',   username: 'example', icon: 'https://example.com/assets/social-facebook.png' },
    { name: 'instagram', url: 'https://www.instagram.com/example',  username: 'example', icon: 'https://example.com/assets/social-instagram.png' },
    { name: 'twitter',   url: 'https://www.twitter.com/example',    username: 'example', icon: 'https://example.com/assets/social-twitter.png' },
    { name: 'linkedin',  url: 'https://www.linkedin.com/company/example', username: 'example', icon: 'https://example.com/assets/social-linkedin.png' },
    { name: 'youtube',   url: 'https://www.youtube.com/c/example',  username: 'example', icon: 'https://example.com/assets/social-youtube.png' },
    { name: 'tiktok',    url: 'https://www.tiktok.com/@example',    username: 'example', icon: 'https://example.com/assets/social-tiktok.png' },
  ],

  platforms: [
    { name: 'onlineorder',  url: 'https://example.com/order',                                icon: 'https://example.com/assets/platform-onlineorder.png' },
    { name: 'uber',         url: 'https://www.ubereats.com/store/example',                  icon: 'https://example.com/assets/platform-uber.png' },
    { name: 'doordash',     url: 'https://www.doordash.com/store/example',                  icon: 'https://example.com/assets/platform-doordash.png' },
    { name: 'skipthedishes',url: 'https://www.skipthedishes.com/restaurants/example',       icon: 'https://example.com/assets/platform-skipthedishes.png' },
    { name: 'shopify',      url: 'https://example.myshopify.com',                           icon: 'https://example.com/assets/platform-shopify.png' },
    { name: 'amazon',       url: 'https://www.amazon.com/shops/example',                    icon: 'https://example.com/assets/platform-amazon.png' },
    { name: 'tripadvisor',  url: 'https://www.tripadvisor.com/Profile/example',             icon: 'https://example.com/assets/platform-tripadvisor.png' },
  ],

  holidays: [
    { name: 'Closed',            date: '2023-11-23' }, // Thanksgiving
    { name: '10 am to 3 pm',     date: '2023-02-20' }, // Family Day
  ],

  products: [
    {
      prodName:   'Product A',
      description:'Description for Product A',
      price: '$A',
      image: 'https://example.com/assets/product-a.jpg',
      video: 'https://example.com/assets/product-a.mp4',
      gallery: ['https://example.com/assets/product-a-1.jpg'],
      url: 'https://example.com/products/a',
      category: 'Category 1',
      subcategory: 'Subcategory A',
    },
    {
      prodName:   'Product B',
      description:'Description for Product B',
      price: '$B',
      image: 'https://example.com/assets/product-b.jpg',
      video: 'https://example.com/assets/product-b.mp4',
      gallery: ['https://example.com/assets/product-b-1.jpg'],
      url: 'https://example.com/products/b',
      category: 'Category 1',
      subcategory: 'Subcategory B',
    },
    {
      prodName:   'Product C',
      description:'Description for Product C',
      price: '$C',
      image: 'https://example.com/assets/product-c.jpg',
      video: 'https://example.com/assets/product-c.mp4',
      gallery: ['https://example.com/assets/product-c-1.jpg'],
      url: 'https://example.com/products/c',
      category: 'Category 1',
      subcategory: 'Subcategory C',
    },
  ],

  services: [
    {
      servName:   'Service A',
      description:'Description for Service A',
      price: '$A',
      image: 'https://example.com/assets/service-a.jpg',
      video: 'https://example.com/assets/service-a.mp4',
      gallery: ['https://example.com/assets/service-a-1.jpg'],
      url: 'https://example.com/services/a',
    },
    {
      servName:   'Service B',
      description:'Description for Service B',
      price: '$B',
      image: 'https://example.com/assets/service-b.jpg',
      video: 'https://example.com/assets/service-b.mp4',
      gallery: ['https://example.com/assets/service-b-1.jpg'],
      url: 'https://example.com/services/b',
    },
    {
      servName:   'Service C',
      description:'Description for Service C',
      price: '$C',
      image: 'https://example.com/assets/service-c.jpg',
      video: 'https://example.com/assets/service-c.mp4',
      gallery: ['https://example.com/assets/service-c-1.jpg'],
      url: 'https://example.com/services/c',
    },
  ],

  more: {
    FAQ: [
      {
        question: "What is Example Company's main service?",
        answer:
          "Example Company's main service is providing innovative solutions for businesses.",
      },
    ],
  },
};

export default baseBranding;
