import React, { useState, useEffect, useMemo } from "react";
import { Disclosure, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import unlockImg from "../styles/unlock.png";
import lockImg from "../styles/lock.png";
import Image from "next/image";
import LogIn from "./logIn";
import { useSession, signOut } from "next-auth/react";

const Nav = () => {
  const [signInModal, setSignInModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const [navigation, setNavigation] = useState([
    {
      name: "派車系統",
      href: "/",
      current: router.pathname === "/",
    },
    { name: "戰情看板", href: "/wait", current: router.pathname === "/wait" },
    {
      name: "工程模式",
      href: "/engineeringMode",
      current: router.pathname === "/engineeringMode",
    },
  ]);

  useEffect(() => {
    setNavigation((prevNavigation) => {
      return prevNavigation.map((item) => ({
        ...item,
        current: item.href === router.pathname,
        isUnlock: false,
      }));
    });
  }, [router.pathname]);

  return (
    <div className="fixed top-0 z-10 w-full">
      <Disclosure as="nav" className="bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-[8vh] items-center justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  <Disclosure.Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  >
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>

                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex flex-shrink-0 items-center">
                    <h1 className="fontChange bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-2xl font-bold text-transparent">
                      X&X
                    </h1>
                  </div>
                  <div className="hidden sm:ml-6 sm:block">
                    <div className="flex space-x-4">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white",
                            "flex items-center rounded-md px-3 py-2 text-base font-semibold",
                          )}
                          aria-current={item.current ? "page" : undefined}
                        >
                          {item.name}
                          {item.name === "工程模式" && session ? (
                            <Image
                              src={unlockImg}
                              className="ml-2 h-5 w-5"
                              alt="unlock"
                            />
                          ) : (
                            item.name === "工程模式" &&
                            !session && (
                              <Image
                                src={lockImg}
                                className="ml-2 h-5 w-5"
                                alt="lock"
                              />
                            )
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    {!session ? (
                      <button
                        className="rounded-md bg-violet-700 px-3 py-2 text-base font-semibold text-gray-300 hover:bg-violet-600 hover:text-white"
                        onClick={() => setSignInModal(true)}
                      >
                        登入
                      </button>
                    ) : (
                      <button
                        className="rounded-md bg-violet-700 px-3 py-2 text-base font-semibold text-gray-300 hover:bg-violet-600 hover:text-white"
                        onClick={() => {
                          signOut();
                        }}
                      >
                        登出
                      </button>
                    )}
                    <LogIn
                      openModal={signInModal}
                      closeModal={() => setSignInModal(false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Disclosure>
      <Transition
        show={isOpen}
        enter="transition-transform duration-300"
        enterFrom="transform -translate-x-full"
        enterTo="transform translate-x-0"
        leave="transition-transform duration-200"
        leaveFrom="transform translate-x-0"
        leaveTo="transform -translate-x-full"
        className="h-screen w-1/2 bg-gray-800"
      >
        <div className="sm:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  item.current
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white",
                  "flex items-center rounded-md px-3 py-2 text-base font-medium",
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.name}
                {item.name === "工程模式" && session ? (
                  <Image
                    src={unlockImg}
                    className="ml-2 h-5 w-5"
                    alt="unlock"
                  />
                ) : (
                  item.name === "工程模式" &&
                  !session && (
                    <Image src={lockImg} className="ml-2 h-5 w-5" alt="lock" />
                  )
                )}
              </Link>
            ))}
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default Nav;
