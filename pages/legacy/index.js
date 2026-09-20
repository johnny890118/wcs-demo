import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import Map from "@/components/map";
import MapPerfect from "@/components/mapPerfect";
import GoModal from "@/components/goModal";
import MapDetail from "@/components/mapDetail";
import CarInfo from "@/components/carInfo";
import TaskState from "@/components/taskState";
import Path from "@/components/path";

let obstacleRight = [];
let targetX = null;
let targetY = null;
let leftBoxFlag = false;
let rightBoxFlag = false;

export default function Home() {
  const [goModal, setGoModal] = useState(false);
  const [mapModal, setMapModal] = useState(false);
  const [carInfoModal, setCarInfoModal] = useState(false);
  const [currentTimeList, setCurrentTimeList] = useState([]);
  const [inBox, setInBox] = useState([]);
  const [outBox, setOutBox] = useState([]);
  const [path, setPath] = useState([]);
  const [ifCarIsFull, setIfCarIsFull] = useState(false);
  const [goInBox, setGoInBox] = useState(false);
  const [goOutBox, setGoOutBox] = useState(false);
  const [db, setDb] = useState(false);
  const [carWorking, setCarWorking] = useState("閒置中");
  const [taskWaitList, setTaskWaitList] = useState([]);
  const [taskExecute, setTaskExecute] = useState([]);

  // Map
  const allMoneyBackMeHome = [6, 8];
  const [position, setPosition] = useState(allMoneyBackMeHome);
  const [goalFinish, setGoalFinish] = useState(false);
  const [waitAreaGoods, setWaitAreaGoods] = useState(false);

  //9 有貨
  // const [deetu, setDeetu] = useState([
  //   { y: 0, x: 0, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 0, susin: 0, trigger: "" },
  //   { y: 2, x: 0, susin: 9, trigger: "" },
  //   { y: 3, x: 0, susin: 0, trigger: "" },
  //   { y: 4, x: 0, susin: 0, trigger: "" },
  //   { y: 5, x: 0, susin: 0, trigger: "" },
  //   { y: 6, x: 0, susin: 9, trigger: "" },
  //   { y: 7, x: 0, susin: 0, trigger: "" },
  //   { y: 8, x: 0, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 1, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 1, susin: 0, trigger: "" },
  //   { y: 2, x: 1, susin: 9, trigger: "" },
  //   { y: 3, x: 1, susin: 0, trigger: "" },
  //   { y: 4, x: 1, susin: 0, trigger: "" },
  //   { y: 5, x: 1, susin: 9, trigger: "" },
  //   { y: 6, x: 1, susin: 9, trigger: "" },
  //   { y: 7, x: 1, susin: 9, trigger: "" },
  //   { y: 8, x: 1, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 2, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 2, susin: 9, trigger: "" },
  //   { y: 2, x: 2, susin: 9, trigger: "" },
  //   { y: 3, x: 2, susin: 9, trigger: "" },
  //   { y: 4, x: 2, susin: 0, trigger: "" },
  //   { y: 5, x: 2, susin: 9, trigger: "" },
  //   { y: 6, x: 2, susin: 0, trigger: "" },
  //   { y: 7, x: 2, susin: 9, trigger: "" },
  //   { y: 8, x: 2, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 3, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 3, susin: 0, trigger: "" },
  //   { y: 2, x: 3, susin: 9, trigger: "" },
  //   { y: 3, x: 3, susin: 0, trigger: "" },
  //   { y: 4, x: 3, susin: 9, trigger: "" },
  //   { y: 5, x: 3, susin: 0, trigger: "" },
  //   { y: 6, x: 3, susin: 0, trigger: "" },
  //   { y: 7, x: 3, susin: 0, trigger: "" },
  //   { y: 8, x: 3, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 4, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 4, susin: 9, trigger: "" },
  //   { y: 2, x: 4, susin: 9, trigger: "" },
  //   { y: 3, x: 4, susin: 9, trigger: "" },
  //   { y: 4, x: 4, susin: 0, trigger: "" },
  //   { y: 5, x: 4, susin: 0, trigger: "" },
  //   { y: 6, x: 4, susin: 0, trigger: "" },
  //   { y: 7, x: 4, susin: 0, trigger: "" },
  //   { y: 8, x: 4, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 5, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 5, susin: 9, trigger: "" },
  //   { y: 2, x: 5, susin: 0, trigger: "" },
  //   { y: 3, x: 5, susin: 9, trigger: "" },
  //   { y: 4, x: 5, susin: 0, trigger: "" },
  //   { y: 5, x: 5, susin: 0, trigger: "" },
  //   { y: 6, x: 5, susin: 0, trigger: "" },
  //   { y: 7, x: 5, susin: 0, trigger: "" },
  //   { y: 8, x: 5, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 6, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 6, susin: 2, trigger: "gandoor" },
  //   { y: 2, x: 6, susin: 2, trigger: "gandoor" },
  //   { y: 3, x: 6, susin: 2, trigger: "gandoor" },
  //   { y: 4, x: 6, susin: 2, trigger: "gandoor" },
  //   { y: 5, x: 6, susin: 2, trigger: "gandoor" },
  //   { y: 6, x: 6, susin: 2, trigger: "gandoor" },
  //   { y: 7, x: 6, susin: 2, trigger: "gandoor" },
  //   { y: 8, x: 6, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 7, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 7, susin: 9, trigger: "" },
  //   { y: 2, x: 7, susin: 0, trigger: "" },
  //   { y: 3, x: 7, susin: 9, trigger: "" },
  //   { y: 4, x: 7, susin: 0, trigger: "" },
  //   { y: 5, x: 7, susin: 0, trigger: "" },
  //   { y: 6, x: 7, susin: 9, trigger: "" },
  //   { y: 7, x: 7, susin: 0, trigger: "" },
  //   { y: 8, x: 7, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 8, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 8, susin: 9, trigger: "" },
  //   { y: 2, x: 8, susin: 9, trigger: "" },
  //   { y: 3, x: 8, susin: 9, trigger: "" },
  //   { y: 4, x: 8, susin: 0, trigger: "" },
  //   { y: 5, x: 8, susin: 0, trigger: "" },
  //   { y: 6, x: 8, susin: 9, trigger: "" },
  //   { y: 7, x: 8, susin: 0, trigger: "" },
  //   { y: 8, x: 8, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 9, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 9, susin: 0, trigger: "" },
  //   { y: 2, x: 9, susin: 9, trigger: "" },
  //   { y: 3, x: 9, susin: 0, trigger: "" },
  //   { y: 4, x: 9, susin: 0, trigger: "" },
  //   { y: 5, x: 9, susin: 9, trigger: "" },
  //   { y: 6, x: 9, susin: 9, trigger: "" },
  //   { y: 7, x: 9, susin: 9, trigger: "" },
  //   { y: 8, x: 9, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 10, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 10, susin: 9, trigger: "" },
  //   { y: 2, x: 10, susin: 9, trigger: "" },
  //   { y: 3, x: 10, susin: 9, trigger: "" },
  //   { y: 4, x: 10, susin: 0, trigger: "" },
  //   { y: 5, x: 10, susin: 0, trigger: "" },
  //   { y: 6, x: 10, susin: 9, trigger: "" },
  //   { y: 7, x: 10, susin: 0, trigger: "" },
  //   { y: 8, x: 10, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 11, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 11, susin: 0, trigger: "" },
  //   { y: 2, x: 11, susin: 9, trigger: "" },
  //   { y: 3, x: 11, susin: 0, trigger: "" },
  //   { y: 4, x: 11, susin: 0, trigger: "" },
  //   { y: 5, x: 11, susin: 0, trigger: "" },
  //   { y: 6, x: 11, susin: 9, trigger: "" },
  //   { y: 7, x: 11, susin: 0, trigger: "" },
  //   { y: 8, x: 11, susin: 1, trigger: "diguan" },
  //   { y: 0, x: 12, susin: 1, trigger: "diguan" },
  //   { y: 1, x: 12, susin: 0, trigger: "" },
  //   { y: 2, x: 12, susin: 9, trigger: "" },
  //   { y: 3, x: 12, susin: 0, trigger: "" },
  //   { y: 4, x: 12, susin: 0, trigger: "" },
  //   { y: 5, x: 12, susin: 0, trigger: "" },
  //   { y: 6, x: 12, susin: 9, trigger: "" },
  //   { y: 7, x: 12, susin: 0, trigger: "" },
  //   { y: 8, x: 12, susin: 1, trigger: "diguan" },
  // ]);
  const [deetu, setDeetu] = useState([
    { y: 0, x: 0, susin: 1, trigger: "diguan" },
    { y: 1, x: 0, susin: 0, trigger: "" },
    { y: 2, x: 0, susin: 0, trigger: "" },
    { y: 3, x: 0, susin: 0, trigger: "" },
    { y: 4, x: 0, susin: 0, trigger: "" },
    { y: 5, x: 0, susin: 0, trigger: "" },
    { y: 6, x: 0, susin: 0, trigger: "" },
    { y: 7, x: 0, susin: 0, trigger: "" },
    { y: 8, x: 0, susin: 1, trigger: "diguan" },
    { y: 0, x: 1, susin: 1, trigger: "diguan" },
    { y: 1, x: 1, susin: 0, trigger: "" },
    { y: 2, x: 1, susin: 0, trigger: "" },
    { y: 3, x: 1, susin: 0, trigger: "" },
    { y: 4, x: 1, susin: 0, trigger: "" },
    { y: 5, x: 1, susin: 0, trigger: "" },
    { y: 6, x: 1, susin: 0, trigger: "" },
    { y: 7, x: 1, susin: 0, trigger: "" },
    { y: 8, x: 1, susin: 1, trigger: "diguan" },
    { y: 0, x: 2, susin: 1, trigger: "diguan" },
    { y: 1, x: 2, susin: 0, trigger: "" },
    { y: 2, x: 2, susin: 0, trigger: "" },
    { y: 3, x: 2, susin: 0, trigger: "" },
    { y: 4, x: 2, susin: 0, trigger: "" },
    { y: 5, x: 2, susin: 0, trigger: "" },
    { y: 6, x: 2, susin: 0, trigger: "" },
    { y: 7, x: 2, susin: 0, trigger: "" },
    { y: 8, x: 2, susin: 1, trigger: "diguan" },
    { y: 0, x: 3, susin: 1, trigger: "diguan" },
    { y: 1, x: 3, susin: 0, trigger: "" },
    { y: 2, x: 3, susin: 0, trigger: "" },
    { y: 3, x: 3, susin: 0, trigger: "" },
    { y: 4, x: 3, susin: 0, trigger: "" },
    { y: 5, x: 3, susin: 0, trigger: "" },
    { y: 6, x: 3, susin: 0, trigger: "" },
    { y: 7, x: 3, susin: 0, trigger: "" },
    { y: 8, x: 3, susin: 1, trigger: "diguan" },
    { y: 0, x: 4, susin: 1, trigger: "diguan" },
    { y: 1, x: 4, susin: 0, trigger: "" },
    { y: 2, x: 4, susin: 0, trigger: "" },
    { y: 3, x: 4, susin: 0, trigger: "" },
    { y: 4, x: 4, susin: 0, trigger: "" },
    { y: 5, x: 4, susin: 0, trigger: "" },
    { y: 6, x: 4, susin: 0, trigger: "" },
    { y: 7, x: 4, susin: 0, trigger: "" },
    { y: 8, x: 4, susin: 1, trigger: "diguan" },
    { y: 0, x: 5, susin: 1, trigger: "diguan" },
    { y: 1, x: 5, susin: 0, trigger: "" },
    { y: 2, x: 5, susin: 0, trigger: "" },
    { y: 3, x: 5, susin: 0, trigger: "" },
    { y: 4, x: 5, susin: 0, trigger: "" },
    { y: 5, x: 5, susin: 0, trigger: "" },
    { y: 6, x: 5, susin: 0, trigger: "" },
    { y: 7, x: 5, susin: 0, trigger: "" },
    { y: 8, x: 5, susin: 1, trigger: "diguan" },
    { y: 0, x: 6, susin: 1, trigger: "diguan" },
    { y: 1, x: 6, susin: 2, trigger: "gandoor" },
    { y: 2, x: 6, susin: 2, trigger: "gandoor" },
    { y: 3, x: 6, susin: 2, trigger: "gandoor" },
    { y: 4, x: 6, susin: 2, trigger: "gandoor" },
    { y: 5, x: 6, susin: 2, trigger: "gandoor" },
    { y: 6, x: 6, susin: 2, trigger: "gandoor" },
    { y: 7, x: 6, susin: 2, trigger: "gandoor" },
    { y: 8, x: 6, susin: 1, trigger: "diguan" },
    { y: 0, x: 7, susin: 1, trigger: "diguan" },
    { y: 1, x: 7, susin: 0, trigger: "" },
    { y: 2, x: 7, susin: 0, trigger: "" },
    { y: 3, x: 7, susin: 0, trigger: "" },
    { y: 4, x: 7, susin: 0, trigger: "" },
    { y: 5, x: 7, susin: 0, trigger: "" },
    { y: 6, x: 7, susin: 0, trigger: "" },
    { y: 7, x: 7, susin: 0, trigger: "" },
    { y: 8, x: 7, susin: 1, trigger: "diguan" },
    { y: 0, x: 8, susin: 1, trigger: "diguan" },
    { y: 1, x: 8, susin: 0, trigger: "" },
    { y: 2, x: 8, susin: 0, trigger: "" },
    { y: 3, x: 8, susin: 0, trigger: "" },
    { y: 4, x: 8, susin: 0, trigger: "" },
    { y: 5, x: 8, susin: 0, trigger: "" },
    { y: 6, x: 8, susin: 0, trigger: "" },
    { y: 7, x: 8, susin: 0, trigger: "" },
    { y: 8, x: 8, susin: 1, trigger: "diguan" },
    { y: 0, x: 9, susin: 1, trigger: "diguan" },
    { y: 1, x: 9, susin: 0, trigger: "" },
    { y: 2, x: 9, susin: 0, trigger: "" },
    { y: 3, x: 9, susin: 0, trigger: "" },
    { y: 4, x: 9, susin: 0, trigger: "" },
    { y: 5, x: 9, susin: 0, trigger: "" },
    { y: 6, x: 9, susin: 0, trigger: "" },
    { y: 7, x: 9, susin: 0, trigger: "" },
    { y: 8, x: 9, susin: 1, trigger: "diguan" },
    { y: 0, x: 10, susin: 1, trigger: "diguan" },
    { y: 1, x: 10, susin: 0, trigger: "" },
    { y: 2, x: 10, susin: 0, trigger: "" },
    { y: 3, x: 10, susin: 0, trigger: "" },
    { y: 4, x: 10, susin: 0, trigger: "" },
    { y: 5, x: 10, susin: 0, trigger: "" },
    { y: 6, x: 10, susin: 0, trigger: "" },
    { y: 7, x: 10, susin: 0, trigger: "" },
    { y: 8, x: 10, susin: 1, trigger: "diguan" },
    { y: 0, x: 11, susin: 1, trigger: "diguan" },
    { y: 1, x: 11, susin: 0, trigger: "" },
    { y: 2, x: 11, susin: 0, trigger: "" },
    { y: 3, x: 11, susin: 0, trigger: "" },
    { y: 4, x: 11, susin: 0, trigger: "" },
    { y: 5, x: 11, susin: 0, trigger: "" },
    { y: 6, x: 11, susin: 0, trigger: "" },
    { y: 7, x: 11, susin: 0, trigger: "" },
    { y: 8, x: 11, susin: 1, trigger: "diguan" },
    { y: 0, x: 12, susin: 1, trigger: "diguan" },
    { y: 1, x: 12, susin: 0, trigger: "" },
    { y: 2, x: 12, susin: 0, trigger: "" },
    { y: 3, x: 12, susin: 0, trigger: "" },
    { y: 4, x: 12, susin: 0, trigger: "" },
    { y: 5, x: 12, susin: 0, trigger: "" },
    { y: 6, x: 12, susin: 0, trigger: "" },
    { y: 7, x: 12, susin: 0, trigger: "" },
    { y: 8, x: 12, susin: 1, trigger: "diguan" },
  ]);

  // console.log("taskWaitList", taskWaitList);

  const [taskEffect, setTaskEffect] = useState(false);

  // console.log("path", path[path.length - 1]);

  useEffect(() => {
    if (taskWaitList.length > 0) {
      if (taskWaitList[0].workType === "入庫" && !taskEffect) {
        setIfCarIsFull(true);
        setGoInBox(true);
        setGoalFinish(false);
        setCarWorking("入庫任務中");
        setTaskEffect(true);
        console.log("入庫始大豆");
      } else if (taskWaitList[0].workType === "出庫" && !taskEffect) {
        setIfCarIsFull(false);
        setGoOutBox(true);
        setGoalFinish(false);
        setCarWorking("出庫任務中");
        setTaskEffect(true);
        console.log("出庫始大豆");
      }
    }
  }, [taskWaitList, taskEffect]);

  console.log("taskWaitList", taskWaitList);

  // 有貨執行自動入庫
  useEffect(() => {
    if (ifCarIsFull && goInBox && !goalFinish && taskEffect) {
      const airTriggerIndex = deetu.findIndex((item) => item.trigger === "");
      if (airTriggerIndex !== -1) {
        const end = [deetu[airTriggerIndex].x, deetu[airTriggerIndex].y];
        Path({
          deetu: deetu,
          start: [6, 8],
          end: end,
          setPath: setPath,
          ifCarIsFull: ifCarIsFull,
        });
        setTaskExecute([
          {
            workType: taskWaitList[0].workType,
            carID: 1,
            time: getCurrentTime(),
            boxID: taskWaitList[0].boxID,
          },
        ]);
        setTaskWaitList(taskWaitList.slice(1));
        console.log("自動入庫");
      } else {
        alert("已無剩餘儲格");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ifCarIsFull, deetu, goInBox, goalFinish, taskEffect]);

  // 抵達入庫儲格卸貨
  useEffect(() => {
    if (
      goalFinish &&
      JSON.stringify(path[path.length - 1]) !== JSON.stringify([6, 8]) &&
      goInBox &&
      ifCarIsFull &&
      taskEffect
    ) {
      const airTriggerIndex = deetu.findIndex(
        (item) =>
          item.x === path[path.length - 1][0] &&
          item.y === path[path.length - 1][1],
      );
      if (airTriggerIndex !== -1) {
        const updatedDeetu = [...deetu];
        updatedDeetu[airTriggerIndex].trigger = inBox[0];
        updatedDeetu[airTriggerIndex].susin = 9;
        setDeetu(updatedDeetu);
        setIfCarIsFull(false);
        setGoalFinish(false);
        console.log("deetu[airTriggerIndex]", deetu[airTriggerIndex]);
        console.log("儲格卸貨");
      }
    }
  }, [path, goalFinish, deetu, inBox, goInBox, ifCarIsFull, taskEffect]);

  // 入庫回程
  useEffect(() => {
    if (
      !ifCarIsFull &&
      JSON.stringify(position) !== JSON.stringify([6, 8]) &&
      JSON.stringify(position) === JSON.stringify(path[path.length - 1]) &&
      goInBox &&
      !goalFinish &&
      taskEffect
    ) {
      console.log("卸貨回程");
      Path({
        deetu: deetu,
        start: position,
        end: [6, 8],
        setPath: setPath,
        ifCarIsFull: ifCarIsFull,
      });
    }
  }, [deetu, ifCarIsFull, position, path, goInBox, goalFinish, taskEffect]);

  // 入庫回程抵達
  useEffect(() => {
    if (
      goInBox &&
      JSON.stringify([6, 8]) === JSON.stringify(path[path.length - 1]) &&
      JSON.stringify(path[path.length - 1] === JSON.stringify(position)) &&
      goalFinish &&
      taskEffect
    ) {
      setGoInBox(false);
      setCarWorking("閒置中");
      console.log("回程抵達");
      setTaskEffect(false);
      setTaskExecute([]);
      setPath([]);
      setInBox(inBox.slice(1));
    }
  }, [goInBox, position, path, goalFinish, taskEffect]);

  // // 輸入貨號出庫
  // useEffect(() => {
  //   if (outBox !== "") {
  //     // deetu.map((item, index) => {
  //     //   if (item.trigger === outBox) {
  //     //     //獲得行
  //     //     //取得目標trigger位置
  //     //     targetX = item.x;
  //     //     targetY = item.y;
  //     //   }
  //     // });
  //     // deetu.map((item, index) => {
  //     //   if (item.x === targetX) {
  //     //     if (item.y < targetY) {
  //     //       if (item.trigger !== "" && item.trigger !== "diguan") {
  //     //         // 有貨物擋在左邊
  //     //         leftBoxFlag = true;
  //     //       }
  //     //     } else if (item.y > targetY) {
  //     //       if (item.trigger !== "" && item.trigger !== "diguan") {
  //     //         // 有貨物在右邊
  //     //         rightBoxFlag = true;
  //     //         console.log("item -- >", item.y);
  //     //         // obstacleRight.push(item.y);
  //     //         obstacleRight = [...obstacleRight, item.y];
  //     //         console.log("我在右邊", obstacleRight);
  //     //       }
  //     //     }
  //     //   }
  //     // });
  //     // if (rightBoxFlag && leftBoxFlag && !db) {
  //     //   console.log("調撥開始");
  //     //   setGoalFinish(false);
  //     //   setDb(true);
  //     //   setIfCarIsFull(false);

  //     //   // setObstacleRight(obstacleRight.reverse());
  //     //   console.log("調撥移動");
  //     //   Path({
  //     //     deetu: deetu,
  //     //     start: position,
  //     //     end: [targetX, obstacleRight[0]],
  //     //     setPath: setPath,
  //     //     ifCarIsFull: ifCarIsFull,
  //     //   });
  //     // } else if (!leftBoxFlag || !rightBoxFlag) {
  //     //   setGoOutBox(true);
  //     //   setGoalFinish(false);
  //     //   setCarWorking("任務中");
  //     // }
  //     setGoOutBox(true);
  //     setGoalFinish(false);
  //     setCarWorking("任務中");
  //   }
  // }, [outBox]);
  // // }, [outBox, deetu, ifCarIsFull, db]);

  // useEffect(() => {
  //   if (
  //     db &&
  //     goalFinish &&
  //     !ifCarIsFull &&
  //     JSON.stringify(position) === JSON.stringify([0, 3])
  //   ) {
  //     const fullTriggerIndex = deetu.findIndex(
  //       (item) =>
  //         item.x === path[path.length - 1]?.[0] &&
  //         item.y === path[path.length - 1]?.[1],
  //     );
  //     if (fullTriggerIndex !== -1) {
  //       const updatedDeetu = [...deetu];
  //       updatedDeetu[fullTriggerIndex].trigger = "";
  //       updatedDeetu[fullTriggerIndex].susin = 0;

  //       setDeetu(updatedDeetu);
  //       setIfCarIsFull(true);
  //       setGoalFinish(false);
  //       console.log("deetu[airTriggerIndex]", deetu[fullTriggerIndex]);
  //       console.log("調撥出庫");
  //     }
  //   }
  // }, [db, deetu, goalFinish, path, ifCarIsFull]);

  // // DBTDBA
  // useEffect(() => {
  //   console.log(db, goalFinish, ifCarIsFull, obstacleRight, position);
  //   if (
  //     db &&
  //     !goalFinish &&
  //     !ifCarIsFull &&
  //     obstacleRight.length > 0 &&
  //     position[1] === obstacleRight[0]
  //   ) {
  //     console.log("DBTDBA");
  //     const dtrv = [...deetu.reverse()];
  //     const airTriggerIndex = dtrv.findIndex((item) => item.trigger === "");
  //     if (airTriggerIndex !== -1) {
  //       const end = [dtrv[airTriggerIndex].x, dtrv[airTriggerIndex].y];
  //       Path({
  //         deetu: deetu,
  //         start: position,
  //         end: end,
  //         setPath: setPath,
  //         ifCarIsFull: ifCarIsFull,
  //       });
  //       obstacleRight = [];
  //     }
  //   }
  // }, [db, goalFinish, ifCarIsFull, deetu, path]);

  // 派車出庫
  useEffect(() => {
    if (goOutBox && !ifCarIsFull && !goalFinish && taskEffect) {
      console.log("這裡一定進");
      deetu.map((item) => {
        console.log("item.trigger", item.trigger, "outBox", outBox);
        if (item.trigger === outBox[0]) {
          console.log("這裡不一定進");
          Path({
            deetu: deetu,
            start: [6, 8],
            end: [item.x, item.y],
            setPath: setPath,
            ifCarIsFull: ifCarIsFull,
          });
          setTaskExecute([
            {
              workType: taskWaitList[0].workType,
              carID: 1,
              time: getCurrentTime(),
              boxID: taskWaitList[0].boxID,
            },
          ]);
          setTaskWaitList(taskWaitList.slice(1));
          console.log("派車出庫");
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deetu, ifCarIsFull, goOutBox, goalFinish, taskEffect]);

  // 取貨出庫
  useEffect(() => {
    if (
      goalFinish &&
      goOutBox &&
      JSON.stringify(path[path.length - 1]) === JSON.stringify(position) &&
      !ifCarIsFull &&
      taskEffect
    ) {
      const fullTriggerIndex = deetu.findIndex(
        (item) =>
          item.x === path[path.length - 1][0] &&
          item.y === path[path.length - 1][1],
      );
      if (fullTriggerIndex !== -1) {
        const updatedDeetu = [...deetu];
        updatedDeetu[fullTriggerIndex].trigger = "";
        updatedDeetu[fullTriggerIndex].susin = 0;
        setDeetu(updatedDeetu);
        setIfCarIsFull(true);
        setGoalFinish(false);
        // console.log("deetu[airTriggerIndex]", deetu[fullTriggerIndex]);
        console.log("取貨出庫");
      }
    }
  }, [goalFinish, goOutBox, path, deetu, position, ifCarIsFull, taskEffect]);

  // 出庫回程
  useEffect(() => {
    if (
      ifCarIsFull &&
      JSON.stringify(position) !== JSON.stringify([6, 8]) &&
      JSON.stringify(position) == JSON.stringify(path[path.length - 1]) &&
      goOutBox &&
      !goalFinish &&
      taskEffect
    ) {
      console.log("載貨回程", position);

      Path({
        deetu: deetu,
        start: position,
        end: [6, 8],
        setPath: setPath,
        ifCarIsFull: ifCarIsFull,
      });
    }
  }, [deetu, ifCarIsFull, position, path, goOutBox, goalFinish, taskEffect]);

  // 出庫回程抵達
  useEffect(() => {
    if (
      goOutBox &&
      JSON.stringify([6, 8]) === JSON.stringify(path[path.length - 1]) &&
      JSON.stringify(path[path.length - 1] === JSON.stringify(position)) &&
      ifCarIsFull &&
      goalFinish &&
      taskEffect
    ) {
      setGoOutBox(false);
      setIfCarIsFull(false);
      setCarWorking("閒置中");
      setTaskEffect(false);
      console.log("回程抵達");
      setTaskExecute([]);
      setPath([]);
      setOutBox(outBox.slice(1));
    }
  }, [goOutBox, position, path, ifCarIsFull, goalFinish, taskEffect]);

  const getCurrentTime = () => {
    const currentTime = new Date();
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <Layout>
      <div className="flex h-full w-full flex-col items-center">
        <div className="my-[1vh] flex h-[65vh] w-[96%] min-w-[310px] flex-col justify-between rounded-2xl bg-gray-700 sm:mx-[3vw] sm:my-[3vh]">
          <div className="h-[4vh] text-white"></div>
          <div className="h-[50vh] w-full">
            {/* <div className="h-[50vh]"> */}
            {/* <Map path={path} /> */}
            <MapPerfect
              path={path}
              position={position}
              setPosition={setPosition}
              deetu={deetu}
              ifCarIsFull={ifCarIsFull}
              goalFinish={goalFinish}
              setGoalFinish={setGoalFinish}
              setCarInfoModal={setCarInfoModal}
              waitAreaGoods={waitAreaGoods}
              setWaitAreaGoods={setWaitAreaGoods}
              allMoneyBackMeHome={allMoneyBackMeHome}
            />
            {/* <Map
              path={path}
              position={position}
              setPosition={setPosition}
              deetu={deetu}
              ifCarIsFull={ifCarIsFull}
              goalFinish={goalFinish}
              setGoalFinish={setGoalFinish}
              setCarInfoModal={setCarInfoModal}
              waitAreaGoods={waitAreaGoods}
              setWaitAreaGoods={setWaitAreaGoods}
              allMoneyBackMeHome={allMoneyBackMeHome}
            /> */}
          </div>

          <div className="flex items-center justify-between">
            <button
              className="m-4 h-11 w-[6rem] rounded-lg bg-pink-700 text-base font-semibold text-gray-200 hover:bg-pink-600 hover:text-white"
              onClick={() => setMapModal(true)}
            >
              地圖細節
            </button>
            {/* <button
              className="m-3 rounded-lg bg-blue-700 px-4 py-3 text-lg font-semibold text-gray-200 hover:bg-blue-600 hover:text-white"
              onClick={() => setCarInfoModal(true)}
            >
              車體資訊
            </button> */}
            <button
              className="m-4 h-11 w-[6rem] animate-bounce rounded-lg bg-violet-700 text-base font-semibold text-gray-200 hover:bg-violet-600 hover:text-white"
              onClick={() => {
                setGoModal(true);
              }}
            >
              任務派車
            </button>
            <MapDetail
              openModal={mapModal}
              closeModal={() => setMapModal(false)}
              deetu={deetu}
            />
            <GoModal
              openModal={goModal}
              setOutBox={setOutBox}
              setInBox={setInBox}
              inBoxTrigger={() => inBoxTrigger(inBox)}
              closeModal={() => setGoModal(false)}
              setWaitAreaGoods={setWaitAreaGoods}
              currentTimeList={currentTimeList}
              setCurrentTimeList={setCurrentTimeList}
              getCurrentTime={getCurrentTime}
              taskWaitList={taskWaitList}
              setTaskWaitList={setTaskWaitList}
              inBox={inBox}
              outBox={outBox}
            />
            <CarInfo
              openModal={carInfoModal}
              closeModal={() => setCarInfoModal(false)}
              position={position}
              carWorking={carWorking}
            />
          </div>
        </div>
        <TaskState taskExecute={taskExecute} taskWaitList={taskWaitList} />
      </div>
    </Layout>
  );
}
