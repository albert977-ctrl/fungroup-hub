/**
 * Brand configuration for The Fun Group Miami
 * Defines brand properties and helper functions for brand detection
 */

const BRANDS = {
  werentfun: {
    id: 'werentfun',
    name: 'We Rent Fun',
    color: '#8b5cf6',
    emails: ['info@werentfun.net', 'al@werentfun.net'],
    ghlLocationId: process.env.GHL_LOCATION_WERENTFUN,
    phone: '305-985-0505',
  },
  justbounce: {
    id: 'justbounce',
    name: 'Just Bounce Miami',
    color: '#06b6d4',
    emails: ['info@justbouncemiami.com'],
    ghlLocationId: process.env.GHL_LOCATION_JUSTBOUNCE,
    phone: '305-909-2686',
  },
  lasertag: {
    id: 'lasertag',
    name: 'Laser Tag Of Miami',
    color: '#f59e0b',
    emails: ['info@lasertagofmiami.com'],
    ghlLocationId: process.env.GHL_LOCATION_LASERTAG,
    phone: '305-985-0505',
  },
};

/**
 * Detect which brand an email address belongs to
 * @param {string} email - Email address to check
 * @returns {string} Brand ID (werentfun, justbounce, lasertag) or 'unknown'
 */
export function detectBrand(email) {
  if (!email) return 'unknown';

  const lowerEmail = email.toLowerCase();

  for (const [brandId, brandConfig] of Object.entries(BRANDS)) {
    if (brandConfig.emails.some((brandEmail) => lowerEmail.includes(brandEmail.toLowerCase()))) {
      return brandId;
    }
  }

  return 'unknown';
}

/**
 * Detect brand by phone number
 * @param {string} phoneNumber - Phone number to check
 * @returns {string} Brand ID or 'unknown'
 */
export function detectBrandByPhone(phoneNumber) {
  if (!phoneNumber) return 'unknown';

  const normalizedPhone = phoneNumber.replace(/\D/g, '');

  for (const [brandId, brandConfig] of Object.entries(BRANDS)) {
    const normalizedBrandPhone = brandConfig.phone.replace(/\D/g, '');
    if (normalizedPhone.endsWith(normalizedBrandPhone)) {
      return brandId;
    }
  }

  return 'unknown';
}

/**
 * Get all brand emails across all brands
 * @returns {string[]} Array of all brand email addresses
 */
export function getAllBrandEmails() {
  return Object.values(BRANDS).flatMap((brand) => brand.emails);
}

/**
 * Get brand configuration by ID
 * @param {string} brandId - Brand ID
 * @returns {object|null} Brand configuration or null if not found
 */
export function getBrandConfig(brandId) {
  return BRANDS[brandId] || null;
}

/**
 * Get all brands
 * @returns {object} All brand configurations
 */
export function getAllBrands() {
  return BRANDS;
}

/**
 * Get all location IDs for GHL
 * @returns {string[]} Array of GHL location IDs
 */
export function getAllGHLLocationIds() {
  return Object.values(BRANDS)
    .map((brand) => brand.ghlLocationId)
    .filter(Boolean);
}

export default BRANDS;
