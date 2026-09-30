import React from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { useState, Fragment } from "react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import IconX from "../Icon/IconX";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import IconRefresh from "../Icon/IconRefresh";
import { useSearchParams } from "react-router-dom";
function Filter({ title, children, name, resetFilters }: any) {
  const [modal1, setModal1] = useState(false);
  
    const [searchParams, setSearchParams] = useSearchParams();
  const {t} = useTranslation();    
  return (
    <div className="">
      <div className="flex items-end  justify-center">
        <button
          type="button"
          onClick={() => setModal1(true)}
          className="btn btn-primary btn-sm m-1 "
        >
          <FunnelIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
        {t("common.filter")}
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchParams({});
          }}
          className="btn btn-danger btn-sm m-1 "
        >
           <IconRefresh className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
           {t("common.reset")}
        </button>
    
      </div>
      <Transition appear show={modal1} as={Fragment}>
        <Dialog as="div" open={modal1} onClose={() => setModal1(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0" />
          </Transition.Child>
          <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
            <div className="flex items-start justify-center min-h-screen px-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  as="div"
                  className="panel border-0 p-0 rounded-lg overflow-hidden my-8 w-full max-w-lg text-black dark:text-white-dark"
                >
                  <div className="flex bg-gray-100 dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                    <div className="text-lg flex font-bold  flex-row justify-between w-full ">
                      {title}
                    </div>
                    <button
          type="button"
          onClick={() => {
            resetFilters();
            setModal1(false);
          }}
          className="btn btn-outline-danger btn-sm "
        >
          <IconX className="w-5 h-5 " />
        </button>
                  </div>
                  <div className="p-5">{children}</div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default Filter;
