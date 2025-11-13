//Placeholders de branding para desarrollo y pruebas
//Los datos del cliente de primer carga se ponenn en "./brabnding.json" para que puedan ser editados sin tocar el código
//Ambos seran remplazados despues de la primer carga en la UI de branding para su almacenamiento en la Nube que despues es la unica version alineada y valida

import FM from '@/complements/i18n/FM';
import iBranding from '@/app/lib/branding/interface';

export const baseBranding: iBranding = {
  company: {
    legalName:  <FM id="branding.brand.legalName"  defaultMessage="Example Company LLC Default" />,
    brandName:   <FM id="branding.brand.name"        defaultMessage="Example Company" />,
    logo:  'https://example.com/assets/logo-square.png',
    tagline: <FM id="branding.brand.tagline" defaultMessage="Your trusted partner in solutions" />,
    contact: {
      website: 'https://example.com',
      phone: '+52 55 1234 5678',
      email: 'contact@example.com',
      address: {
        street: "Sample Street",
        number: "External number",
        interior: "Interior number",
        city: "Montréal",
        state: "QC",
        zip: "H3B 1A5",
        country: "CA"
      }
    },
    terms: 'https://example.com/terms',
    privacy: 'https://example.com/privacy',
    mission: <FM id="branding.brand.mission" defaultMessage="To provide exceptional solutions that drive client success." />,
    vision:  <FM id="branding.brand.vision"  defaultMessage="To be a global leader in innovative business solutions." />,
    values: [
      <FM key="branding.brand.value.customer" id="branding.brand.value.customer"  defaultMessage="Customer Satisfaction" />,
      <FM key="branding.brand.value.innovation" id="branding.brand.value.innovation" defaultMessage="Innovation" />,
      <FM key="branding.brand.value.integrity" id="branding.brand.value.integrity"  defaultMessage="Integrity" />,
    ],
    branches: [
      {
        name: <FM id="branding.brand.branch.1" defaultMessage="Branch 1" />,
        url:  'https://branch1example.com/',
        icon: 'https://firebasestorage.googleapis.com/v0/b/patronbarandgrill-pwa.appspot.com/o/PWAStorage%2FWebContent%2FBranch_700x700.webp?alt=media&token=376f3a28-b3d5-4067-8d0f-015f22321e86',
      },
      {
        name: <FM id="branding.brand.branch.2" defaultMessage="Branch 2" />,
        url:  'https://branch2example.com/',
        icon: 'https://firebasestorage.googleapis.com/v0/b/patronbarandgrill-pwa.appspot.com/o/PWAStorage%2FWebContent%2FBranch_700x700.webp?alt=media&token=376f3a28-b3d5-4067-8d0f-015f22321e86',
      },
    ],
  },
  agentAI: {
    name: 'ExampleBot',
    displayName: <FM id="branding.agent.displayName" defaultMessage="El Patrón Agent" />,
    role:  <FM id="branding.agent.role"  defaultMessage="You are ExampleBot, an AI assistant for Example Company. Provide helpful and accurate information about our services and products." />,
    tone:  <FM id="branding.agent.tone"  defaultMessage="Professional and friendly" />,
    description: <FM id="branding.agent.description" defaultMessage="ExampleBot assists users with inquiries related to Example Company's offerings." />,
    greeting:    <FM id="branding.agent.greeting"    defaultMessage="Hello! I'm ExampleBot, your virtual assistant. How can I help you today?" />,
    farewell:    <FM id="branding.agent.farewell"    defaultMessage="Thank you for visiting Example Company. Have a great day!" />,
    unknown_response:    <FM id="branding.agent.unknown"  defaultMessage="I'm sorry, I don't have that information right now. Please contact us directly for assistance." />,
    fallback_when_unsure:<FM id="branding.agent.fallback" defaultMessage="If I don't have the information, I offer WhatsApp or call the location." />,
  },
  schedule: [
    { day: <FM id="branding.weekday.day1" defaultMessage="defaultTSXMonday" />,    open: '09:00', close: '17:00' , closed :false},
    { day: <FM id="branding.weekday.day2" defaultMessage="defaultTSXTuesday" />,   open: '09:00', close: '17:00' , closed :false},
    { day: <FM id="branding.weekday.day3" defaultMessage="defaultTSXWednesday" />, open: '09:00', close: '17:00' , closed :false},
    { day: <FM id="branding.weekday.day4" defaultMessage="defaultTSXThursday" />,  open: '09:00', close: '17:00' , closed :false},
    { day: <FM id="branding.weekday.day5" defaultMessage="defaultTSXFriday" />,    open: '09:00', close: '17:00' , closed :false},
    { day: <FM id="branding.weekday.day6" defaultMessage="defaultTSXSaturday" />,  open: '10:00', close: '14:00' , closed :false},
    { day: <FM id="branding.weekday.day7" defaultMessage="defaultTSXSunday" />,    open: null,    close: null , closed :true},
  ],
  socials: [
    { name: 'facebook',  url: 'https://www.facebook.com/example',   username: 'example', icon: 'https://example.com/assets/social-facebook.png' },
    { name: 'instagram', url: 'https://www.instagram.com/example',  username: 'example', icon: 'https://example.com/assets/social-instagram.png' },
    { name: 'twitter',   url: 'https://www.twitter.com/example',    username: 'example', icon: 'https://example.com/assets/social-twitter.png' },
    { name: 'linkedin',  url: 'https://www.linkedin.com/company/example', username: 'example', icon: 'https://example.com/assets/social-linkedin.png' },
    { name: 'youtube',   url: 'https://www.youtube.com/c/example',  username: 'example', icon: 'https://example.com/assets/social-youtube.png' },
    { name: 'tiktok',    url: 'https://www.tiktok.com/@example',   username: 'example', icon: 'https://example.com/assets/social-tiktok.png' },
  ],
  platforms: [
    { name: 'onlineorder', url: 'https://example.com/order', icon: 'https://example.com/assets/platform-onlineorder.png' },
    { name: 'uber',        url: 'https://www.ubereats.com/store/example', icon: 'https://example.com/assets/platform-uber.png' },
    { name: 'doordash',   url: 'https://www.doordash.com/store/example', icon: 'https://example.com/assets/platform-doordash.png' },
    { name: 'skipthedishes', url: 'https://www.skipthedishes.com/restaurants/example', icon: 'https://example.com/assets/platform-skipthedishes.png' },
    { name: 'shopify',     url: 'https://example.myshopify.com', icon: 'https://example.com/assets/platform-shopify.png' },
    { name: 'amazon',     url: 'https://www.amazon.com/shops/example', icon: 'https://example.com/assets/platform-amazon.png' },
    { name: 'tripadvisor', url: 'https://www.tripadvisor.com/Profile/example', icon: 'https://example.com/assets/platform-tripadvisor.png' },
  ],
  holidays: [
    { name: <FM id="branding.holiday.thanksgiving" defaultMessage="Closed" />, date: '2023-11-23' }, // Thanksgiving
    { name:   <FM id="branding.holiday.family"   defaultMessage="10 am to 3 pm" />, date: '2023-02-20' }, // Family Day
  ],
  products: [
    {
      prodName:        <FM id="branding.prod.a"      defaultMessage="Product A" />,
      description: <FM id="branding.prod.a.desc" defaultMessage="Description for Product A" />,
      price: '$A',
      image: 'https://example.com/assets/product-a.jpg',
      video: 'https://example.com/assets/product-a.mp4',
      gallery: [
        'https://example.com/assets/product-a-1.jpg',
      ],
      url: 'https://example.com/products/a',
      category: 'Category 1',
      subcategory: 'Subcategory A',
    },
    {
      prodName: <FM id="branding.prod.b"      defaultMessage="Product B" />,
      description: <FM id="branding.prod.b.desc" defaultMessage="Description for Product B" />,
      price: '$B',
      image: 'https://example.com/assets/product-b.jpg',
      video: 'https://example.com/assets/product-b.mp4',
      gallery: [
        'https://example.com/assets/product-b-1.jpg',
      ],
      url: 'https://example.com/products/b',
      category: 'Category 1',
      subcategory: 'Subcategory B',
    },
    {
      prodName: <FM id="branding.prod.c"      defaultMessage="Product C" />,
      description: <FM id="branding.prod.c.desc" defaultMessage="Description for Product C" />,
      price: '$C',
      image: 'https://example.com/assets/product-c.jpg',
      video: 'https://example.com/assets/product-c.mp4',
      gallery: [
        'https://example.com/assets/product-c-1.jpg',
      ],
      url: 'https://example.com/products/c',
      category: 'Category 1',
      subcategory: 'Subcategory C',
    },
  ],
  services: [
    {
      servName:        <FM id="branding.srv.a"      defaultMessage="Service A" />,
      description: <FM id="branding.srv.a.desc" defaultMessage="Description for Service A" />,
      price: '$A',
      image: 'https://example.com/assets/service-a.jpg',
      video: 'https://example.com/assets/service-a.mp4',
      gallery: [
        'https://example.com/assets/service-a-1.jpg',
      ],
      url: 'https://example.com/services/a',
    },
    {
      servName:        <FM id="branding.srv.b"      defaultMessage="Service B" />,
      description: <FM id="branding.srv.b.desc" defaultMessage="Description for Service B" />,
      price: '$B',
      image: 'https://example.com/assets/service-b.jpg',
      video: 'https://example.com/assets/service-b.mp4',
      gallery: [
        'https://example.com/assets/service-b-1.jpg',
      ],
      url: 'https://example.com/services/b',
    },
    {
      servName:        <FM id="branding.srv.c"      defaultMessage="Service C" />,
      description: <FM id="branding.srv.c.desc" defaultMessage="Description for Service C" />,
      price: '$C',
      image: 'https://example.com/assets/service-c.jpg',
      video: 'https://example.com/assets/service-c.mp4',
      gallery: [
        'https://example.com/assets/service-c-1.jpg',
      ],
      url: 'https://example.com/services/c',
    },
  ],
  more: {
    FAQ: [
      {
        question: <FM id="branding.faq.q1" defaultMessage="What is Example Company's main service?" />,
        answer: <FM id="branding.faq.a1" defaultMessage="Example Company's main service is providing innovative solutions for businesses." />,
      },
    ],
  },
};

export default baseBranding;