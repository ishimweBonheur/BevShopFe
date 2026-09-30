const config = {
	NODE_ENV: process.env.NODE_ENV ?? 'development',
	APP_NAME: process.env.REACT_APP_NAME ?? 'STORE',
	API_URL: (process.env.REACT_APP_SERVER_URL || 'https://demostock-be.vercel.app').replace(/\/$/, '')
};

export default config;
