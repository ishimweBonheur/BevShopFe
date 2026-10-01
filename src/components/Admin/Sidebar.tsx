import {NavLink} from 'react-router-dom';
import {useDispatch} from 'react-redux';
import {toggleSidebar} from '@/store/themeConfigSlice';
import IconHome from '../Icon/IconHome';
import IconBox from '../Icon/IconBox';
import IconTag from '../Icon/IconTag';
import IconShoppingCart from '../Icon/IconShoppingCart';
import IconDollarSign from '../Icon/IconDollarSign';
import IconCreditCard from '../Icon/IconCreditCard';
import IconTrash from '../Icon/IconTrash';
import IconCashBanknotes from '../Icon/IconCashBanknotes';
import IconNotes from '../Icon/IconNotes';
import IconBarChart from '../Icon/IconBarChart';
const links=[['Dashboard','',IconHome],['Products','products',IconBox],['Categories','categories',IconTag],['Purchases','purchases',IconShoppingCart],['Sales','sales',IconDollarSign],['Expenses','expenses',IconCreditCard],['Damaged Items','damaged-items',IconTrash],['Owner Money','owner-money',IconCashBanknotes],['History','history',IconNotes],['Reports','reports',IconBarChart]] as const;
export default function Sidebar(){const dispatch=useDispatch();return <aside className="sidebar fixed inset-y-0 left-0 z-50 w-[260px] bg-white shadow-lg dark:bg-[#101a32] print:hidden"><div className="flex h-full flex-col"><div className="px-6 py-7"><p className="text-xl font-bold text-primary dark:text-white">My Shop</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your daily notebook</p></div><nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 pb-5"><ul className="space-y-1">{links.map(([label,path,Icon])=><li key={label}><NavLink end to={'/account'+(path?'/'+path:'')} onClick={()=>{if(window.innerWidth<1024)dispatch(toggleSidebar());}} className={({isActive})=>'flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-3 font-medium '+(isActive?'bg-primary/10 text-primary dark:bg-white/10 dark:text-white':'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5')}><Icon className="h-5 w-5 shrink-0"/>{label}</NavLink></li>)}</ul></nav></div></aside>;}
