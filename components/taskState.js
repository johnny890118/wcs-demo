import React, { useState, useRef } from "react";

const TaskState = ({ taskExecute, taskWaitList }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredBoxID, setHoveredBoxID] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const boxRef = useRef(null);

  const handleHover = (e, item) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setIsHovered(true);
    setHoveredBoxID(item.boxID);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoveredBoxID(null);
  };

  return (
    <div className="flex h-[50vh] w-[96%] flex-wrap justify-center sm:h-[20vh] sm:flex-row md:justify-between lg:justify-between">
      <div className="mb-[3%] flex h-full w-full min-w-[310px] flex-col items-center justify-start overflow-auto rounded-2xl bg-gray-700 text-white sm:flex-row lg:mx-0 lg:mb-[2vh] lg:mt-0 lg:w-[48%] lg:min-w-0">
        <div className="sticky left-0 bg-gray-700 p-2">
          <p className="textCol z-10 box-border min-h-[5vh] min-w-[23vh] whitespace-nowrap rounded-xl bg-gray-900 px-3 text-center text-base font-bold leading-[5vh] tracking-[0.3em] text-gray-200 sm:leading-[3vh]">
            任務等待區
          </p>
        </div>
        {taskWaitList.length > 0 ? (
          taskWaitList.map((item, index) => (
            <div
              className={`huahuahua mx-2 my-2 flex min-h-[17vh] min-w-[23vh] items-center justify-center rounded-2xl bg-gray-800 sm:my-0${
                isHovered ? "hoverable active" : "hoverable"
              }`}
              onMouseOver={(e) => handleHover(e, item)}
              onMouseLeave={handleMouseLeave}
              key={index}
            >
              <div className="flex min-h-[17vh] flex-col items-start justify-evenly">
                <p className="font-bold text-gray-200">
                  工作類型：{item.workType}
                </p>
                <p className="font-bold text-gray-200">收到時間：{item.time}</p>
                <p className="max-w-[18vh] truncate font-bold text-gray-200">
                  貨品編號：{item.boxID}
                </p>
                <p className="font-bold text-gray-200">
                  工作碼頭：{item.dockID}
                </p>
                {isHovered && (
                  <div
                    id="popup"
                    style={{ left: position.x, top: position.y }}
                    className="task-info absolute rounded-[10px] bg-gray-900 p-2"
                    ref={boxRef}
                  >
                    貨品編號：{hoveredBoxID}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          // 無任務時狀態
          <div className="flex h-full w-[100%] items-center justify-center">
            <div className="loading">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        )}
      </div>
      <div className="mb-[3%] flex h-full w-full min-w-[310px] flex-col items-center justify-start overflow-auto rounded-2xl bg-gray-700 text-white sm:flex-row lg:mx-0 lg:mb-[2vh] lg:mt-0 lg:w-[48%] lg:min-w-0">
        <div className="sticky left-0 bg-gray-700 p-2">
          <p className="textCol z-10 box-border min-h-[5vh] min-w-[23vh] whitespace-nowrap rounded-xl bg-gray-900 px-3 text-center text-base font-bold leading-[5vh] tracking-[0.3em] text-gray-200 sm:leading-[3vh]">
            任務執行區
          </p>
        </div>
        {taskExecute.length > 0 ? (
          taskExecute.map((item, index) => (
            <div
              className={`huahuahua mx-2 my-2 flex min-h-[17vh] min-w-[23vh] items-center justify-center rounded-2xl bg-gray-800 sm:my-0${
                isHovered ? "hoverable active" : "hoverable"
              }`}
              onMouseOver={(e) => handleHover(e, item)}
              onMouseLeave={handleMouseLeave}
              key={index}
            >
              <div className="flex min-h-[17vh] flex-col items-start justify-evenly">
                <p className="font-bold text-gray-200">
                  工作類型：{item.workType}
                </p>
                <p className="font-bold text-gray-200">開始時間：{item.time}</p>
                <p className="font-bold text-gray-200">
                  車輛編號：{item.carID}
                </p>
                <p className="max-w-[18vh] truncate font-bold text-gray-200">
                  貨品編號：{item.boxID}
                </p>
                {isHovered && (
                  <div
                    id="popup"
                    style={{ left: position.x, top: position.y }}
                    className="task-info absolute rounded-[10px] bg-gray-900 p-2"
                    ref={boxRef}
                  >
                    貨品編號：{hoveredBoxID}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          // 無任務時狀態
          <div className="flex h-full w-[100%] items-center justify-center">
            <div className="loading">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskState;
