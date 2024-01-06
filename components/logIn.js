import React, { useState, Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import signInImg from "../styles/login.png";
import { useSession, signIn } from "next-auth/react";

const LogIn = ({ gogo, closeModal }) => {
  const cancelButtonRef = useRef(null);
  const { data: session } = useSession();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prevCredentials) => ({
      ...prevCredentials,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    await signIn("credentials", {
      username: credentials.username,
      password: credentials.password,
      callbackUrl: "/engineeringMode",
    });
  };

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl  text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="background-agv bg-gray-900">
                  <div>
                    <div className="flex items-center justify-between bg-gradient-to-r from-violet-700 to-pink-700 px-4 py-2">
                      <Image
                        src={signInImg}
                        alt=""
                        className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"
                      />
                      <Dialog.Title
                        as="h1"
                        className="fontChange text-2xl font-semibold text-gray-200 sm:text-3xl"
                      >
                        X&X
                      </Dialog.Title>
                      <div className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"></div>
                    </div>
                    {!session && (
                      <div className="flex h-[300px] justify-evenly">
                        <div className="mx-20 flex flex-col items-center justify-evenly">
                          <div className="flex items-center justify-center">
                            <p className="text-lg font-bold text-gray-200">
                              帳號
                            </p>
                            <input
                              className="m-2 h-8 w-24 rounded-md bg-gray-700 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-violet-600"
                              type="text"
                              name="username"
                              placeholder="請輸入帳號"
                              value={credentials.username}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="flex items-center justify-center">
                            <p className="text-lg font-bold text-gray-200">
                              密碼
                            </p>
                            <input
                              className="m-2 h-8 w-24 rounded-md bg-gray-700 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-violet-600"
                              type="password"
                              name="password"
                              placeholder="請輸入密碼"
                              value={credentials.password}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t-2 border-gray-800 bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {!session && (
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-violet-700 to-pink-700 px-4 py-2 text-base font-semibold text-gray-200 shadow-sm hover:bg-violet-600 hover:from-violet-600 hover:to-pink-600 hover:text-white sm:ml-3 sm:w-auto"
                      onClick={handleLogin}
                    >
                      登入
                    </button>
                  )}
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

export default LogIn;
