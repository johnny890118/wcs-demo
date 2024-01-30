import React from "react";
import { Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import carInfo from "../styles/carInfo.png";

const CarInfo = ({ openModal, closeModal, position, carWorking }) => {
  const cancelButtonRef = useRef(null);
  const carInfoDetail = [
    { name: "車輛編號：", value: 1 },
    { name: "車輛電量：", value: "100%" },
    { name: "車輛位置：", value: `[ ${position[0]} , ${position[1]} ]` },
    { name: "車輛狀態：", value: carWorking },
  ];

  return (
    <Transition.Root show={openModal} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={() => closeModal()}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-700 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl  text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="background-agv bg-gray-900">
                  <div>
                    <div className="flex items-center justify-between bg-blue-950 px-4 py-2">
                      <Image
                        src={carInfo}
                        alt=""
                        className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"
                      />
                      <Dialog.Title
                        as="h1"
                        className="text-2xl font-semibold text-gray-200 sm:text-3xl"
                      >
                        車體資訊
                      </Dialog.Title>
                      <div className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"></div>
                    </div>
                    <div className="flex h-[300px] flex-col items-center justify-evenly">
                      {carInfoDetail.map((item) => (
                        <div className="mx-16 flex" key={item.name}>
                          <p className="text-lg font-bold text-gray-200">
                            {item.name}
                          </p>
                          <p className="text-lg text-gray-200">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t-2 border-gray-800 bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-800 px-4 py-2 text-base font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-700 hover:text-white sm:mt-0 sm:w-auto"
                    onClick={() => {
                      closeModal();
                    }}
                    ref={cancelButtonRef}
                  >
                    取消
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CarInfo;
