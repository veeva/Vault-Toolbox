declare module '*.png';
declare module 'react-syntax-highlighter';

/** Build-time values injected by webpack's DefinePlugin (see webpack.config.js / webpack.config.dev.js). */
declare const process: {
    env: {
        /** 'true' in dev builds (`npm run dev`), 'false' in production builds (`npm run build`). */
        IS_DEV_BUILD?: string;
        [key: string]: string | undefined;
    };
};
