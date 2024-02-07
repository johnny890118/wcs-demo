import Layout from "@/components/layout";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import jackUp from "@/public/jackUp.png";
import jackDown from "@/public/jackDown.png";
import turn from "@/public/turn.png";
import axios from "axios";
import LogIn from "@/components/logIn";
import openDoorImg from "@/public/openDoor.png";
import closeDoorImg from "@/public/closeDoor.png";
import classNames from "classnames";
import paulseBtnImage from "@/public/pauseButton.png";
import startBtnImage from "@/public/playButton.png";

const EngineeringMode = () => {
  const { data: session } = useSession();

  const [signInModal, setSignInModal] = useState(true);
  const [vehicleChoose, setVehicleChoose] = useState(0);
  const [vehicleSpeed, setVehicleSpeed] = useState(null);
  const [vehicleCnS, setVehicleCnS] = useState(false);
  const [vehiclego, setVehiclego] = useState({ x: null, y: null });
  const [vehicleList, setVehicleList] = useState(null);
  const [floor, setFloor] = useState(1);
  const [conveyorChoose, setConveyorChoose] = useState(0);
  const [conveyorCnS, setConveyorCnS] = useState(false);
  const [conveyorSpeed, setConveyorSpeed] = useState(null);
  const [liftSpeed, setLiftSpeed] = useState(null);
  const [liftChoose, setLiftChoose] = useState(1);
  const [liftCnS, setLiftCnS] = useState(false);

  useEffect(() => {
    const getVehicleData = async () => {
      try {
        const response = await axios.get("/api");
        setVehicleList(response.data);
      } catch (error) {
        console.log(`錯誤 : ${error.message}`);
      }
    };
    const intervalGetVehicleData = setInterval(() => {
      getVehicleData();
    }, 1000);
    return () => clearInterval(intervalGetVehicleData);
  }, []);

  const allStop = async () => {
    try {
      const response = await axios.post("/api", { stop: "allstop" });
      const responseData = response.data;
      console.log("post成功", responseData);
    } catch (error) {
      alert(`錯誤 : ${error.message}`);
    }
  };

  const carControl = async (type, data) => {
    try {
      if (type === "jack") {
        const response = await axios.post("/api", {
          loadType: data === "up" ? 0 : 1,
          vehicle: vehicleChoose,
        });
        const responseData = response.data;
        console.log("post成功", responseData);
      } else if (type === "move") {
        const response = await axios.post("/api", {
          move: {
            direction: data,
            speed: vehicleSpeed === "" ? null : parseFloat(vehicleSpeed),
          },
          vehicle: vehicleChoose,
        });
        const responseData = response.data;
        console.log("post成功", responseData);
      } else if (type === "speed") {
        const response = await axios.post("/api", {
          move: {
            direction: null,
            speed: vehicleSpeed === "" ? null : parseFloat(vehicleSpeed),
          },
          vehicle: vehicleChoose,
        });
        const responseData = response.data;
        console.log("post成功", responseData);
      } else if (type === "manual") {
        const response = await axios.post("/api", vehiclego);
        const responseData = response.data;
        console.log("post成功", responseData);
      }
    } catch (error) {
      alert(`錯誤 : ${error.message}`);
    }
  };

  const conveyorControl = async (type, data) => {
    try {
      if (type === "move") {
        const response = await axios.post("/api", {
          move: {
            direction: data,
            speed: conveyorSpeed === "" ? null : parseFloat(vehicleSpeed),
          },
          conveyorID: conveyorChoose,
        });
        const responseData = response.data;
        console.log("post成功", responseData);
      } else if (type === "speed") {
        const response = await axios.post("/api", {
          move: {
            direction: null,
            speed: conveyorSpeed === "" ? null : parseFloat(vehicleSpeed),
          },
          conveyorID: conveyorChoose,
        });
        const responseData = response.data;
        console.log("post成功", responseData);
      }
    } catch (error) {
      alert(`錯誤 : ${error.message}`);
    }
  };

  const liftControl = async (type, data) => {
    try {
      if (type === "move") {
        const response = await axios.post("/api", {
          move: {
            direction: data,
            speed: liftSpeed === "" ? null : liftSpeed,
          },
          liftID: liftChoose,
          door: null,
          floor: null,
        });
        const responseData = response.data;
        console.log("post成功", responseData);
      } else if (type === "floor") {
        const response = await axios.post("/api", {
          move: {
            direction: null,
            speed: liftSpeed === "" ? null : liftSpeed,
          },
          liftID: liftChoose,
          door: null,
          floor: floor,
        });
        const responseData = response.data;
        console.log("post成功", responseData);
      } else if (type === "door") {
        const response = await axios.post("/api", {
          move: {
            direction: null,
            speed: null,
          },
          liftID: liftChoose,
          door: data,
          floor: null,
        });
        const responseData = response.data;
        console.log("post成功", responseData);
      } else if (type === "speed") {
        const response = await axios.post("/api", {
          move: {
            direction: null,
            speed: liftSpeed === "" ? null : liftSpeed,
          },
          liftID: liftChoose,
          door: null,
          floor: null,
        });
        const responseData = response.data;
        console.log("post成功", responseData);
      }
    } catch (error) {
      alert(`錯誤 : ${error.message}`);
    }
  };

  return (
    <Layout>
      {!session ? (
        <div className="my-[20%] flex w-full justify-center">
          <LogIn
            openModal={signInModal}
            closeModal={() =>
              !session ? setSignInModal(true) : setSignInModal(false)
            }
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-evenly lg:h-[92vh]">
          <div>
            <button className="group m-6 flex flex-col items-center justify-center lg:m-0">
              <div
                className="m-2 flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-red-700 group-hover:bg-red-600 group-active:bg-red-700"
                onClick={() => {
                  allStop();
                }}
              >
                <div className="h-[4vh] w-[4vh] bg-gray-200 group-hover:bg-white"></div>
              </div>
              <p className="text-gray-200 group-hover:text-white">
                全部設備緊急停止
              </p>
            </button>
          </div>
          <div className="flex w-full flex-col items-center justify-center lg:flex-row lg:justify-evenly">
            <div className="mb-6 flex h-[90vh] w-[90%] flex-col items-center justify-between rounded-2xl bg-gray-700 py-2 lg:m-0 lg:h-[75vh] lg:w-[30%]">
              <h1 className="h-[5vh] w-[90%] rounded-xl bg-violet-700 text-center text-xl font-bold leading-[5vh] text-gray-100">
                車輛控制
              </h1>
              <div className="m-1 flex items-center">
                <p className="text-gray-200">車輛選擇</p>
                <select
                  className="m-2 h-[4.5vh] w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none ring-violet-700 focus:ring-4"
                  onChange={(e) => {
                    setVehicleChoose(e.target.value);
                    setVehicleSpeed(null);
                  }}
                >
                  {vehicleList &&
                    vehicleList.map((item, index) => {
                      return (
                        <option
                          key={index}
                          value={item.carID}
                        >{`車輛 ${item.carID}`}</option>
                      );
                    })}
                  {vehicleList && vehicleList.length > 1 && (
                    <option value={0}>ALL</option>
                  )}
                </select>
              </div>
              <div className="m-1 flex items-center">
                <p className="text-gray-200">車輛速度</p>
                <input
                  type="number"
                  className="m-2 h-[4.5vh] w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-violet-600"
                  onChange={(e) => {
                    setVehicleSpeed(e.target.value);
                  }}
                />
                <button
                  className="h-[4.5vh] w-16 rounded-md bg-violet-700 text-gray-200 hover:bg-violet-600 hover:text-white"
                  onClick={() => {
                    carControl("speed");
                  }}
                >
                  設定
                </button>
              </div>
              <div className="flex w-[90%] flex-wrap items-center justify-center xl:flex-row">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex items-center">
                    <p className="text-gray-200">X : </p>
                    <input
                      type="number"
                      className="m-2 h-[4.5vh] w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-violet-600 lg:w-14"
                      onChange={(e) => {
                        setVehiclego({
                          ...vehiclego,
                          x: parseInt(e.target.value),
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center">
                    <p className="text-gray-200">Y : </p>
                    <input
                      type="number"
                      className="m-2 h-[4.5vh] w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-violet-600 lg:w-14"
                      onChange={(e) => {
                        setVehiclego({
                          ...vehiclego,
                          y: parseInt(e.target.value),
                        });
                      }}
                    />
                  </div>
                </div>
                <button
                  className="h-[11vh] w-[11vh] rounded-2xl bg-violet-700 text-gray-200 hover:bg-violet-600 hover:text-white lg:h-[4.5vh] lg:w-16 lg:rounded-md"
                  onClick={() => {
                    setVehicleCnS(false);
                    carControl("manual");
                  }}
                >
                  派車
                </button>
              </div>
              <div className="flex w-full flex-col items-center justify-evenly">
                <div className="flex justify-evenly">
                  <button
                    className="group mx-3 my-1"
                    onClick={() => {
                      setVehicleCnS(false);
                      carControl("move", "w");
                    }}
                  >
                    <div className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-violet-700 group-hover:bg-violet-600 group-active:bg-violet-700">
                      <div className="h-0 w-0 border-b-[5vh] border-l-[3vh] border-r-[3vh] border-b-gray-200 border-l-transparent border-r-transparent"></div>
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      車輛前進
                    </p>
                  </button>
                  <button
                    className="group mx-3 my-1"
                    onClick={() => {
                      setVehicleCnS(false);
                      carControl("move", "s");
                    }}
                  >
                    <div className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-violet-700 group-hover:bg-violet-600 group-active:bg-violet-700">
                      <div className="h-0 w-0 border-l-[3vh] border-r-[3vh] border-t-[5vh] border-l-transparent border-r-transparent border-t-gray-200"></div>
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      車輛後退
                    </p>
                  </button>
                </div>
                <div className="flex justify-evenly">
                  <button className="group mx-3 my-1">
                    <div
                      className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-violet-700 group-hover:bg-violet-600 group-active:bg-violet-700"
                      onClick={() => {
                        setVehicleCnS(false);
                        carControl("move", "turn");
                      }}
                    >
                      <Image src={turn} alt="" className="h-[6vh] w-[6vh]" />
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      車輛轉向
                    </p>
                  </button>
                  <button
                    className="group mx-3 my-1"
                    onClick={() => {
                      setVehicleCnS(!vehicleCnS);
                      !vehicleCnS
                        ? carControl("move", "stop")
                        : carControl("move", "start");
                    }}
                  >
                    <div
                      className={classNames(
                        !vehicleCnS
                          ? "bg-pink-700 group-hover:bg-pink-600 group-active:bg-pink-700"
                          : "bg-lime-700 group-hover:bg-lime-600 group-active:bg-lime-700",
                        "flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl",
                      )}
                    >
                      <Image
                        src={!vehicleCnS ? paulseBtnImage : startBtnImage}
                        className="h-[7vh] w-[7vh]"
                        alt=""
                      ></Image>
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      {!vehicleCnS ? "車輛停止" : "車輛啟動"}
                    </p>
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-evenly">
                  <button className="group mx-3">
                    <div
                      className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-violet-700 group-hover:bg-violet-600 group-active:bg-violet-700"
                      onClick={() => {
                        setVehicleCnS(false);
                        carControl("jack", "up");
                      }}
                    >
                      <Image
                        src={jackUp}
                        alt=""
                        className="h-[5.5vh] w-[5.5vh]"
                      />
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      貨物頂昇
                    </p>
                  </button>
                  <button className="group mx-3">
                    <div
                      className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-violet-700 group-hover:bg-violet-600 group-active:bg-violet-700"
                      onClick={() => {
                        setVehicleCnS(false);
                        carControl("jack", "down");
                      }}
                    >
                      <Image
                        src={jackDown}
                        alt=""
                        className="h-[5.5vh] w-[5.5vh]"
                      />
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      貨物下降
                    </p>
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-6 flex h-[80vh] w-[90%] flex-col items-center justify-between rounded-2xl bg-gray-700 py-2 lg:m-0 lg:h-[75vh] lg:w-[30%]">
              <h1 className="h-[5vh] w-[90%] rounded-xl bg-yellow-700 text-center text-xl font-bold leading-[5vh] text-gray-100">
                輸送帶控制
              </h1>
              <div className="flex w-full flex-col items-center justify-center">
                <div className="m-1 flex items-center">
                  <p className="text-gray-200">輸送帶選擇</p>
                  <select
                    className="m-2 h-[4.5vh] w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none ring-yellow-700 focus:ring-4"
                    onChange={(e) => {
                      setConveyorChoose(e.target.value);
                    }}
                  >
                    <option value="1">輸送帶 1</option>
                    <option value="2">輸送帶 2</option>
                    <option value="3">輸送帶 3</option>
                    <option value="4">輸送帶 4</option>
                    <option value="0">ALL</option>
                  </select>
                </div>
              </div>
              <div className="m-1 flex items-center">
                <p className="text-gray-200">速度調整</p>
                <input
                  type="number"
                  className="m-2 h-[4.5vh] w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-yellow-600"
                  onChange={(e) => {
                    setConveyorSpeed(e.target.value);
                  }}
                />
                <button
                  className="h-[4.5vh] w-16 rounded-md bg-yellow-700 text-gray-200 hover:bg-yellow-600 hover:text-white"
                  onClick={() => {
                    conveyorControl("speed");
                  }}
                >
                  設定
                </button>
              </div>
              <div className="flex justify-evenly">
                <button className="group mx-3 my-1">
                  <div
                    className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-yellow-700 group-hover:bg-yellow-600 group-active:bg-yellow-700"
                    onClick={() => {
                      conveyorControl("move", "turn");
                    }}
                  >
                    <Image src={turn} alt="" className="h-[6vh] w-[6vh]" />
                  </div>
                  <p className="text-gray-200 group-hover:text-white">
                    輸送帶轉向
                  </p>
                </button>
                <button
                  className="group mx-3 my-1"
                  onClick={() => {
                    setConveyorCnS(!conveyorCnS);
                    !conveyorCnS
                      ? conveyorControl("move", "stop")
                      : conveyorControl("move", "start");
                  }}
                >
                  <div
                    className={classNames(
                      !conveyorCnS
                        ? "bg-pink-700 group-hover:bg-pink-600 group-active:bg-pink-700"
                        : "bg-lime-700 group-hover:bg-lime-600 group-active:bg-lime-700",
                      "flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl",
                    )}
                  >
                    <Image
                      src={!conveyorCnS ? paulseBtnImage : startBtnImage}
                      className="h-[7vh] w-[7vh]"
                      alt=""
                    ></Image>
                  </div>
                  <p className="text-gray-200 group-hover:text-white">
                    {!conveyorCnS ? "輸送帶停止" : "輸送帶啟動"}
                  </p>
                </button>
              </div>
              <div className="h-[256px]"></div>
            </div>
            <div className="mb-6 flex h-[80vh] w-[90%] flex-col items-center justify-between rounded-2xl bg-gray-700 py-2 lg:m-0 lg:h-[75vh] lg:w-[30%]">
              <h1 className="h-[5vh] w-[90%] rounded-xl bg-cyan-700 text-center text-xl font-bold leading-[5vh] text-gray-100">
                升降梯控制
              </h1>
              <div className="flex w-full flex-col items-center justify-center">
                <div className="m-1 flex items-center">
                  <p className="text-gray-200">升降梯選擇</p>
                  <select
                    className="m-2 h-[4.5vh] w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none ring-cyan-700 focus:ring-4"
                    onChange={(e) => {
                      setLiftChoose(e.target.value);
                    }}
                  >
                    <option value="1">升降梯 1</option>
                    <option value="2">升降梯 2</option>
                    <option value="0">ALL</option>
                  </select>
                </div>
              </div>
              <div className="flex w-[90%] flex-col flex-wrap items-center justify-center">
                <div className="m-1 flex items-center">
                  <p className="text-gray-200">樓層選擇</p>
                  <select
                    className="m-2 h-[4.5vh] w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none ring-cyan-700 focus:ring-4"
                    onChange={(e) => {
                      setFloor(e.target.value);
                    }}
                  >
                    <option value="1">樓層 1</option>
                    <option value="2">樓層 2</option>
                    <option value="3">樓層 3</option>
                    <option value="4">樓層 4</option>
                  </select>
                  <button
                    className="h-[4.5vh] w-16 rounded-md bg-cyan-700 text-gray-200 hover:bg-cyan-600 hover:text-white active:bg-cyan-700"
                    onClick={() => {
                      setLiftCnS(false);
                      liftControl("floor");
                    }}
                  >
                    前往
                  </button>
                </div>
                <div className="m-1 flex items-center">
                  <p className="text-gray-200">升降速度</p>
                  <input
                    type="number"
                    className="m-2 h-[4.5vh] w-24 rounded-md bg-gray-500 p-1 text-gray-200 outline-none focus:border-b-4 focus:border-cyan-600"
                    onChange={(e) => {
                      setLiftSpeed(e.target.value);
                    }}
                  />
                  <button
                    className="h-[4.5vh] w-16 rounded-md bg-cyan-700 text-gray-200 hover:bg-cyan-600 hover:text-white active:bg-cyan-700"
                    onClick={() => {
                      liftControl("speed");
                    }}
                  >
                    設定
                  </button>
                </div>
              </div>
              <div className="flex w-full flex-col items-center justify-evenly">
                <div className="flex justify-evenly">
                  <button
                    className="group mx-3 my-1"
                    onClick={() => {
                      setLiftCnS(false);
                      liftControl("move", "w");
                    }}
                  >
                    <div className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-cyan-700 group-hover:bg-cyan-600 group-active:bg-cyan-700">
                      <div className="h-0 w-0 border-b-[5vh] border-l-[3vh] border-r-[3vh] border-b-gray-200 border-l-transparent border-r-transparent"></div>
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      升降梯上升
                    </p>
                  </button>
                  <button
                    className="group mx-3 my-1"
                    onClick={() => {
                      setLiftCnS(false);
                      liftControl("move", "s");
                    }}
                  >
                    <div className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-cyan-700 group-hover:bg-cyan-600 group-active:bg-cyan-700">
                      <div className="h-0 w-0 border-l-[3vh] border-r-[3vh] border-t-[5vh] border-l-transparent border-r-transparent border-t-gray-200"></div>
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      升降梯下降
                    </p>
                  </button>
                </div>
                <div>
                  <button
                    className="group mx-3 my-1"
                    onClick={() => {
                      setLiftCnS(!liftCnS);
                      !liftCnS
                        ? liftControl("move", "stop")
                        : liftControl("move", "start");
                    }}
                  >
                    <div
                      className={classNames(
                        !liftCnS
                          ? "bg-pink-700 group-hover:bg-pink-600 group-active:bg-pink-700"
                          : "bg-lime-700 group-hover:bg-lime-600 group-active:bg-lime-700",
                        "flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl",
                      )}
                    >
                      <Image
                        src={!liftCnS ? paulseBtnImage : startBtnImage}
                        className="h-[7vh] w-[7vh]"
                        alt=""
                      ></Image>
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      {!liftCnS ? "升降梯停止" : "升降梯啟動"}
                    </p>
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-evenly">
                  <button className="group mx-3 my-1">
                    <div
                      className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-cyan-700 group-hover:bg-cyan-600 group-active:bg-cyan-700"
                      onClick={() => {
                        setLiftCnS(false);
                        liftControl("door", 1);
                      }}
                    >
                      <Image
                        src={openDoorImg}
                        alt=""
                        className="h-[7vh] w-[7vh]"
                      />
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      升降梯開門
                    </p>
                  </button>
                  <button className="group mx-3 my-1">
                    <div
                      className="flex h-[10vh] w-[10vh] items-center justify-center rounded-2xl bg-cyan-700 group-hover:bg-cyan-600 group-active:bg-cyan-700"
                      onClick={() => {
                        setLiftCnS(false);
                        liftControl("door", 0);
                      }}
                    >
                      <Image
                        src={closeDoorImg}
                        alt=""
                        className="h-[7vh] w-[7vh]"
                      />
                    </div>
                    <p className="text-gray-200 group-hover:text-white">
                      升降梯關門
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EngineeringMode;
