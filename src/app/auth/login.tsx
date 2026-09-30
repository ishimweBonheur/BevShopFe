import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InputField } from "@/components/input";
import { useLogin } from "@/hooks/api/auth";
import { useTranslation } from "react-i18next"; 

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { loadingLogin, login } = useLogin();
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const { t } = useTranslation();  

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials({ ...credentials, [name]: value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await login(credentials);
        if (response) navigate("/account");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black px-4">
            <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 w-full max-w-md">
                <div className="text-center">
                    <p className="dark:text-white text-3xl text-primary font-bold">
                        {t("stockManagement")}
                    </p>
                    <h2 className="mt-6 text-2xl font-bold text-gray-800 dark:text-white">
                        {t("welcome")}
                    </h2>
                </div>
                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <InputField
                        type="text"
                        name="email"
                        label={t("emailLabel")}
                        placeholder={t("emailLabel")}
                        value={credentials.email}
                        onChange={handleChange}
                        className="h-12"
                        required
                    />
                    <InputField
                        type="password"
                        name="password"
                        label={t("passwordLabel")}
                        placeholder={t("passwordLabel")}
                        value={credentials.password}
                        onChange={handleChange}
                        className="h-12"
                        required
                    />
                    <div className="flex justify-between items-center text-sm">
                        <Link
                            to="/reset-password"
                            className="text-blue-600 hover:underline"
                        >
                            {t("forgotPassword")}
                        </Link>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-blue-800 text-white font-medium py-2 rounded-lg transition"
                        disabled={loadingLogin}
                    >
                        {loadingLogin ? t("signingIn") : t("signIn")}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
