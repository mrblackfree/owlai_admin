import { Request } from 'express';

export type Language = 'ko' | 'en';

// Get language from request headers
export const getLanguage = (req: Request): Language => {
  const acceptLanguage = req.headers['accept-language'];
  const queryLang = req.query.lang as string;
  
  // Priority: query parameter > Accept-Language header > default (ko)
  if (queryLang && (queryLang === 'ko' || queryLang === 'en')) {
    return queryLang;
  }
  
  if (acceptLanguage) {
    const lang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
    if (lang === 'ko') return 'ko';
    if (lang === 'en') return 'en';
  }
  
  return 'ko'; // Default to Korean
};

// Helper to get localized field from document
export const getLocalizedField = <T extends Record<string, any>>(
  doc: T,
  field: string,
  lang: Language
): any => {
  if (lang === 'ko') {
    return doc[`${field}_ko`] || doc[field];
  }
  return doc[field];
};

// Helper to transform document with localized fields
export const localizeDocument = <T extends Record<string, any>>(
  doc: T,
  lang: Language,
  fields: string[] = ['name', 'description', 'category', 'tags', 'features']
): any => {
  if (!doc) return doc;
  
  const localized: any = { ...doc };
  
  fields.forEach(field => {
    if (lang === 'ko' && doc[`${field}_ko`]) {
      localized[field] = doc[`${field}_ko`];
    }
    // Remove _ko fields from response
    delete localized[`${field}_ko`];
  });
  
  return localized;
};

