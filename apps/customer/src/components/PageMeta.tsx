// Renders <title> + <meta> tags for the current page. React 19 hoists these
// out of the render tree into <head> automatically, so calling this from
// anywhere inside a route is enough — no react-helmet required.

type PageMetaProps = {
  /** Final <title>. The "— Tiglemp" suffix is appended automatically unless `suffix={false}`. */
  title: string;
  /** Meta description. Aim for ~150–160 chars for best SERP behaviour. */
  description?: string;
  /** When false, render the title as-is without the brand suffix. */
  suffix?: boolean;
  /** Set to true to ask crawlers not to index this page (auth-walled, wizards). */
  noIndex?: boolean;
  /** Canonical absolute URL. Omit to let crawlers infer from the current URL. */
  canonical?: string;
  /** Override the og:image used for social previews. Defaults to /logo-tiger.png. */
  ogImage?: string;
  /** Override og:type. Defaults to "website". */
  ogType?: 'website' | 'article';
};

const DEFAULT_OG_IMAGE = '/logo-tiger.png';

export function PageMeta({
  title,
  description,
  suffix = true,
  noIndex = false,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
}: PageMetaProps) {
  const fullTitle = suffix ? `${title} — Tiglemp` : title;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex, follow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      {description && (
        <meta property="og:description" content={description} />
      )}
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      {description && (
        <meta name="twitter:description" content={description} />
      )}
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}
