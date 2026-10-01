export const WHATSAPP_NUMBER = '5513900000000';
export const WHATSAPP_DISPLAY = '(13) 90000-0000';
export const WHATSAPP_DEFAULT_MESSAGE = 'Olá! Gostaria de fazer um pedido.';

export const whatsappLink = (message = WHATSAPP_DEFAULT_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
