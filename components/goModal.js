import React from "react";
import { Fragment, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import agv from "../styles/agv-robot.png";

const GoModal = ({
  gogo,
  closeModal,
  setOutBox,
  setInBox,
  setWaitAreaGoods,
  currentTimeList,
  setCurrentTimeList,
  getCurrentTime,
  taskWaitList,
  setTaskWaitList,
  inBox,
  outBox,
}) => {
  const [temporaryInBox, setTemporaryInBox] = useState("");
  const [temporaryInBoxStation, setTemporaryInBoxStation] = useState("");
  const [temporaryOutBox, setTemporaryOutBox] = useState("");
  const [temporaryOutBoxStation, setTemporaryOutBoxStation] = useState("");

  const cancelButtonRef = useRef(null);

  return (
    <Transition.Root show={gogo} as={Fragment}>
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
              <Dialog.Panel className="relative w-screen transform overflow-hidden  rounded-2xl text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="background-agv bg-gray-900">
                  <div>
                    <div className="flex items-center justify-between bg-violet-950 px-4 py-2">
                      <Image
                        src={agv}
                        alt=""
                        className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"
                      />
                      <Dialog.Title
                        as="h1"
                        className="text-2xl font-semibold text-gray-200 sm:text-3xl"
                      >
                        任務派車
                      </Dialog.Title>
                      <div className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"></div>
                    </div>
                    <div className="flex h-[300px] justify-evenly">
                      <div className="ml-4 mr-3 flex flex-col items-center justify-evenly">
                        <p className="text-lg font-bold text-gray-100">入庫</p>
                        <div className="flex flex-row items-center">
                          <p className="text-gray-200">工站：</p>
                          <select
                            className="h-8 w-16 rounded-md bg-gray-600 text-gray-200 sm:w-24"
                            onChange={(e) => {
                              setTemporaryInBoxStation(e.target.value);
                            }}
                          >
                            <option value=""></option>
                            <option value="工作站1">工作站1</option>
                            <option value="工作站2">工作站2</option>
                            <option value="工作站3">工作站3</option>
                            <option value="工作站4">工作站4</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-center">
                          <p className="text-gray-200">貨號：</p>
                          <input
                            className="h-8 w-16 rounded-md bg-gray-600 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-violet-600 sm:w-24"
                            type="text"
                            // placeholder="請輸入貨號"
                            onChange={(e) => setTemporaryInBox(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-violet-700 px-4 py-2 text-base font-semibold text-gray-200 shadow-sm hover:bg-violet-600 hover:text-white sm:ml-3 sm:w-auto"
                          onClick={() => {
                            temporaryInBox !== "" &&
                            temporaryInBoxStation !== ""
                              ? (setTaskWaitList([
                                  ...taskWaitList,
                                  {
                                    boxID: temporaryInBox,
                                    dockID: temporaryInBoxStation,
                                    time: getCurrentTime(),
                                    workType: "入庫",
                                  },
                                ]),
                                // postInOutbox(
                                //   temporaryInBox,
                                //   temporaryInBoxStation,
                                // ),
                                setInBox([...inBox, temporaryInBox]),
                                closeModal(),
                                setWaitAreaGoods(true))
                              : alert("入庫輸入框不得為空");
                          }}
                        >
                          入庫
                        </button>
                      </div>
                      <div className="flex h-[100%] flex-row items-center">
                        <hr className="h-[70%] w-[1px] border-none bg-gray-700" />
                      </div>
                      <div className="ml-3 mr-4 flex flex-col items-center justify-evenly">
                        <p className="text-lg font-bold text-gray-100">出庫</p>
                        <div className="flex flex-row items-center">
                          <p className="text-gray-200">工站：</p>
                          <select
                            className="h-8 w-16 rounded-md bg-gray-600 text-gray-200 sm:w-24"
                            onChange={(e) => {
                              setTemporaryOutBoxStation(e.target.value);
                            }}
                          >
                            <option></option>
                            <option value="工作站1">工作站1</option>
                            <option value="工作站2">工作站2</option>
                            <option value="工作站3">工作站3</option>
                            <option value="工作站4">工作站4</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-center">
                          <p className="text-gray-200">貨號：</p>
                          <input
                            className="h-8 w-16 rounded-md bg-gray-600 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-violet-600 sm:w-24"
                            type="text"
                            // placeholder="請輸入貨號"
                            onChange={(e) => setTemporaryOutBox(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-violet-700 px-4 py-2 text-base font-semibold text-gray-200 shadow-sm hover:bg-violet-600 hover:text-white sm:ml-3 sm:w-auto"
                          onClick={() => {
                            temporaryOutBox !== "" &&
                            temporaryOutBoxStation !== ""
                              ? (setTaskWaitList([
                                  ...taskWaitList,
                                  {
                                    boxID: temporaryOutBox,
                                    dockID: temporaryOutBoxStation,
                                    time: getCurrentTime(),
                                    workType: "出庫",
                                  },
                                ]),
                                // postInOutbox(
                                //   temporaryOutBox,
                                //   temporaryOutBoxStation,
                                // ),
                                setOutBox([...outBox, temporaryOutBox]),
                                closeModal())
                              : alert("出庫輸入框不得為空");
                          }}
                        >
                          出庫
                        </button>
                      </div>
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

export default GoModal;
