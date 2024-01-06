import Layout from "@/components/layout";
import { useSession } from "next-auth/react";

const EngineeringMode = () => {
  const { data: session } = useSession();
  return (
    <Layout>
      {!session ? (
        <div className="flex h-[92vh] w-full items-center justify-center">
          <h1 className="text-2xl text-white">可惜你不是工程師</h1>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-evenly sm:h-[92vh]">
          <div>
            <button className="allStopBtn m-2 flex flex-col items-center justify-center sm:m-0">
              <div className="allStopBtn1 m-2 flex h-20 w-20 items-center justify-center rounded-xl bg-red-700 sm:mb-2 sm:mt-0">
                <div className="allStopBtn2 h-8 w-8 bg-gray-200"></div>
              </div>
              <p className="text-gray-300 ">全部設備緊急停止</p>
            </button>
          </div>
          <div className="flex w-full flex-col items-center justify-center sm:flex-row sm:justify-evenly">
            <div className="mb-6 flex h-fit w-[80%] flex-col items-center justify-between rounded-xl bg-gray-700 sm:m-0 sm:h-[70vh] sm:w-[30%]">
              <h1 className="my-2 h-10 w-[90%] rounded-lg bg-violet-700 text-center text-xl font-bold leading-10 text-gray-300">
                車輛控制
              </h1>
              <div className="flex items-center">
                <p className="text-gray-200">車輛選擇</p>
                <select
                  name=""
                  id=""
                  className="m-2 h-8 w-24 rounded-md bg-gray-500 text-gray-200"
                >
                  <option value=""></option>
                  <option value="1">車車1</option>
                  <option value="2">車車2</option>
                  <option value="3">車車3</option>
                  <option value="4">車車4</option>
                </select>
              </div>
              <div className="flex w-full flex-col items-center justify-evenly lg:flex-row">
                <div className="flex flex-col">
                  <div className="flex justify-evenly">
                    <button className="carControlBtn m-1 sm:m-3">
                      <div className="carControlBtn1 flex h-20 w-20 items-center justify-center rounded-xl bg-violet-700">
                        <div class="h-0 w-0 border-b-[40px] border-l-[25px] border-r-[25px] border-b-gray-200 border-l-transparent border-r-transparent"></div>
                      </div>
                      <p className="text-gray-300">車輛前進</p>
                    </button>
                    <button className="carControlBtn m-1 sm:m-3">
                      <div className="carControlBtn2 flex h-20 w-20 items-center justify-center rounded-xl bg-violet-700">
                        <div class="h-0 w-0 border-l-[25px] border-r-[25px] border-t-[40px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                      </div>
                      <p className="text-gray-300">車輛後退</p>
                    </button>
                  </div>
                  <div className="flex justify-evenly">
                    <button className="carControlBtn m-1 sm:m-3">
                      <div className="carControlBtn3 flex h-20 w-20 items-center justify-center rounded-xl bg-violet-700">
                        <div class="h-0 w-0 border-b-[25px] border-r-[40px] border-t-[25px] border-b-transparent border-l-gray-200 border-t-transparent"></div>
                      </div>
                      <p className="text-gray-300">車輛左移</p>
                    </button>
                    <button className="carControlBtn m-1 sm:m-3">
                      <div className="carControlBtn4 flex h-20 w-20 items-center justify-center rounded-xl bg-violet-700">
                        <div class="h-0 w-0 border-b-[25px] border-l-[40px] border-t-[25px] border-b-transparent border-l-gray-200 border-t-transparent"></div>
                      </div>
                      <p className="text-gray-300">車輛右移</p>
                    </button>
                  </div>
                </div>
                <button className="carStopBtn">
                  <div className="carStopBtn1 flex h-20 w-20 items-center justify-center rounded-xl bg-pink-700">
                    <div className="h-8 w-8 bg-gray-200"></div>
                  </div>
                  <p className="text-gray-300">車輛停止</p>
                </button>
              </div>
              <div>
                <div className="flex items-center">
                  <p className="text-gray-200">速度</p>
                  <input
                    type="text"
                    className="m-2 h-8 w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-violet-600"
                  />
                  <button className="h-8 w-16 rounded-md bg-violet-700 text-gray-200 hover:bg-violet-600">
                    設定
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-6 flex h-[70vh] w-[80%] flex-col items-center justify-between rounded-xl bg-gray-700 sm:m-0 sm:h-[70vh] sm:w-[30%]">
              <h1 className="my-2 h-10 w-[90%] rounded-lg bg-cyan-700 text-center text-xl font-bold leading-10 text-gray-300">
                輸送帶控制
              </h1>
              <div className="flex w-full items-center justify-evenly"></div>
            </div>
            <div className="mb-6 flex h-[70vh] w-[80%] flex-col items-center justify-between rounded-xl bg-gray-700 sm:m-0 sm:h-[70vh] sm:w-[30%]">
              <h1 className="my-2 h-10 w-[90%] rounded-lg bg-gray-900 text-center text-xl font-bold leading-10 text-gray-300">
                升降梯控制
              </h1>
              <div className="flex w-full items-center justify-evenly"></div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EngineeringMode;
