import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

// Can be imported from a shared config
export const locales = ['ja', 'ko'] as const;
export type Locale = (typeof locales)[number];

// Accept-Language 헤더에서 OS/브라우저 언어 감지
function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
    if (!acceptLanguage) return 'ko';

    // Accept-Language: ja,en-US;q=0.9,en;q=0.8,ko;q=0.7 형식
    const languages = acceptLanguage.split(',').map(lang => {
        const [code] = lang.trim().split(';');
        return code.toLowerCase().split('-')[0]; // 'ja-JP' -> 'ja'
    });

    // 지원하는 언어 중 첫 번째 매칭
    for (const lang of languages) {
        if (locales.includes(lang as Locale)) {
            return lang as Locale;
        }
    }

    return 'ko'; // 기본값
}

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const headerStore = await headers();

    // 1. 쿠키에서 언어 설정 확인 (사용자가 직접 변경한 경우)
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;

    let locale: Locale;

    if (localeCookie && locales.includes(localeCookie as Locale)) {
        // 쿠키가 있으면 쿠키 값 사용
        locale = localeCookie as Locale;
    } else {
        // 쿠키가 없으면 OS/브라우저 언어 감지
        const acceptLanguage = headerStore.get('accept-language');
        locale = detectLocaleFromHeader(acceptLanguage);
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
