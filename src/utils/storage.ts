import config from "../config";


const TOKEN_NAME = `${config.APP_NAME}-token`;

export const storage = {
	getToken: () => localStorage.getItem(TOKEN_NAME),
	setToken: (token: string) => localStorage.setItem(TOKEN_NAME, token),
	removeToken: () => localStorage.removeItem(TOKEN_NAME),
};
