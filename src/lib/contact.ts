import { site } from '@/config/site';

/**
 * WhatsApp deep link. Pass a service name to prefill a specific enquiry.
 * whatsappLink('Trade Finance Consultancy')
 *   → https://wa.me/254735093269?text=Hello%20Savantho%2C%20I'd%20like%20to%20discuss%20Trade%20Finance%20Consultancy.
 */
export function whatsappLink(service?: string, message?: string): string {
  const text =
    message ??
    (service
      ? `Hello Savantho, I'd like to discuss ${service}.`
      : "Hello Savantho, I'd like to book a free discovery call.");
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const telLink = () => `tel:${site.phone.e164}`;
export const mailLink = (subject?: string) =>
  `mailto:${site.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
