import React from "react";
import { Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import map from "../styles/map.png";

const MapDetail = ({ openModal, closeModal, deetu }) => {
  const noUseTrigger = () => {
    let total = 0;
    deetu.forEach((i) => {
      if (i.trigger === "") {
        total += 1;
      }
    });
    return total;
  };

  const useTrigger = () => {
    let total = 0;
    deetu.forEach((i) => {
      if (i.susin === 9) {
        total += 1;
      }
    });
    return total;
  };

  const mapstate = [
    { name: "目前樓層：", value: 1 },
    { name: "車輛數量：", value: 1 },
    { name: "未使用儲格：", value: noUseTrigger() },
    { name: "已使用儲格：", value: useTrigger() },
  ];
  const cancelButtonRef = useRef(null);

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
              <Dialog.Panel className="relative w-screen transform overflow-hidden rounded-2xl text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="background-agv bg-gray-900">
                  <div>
                    <div className="flex items-center justify-between bg-pink-950 px-4 py-2">
                      <Image
                        src={map}
                        alt=""
                        className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"
                      />
                      <Dialog.Title
                        as="h1"
                        className="text-2xl font-semibold text-gray-200 sm:text-3xl"
                      >
                        地圖細節
                      </Dialog.Title>
                      <div className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"></div>
                    </div>
                    <div className="flex flex-col-reverse justify-evenly sm:flex-row">
                      <div className="mx-3 flex h-[300px] flex-col justify-center text-lg font-bold text-gray-200 sm:w-[45%]">
                        <div className="my-2 flex h-[3vh]">
                          <svg
                            baseProfile="tiny"
                            height="100%"
                            width="100%"
                            viewBox="0 0 30 15"
                            version="1.2"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                          >
                            <g>
                              <rect
                                width="30px"
                                height="15px"
                                fill="#6D28B9"
                                stroke="#000000"
                                strokeWidth="1"
                              ></rect>
                            </g>
                          </svg>
                          <p className="w-[80%]">主幹</p>
                        </div>
                        <div className="my-2 flex h-[3vh]">
                          <svg
                            baseProfile="tiny"
                            height="100%"
                            width="100%"
                            viewBox="0 0 30 15"
                            version="1.2"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                          >
                            <g>
                              <rect
                                width="30px"
                                height="15px"
                                fill="#be185d"
                                stroke="#000000"
                                strokeWidth="1"
                              ></rect>
                            </g>
                          </svg>
                          <p className="w-[80%]">支幹</p>
                        </div>
                        <div className="my-2 flex h-[3vh]">
                          <svg
                            baseProfile="tiny"
                            height="100%"
                            width="100%"
                            viewBox="0 0 30 15"
                            version="1.2"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                          >
                            <g>
                              <rect
                                width="30px"
                                height="15px"
                                fill="#ff8000"
                              ></rect>
                            </g>
                          </svg>
                          <p className="w-[80%]">港口</p>
                        </div>
                        <div className="my-2 flex h-[3vh]">
                          <svg
                            baseProfile="tiny"
                            height="100%"
                            width="100%"
                            viewBox="0 0 30 15"
                            version="1.2"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                          >
                            <g>
                              <rect
                                width="30px"
                                height="15px"
                                fill="#1D4ED8"
                              ></rect>
                            </g>
                          </svg>
                          <p className="w-[80%]">未使用儲格</p>
                        </div>

                        <div className="my-2 flex h-[3vh]">
                          <svg
                            baseProfile="tiny"
                            height="100%"
                            width="100%"
                            viewBox="0 0 30 15"
                            version="1.2"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                          >
                            <g>
                              <rect
                                width="30px"
                                height="15px"
                                fill="#65B741"
                              ></rect>
                            </g>
                          </svg>
                          <p className="w-[80%]">已使用儲格</p>
                        </div>
                      </div>
                      <hr className="h-[70%] w-[1px] border-none bg-gray-700"></hr>
                      <div className="flex h-[300px] flex-col items-center justify-evenly sm:items-start">
                        {mapstate.map((item) => (
                          <div className="mx-16" key={item.name}>
                            <p className="text-lg font-bold text-gray-200">
                              {item.name}
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t-2 border-gray-800 bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {/* <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-pink-700 px-4 py-2 text-base font-semibold text-gray-200 shadow-sm hover:bg-pink-600 hover:text-white sm:ml-3 sm:w-auto"
                    onClick={() => {
                      closeModal();
                    }}
                  >
                    出發
                  </button> */}
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

export default MapDetail;
