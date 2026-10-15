import React, { useState, useRef } from "react";
import { LegacyDialog, LegacyDialogTitle } from "./legacy/LegacyDialog";
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
      callbackUrl: "/legacy/engineering-mode",
    });
  };

  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  return (
    <LegacyDialog
      open={openModal}
      onClose={closeModal}
      initialFocus={cancelButtonRef}
    >
      <div className="background-agv bg-gray-900">
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <LegacyDialogTitle className="fontChange bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-xl font-bold text-gray-200 text-transparent sm:text-2xl">
              X&X
            </LegacyDialogTitle>
            <h1 className="text-3xl font-bold text-gray-200">SignIn</h1>
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
                    aria-label="帳號"
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
                    aria-label="密碼"
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
        <Link
          href={"/legacy/fdp"}
          className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-800 px-4 py-2 text-base font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-700 hover:text-white sm:mt-0 sm:w-auto"
          onClick={() => closeModal()}
          ref={cancelButtonRef}
        >
          取消
        </Link>
      </div>
    </LegacyDialog>
  );
};

export default LogIn;
