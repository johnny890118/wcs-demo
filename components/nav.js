import React, { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import unlockImg from "../styles/unlock.png";
import lockImg from "../styles/lock.png";
import Image from "next/image";
import LogIn from "./logIn";
import { useSession, signOut } from "next-auth/react";
import {
  isLegacyRouteCurrent,
  legacyNavigationRoutes,
} from "../src/application/navigation/legacy-routes";

const Nav = () => {
  const [signInModal, setSignInModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuButton = useRef(null);
  const router = useRouter();
  const { data: session } = useSession();

  const navigation = legacyNavigationRoutes.map((item) => ({
    ...item,
    current: isLegacyRouteCurrent(item.href, router.pathname),
  }));

  return (
    <div
      className="fixed top-0 z-10 w-full"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          setIsOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <nav className="bg-gray-800">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-[8vh] items-center justify-between">
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
              <button
                type="button"
                ref={menuButton}
                aria-expanded={isOpen}
                aria-controls="legacy-mobile-navigation"
                onClick={() => setIsOpen(!isOpen)}
                className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
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
      </nav>
      <div
        id="legacy-mobile-navigation"
        hidden={!isOpen}
        className="h-screen w-1/2 bg-gray-800 sm:hidden"
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
      </div>
    </div>
  );
};

export default Nav;
