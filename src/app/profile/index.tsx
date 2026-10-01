import React from 'react';
import Security from './Security';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faCalendarAlt, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { isLoggedIn } from '@/hooks/api/auth';
import { useTranslation } from 'react-i18next';

const ProfilePage = () => {
    const user = isLoggedIn();
    return (<div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <main>
        <UserProfile user={user}/><Security/>
      </main>
     
    </div>);
};
export default ProfilePage;
const UserProfile = ({ user }: any) => {
    const { t } = useTranslation();
    return (<div className="panel">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{t('profile.userProfile')}</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">{t('profile.personalDetails')}</p>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <dl>
          {[
            { label: t('profile.username'), value: user?.username, icon: faUser, iconColor: 'text-blue-500' },
            { label: t('profile.email'), value: user?.email, icon: faEnvelope, iconColor: 'text-green-500' },
            { label: t('profile.phone'), value: user?.phone, icon: faPhone, iconColor: 'text-yellow-500' },

            {
                label: t('profile.status'),
                value: user?.is_active ? (<span className="badge bg-green-500 text-white rounded-full px-2 py-1 text-xs font-semibold">
                  {t('profile.active')}
                </span>) : (<span className="badge bg-red-500 text-white rounded-full px-2 py-1 text-xs font-semibold">
                  {t('profile.inactive')}
                </span>),
                icon: faCalendarAlt,
                iconColor: 'text-red-500',
            },
            { label: t('profile.createdAt'), value: new Date(user?.createdAt).toLocaleDateString(), icon: faCalendarAlt, iconColor: 'text-teal-500' },
            { label: t('profile.updatedAt'), value: new Date(user?.updatedAt).toLocaleDateString(), icon: faCalendarAlt, iconColor: 'text-teal-500' },
        ].map((field, index) => (<div key={index} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">{field.label}</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2 flex items-center">
                <FontAwesomeIcon icon={field.icon} className={`mr-2 ${field.iconColor}`}/>
                {field.value}
              </dd>
            </div>))}
        </dl>
      </div>
    </div>);
};
