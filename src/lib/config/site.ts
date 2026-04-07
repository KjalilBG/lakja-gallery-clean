export const siteConfig = {
  name: "La Kja",
  url: "https://lakja.top",
  description: "Galerias fotograficas premium para clientes y administracion de albumes.",
  shareTitle: "La Kja | Galerias fotograficas premium",
  shareDescription: "Galerias fotograficas premium para clientes y administracion de albumes.",
  shareImageUrl: "/branding/lakja-logo.svg",
  instagramUrl: "https://instagram.com/lakja.top",
  facebookUrl: "https://facebook.com/lakja.top",
  whatsappNumber: "522292646327",
  whatsappMessage: "Hola, vi tu galeria en La Kja y me gustaria pedir informacion.",
  maintenanceMode: false,
  maintenanceTitle: "Estamos afinando la experiencia de La Kja",
  maintenanceMessage:
    "Estamos trabajando en mejoras para que la experiencia se sienta mas cuidada. Mientras tanto, puedes escribirme directamente por WhatsApp o volver en un momento.",
  showWhatsAppFloat: true,
  downloadsEnabled: true,
  favoritesEnabled: true,
  downloadPopupEnabled: true,
  featuredAlbumIds: [] as string[],
  downloadPopupTitle: "Tu descarga ya comenzó 📸✨",
  downloadPopupBody: "Gracias por estar aquí. Comparte este momento, etiquétanos y forma parte de nuestra comunidad.",
  homeBadge: "Estamos construyendo algo especial",
  homeEyebrow: "Bienvenido a La Kja",
  homeTitle: "Una experiencia fotográfica más cercana, más viva y más tuya.",
  homeDescription:
    "Estamos afinando una nueva casa digital para entregar historias, retratos y eventos con una experiencia mucho más cuidada. Mientras tanto, ya puedes recorrer las galerías publicadas, sentir el estilo de La Kja y escribirme si quieres crear algo juntos.",
  handle: "@lakja.top",
  nav: [
    { label: "Inicio", href: "/" },
    { label: "AppFotos", href: "/appfotos" },
    { label: "Admin", href: "/appfotos/admin" }
  ],
  socials: [
    { label: "Instagram", href: "https://instagram.com/lakja.top" },
    { label: "Facebook", href: "https://facebook.com/lakja.top" },
    { label: "Contacto", href: "mailto:hola@lakja.mx" }
  ]
} as const;
