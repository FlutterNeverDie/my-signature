import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
    appName: 'signature-app',
    outdir: 'dist',
    brand: {
        displayName: '내 싸인 만들기',
        primaryColor: '#3182F6',
        // icon: 'https://...', // TODO: 해당 앱의 아이콘 URL
    },
    web: {
        commands: {
            build: 'npm run build',
            dev: 'npm run dev',
        },
        port: 5173,
    },
    webViewProps: {
        type: 'partner',
    },
});
