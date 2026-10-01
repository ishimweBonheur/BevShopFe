import PerfectScrollbar from "react-perfect-scrollbar";
import { isLoggedIn } from "@/hooks/api/auth";
import { IRootState } from "@/store";
import { toggleSidebar } from "@/store/themeConfigSlice";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, Link } from "react-router-dom";
import IconCaretsDown from "../Icon/IconCaretsDown";
import IconHome from "../Icon/IconHome";
import IconUsers from "../Icon/IconUsers";
import AnimateHeight from "react-animate-height";
import IconCaretDown from "../Icon/IconCaretDown";
import IconTag from "../Icon/IconTag";
import IconListCheck from "../Icon/IconListCheck";
import IconArrowForward from "../Icon/IconArrowForward";
import IconBarChart from "../Icon/IconBarChart";
import { useTranslation } from "react-i18next";
const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>("");
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const location = useLocation();
    const dispatch = useDispatch();
    const user = isLoggedIn();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => (oldValue === value ? "" : value));
    };
    const { t } = useTranslation();
    const navigation: any[] = [
        ['Dashboard','',IconHome],['Products','products',IconTag],['Categories','category',IconListCheck],['Purchases','purchases',IconArrowForward],['Sales','pos',IconBarChart],['Expenses','expenses',IconListCheck],['Owner money','cash',IconBarChart],['Activity','sales',IconListCheck],['Reports','reports',IconBarChart],['Damaged products','losses',IconArrowForward],['Cash reconciliation','reconciliation',IconBarChart],['Stock counts','stock-counts',IconListCheck]
    ].map(([name,path,icon])=>({name,to:'/account'+(path ? '/'+path:''),icon,current:location.pathname==='/account'+(path ? '/'+path:'')}));
    return (<div className={"dark"}>
      <nav className={`sidebar print:hidden capitalize fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300`}>
    <div className="bg-white dark:bg-blue-900 h-full">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="w-full flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center">
                <p className="text-lg font-extrabold text-primary">
                  <span className="text-3xl text-white">stock</span>
                </p>
                <p className="text-lg font-extrabold text-primary">
                  <span className="text-3xl text-white">management</span>
                </p>
              </div>
            </div>

            <button type="button" className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-white/10 dark:text-white-light transition duration-300 rtl:rotate-180" onClick={() => dispatch(toggleSidebar())}>
              <IconCaretsDown className="m-auto rotate-90"/>
            </button>
          </div>
          <div className="h-10"></div>
          <PerfectScrollbar className="h-[calc(100vh)] relative">
            <ul className="relative space-y-0.5 p-4 py-0">
              <li className="nav-item">
                <ul>
                  {navigation
            
            .map((item, index) => (<li key={index} className="nav-item">
                        {!item.children ? (<Link to={item.to} className={`group ${item.current ? "active text-white" : ""}`}>
                            <div className="flex items-center">
                              <item.icon className="group-hover:!text-white shrink-0"/>
                              <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/80 dark:group-hover:text-white">
                                {item.name}
                              </span>
                            </div>
                          </Link>) : (<ItemDropDown currentMenu={currentMenu} toggleMenu={toggleMenu} item={{
                    name: item.name,
                    items: item.children,
                    Icon: item.icon,
                }}/>)}
                      </li>))}

                  <li className="nav-item">
                    <Link to="/account/profile" className={`group ${location.pathname === "/account/profile"
            ? "active text-white"
            : ""}`}>
                      <div className="flex items-center">
                        <Cog6ToothIcon className="group-hover:!text-white shrink-0"/>
                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/80 dark:group-hover:text-white">
                          Profile
                        </span>
                      </div>
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
          </PerfectScrollbar>
        </div>
      </nav>
    </div>);
};
export default Sidebar;
type DropDownProps = {
    items: {
        name: string;
        to: string;
        current: boolean;
    }[];
    name: string;
    Icon: any;
};
type ItemDropDownProps = {
    currentMenu: string;
    toggleMenu: (value: string) => void;
    item: DropDownProps;
};
const ItemDropDown: React.FC<ItemDropDownProps> = ({ currentMenu, toggleMenu, item, }) => {
    return (<li className="menu nav-item">
      <button type="button" className={`nav-link group w-full ${currentMenu === item.name ? "" : ""}`} onClick={() => toggleMenu(item.name)}>
        <div className="flex items-center">
          <item.Icon className="group-hover:!text-white shrink-0"/>
          <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/80 dark:group-hover:text-white">
            {item.name}
          </span>
        </div>
        <div className={currentMenu !== item.name ? "rtl:rotate-90 -rotate-90" : ""}>
          <IconCaretDown className="text-white"/>
        </div>
      </button>

      <AnimateHeight duration={300} height={currentMenu === item.name ? "auto" : 0}>
        <ul className=" px-2 ml-3">
          {item.items.map((subItem, index) => (<li key={index} className={`flex items-center ${subItem.current ? "font-bold " : ""}`}>
              <Link to={subItem.to} className={`!px-4 text-gray-300 block p-2  ${subItem.current ? "text-white" : ""}`}>
                {subItem.name}
              </Link>
            </li>))}
        </ul>
      </AnimateHeight>
    </li>);
};
