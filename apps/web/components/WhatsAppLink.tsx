import { CONTACT, whatsappLink } from '@/lib/content';

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.09 3.2 5.07 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.22-8.24 8.22z" />
    </svg>
  );
}

interface Props {
  /** Pre-fills the first message with something specific to the page. */
  message?: string;
  variant?: 'button' | 'inline' | 'footer';
  className?: string;
}

/**
 * Opens a WhatsApp chat with the CTO. `wa.me` hands off to the installed app
 * on mobile and to WhatsApp Web on desktop, so no number ever needs copying.
 */
export default function WhatsAppLink({ message, variant = 'button', className = '' }: Props) {
  const href = whatsappLink(message);
  const label = `Message ${CONTACT.whatsappOwner} (${CONTACT.whatsappRole}) on WhatsApp at ${CONTACT.whatsappDisplay}`;

  if (variant === 'inline') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={label}
        className={`inline-flex items-center gap-1.5 font-medium text-[#25D366] underline-offset-2 transition hover:underline ${className}`}
      >
        <WhatsAppIcon size={15} />
        {CONTACT.whatsappDisplay}
      </a>
    );
  }

  if (variant === 'footer') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={label}
        className={`group inline-flex items-center gap-2.5 text-sm text-ink-200 transition hover:text-white ${className}`}
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#25D366]/15 text-[#25D366] transition group-hover:bg-[#25D366] group-hover:text-white">
          <WhatsAppIcon size={16} />
        </span>
        <span>
          <span className="block font-medium">{CONTACT.whatsappDisplay}</span>
          <span className="block text-xs text-ink-400">
            {CONTACT.whatsappRole} direct · WhatsApp
          </span>
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className={`btn bg-[#25D366] text-white hover:-translate-y-0.5 hover:bg-[#1eb955] ${className}`}
    >
      <WhatsAppIcon size={17} />
      WhatsApp the CTO
    </a>
  );
}
