import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppDispatch, IRootState } from "@/store";
import { toggleTheme, toggleSidebar } from "@/store/themeConfigSlice";
import profile from "@/assets/images/background/widgets/second.png";
import IconLaptop from "@/components/Icon/IconLaptop";
import IconLogout from "@/components/Icon/IconLogout";
import IconMoon from "@/components/Icon/IconMoon";
import IconSun from "@/components/Icon/IconSun";
import IconUser from "@/components/Icon/IconUser";
import Dropdown from "@/components/dropdown";
import { storage } from "@/utils";
import { isLoggedIn } from "@/hooks/api/auth";
import IconMenu from "../Icon/IconMenu";
import LanguageSwitcher from "./language";
import CurrencySwitcher from "./currency";

const Header = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === "rtl";
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);

  const [search, setSearch] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
    }
  }, [navigate]);

  const user = isLoggedIn();

  const Logout = () => {
    storage.removeToken();
    localStorage.removeItem("Farm_user");
    navigate("/login");
  };

  // Format Current Date (10 May 2025 at 14:00)
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24-hour format
  }).format(currentDate).replace(",", " at");

  return (
    <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === "horizontal" ? "dark" : ""}`}>
      <div className="shadow-sm">
        <div className="relative flex w-full items-center bg-white px-5 py-2.5 dark:bg-black">
          <div className="horizontal-logo flex items-center justify-between ltr:mr-2 rtl:ml-2 lg:hidden">
            <Link to="/" className="main-logo flex shrink-0 items-center">
              <img className="inline w-8 ltr:-ml-1 rtl:-mr-1" src={profile} alt="logo" />
            </Link>
            <button
              type="button"
              className="collapse-icon flex-none dark:text-[#d0d2d6] hover:text-primary dark:hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:bg-white-light/90 dark:hover:bg-dark/60"
              onClick={() => dispatch(toggleSidebar())}
            >
              <IconMenu className="w-5 h-5" />
            </button>
          </div>

          {/* Display Current Date */}
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 ml-auto sm:ml-0">
            {formattedDate}
          </div>

          <div className="flex items-center space-x-1.5 ltr:ml-auto rtl:mr-auto rtl:space-x-reverse dark:text-[#d0d2d6] sm:flex-1 ltr:sm:ml-0 sm:rtl:mr-0 lg:space-x-2">
            <div className="sm:ltr:mr-auto sm:rtl:ml-auto"></div>

            {/* Theme Toggle */}
            <div>
              {themeConfig.theme === "light" && (
                <button
                  className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                  onClick={() => dispatch(toggleTheme("dark"))}
                >
                  <IconSun />
                </button>
              )}
              {themeConfig.theme === "dark" && (
                <button
                  className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                  onClick={() => dispatch(toggleTheme("system"))}
                >
                  <IconMoon />
                </button>
              )}
              {themeConfig.theme === "system" && (
                <button
                  className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                  onClick={() => dispatch(toggleTheme("light"))}
                >
                  <IconLaptop />
                </button>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="dropdown flex shrink-0">
              <Dropdown
                offset={[0, 8]}
                placement={isRtl ? "bottom-start" : "bottom-end"}
                btnClassName="relative group block"
                button={
                  <img className="h-9 w-9 rounded-full object-cover saturate-50 group-hover:saturate-100" src={profile} alt="userProfile" />
                }
              >
                <ul className="w-[230px] !py-0 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                  <li>
                    <div className="flex items-center px-4 py-4">
                      <img className="h-10 w-10 rounded-md object-cover" src={profile} alt="userProfile" />
                      <div className="truncate ltr:pl-4 rtl:pr-4">
                        <h4 className="text-base">
                          {user?.username || t("header.user")}
                          <span className="rounded bg-success-light px-1 text-xs text-success ltr:ml-2 rtl:ml-2">
                            {user?.role || t("header.role")}
                          </span>
                        </h4>
                        <button type="button" className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white">
                          {user?.email || "email@example.com"}
                        </button>
                      </div>
                    </div>
                  </li>
                  <li>
                    <Link to={`profile`} className="dark:hover:text-white">
                      <IconUser className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                      {t("header.profile")}
                    </Link>
                  </li>
                  <li className="hover:bg-gray-100">
                    <LanguageSwitcher />
                  </li>
                  <li className="hover:bg-gray-100 mt-2">
                    <CurrencySwitcher />
                  </li>
                  <li className="border-t border-white-light dark:border-white-light/10">
                    <button onClick={Logout} className="flex flex-row !py-3 text-danger">
                      <IconLogout className="h-4.5 w-4.5 shrink-0 rotate-90 ltr:mr-2 rtl:ml-2" />
                      {t("header.signOut")}
                    </button>
                  </li>
                </ul>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
