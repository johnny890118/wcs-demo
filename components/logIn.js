import React, { useState, Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import userImg from "@/styles/user.png";
import passwordImg from "@/styles/password.png";
import Link from "next/link";

const LogIn = ({ openModal, closeModal }) => {
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

  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="background-agv bg-gray-900">
                  <div>
                    <div className="flex items-center justify-between px-4 py-2">
                      <Dialog.Title
                        as="h1"
                        className="fontChange bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-xl font-bold text-gray-200 text-transparent sm:text-2xl"
                      >
                        X&X
                      </Dialog.Title>
                      <h1 className="text-3xl font-bold text-gray-200">
                        SignIn
                      </h1>
                      <div className="h-[28px] w-[43px] sm:h-[45px] sm:w-[51px]"></div>
                    </div>
                    {!session && (
                      <div className="flex h-[300px] justify-evenly">
                        <div className="mx-20 flex flex-col items-center justify-evenly">
                          <div
                            className={`flex h-[6vh] w-[30vh] items-center justify-center rounded-lg bg-gray-700 ${
                              isUsernameFocused ? "ring-4 ring-violet-700" : ""
                            }`}
                          >
                            <Image
                              src={userImg}
                              alt=""
                              className="h-[3.5vh] w-[15%] rounded-lg bg-gray-700 pl-2"
                            />
                            <input
                              className="h-[6vh] w-[85%] rounded-lg bg-gray-700 px-2 text-center text-gray-200 outline-none"
                              type="text"
                              name="username"
                              placeholder="請輸入帳號"
                              value={credentials.username}
                              onChange={handleChange}
                              onFocus={() => setIsUsernameFocused(true)}
                              onBlur={() => setIsUsernameFocused(false)}
                            />
                          </div>
                          <div
                            className={`flex h-[6vh] w-[30vh] items-center justify-center rounded-lg bg-gray-700 ${
                              isPasswordFocused ? "ring-4 ring-violet-700" : ""
                            }`}
                          >
                            <Image
                              src={passwordImg}
                              alt=""
                              className="h-[4vh] w-[15%] rounded-lg bg-gray-700 pl-2"
                            />
                            <input
                              className="h-[6vh] w-[85%] rounded-lg bg-gray-700 px-2 text-center text-gray-200 outline-none"
                              type="password"
                              name="password"
                              placeholder="請輸入密碼"
                              value={credentials.password}
                              onChange={handleChange}
                              onFocus={() => setIsPasswordFocused(true)}
                              onBlur={() => setIsPasswordFocused(false)}
                            />
                          </div>
                          <button
                            type="button"
                            className="mt-10 inline-flex h-[6vh] w-full items-center justify-center rounded-md bg-gradient-to-r from-violet-700 to-pink-700 text-base font-semibold leading-[5vh] text-gray-200 shadow-sm hover:bg-violet-600 hover:from-violet-600 hover:to-pink-600 hover:text-white sm:w-[30vh]"
                            onClick={handleLogin}
                          >
                            登入
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t-2 border-gray-800 bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <Link href={"/wait"}>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-800 px-4 py-2 text-base font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-700 hover:text-white sm:mt-0 sm:w-auto"
                      onClick={() => closeModal()}
                      ref={cancelButtonRef}
                    >
                      取消
                    </button>
                  </Link>
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
