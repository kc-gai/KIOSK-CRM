import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

// Can be imported from a shared config
export const locales = ['ja', 'ko'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
    // Try to get locale from cookie or default to 'ja'
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;

    let locale: Locale = 'ko';
    if (localeCookie && locales.includes(localeCookie as Locale)) {
        locale = localeCookie as Locale;
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
