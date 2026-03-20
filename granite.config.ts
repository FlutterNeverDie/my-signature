import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
    appName: 'signature-app',
    outdir: 'dist',
    brand: {
        displayName: '내 싸인 만들기',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/appsintoss/16823/49df371d-b1cd-4514-84f1-a67600c5a6e0.png',
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
    permissions: [],
});
