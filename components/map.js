import React, { useState, useEffect } from "react";
import Image from "next/image";
// import ImgAGV from "../styles/agvModal.png";
import ImgBox from "../styles/box.svg";

const Map = ({
  path,
  setPosition,
  position,
  deetu,
  ifCarIsFull,
  goalFinish,
  setGoalFinish,
  setCarInfoModal,
  waitAreaGoods,
  setWaitAreaGoods,
  allMoneyBackMeHome,
}) => {
  const [pathNum, setPathNum] = useState(0);
  const [showDiv, setShowDiv] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentSVG, setCurrentSVG] = useState({ x: 0, y: 0, boxID: "" });

  const handleMouseEnter = (event) => {
    // 獲取滑鼠位置
    // const { clientX, clientY } = event;
    setMousePosition({ x: event.clientX, y: event.clientY });

    var virX = event.target.x.animVal.value;
    var virY = event.target.y.animVal.value;
    var numX = calculateVirtualX(virX);
    var numY = calculateVirtualY(virY);
    deetu.map((value, index) => {
      if (value.x === numY && value.y === numX && value.susin === 9) {
        console.log("hi");
        setCurrentSVG({ boxID: value.trigger, x: value.x, y: value.y });
        setShowDiv(true);
      }
    });

    // console.log(currentSVG);
    // const rects = document.querySelectorAll("rect");
    // rects;
    // deetu.map((value, index) => {// });
  };
  const handleMouseLeave = () => {
    setShowDiv(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (waitAreaGoods === true) {
        setWaitAreaGoods(false);
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [waitAreaGoods]);
  const oldPath = [];
  useEffect(() => {
    checkMapStatus(deetu);

    // console.log("[MAP]:path:", path);
    const interval = setInterval(() => {
      if (pathNum === path.length && pathNum !== 0) {
        //完成任務
        console.log("任務完成");

        setGoalFinish(true);

        setPathNum(0);
        if (
          ifCarIsFull &&
          JSON.stringify(position) === JSON.stringify(allMoneyBackMeHome)
        ) {
          //出庫回程完成
          setWaitAreaGoods(true); //設定等待區狀態
        }
      } else {
        if (path.length > 0 && pathNum < path.length && !goalFinish) {
          setWaitAreaGoods(false); //設定等待區狀態
          setPathNum(pathNum + 1);
          setPosition(path[pathNum]);
          setGoalFinish(false);
        }
      }
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, [
    position,
    path,
    pathNum,
    goalFinish,
    setPosition,
    ifCarIsFull,
    setGoalFinish,
    deetu,
    waitAreaGoods,
  ]);
  const calculateActCoordiateX = (x) => {
    var act_positionX = 0;
    if (0 <= x < 9) {
      act_positionX = x * 140;
      return act_positionX;
    } else {
      return act_positionX;
    }
  };
  const calculateActCoordiateY = (y) => {
    var act_positionY = 0;
    if (0 <= y < 13) {
      act_positionY = y * 80;
      return act_positionY;
    } else {
      return act_positionY;
    }
  };
  const calculateVirtualX = (x) => {
    var vir_positionX = 0;
    vir_positionX = x / 140;
    return vir_positionX;
  };
  const calculateVirtualY = (y) => {
    var vir_positionY = 0;
    vir_positionY = y / 80;
    return vir_positionY;
  };
  const checkMapStatus = (deetu) => {
    const rects = document.querySelectorAll("rect");

    // console.log("deetu: ", deetu);
    deetu.map((value, index) => {
      if (value.susin === 9) {
        const mapPositionX = calculateActCoordiateX(value.y);
        const mapPositionY = calculateActCoordiateY(value.x);

        rects.forEach((rect) => {
          if (
            parseInt(rect.getAttribute("x")) === mapPositionX &&
            parseInt(rect.getAttribute("y")) === mapPositionY
          ) {
            rect.setAttribute("fill", "#65B741");
            rect.setAttribute("stroke", "#E3651D");
            rect.setAttribute("stroke-width", "6");
            rect.setAttribute("rx", "15");
            rect.setAttribute("style", "transition: all .7s  ease-in-out");
          }
        });
      }

      //TODO: 新增出庫後狀態
      else if (value.susin === 0) {
        const mapPositionX = calculateActCoordiateX(value.y);
        const mapPositionY = calculateActCoordiateY(value.x);
        rects.forEach((rect) => {
          if (
            parseInt(rect.getAttribute("x")) === mapPositionX &&
            parseInt(rect.getAttribute("y")) === mapPositionY
          ) {
            rect.setAttribute("fill", "#1D4ED8");
            rect.setAttribute("stroke", "#000000");
            rect.setAttribute("stroke-width", "1");
            rect.setAttribute("rx", "0");
            rect.setAttribute("style", "transition: all .7s  ease-in-out");
          }
        });
      }
    });
  };

  //更新貨物於地圖上
  // const updateGoodsMap = () => {
  //   deetu.map((items) => {
  //     if (items.susin === 9) {
  //       setGoodsPosition([
  //         ...oldValue,
  //         {
  //           x: calculateActCoordiateX(items.x),
  //           y: calculateActCoordiateY(items.y),
  //         },
  //       ]);
  //     }
  //   });
  // };

  return (
    <div className="map-container">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        // width="1381px"
        // height="1022px"
        width="100%"
        height="100%"
        viewBox="-0.5 -0.5 1381 1022"
      >
        <defs />
        <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <g>
            <rect
              x="0"
              y="80"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="114"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,1
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="160"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="194"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,2
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="240"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="274"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,3
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="320"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="354"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,4
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="400"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="434"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,5
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="480"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="514"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,6
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="560"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="594"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,7
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="640"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="674"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,8
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="720"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="754"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,9
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="800"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="834"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,10
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="880"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="914"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,11
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="0"
              y="960"
              width="120"
              height="60"
              fill="#6d28b9"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="60"
                  y="994"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  0,12
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              // className="transition duration-700 ease-in-out "
              x="140"
              y="0"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              // style
              // fill={`${deetu[1].susin === 9 ? "#65B741" : "#1d4ed8"}`}
              // stroke={`${deetu[1].susin === 9 ? "#E3651D" : "#000000"}`}
              // strokeWidth={`${deetu[1].susin === 9 ? "6" : "1"}`}
              // rx={`${deetu[1].susin === 9 ? 15 : ""}`}
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="201"
                  y="34"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,0
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="80"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="114"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,1
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="160"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="194"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,2
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="240"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="274"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,3
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="320"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="354"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,4
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="400"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="434"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,5
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="480"
              width="120"
              height="60"
              fill="#be185d"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="514"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,6
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="560"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="594"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,7
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="640"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="674"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,8
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="720"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="754"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,9
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="800"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="834"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,10
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="140"
              y="880"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="200"
                  y="914"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  1,11
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="280"
              y="0"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="340"
                  y="34"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  2,0
                </text>
              </switch>
            </g>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="280"
              y="80"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="340"
                  y="114"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  2,1
                </text>
              </switch>
            </g>
          </g>
          <rect
            x="280"
            y="160"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="194"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,2
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="240"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="274"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,3
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="320"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="354"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,4
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="400"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="434"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,5
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="480"
            width="120"
            height="60"
            fill="#be185d"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="514"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,6
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="560"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="594"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,7
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="640"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="674"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,8
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="720"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="754"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,9
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="800"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="834"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,10
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="880"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="340"
                y="914"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,11
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="0"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="34"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,0
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="80"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="114"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,1
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="160"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="194"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,2
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="240"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="274"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,3
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="320"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="354"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,4
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="400"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="434"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,5
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="480"
            width="120"
            height="60"
            fill="#be185d"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="514"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,6
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="560"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="594"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,7
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="640"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="674"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,8
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="720"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="754"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,9
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="800"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="834"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,10
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="880"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="480"
                y="914"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,11
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="0"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="34"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,0
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="80"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="114"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,1
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="160"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="194"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,2
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="240"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="274"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,3
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="320"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="354"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,4
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="400"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="434"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,5
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="480"
            width="120"
            height="60"
            fill="#be185d"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="514"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,6
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="560"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="594"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,7
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="640"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="674"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,8
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="720"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="754"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,9
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="800"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="834"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,10
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="880"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="620"
                y="914"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,11
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="0"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="34"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,0
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="80"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="114"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,1
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="160"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="194"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,2
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="240"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="274"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,3
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="320"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="354"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,4
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="400"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="434"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,5
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="480"
            width="120"
            height="60"
            fill="#be185d"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="514"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,6
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="560"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="594"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,7
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="640"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="674"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,8
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="720"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="754"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,9
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="800"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="834"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,10
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="880"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="760"
                y="914"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,11
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="0"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="34"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,0
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="80"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="114"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,1
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="160"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="194"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,2
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="240"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="274"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,3
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="320"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="354"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,4
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="400"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="434"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,5
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="480"
            width="120"
            height="60"
            fill="#be185d"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="514"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,6
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="560"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="594"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,7
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="640"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="674"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,8
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="720"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="754"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,9
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="800"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="834"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,10
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="880"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="900"
                y="914"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,11
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="0"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,0</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="34"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,0
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="80"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,1</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="114"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,1
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="160"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,2</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="194"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,2
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="240"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,3</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="274"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,3
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="320"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,4</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="354"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,4
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="400"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,5</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="434"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,5
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="480"
            width="120"
            height="60"
            fill="#be185d"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,6</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="514"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,6
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="560"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,7</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="594"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,7
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="640"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,8</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="674"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,8
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="720"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,9</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="754"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,9
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="800"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,10</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="834"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,10
              </text>
            </switch>
          </g>
          <rect
            x="980"
            y="880"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>7,11</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1040"
                y="914"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                7,11
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="0"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="34"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,0
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="80"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="114"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,1
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="160"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="194"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,2
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="240"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="274"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,3
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="320"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="354"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,4
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="400"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="434"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,5
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="480"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="514"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,6
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="560"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="594"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,7
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="640"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="674"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,8
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="720"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="754"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,9
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="800"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="834"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,10
              </text>
            </switch>
          </g>
          <rect
            x="1120"
            y="880"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1180"
                y="914"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,11
              </text>
            </switch>
          </g>
          {/* 最右邊的貨物點 */}
          <rect
            className="transition duration-[2s] ease-in-out"
            x="1260"
            y="480"
            width="120"
            height="60"
            // fill="#ff8000"
            fill={`${waitAreaGoods === true ? "#00ff00" : "#ff8000"} `}
            // stroke="rgb(0, 0, 0)"
            // strokeWidth="10"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); ">
                    <div>S0</div>
                  </div>
                </div>
              </foreignObject>
              <text
                x="1320"
                y="514"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                S0
              </text>
            </switch>
          </g>
          <rect
            x="0"
            y="0"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="60"
                y="34"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                0,0
              </text>
            </switch>
          </g>
          <rect
            x="140"
            y="960"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="201"
                y="994"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                1,12
              </text>
            </switch>
          </g>
          <rect
            x="280"
            y="960"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="341"
                y="994"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                2,12
              </text>
            </switch>
          </g>
          <rect
            x="420"
            y="960"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="481"
                y="994"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                3,12
              </text>
            </switch>
          </g>
          <rect
            x="560"
            y="960"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="621"
                y="994"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                4,12
              </text>
            </switch>
          </g>
          <rect
            x="700"
            y="960"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="761"
                y="994"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                5,12
              </text>
            </switch>
          </g>
          <rect
            x="840"
            y="960"
            width="120"
            height="60"
            fill="#1d4ed8"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />
          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="901"
                y="994"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                6,12
              </text>
            </switch>
          </g>
          <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <rect
              x="980"
              y="960"
              width="120"
              height="60"
              fill="#1d4ed8"
              stroke="rgb(0, 0, 0)"
              pointerEvents="all"
            />

            <g transform="translate(-0.5 -0.5)">
              <switch>
                <foreignObject
                  pointerEvents="none"
                  width="100%"
                  height="100%"
                  requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                >
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                  </div>
                </foreignObject>
                <text
                  x="1041"
                  y="994"
                  fill="#6D28B9"
                  fontFamily="Helvetica"
                  fontSize="12px"
                  textAnchor="middle"
                >
                  7,12
                </text>
              </switch>
            </g>
          </g>

          <rect
            x="1120"
            y="960"
            width="120"
            height="60"
            fill="#6d28b9"
            stroke="rgb(0, 0, 0)"
            pointerEvents="all"
          />

          <g transform="translate(-0.5 -0.5)">
            <switch>
              <foreignObject
                pointerEvents="none"
                width="100%"
                height="100%"
                requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <div data-drawio-colors="color: rgb(0, 0, 0); "></div>
                </div>
              </foreignObject>
              <text
                x="1181"
                y="994"
                fill="#6D28B9"
                fontFamily="Helvetica"
                fontSize="12px"
                textAnchor="middle"
              >
                8,12
              </text>
            </switch>
          </g>
        </g>

        {/* ---------------------------------------------車輛--------------------------------------------- */}

        {/* <g className="vehicle-container" transform="translate(0,0)"> */}
        <g
          className="vehicle-container"
          style={{ transition: "transform 1.2s ease" }}
          transform={`translate(${calculateActCoordiateX(position?.[1])},
            ${calculateActCoordiateY(position?.[0])})`}
        >
          {ifCarIsFull === true ? (
            // 車輛（有貨）svg
            <svg
              width="200"
              height="214"
              viewBox="0 0 200 214"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_0_1)">
                <path
                  d="M113.65 25.55C109.182 25.2889 104.715 25.3056 100.25 25.6C100.397 25.671 100.464 25.7876 100.45 25.95C100.247 25.9662 100.047 25.9495 99.85 25.9C99.962 25.8751 100.062 25.8251 100.15 25.75C99.889 25.6031 99.605 25.5364 99.3 25.55C98.318 25.618 97.334 25.668 96.35 25.7C95.93 26.011 95.463 26.111 94.95 26C95.138 25.9784 95.305 25.9117 95.45 25.8C95.152 25.7502 94.852 25.7335 94.55 25.75C94.592 25.6778 94.658 25.6278 94.75 25.6C94.615 25.3875 94.682 25.2708 94.95 25.25C95.218 25.2708 95.285 25.3875 95.15 25.6C95.381 25.6497 95.614 25.6663 95.85 25.65C95.85 25.55 95.85 25.45 95.85 25.35C96.385 25.4973 96.935 25.5639 97.5 25.55C99.382 25.4353 101.265 25.3519 103.15 25.3C100.02 25.1025 96.887 24.9858 93.75 24.95C93.75 24.85 93.75 24.75 93.75 24.65C93.315 24.6334 92.882 24.6501 92.45 24.7C92.277 25.0457 92.343 25.3291 92.65 25.55C92.562 25.6251 92.462 25.6751 92.35 25.7C92.782 25.7499 93.215 25.7666 93.65 25.75C93.102 25.8489 92.536 25.8822 91.95 25.85C92.026 25.7732 92.126 25.7232 92.25 25.7C92.143 25.6261 92.076 25.5261 92.05 25.4C92.188 25.2403 92.255 25.057 92.25 24.85C85.216 24.75 78.183 24.6166 71.15 24.45C70.818 24.3835 70.468 24.3501 70.1 24.35C69.15 24.3945 68.2 24.4445 67.25 24.5C67.496 24.6216 67.763 24.6882 68.05 24.7C67.796 24.7339 67.546 24.7839 67.3 24.85C67.147 24.7783 67.014 24.6783 66.9 24.55C66.783 24.6009 66.7 24.6842 66.65 24.8C66.457 24.8251 66.273 24.8751 66.1 24.95C65.981 24.8437 65.931 24.7103 65.95 24.55C65.683 24.55 65.417 24.55 65.15 24.55C65.15 24.35 65.15 24.15 65.15 23.95C64.782 23.9335 64.415 23.9501 64.05 24C63.881 24.1401 63.814 24.3234 63.85 24.55C63.417 24.55 62.983 24.55 62.55 24.55C62.55 24.65 62.55 24.75 62.55 24.85C62.305 24.8376 62.105 24.7376 61.95 24.55C61.826 24.6037 61.709 24.6704 61.6 24.75C61.04 24.683 60.456 24.6497 59.85 24.65C57.784 24.7248 55.718 24.7581 53.65 24.75C56.998 24.5684 60.365 24.4684 63.75 24.45C63.625 23.8253 63.875 23.592 64.5 23.75C65.057 23.6052 65.307 23.8052 65.25 24.35C71.939 24.2596 78.622 24.3596 85.3 24.65C85.333 24.6167 85.367 24.5833 85.4 24.55C87.596 24.7192 89.846 24.7525 92.15 24.65C92.171 24.5914 92.204 24.5414 92.25 24.5C92.75 24.4333 93.25 24.4333 93.75 24.5C93.834 24.6011 93.867 24.7178 93.85 24.85C99.297 24.8963 104.747 25.0629 110.2 25.35C110.3 25.3167 110.4 25.2833 110.5 25.25C111.563 25.3092 112.613 25.4092 113.65 25.55Z"
                  fill="#A6A6A6"
                />
                <path
                  d="M71.15 24.45C70.75 24.5861 70.35 24.7361 69.95 24.9C70.116 24.9725 70.166 25.0892 70.1 25.25C69.871 25.414 69.654 25.514 69.45 25.55C69.532 25.6386 69.632 25.6719 69.75 25.65C69.883 25.8833 69.883 26.1167 69.75 26.35C69.343 26.3701 68.943 26.4368 68.55 26.55C68.7 26.5833 68.85 26.6167 69 26.65C70.637 26.5972 72.27 26.4972 73.9 26.35C74.038 26.3514 74.155 26.3848 74.25 26.45C71.026 26.6708 67.793 26.8041 64.55 26.85C64.55 26.7167 64.55 26.5833 64.55 26.45C64.38 26.434 64.213 26.4506 64.05 26.5C63.929 26.6113 63.929 26.728 64.05 26.85C63.833 26.9205 63.633 27.0205 63.45 27.15C63.13 27.0147 62.88 26.8813 62.7 26.75C62.363 26.8883 62.013 26.9717 61.65 27C60.951 27.05 60.251 27.0666 59.55 27.05C59.407 26.8201 59.473 26.6535 59.75 26.55C59.668 26.4614 59.568 26.4281 59.45 26.45C59.283 26.45 59.117 26.45 58.95 26.45C58.906 26.4565 58.873 26.4399 58.85 26.4C58.983 26.3333 59.117 26.2667 59.25 26.2C59.183 26.1667 59.117 26.1333 59.05 26.1C59.217 25.852 59.3 25.5687 59.3 25.25C59.383 25.1667 59.467 25.0833 59.55 25C59.29 24.908 59.023 24.8413 58.75 24.8C59.136 24.7823 59.502 24.7323 59.85 24.65C60.456 24.6497 61.04 24.683 61.6 24.75C61.709 24.6704 61.826 24.6037 61.95 24.55C62.105 24.7376 62.305 24.8376 62.55 24.85C62.55 24.75 62.55 24.65 62.55 24.55C62.983 24.55 63.417 24.55 63.85 24.55C63.814 24.3234 63.881 24.1401 64.05 24C64.415 23.9501 64.782 23.9335 65.15 23.95C65.15 24.15 65.15 24.35 65.15 24.55C65.417 24.55 65.683 24.55 65.95 24.55C65.931 24.7103 65.981 24.8437 66.1 24.95C66.273 24.8751 66.457 24.8251 66.65 24.8C66.7 24.6842 66.783 24.6009 66.9 24.55C67.014 24.6783 67.147 24.7783 67.3 24.85C67.546 24.7839 67.796 24.7339 68.05 24.7C67.763 24.6882 67.496 24.6216 67.25 24.5C68.2 24.4445 69.15 24.3945 70.1 24.35C70.468 24.3501 70.818 24.3835 71.15 24.45Z"
                  fill="#6B6B6C"
                />
                <path
                  d="M71.15 24.45C78.183 24.6166 85.216 24.75 92.25 24.85C92.255 25.057 92.188 25.2403 92.05 25.4C92.076 25.5261 92.143 25.6261 92.25 25.7C92.126 25.7232 92.026 25.7732 91.95 25.85C91.783 25.85 91.617 25.85 91.45 25.85C85.716 26.0367 79.983 26.2367 74.25 26.45C74.155 26.3848 74.038 26.3514 73.9 26.35C72.27 26.4972 70.637 26.5972 69 26.65C68.85 26.6167 68.7 26.5833 68.55 26.55C68.943 26.4368 69.343 26.3701 69.75 26.35C69.883 26.1167 69.883 25.8833 69.75 25.65C69.632 25.6719 69.532 25.6386 69.45 25.55C69.654 25.514 69.871 25.414 70.1 25.25C70.166 25.0892 70.116 24.9725 69.95 24.9C70.35 24.7361 70.75 24.5861 71.15 24.45Z"
                  fill="#606060"
                />
                <path
                  d="M59.85 24.65C59.502 24.7323 59.136 24.7823 58.75 24.8C59.023 24.8413 59.29 24.908 59.55 25C59.467 25.0833 59.383 25.1667 59.3 25.25C59.3 25.5687 59.217 25.852 59.05 26.1C59.117 26.1333 59.183 26.1667 59.25 26.2C59.117 26.2667 58.983 26.3333 58.85 26.4C58.873 26.4399 58.906 26.4565 58.95 26.45C58.705 26.5473 58.439 26.5806 58.15 26.55C58.15 26.65 58.15 26.75 58.15 26.85C58.555 26.8824 58.955 26.8491 59.35 26.75C59.413 26.6583 59.446 26.5583 59.45 26.45C59.568 26.4281 59.668 26.4614 59.75 26.55C59.473 26.6535 59.407 26.8201 59.55 27.05C57.658 27.1967 55.758 27.2967 53.85 27.35C53.3643 27.2672 52.8643 27.1838 52.35 27.1C52.55 27.0667 52.75 27.0333 52.95 27C52.8151 26.9228 52.7318 26.8061 52.7 26.65C52.6501 26.1511 52.6334 25.6511 52.65 25.15C52.4473 25.1662 52.2473 25.1495 52.05 25.1C52.5047 25.0571 52.9381 24.9738 53.35 24.85C53.4791 24.8737 53.5791 24.8404 53.65 24.75C55.718 24.7581 57.784 24.7248 59.85 24.65Z"
                  fill="#797979"
                />
                <path
                  d="M53.35 24.85C52.9381 24.9738 52.5047 25.0571 52.05 25.1C52.2473 25.1495 52.4473 25.1662 52.65 25.15C52.6334 25.6511 52.6501 26.1511 52.7 26.65C52.7318 26.8061 52.8151 26.9228 52.95 27C52.75 27.0333 52.55 27.0667 52.35 27.1C52.8643 27.1838 53.3643 27.2672 53.85 27.35C52.1488 27.2947 50.4488 27.2281 48.75 27.15C48.3614 27.051 47.9614 26.951 47.55 26.85C47.55 26.55 47.55 26.25 47.55 25.95C47.9449 25.9307 47.9449 25.8807 47.55 25.8C47.7376 25.6983 47.9376 25.6149 48.15 25.55C47.9234 25.4686 47.69 25.4186 47.45 25.4C47.6291 25.3585 47.7624 25.2585 47.85 25.1C48.3684 25.0826 48.8684 25.0326 49.35 24.95C50.683 24.9046 52.0163 24.8712 53.35 24.85Z"
                  fill="#828282"
                />
                <path
                  d="M49.35 24.95C48.8684 25.0326 48.3684 25.0826 47.85 25.1C47.7624 25.2585 47.6291 25.3585 47.45 25.4C47.69 25.4186 47.9234 25.4686 48.15 25.55C47.9376 25.6149 47.7376 25.6983 47.55 25.8C47.9449 25.8807 47.9449 25.9307 47.55 25.95C47.55 26.25 47.55 26.55 47.55 26.85C47.9614 26.951 48.3614 27.051 48.75 27.15C47.3147 27.115 45.8814 27.0483 44.45 26.95C44.2428 26.8596 44.0928 26.7262 44 26.55C43.9501 26.1848 43.9335 25.8182 43.95 25.45C43.7473 25.4662 43.5473 25.4495 43.35 25.4C43.65 25.3667 43.95 25.3333 44.25 25.3C44.0942 25.279 43.9609 25.229 43.85 25.15C45.679 25.0501 47.5123 24.9834 49.35 24.95Z"
                  fill="#909090"
                />
                <path
                  d="M94.55 25.75C94.25 25.75 93.95 25.75 93.65 25.75C93.215 25.7666 92.782 25.7499 92.35 25.7C92.462 25.6751 92.562 25.6251 92.65 25.55C92.343 25.3291 92.277 25.0457 92.45 24.7C92.882 24.6501 93.315 24.6334 93.75 24.65C93.75 24.75 93.75 24.85 93.75 24.95C96.887 24.9858 100.02 25.1025 103.15 25.3C101.265 25.3519 99.382 25.4353 97.5 25.55C96.935 25.5639 96.385 25.4973 95.85 25.35C95.85 25.45 95.85 25.55 95.85 25.65C95.614 25.6663 95.381 25.6497 95.15 25.6C95.285 25.3875 95.218 25.2708 94.95 25.25C94.682 25.2708 94.615 25.3875 94.75 25.6C94.658 25.6278 94.592 25.6778 94.55 25.75Z"
                  fill="#676767"
                />
                <path
                  d="M43.85 25.15C43.9609 25.229 44.0942 25.279 44.25 25.3C43.95 25.3333 43.65 25.3667 43.35 25.4C43.5473 25.4495 43.7473 25.4662 43.95 25.45C43.9335 25.8182 43.9501 26.1848 44 26.55C44.0928 26.7262 44.2428 26.8596 44.45 26.95C42.8501 26.9113 41.2501 26.878 39.65 26.85C39.1407 26.7892 38.6407 26.6559 38.15 26.45C38.15 26.1833 38.15 25.9167 38.15 25.65C37.994 25.6481 37.844 25.6148 37.7 25.55C36.9676 25.7467 36.2343 25.8467 35.5 25.85C35.4517 25.7552 35.4351 25.6552 35.45 25.55C36.4625 25.6377 37.4625 25.5377 38.45 25.25C38.5442 25.2608 38.6275 25.2941 38.7 25.35C40.4067 25.1817 42.1234 25.115 43.85 25.15Z"
                  fill="#9F9F9F"
                />
                <path
                  d="M88.75 25.35C89.403 25.3133 90.07 25.28 90.75 25.25C90.75 25.35 90.75 25.45 90.75 25.55C90.238 25.5313 89.738 25.5313 89.25 25.55C89.115 25.405 88.948 25.3383 88.75 25.35Z"
                  fill="#A0A2A3"
                />
                <path
                  d="M53.65 24.75C53.5791 24.8404 53.4791 24.8737 53.35 24.85C52.0163 24.8712 50.683 24.9046 49.35 24.95C47.5123 24.9834 45.679 25.0501 43.85 25.15C42.1234 25.115 40.4067 25.1817 38.7 25.35C38.6275 25.2941 38.5442 25.2608 38.45 25.25C37.4625 25.5377 36.4625 25.6377 35.45 25.55C35.4351 25.6552 35.4517 25.7552 35.5 25.85C36.2343 25.8467 36.9676 25.7467 37.7 25.55C37.844 25.6148 37.994 25.6481 38.15 25.65C38.15 25.9167 38.15 26.1833 38.15 26.45C38.6407 26.6559 39.1407 26.7892 39.65 26.85C37.5095 26.8662 35.3762 26.7496 33.25 26.5C33.0917 26.3242 32.925 26.1742 32.75 26.05C32.6829 26.1847 32.6829 26.3014 32.75 26.4C32.411 26.4246 32.0777 26.4746 31.75 26.55C26.9565 26.2837 22.1565 26.117 17.35 26.05C16.7021 25.9509 16.0354 25.9176 15.35 25.95C20.9511 25.6833 26.5511 25.4833 32.15 25.35C32.0605 24.7053 32.3438 24.472 33 24.65C33.25 24.6833 33.5 24.7167 33.75 24.75C33.7525 24.963 33.8025 25.163 33.9 25.35C38.1607 25.1814 42.4273 25.0147 46.7 24.85C46.7414 24.8957 46.7914 24.9291 46.85 24.95C49.0363 24.851 51.2197 24.751 53.4 24.65C53.4671 24.7252 53.5504 24.7586 53.65 24.75Z"
                  fill="#B4B4B4"
                />
                <path
                  d="M33.55 24.85C33.4391 24.929 33.3058 24.979 33.15 25C33.2423 25.2041 33.2756 25.4208 33.25 25.65C32.8724 25.6469 32.8557 25.7136 33.2 25.85C33.6781 25.7581 34.1615 25.7248 34.65 25.75C34.0662 25.9144 33.4662 25.9477 32.85 25.85C32.7702 25.8957 32.7369 25.9624 32.75 26.05C32.1228 25.9318 31.4895 25.8318 30.85 25.75C30.8709 25.6914 30.9043 25.6414 30.95 25.6C31.3821 25.5501 31.8154 25.5334 32.25 25.55C32.25 25.3167 32.25 25.0833 32.25 24.85C32.6833 24.85 33.1167 24.85 33.55 24.85Z"
                  fill="#7F8080"
                />
                <path
                  d="M33.55 24.85C33.6216 25.0556 33.6883 25.2723 33.75 25.5C34.1211 25.5175 34.4878 25.5675 34.85 25.65C34.8043 25.7298 34.7376 25.7631 34.65 25.75C34.1615 25.7248 33.6781 25.7581 33.2 25.85C32.8557 25.7136 32.8724 25.6469 33.25 25.65C33.2756 25.4208 33.2423 25.2041 33.15 25C33.3058 24.979 33.4391 24.929 33.55 24.85Z"
                  fill="#636464"
                />
                <path
                  d="M61.05 25.65C61.584 25.6334 62.118 25.6501 62.65 25.7C62.461 25.7973 62.261 25.864 62.05 25.9C62.229 26.1106 62.296 26.3606 62.25 26.65C62.083 26.65 61.917 26.65 61.75 26.65C61.75 26.35 61.75 26.05 61.75 25.75C61.586 25.7286 61.436 25.762 61.3 25.85C61.25 26.1146 61.234 26.3813 61.25 26.65C61.35 26.65 61.45 26.65 61.55 26.65C61.537 26.9558 61.387 26.9891 61.1 26.75C61.05 26.3848 61.033 26.0182 61.05 25.65Z"
                  fill="#959596"
                />
                <path
                  d="M113.65 25.55C113.55 25.6167 113.45 25.6833 113.35 25.75C111.551 25.8338 109.751 25.9004 107.95 25.95C103.92 26.1892 99.887 26.3892 95.85 26.55C96.004 26.4837 96.171 26.417 96.35 26.35C96.451 26.2604 96.451 26.1938 96.35 26.15C93.192 26.1345 89.992 26.2345 86.75 26.45C86.826 26.3732 86.926 26.3232 87.05 26.3C87.017 26.2667 86.983 26.2333 86.95 26.2C87.117 26.1667 87.283 26.1333 87.45 26.1C88.804 26.0971 90.138 26.0138 91.45 25.85C91.617 25.85 91.783 25.85 91.95 25.85C92.536 25.8822 93.102 25.8489 93.65 25.75C93.95 25.75 94.25 25.75 94.55 25.75C94.852 25.7335 95.152 25.7502 95.45 25.8C95.305 25.9117 95.138 25.9784 94.95 26C95.463 26.111 95.93 26.011 96.35 25.7C97.334 25.668 98.318 25.618 99.3 25.55C99.605 25.5364 99.889 25.6031 100.15 25.75C100.062 25.8251 99.962 25.8751 99.85 25.9C100.047 25.9495 100.247 25.9662 100.45 25.95C100.464 25.7876 100.397 25.671 100.25 25.6C104.715 25.3056 109.182 25.2889 113.65 25.55Z"
                  fill="#CDCECD"
                />
                <path
                  d="M91.45 25.85C90.138 26.0138 88.804 26.0971 87.45 26.1C87.283 26.1333 87.117 26.1667 86.95 26.2C86.983 26.2333 87.017 26.2667 87.05 26.3C86.926 26.3232 86.826 26.3732 86.75 26.45C82.232 26.5949 77.732 26.7949 73.25 27.05C71.849 27.0551 70.449 27.1051 69.05 27.2C68.706 27.2649 68.373 27.3482 68.05 27.45C67.562 27.4389 67.529 27.3222 67.95 27.1C67.793 27.0301 67.659 27.0635 67.55 27.2C63.184 27.4182 58.817 27.6349 54.45 27.85C42.0821 27.3761 29.7155 26.8761 17.35 26.35C17.35 26.25 17.35 26.15 17.35 26.05C22.1565 26.117 26.9565 26.2837 31.75 26.55C32.0777 26.4746 32.411 26.4246 32.75 26.4C32.6829 26.3014 32.6829 26.1847 32.75 26.05C32.925 26.1742 33.0917 26.3242 33.25 26.5C35.3762 26.7496 37.5095 26.8662 39.65 26.85C41.2501 26.878 42.8501 26.9113 44.45 26.95C45.8814 27.0483 47.3147 27.115 48.75 27.15C50.4488 27.2281 52.1488 27.2947 53.85 27.35C55.758 27.2967 57.658 27.1967 59.55 27.05C60.251 27.0666 60.951 27.05 61.65 27C62.013 26.9717 62.363 26.8883 62.7 26.75C62.88 26.8813 63.13 27.0147 63.45 27.15C63.633 27.0205 63.833 26.9205 64.05 26.85C63.929 26.728 63.929 26.6113 64.05 26.5C64.213 26.4506 64.38 26.434 64.55 26.45C64.55 26.5833 64.55 26.7167 64.55 26.85C67.793 26.8041 71.026 26.6708 74.25 26.45C79.983 26.2367 85.716 26.0367 91.45 25.85Z"
                  fill="#C4C4C3"
                />
                <path
                  d="M113.35 25.75C113.45 25.75 113.55 25.75 113.65 25.75C113.534 29.683 113.434 33.6163 113.35 37.55C113.185 37.6927 112.985 37.776 112.75 37.8C111.089 37.9628 109.455 38.1128 107.85 38.25C109.195 38.015 110.561 37.8317 111.95 37.7C112.062 37.6751 112.162 37.6251 112.25 37.55C112.233 37.5167 112.217 37.4833 112.2 37.45C111.444 37.6051 110.694 37.6718 109.95 37.65C109.881 37.5975 109.831 37.5308 109.8 37.45C109.767 37.4833 109.733 37.5167 109.7 37.55C109.661 37.3821 109.677 37.2155 109.75 37.05C109.644 36.8239 109.51 36.6239 109.35 36.45C109 36.7752 108.9 37.1585 109.05 37.6C108.989 37.687 108.906 37.737 108.8 37.75C108.684 37.6813 108.567 37.6647 108.45 37.7C108.595 37.8117 108.762 37.8784 108.95 37.9C108.086 38.0248 107.219 38.0582 106.35 38C106.417 37.9667 106.483 37.9333 106.55 37.9C106.423 37.8691 106.307 37.8191 106.2 37.75C106.343 37.3135 106.21 36.9802 105.8 36.75C105.636 37.122 105.519 37.5053 105.45 37.9C105.583 37.9667 105.717 38.0333 105.85 38.1C105.105 38.2557 104.372 38.4057 103.65 38.55C102.965 38.5735 102.298 38.6402 101.65 38.75C99.386 38.9848 97.12 39.2015 94.85 39.4C93.997 39.5252 93.164 39.6752 92.35 39.85C92.35 39.8833 92.35 39.9167 92.35 39.95C92.017 39.95 91.683 39.95 91.35 39.95C89.816 40.0482 88.282 40.1649 86.75 40.3C86.213 40.3117 85.713 40.4284 85.25 40.65C85.183 40.65 85.117 40.65 85.05 40.65C84.516 40.6334 83.982 40.6501 83.45 40.7C82.561 40.8045 81.694 40.9545 80.85 41.15C80.783 41.15 80.717 41.15 80.65 41.15C76.957 41.4794 73.257 41.8627 69.55 42.3C69.494 42.3383 69.461 42.3883 69.45 42.45C66.715 42.6286 63.982 42.8619 61.25 43.15C61.25 43.2833 61.25 43.4167 61.25 43.55C60.929 43.519 60.629 43.5523 60.35 43.65C60.083 43.65 59.817 43.65 59.55 43.65C59.517 43.65 59.483 43.65 59.45 43.65C59.939 43.5513 60.406 43.4346 60.85 43.3C60.631 43.2323 60.598 43.1156 60.75 42.95C60.562 42.8803 60.528 42.7803 60.65 42.65C60.405 42.4074 60.405 42.1574 60.65 41.9C60.583 41.7333 60.517 41.5667 60.45 41.4C60.724 41.16 60.758 40.91 60.55 40.65C60.613 40.4522 60.613 40.2355 60.55 40C60.817 39.9333 60.817 39.8667 60.55 39.8C60.617 39.7333 60.683 39.6667 60.75 39.6C60.66 39.3808 60.56 39.1642 60.45 38.95C60.773 38.7437 60.773 38.4937 60.45 38.2C60.689 38.1309 60.689 38.0309 60.45 37.9C60.651 37.6598 60.651 37.4598 60.45 37.3C60.517 37.2667 60.583 37.2333 60.65 37.2C60.571 37.0915 60.504 36.9748 60.45 36.85C60.724 36.3309 60.758 35.8142 60.55 35.3C60.585 34.9564 60.652 34.6231 60.75 34.3C60.609 34.2632 60.509 34.1799 60.45 34.05C60.553 34.0704 60.653 34.0204 60.75 33.9C60.406 33.8779 60.372 33.7779 60.65 33.6C60.611 33.4192 60.611 33.2525 60.65 33.1C60.583 33.0667 60.517 33.0333 60.45 33C60.522 32.7539 60.588 32.5039 60.65 32.25C60.57 31.9731 60.537 31.7064 60.55 31.45C60.604 31.3252 60.671 31.2085 60.75 31.1C60.65 31 60.55 30.9 60.45 30.8C60.531 30.7692 60.597 30.7192 60.65 30.65C60.566 30.0095 60.566 29.3929 60.65 28.8C60.605 28.6715 60.538 28.5548 60.45 28.45C60.628 28.3016 60.828 28.2016 61.05 28.15C63.149 28.04 65.249 27.94 67.35 27.85C68.167 27.9012 68.983 27.9679 69.8 28.05C73.081 27.848 76.365 27.6814 79.65 27.55C79.975 27.5521 80.292 27.5854 80.6 27.65C81.981 27.5117 83.364 27.3617 84.75 27.2C92.455 26.922 100.155 26.5553 107.85 26.1C107.906 26.0617 107.939 26.0117 107.95 25.95C109.751 25.9004 111.551 25.8338 113.35 25.75Z"
                  fill="#8A8A8A"
                />
                <path
                  d="M107.95 25.95C107.939 26.0117 107.906 26.0617 107.85 26.1C100.155 26.5553 92.455 26.922 84.75 27.2C83.364 27.3617 81.981 27.5117 80.6 27.65C80.292 27.5854 79.975 27.5521 79.65 27.55C76.365 27.6814 73.081 27.848 69.8 28.05C68.983 27.9679 68.167 27.9012 67.35 27.85C69.533 27.7133 71.733 27.6133 73.95 27.55C81.25 27.2167 88.55 26.8833 95.85 26.55C99.887 26.3892 103.92 26.1892 107.95 25.95Z"
                  fill="#B2B2B1"
                />
                <path
                  d="M95.85 26.55C88.55 26.8833 81.25 27.2167 73.95 27.55C74.129 27.4691 74.329 27.4191 74.55 27.4C74.617 27.3 74.683 27.2 74.75 27.1C74.251 27.0501 73.751 27.0334 73.25 27.05C77.732 26.7949 82.232 26.5949 86.75 26.45C89.992 26.2345 93.192 26.1345 96.35 26.15C96.451 26.1938 96.451 26.2604 96.35 26.35C96.171 26.417 96.004 26.4837 95.85 26.55Z"
                  fill="#D8D8D7"
                />
                <path
                  d="M15.35 25.95C16.0354 25.9176 16.7021 25.9509 17.35 26.05C17.35 26.15 17.35 26.25 17.35 26.35C29.7155 26.8761 42.0821 27.3761 54.45 27.85C58.817 27.6349 63.184 27.4182 67.55 27.2C67.659 27.0635 67.793 27.0301 67.95 27.1C67.529 27.3222 67.562 27.4389 68.05 27.45C68.373 27.3482 68.706 27.2649 69.05 27.2C70.449 27.1051 71.849 27.0551 73.25 27.05C73.751 27.0334 74.251 27.0501 74.75 27.1C74.683 27.2 74.617 27.3 74.55 27.4C74.329 27.4191 74.129 27.4691 73.95 27.55C71.733 27.6133 69.533 27.7133 67.35 27.85C65.249 27.94 63.149 28.04 61.05 28.15C60.58 28.1437 60.113 28.1771 59.65 28.25C55.617 28.2667 51.5832 28.25 47.55 28.2C34.7814 27.6638 22.0148 27.0971 9.24999 26.5C8.99489 26.4998 8.79489 26.4164 8.64999 26.25C9.57169 26.0987 10.505 26.0153 11.45 26C12.7075 25.9823 13.9575 25.9323 15.2 25.85C15.2383 25.9056 15.2883 25.9389 15.35 25.95Z"
                  fill="#EBEBEB"
                />
                <path
                  d="M8.65 26.25C8.7949 26.4164 8.9949 26.4998 9.25 26.5C22.0148 27.0971 34.7814 27.6638 47.55 28.2C51.5832 28.25 55.617 28.2667 59.65 28.25C59.475 28.4223 59.275 28.5723 59.05 28.7C59.039 28.9811 59.072 29.2478 59.15 29.5C59.083 29.5333 59.017 29.5667 58.95 29.6C59.057 29.6739 59.124 29.7739 59.15 29.9C59.017 30.1 59.017 30.3 59.15 30.5C59.124 30.6261 59.057 30.7261 58.95 30.8C59.033 30.8915 59.133 30.9581 59.25 31C59.117 31.0667 59.117 31.1333 59.25 31.2C59.183 31.2333 59.117 31.2667 59.05 31.3C59.123 31.7155 59.123 32.1155 59.05 32.5C59.317 32.6667 59.317 32.8333 59.05 33C59.117 33.1333 59.217 33.2333 59.35 33.3C59.269 33.3308 59.203 33.3808 59.15 33.45C59.279 33.9254 59.212 34.442 58.95 35C59.017 35.0333 59.083 35.0667 59.15 35.1C59.117 35.2667 59.083 35.4333 59.05 35.6C59.317 35.7333 59.317 35.8667 59.05 36C59.129 36.1085 59.196 36.2252 59.25 36.35C59.178 36.8238 59.178 37.3238 59.25 37.85C59.08 37.989 59.013 38.139 59.05 38.3C59.162 38.3249 59.262 38.3749 59.35 38.45C59.26 38.4669 59.16 38.5002 59.05 38.55C59.103 38.6192 59.169 38.6692 59.25 38.7C59.161 38.9764 59.161 39.2764 59.25 39.6C59.224 39.7261 59.157 39.8261 59.05 39.9C59.373 40.0724 59.406 40.2724 59.15 40.5C59.245 40.9192 59.245 41.3525 59.15 41.8C59.217 41.8667 59.283 41.9333 59.35 42C59.236 42.153 59.136 42.2863 59.05 42.4C59.133 42.4915 59.233 42.5581 59.35 42.6C59.271 42.7085 59.204 42.8252 59.15 42.95C59.248 43.1098 59.265 43.2765 59.2 43.45C58.913 43.5693 58.63 43.6693 58.35 43.75C55.45 43.8808 52.5499 43.8808 49.65 43.75C49.35 43.75 49.05 43.75 48.75 43.75C48.4038 43.6518 48.0371 43.6185 47.65 43.65C47.5833 43.5833 47.5167 43.5167 47.45 43.45C47.45 43.35 47.45 43.25 47.45 43.15C45.2524 42.9483 43.0524 42.7649 40.85 42.6C40.7377 42.4956 40.6044 42.429 40.45 42.4C39.252 42.2977 38.052 42.2477 36.85 42.25C35.7728 42.238 34.7061 42.138 33.65 41.95C33.0887 41.7742 32.4887 41.6576 31.85 41.6C31.1508 41.55 30.4508 41.5334 29.75 41.55C29.6833 41.55 29.6167 41.55 29.55 41.55C28.3202 41.2475 27.0535 41.0308 25.75 40.9C23.3177 40.6895 20.8844 40.5061 18.45 40.35C18.4198 40.6059 18.4532 40.8393 18.55 41.05C18.55 42.0833 18.55 43.1167 18.55 44.15C18.45 44.15 18.35 44.15 18.25 44.15C18.3897 44.0181 18.4563 43.8514 18.45 43.65C18.3915 42.6893 18.3582 41.656 18.35 40.55C15.6903 40.219 13.0403 39.9524 10.4 39.75C9.8433 39.6909 9.31 39.5576 8.8 39.35C8.6982 35.0361 8.5815 30.7195 8.45 26.4C8.5044 26.3283 8.5711 26.2783 8.65 26.25Z"
                  fill="#9E9E9D"
                />
                <path
                  d="M58.95 26.45C59.117 26.45 59.283 26.45 59.45 26.45C59.446 26.5583 59.413 26.6583 59.35 26.75C58.955 26.8491 58.555 26.8824 58.15 26.85C58.15 26.75 58.15 26.65 58.15 26.55C58.439 26.5806 58.705 26.5473 58.95 26.45Z"
                  fill="#ACADAF"
                />
                <path
                  d="M113.65 25.55C113.712 25.5611 113.762 25.5944 113.8 25.65C113.75 28.9186 113.634 32.2019 113.45 35.5C113.506 35.5725 113.539 35.6558 113.55 35.75C113.491 36.3653 113.425 36.9653 113.35 37.55C113.434 33.6163 113.534 29.683 113.65 25.75C113.55 25.75 113.45 25.75 113.35 25.75C113.45 25.6833 113.55 25.6167 113.65 25.55Z"
                  fill="#A8A8A8"
                />
                <path
                  d="M61.05 28.15C60.828 28.2016 60.628 28.3016 60.45 28.45C60.538 28.5548 60.605 28.6715 60.65 28.8C60.566 29.3929 60.566 30.0095 60.65 30.65C60.597 30.7192 60.531 30.7692 60.45 30.8C60.55 30.9 60.65 31 60.75 31.1C60.671 31.2085 60.604 31.3252 60.55 31.45C60.537 31.7064 60.57 31.9731 60.65 32.25C60.588 32.5039 60.522 32.7539 60.45 33C60.517 33.0333 60.583 33.0667 60.65 33.1C60.611 33.2525 60.611 33.4192 60.65 33.6C60.372 33.7779 60.406 33.8779 60.75 33.9C60.653 34.0204 60.553 34.0704 60.45 34.05C60.509 34.1799 60.609 34.2632 60.75 34.3C60.652 34.6231 60.585 34.9564 60.55 35.3C60.758 35.8142 60.724 36.3309 60.45 36.85C60.504 36.9748 60.571 37.0915 60.65 37.2C60.583 37.2333 60.517 37.2667 60.45 37.3C60.651 37.4598 60.651 37.6598 60.45 37.9C60.689 38.0309 60.689 38.1309 60.45 38.2C60.773 38.4937 60.773 38.7437 60.45 38.95C60.56 39.1642 60.66 39.3808 60.75 39.6C60.683 39.6667 60.617 39.7333 60.55 39.8C60.817 39.8667 60.817 39.9333 60.55 40C60.613 40.2355 60.613 40.4522 60.55 40.65C60.758 40.91 60.724 41.16 60.45 41.4C60.517 41.5667 60.583 41.7333 60.65 41.9C60.405 42.1574 60.405 42.4074 60.65 42.65C60.528 42.7803 60.562 42.8803 60.75 42.95C60.598 43.1156 60.631 43.2323 60.85 43.3C60.406 43.4346 59.939 43.5513 59.45 43.65C59.228 43.7369 58.995 43.7702 58.75 43.75C58.717 43.75 58.683 43.75 58.65 43.75C58.55 43.75 58.45 43.75 58.35 43.75C58.63 43.6693 58.913 43.5693 59.2 43.45C59.265 43.2765 59.248 43.1098 59.15 42.95C59.204 42.8252 59.271 42.7085 59.35 42.6C59.233 42.5581 59.133 42.4915 59.05 42.4C59.136 42.2863 59.236 42.153 59.35 42C59.283 41.9333 59.217 41.8667 59.15 41.8C59.245 41.3525 59.245 40.9192 59.15 40.5C59.406 40.2724 59.373 40.0724 59.05 39.9C59.157 39.8261 59.224 39.7261 59.25 39.6C59.161 39.2764 59.161 38.9764 59.25 38.7C59.169 38.6692 59.103 38.6192 59.05 38.55C59.16 38.5002 59.26 38.4669 59.35 38.45C59.262 38.3749 59.162 38.3249 59.05 38.3C59.013 38.139 59.08 37.989 59.25 37.85C59.178 37.3238 59.178 36.8238 59.25 36.35C59.196 36.2252 59.129 36.1085 59.05 36C59.317 35.8667 59.317 35.7333 59.05 35.6C59.083 35.4333 59.117 35.2667 59.15 35.1C59.083 35.0667 59.017 35.0333 58.95 35C59.212 34.442 59.279 33.9254 59.15 33.45C59.203 33.3808 59.269 33.3308 59.35 33.3C59.217 33.2333 59.117 33.1333 59.05 33C59.317 32.8333 59.317 32.6667 59.05 32.5C59.123 32.1155 59.123 31.7155 59.05 31.3C59.117 31.2667 59.183 31.2333 59.25 31.2C59.117 31.1333 59.117 31.0667 59.25 31C59.133 30.9581 59.033 30.8915 58.95 30.8C59.057 30.7261 59.124 30.6261 59.15 30.5C59.017 30.3 59.017 30.1 59.15 29.9C59.124 29.7739 59.057 29.6739 58.95 29.6C59.017 29.5667 59.083 29.5333 59.15 29.5C59.072 29.2478 59.039 28.9811 59.05 28.7C59.275 28.5723 59.475 28.4223 59.65 28.25C60.113 28.1771 60.58 28.1437 61.05 28.15Z"
                  fill="#939392"
                />
                <path
                  d="M25.35 32.55C25.1918 33.6117 25.4085 34.5784 26 35.45C26.4568 35.8986 27.0068 36.0653 27.65 35.95C27.6201 36.076 27.6201 36.1927 27.65 36.3C27.45 36.3333 27.25 36.3667 27.05 36.4C27.0833 36.4333 27.1167 36.4667 27.15 36.5C27.0328 36.5419 26.9328 36.6085 26.85 36.7C27.1695 36.7181 27.4695 36.7681 27.75 36.85C26.4807 36.7764 25.2141 36.6764 23.95 36.55C23.9082 36.4778 23.8416 36.4278 23.75 36.4C24.2437 36.2915 24.7437 36.2248 25.25 36.2C25.1167 36.1667 24.9833 36.1333 24.85 36.1C24.9 36.05 24.95 36 25 35.95C25.1726 36.0576 25.3559 36.0743 25.55 36C25.3924 35.8423 25.2091 35.7256 25 35.65C24.8467 35.7695 24.6967 35.7695 24.55 35.65C24.5167 35.7167 24.4833 35.7833 24.45 35.85C24.0246 35.8586 23.5913 35.8253 23.15 35.75C23.1744 34.0479 23.1411 32.3479 23.05 30.65C23.2269 30.5579 23.3935 30.4412 23.55 30.3C23.7167 30.2333 23.8833 30.2333 24.05 30.3C24.3694 30.4744 24.6694 30.6744 24.95 30.9C25.0701 30.9903 25.1535 31.1069 25.2 31.25C25.225 31.6138 25.2417 31.9638 25.25 32.3C24.4719 32.8351 24.2552 33.5518 24.6 34.45C24.6259 34.2009 24.6093 33.9509 24.55 33.7C24.6395 33.418 24.7229 33.1346 24.8 32.85C24.9264 32.6393 25.1097 32.5393 25.35 32.55Z"
                  fill="#343334"
                />
                <path
                  d="M23.85 29.95C26.9828 30.1037 30.1161 30.2537 33.25 30.4C33.6219 30.5263 33.8719 30.7763 34 31.15C34.0667 32.9833 34.0667 34.8167 34 36.65C33.931 36.9196 33.781 37.1363 33.55 37.3C31.6145 37.198 29.6811 37.048 27.75 36.85C27.4695 36.7681 27.1695 36.7181 26.85 36.7C26.9328 36.6085 27.0328 36.5419 27.15 36.5C27.1167 36.4667 27.0833 36.4333 27.05 36.4C27.25 36.3667 27.45 36.3333 27.65 36.3C27.6201 36.1927 27.6201 36.076 27.65 35.95C27.8685 35.9296 28.0685 35.863 28.25 35.75C28.6607 35.7877 29.0274 35.6877 29.35 35.45C30.1909 35.5298 30.8909 35.2631 31.45 34.65C31.4152 34.9019 31.2819 35.0853 31.05 35.2C31.45 35.2667 31.85 35.2667 32.25 35.2C32.3931 35.1535 32.5097 35.0701 32.6 34.95C32.4333 34.1167 32.6667 33.4167 33.3 32.85C33.3738 32.4598 33.3072 32.0932 33.1 31.75C32.7262 31.3666 32.3428 30.9832 31.95 30.6C31.8056 30.5219 31.6723 30.5386 31.55 30.65C31.5709 30.7086 31.6043 30.7586 31.65 30.8C31.4709 31.0414 31.3043 31.2914 31.15 31.55C31.0583 31.4873 30.9583 31.4539 30.85 31.45C30.5039 31.2909 30.1372 31.2242 29.75 31.25C29.5167 31.25 29.2833 31.25 29.05 31.25C28.7236 31.1676 28.3902 31.1342 28.05 31.15C27.575 30.9519 27.075 30.9019 26.55 31C26.4944 31.0383 26.4611 31.0883 26.45 31.15C25.8671 31.4344 25.5004 31.901 25.35 32.55C25.1097 32.5393 24.9264 32.6393 24.8 32.85C24.7229 33.1346 24.6395 33.418 24.55 33.7C24.6093 33.9509 24.6259 34.2009 24.6 34.45C24.2552 33.5518 24.4719 32.8351 25.25 32.3C25.2417 31.9638 25.225 31.6138 25.2 31.25C25.1535 31.1069 25.0701 30.9903 24.95 30.9C24.6694 30.6744 24.3694 30.4744 24.05 30.3C23.8833 30.2333 23.7167 30.2333 23.55 30.3C23.3935 30.4412 23.2269 30.5579 23.05 30.65C23.05 30.4167 23.05 30.1833 23.05 29.95C23.3167 29.95 23.5833 29.95 23.85 29.95Z"
                  fill="#231F1E"
                />
                <path
                  d="M22.45 29.85C22.1482 29.8335 21.8482 29.8502 21.55 29.9C21.5 29.95 21.45 30 21.4 30.05C21.3043 31.7567 21.3376 33.4567 21.5 35.15C21.6873 34.3049 21.8373 33.4549 21.95 32.6C22.2061 32.451 22.4227 32.2677 22.6 32.05C22.6333 32.0833 22.6667 32.1167 22.7 32.15C22.8186 32.7085 22.8852 33.2751 22.9 33.85C22.95 32.5171 22.9667 31.1837 22.95 29.85C23.2713 29.819 23.5713 29.8523 23.85 29.95C23.5833 29.95 23.3167 29.95 23.05 29.95C23.05 30.1833 23.05 30.4167 23.05 30.65C23.1411 32.3479 23.1744 34.0479 23.15 35.75C23.5913 35.8253 24.0246 35.8586 24.45 35.85C24.4833 35.7833 24.5167 35.7167 24.55 35.65C24.6967 35.7695 24.8467 35.7695 25 35.65C25.2091 35.7256 25.3924 35.8423 25.55 36C25.3559 36.0743 25.1726 36.0576 25 35.95C24.95 36 24.9 36.05 24.85 36.1C24.9833 36.1333 25.1167 36.1667 25.25 36.2C24.7437 36.2248 24.2437 36.2915 23.75 36.4C23.8416 36.4278 23.9082 36.4778 23.95 36.55C23.2786 36.5637 22.612 36.5137 21.95 36.4C21.5698 36.1913 21.3198 35.8746 21.2 35.45C21.1333 33.65 21.1333 31.85 21.2 30.05C21.2833 29.9667 21.3667 29.8833 21.45 29.8C21.8027 29.7192 22.136 29.7359 22.45 29.85Z"
                  fill="#403E40"
                />
                <path
                  d="M22.45 29.85C22.6167 29.85 22.7833 29.85 22.95 29.85C22.9667 31.1837 22.95 32.5171 22.9 33.85C22.8852 33.2751 22.8186 32.7085 22.7 32.15C22.6667 32.1167 22.6333 32.0833 22.6 32.05C22.4227 32.2677 22.2061 32.451 21.95 32.6C21.8373 33.4549 21.6873 34.3049 21.5 35.15C21.3376 33.4567 21.3043 31.7567 21.4 30.05C21.45 30 21.5 29.95 21.55 29.9C21.8482 29.8502 22.1482 29.8335 22.45 29.85Z"
                  fill="#31302F"
                />
                <path
                  d="M28.05 31.15C28.1174 31.3024 28.2174 31.4358 28.35 31.55C28.2624 31.6251 28.1624 31.6751 28.05 31.7C28.2941 31.7036 28.4941 31.7869 28.65 31.95C28.5271 32.0281 28.3938 32.0781 28.25 32.1C28.4167 32.1333 28.5833 32.1667 28.75 32.2C28.8252 32.2671 28.8586 32.3504 28.85 32.45C28.65 32.45 28.45 32.45 28.25 32.45C28.2662 32.6527 28.2495 32.8527 28.2 33.05C27.9996 32.5785 27.7996 32.1119 27.6 31.65C27.2717 31.3361 26.8883 31.1694 26.45 31.15C26.4611 31.0883 26.4944 31.0383 26.55 31C27.075 30.9019 27.575 30.9519 28.05 31.15Z"
                  fill="#824931"
                />
                <path
                  d="M13.95 31.15C14.1048 31.1821 14.1715 31.2821 14.15 31.45C14.25 31.45 14.35 31.45 14.45 31.45C14.4962 31.9244 14.3462 32.0244 14 31.75C13.9505 31.5527 13.9338 31.3527 13.95 31.15Z"
                  fill="#4F4F50"
                />
                <path
                  d="M28.05 31.15C28.3902 31.1342 28.7236 31.1676 29.05 31.25C29.4634 31.5981 29.7634 32.0314 29.95 32.55C30.2087 33.6236 30.0087 34.5902 29.35 35.45C29.0274 35.6877 28.6607 35.7877 28.25 35.75C28.4054 35.6086 28.5388 35.4419 28.65 35.25C28.5624 35.1749 28.4624 35.1249 28.35 35.1C28.4833 35.0667 28.6167 35.0333 28.75 35C28.8925 34.8286 28.8592 34.6953 28.65 34.6C28.7448 34.5517 28.8448 34.5351 28.95 34.55C28.95 34.45 28.95 34.35 28.95 34.25C28.8325 34.2719 28.7325 34.2386 28.65 34.15C28.7689 34.0571 28.9022 34.0238 29.05 34.05C29.05 33.9167 29.05 33.7833 29.05 33.65C28.3833 33.6167 28.3833 33.5833 29.05 33.55C29.05 33.4167 29.05 33.2833 29.05 33.15C28.4833 33.1336 28.45 33.1003 28.95 33.05C28.9675 32.8379 28.9341 32.6379 28.85 32.45C28.8586 32.3504 28.8252 32.2671 28.75 32.2C28.5833 32.1667 28.4167 32.1333 28.25 32.1C28.3938 32.0781 28.5271 32.0281 28.65 31.95C28.4941 31.7869 28.2941 31.7036 28.05 31.7C28.1624 31.6751 28.2624 31.6251 28.35 31.55C28.2174 31.4358 28.1174 31.3024 28.05 31.15Z"
                  fill="#37110E"
                />
                <path
                  d="M26.45 31.15C26.8883 31.1694 27.2717 31.3361 27.6 31.65C27.7996 32.1119 27.9996 32.5785 28.2 33.05C28.2495 32.8527 28.2662 32.6527 28.25 32.45C28.45 32.45 28.65 32.45 28.85 32.45C28.9341 32.6379 28.9675 32.8379 28.95 33.05C28.45 33.1003 28.4833 33.1336 29.05 33.15C29.05 33.2833 29.05 33.4167 29.05 33.55C28.3833 33.5833 28.3833 33.6167 29.05 33.65C29.05 33.7833 29.05 33.9167 29.05 34.05C28.9022 34.0238 28.7689 34.0571 28.65 34.15C28.7325 34.2386 28.8325 34.2719 28.95 34.25C28.95 34.35 28.95 34.45 28.95 34.55C28.8448 34.5351 28.7448 34.5517 28.65 34.6C28.8592 34.6953 28.8925 34.8286 28.75 35C28.6167 35.0333 28.4833 35.0667 28.35 35.1C28.4624 35.1249 28.5624 35.1749 28.65 35.25C28.5388 35.4419 28.4054 35.6086 28.25 35.75C28.0685 35.863 27.8685 35.9296 27.65 35.95C27.0068 36.0653 26.4568 35.8986 26 35.45C25.4085 34.5784 25.1918 33.6117 25.35 32.55C25.5004 31.901 25.8671 31.4344 26.45 31.15Z"
                  fill="#511A12"
                />
                <path
                  d="M26.25 31.75C26.7522 31.7175 27.1189 31.9175 27.35 32.35C27.1257 32.4383 26.959 32.3549 26.85 32.1C26.4726 31.9817 26.1559 32.0651 25.9 32.35C25.8333 32.2833 25.8333 32.2167 25.9 32.15C26.0376 32.0295 26.1542 31.8962 26.25 31.75Z"
                  fill="#754717"
                />
                <path
                  d="M29.75 31.25C30.1372 31.2242 30.5039 31.2909 30.85 31.45C30.9782 31.7617 31.1949 31.995 31.5 32.15C31.545 32.3519 31.6283 32.5352 31.75 32.7C31.6691 33.2417 31.6191 33.7917 31.6 34.35C31.5487 34.4527 31.4987 34.5527 31.45 34.65C30.8909 35.2631 30.1909 35.5298 29.35 35.45C30.0087 34.5902 30.2087 33.6236 29.95 32.55C30.1415 33.0529 30.2415 33.5863 30.25 34.15C30.5272 34.3434 30.7105 34.2767 30.8 33.95C30.9689 32.8388 30.6189 31.9388 29.75 31.25Z"
                  fill="#3D2D11"
                />
                <path
                  d="M31.45 34.65C31.4987 34.5527 31.5487 34.4527 31.6 34.35C31.6191 33.7917 31.6691 33.2417 31.75 32.7C31.6283 32.5352 31.545 32.3519 31.5 32.15C31.1949 31.995 30.9782 31.7617 30.85 31.45C30.9583 31.4539 31.0583 31.4873 31.15 31.55C31.3043 31.2914 31.4709 31.0414 31.65 30.8C31.6043 30.7586 31.5709 30.7086 31.55 30.65C31.6723 30.5386 31.8056 30.5219 31.95 30.6C32.3428 30.9832 32.7262 31.3666 33.1 31.75C33.3072 32.0932 33.3738 32.4598 33.3 32.85C32.6667 33.4167 32.4333 34.1167 32.6 34.95C32.5097 35.0701 32.3931 35.1535 32.25 35.2C31.85 35.2667 31.45 35.2667 31.05 35.2C31.2819 35.0853 31.4152 34.9019 31.45 34.65Z"
                  fill="#271411"
                />
                <path
                  d="M36.45 32.55C36.5943 32.6335 36.6943 32.7668 36.75 32.95C37.0402 32.7197 37.1236 32.8197 37 33.25C36.8159 33.5081 36.6326 33.5081 36.45 33.25C36.371 33.0384 36.371 32.8051 36.45 32.55Z"
                  fill="#525252"
                />
                <path
                  d="M71.55 32.55C71.917 32.7238 71.951 32.9738 71.65 33.3C71.521 33.349 71.387 33.3657 71.25 33.35C71.303 33.0646 71.403 32.7979 71.55 32.55Z"
                  fill="#444445"
                />
                <path
                  d="M66.45 32.85C66.588 32.8962 66.655 32.9962 66.65 33.15C66.665 33.5825 66.465 33.7825 66.05 33.75C66.088 33.4104 66.222 33.1104 66.45 32.85Z"
                  fill="#434344"
                />
                <path
                  d="M41.85 32.95C42.0048 32.9821 42.0715 33.0821 42.05 33.25C42.1833 33.25 42.3167 33.25 42.45 33.25C42.5263 33.6138 42.393 33.7638 42.05 33.7C41.7489 33.5132 41.6822 33.2632 41.85 32.95Z"
                  fill="#4B4B4C"
                />
                <path
                  d="M29.05 31.25C29.2833 31.25 29.5167 31.25 29.75 31.25C30.6189 31.9388 30.9689 32.8388 30.8 33.95C30.7105 34.2767 30.5272 34.3434 30.25 34.15C30.2415 33.5863 30.1415 33.0529 29.95 32.55C29.7634 32.0314 29.4634 31.5981 29.05 31.25Z"
                  fill="#624917"
                />
                <path
                  d="M25.55 33.25C25.6403 33.9183 25.907 34.5183 26.35 35.05C26.3167 35.0833 26.2833 35.1167 26.25 35.15C25.6782 34.634 25.4449 34.0007 25.55 33.25Z"
                  fill="#744416"
                />
                <path
                  d="M103.95 32.45C104.183 32.4247 104.383 32.4914 104.55 32.65C104.881 33.2416 104.865 33.8416 104.5 34.45C104.2 34.85 103.9 34.85 103.6 34.45C103.318 33.6956 103.434 33.0289 103.95 32.45Z"
                  fill="#A6A3FD"
                />
                <path
                  d="M104.05 32.85C104.344 32.9515 104.477 33.1682 104.45 33.5C104.459 33.8586 104.326 34.142 104.05 34.35C103.666 33.8611 103.666 33.3611 104.05 32.85Z"
                  fill="#4F5254"
                />
                <path
                  d="M75.15 35.35C75.044 35.1445 74.877 35.0111 74.65 34.95C74.483 34.8167 74.317 34.8167 74.15 34.95C73.855 35.0359 73.671 35.2359 73.6 35.55C73.533 35.9833 73.533 36.4167 73.6 36.85C73.628 36.9416 73.678 37.0082 73.75 37.05C73.741 37.1496 73.775 37.2329 73.85 37.3C74.113 37.461 74.379 37.4777 74.65 37.35C74.589 37.599 74.423 37.7324 74.15 37.75C73.906 37.6964 73.672 37.6131 73.45 37.5C72.82 36.3923 72.986 35.4256 73.95 34.6C74.594 34.4614 74.994 34.7114 75.15 35.35Z"
                  fill="#5E6264"
                />
                <path
                  d="M27.55 33.15C27.8376 33.8005 27.7543 34.4338 27.3 35.05C27.1989 35.1337 27.0822 35.167 26.95 35.15C26.9351 35.0448 26.9517 34.9448 27 34.85C27.1676 34.7939 27.3009 34.6939 27.4 34.55C27.5225 34.0915 27.5725 33.6248 27.55 33.15Z"
                  fill="#724617"
                />
                <path
                  d="M74.65 34.95C74.877 35.0111 75.044 35.1445 75.15 35.35C75.221 35.6786 75.254 36.0119 75.25 36.35C75.162 36.0977 75.078 35.831 75 35.55C74.982 35.8695 74.932 36.1695 74.85 36.45C74.915 36.0161 74.815 35.6327 74.55 35.3C74.455 35.2517 74.355 35.2351 74.25 35.25C74.408 35.1857 74.541 35.0857 74.65 34.95Z"
                  fill="#9792FB"
                />
                <path
                  d="M74.65 34.95C74.541 35.0857 74.408 35.1857 74.25 35.25C74.217 35.35 74.15 35.4167 74.05 35.45C73.962 35.4631 73.896 35.4298 73.85 35.35C73.952 35.2148 74.052 35.0815 74.15 34.95C74.317 34.8167 74.483 34.8167 74.65 34.95Z"
                  fill="#B9B5FF"
                />
                <path
                  d="M74.25 35.25C74.355 35.2351 74.455 35.2517 74.55 35.3C74.815 35.6327 74.915 36.0161 74.85 36.45C74.719 36.8805 74.452 37.0472 74.05 36.95C73.783 36.4495 73.783 35.9495 74.05 35.45C74.15 35.4167 74.217 35.35 74.25 35.25Z"
                  fill="#4F5254"
                />
                <path
                  d="M74.15 34.95C74.052 35.0815 73.952 35.2148 73.85 35.35C73.896 35.4298 73.962 35.4631 74.05 35.45C73.783 35.9495 73.783 36.4495 74.05 36.95C73.954 36.9047 73.871 36.8381 73.8 36.75C73.752 36.8448 73.735 36.9448 73.75 37.05C73.678 37.0082 73.628 36.9416 73.6 36.85C73.533 36.4167 73.533 35.9833 73.6 35.55C73.671 35.2359 73.855 35.0359 74.15 34.95Z"
                  fill="#9B99FB"
                />
                <path
                  d="M75.25 36.35C75.201 36.4995 75.134 36.6329 75.05 36.75C74.721 37.2829 74.288 37.3829 73.75 37.05C73.735 36.9448 73.752 36.8448 73.8 36.75C73.871 36.8381 73.954 36.9047 74.05 36.95C74.452 37.0472 74.719 36.8805 74.85 36.45C74.932 36.1695 74.982 35.8695 75 35.55C75.078 35.831 75.162 36.0977 75.25 36.35Z"
                  fill="#BCBAFB"
                />
                <path
                  d="M75.05 36.75C75.038 37.0292 74.904 37.2292 74.65 37.35C74.379 37.4777 74.113 37.461 73.85 37.3C73.775 37.2329 73.741 37.1496 73.75 37.05C74.288 37.3829 74.721 37.2829 75.05 36.75Z"
                  fill="#7371E0"
                />
                <path
                  d="M107.85 38.25C106.712 38.306 105.579 38.406 104.45 38.55C104.45 39.2167 104.45 39.8833 104.45 40.55C104.417 40.55 104.383 40.55 104.35 40.55C104.35 39.8833 104.35 39.2167 104.35 38.55C104.117 38.55 103.883 38.55 103.65 38.55C104.372 38.4057 105.105 38.2557 105.85 38.1C105.717 38.0333 105.583 37.9667 105.45 37.9C105.519 37.5053 105.636 37.122 105.8 36.75C106.21 36.9802 106.343 37.3135 106.2 37.75C106.307 37.8191 106.423 37.8691 106.55 37.9C106.483 37.9333 106.417 37.9667 106.35 38C107.219 38.0582 108.086 38.0248 108.95 37.9C108.762 37.8784 108.595 37.8117 108.45 37.7C108.567 37.6647 108.684 37.6813 108.8 37.75C108.906 37.737 108.989 37.687 109.05 37.6C108.9 37.1585 109 36.7752 109.35 36.45C109.51 36.6239 109.644 36.8239 109.75 37.05C109.677 37.2155 109.661 37.3821 109.7 37.55C109.733 37.5167 109.767 37.4833 109.8 37.45C109.831 37.5308 109.881 37.5975 109.95 37.65C110.694 37.6718 111.444 37.6051 112.2 37.45C112.217 37.4833 112.233 37.5167 112.25 37.55C112.162 37.6251 112.062 37.6751 111.95 37.7C110.561 37.8317 109.195 38.015 107.85 38.25Z"
                  fill="#757575"
                />
                <path
                  d="M107.85 38.25C106.773 38.4547 105.673 38.588 104.55 38.65C104.582 39.3022 104.549 39.9355 104.45 40.55C104.45 39.8833 104.45 39.2167 104.45 38.55C105.579 38.406 106.712 38.306 107.85 38.25Z"
                  fill="#A9A9A9"
                />
                <path
                  d="M14.15 38.25C14.2161 38.3718 14.2828 38.5051 14.35 38.65C14.6213 38.3786 14.7046 38.4453 14.6 38.85C14.5047 39.0592 14.3714 39.0925 14.2 38.95C14.0585 38.7157 14.0418 38.4823 14.15 38.25Z"
                  fill="#4E4E4F"
                />
                <path
                  d="M18.55 38.65C18.6943 38.7335 18.7943 38.8668 18.85 39.05C18.9086 39.0291 18.9586 38.9957 19 38.95C19.1174 39.3661 18.9841 39.4995 18.6 39.35C18.4482 39.1187 18.4316 38.8854 18.55 38.65Z"
                  fill="#4A4A4B"
                />
                <path
                  d="M99.45 39.15C99.483 39.15 99.517 39.15 99.55 39.15C99.731 39.2918 99.797 39.4918 99.75 39.75C99.65 39.75 99.55 39.75 99.45 39.75C99.45 39.55 99.45 39.35 99.45 39.15Z"
                  fill="#3736E9"
                />
                <path
                  d="M101.65 38.75C101.039 38.8933 100.406 38.9766 99.75 39C99.658 39.0278 99.592 39.0778 99.55 39.15C99.517 39.15 99.483 39.15 99.45 39.15C98.697 39.1626 97.964 39.2293 97.25 39.35C96.541 39.4755 95.841 39.5755 95.15 39.65C95.117 39.65 95.083 39.65 95.05 39.65C94.663 39.6185 94.296 39.6518 93.95 39.75C93.596 39.7187 93.262 39.7521 92.95 39.85C92.75 39.85 92.55 39.85 92.35 39.85C93.164 39.6752 93.997 39.5252 94.85 39.4C97.12 39.2015 99.386 38.9848 101.65 38.75Z"
                  fill="#67676C"
                />
                <path
                  d="M103.65 38.55C103.883 38.55 104.117 38.55 104.35 38.55C104.35 39.2167 104.35 39.8833 104.35 40.55C104.35 41.0833 104.35 41.6167 104.35 42.15C104.228 42.0972 104.111 42.0305 104 41.95C103.967 41.9833 103.933 42.0167 103.9 42.05C103.157 41.9659 102.407 41.8993 101.65 41.85C100.699 41.9014 99.732 41.968 98.75 42.05C98.415 42.0665 98.082 42.0498 97.75 42C98.223 41.8534 98.69 41.6867 99.15 41.5C98.569 41.5625 98.002 41.5625 97.45 41.5C97.846 41.3351 98.213 41.1184 98.55 40.85C98.812 40.4596 99.062 40.0596 99.3 39.65C99.427 39.8578 99.577 39.8912 99.75 39.75C99.797 39.4918 99.731 39.2918 99.55 39.15C99.592 39.0778 99.658 39.0278 99.75 39C100.406 38.9766 101.039 38.8933 101.65 38.75C102.298 38.6402 102.965 38.5735 103.65 38.55Z"
                  fill="#48484D"
                />
                <path
                  d="M101.05 39.05C101.165 39.0791 101.232 39.1624 101.25 39.3C101.217 39.3833 101.183 39.4667 101.15 39.55C101.055 39.3955 101.021 39.2288 101.05 39.05Z"
                  fill="#2E2DEA"
                />
                <path
                  d="M91.35 39.95C91.35 39.9833 91.35 40.0167 91.35 40.05C89.319 40.2659 87.286 40.4659 85.25 40.65C85.713 40.4284 86.213 40.3117 86.75 40.3C88.282 40.1649 89.816 40.0482 91.35 39.95Z"
                  fill="#696875"
                />
                <path
                  d="M29.55 41.55C29.3167 41.55 29.0833 41.55 28.85 41.55C28.0837 41.4567 27.317 41.3567 26.55 41.25C26.4833 41.25 26.4167 41.25 26.35 41.25C25.8482 41.1898 25.3482 41.1232 24.85 41.05C24.75 41.05 24.65 41.05 24.55 41.05C24.0493 41.0249 23.5493 40.9916 23.05 40.95C23.0158 40.8662 22.9492 40.8328 22.85 40.85C22.8167 40.85 22.7833 40.85 22.75 40.85C21.346 40.7533 19.946 40.6199 18.55 40.45C18.55 40.65 18.55 40.85 18.55 41.05C18.4532 40.8393 18.4198 40.6059 18.45 40.35C20.8844 40.5061 23.3177 40.6895 25.75 40.9C27.0535 41.0308 28.3202 41.2475 29.55 41.55Z"
                  fill="#737276"
                />
                <path
                  d="M91.35 40.05C91.619 40.0336 91.885 40.0503 92.15 40.1C91.902 40.1424 91.669 40.2257 91.45 40.35C91.261 40.1867 91.111 40.22 91 40.45C90.9 40.4167 90.8 40.3833 90.7 40.35C90.162 40.5033 89.612 40.62 89.05 40.7C88.263 40.7476 87.479 40.8309 86.7 40.95C86.505 40.8544 86.322 40.8211 86.15 40.85C86.023 41.018 85.856 41.1347 85.65 41.2C83.823 41.4476 82.007 41.631 80.2 41.75C79.603 41.8111 79.019 41.9278 78.45 42.1C77.383 42.1154 76.333 42.232 75.3 42.45C75.096 42.3715 74.896 42.4048 74.7 42.55C74.659 42.5043 74.609 42.4709 74.55 42.45C74.029 42.4981 73.529 42.6147 73.05 42.8C70.39 43.0376 67.757 43.3209 65.15 43.65C64.962 43.6393 64.929 43.6893 65.05 43.8C64.921 43.849 64.787 43.8657 64.65 43.85C64.628 43.5721 64.661 43.3054 64.75 43.05C66.325 42.8074 67.891 42.6074 69.45 42.45C73.207 42.097 76.94 41.6636 80.65 41.15C80.717 41.15 80.783 41.15 80.85 41.15C82.274 41.0573 83.674 40.8906 85.05 40.65C85.117 40.65 85.183 40.65 85.25 40.65C87.286 40.4659 89.319 40.2659 91.35 40.05Z"
                  fill="#5857F2"
                />
                <path
                  d="M93.95 39.75C94.296 39.6518 94.663 39.6185 95.05 39.65C95.092 39.7222 95.158 39.7722 95.25 39.8C95.117 40.0667 94.917 40.2667 94.65 40.4C93.56 40.9784 92.427 41.445 91.25 41.8C90.269 41.9363 89.302 42.1363 88.35 42.4C88.45 42.4333 88.55 42.4667 88.65 42.5C86.353 42.8578 84.07 43.2411 81.8 43.65C81.66 43.5949 81.527 43.5616 81.4 43.55C79.615 43.9817 77.698 44.265 75.65 44.4C73.246 44.7482 70.863 45.0649 68.5 45.35C68.102 45.3495 67.702 45.3495 67.3 45.35C66.909 45.5061 66.526 45.6061 66.15 45.65C65.83 45.5873 65.513 45.5206 65.2 45.45C65.06 45.5051 64.927 45.5384 64.8 45.55C64.366 45.2571 63.899 45.1571 63.4 45.25C63.218 45.1671 63.035 45.0837 62.85 45C62.562 44.5914 62.229 44.2247 61.85 43.9C61.501 43.7996 61.184 43.8496 60.9 44.05C60.764 43.962 60.614 43.9286 60.45 43.95C60.474 43.8209 60.44 43.7209 60.35 43.65C60.629 43.5523 60.929 43.519 61.25 43.55C61.549 43.3727 61.882 43.306 62.25 43.35C62.25 43.6167 62.25 43.8833 62.25 44.15C62.35 44.15 62.45 44.15 62.55 44.15C62.65 44.15 62.75 44.15 62.85 44.15C62.85 44.2167 62.85 44.2833 62.85 44.35C62.945 44.561 63.112 44.6777 63.35 44.7C63.902 44.7347 64.452 44.7847 65 44.85C65.66 44.7944 66.326 44.6944 67 44.55C67.238 44.5482 67.455 44.6149 67.65 44.75C68.399 44.6002 69.149 44.4669 69.9 44.35C70.601 44.3783 71.268 44.3783 71.9 44.35C72.133 44.2833 72.367 44.2167 72.6 44.15C72.791 44.1421 72.991 44.1754 73.2 44.25C73.358 44.0945 73.542 43.9778 73.75 43.9C75.85 43.6211 77.95 43.3878 80.05 43.2C80.356 43.1152 80.656 43.0152 80.95 42.9C82.696 42.8172 84.413 42.5672 86.1 42.15C86.133 42.1833 86.167 42.2167 86.2 42.25C88.236 41.9224 90.253 41.5724 92.25 41.2C93.056 40.8635 93.79 40.4969 94.45 40.1C94.517 40 94.583 39.9 94.65 39.8C94.419 39.7503 94.186 39.7337 93.95 39.75Z"
                  fill="#4C4C97"
                />
                <path
                  d="M85.05 40.65C83.674 40.8906 82.274 41.0573 80.85 41.15C81.694 40.9545 82.561 40.8045 83.45 40.7C83.982 40.6501 84.516 40.6334 85.05 40.65Z"
                  fill="#666572"
                />
                <path
                  d="M22.75 40.85C22.75 41.1167 22.75 41.3833 22.75 41.65C22.85 41.65 22.95 41.65 23.05 41.65C23.05 41.4167 23.05 41.1833 23.05 40.95C23.5493 40.9916 24.0493 41.0249 24.55 41.05C24.55 41.0833 24.55 41.1167 24.55 41.15C24.55 41.3833 24.55 41.6167 24.55 41.85C24.6833 41.85 24.8167 41.85 24.95 41.85C24.9802 41.5941 24.9468 41.3607 24.85 41.15C24.85 41.1167 24.85 41.0833 24.85 41.05C25.3482 41.1232 25.8482 41.1898 26.35 41.25C26.3611 41.3117 26.3944 41.3617 26.45 41.4C26.2717 41.5067 26.2217 41.6567 26.3 41.85C26.7554 42.2387 27.1387 42.6887 27.45 43.2C27.994 43.5709 28.494 43.9875 28.95 44.45C28.227 44.2424 27.4937 44.0758 26.75 43.95C26.2882 43.8781 25.8215 43.8281 25.35 43.8C25.2167 43.7 25.0833 43.6 24.95 43.5C24.2313 43.2761 23.548 43.0594 22.9 42.85C22.6474 42.8565 22.4141 42.9232 22.2 43.05C21.9667 42.9833 21.7333 42.9167 21.5 42.85C20.6259 43.0221 19.7426 43.1554 18.85 43.25C18.7914 43.2291 18.7414 43.1957 18.7 43.15C18.6502 43.4817 18.6335 43.815 18.65 44.15C18.6167 44.15 18.5833 44.15 18.55 44.15C18.55 43.1167 18.55 42.0833 18.55 41.05C18.55 40.85 18.55 40.65 18.55 40.45C19.946 40.6199 21.346 40.7533 22.75 40.85Z"
                  fill="#1E1E25"
                />
                <path
                  d="M71.45 40.35C71.781 40.5446 71.831 40.8113 71.6 41.15C71.383 41.3 71.233 41.25 71.15 41C71.291 40.8022 71.391 40.5855 71.45 40.35Z"
                  fill="#444445"
                />
                <path
                  d="M80.65 41.15C76.94 41.6636 73.207 42.097 69.45 42.45C69.461 42.3883 69.494 42.3383 69.55 42.3C73.257 41.8627 76.957 41.4794 80.65 41.15Z"
                  fill="#676673"
                />
                <path
                  d="M22.85 40.85C22.9492 40.8328 23.0158 40.8662 23.05 40.95C22.9691 41.1292 22.9191 41.3292 22.9 41.55C22.8503 41.319 22.8337 41.0857 22.85 40.85Z"
                  fill="#2E2DD9"
                />
                <path
                  d="M24.55 41.15C24.6165 41.3369 24.6831 41.5369 24.75 41.75C24.8466 41.5604 24.8799 41.3604 24.85 41.15C24.9468 41.3607 24.9802 41.5941 24.95 41.85C24.8167 41.85 24.6833 41.85 24.55 41.85C24.55 41.6167 24.55 41.3833 24.55 41.15Z"
                  fill="#212190"
                />
                <path
                  d="M99.45 39.15C99.45 39.35 99.45 39.55 99.45 39.75C99.55 39.75 99.65 39.75 99.75 39.75C99.577 39.8912 99.427 39.8578 99.3 39.65C99.062 40.0596 98.812 40.4596 98.55 40.85C98.213 41.1184 97.846 41.3351 97.45 41.5C98.002 41.5625 98.569 41.5625 99.15 41.5C98.69 41.6867 98.223 41.8534 97.75 42C98.082 42.0498 98.415 42.0665 98.75 42.05C98.283 42.1833 97.817 42.3167 97.35 42.45C97.021 42.5461 96.687 42.5295 96.35 42.4C96.55 42.3333 96.75 42.2667 96.95 42.2C96.85 42.1833 96.75 42.1667 96.65 42.15C96.254 42.249 95.854 42.3156 95.45 42.35C95.219 42.3993 94.986 42.4326 94.75 42.45C94.562 42.4607 94.529 42.4107 94.65 42.3C94.936 42.1601 95.236 42.0601 95.55 42C95.35 41.9667 95.15 41.9333 94.95 41.9C95.363 41.6698 95.763 41.4198 96.15 41.15C96.397 40.7533 96.697 40.4033 97.05 40.1C97.271 39.9956 97.505 39.929 97.75 39.9C97.905 39.6219 98.139 39.4552 98.45 39.4C98.219 39.3503 97.986 39.3337 97.75 39.35C97.583 39.35 97.417 39.35 97.25 39.35C97.964 39.2293 98.697 39.1626 99.45 39.15Z"
                  fill="#444453"
                />
                <path
                  d="M22.75 40.85C22.7833 40.85 22.8167 40.85 22.85 40.85C22.8337 41.0857 22.8503 41.319 22.9 41.55C22.9191 41.3292 22.9691 41.1292 23.05 40.95C23.05 41.1833 23.05 41.4167 23.05 41.65C22.95 41.65 22.85 41.65 22.75 41.65C22.75 41.3833 22.75 41.1167 22.75 40.85Z"
                  fill="#201F7B"
                />
                <path
                  d="M24.55 41.15C24.55 41.1167 24.55 41.0833 24.55 41.05C24.65 41.05 24.75 41.05 24.85 41.05C24.85 41.0833 24.85 41.1167 24.85 41.15C24.8799 41.3604 24.8466 41.5604 24.75 41.75C24.6831 41.5369 24.6165 41.3369 24.55 41.15Z"
                  fill="#3433FB"
                />
                <path
                  d="M41.85 41.05C41.95 41.05 42.05 41.05 42.15 41.05C42.1633 41.3896 42.2633 41.4229 42.45 41.15C42.6212 41.4797 42.5379 41.713 42.2 41.85C41.833 41.6834 41.7163 41.4167 41.85 41.05Z"
                  fill="#4D4D4D"
                />
                <path
                  d="M66.35 40.85C66.412 40.8611 66.462 40.8944 66.5 40.95C66.567 41.2167 66.567 41.4833 66.5 41.75C66.221 41.9184 66.038 41.8517 65.95 41.55C66.111 41.3275 66.244 41.0941 66.35 40.85Z"
                  fill="#454545"
                />
                <path
                  d="M29.75 41.65C29.75 41.6167 29.75 41.5833 29.75 41.55C30.4508 41.5334 31.1508 41.55 31.85 41.6C32.4887 41.6576 33.0887 41.7742 33.65 41.95C33.35 41.95 33.05 41.95 32.75 41.95C32.1699 41.8318 31.5699 41.7652 30.95 41.75C30.8167 41.75 30.6833 41.75 30.55 41.75C30.3052 41.6527 30.0385 41.6194 29.75 41.65Z"
                  fill="#747381"
                />
                <path
                  d="M91.35 40.05C91.35 40.0167 91.35 39.9833 91.35 39.95C91.683 39.95 92.017 39.95 92.35 39.95C92.553 39.9338 92.753 39.9505 92.95 40C92.786 40.1935 92.603 40.2435 92.4 40.15C91.486 40.4286 90.569 40.6786 89.65 40.9C86.166 41.4353 82.666 41.8686 79.15 42.2C78.983 42.2985 78.816 42.3819 78.65 42.45C77.514 42.4414 76.381 42.4914 75.25 42.6C72.46 43.0175 69.66 43.3842 66.85 43.7C66.265 43.7818 65.698 43.7652 65.15 43.65C67.757 43.3209 70.39 43.0376 73.05 42.8C73.529 42.6147 74.029 42.4981 74.55 42.45C74.609 42.4709 74.659 42.5043 74.7 42.55C74.896 42.4048 75.096 42.3715 75.3 42.45C76.333 42.232 77.383 42.1154 78.45 42.1C79.019 41.9278 79.603 41.8111 80.2 41.75C82.007 41.631 83.823 41.4476 85.65 41.2C85.856 41.1347 86.023 41.018 86.15 40.85C86.322 40.8211 86.505 40.8544 86.7 40.95C87.479 40.8309 88.263 40.7476 89.05 40.7C89.612 40.62 90.162 40.5033 90.7 40.35C90.8 40.3833 90.9 40.4167 91 40.45C91.111 40.22 91.261 40.1867 91.45 40.35C91.669 40.2257 91.902 40.1424 92.15 40.1C91.885 40.0503 91.619 40.0336 91.35 40.05Z"
                  fill="#5555DC"
                />
                <path
                  d="M92.35 39.95C92.35 39.9167 92.35 39.8833 92.35 39.85C92.55 39.85 92.75 39.85 92.95 39.85C93.285 39.8335 93.618 39.8502 93.95 39.9C93.875 39.9671 93.841 40.0504 93.85 40.15C93.213 40.056 92.63 40.2227 92.1 40.65C91.603 40.7754 91.12 40.9254 90.65 41.1C89.437 41.1698 88.237 41.3365 87.05 41.6C85.474 41.6349 83.907 41.7683 82.35 42C81.137 42.2925 79.904 42.4425 78.65 42.45C78.816 42.3819 78.983 42.2985 79.15 42.2C82.666 41.8686 86.166 41.4353 89.65 40.9C90.569 40.6786 91.486 40.4286 92.4 40.15C92.603 40.2435 92.786 40.1935 92.95 40C92.753 39.9505 92.553 39.9338 92.35 39.95Z"
                  fill="#5353C8"
                />
                <path
                  d="M97.75 39.35C97.986 39.3337 98.219 39.3503 98.45 39.4C98.139 39.4552 97.905 39.6219 97.75 39.9C97.505 39.929 97.271 39.9956 97.05 40.1C96.697 40.4033 96.397 40.7533 96.15 41.15C95.763 41.4198 95.363 41.6698 94.95 41.9C95.15 41.9333 95.35 41.9667 95.55 42C95.236 42.0601 94.936 42.1601 94.65 42.3C94.529 42.4107 94.562 42.4607 94.75 42.45C94.16 42.5365 93.56 42.6365 92.95 42.75C92.451 42.8222 91.951 42.8388 91.45 42.8C92.112 42.6737 92.745 42.5403 93.35 42.4C93.153 42.3505 92.953 42.3338 92.75 42.35C93.037 42.2675 93.337 42.1841 93.65 42.1C94.019 41.7825 94.419 41.5158 94.85 41.3C94.783 41.2667 94.717 41.2333 94.65 41.2C95.329 40.7164 95.913 40.1997 96.4 39.65C96.84 39.7467 97.29 39.78 97.75 39.75C97.75 39.6167 97.75 39.4833 97.75 39.35Z"
                  fill="#454568"
                />
                <path
                  d="M104.35 42.15C106.94 42.3914 109.54 42.6747 112.15 43C112.443 43.0606 112.726 43.144 113 43.25C113.05 43.481 113.066 43.7143 113.05 43.95C113.017 43.95 112.983 43.95 112.95 43.95C112.95 43.8167 112.95 43.6833 112.95 43.55C110.116 43.95 107.283 44.35 104.45 44.75C104.317 44.75 104.183 44.75 104.05 44.75C104.082 44.3298 104.048 43.9298 103.95 43.55C103.852 43.4185 103.752 43.2852 103.65 43.15C103.955 43.0125 104.088 42.7792 104.05 42.45C103.613 42.4467 103.18 42.48 102.75 42.55C101.274 42.578 99.807 42.7114 98.35 42.95C97.754 42.8759 97.721 42.7259 98.25 42.5C97.936 42.5095 97.636 42.4928 97.35 42.45C97.817 42.3167 98.283 42.1833 98.75 42.05C99.732 41.968 100.699 41.9014 101.65 41.85C102.407 41.8993 103.157 41.9659 103.9 42.05C103.933 42.0167 103.967 41.9833 104 41.95C104.111 42.0305 104.228 42.0972 104.35 42.15Z"
                  fill="#3A3A3B"
                />
                <path
                  d="M36.85 42.25C38.052 42.2477 39.252 42.2977 40.45 42.4C40.6044 42.429 40.7377 42.4956 40.85 42.6C43.0524 42.7649 45.2524 42.9483 47.45 43.15C47.45 43.25 47.45 43.35 47.45 43.45C46.9595 43.3555 46.4595 43.3221 45.95 43.35C45.7833 43.2167 45.6167 43.2167 45.45 43.35C44.862 43.1853 44.262 43.0853 43.65 43.05C43.4435 43.0483 43.2435 43.015 43.05 42.95C40.9573 42.8132 38.8907 42.5799 36.85 42.25Z"
                  fill="#7E7C89"
                />
                <path
                  d="M32.75 41.95C33.05 41.95 33.35 41.95 33.65 41.95C34.7061 42.138 35.7728 42.238 36.85 42.25C38.8907 42.5799 40.9573 42.8132 43.05 42.95C43.2545 43.0923 43.3545 43.2923 43.35 43.55C43.2833 43.65 43.2167 43.75 43.15 43.85C43.0596 43.7791 43.0263 43.6791 43.05 43.55C40.2709 43.3321 37.5042 43.0488 34.75 42.7C34.1434 42.4601 33.5101 42.2935 32.85 42.2C32.7001 42.1162 32.6668 42.0329 32.75 41.95Z"
                  fill="#3736D3"
                />
                <path
                  d="M103.95 43.55C103.95 43.65 103.95 43.75 103.95 43.85C102.023 44.1513 100.09 44.4346 98.15 44.7C97.29 44.7946 96.44 44.7446 95.6 44.55C95.483 44.5833 95.367 44.6167 95.25 44.65C95.408 44.7298 95.574 44.7798 95.75 44.8C95.594 44.8318 95.477 44.9151 95.4 45.05C95.367 45.0167 95.333 44.9833 95.3 44.95C94.64 45.015 93.99 45.0816 93.35 45.15C93.317 45.15 93.283 45.15 93.25 45.15C90.164 45.3645 87.097 45.7311 84.05 46.25C83.281 46.2906 82.514 46.3572 81.75 46.45C81.45 46.45 81.15 46.45 80.85 46.45C80.695 46.4821 80.629 46.5821 80.65 46.75C79.48 46.8254 78.313 46.9421 77.15 47.1C74.835 47.4909 72.502 47.8242 70.15 48.1C69.072 48.2989 68.005 48.4822 66.95 48.65C64.75 48.9056 62.55 49.1723 60.35 49.45C60.303 50.0491 60.27 50.6491 60.25 51.25C59.719 51.3098 59.185 51.3431 58.65 51.35C58.841 50.8289 58.908 50.2955 58.85 49.75C58.728 49.6904 58.595 49.6737 58.45 49.7C58.537 49.5955 58.637 49.5122 58.75 49.45C58.756 49.5043 58.789 49.5376 58.85 49.55C59.108 49.308 59.208 49.008 59.15 48.65C59.243 48.5432 59.277 48.4099 59.25 48.25C59.591 48.1097 59.958 48.043 60.35 48.05C60.35 48.15 60.35 48.25 60.35 48.35C60.451 48.4765 60.601 48.5431 60.8 48.55C64.38 48.056 67.964 47.5894 71.55 47.15C71.908 47.1451 72.241 47.0785 72.55 46.95C75.005 46.6639 77.438 46.3305 79.85 45.95C83.16 45.5904 86.46 45.1571 89.75 44.65C90.12 44.5882 90.487 44.5049 90.85 44.4C90.662 44.3802 90.495 44.3302 90.35 44.25C91.114 44.1673 91.881 44.1007 92.65 44.05C93.008 44.0518 93.358 44.0852 93.7 44.15C94 44.0973 94.25 43.964 94.45 43.75C95.761 43.4344 97.094 43.2511 98.45 43.2C99.901 43.0065 101.334 42.7898 102.75 42.55C103.18 42.48 103.613 42.4467 104.05 42.45C104.088 42.7792 103.955 43.0125 103.65 43.15C103.752 43.2852 103.852 43.4185 103.95 43.55Z"
                  fill="#020109"
                />
                <path
                  d="M92.95 39.85C93.262 39.7521 93.596 39.7187 93.95 39.75C94.186 39.7337 94.419 39.7503 94.65 39.8C94.583 39.9 94.517 40 94.45 40.1C93.79 40.4969 93.056 40.8635 92.25 41.2C90.253 41.5724 88.236 41.9224 86.2 42.25C86.167 42.2167 86.133 42.1833 86.1 42.15C84.413 42.5672 82.696 42.8172 80.95 42.9C80.656 43.0152 80.356 43.1152 80.05 43.2C77.95 43.3878 75.85 43.6211 73.75 43.9C73.542 43.9778 73.358 44.0945 73.2 44.25C72.991 44.1754 72.791 44.1421 72.6 44.15C72.367 44.2167 72.133 44.2833 71.9 44.35C71.268 44.3783 70.601 44.3783 69.9 44.35C69.149 44.4669 68.399 44.6002 67.65 44.75C67.455 44.6149 67.238 44.5482 67 44.55C66.326 44.6944 65.66 44.7944 65 44.85C64.452 44.7847 63.902 44.7347 63.35 44.7C63.112 44.6777 62.945 44.561 62.85 44.35C64.534 44.4653 66.151 44.4653 67.7 44.35C68.009 44.2333 68.309 44.2 68.6 44.25C69.781 44.1543 70.948 43.9876 72.1 43.75C72.172 43.8059 72.256 43.8392 72.35 43.85C74.413 43.6051 76.463 43.3051 78.5 42.95C78.556 43.0022 78.623 43.0355 78.7 43.05C82.599 42.5473 86.482 41.964 90.35 41.3C91.192 41.0958 92.025 40.8625 92.85 40.6C93.223 40.5089 93.556 40.3589 93.85 40.15C93.841 40.0504 93.875 39.9671 93.95 39.9C93.618 39.8502 93.285 39.8335 92.95 39.85Z"
                  fill="#4F4FA7"
                />
                <path
                  d="M69.45 42.45C67.891 42.6074 66.325 42.8074 64.75 43.05C64.65 43.05 64.55 43.05 64.45 43.05C64.194 43.0198 63.961 43.0532 63.75 43.15C63.339 43.174 62.939 43.2407 62.55 43.35C62.45 43.35 62.35 43.35 62.25 43.35C61.882 43.306 61.549 43.3727 61.25 43.55C61.25 43.4167 61.25 43.2833 61.25 43.15C63.982 42.8619 66.715 42.6286 69.45 42.45Z"
                  fill="#6A6971"
                />
                <path
                  d="M95.45 42.35C95.461 42.4117 95.494 42.4617 95.55 42.5C94.852 42.5908 94.818 42.6908 95.45 42.8C95.083 42.9104 94.75 43.0771 94.45 43.3C94.531 43.3308 94.597 43.3808 94.65 43.45C94.539 43.5265 94.472 43.6265 94.45 43.75C93.816 43.4899 93.183 43.4899 92.55 43.75C92.35 43.7167 92.15 43.6833 91.95 43.65C91.492 43.7986 91.025 43.8486 90.55 43.8C91.164 43.6246 91.764 43.4246 92.35 43.2C92.617 43.1333 92.617 43.0667 92.35 43C92.561 42.9155 92.761 42.8322 92.95 42.75C93.56 42.6365 94.16 42.5365 94.75 42.45C94.986 42.4326 95.219 42.3993 95.45 42.35Z"
                  fill="#353553"
                />
                <path
                  d="M26.35 41.25C26.4167 41.25 26.4833 41.25 26.55 41.25C26.5421 41.393 26.5754 41.5264 26.65 41.65C27.0312 41.8085 27.3812 41.8418 27.7 41.75C28.1001 42.1005 28.4501 42.5005 28.75 42.95C29.2225 43.0362 29.6225 43.2528 29.95 43.6C29.7244 43.5385 29.4911 43.5052 29.25 43.5C29.7132 43.9311 30.2466 44.2311 30.85 44.4C30.9701 44.4903 31.0535 44.6069 31.1 44.75C31.1561 44.6978 31.2228 44.6645 31.3 44.65C32.0105 44.931 32.7272 45.1643 33.45 45.35C33.0904 45.3847 32.7571 45.318 32.45 45.15C32.0129 45.3026 31.6129 45.2359 31.25 44.95C31.1833 44.9833 31.1167 45.0167 31.05 45.05C30.6804 44.8268 30.2804 44.7268 29.85 44.75C29.5465 44.6626 29.2465 44.5626 28.95 44.45C28.494 43.9875 27.994 43.5709 27.45 43.2C27.1387 42.6887 26.7554 42.2387 26.3 41.85C26.2217 41.6567 26.2717 41.5067 26.45 41.4C26.3944 41.3617 26.3611 41.3117 26.35 41.25Z"
                  fill="#1D1D3A"
                />
                <path
                  d="M63.75 43.15C63.961 43.0532 64.194 43.0198 64.45 43.05C64.45 43.1167 64.45 43.1833 64.45 43.25C64.228 43.1631 63.995 43.1298 63.75 43.15Z"
                  fill="#4D4B9F"
                />
                <path
                  d="M78.65 42.45C78.368 42.5507 78.068 42.634 77.75 42.7C73.415 43.1217 69.098 43.605 64.8 44.15C64.128 44.057 63.478 44.057 62.85 44.15C62.75 44.15 62.65 44.15 62.55 44.15C62.55 43.8833 62.55 43.6167 62.55 43.35C62.939 43.2407 63.339 43.174 63.75 43.15C63.995 43.1298 64.228 43.1631 64.45 43.25C64.403 43.5082 64.469 43.7082 64.65 43.85C64.787 43.8657 64.921 43.849 65.05 43.8C64.929 43.6893 64.962 43.6393 65.15 43.65C65.698 43.7652 66.265 43.7818 66.85 43.7C69.66 43.3842 72.46 43.0175 75.25 42.6C76.381 42.4914 77.514 42.4414 78.65 42.45Z"
                  fill="#5353CF"
                />
                <path
                  d="M97.35 42.45C97.636 42.4928 97.936 42.5095 98.25 42.5C97.721 42.7259 97.754 42.8759 98.35 42.95C99.807 42.7114 101.274 42.578 102.75 42.55C101.334 42.7898 99.901 43.0065 98.45 43.2C97.094 43.2511 95.761 43.4344 94.45 43.75C94.472 43.6265 94.539 43.5265 94.65 43.45C94.597 43.3808 94.531 43.3308 94.45 43.3C94.75 43.0771 95.083 42.9104 95.45 42.8C94.818 42.6908 94.852 42.5908 95.55 42.5C95.494 42.4617 95.461 42.4117 95.45 42.35C95.854 42.3156 96.254 42.249 96.65 42.15C96.75 42.1667 96.85 42.1833 96.95 42.2C96.75 42.2667 96.55 42.3333 96.35 42.4C96.687 42.5295 97.021 42.5461 97.35 42.45Z"
                  fill="#2D2D39"
                />
                <path
                  d="M26.75 43.95C27.2015 44.3301 27.7015 44.6467 28.25 44.9C27.9247 45.0036 27.5914 45.0703 27.25 45.1C27.6828 45.363 28.1828 45.563 28.75 45.7C28.5618 45.7198 28.3952 45.7698 28.25 45.85C26.6279 45.6422 25.0279 45.3256 23.45 44.9C21.9583 44.6694 20.4583 44.5528 18.95 44.55C18.95 44.65 18.95 44.75 18.95 44.85C18.7706 44.6572 18.6706 44.4238 18.65 44.15C18.6335 43.815 18.6502 43.4817 18.7 43.15C18.7414 43.1957 18.7914 43.2291 18.85 43.25C19.7426 43.1554 20.6259 43.0221 21.5 42.85C21.7333 42.9167 21.9667 42.9833 22.2 43.05C22.4141 42.9232 22.6474 42.8565 22.9 42.85C23.548 43.0594 24.2313 43.2761 24.95 43.5C25.0833 43.6 25.2167 43.7 25.35 43.8C25.8215 43.8281 26.2882 43.8781 26.75 43.95Z"
                  fill="#15151A"
                />
                <path
                  d="M30.95 41.75C31.5699 41.7652 32.1699 41.8318 32.75 41.95C32.6668 42.0329 32.7001 42.1162 32.85 42.2C33.5101 42.2935 34.1434 42.4601 34.75 42.7C37.5042 43.0488 40.2709 43.3321 43.05 43.55C43.0263 43.6791 43.0596 43.7791 43.15 43.85C43.1217 43.9289 43.0717 43.9956 43 44.05C41.7917 43.9024 40.575 43.7858 39.35 43.7C37.2783 43.3561 35.2116 43.0228 33.15 42.7C32.9226 42.653 32.7226 42.553 32.55 42.4C32.1584 42.3542 31.775 42.2708 31.4 42.15C31.2025 42.0535 31.0525 41.9201 30.95 41.75Z"
                  fill="#3030AD"
                />
                <path
                  d="M64.45 43.05C64.55 43.05 64.65 43.05 64.75 43.05C64.661 43.3054 64.628 43.5721 64.65 43.85C64.469 43.7082 64.403 43.5082 64.45 43.25C64.45 43.1833 64.45 43.1167 64.45 43.05Z"
                  fill="#1D1D3E"
                />
                <path
                  d="M92.75 42.35C92.953 42.3338 93.153 42.3505 93.35 42.4C92.745 42.5403 92.112 42.6737 91.45 42.8C91.951 42.8388 92.451 42.8222 92.95 42.75C92.761 42.8322 92.561 42.9155 92.35 43C92.617 43.0667 92.617 43.1333 92.35 43.2C91.764 43.4246 91.164 43.6246 90.55 43.8C91.025 43.8486 91.492 43.7986 91.95 43.65C92.15 43.6833 92.35 43.7167 92.55 43.75C93.183 43.4899 93.816 43.4899 94.45 43.75C94.25 43.964 94 44.0973 93.7 44.15C93.358 44.0852 93.008 44.0518 92.65 44.05C91.881 44.1007 91.114 44.1673 90.35 44.25C89.649 44.2334 88.949 44.25 88.25 44.3C86.481 44.5504 84.714 44.8004 82.95 45.05C82.548 45.0816 82.148 45.0983 81.75 45.1C82.043 45.0394 82.326 44.956 82.6 44.85C82.641 44.8957 82.691 44.9291 82.75 44.95C83.193 44.845 83.626 44.7116 84.05 44.55C84.816 44.7199 85.483 44.5866 86.05 44.15C86.377 44.189 86.71 44.139 87.05 44C86.647 44.0507 86.247 44.034 85.85 43.95C86.618 43.8838 87.385 43.7338 88.15 43.5C88.05 43.4667 87.95 43.4333 87.85 43.4C89.487 43.0495 91.121 42.6995 92.75 42.35Z"
                  fill="#34345D"
                />
                <path
                  d="M28.85 41.55C29.0833 41.55 29.3167 41.55 29.55 41.55C29.6167 41.55 29.6833 41.55 29.75 41.55C29.75 41.5833 29.75 41.6167 29.75 41.65C29.6127 41.6343 29.4793 41.651 29.35 41.7C30.3686 42.3519 31.4686 42.8519 32.65 43.2C35.0831 43.8612 37.5331 44.2779 40 44.45C40.0333 44.5167 40.0667 44.5833 40.1 44.65C40.1368 44.509 40.2201 44.409 40.35 44.35C40.5422 44.5003 40.6588 44.7003 40.7 44.95C40.7414 44.9043 40.7914 44.8709 40.85 44.85C41.5387 45.0031 42.2387 45.0698 42.95 45.05C43.5896 45.0576 44.223 45.0076 44.85 44.9C45.0889 44.5241 45.4222 44.2741 45.85 44.15C45.9213 43.9224 45.9713 43.6891 46 43.45C46.05 43.5667 46.1333 43.65 46.25 43.7C46.4433 43.7251 46.6266 43.7751 46.8 43.85C46.8333 43.8167 46.8667 43.7833 46.9 43.75C46.9667 43.8833 47.0667 43.9833 47.2 44.05C47.3049 43.8893 47.4549 43.8227 47.65 43.85C47.65 43.9167 47.65 43.9833 47.65 44.05C47.5596 44.1209 47.5263 44.2209 47.55 44.35C47.1594 44.477 46.7594 44.5936 46.35 44.7C46.3167 44.7333 46.2833 44.7667 46.25 44.8C46.3851 44.9617 46.5518 45.0784 46.75 45.15C46.6643 45.2425 46.5643 45.3092 46.45 45.35C46.3768 45.2192 46.2934 45.0858 46.2 44.95C46.1259 45.0641 46.0425 45.0641 45.95 44.95C45.6244 45.2103 45.2744 45.3103 44.9 45.25C43.5194 45.5163 42.1694 45.4829 40.85 45.15C40.5123 45.2307 40.1623 45.2641 39.8 45.25C38.151 45.0257 36.501 44.7757 34.85 44.5C33.752 44.211 32.652 43.911 31.55 43.6C30.933 43.2081 30.2997 42.8414 29.65 42.5C29.3917 42.2245 29.1251 41.9745 28.85 41.75C28.85 41.6833 28.85 41.6167 28.85 41.55Z"
                  fill="#252565"
                />
                <path
                  d="M43.05 42.95C43.2435 43.015 43.4435 43.0483 43.65 43.05C43.65 43.1167 43.6167 43.15 43.55 43.15C43.4686 43.3631 43.4186 43.5964 43.4 43.85C43.3517 43.7552 43.3351 43.6552 43.35 43.55C43.3545 43.2923 43.2545 43.0923 43.05 42.95Z"
                  fill="#1A1A2E"
                />
                <path
                  d="M97.25 39.35C97.417 39.35 97.583 39.35 97.75 39.35C97.75 39.4833 97.75 39.6167 97.75 39.75C97.29 39.78 96.84 39.7467 96.4 39.65C95.913 40.1997 95.329 40.7164 94.65 41.2C94.717 41.2333 94.783 41.2667 94.85 41.3C94.419 41.5158 94.019 41.7825 93.65 42.1C93.337 42.1841 93.037 42.2675 92.75 42.35C91.121 42.6995 89.487 43.0495 87.85 43.4C87.95 43.4333 88.05 43.4667 88.15 43.5C87.385 43.7338 86.618 43.8838 85.85 43.95C85.718 43.967 85.601 43.9337 85.5 43.85C85.273 43.8982 85.056 44.0148 84.85 44.2C83.155 44.441 81.455 44.641 79.75 44.8C79.612 44.9625 79.445 45.0792 79.25 45.15C79.183 45.1167 79.117 45.0833 79.05 45.05C79.291 44.8429 79.557 44.6762 79.85 44.55C79.909 44.5709 79.959 44.6043 80 44.65C81.515 44.4336 83.031 44.217 84.55 44C84.76 43.9444 84.776 43.8944 84.6 43.85C83.587 43.8186 82.587 43.9519 81.6 44.25C81.489 44.2415 81.389 44.2081 81.3 44.15C80.764 44.299 80.214 44.3823 79.65 44.4C79.491 44.4862 79.325 44.5529 79.15 44.6C78.075 44.5688 77.008 44.7021 75.95 45C75.792 45.0707 75.642 45.154 75.5 45.25C75.293 45.2837 75.093 45.2171 74.9 45.05C74.592 45.2489 74.275 45.2823 73.95 45.15C73.091 45.254 72.241 45.3873 71.4 45.55C71.359 45.5043 71.309 45.4709 71.25 45.45C71.017 45.5833 70.783 45.7167 70.55 45.85C69.838 45.8136 69.155 45.8136 68.5 45.85C68.287 46.0065 68.071 46.0399 67.85 45.95C66.578 46.1837 65.311 46.3837 64.05 46.55C63.983 46.55 63.917 46.55 63.85 46.55C63.861 46.4883 63.894 46.4383 63.95 46.4C63.461 46.2509 62.944 46.2343 62.4 46.35C62.325 46.2874 62.242 46.2374 62.15 46.2C62.35 46.1667 62.55 46.1333 62.75 46.1C62.299 46.0737 61.866 45.9737 61.45 45.8C61.483 45.7667 61.517 45.7333 61.55 45.7C61.469 45.5887 61.403 45.4721 61.35 45.35C61.777 45.3063 62.177 45.3897 62.55 45.6C63.248 45.7582 63.948 45.7749 64.65 45.65C65.117 45.6963 65.584 45.7463 66.05 45.8C65.95 45.8333 65.85 45.8667 65.75 45.9C65.92 45.9958 66.103 46.0458 66.3 46.05C66.862 45.9142 67.429 45.8142 68 45.75C68.033 45.7833 68.067 45.8167 68.1 45.85C68.444 45.5832 68.794 45.5499 69.15 45.75C69.608 45.551 70.074 45.5176 70.55 45.65C70.834 45.4367 71.15 45.3034 71.5 45.25C71.9 45.25 72.3 45.25 72.7 45.25C73.435 45.1268 74.168 44.9934 74.9 44.85C75.047 44.8903 75.181 44.957 75.3 45.05C76.579 44.6358 77.896 44.4191 79.25 44.4C80.261 44.1078 81.294 43.9411 82.35 43.9C84.21 43.4912 86.094 43.1745 88 42.95C88.077 42.9645 88.144 42.9978 88.2 43.05C89.886 42.655 91.569 42.2384 93.25 41.8C93.083 41.7667 92.917 41.7333 92.75 41.7C93.704 41.329 94.571 40.8124 95.35 40.15C95.677 39.8039 95.611 39.6373 95.15 39.65C95.841 39.5755 96.541 39.4755 97.25 39.35Z"
                  fill="#414175"
                />
                <path
                  d="M43.65 43.05C44.262 43.0853 44.862 43.1853 45.45 43.35C45.45 43.3833 45.45 43.4167 45.45 43.45C45.4795 43.6735 45.4461 43.8735 45.35 44.05C45.3628 43.8345 45.3128 43.6345 45.2 43.45C44.8587 43.7518 44.4587 43.9185 44 43.95C43.9047 43.7408 43.7714 43.7075 43.6 43.85C43.5503 43.619 43.5337 43.3857 43.55 43.15C43.6167 43.15 43.65 43.1167 43.65 43.05Z"
                  fill="#3433C2"
                />
                <path
                  d="M45.95 43.35C45.792 43.5717 45.692 43.8384 45.65 44.15C45.5832 43.9031 45.5165 43.6698 45.45 43.45C45.45 43.4167 45.45 43.3833 45.45 43.35C45.6167 43.2167 45.7833 43.2167 45.95 43.35Z"
                  fill="#191823"
                />
                <path
                  d="M59.55 43.65C59.817 43.65 60.083 43.65 60.35 43.65C60.35 45.1167 60.35 46.5833 60.35 48.05C59.958 48.043 59.591 48.1097 59.25 48.25C59.007 48.0957 58.741 47.9957 58.45 47.95C58.45 47.6167 58.45 47.2833 58.45 46.95C58.559 45.8862 58.625 44.8195 58.65 43.75C58.683 43.75 58.717 43.75 58.75 43.75C58.733 44.4175 58.75 45.0842 58.8 45.75C58.954 45.9477 59.004 46.1477 58.95 46.35C58.852 46.3023 58.769 46.2357 58.7 46.15C58.683 46.2167 58.667 46.2833 58.65 46.35C58.909 46.7669 59.142 47.2002 59.35 47.65C59.508 47.1656 59.591 46.6656 59.6 46.15C59.68 45.3088 59.663 44.4755 59.55 43.65Z"
                  fill="#201F22"
                />
                <path
                  d="M112.95 43.95C111.096 44.2765 109.263 44.6098 107.45 44.95C98.85 46.1945 90.25 47.4611 81.65 48.75C81.65 48.85 81.65 48.95 81.65 49.05C81.129 49.0608 80.629 49.1275 80.15 49.25C79.873 49.1233 79.606 49.1233 79.35 49.25C78.043 49.3296 76.743 49.4796 75.45 49.7C73.99 49.9445 72.523 50.1945 71.05 50.45C69.615 50.6085 68.182 50.7919 66.75 51C66.626 51.0232 66.526 51.0732 66.45 51.15C65.892 51.1255 65.358 51.1922 64.85 51.35C62.241 51.6575 59.641 51.9242 57.05 52.15C55.317 52.15 53.5833 52.15 51.85 52.15C50.3446 52.105 48.8446 51.9883 47.35 51.8C35.6205 50.1449 23.8872 48.5115 12.15 46.9C11.1333 46.7917 10.1333 46.6084 9.14999 46.35C9.14999 46.1833 9.14999 46.0167 9.14999 45.85C9.83169 46.0638 10.5317 46.2138 11.25 46.3C13.7483 46.6403 16.2483 46.9569 18.75 47.25C18.7831 46.8086 18.8665 46.3752 19 45.95C19.0973 45.736 19.2473 45.5693 19.45 45.45C19.2062 45.3069 19.0396 45.1069 18.95 44.85C18.95 44.75 18.95 44.65 18.95 44.55C20.4583 44.5528 21.9583 44.6694 23.45 44.9C25.0279 45.3256 26.6279 45.6422 28.25 45.85C30.1277 46.0978 31.9944 46.3645 33.85 46.65C34.1791 46.86 34.5458 46.9933 34.95 47.05C39.1006 47.5722 43.2506 48.1056 47.4 48.65C47.5376 48.6316 47.6209 48.5649 47.65 48.45C47.65 48.35 47.65 48.25 47.65 48.15C48.0269 48.1244 48.3936 48.1577 48.75 48.25C48.9048 48.2821 48.9715 48.3821 48.95 48.55C48.8223 48.6694 48.7556 48.836 48.75 49.05C48.7836 49.3841 48.8169 49.7175 48.85 50.05C48.6633 50.0955 48.48 50.1622 48.3 50.25C48.1061 50.2046 47.9228 50.1379 47.75 50.05C47.7117 49.8592 47.6117 49.7092 47.45 49.6C43.3847 49.0502 39.3181 48.5168 35.25 48C33.7329 47.9633 32.2162 47.9133 30.7 47.85C30.2147 47.8281 29.7481 47.8948 29.3 48.05C29.2667 47.9833 29.2333 47.9167 29.2 47.85C29.0667 48.0167 28.9333 48.1833 28.8 48.35C28.7086 48.2346 28.6253 48.2513 28.55 48.4C28.8926 48.5653 29.2593 48.6487 29.65 48.65C29.9974 48.7525 30.364 48.8192 30.75 48.85C31.7478 48.9997 32.7478 49.1331 33.75 49.25C35.3365 49.4826 36.9365 49.7159 38.55 49.95C40.5808 50.2353 42.6141 50.502 44.65 50.75C45.129 50.8725 45.629 50.9392 46.15 50.95C46.632 51.0487 47.132 51.1153 47.65 51.15C48.1787 51.2342 48.712 51.2676 49.25 51.25C49.2351 51.1448 49.2517 51.0448 49.3 50.95C49.6627 50.7256 49.9794 50.4422 50.25 50.1C50.0563 49.8929 49.8896 49.6762 49.75 49.45C49.6659 49.2621 49.6325 49.0621 49.65 48.85C49.75 48.85 49.85 48.85 49.95 48.85C50.1265 48.9461 50.3265 48.9795 50.55 48.95C52.8167 48.95 55.083 48.95 57.35 48.95C57.583 48.95 57.817 48.95 58.05 48.95C58.15 48.95 58.25 48.95 58.35 48.95C58.517 48.8167 58.683 48.8167 58.85 48.95C58.863 49.1292 58.83 49.2958 58.75 49.45C58.637 49.5122 58.537 49.5955 58.45 49.7C58.595 49.6737 58.728 49.6904 58.85 49.75C58.908 50.2955 58.841 50.8289 58.65 51.35C59.185 51.3431 59.719 51.3098 60.25 51.25C60.283 51.25 60.317 51.25 60.35 51.25C60.805 51.2376 61.238 51.1709 61.65 51.05C62.768 50.9189 63.868 50.7522 64.95 50.55C66.883 50.2738 68.816 50.0072 70.75 49.75C72.036 49.595 73.303 49.395 74.55 49.15C78.981 48.5095 83.415 47.8761 87.85 47.25C88.883 47.0739 89.916 46.9072 90.95 46.75C91.605 46.7019 92.238 46.6019 92.85 46.45C93.53 46.4144 94.197 46.3144 94.85 46.15C98.07 45.7281 101.27 45.2614 104.45 44.75C107.283 44.35 110.116 43.95 112.95 43.55C112.95 43.6833 112.95 43.8167 112.95 43.95Z"
                  fill="#040406"
                />
                <path
                  d="M49.65 43.75C52.5499 43.8808 55.45 43.8808 58.35 43.75C58.253 45.1536 58.12 46.5536 57.95 47.95C57.938 48.1199 57.905 48.2865 57.85 48.45C57.955 48.6056 58.021 48.7723 58.05 48.95C57.817 48.95 57.583 48.95 57.35 48.95C57.453 48.8751 57.57 48.8085 57.7 48.75C57.752 48.5061 57.702 48.4895 57.55 48.7C57.132 48.7427 56.716 48.7927 56.3 48.85C56.035 48.8379 55.785 48.7712 55.55 48.65C55.911 48.4723 56.144 48.189 56.25 47.8C56.142 47.3753 55.975 46.9753 55.75 46.6C54.1625 45.5806 52.5291 45.4973 50.85 46.35C50.7884 46.611 50.7551 46.8777 50.75 47.15C50.775 47.6572 50.8416 48.1572 50.95 48.65C50.85 48.65 50.75 48.65 50.65 48.65C50.4829 47.6827 50.2162 46.7494 49.85 45.85C49.8167 45.85 49.7833 45.85 49.75 45.85C49.6911 45.1515 49.6578 44.4515 49.65 43.75Z"
                  fill="#110306"
                />
                <path
                  d="M62.25 43.35C62.35 43.35 62.45 43.35 62.55 43.35C62.55 43.6167 62.55 43.8833 62.55 44.15C62.45 44.15 62.35 44.15 62.25 44.15C62.25 43.8833 62.25 43.6167 62.25 43.35Z"
                  fill="#1E1E35"
                />
                <path
                  d="M28.85 41.75C29.1251 41.9745 29.3917 42.2245 29.65 42.5C30.2997 42.8414 30.933 43.2081 31.55 43.6C32.652 43.911 33.752 44.211 34.85 44.5C36.501 44.7757 38.151 45.0257 39.8 45.25C40.1623 45.2641 40.5123 45.2307 40.85 45.15C42.1694 45.4829 43.5194 45.5163 44.9 45.25C45.2744 45.3103 45.6244 45.2103 45.95 44.95C46.0425 45.0641 46.1259 45.0641 46.2 44.95C46.2934 45.0858 46.3768 45.2192 46.45 45.35C46.4631 45.4239 46.4464 45.4906 46.4 45.55C46.0632 45.417 45.7465 45.467 45.45 45.7C44.7451 45.7823 44.0617 45.8657 43.4 45.95C41.7867 45.7884 40.1701 45.6384 38.55 45.5C38.3324 45.4837 38.1491 45.4004 38 45.25C37.9667 45.2833 37.9333 45.3167 37.9 45.35C37.6667 45.2833 37.4333 45.2167 37.2 45.15C35.6471 44.9461 34.0637 44.6294 32.45 44.2C31.4727 43.728 30.506 43.228 29.55 42.7C29.2538 42.4218 29.0205 42.1051 28.85 41.75Z"
                  fill="#212156"
                />
                <path
                  d="M95.05 39.65C95.083 39.65 95.117 39.65 95.15 39.65C95.611 39.6373 95.677 39.8039 95.35 40.15C94.571 40.8124 93.704 41.329 92.75 41.7C92.917 41.7333 93.083 41.7667 93.25 41.8C91.569 42.2384 89.886 42.655 88.2 43.05C88.144 42.9978 88.077 42.9645 88 42.95C86.094 43.1745 84.21 43.4912 82.35 43.9C81.294 43.9411 80.261 44.1078 79.25 44.4C77.896 44.4191 76.579 44.6358 75.3 45.05C75.181 44.957 75.047 44.8903 74.9 44.85C74.168 44.9934 73.435 45.1268 72.7 45.25C72.3 45.25 71.9 45.25 71.5 45.25C71.15 45.3034 70.834 45.4367 70.55 45.65C70.074 45.5176 69.608 45.551 69.15 45.75C68.794 45.5499 68.444 45.5832 68.1 45.85C68.067 45.8167 68.033 45.7833 68 45.75C67.429 45.8142 66.862 45.9142 66.3 46.05C66.103 46.0458 65.92 45.9958 65.75 45.9C65.85 45.8667 65.95 45.8333 66.05 45.8C65.584 45.7463 65.117 45.6963 64.65 45.65C63.948 45.7749 63.248 45.7582 62.55 45.6C62.177 45.3897 61.777 45.3063 61.35 45.35C61.35 45.3167 61.35 45.2833 61.35 45.25C61.57 45.2154 61.587 45.1487 61.4 45.05C61.297 45.0836 61.247 45.1503 61.25 45.25C60.938 45.1085 60.671 44.9085 60.45 44.65C60.45 44.4167 60.45 44.1833 60.45 43.95C60.614 43.9286 60.764 43.962 60.9 44.05C61.184 43.8496 61.501 43.7996 61.85 43.9C62.229 44.2247 62.562 44.5914 62.85 45C63.035 45.0837 63.218 45.1671 63.4 45.25C63.899 45.1571 64.366 45.2571 64.8 45.55C64.927 45.5384 65.06 45.5051 65.2 45.45C65.513 45.5206 65.83 45.5873 66.15 45.65C66.526 45.6061 66.909 45.5061 67.3 45.35C67.702 45.3495 68.102 45.3495 68.5 45.35C70.863 45.0649 73.246 44.7482 75.65 44.4C77.698 44.265 79.615 43.9817 81.4 43.55C81.527 43.5616 81.66 43.5949 81.8 43.65C84.07 43.2411 86.353 42.8578 88.65 42.5C88.55 42.4667 88.45 42.4333 88.35 42.4C89.302 42.1363 90.269 41.9363 91.25 41.8C92.427 41.445 93.56 40.9784 94.65 40.4C94.917 40.2667 95.117 40.0667 95.25 39.8C95.158 39.7722 95.092 39.7222 95.05 39.65Z"
                  fill="#474784"
                />
                <path
                  d="M26.55 41.25C27.317 41.3567 28.0837 41.4567 28.85 41.55C28.85 41.6167 28.85 41.6833 28.85 41.75C29.0205 42.1051 29.2538 42.4218 29.55 42.7C30.506 43.228 31.4727 43.728 32.45 44.2C34.0637 44.6294 35.6471 44.9461 37.2 45.15C37.4333 45.2167 37.6667 45.2833 37.9 45.35C37.9333 45.3167 37.9667 45.2833 38 45.25C38.1491 45.4004 38.3324 45.4837 38.55 45.5C40.1701 45.6384 41.7867 45.7884 43.4 45.95C44.0617 45.8657 44.7451 45.7823 45.45 45.7C45.7465 45.467 46.0632 45.417 46.4 45.55C46.4464 45.4906 46.4631 45.4239 46.45 45.35C46.5643 45.3092 46.6643 45.2425 46.75 45.15C46.5518 45.0784 46.3851 44.9617 46.25 44.8C46.2833 44.7667 46.3167 44.7333 46.35 44.7C46.7594 44.5936 47.1594 44.477 47.55 44.35C47.5263 44.2209 47.5596 44.1209 47.65 44.05C47.65 44.5167 47.65 44.9833 47.65 45.45C47.6201 45.835 47.4701 46.1683 47.2 46.45C46.9978 46.4788 46.7811 46.4454 46.55 46.35C46.2574 46.4698 45.9574 46.5698 45.65 46.65C45.5558 46.6392 45.4725 46.6059 45.4 46.55C45.1631 46.6551 44.9131 46.7218 44.65 46.75C43.9059 46.6662 43.1892 46.5662 42.5 46.45C42.4097 46.5701 42.2931 46.6535 42.15 46.7C41.8591 46.6716 41.5758 46.6883 41.3 46.75C41.2147 46.5875 41.1147 46.5542 41 46.65C40.8667 46.5833 40.7333 46.5167 40.6 46.45C40.3583 46.5352 40.1083 46.6019 39.85 46.65C39.2774 46.3982 38.6774 46.2149 38.05 46.1C36.5216 45.8176 34.9882 45.5676 33.45 45.35C32.7272 45.1643 32.0105 44.931 31.3 44.65C31.2228 44.6645 31.1561 44.6978 31.1 44.75C31.0535 44.6069 30.9701 44.4903 30.85 44.4C30.2466 44.2311 29.7132 43.9311 29.25 43.5C29.4911 43.5052 29.7244 43.5385 29.95 43.6C29.6225 43.2528 29.2225 43.0362 28.75 42.95C28.4501 42.5005 28.1001 42.1005 27.7 41.75C27.3812 41.8418 27.0312 41.8085 26.65 41.65C26.5754 41.5264 26.5421 41.393 26.55 41.25Z"
                  fill="#1D1D48"
                />
                <path
                  d="M30.55 41.75C30.6833 41.75 30.8167 41.75 30.95 41.75C31.0525 41.9201 31.2025 42.0535 31.4 42.15C31.775 42.2708 32.1584 42.3542 32.55 42.4C32.7226 42.553 32.9226 42.653 33.15 42.7C35.2116 43.0228 37.2783 43.3561 39.35 43.7C40.575 43.7858 41.7917 43.9024 43 44.05C43.0717 43.9956 43.1217 43.9289 43.15 43.85C43.2167 43.75 43.2833 43.65 43.35 43.55C43.3351 43.6552 43.3517 43.7552 43.4 43.85C43.4186 43.5964 43.4686 43.3631 43.55 43.15C43.5337 43.3857 43.5503 43.619 43.6 43.85C43.7714 43.7075 43.9047 43.7408 44 43.95C44.4587 43.9185 44.8587 43.7518 45.2 43.45C45.3128 43.6345 45.3628 43.8345 45.35 44.05C45.2732 43.9737 45.2232 43.8737 45.2 43.75C44.9634 43.9212 44.7301 44.0878 44.5 44.25C43.5945 44.3112 42.6945 44.3778 41.8 44.45C41.3559 44.3432 40.9059 44.2432 40.45 44.15C39.2468 44.238 38.0634 44.1047 36.9 43.75C36.8667 43.7833 36.8333 43.8167 36.8 43.85C35.4986 43.6679 34.2152 43.3846 32.95 43C32.7844 42.8171 32.5844 42.6837 32.35 42.6C31.6652 42.4571 31.0652 42.1738 30.55 41.75Z"
                  fill="#2C2C90"
                />
                <path
                  d="M93.85 40.15C93.556 40.3589 93.223 40.5089 92.85 40.6C92.025 40.8625 91.192 41.0958 90.35 41.3C86.482 41.964 82.599 42.5473 78.7 43.05C78.623 43.0355 78.556 43.0022 78.5 42.95C76.463 43.3051 74.413 43.6051 72.35 43.85C72.256 43.8392 72.172 43.8059 72.1 43.75C70.948 43.9876 69.781 44.1543 68.6 44.25C68.309 44.2 68.009 44.2333 67.7 44.35C66.151 44.4653 64.534 44.4653 62.85 44.35C62.85 44.2833 62.85 44.2167 62.85 44.15C63.478 44.057 64.128 44.057 64.8 44.15C69.098 43.605 73.415 43.1217 77.75 42.7C78.068 42.634 78.368 42.5507 78.65 42.45C79.904 42.4425 81.137 42.2925 82.35 42C83.907 41.7683 85.474 41.6349 87.05 41.6C88.237 41.3365 89.437 41.1698 90.65 41.1C91.12 40.9254 91.603 40.7754 92.1 40.65C92.63 40.2227 93.213 40.056 93.85 40.15Z"
                  fill="#5151B9"
                />
                <path
                  d="M18.25 44.15C18.35 44.15 18.45 44.15 18.55 44.15C18.5833 44.15 18.6167 44.15 18.65 44.15C18.6706 44.4238 18.7706 44.6572 18.95 44.85C19.0396 45.1069 19.2062 45.3069 19.45 45.45C19.2473 45.5693 19.0973 45.736 19 45.95C18.8665 46.3752 18.7831 46.8086 18.75 47.25C16.2483 46.9569 13.7483 46.6403 11.25 46.3C10.5317 46.2138 9.83169 46.0638 9.14999 45.85C9.05879 45.7262 9.04209 45.5928 9.09999 45.45C9.28779 45.3947 9.43779 45.2947 9.54999 45.15C10.7315 44.8409 11.9148 44.6742 13.1 44.65C14.8054 44.4145 16.5221 44.2478 18.25 44.15Z"
                  fill="#F9F9F9"
                />
                <path
                  d="M103.95 43.55C104.048 43.9298 104.082 44.3298 104.05 44.75C104.183 44.75 104.317 44.75 104.45 44.75C101.27 45.2614 98.07 45.7281 94.85 46.15C94.909 46.0849 94.976 46.0182 95.05 45.95C94.806 45.7738 94.54 45.6404 94.25 45.55C94.157 45.4311 94.124 45.2978 94.15 45.15C93.883 45.15 93.617 45.15 93.35 45.15C93.99 45.0816 94.64 45.015 95.3 44.95C95.333 44.9833 95.367 45.0167 95.4 45.05C95.477 44.9151 95.594 44.8318 95.75 44.8C95.574 44.7798 95.408 44.7298 95.25 44.65C95.367 44.6167 95.483 44.5833 95.6 44.55C96.44 44.7446 97.29 44.7946 98.15 44.7C100.09 44.4346 102.023 44.1513 103.95 43.85C103.95 43.75 103.95 43.65 103.95 43.55Z"
                  fill="#25252F"
                />
                <path
                  d="M29.75 41.65C30.0385 41.6194 30.3052 41.6527 30.55 41.75C31.0652 42.1738 31.6652 42.4571 32.35 42.6C32.5844 42.6837 32.7844 42.8171 32.95 43C34.2152 43.3846 35.4986 43.6679 36.8 43.85C36.8333 43.8167 36.8667 43.7833 36.9 43.75C38.0634 44.1047 39.2468 44.238 40.45 44.15C40.9059 44.2432 41.3559 44.3432 41.8 44.45C42.6945 44.3778 43.5945 44.3112 44.5 44.25C44.7301 44.0878 44.9634 43.9212 45.2 43.75C45.2232 43.8737 45.2732 43.9737 45.35 44.05C45.4461 43.8735 45.4795 43.6735 45.45 43.45C45.5165 43.6698 45.5832 43.9031 45.65 44.15C45.692 43.8384 45.792 43.5717 45.95 43.35C46.4595 43.3221 46.9595 43.3555 47.45 43.45C47.5167 43.5167 47.5833 43.5833 47.65 43.65C47.65 43.7167 47.65 43.7833 47.65 43.85C47.4549 43.8227 47.3049 43.8893 47.2 44.05C47.0667 43.9833 46.9667 43.8833 46.9 43.75C46.8667 43.7833 46.8333 43.8167 46.8 43.85C46.6266 43.7751 46.4433 43.7251 46.25 43.7C46.1333 43.65 46.05 43.5667 46 43.45C45.9713 43.6891 45.9213 43.9224 45.85 44.15C45.4222 44.2741 45.0889 44.5241 44.85 44.9C44.223 45.0076 43.5896 45.0576 42.95 45.05C42.2387 45.0698 41.5387 45.0031 40.85 44.85C40.7914 44.8709 40.7414 44.9043 40.7 44.95C40.6588 44.7003 40.5422 44.5003 40.35 44.35C40.2201 44.409 40.1368 44.509 40.1 44.65C40.0667 44.5833 40.0333 44.5167 40 44.45C37.5331 44.2779 35.0831 43.8612 32.65 43.2C31.4686 42.8519 30.3686 42.3519 29.35 41.7C29.4793 41.651 29.6127 41.6343 29.75 41.65Z"
                  fill="#292876"
                />
                <path
                  d="M85.85 43.95C86.247 44.034 86.647 44.0507 87.05 44C86.71 44.139 86.377 44.189 86.05 44.15C85.483 44.5866 84.816 44.7199 84.05 44.55C83.626 44.7116 83.193 44.845 82.75 44.95C82.691 44.9291 82.641 44.8957 82.6 44.85C82.326 44.956 82.043 45.0394 81.75 45.1C82.148 45.0983 82.548 45.0816 82.95 45.05C82.874 45.1268 82.774 45.1768 82.65 45.2C81.825 45.2132 81.008 45.2965 80.2 45.45C79.967 45.4167 79.733 45.3833 79.5 45.35C78.787 45.3995 78.104 45.5495 77.45 45.8C73.629 46.3577 69.796 46.8743 65.95 47.35C65.961 47.2883 65.994 47.2383 66.05 47.2C65.923 47.1691 65.807 47.1191 65.7 47.05C65.667 47.0833 65.633 47.1167 65.6 47.15C65.124 46.9563 64.64 46.8396 64.15 46.8C64.483 46.7667 64.817 46.7333 65.15 46.7C64.779 46.668 64.412 46.618 64.05 46.55C65.311 46.3837 66.578 46.1837 67.85 45.95C68.071 46.0399 68.287 46.0065 68.5 45.85C69.155 45.8136 69.838 45.8136 70.55 45.85C70.783 45.7167 71.017 45.5833 71.25 45.45C71.309 45.4709 71.359 45.5043 71.4 45.55C72.241 45.3873 73.091 45.254 73.95 45.15C74.275 45.2823 74.592 45.2489 74.9 45.05C75.093 45.2171 75.293 45.2837 75.5 45.25C75.642 45.154 75.792 45.0707 75.95 45C77.008 44.7021 78.075 44.5688 79.15 44.6C79.325 44.5529 79.491 44.4862 79.65 44.4C80.214 44.3823 80.764 44.299 81.3 44.15C81.389 44.2081 81.489 44.2415 81.6 44.25C82.587 43.9519 83.587 43.8186 84.6 43.85C84.776 43.8944 84.76 43.9444 84.55 44C83.031 44.217 81.515 44.4336 80 44.65C79.959 44.6043 79.909 44.5709 79.85 44.55C79.557 44.6762 79.291 44.8429 79.05 45.05C79.117 45.0833 79.183 45.1167 79.25 45.15C79.445 45.0792 79.612 44.9625 79.75 44.8C81.455 44.641 83.155 44.441 84.85 44.2C85.056 44.0148 85.273 43.8982 85.5 43.85C85.601 43.9337 85.718 43.967 85.85 43.95Z"
                  fill="#37376B"
                />
                <path
                  d="M26.75 43.95C27.4937 44.0758 28.227 44.2424 28.95 44.45C29.2465 44.5626 29.5465 44.6626 29.85 44.75C30.6429 45.15 31.4762 45.5 32.35 45.8C31.9216 45.7543 31.4882 45.7543 31.05 45.8C32.0036 46.053 32.937 46.3363 33.85 46.65C31.9944 46.3645 30.1277 46.0978 28.25 45.85C28.3952 45.7698 28.5618 45.7198 28.75 45.7C28.1828 45.563 27.6828 45.363 27.25 45.1C27.5914 45.0703 27.9247 45.0036 28.25 44.9C27.7015 44.6467 27.2015 44.3301 26.75 43.95Z"
                  fill="#121226"
                />
                <path
                  d="M61.35 45.25C61.317 45.25 61.283 45.25 61.25 45.25C61.247 45.1503 61.297 45.0836 61.4 45.05C61.587 45.1487 61.57 45.2154 61.35 45.25Z"
                  fill="#4140F9"
                />
                <path
                  d="M107.85 46.45C107.788 46.4611 107.738 46.4944 107.7 46.55C107.551 46.3668 107.368 46.2835 107.15 46.3C107.394 46.5558 107.344 46.6392 107 46.55C106.963 46.6416 106.913 46.725 106.85 46.8C106.998 46.9193 107.131 46.9693 107.25 46.95C107.076 47.1973 106.892 47.1973 106.7 46.95C106.658 47.0672 106.591 47.1672 106.5 47.25C106.432 47.3784 106.448 47.4951 106.55 47.6C106.471 47.7085 106.404 47.8252 106.35 47.95C106.481 48.0258 106.531 48.1258 106.5 48.25C106.467 48.2167 106.433 48.1833 106.4 48.15C106.116 48.4587 105.9 48.7754 105.75 49.1C105.277 49.0966 105.227 49.2466 105.6 49.55C105.639 49.3285 105.739 49.1952 105.9 49.15C105.975 49.2126 106.058 49.2626 106.15 49.3C106.259 49.6083 106.259 49.8583 106.15 50.05C106.373 50.2526 106.607 50.4026 106.85 50.5C106.542 50.729 106.225 50.9457 105.9 51.15C105.688 51.078 105.638 50.9613 105.75 50.8C105.569 50.8875 105.369 50.9209 105.15 50.9C104.917 50.7337 104.684 50.517 104.45 50.25C104.332 50.4135 104.332 50.5802 104.45 50.75C104.341 50.9003 104.224 50.9336 104.1 50.85C103.996 50.9623 103.929 51.0956 103.9 51.25C103.682 51.3108 103.482 51.2441 103.3 51.05C103.233 51.15 103.233 51.25 103.3 51.35C103.333 51.3167 103.367 51.2833 103.4 51.25C103.511 51.376 103.528 51.4927 103.45 51.6C103.525 51.7487 103.609 51.7654 103.7 51.65C103.781 51.8282 103.898 51.9782 104.05 52.1C103.807 52.1451 103.79 52.2285 104 52.35C104.212 52.3374 104.429 52.3041 104.65 52.25C104.574 52.2089 104.474 52.1923 104.35 52.2C104.591 51.9965 104.525 51.8965 104.15 51.9C104.492 51.7411 104.792 51.5245 105.05 51.25C105.129 51.3242 105.195 51.4075 105.25 51.5C105.25 51.6399 105.217 51.7899 105.15 51.95C105.253 51.9296 105.353 51.9796 105.45 52.1C105.417 52.1333 105.383 52.1667 105.35 52.2C105.497 52.5767 105.714 52.8267 106 52.95C106.076 52.5749 106.193 52.5583 106.35 52.9C106.317 52.9333 106.283 52.9667 106.25 53C106.65 53.0667 106.65 53.1333 106.25 53.2C106.423 53.2865 106.589 53.3531 106.75 53.4C106.535 53.5152 106.352 53.6652 106.2 53.85C106.142 53.5876 106.009 53.5209 105.8 53.65C105.66 53.4027 105.51 53.4027 105.35 53.65C105.281 53.5975 105.231 53.5308 105.2 53.45C105.169 53.5308 105.119 53.5975 105.05 53.65C104.957 53.5359 104.874 53.5359 104.8 53.65C104.709 53.5672 104.642 53.4672 104.6 53.35C104.517 53.5 104.4 53.6167 104.25 53.7C104.273 53.9319 104.406 54.1319 104.65 54.3C104.487 54.7098 104.337 55.1265 104.2 55.55C104.051 55.4747 104.035 55.3914 104.15 55.3C104.083 55.2667 104.017 55.2333 103.95 55.2C104.011 54.9605 104.011 54.7438 103.95 54.55C103.817 54.6592 103.734 54.7926 103.7 54.95C103.658 54.7385 103.541 54.6552 103.35 54.7C103.587 54.9184 103.57 55.135 103.3 55.35C103.4 55.0802 103.35 54.8302 103.15 54.6C103.325 54.592 103.491 54.5087 103.65 54.35C103.44 54.3452 103.224 54.3452 103 54.35C102.806 54.1684 102.739 53.9684 102.8 53.75C102.591 53.8794 102.391 53.9794 102.2 54.05C102.167 54.0167 102.133 53.9833 102.1 53.95C102.108 54.0738 102.091 54.1738 102.05 54.25C101.938 53.7279 101.854 53.7279 101.8 54.25C101.758 54.1044 101.674 54.0544 101.55 54.1C101.617 54.2333 101.717 54.3333 101.85 54.4C101.63 54.4825 101.447 54.4325 101.3 54.25C101.124 54.4661 100.94 54.4828 100.75 54.3C100.993 54.2549 101.01 54.1715 100.8 54.05C100.661 54.1815 100.561 54.1481 100.5 53.95C100.284 54.0683 100.084 54.035 99.9 53.85C100.033 54.1164 100.25 54.333 100.55 54.5C100.227 54.5356 100.077 54.719 100.1 55.05C99.944 54.9655 99.844 55.0321 99.8 55.25C99.768 55.0939 99.685 54.9772 99.55 54.9C99.73 54.8683 99.763 54.8016 99.65 54.7C99.383 54.6333 99.117 54.6333 98.85 54.7C98.807 54.792 98.774 54.8753 98.75 54.95C98.817 54.3084 98.6 54.2084 98.1 54.65C97.985 54.5257 97.851 54.4257 97.7 54.35C97.691 54.5113 97.774 54.628 97.95 54.7C97.409 54.7162 97.343 54.8662 97.75 55.15C97.696 55.2748 97.629 55.3915 97.55 55.5C97.617 55.5667 97.683 55.5667 97.75 55.5C97.807 55.3795 97.874 55.2628 97.95 55.15C98.083 55.3167 98.083 55.4833 97.95 55.65C97.85 55.7833 97.75 55.7833 97.65 55.65C97.572 55.7737 97.472 55.8737 97.35 55.95C97.268 55.7252 97.168 55.7086 97.05 55.9C97.083 55.9333 97.117 55.9667 97.15 56C97.001 56.1368 96.851 56.1535 96.7 56.05C96.669 56.6352 96.519 56.6852 96.25 56.2C96.44 56.0935 96.456 56.0102 96.3 55.95C96.178 56.0272 96.078 56.1272 96 56.25C95.833 56.166 95.817 56.216 95.95 56.4C95.777 56.5852 95.66 56.5686 95.6 56.35C95.558 56.4672 95.491 56.5672 95.4 56.65C95.333 56.5167 95.267 56.5167 95.2 56.65C95.233 56.4833 95.267 56.3167 95.3 56.15C95.164 56.3784 95.014 56.3951 94.85 56.2C95.128 56.0221 95.094 55.9221 94.75 55.9C94.912 55.8385 95.045 55.7385 95.15 55.6C95.1 55.5833 95.05 55.5667 95 55.55C94.863 55.6581 94.713 55.7415 94.55 55.8C94.646 55.9147 94.612 56.0147 94.45 56.1C94.533 56.1915 94.633 56.2581 94.75 56.3C94.56 56.4897 94.41 56.7064 94.3 56.95C94.16 56.7097 94.043 56.5097 93.95 56.35C93.865 56.4522 93.765 56.5355 93.65 56.6C93.731 56.6308 93.797 56.6808 93.85 56.75C93.755 57.2468 93.605 57.2468 93.4 56.75C93.35 56.999 93.2 57.149 92.95 57.2C92.983 57.2333 93.017 57.2667 93.05 57.3C92.917 57.3 92.783 57.3 92.65 57.3C92.779 57.509 92.712 57.6424 92.45 57.7C92.565 57.7914 92.549 57.8747 92.4 57.95C92.367 57.9167 92.333 57.8833 92.3 57.85C92.143 57.9984 92.009 58.1651 91.9 58.35C91.867 58.2833 91.833 58.2167 91.8 58.15C91.651 58.3348 91.467 58.4181 91.25 58.4C91.003 58.2439 90.803 58.0439 90.65 57.8C90.822 57.7552 90.889 57.6718 90.85 57.55C90.919 57.6025 90.969 57.6692 91 57.75C91.085 57.5408 91.152 57.3408 91.2 57.15C90.977 57.3113 90.727 57.378 90.45 57.35C90.453 57.5582 90.386 57.7416 90.25 57.9C90.396 57.9423 90.446 58.0256 90.4 58.15C90.3 58.0167 90.2 58.0167 90.1 58.15C90.061 58.0572 89.995 57.9905 89.9 57.95C89.845 58.0289 89.779 58.1289 89.7 58.25C89.588 58.2335 89.472 58.2002 89.35 58.15C89.23 58.1846 89.23 58.2346 89.35 58.3C89.217 58.3333 89.083 58.3667 88.95 58.4C89.372 59.0433 89.206 59.2099 88.45 58.9C88.545 58.8282 88.562 58.7449 88.5 58.65C88.426 58.7641 88.343 58.7641 88.25 58.65C88.085 58.7779 87.969 58.9445 87.9 59.15C87.85 58.9965 87.867 58.8465 87.95 58.7C87.937 58.5941 87.887 58.5108 87.8 58.45C87.737 58.5872 87.67 58.7205 87.6 58.85C87.326 58.5558 87.026 58.2891 86.7 58.05C86.542 58.2202 86.592 58.3536 86.85 58.45C86.79 58.5795 86.74 58.7128 86.7 58.85C86.65 58.7333 86.567 58.65 86.45 58.6C86.571 58.5107 86.571 58.4274 86.45 58.35C86.236 58.5337 86.019 58.6337 85.8 58.65C85.767 58.55 85.733 58.45 85.7 58.35C85.635 58.4696 85.585 58.4696 85.55 58.35C85.613 58.1742 85.713 58.0242 85.85 57.9C85.774 57.6931 85.724 57.4764 85.7 57.25C85.595 57.1483 85.478 57.1316 85.35 57.2C85.612 57.3856 85.695 57.6356 85.6 57.95C85.452 57.7881 85.335 57.7714 85.25 57.9C85.329 57.9546 85.429 58.0213 85.55 58.1C85.322 58.2851 85.322 58.4518 85.55 58.6C85.292 58.8157 85.292 58.9323 85.55 58.95C85.462 59.0251 85.362 59.0751 85.25 59.1C85.517 59.1667 85.517 59.2333 85.25 59.3C85.435 59.4674 85.602 59.5841 85.75 59.65C85.614 59.7893 85.53 59.9559 85.5 60.15C85.467 60.0833 85.433 60.0167 85.4 59.95C85.267 60.0833 85.133 60.0833 85 59.95C84.942 60.2668 84.842 60.3001 84.7 60.05C84.593 60.128 84.476 60.1113 84.35 60C84.526 59.902 84.693 59.8353 84.85 59.8C84.501 59.6908 84.468 59.5075 84.75 59.25C84.647 59.13 84.564 58.9966 84.5 58.85C84.478 59.1943 84.378 59.2276 84.2 58.95C84.128 59.0451 84.045 59.0617 83.95 59C84.083 58.9333 84.083 58.8667 83.95 58.8C84.408 58.8731 84.508 58.7231 84.25 58.35C84.106 58.5401 83.94 58.5734 83.75 58.45C83.629 58.328 83.629 58.2113 83.75 58.1C83.625 57.9176 83.508 57.9343 83.4 58.15C83.358 58.0044 83.274 57.9544 83.15 58C83.271 58.0893 83.271 58.1726 83.15 58.25C83.08 58.0615 82.98 58.0282 82.85 58.15C82.655 58.0186 82.472 57.952 82.3 57.95C82.238 58.0449 82.255 58.1282 82.35 58.2C82.509 58.2862 82.675 58.3529 82.85 58.4C82.717 58.4333 82.583 58.4667 82.45 58.5C82.448 58.8579 82.248 59.0913 81.85 59.2C82.093 59.2451 82.11 59.3285 81.9 59.45C81.733 59.366 81.717 59.416 81.85 59.6C81.606 59.6399 81.539 59.5566 81.65 59.35C81.583 59.2833 81.517 59.2167 81.45 59.15C81.708 59.0536 81.758 58.9202 81.6 58.75C81.567 58.8167 81.533 58.8833 81.5 58.95C81.433 58.8167 81.367 58.8167 81.3 58.95C81.165 58.8315 81.048 58.6981 80.95 58.55C80.917 58.5667 80.883 58.5833 80.85 58.6C80.964 58.8308 81.131 59.0141 81.35 59.15C81.162 59.2197 81.128 59.3197 81.25 59.45C81.219 59.5308 81.169 59.5975 81.1 59.65C80.888 59.5773 80.671 59.5106 80.45 59.45C80.352 59.4977 80.269 59.5643 80.2 59.65C80.167 60.2167 80.133 60.7833 80.1 61.35C80.05 61.0854 80.034 60.8187 80.05 60.55C80.041 56.7828 80.074 53.0162 80.15 49.25C80.629 49.1275 81.129 49.0608 81.65 49.05C81.65 48.95 81.65 48.85 81.65 48.75C90.25 47.4611 98.85 46.1945 107.45 44.95C107.911 45.0026 108.344 44.9359 108.75 44.75C108.783 44.7833 108.817 44.8167 108.85 44.85C108.702 45.1892 108.468 45.3059 108.15 45.2C108.283 45.4 108.417 45.6 108.55 45.8C108.975 45.8232 109.042 45.9732 108.75 46.25C108.683 46.1833 108.617 46.1167 108.55 46.05C108.428 46.1711 108.311 46.1711 108.2 46.05C108.134 46.2324 108.017 46.3657 107.85 46.45Z"
                  fill="#898989"
                />
                <path
                  d="M59.45 43.65C59.483 43.65 59.517 43.65 59.55 43.65C59.663 44.4755 59.68 45.3088 59.6 46.15C59.591 46.6656 59.508 47.1656 59.35 47.65C59.142 47.2002 58.909 46.7669 58.65 46.35C58.667 46.2833 58.683 46.2167 58.7 46.15C58.769 46.2357 58.852 46.3023 58.95 46.35C59.004 46.1477 58.954 45.9477 58.8 45.75C58.75 45.0842 58.733 44.4175 58.75 43.75C58.995 43.7702 59.228 43.7369 59.45 43.65Z"
                  fill="#3E3E46"
                />
                <path
                  d="M89.75 44.65C86.46 45.1571 83.16 45.5904 79.85 45.95C77.438 46.3305 75.005 46.6639 72.55 46.95C72.445 46.9649 72.345 46.9483 72.25 46.9C74.458 46.5489 76.658 46.1489 78.85 45.7C82.101 45.4487 85.334 45.082 88.55 44.6C88.969 44.5188 89.369 44.5355 89.75 44.65Z"
                  fill="#0D0D73"
                />
                <path
                  d="M13.75 45.35C14.3509 45.3334 14.9509 45.3501 15.55 45.4C15.2016 45.5132 14.8349 45.5632 14.45 45.55C14.1167 45.5333 13.7833 45.5167 13.45 45.5C13.5737 45.4768 13.6737 45.4268 13.75 45.35Z"
                  fill="#6C6C6C"
                />
                <path
                  d="M29.85 44.75C30.2804 44.7268 30.6804 44.8268 31.05 45.05C31.1167 45.0167 31.1833 44.9833 31.25 44.95C31.6129 45.2359 32.0129 45.3026 32.45 45.15C32.7571 45.318 33.0904 45.3847 33.45 45.35C34.9882 45.5676 36.5216 45.8176 38.05 46.1C38.6774 46.2149 39.2774 46.3982 39.85 46.65C40.1083 46.6019 40.3583 46.5352 40.6 46.45C40.7333 46.5167 40.8667 46.5833 41 46.65C41.1147 46.5542 41.2147 46.5875 41.3 46.75C41.5758 46.6883 41.8591 46.6716 42.15 46.7C42.2931 46.6535 42.4097 46.5701 42.5 46.45C43.1892 46.5662 43.9059 46.6662 44.65 46.75C44.9131 46.7218 45.1631 46.6551 45.4 46.55C45.4725 46.6059 45.5558 46.6392 45.65 46.65C45.9574 46.5698 46.2574 46.4698 46.55 46.35C46.7811 46.4454 46.9978 46.4788 47.2 46.45C47.4701 46.1683 47.6201 45.835 47.65 45.45C47.65 46.35 47.65 47.25 47.65 48.15C47.65 48.25 47.65 48.35 47.65 48.45C43.4488 47.9498 39.2488 47.4165 35.05 46.85C34.95 46.8667 34.85 46.8833 34.75 46.9C34.8416 46.9278 34.9082 46.9778 34.95 47.05C34.5458 46.9933 34.1791 46.86 33.85 46.65C32.937 46.3363 32.0036 46.053 31.05 45.8C31.4882 45.7543 31.9216 45.7543 32.35 45.8C31.4762 45.5 30.6429 45.15 29.85 44.75Z"
                  fill="#121335"
                />
                <path
                  d="M60.45 44.65C60.671 44.9085 60.938 45.1085 61.25 45.25C61.283 45.25 61.317 45.25 61.35 45.25C61.35 45.2833 61.35 45.3167 61.35 45.35C61.403 45.4721 61.469 45.5887 61.55 45.7C61.517 45.7333 61.483 45.7667 61.45 45.8C61.866 45.9737 62.299 46.0737 62.75 46.1C62.55 46.1333 62.35 46.1667 62.15 46.2C62.242 46.2374 62.325 46.2874 62.4 46.35C62.944 46.2343 63.461 46.2509 63.95 46.4C63.894 46.4383 63.861 46.4883 63.85 46.55C63.652 46.5138 63.452 46.4805 63.25 46.45C62.405 46.5281 61.571 46.6447 60.75 46.8C60.667 46.7167 60.583 46.6333 60.5 46.55C60.45 45.9175 60.433 45.2842 60.45 44.65Z"
                  fill="#43436B"
                />
                <path
                  d="M47.65 43.65C48.0371 43.6185 48.4038 43.6518 48.75 43.75C48.75 45.25 48.75 46.75 48.75 48.25C48.3936 48.1577 48.0269 48.1244 47.65 48.15C47.65 47.25 47.65 46.35 47.65 45.45C47.65 44.9833 47.65 44.5167 47.65 44.05C47.65 43.9833 47.65 43.9167 47.65 43.85C47.65 43.7833 47.65 43.7167 47.65 43.65Z"
                  fill="#1E1E22"
                />
                <path
                  d="M93.25 45.15C93 45.3714 92.7 45.4881 92.35 45.5C91.452 45.588 90.552 45.638 89.65 45.65C87.78 45.8219 85.913 46.0219 84.05 46.25C87.097 45.7311 90.164 45.3645 93.25 45.15Z"
                  fill="#070630"
                />
                <path
                  d="M57.35 48.95C55.083 48.95 52.8167 48.95 50.55 48.95C50.5918 48.8778 50.6584 48.8278 50.75 48.8C50.6944 48.7617 50.6611 48.7117 50.65 48.65C50.75 48.65 50.85 48.65 50.95 48.65C50.8416 48.1572 50.775 47.6572 50.75 47.15C50.7551 46.8777 50.7884 46.611 50.85 46.35C52.5291 45.4973 54.1625 45.5806 55.75 46.6C55.975 46.9753 56.142 47.3753 56.25 47.8C56.144 48.189 55.911 48.4723 55.55 48.65C55.785 48.7712 56.035 48.8379 56.3 48.85C56.716 48.7927 57.132 48.7427 57.55 48.7C57.702 48.4895 57.752 48.5061 57.7 48.75C57.57 48.8085 57.453 48.8751 57.35 48.95Z"
                  fill="#1C0407"
                />
                <path
                  d="M79.85 45.95C79.482 45.9665 79.115 45.9499 78.75 45.9C79.07 45.7517 79.404 45.7183 79.75 45.8C79.806 45.8383 79.839 45.8883 79.85 45.95Z"
                  fill="#2D2DF9"
                />
                <path
                  d="M93.25 45.15C93.283 45.15 93.317 45.15 93.35 45.15C93.617 45.15 93.883 45.15 94.15 45.15C94.124 45.2978 94.157 45.4311 94.25 45.55C94.54 45.6404 94.806 45.7738 95.05 45.95C94.976 46.0182 94.909 46.0849 94.85 46.15C94.197 46.3144 93.53 46.4144 92.85 46.45C92.678 46.2306 92.445 46.1139 92.15 46.1C91.151 46.05 90.151 46.0334 89.15 46.05C89.005 45.9698 88.838 45.9198 88.65 45.9C89.013 45.8851 89.347 45.8018 89.65 45.65C90.552 45.638 91.452 45.588 92.35 45.5C92.7 45.4881 93 45.3714 93.25 45.15Z"
                  fill="#272652"
                />
                <path
                  d="M107.85 46.45C107.841 46.8782 108.024 47.1782 108.4 47.35C108.433 47.2833 108.467 47.2167 108.5 47.15C108.576 47.3769 108.559 47.5936 108.45 47.8C108.569 47.9019 108.669 48.0186 108.75 48.15C108.629 48.272 108.629 48.3887 108.75 48.5C108.512 48.5974 108.546 48.6641 108.85 48.7C108.783 48.7667 108.717 48.8333 108.65 48.9C108.757 49.025 108.757 49.1584 108.65 49.3C108.864 49.517 108.864 49.7504 108.65 50C108.734 50.27 108.834 50.5367 108.95 50.8C108.877 51.0689 108.944 51.3189 109.15 51.55C109.062 51.6251 108.962 51.6751 108.85 51.7C109.093 51.8162 109.159 51.9829 109.05 52.2C109.11 52.3605 109.21 52.4938 109.35 52.6C109.283 52.6333 109.217 52.6667 109.15 52.7C109.25 52.8 109.35 52.9 109.45 53C109.304 53.0423 109.254 53.1256 109.3 53.25C109.523 53.4607 109.723 53.694 109.9 53.95C109.925 53.8376 109.975 53.7376 110.05 53.65C110.306 53.7864 110.456 53.9531 110.5 54.15C110.859 53.9805 111.126 53.7805 111.3 53.55C111.333 53.6167 111.367 53.6833 111.4 53.75C111.653 53.5081 111.836 53.5747 111.95 53.95C111.881 54.1335 111.914 54.3168 112.05 54.5C111.732 54.7345 111.732 55.0012 112.05 55.3C111.885 55.4555 111.852 55.6221 111.95 55.8C111.768 56.0605 111.701 56.3272 111.75 56.6C111.65 56.7 111.55 56.8 111.45 56.9C111.672 57.0391 111.672 57.2057 111.45 57.4C111.667 57.5174 111.767 57.7007 111.75 57.95C109.471 58.4721 107.205 59.0054 104.95 59.55C104.889 60.0628 104.756 60.5628 104.55 61.05C104.533 61.1492 104.566 61.2158 104.65 61.25C104.683 61.3167 104.717 61.3833 104.75 61.45C104.75 61.5167 104.783 61.55 104.85 61.55C104.85 61.75 104.85 61.95 104.85 62.15C104.863 62.2376 104.83 62.3043 104.75 62.35C104.566 62.4028 104.4 62.4694 104.25 62.55C102.321 62.9822 100.387 63.4155 98.45 63.85C97.184 64.0998 95.917 64.3498 94.65 64.6C93.823 64.8035 93.023 65.0535 92.25 65.35C89.064 66.1529 85.897 66.9529 82.75 67.75C82.3 67.8327 81.85 67.9327 81.4 68.05C81.135 67.9284 80.885 67.9284 80.65 68.05C80.474 68.0357 80.307 68.0691 80.15 68.15C80.052 68.1023 79.969 68.0357 79.9 67.95C79.895 65.4669 79.945 63.0003 80.05 60.55C80.034 60.8187 80.05 61.0854 80.1 61.35C80.133 60.7833 80.167 60.2167 80.2 59.65C80.269 59.5643 80.352 59.4977 80.45 59.45C80.671 59.5106 80.888 59.5773 81.1 59.65C81.169 59.5975 81.219 59.5308 81.25 59.45C81.128 59.3197 81.162 59.2197 81.35 59.15C81.131 59.0141 80.964 58.8308 80.85 58.6C80.883 58.5833 80.917 58.5667 80.95 58.55C81.048 58.6981 81.165 58.8315 81.3 58.95C81.367 58.8167 81.433 58.8167 81.5 58.95C81.533 58.8833 81.567 58.8167 81.6 58.75C81.758 58.9202 81.708 59.0536 81.45 59.15C81.517 59.2167 81.583 59.2833 81.65 59.35C81.539 59.5566 81.606 59.6399 81.85 59.6C81.717 59.416 81.733 59.366 81.9 59.45C82.11 59.3285 82.093 59.2451 81.85 59.2C82.248 59.0913 82.448 58.8579 82.45 58.5C82.583 58.4667 82.717 58.4333 82.85 58.4C82.675 58.3529 82.509 58.2862 82.35 58.2C82.255 58.1282 82.238 58.0449 82.3 57.95C82.472 57.952 82.655 58.0186 82.85 58.15C82.98 58.0282 83.08 58.0615 83.15 58.25C83.271 58.1726 83.271 58.0893 83.15 58C83.274 57.9544 83.358 58.0044 83.4 58.15C83.508 57.9343 83.625 57.9176 83.75 58.1C83.629 58.2113 83.629 58.328 83.75 58.45C83.94 58.5734 84.106 58.5401 84.25 58.35C84.508 58.7231 84.408 58.8731 83.95 58.8C84.083 58.8667 84.083 58.9333 83.95 59C84.045 59.0617 84.128 59.0451 84.2 58.95C84.378 59.2276 84.478 59.1943 84.5 58.85C84.564 58.9966 84.647 59.13 84.75 59.25C84.468 59.5075 84.501 59.6908 84.85 59.8C84.693 59.8353 84.526 59.902 84.35 60C84.476 60.1113 84.593 60.128 84.7 60.05C84.842 60.3001 84.942 60.2668 85 59.95C85.133 60.0833 85.267 60.0833 85.4 59.95C85.433 60.0167 85.467 60.0833 85.5 60.15C85.53 59.9559 85.614 59.7893 85.75 59.65C85.602 59.5841 85.435 59.4674 85.25 59.3C85.517 59.2333 85.517 59.1667 85.25 59.1C85.362 59.0751 85.462 59.0251 85.55 58.95C85.292 58.9323 85.292 58.8157 85.55 58.6C85.322 58.4518 85.322 58.2851 85.55 58.1C85.429 58.0213 85.329 57.9546 85.25 57.9C85.335 57.7714 85.452 57.7881 85.6 57.95C85.695 57.6356 85.612 57.3856 85.35 57.2C85.478 57.1316 85.595 57.1483 85.7 57.25C85.724 57.4764 85.774 57.6931 85.85 57.9C85.713 58.0242 85.613 58.1742 85.55 58.35C85.585 58.4696 85.635 58.4696 85.7 58.35C85.733 58.45 85.767 58.55 85.8 58.65C86.019 58.6337 86.236 58.5337 86.45 58.35C86.571 58.4274 86.571 58.5107 86.45 58.6C86.567 58.65 86.65 58.7333 86.7 58.85C86.74 58.7128 86.79 58.5795 86.85 58.45C86.592 58.3536 86.542 58.2202 86.7 58.05C87.026 58.2891 87.326 58.5558 87.6 58.85C87.67 58.7205 87.737 58.5872 87.8 58.45C87.887 58.5108 87.937 58.5941 87.95 58.7C87.867 58.8465 87.85 58.9965 87.9 59.15C87.969 58.9445 88.085 58.7779 88.25 58.65C88.343 58.7641 88.426 58.7641 88.5 58.65C88.562 58.7449 88.545 58.8282 88.45 58.9C89.206 59.2099 89.372 59.0433 88.95 58.4C89.083 58.3667 89.217 58.3333 89.35 58.3C89.23 58.2346 89.23 58.1846 89.35 58.15C89.472 58.2002 89.588 58.2335 89.7 58.25C89.779 58.1289 89.845 58.0289 89.9 57.95C89.995 57.9905 90.061 58.0572 90.1 58.15C90.2 58.0167 90.3 58.0167 90.4 58.15C90.446 58.0256 90.396 57.9423 90.25 57.9C90.386 57.7416 90.453 57.5582 90.45 57.35C90.727 57.378 90.977 57.3113 91.2 57.15C91.152 57.3408 91.085 57.5408 91 57.75C90.969 57.6692 90.919 57.6025 90.85 57.55C90.889 57.6718 90.822 57.7552 90.65 57.8C90.803 58.0439 91.003 58.2439 91.25 58.4C91.467 58.4181 91.651 58.3348 91.8 58.15C91.833 58.2167 91.867 58.2833 91.9 58.35C92.009 58.1651 92.143 57.9984 92.3 57.85C92.333 57.8833 92.367 57.9167 92.4 57.95C92.549 57.8747 92.565 57.7914 92.45 57.7C92.712 57.6424 92.779 57.509 92.65 57.3C92.783 57.3 92.917 57.3 93.05 57.3C93.017 57.2667 92.983 57.2333 92.95 57.2C93.2 57.149 93.35 56.999 93.4 56.75C93.605 57.2468 93.755 57.2468 93.85 56.75C93.797 56.6808 93.731 56.6308 93.65 56.6C93.765 56.5355 93.865 56.4522 93.95 56.35C94.043 56.5097 94.16 56.7097 94.3 56.95C94.41 56.7064 94.56 56.4897 94.75 56.3C94.633 56.2581 94.533 56.1915 94.45 56.1C94.612 56.0147 94.646 55.9147 94.55 55.8C94.713 55.7415 94.863 55.6581 95 55.55C95.05 55.5667 95.1 55.5833 95.15 55.6C95.045 55.7385 94.912 55.8385 94.75 55.9C95.094 55.9221 95.128 56.0221 94.85 56.2C95.014 56.3951 95.164 56.3784 95.3 56.15C95.267 56.3167 95.233 56.4833 95.2 56.65C95.267 56.5167 95.333 56.5167 95.4 56.65C95.491 56.5672 95.558 56.4672 95.6 56.35C95.66 56.5686 95.777 56.5852 95.95 56.4C95.817 56.216 95.833 56.166 96 56.25C96.078 56.1272 96.178 56.0272 96.3 55.95C96.456 56.0102 96.44 56.0935 96.25 56.2C96.519 56.6852 96.669 56.6352 96.7 56.05C96.851 56.1535 97.001 56.1368 97.15 56C97.117 55.9667 97.083 55.9333 97.05 55.9C97.168 55.7086 97.268 55.7252 97.35 55.95C97.472 55.8737 97.572 55.7737 97.65 55.65C97.75 55.7833 97.85 55.7833 97.95 55.65C98.083 55.4833 98.083 55.3167 97.95 55.15C97.874 55.2628 97.807 55.3795 97.75 55.5C97.683 55.5667 97.617 55.5667 97.55 55.5C97.629 55.3915 97.696 55.2748 97.75 55.15C97.343 54.8662 97.409 54.7162 97.95 54.7C97.774 54.628 97.691 54.5113 97.7 54.35C97.851 54.4257 97.985 54.5257 98.1 54.65C98.6 54.2084 98.817 54.3084 98.75 54.95C98.774 54.8753 98.807 54.792 98.85 54.7C99.117 54.6333 99.383 54.6333 99.65 54.7C99.763 54.8016 99.73 54.8683 99.55 54.9C99.685 54.9772 99.768 55.0939 99.8 55.25C99.844 55.0321 99.944 54.9655 100.1 55.05C100.077 54.719 100.227 54.5356 100.55 54.5C100.25 54.333 100.033 54.1164 99.9 53.85C100.084 54.035 100.284 54.0683 100.5 53.95C100.561 54.1481 100.661 54.1815 100.8 54.05C101.01 54.1715 100.993 54.2549 100.75 54.3C100.94 54.4828 101.124 54.4661 101.3 54.25C101.447 54.4325 101.63 54.4825 101.85 54.4C101.717 54.3333 101.617 54.2333 101.55 54.1C101.674 54.0544 101.758 54.1044 101.8 54.25C101.854 53.7279 101.938 53.7279 102.05 54.25C102.091 54.1738 102.108 54.0738 102.1 53.95C102.133 53.9833 102.167 54.0167 102.2 54.05C102.391 53.9794 102.591 53.8794 102.8 53.75C102.739 53.9684 102.806 54.1684 103 54.35C103.224 54.3452 103.44 54.3452 103.65 54.35C103.491 54.5087 103.325 54.592 103.15 54.6C103.35 54.8302 103.4 55.0802 103.3 55.35C103.57 55.135 103.587 54.9184 103.35 54.7C103.541 54.6552 103.658 54.7385 103.7 54.95C103.734 54.7926 103.817 54.6592 103.95 54.55C104.011 54.7438 104.011 54.9605 103.95 55.2C104.017 55.2333 104.083 55.2667 104.15 55.3C104.035 55.3914 104.051 55.4747 104.2 55.55C104.337 55.1265 104.487 54.7098 104.65 54.3C104.406 54.1319 104.273 53.9319 104.25 53.7C104.4 53.6167 104.517 53.5 104.6 53.35C104.642 53.4672 104.709 53.5672 104.8 53.65C104.874 53.5359 104.957 53.5359 105.05 53.65C105.119 53.5975 105.169 53.5308 105.2 53.45C105.231 53.5308 105.281 53.5975 105.35 53.65C105.51 53.4027 105.66 53.4027 105.8 53.65C106.009 53.5209 106.142 53.5876 106.2 53.85C106.352 53.6652 106.535 53.5152 106.75 53.4C106.589 53.3531 106.423 53.2865 106.25 53.2C106.65 53.1333 106.65 53.0667 106.25 53C106.283 52.9667 106.317 52.9333 106.35 52.9C106.193 52.5583 106.076 52.5749 106 52.95C105.714 52.8267 105.497 52.5767 105.35 52.2C105.383 52.1667 105.417 52.1333 105.45 52.1C105.353 51.9796 105.253 51.9296 105.15 51.95C105.217 51.7899 105.25 51.6399 105.25 51.5C105.195 51.4075 105.129 51.3242 105.05 51.25C104.792 51.5245 104.492 51.7411 104.15 51.9C104.525 51.8965 104.591 51.9965 104.35 52.2C104.474 52.1923 104.574 52.2089 104.65 52.25C104.429 52.3041 104.212 52.3374 104 52.35C103.79 52.2285 103.807 52.1451 104.05 52.1C103.898 51.9782 103.781 51.8282 103.7 51.65C103.609 51.7654 103.525 51.7487 103.45 51.6C103.528 51.4927 103.511 51.376 103.4 51.25C103.367 51.2833 103.333 51.3167 103.3 51.35C103.233 51.25 103.233 51.15 103.3 51.05C103.482 51.2441 103.682 51.3108 103.9 51.25C103.929 51.0956 103.996 50.9623 104.1 50.85C104.224 50.9336 104.341 50.9003 104.45 50.75C104.332 50.5802 104.332 50.4135 104.45 50.25C104.684 50.517 104.917 50.7337 105.15 50.9C105.369 50.9209 105.569 50.8875 105.75 50.8C105.638 50.9613 105.688 51.078 105.9 51.15C106.225 50.9457 106.542 50.729 106.85 50.5C106.607 50.4026 106.373 50.2526 106.15 50.05C106.259 49.8583 106.259 49.6083 106.15 49.3C106.058 49.2626 105.975 49.2126 105.9 49.15C105.739 49.1952 105.639 49.3285 105.6 49.55C105.227 49.2466 105.277 49.0966 105.75 49.1C105.9 48.7754 106.116 48.4587 106.4 48.15C106.433 48.1833 106.467 48.2167 106.5 48.25C106.531 48.1258 106.481 48.0258 106.35 47.95C106.404 47.8252 106.471 47.7085 106.55 47.6C106.448 47.4951 106.432 47.3784 106.5 47.25C106.591 47.1672 106.658 47.0672 106.7 46.95C106.892 47.1973 107.076 47.1973 107.25 46.95C107.131 46.9693 106.998 46.9193 106.85 46.8C106.913 46.725 106.963 46.6416 107 46.55C107.344 46.6392 107.394 46.5558 107.15 46.3C107.368 46.2835 107.551 46.3668 107.7 46.55C107.738 46.4944 107.788 46.4611 107.85 46.45Z"
                  fill="#868687"
                />
                <path
                  d="M58.35 43.75C58.45 43.75 58.55 43.75 58.65 43.75C58.625 44.8195 58.559 45.8862 58.45 46.95C58.352 47.2962 58.319 47.6629 58.35 48.05C58.284 47.8631 58.217 47.6631 58.15 47.45C58.083 47.6291 58.016 47.7958 57.95 47.95C58.12 46.5536 58.253 45.1536 58.35 43.75Z"
                  fill="#190B46"
                />
                <path
                  d="M89.15 46.05C90.151 46.0334 91.151 46.05 92.15 46.1C92.445 46.1139 92.678 46.2306 92.85 46.45C92.238 46.6019 91.605 46.7019 90.95 46.75C90.925 46.6078 90.842 46.5078 90.7 46.45C88.946 46.4894 87.163 46.6061 85.35 46.8C84.933 46.8705 84.533 46.9539 84.15 47.05C83.894 47.0198 83.661 47.0532 83.45 47.15C82.053 47.3045 80.653 47.3878 79.25 47.4C79.425 47.3529 79.591 47.2862 79.75 47.2C79.657 47.1009 79.54 47.0509 79.4 47.05C78.873 47.316 78.323 47.5327 77.75 47.7C77.144 47.7613 76.544 47.8613 75.95 48C75.865 48.1728 75.765 48.1895 75.65 48.05C75.317 48.05 74.983 48.05 74.65 48.05C74.347 48.336 73.98 48.5193 73.55 48.6C69.97 49.0266 66.403 49.5266 62.85 50.1C62.735 50.1645 62.635 50.2478 62.55 50.35C62.524 50.2095 62.491 50.0762 62.45 49.95C62.15 49.95 61.85 49.95 61.55 49.95C61.621 49.8596 61.721 49.8263 61.85 49.85C62.587 49.8616 63.321 49.8116 64.05 49.7C65.128 49.4874 66.195 49.254 67.25 49C68.689 48.9325 70.123 48.7992 71.55 48.6C72.084 48.3325 72.65 48.1491 73.25 48.05C74.666 48.0071 76.066 47.8571 77.45 47.6C77.974 47.4522 78.474 47.2522 78.95 47C79.383 46.9333 79.817 46.9333 80.25 47C79.977 47.1232 79.994 47.2065 80.3 47.25C80.407 47.2472 80.49 47.2139 80.55 47.15C81.916 47.0334 83.283 46.9168 84.65 46.8C84.825 46.7529 84.991 46.6862 85.15 46.6C86.504 46.4642 87.838 46.2809 89.15 46.05Z"
                  fill="#292976"
                />
                <path
                  d="M90.35 44.25C90.495 44.3302 90.662 44.3802 90.85 44.4C90.487 44.5049 90.12 44.5882 89.75 44.65C89.369 44.5355 88.969 44.5188 88.55 44.6C85.334 45.082 82.101 45.4487 78.85 45.7C76.658 46.1489 74.458 46.5489 72.25 46.9C72.345 46.9483 72.445 46.9649 72.55 46.95C72.241 47.0785 71.908 47.1451 71.55 47.15C71.661 47.071 71.794 47.021 71.95 47C68.087 47.3661 64.221 47.8161 60.35 48.35C60.35 48.25 60.35 48.15 60.35 48.05C60.422 48.0082 60.472 47.9416 60.5 47.85C60.567 47.9578 60.667 48.0245 60.8 48.05C62.524 47.8618 64.241 47.6285 65.95 47.35C69.796 46.8743 73.629 46.3577 77.45 45.8C78.104 45.5495 78.787 45.3995 79.5 45.35C79.733 45.3833 79.967 45.4167 80.2 45.45C81.008 45.2965 81.825 45.2132 82.65 45.2C82.774 45.1768 82.874 45.1268 82.95 45.05C84.714 44.8004 86.481 44.5504 88.25 44.3C88.949 44.25 89.649 44.2334 90.35 44.25Z"
                  fill="#212053"
                />
                <path
                  d="M89.65 45.65C89.347 45.8018 89.013 45.8851 88.65 45.9C88.838 45.9198 89.005 45.9698 89.15 46.05C87.838 46.2809 86.504 46.4642 85.15 46.6C84.991 46.6862 84.825 46.7529 84.65 46.8C83.283 46.9168 81.916 47.0334 80.55 47.15C80.66 46.9908 80.593 46.9075 80.35 46.9C80.585 46.876 80.785 46.7927 80.95 46.65C81.252 46.6665 81.552 46.6498 81.85 46.6C81.794 46.5617 81.761 46.5117 81.75 46.45C82.514 46.3572 83.281 46.2906 84.05 46.25C85.913 46.0219 87.78 45.8219 89.65 45.65Z"
                  fill="#171758"
                />
                <path
                  d="M112.85 48.65C112.85 48.7833 112.85 48.9167 112.85 49.05C112.717 49.7647 112.384 50.3814 111.85 50.9C109.967 51.4849 109.067 50.7849 109.15 48.8C109.186 47.792 109.553 46.9253 110.25 46.2C112.173 45.9061 113.039 46.7228 112.85 48.65Z"
                  fill="#070708"
                />
                <path
                  d="M80.85 46.45C81.15 46.45 81.45 46.45 81.75 46.45C81.761 46.5117 81.794 46.5617 81.85 46.6C81.552 46.6498 81.252 46.6665 80.95 46.65C80.73 46.6591 80.697 46.5925 80.85 46.45Z"
                  fill="#2322DF"
                />
                <path
                  d="M112.95 43.95C112.983 43.95 113.017 43.95 113.05 43.95C112.999 45.5329 112.932 47.0995 112.85 48.65C113.039 46.7228 112.173 45.9061 110.25 46.2C109.553 46.9253 109.186 47.792 109.15 48.8C109.067 50.7849 109.967 51.4849 111.85 50.9C112.384 50.3814 112.717 49.7647 112.85 49.05C112.803 51.0338 112.736 53.0171 112.65 55C112.652 55.6244 112.685 56.2411 112.75 56.85C112.688 56.8917 112.654 56.9584 112.65 57.05C112.739 57.2155 112.789 57.3822 112.8 57.55C112.767 57.5167 112.733 57.4833 112.7 57.45C112.557 57.6439 112.373 57.7772 112.15 57.85C112.017 57.8833 111.883 57.9167 111.75 57.95C111.767 57.7007 111.667 57.5174 111.45 57.4C111.672 57.2057 111.672 57.0391 111.45 56.9C111.55 56.8 111.65 56.7 111.75 56.6C111.701 56.3272 111.768 56.0605 111.95 55.8C111.852 55.6221 111.885 55.4555 112.05 55.3C111.732 55.0012 111.732 54.7345 112.05 54.5C111.914 54.3168 111.881 54.1335 111.95 53.95C111.836 53.5747 111.653 53.5081 111.4 53.75C111.367 53.6833 111.333 53.6167 111.3 53.55C111.126 53.7805 110.859 53.9805 110.5 54.15C110.456 53.9531 110.306 53.7864 110.05 53.65C109.975 53.7376 109.925 53.8376 109.9 53.95C109.723 53.694 109.523 53.4607 109.3 53.25C109.254 53.1256 109.304 53.0423 109.45 53C109.35 52.9 109.25 52.8 109.15 52.7C109.217 52.6667 109.283 52.6333 109.35 52.6C109.21 52.4938 109.11 52.3605 109.05 52.2C109.159 51.9829 109.093 51.8162 108.85 51.7C108.962 51.6751 109.062 51.6251 109.15 51.55C108.944 51.3189 108.877 51.0689 108.95 50.8C108.834 50.5367 108.734 50.27 108.65 50C108.864 49.7504 108.864 49.517 108.65 49.3C108.757 49.1584 108.757 49.025 108.65 48.9C108.717 48.8333 108.783 48.7667 108.85 48.7C108.546 48.6641 108.512 48.5974 108.75 48.5C108.629 48.3887 108.629 48.272 108.75 48.15C108.669 48.0186 108.569 47.9019 108.45 47.8C108.559 47.5936 108.576 47.3769 108.5 47.15C108.467 47.2167 108.433 47.2833 108.4 47.35C108.024 47.1782 107.841 46.8782 107.85 46.45C108.017 46.3657 108.134 46.2324 108.2 46.05C108.311 46.1711 108.428 46.1711 108.55 46.05C108.617 46.1167 108.683 46.1833 108.75 46.25C109.042 45.9732 108.975 45.8232 108.55 45.8C108.417 45.6 108.283 45.4 108.15 45.2C108.468 45.3059 108.702 45.1892 108.85 44.85C108.817 44.8167 108.783 44.7833 108.75 44.75C108.344 44.9359 107.911 45.0026 107.45 44.95C109.263 44.6098 111.096 44.2765 112.95 43.95Z"
                  fill="#7C7C7C"
                />
                <path
                  d="M9.55 45.15C9.4378 45.2947 9.2878 45.3947 9.1 45.45C9.0421 45.5928 9.0588 45.7262 9.15 45.85C9.15 46.0167 9.15 46.1833 9.15 46.35C10.1333 46.6084 11.1333 46.7917 12.15 46.9C23.8872 48.5115 35.6205 50.1449 47.35 51.8C48.8446 51.9883 50.3446 52.105 51.85 52.15C53.6996 52.2332 55.566 52.2832 57.45 52.3C57.517 52.3333 57.583 52.3667 57.65 52.4C57.544 52.5188 57.41 52.5688 57.25 52.55C57.217 52.8472 57.317 53.0638 57.55 53.2C57.476 53.4235 57.476 53.6235 57.55 53.8C57.349 53.9791 57.349 54.1125 57.55 54.2C57.436 54.2741 57.436 54.3575 57.55 54.45C57.402 54.548 57.269 54.6647 57.15 54.8C57.245 54.8617 57.328 54.8451 57.4 54.75C57.469 54.8025 57.519 54.8692 57.55 54.95C57.417 54.9833 57.283 55.0167 57.15 55.05C57.25 55.1333 57.35 55.2167 57.45 55.3C57.169 55.5521 57.202 55.7187 57.55 55.8C57.287 56.0789 57.354 56.2789 57.75 56.4C57.617 56.4667 57.617 56.5333 57.75 56.6C57.396 56.7071 57.329 56.8737 57.55 57.1C57.483 57.1667 57.417 57.2333 57.35 57.3C57.352 57.6309 57.385 57.9642 57.45 58.3C57.211 58.4309 57.211 58.5309 57.45 58.6C57.383 58.6333 57.317 58.6667 57.25 58.7C57.492 58.9112 57.492 59.1112 57.25 59.3C57.496 59.4154 57.496 59.5488 57.25 59.7C57.336 59.7689 57.402 59.8522 57.45 59.95C57.356 59.9489 57.289 59.9989 57.25 60.1C57.438 60.3607 57.405 60.6274 57.15 60.9C57.55 60.9667 57.55 61.0333 57.15 61.1C57.217 61.1667 57.283 61.2333 57.35 61.3C57.347 61.5387 57.28 61.7887 57.15 62.05C57.267 62.2691 57.234 62.4858 57.05 62.7C57.06 62.9996 57.126 63.233 57.25 63.4C57.183 63.4333 57.117 63.4667 57.05 63.5C57.062 63.6268 57.095 63.7602 57.15 63.9C57.055 63.9617 56.972 63.9451 56.9 63.85C56.851 63.9793 56.834 64.1127 56.85 64.25C54.7342 64.3409 52.6342 64.3742 50.55 64.35C50.3078 64.4692 50.2078 64.6692 50.25 64.95C50.2119 65.2325 50.3119 65.4491 50.55 65.6C52.4817 65.7149 54.415 65.7649 56.35 65.75C56.918 65.7334 57.484 65.7501 58.05 65.8C58.2 65.8583 58.333 65.9416 58.45 66.05C58.373 66.1711 58.289 66.1711 58.2 66.05C58.133 66.15 58.133 66.25 58.2 66.35C58.267 66.2167 58.333 66.2167 58.4 66.35C58.425 66.5433 58.475 66.7266 58.55 66.9C58.455 66.9483 58.355 66.9649 58.25 66.95C58.217 67.1661 58.117 67.3494 57.95 67.5C58.052 67.6049 58.068 67.7216 58 67.85C57.718 68.0322 57.468 68.2489 57.25 68.5C57.334 68.6666 57.284 68.6833 57.1 68.55C56.954 68.7658 56.771 68.9491 56.55 69.1C56.583 69.1333 56.617 69.1667 56.65 69.2C56.489 69.4515 56.256 69.5849 55.95 69.6C55.857 69.8848 55.707 69.9014 55.5 69.65C55.389 69.7711 55.272 69.7711 55.15 69.65C55.061 69.7325 55.028 69.8325 55.05 69.95C53.85 69.95 52.65 69.95 51.45 69.95C50.8149 69.9443 50.1815 69.911 49.55 69.85C36.9948 67.2322 24.4282 64.5988 11.85 61.95C11.0751 61.8308 10.3251 61.5975 9.6 61.25C9.5506 61.4134 9.534 61.5801 9.55 61.75C9.4833 61.75 9.4167 61.75 9.35 61.75C9.35 61.7167 9.35 61.6833 9.35 61.65C9.4806 61.3313 9.4806 60.998 9.35 60.65C9.2482 60.7193 9.1482 60.7859 9.05 60.85C8.9185 60.7524 8.7852 60.6524 8.65 60.55C8.312 60.6087 8.012 60.7421 7.75 60.95C7.7937 60.7926 7.8937 60.6759 8.05 60.6C8.4288 60.4022 8.8121 60.2189 9.2 60.05C9.2311 59.1322 9.2311 58.1989 9.2 57.25C9.5 57.0229 9.5166 56.7896 9.25 56.55C9.1819 55.7609 9.1152 54.9776 9.05 54.2C9.1238 54.0176 9.1572 53.8176 9.15 53.6C9.001 50.8578 8.951 48.1078 9 45.35C9.1725 45.2536 9.3559 45.1869 9.55 45.15Z"
                  fill="#9E9E9D"
                />
                <path
                  d="M48.75 43.75C49.05 43.75 49.35 43.75 49.65 43.75C49.6578 44.4515 49.6911 45.1515 49.75 45.85C49.8479 46.4139 49.6979 46.8806 49.3 47.25C49.2265 47.4871 49.1432 47.7205 49.05 47.95C49.1311 48.0216 49.1978 48.105 49.25 48.2C49.1118 48.5022 49.0118 48.8189 48.95 49.15C48.9254 48.978 48.9254 48.778 48.95 48.55C48.9715 48.3821 48.9048 48.2821 48.75 48.25C48.75 46.75 48.75 45.25 48.75 43.75Z"
                  fill="#2F2E31"
                />
                <path
                  d="M49.85 45.85C50.2162 46.7494 50.4829 47.6827 50.65 48.65C50.6611 48.7117 50.6944 48.7617 50.75 48.8C50.6584 48.8278 50.5918 48.8778 50.55 48.95C50.3265 48.9795 50.1265 48.9461 49.95 48.85C50.042 48.5124 50.0753 48.1791 50.05 47.85C49.932 47.1884 49.8654 46.5218 49.85 45.85Z"
                  fill="#180B28"
                />
                <path
                  d="M60.35 43.65C60.44 43.7209 60.474 43.8209 60.45 43.95C60.45 44.1833 60.45 44.4167 60.45 44.65C60.433 45.2842 60.45 45.9175 60.5 46.55C60.583 46.6333 60.667 46.7167 60.75 46.8C61.571 46.6447 62.405 46.5281 63.25 46.45C63.452 46.4805 63.652 46.5138 63.85 46.55C63.917 46.55 63.983 46.55 64.05 46.55C64.412 46.618 64.779 46.668 65.15 46.7C64.817 46.7333 64.483 46.7667 64.15 46.8C64.64 46.8396 65.124 46.9563 65.6 47.15C65.633 47.1167 65.667 47.0833 65.7 47.05C65.807 47.1191 65.923 47.1691 66.05 47.2C65.994 47.2383 65.961 47.2883 65.95 47.35C64.241 47.6285 62.524 47.8618 60.8 48.05C60.667 48.0245 60.567 47.9578 60.5 47.85C60.472 47.9416 60.422 48.0082 60.35 48.05C60.35 46.5833 60.35 45.1167 60.35 43.65Z"
                  fill="#333359"
                />
                <path
                  d="M90.95 46.75C89.916 46.9072 88.883 47.0739 87.85 47.25C87.981 47.1768 88.114 47.0934 88.25 47C88.157 46.9009 88.04 46.8509 87.9 46.85C87.721 46.9285 87.554 46.9285 87.4 46.85C87.3 46.9167 87.2 46.9833 87.1 47.05C86.123 46.9444 85.14 46.9444 84.15 47.05C84.533 46.9539 84.933 46.8705 85.35 46.8C87.163 46.6061 88.946 46.4894 90.7 46.45C90.842 46.5078 90.925 46.6078 90.95 46.75Z"
                  fill="#2F2F8C"
                />
                <path
                  d="M49.75 45.85C49.7833 45.85 49.8167 45.85 49.85 45.85C49.8654 46.5218 49.932 47.1884 50.05 47.85C50.0753 48.1791 50.042 48.5124 49.95 48.85C49.85 48.85 49.75 48.85 49.65 48.85C49.5492 48.6661 49.3992 48.5328 49.2 48.45C49.1667 48.6047 49.2167 48.738 49.35 48.85C49.1219 49.1189 49.1886 49.3356 49.55 49.5C49.6437 49.5692 49.7103 49.5525 49.75 49.45C49.8896 49.6762 50.0563 49.8929 50.25 50.1C49.9794 50.4422 49.6627 50.7256 49.3 50.95C49.2517 51.0448 49.2351 51.1448 49.25 51.25C48.712 51.2676 48.1787 51.2342 47.65 51.15C47.65 50.95 47.65 50.75 47.65 50.55C47.65 50.4167 47.65 50.2833 47.65 50.15C47.7167 50.15 47.75 50.1167 47.75 50.05C47.9228 50.1379 48.1061 50.2046 48.3 50.25C48.48 50.1622 48.6633 50.0955 48.85 50.05C48.8169 49.7175 48.7836 49.3841 48.75 49.05C48.7556 48.836 48.8223 48.6694 48.95 48.55C48.9254 48.778 48.9254 48.978 48.95 49.15C49.0118 48.8189 49.1118 48.5022 49.25 48.2C49.1978 48.105 49.1311 48.0216 49.05 47.95C49.1432 47.7205 49.2265 47.4871 49.3 47.25C49.6979 46.8806 49.8479 46.4139 49.75 45.85Z"
                  fill="#202026"
                />
                <path
                  d="M71.55 47.15C67.964 47.5894 64.38 48.056 60.8 48.55C60.601 48.5431 60.451 48.4765 60.35 48.35C64.221 47.8161 68.087 47.3661 71.95 47C71.794 47.021 71.661 47.071 71.55 47.15Z"
                  fill="#07085F"
                />
                <path
                  d="M58.35 48.05C58.35 48.35 58.35 48.65 58.35 48.95C58.25 48.95 58.15 48.95 58.05 48.95C58.021 48.7723 57.955 48.6056 57.85 48.45C57.905 48.2865 57.938 48.1199 57.95 47.95C58.016 47.7958 58.083 47.6291 58.15 47.45C58.217 47.6631 58.284 47.8631 58.35 48.05Z"
                  fill="#23137E"
                />
                <path
                  d="M80.85 46.45C80.697 46.5925 80.73 46.6591 80.95 46.65C80.785 46.7927 80.585 46.876 80.35 46.9C80.593 46.9075 80.66 46.9908 80.55 47.15C80.49 47.2139 80.407 47.2472 80.3 47.25C79.994 47.2065 79.977 47.1232 80.25 47C79.817 46.9333 79.383 46.9333 78.95 47C78.474 47.2522 77.974 47.4522 77.45 47.6C76.066 47.8571 74.666 48.0071 73.25 48.05C72.65 48.1491 72.084 48.3325 71.55 48.6C70.123 48.7992 68.689 48.9325 67.25 49C66.195 49.254 65.128 49.4874 64.05 49.7C63.321 49.8116 62.587 49.8616 61.85 49.85C62.754 49.5892 63.687 49.4059 64.65 49.3C65.392 48.978 66.158 48.7613 66.95 48.65C68.005 48.4822 69.072 48.2989 70.15 48.1C72.502 47.8242 74.835 47.4909 77.15 47.1C78.313 46.9421 79.48 46.8254 80.65 46.75C80.629 46.5821 80.695 46.4821 80.85 46.45Z"
                  fill="#0A0E45"
                />
                <path
                  d="M47.65 48.45C47.6209 48.5649 47.5376 48.6316 47.4 48.65C43.2506 48.1056 39.1006 47.5722 34.95 47.05C34.9082 46.9778 34.8416 46.9278 34.75 46.9C34.85 46.8833 34.95 46.8667 35.05 46.85C39.2488 47.4165 43.4488 47.9498 47.65 48.45Z"
                  fill="#04033C"
                />
                <path
                  d="M87.85 47.25C83.415 47.8761 78.981 48.5095 74.55 49.15C74.35 49.15 74.15 49.15 73.95 49.15C73.95 49.05 73.95 48.95 73.95 48.85C74.377 48.7479 74.794 48.6146 75.2 48.45C75.324 48.4461 75.458 48.4795 75.6 48.55C75.695 48.4978 75.778 48.4311 75.85 48.35C76.179 48.4449 76.513 48.4449 76.85 48.35C76.85 48.45 76.85 48.55 76.85 48.65C76.955 48.6649 77.055 48.6483 77.15 48.6C76.996 48.489 76.93 48.339 76.95 48.15C79.013 47.8562 81.08 47.5729 83.15 47.3C83.274 47.2768 83.374 47.2268 83.45 47.15C83.661 47.0532 83.894 47.0198 84.15 47.05C85.14 46.9444 86.123 46.9444 87.1 47.05C87.2 46.9833 87.3 46.9167 87.4 46.85C87.554 46.9285 87.721 46.9285 87.9 46.85C88.04 46.8509 88.157 46.9009 88.25 47C88.114 47.0934 87.981 47.1768 87.85 47.25Z"
                  fill="#3232A4"
                />
                <path
                  d="M47.65 50.15C47.65 50.2833 47.65 50.4167 47.65 50.55C47.5751 50.4469 47.5085 50.3302 47.45 50.2C47.0217 50.1461 46.6217 50.0128 46.25 49.8C44.3812 49.6234 42.5145 49.4234 40.65 49.2C39.7687 48.9407 38.8687 48.774 37.95 48.7C36.543 48.6529 35.143 48.5362 33.75 48.35C33.0395 48.3336 32.3395 48.4002 31.65 48.55C31.5808 48.6025 31.5308 48.6692 31.5 48.75C31.3111 48.6903 31.1278 48.6569 30.95 48.65C30.8478 48.6855 30.7811 48.7522 30.75 48.85C30.364 48.8192 29.9974 48.7525 29.65 48.65C29.6082 48.5778 29.5416 48.5278 29.45 48.5C29.6433 48.4749 29.8266 48.4249 30 48.35C30.0333 48.4167 30.0667 48.4833 30.1 48.55C30.2236 48.3462 30.4069 48.2295 30.65 48.2C32.7878 48.1154 34.9212 48.1821 37.05 48.4C40.4663 48.9075 43.883 49.3908 47.3 49.85C47.3414 49.8043 47.3914 49.7709 47.45 49.75C47.5362 49.8766 47.6029 50.0099 47.65 50.15Z"
                  fill="#09082E"
                />
                <path
                  d="M47.75 50.05C47.75 50.1167 47.7167 50.15 47.65 50.15C47.6029 50.0099 47.5362 49.8766 47.45 49.75C47.3914 49.7709 47.3414 49.8043 47.3 49.85C43.883 49.3908 40.4663 48.9075 37.05 48.4C34.9212 48.1821 32.7878 48.1154 30.65 48.2C30.4069 48.2295 30.2236 48.3462 30.1 48.55C30.0667 48.4833 30.0333 48.4167 30 48.35C29.8266 48.4249 29.6433 48.4749 29.45 48.5C29.5416 48.5278 29.6082 48.5778 29.65 48.65C29.2593 48.6487 28.8926 48.5653 28.55 48.4C28.6253 48.2513 28.7086 48.2346 28.8 48.35C28.9333 48.1833 29.0667 48.0167 29.2 47.85C29.2333 47.9167 29.2667 47.9833 29.3 48.05C29.7481 47.8948 30.2147 47.8281 30.7 47.85C32.2162 47.9133 33.7329 47.9633 35.25 48C39.3181 48.5168 43.3847 49.0502 47.45 49.6C47.6117 49.7092 47.7117 49.8592 47.75 50.05Z"
                  fill="#050421"
                />
                <path
                  d="M58.45 46.95C58.45 47.2833 58.45 47.6167 58.45 47.95C58.741 47.9957 59.007 48.0957 59.25 48.25C59.277 48.4099 59.243 48.5432 59.15 48.65C58.95 48.65 58.85 48.75 58.85 48.95C58.683 48.8167 58.517 48.8167 58.35 48.95C58.35 48.65 58.35 48.35 58.35 48.05C58.319 47.6629 58.352 47.2962 58.45 46.95Z"
                  fill="#222039"
                />
                <path
                  d="M49.65 48.85C49.6325 49.0621 49.6659 49.2621 49.75 49.45C49.7103 49.5525 49.6437 49.5692 49.55 49.5C49.1886 49.3356 49.1219 49.1189 49.35 48.85C49.2167 48.738 49.1667 48.6047 49.2 48.45C49.3992 48.5328 49.5492 48.6661 49.65 48.85Z"
                  fill="#0D105A"
                />
                <path
                  d="M12.45 48.55C12.5859 48.6007 12.6859 48.7007 12.75 48.85C12.8478 48.8023 12.9311 48.7357 13 48.65C13.0743 48.8441 13.0576 49.0274 12.95 49.2C12.8216 49.2684 12.7049 49.2517 12.6 49.15C12.5187 48.9564 12.4687 48.7564 12.45 48.55Z"
                  fill="#525252"
                />
                <path
                  d="M83.45 47.15C83.374 47.2268 83.274 47.2768 83.15 47.3C81.08 47.5729 79.013 47.8562 76.95 48.15C76.93 48.339 76.996 48.489 77.15 48.6C77.055 48.6483 76.955 48.6649 76.85 48.65C76.85 48.55 76.85 48.45 76.85 48.35C76.513 48.4449 76.179 48.4449 75.85 48.35C75.778 48.4311 75.695 48.4978 75.6 48.55C75.458 48.4795 75.324 48.4461 75.2 48.45C74.794 48.6146 74.377 48.7479 73.95 48.85C73.95 48.95 73.95 49.05 73.95 49.15C74.15 49.15 74.35 49.15 74.55 49.15C73.303 49.395 72.036 49.595 70.75 49.75C70.941 49.6518 71.141 49.5518 71.35 49.45C71.039 49.3017 70.756 49.335 70.5 49.55C70.411 49.4919 70.311 49.4585 70.2 49.45C68.89 49.6392 67.606 49.8392 66.35 50.05C66.281 50.1025 66.231 50.1692 66.2 50.25C65.678 50.121 65.161 50.121 64.65 50.25C64.65 50.35 64.65 50.45 64.65 50.55C64.75 50.55 64.85 50.55 64.95 50.55C63.868 50.7522 62.768 50.9189 61.65 51.05C61.571 51.0217 61.504 50.9717 61.45 50.9C61.674 50.6733 61.94 50.5066 62.25 50.4C62.36 50.323 62.36 50.2397 62.25 50.15C62.35 50.1167 62.417 50.05 62.45 49.95C62.491 50.0762 62.524 50.2095 62.55 50.35C62.635 50.2478 62.735 50.1645 62.85 50.1C66.403 49.5266 69.97 49.0266 73.55 48.6C73.98 48.5193 74.347 48.336 74.65 48.05C74.769 48.1777 74.936 48.2444 75.15 48.25C75.364 48.2444 75.531 48.1777 75.65 48.05C75.765 48.1895 75.865 48.1728 75.95 48C76.544 47.8613 77.144 47.7613 77.75 47.7C78.323 47.5327 78.873 47.316 79.4 47.05C79.54 47.0509 79.657 47.1009 79.75 47.2C79.591 47.2862 79.425 47.3529 79.25 47.4C80.653 47.3878 82.053 47.3045 83.45 47.15Z"
                  fill="#303097"
                />
                <path
                  d="M74.65 48.05C74.983 48.05 75.317 48.05 75.65 48.05C75.531 48.1777 75.364 48.2444 75.15 48.25C74.936 48.2444 74.769 48.1777 74.65 48.05Z"
                  fill="#4141FE"
                />
                <path
                  d="M59.15 48.65C59.208 49.008 59.108 49.308 58.85 49.55C58.789 49.5376 58.756 49.5043 58.75 49.45C58.83 49.2958 58.863 49.1292 58.85 48.95C58.85 48.75 58.95 48.65 59.15 48.65Z"
                  fill="#1515A4"
                />
                <path
                  d="M66.95 48.65C66.158 48.7613 65.392 48.978 64.65 49.3C63.687 49.4059 62.754 49.5892 61.85 49.85C61.721 49.8263 61.621 49.8596 61.55 49.95C61.517 49.95 61.483 49.95 61.45 49.95C60.544 49.923 60.177 50.3564 60.35 51.25C60.317 51.25 60.283 51.25 60.25 51.25C60.27 50.6491 60.303 50.0491 60.35 49.45C62.55 49.1723 64.75 48.9056 66.95 48.65Z"
                  fill="#080A38"
                />
                <path
                  d="M79.35 49.25C79.995 49.1605 80.228 49.4438 80.05 50.1C79.917 53.7153 79.851 57.332 79.85 60.95C79.726 61.0602 79.592 61.1602 79.45 61.25C79.375 61.1624 79.325 61.0624 79.3 60.95C79.088 61.4447 78.855 61.4447 78.6 60.95C78.303 61.3301 78.103 61.2635 78 60.75C77.909 60.8328 77.842 60.9328 77.8 61.05C77.703 60.8122 77.636 60.8456 77.6 61.15C77.416 60.9546 77.333 60.7546 77.35 60.55C77.274 60.6628 77.207 60.7795 77.15 60.9C77.552 61.165 77.535 61.3816 77.1 61.55C77.05 61.5333 77 61.5167 76.95 61.5C77.063 61.476 77.113 61.426 77.1 61.35C76.928 61.215 76.745 61.0983 76.55 61C76.545 60.7941 76.561 60.5774 76.6 60.35C76.485 60.4458 76.385 60.4125 76.3 60.25C76.096 60.3285 75.896 60.2952 75.7 60.15C75.661 60.2428 75.595 60.3095 75.5 60.35C75.342 60.1971 75.158 60.1471 74.95 60.2C75.028 60.3073 75.011 60.424 74.9 60.55C74.831 60.4182 74.747 60.3349 74.65 60.3C74.796 60.0748 74.73 59.9248 74.45 59.85C74.563 59.6471 74.513 59.6137 74.3 59.75C74.167 59.6167 74.033 59.4833 73.9 59.35C73.798 59.6089 73.614 59.7255 73.35 59.7C73.162 59.4057 73.012 59.089 72.9 58.75C72.889 59.0447 72.739 59.178 72.45 59.15C72.465 59.0448 72.448 58.9448 72.4 58.85C72.225 58.9299 72.092 58.8632 72 58.65C71.959 58.6957 71.909 58.7291 71.85 58.75C71.817 58.6833 71.783 58.6167 71.75 58.55C71.691 58.5709 71.641 58.6043 71.6 58.65C71.554 58.5256 71.604 58.4423 71.75 58.4C71.685 58.2391 71.602 58.0891 71.5 57.95C71.412 58.1513 71.279 58.1513 71.1 57.95C71.019 58.1901 70.936 58.1734 70.85 57.9C70.586 57.8677 70.353 57.7677 70.15 57.6C70.217 57.5667 70.283 57.5333 70.35 57.5C70.21 57.4405 70.077 57.4572 69.95 57.55C69.875 57.4624 69.825 57.3624 69.8 57.25C69.616 57.3833 69.566 57.3666 69.65 57.2C69.576 57.0961 69.476 57.0461 69.35 57.05C69.219 56.9768 69.086 56.8934 68.95 56.8C69.16 56.7444 69.176 56.6944 69 56.65C68.84 56.8064 68.656 56.8564 68.45 56.8C68.671 56.7612 68.805 56.6612 68.85 56.5C68.661 56.3899 68.594 56.2566 68.65 56.1C68.539 56.0362 68.422 55.9862 68.3 55.95C68.068 56.1628 67.835 56.2962 67.6 56.35C67.459 56.2213 67.309 56.1046 67.15 56C67.183 55.9667 67.217 55.9333 67.25 55.9C67.181 55.7933 67.131 55.6766 67.1 55.55C67.058 55.6756 66.975 55.7423 66.85 55.75C66.653 55.3681 66.353 55.1014 65.95 54.95C65.599 54.8607 65.266 54.7107 64.95 54.5C65.017 54.4667 65.083 54.4333 65.15 54.4C65.017 54.216 65.033 54.166 65.2 54.25C65.25 54.2 65.3 54.15 65.35 54.1C65.232 54.0033 65.099 53.9533 64.95 53.95C65.062 53.8402 65.062 53.7235 64.95 53.6C64.991 53.5055 65.057 53.4388 65.15 53.4C64.967 53.2833 64.783 53.1667 64.6 53.05C64.575 52.5961 64.525 52.1461 64.45 51.7C64.535 51.5229 64.668 51.4063 64.85 51.35C65.358 51.1922 65.892 51.1255 66.45 51.15C68.008 50.9894 69.542 50.7561 71.05 50.45C72.523 50.1945 73.99 49.9445 75.45 49.7C76.743 49.4796 78.043 49.3296 79.35 49.25Z"
                  fill="#8A8A8A"
                />
                <path
                  d="M47.65 50.55C47.65 50.75 47.65 50.95 47.65 51.15C47.132 51.1153 46.632 51.0487 46.15 50.95C46.2833 50.95 46.4167 50.95 46.55 50.95C46.5657 50.8127 46.549 50.6793 46.5 50.55C46.2798 50.4087 46.0632 50.2587 45.85 50.1C44.0306 49.7721 42.1973 49.5054 40.35 49.3C40.3 49.25 40.25 49.2 40.2 49.15C39.875 49.1368 39.575 49.1701 39.3 49.25C38.7912 49.1467 38.2745 49.0633 37.75 49C36.3543 48.9539 34.9876 48.9873 33.65 49.1C33.7056 49.1383 33.7389 49.1883 33.75 49.25C32.7478 49.1331 31.7478 48.9997 30.75 48.85C30.7811 48.7522 30.8478 48.6855 30.95 48.65C31.1278 48.6569 31.3111 48.6903 31.5 48.75C31.5308 48.6692 31.5808 48.6025 31.65 48.55C32.3395 48.4002 33.0395 48.3336 33.75 48.35C35.143 48.5362 36.543 48.6529 37.95 48.7C38.8687 48.774 39.7687 48.9407 40.65 49.2C42.5145 49.4234 44.3812 49.6234 46.25 49.8C46.6217 50.0128 47.0217 50.1461 47.45 50.2C47.5085 50.3302 47.5751 50.4469 47.65 50.55Z"
                  fill="#0F1045"
                />
                <path
                  d="M39.35 49.45C39.5988 49.6388 39.8988 49.7055 40.25 49.65C40.2369 49.7376 40.2702 49.8043 40.35 49.85C40.6993 49.6672 41.0493 49.6005 41.4 49.65C42.6965 49.7966 43.9465 50.1299 45.15 50.65C45.4026 50.5609 45.6359 50.6109 45.85 50.8C45.4559 50.7733 45.0559 50.7566 44.65 50.75C42.6141 50.502 40.5808 50.2353 38.55 49.95C38.4737 49.8732 38.3737 49.8232 38.25 49.8C38.3 49.75 38.35 49.7 38.4 49.65C38.5667 49.6833 38.7333 49.7167 38.9 49.75C39.0615 49.6614 39.2115 49.5614 39.35 49.45Z"
                  fill="#18186E"
                />
                <path
                  d="M61.45 49.95C61.483 49.95 61.517 49.95 61.55 49.95C61.85 49.95 62.15 49.95 62.45 49.95C62.417 50.05 62.35 50.1167 62.25 50.15C62.014 50.1663 61.781 50.1497 61.55 50.1C61.494 50.0617 61.461 50.0117 61.45 49.95Z"
                  fill="#3A3AFB"
                />
                <path
                  d="M46.15 50.95C45.629 50.9392 45.129 50.8725 44.65 50.75C45.0559 50.7566 45.4559 50.7733 45.85 50.8C45.6359 50.6109 45.4026 50.5609 45.15 50.65C43.9465 50.1299 42.6965 49.7966 41.4 49.65C41.0493 49.6005 40.6993 49.6672 40.35 49.85C40.2702 49.8043 40.2369 49.7376 40.25 49.65C40.3289 49.6217 40.3956 49.5717 40.45 49.5C40.0848 49.4501 39.7182 49.4335 39.35 49.45C39.2115 49.5614 39.0615 49.6614 38.9 49.75C38.7333 49.7167 38.5667 49.6833 38.4 49.65C38.35 49.7 38.3 49.75 38.25 49.8C38.3737 49.8232 38.4737 49.8732 38.55 49.95C36.9365 49.7159 35.3365 49.4826 33.75 49.25C33.7389 49.1883 33.7056 49.1383 33.65 49.1C34.9876 48.9873 36.3543 48.9539 37.75 49C38.2745 49.0633 38.7912 49.1467 39.3 49.25C39.575 49.1701 39.875 49.1368 40.2 49.15C40.25 49.2 40.3 49.25 40.35 49.3C42.1973 49.5054 44.0306 49.7721 45.85 50.1C46.0632 50.2587 46.2798 50.4087 46.5 50.55C46.549 50.6793 46.5657 50.8127 46.55 50.95C46.4167 50.95 46.2833 50.95 46.15 50.95Z"
                  fill="#16165E"
                />
                <path
                  d="M39.35 49.45C39.7182 49.4335 40.0848 49.4501 40.45 49.5C40.3956 49.5717 40.3289 49.6217 40.25 49.65C39.8988 49.7055 39.5988 49.6388 39.35 49.45Z"
                  fill="#3030F5"
                />
                <path
                  d="M70.75 49.75C68.816 50.0072 66.883 50.2738 64.95 50.55C64.85 50.55 64.75 50.55 64.65 50.55C64.65 50.45 64.65 50.35 64.65 50.25C65.161 50.121 65.678 50.121 66.2 50.25C66.231 50.1692 66.281 50.1025 66.35 50.05C67.606 49.8392 68.89 49.6392 70.2 49.45C70.311 49.4585 70.411 49.4919 70.5 49.55C70.756 49.335 71.039 49.3017 71.35 49.45C71.141 49.5518 70.941 49.6518 70.75 49.75Z"
                  fill="#3232AF"
                />
                <path
                  d="M61.45 49.95C61.461 50.0117 61.494 50.0617 61.55 50.1C61.781 50.1497 62.014 50.1663 62.25 50.15C62.36 50.2397 62.36 50.323 62.25 50.4C61.94 50.5066 61.674 50.6733 61.45 50.9C61.504 50.9717 61.571 51.0217 61.65 51.05C61.238 51.1709 60.805 51.2376 60.35 51.25C60.177 50.3564 60.544 49.923 61.45 49.95Z"
                  fill="#292976"
                />
                <path
                  d="M104.35 40.55C104.383 40.55 104.417 40.55 104.45 40.55C104.492 41.0077 104.492 41.5077 104.45 42.05C106.966 42.2339 109.533 42.4839 112.15 42.8C112.417 42.8667 112.683 42.9333 112.95 43C113.09 43.1062 113.19 43.2395 113.25 43.4C113.092 46.5938 112.976 49.8104 112.9 53.05C112.834 53.28 112.784 53.5133 112.75 53.75C112.871 54.7412 112.871 55.6745 112.75 56.55C113.1 56.7615 113.467 56.9448 113.85 57.1C114.421 57.4934 114.654 58.0434 114.55 58.75C114.645 59.5335 114.412 60.1835 113.85 60.7C111.55 61.4416 109.217 62.0583 106.85 62.55C106.899 63.4635 106.816 64.3635 106.6 65.25C106.51 65.5069 106.393 65.7402 106.25 65.95C106.25 65.8833 106.25 65.8167 106.25 65.75C106.657 64.6894 106.823 63.5894 106.75 62.45C108.571 61.9532 110.404 61.5032 112.25 61.1C112.799 60.9393 113.332 60.7393 113.85 60.5C114.038 60.3457 114.188 60.1624 114.3 59.95C114.367 59.2167 114.367 58.4833 114.3 57.75C113.881 57.2822 113.364 56.9822 112.75 56.85C112.685 56.2411 112.652 55.6244 112.65 55C112.736 53.0171 112.803 51.0338 112.85 49.05C112.85 48.9167 112.85 48.7833 112.85 48.65C112.932 47.0995 112.999 45.5329 113.05 43.95C113.066 43.7143 113.05 43.481 113 43.25C112.726 43.144 112.443 43.0606 112.15 43C109.54 42.6747 106.94 42.3914 104.35 42.15C104.35 41.6167 104.35 41.0833 104.35 40.55Z"
                  fill="#9F9E9F"
                />
                <path
                  d="M80.85 50.35C81.206 50.539 81.239 50.789 80.95 51.1C80.821 51.149 80.687 51.1657 80.55 51.15C80.603 50.8646 80.703 50.5979 80.85 50.35Z"
                  fill="#434344"
                />
                <path
                  d="M71.05 50.45C69.542 50.7561 68.008 50.9894 66.45 51.15C66.526 51.0732 66.626 51.0232 66.75 51C68.182 50.7919 69.615 50.6085 71.05 50.45Z"
                  fill="#525252"
                />
                <path
                  d="M27.35 50.65C27.4161 50.7718 27.4828 50.9051 27.55 51.05C27.6478 51.0023 27.7311 50.9357 27.8 50.85C27.9259 51.4419 27.7426 51.5752 27.25 51.25C27.115 51.0217 27.1483 50.8217 27.35 50.65Z"
                  fill="#4D4D4D"
                />
                <path
                  d="M51.85 52.15C53.5833 52.15 55.317 52.15 57.05 52.15C57.717 52.15 58.383 52.15 59.05 52.15C59.263 52.2126 59.429 52.3459 59.55 52.55C59.459 52.6328 59.392 52.7328 59.35 52.85C59.617 53.2159 59.55 53.5326 59.15 53.8C59.3 53.8507 59.416 53.8007 59.5 53.65C59.517 53.7 59.533 53.75 59.55 53.8C59.435 53.973 59.435 54.1396 59.55 54.3C59.349 54.4791 59.349 54.6125 59.55 54.7C59.469 54.7308 59.403 54.7808 59.35 54.85C59.243 55.23 59.243 55.6133 59.35 56C59.31 56.1473 59.243 56.2806 59.15 56.4C59.417 56.5 59.417 56.6 59.15 56.7C59.231 56.7308 59.297 56.7808 59.35 56.85C59.236 56.9425 59.236 57.0259 59.35 57.1C59.283 57.1333 59.217 57.1667 59.15 57.2C59.264 57.554 59.331 57.9207 59.35 58.3C59.054 58.384 59.02 58.484 59.25 58.6C59.054 58.8518 58.987 59.1184 59.05 59.4C59.195 59.5958 59.229 59.7958 59.15 60C59.236 60.0689 59.302 60.1522 59.35 60.25C59.256 60.2489 59.189 60.2989 59.15 60.4C59.189 60.5011 59.256 60.5511 59.35 60.55C59.297 60.6192 59.231 60.6692 59.15 60.7C59.275 60.8458 59.275 60.9958 59.15 61.15C59.365 61.2682 59.365 61.4182 59.15 61.6C59.142 61.7907 59.175 61.9907 59.25 62.2C59.174 62.3441 59.107 62.4941 59.05 62.65C59.1 62.9729 59.166 63.2896 59.25 63.6C58.663 63.7831 58.497 64.1331 58.75 64.65C58.717 64.6833 58.683 64.7167 58.65 64.75C58.582 64.6757 58.515 64.6091 58.45 64.55C58.439 64.4883 58.406 64.4383 58.35 64.4C56.518 64.4294 54.6843 64.4794 52.85 64.55C52.0715 64.5715 51.3049 64.5048 50.55 64.35C52.6342 64.3742 54.7342 64.3409 56.85 64.25C56.834 64.1127 56.851 63.9793 56.9 63.85C56.972 63.9451 57.055 63.9617 57.15 63.9C57.095 63.7602 57.062 63.6268 57.05 63.5C57.117 63.4667 57.183 63.4333 57.25 63.4C57.126 63.233 57.06 62.9996 57.05 62.7C57.234 62.4858 57.267 62.2691 57.15 62.05C57.28 61.7887 57.347 61.5387 57.35 61.3C57.283 61.2333 57.217 61.1667 57.15 61.1C57.55 61.0333 57.55 60.9667 57.15 60.9C57.405 60.6274 57.438 60.3607 57.25 60.1C57.289 59.9989 57.356 59.9489 57.45 59.95C57.402 59.8522 57.336 59.7689 57.25 59.7C57.496 59.5488 57.496 59.4154 57.25 59.3C57.492 59.1112 57.492 58.9112 57.25 58.7C57.317 58.6667 57.383 58.6333 57.45 58.6C57.211 58.5309 57.211 58.4309 57.45 58.3C57.385 57.9642 57.352 57.6309 57.35 57.3C57.417 57.2333 57.483 57.1667 57.55 57.1C57.329 56.8737 57.396 56.7071 57.75 56.6C57.617 56.5333 57.617 56.4667 57.75 56.4C57.354 56.2789 57.287 56.0789 57.55 55.8C57.202 55.7187 57.169 55.5521 57.45 55.3C57.35 55.2167 57.25 55.1333 57.15 55.05C57.283 55.0167 57.417 54.9833 57.55 54.95C57.519 54.8692 57.469 54.8025 57.4 54.75C57.328 54.8451 57.245 54.8617 57.15 54.8C57.269 54.6647 57.402 54.548 57.55 54.45C57.436 54.3575 57.436 54.2741 57.55 54.2C57.349 54.1125 57.349 53.9791 57.55 53.8C57.476 53.6235 57.476 53.4235 57.55 53.2C57.317 53.0638 57.217 52.8472 57.25 52.55C57.41 52.5688 57.544 52.5188 57.65 52.4C57.583 52.3667 57.517 52.3333 57.45 52.3C55.566 52.2832 53.6996 52.2332 51.85 52.15Z"
                  fill="#989796"
                />
                <path
                  d="M44.35 53.15C44.485 53.2483 44.585 53.3816 44.65 53.55C44.7167 53.4833 44.7833 53.4167 44.85 53.35C44.9363 53.5771 44.9363 53.8105 44.85 54.05C44.2667 54.0087 44.1001 53.7087 44.35 53.15Z"
                  fill="#555555"
                />
                <path
                  d="M32.55 57.75C32.3864 57.8749 32.2697 58.0416 32.2 58.25C32.0871 58.4141 31.9371 58.5141 31.75 58.55C29.0386 58.1571 26.3386 57.7237 23.65 57.25C23.0061 56.6196 22.8894 55.8863 23.3 55.05C23.4574 54.9152 23.6407 54.8486 23.85 54.85C26.4742 55.3582 29.1075 55.8082 31.75 56.2C32.2954 56.5742 32.5621 57.0909 32.55 57.75Z"
                  fill="#151515"
                />
                <path
                  d="M63.45 54.95C63.583 54.95 63.717 54.95 63.85 54.95C63.817 55.0167 63.783 55.0833 63.75 55.15C63.598 55.1511 63.482 55.2177 63.4 55.35C62.945 56.0254 62.861 56.7254 63.15 57.45C63.287 57.625 63.387 57.825 63.45 58.05C63.259 57.9925 63.092 57.8925 62.95 57.75C62.703 57.3905 62.603 56.9905 62.65 56.55C62.567 55.8279 62.834 55.2945 63.45 54.95Z"
                  fill="#3B3832"
                />
                <path
                  d="M63.45 54.95C62.834 55.2945 62.567 55.8279 62.65 56.55C62.345 56.7113 62.095 56.6446 61.9 56.35C61.841 56.5863 61.691 56.6863 61.45 56.65C61.45 56.4167 61.45 56.1833 61.45 55.95C61.704 54.7598 62.37 54.4264 63.45 54.95Z"
                  fill="#7B7B1B"
                />
                <path
                  d="M65.95 54.95C66.353 55.1014 66.653 55.3681 66.85 55.75C66.85 55.85 66.85 55.95 66.85 56.05C66.85 56.1833 66.85 56.3167 66.85 56.45C66.576 56.4293 66.343 56.3293 66.15 56.15C65.898 56.184 65.782 56.3174 65.8 56.55C65.94 56.3473 66.106 56.314 66.3 56.45C66.367 56.6833 66.367 56.9167 66.3 57.15C66.16 57.3527 65.994 57.386 65.8 57.25C65.78 57.0744 65.73 56.9078 65.65 56.75C65.5 57.0131 65.433 56.9797 65.45 56.65C65.282 56.6285 65.182 56.6952 65.15 56.85C64.931 56.9823 64.781 57.1823 64.7 57.45C64.511 57.387 64.344 57.287 64.2 57.15C64.138 57.2449 64.155 57.3282 64.25 57.4C63.847 57.4576 63.481 57.3742 63.15 57.15C63.049 56.3856 63.249 55.7189 63.75 55.15C63.783 55.0833 63.817 55.0167 63.85 54.95C64.545 54.8749 65.245 54.8749 65.95 54.95Z"
                  fill="#3B1414"
                />
                <path
                  d="M65.85 55.55C66.258 55.5017 66.491 55.6684 66.55 56.05C66.19 56.0323 65.856 56.0823 65.55 56.2C65.504 56.1586 65.471 56.1086 65.45 56.05C65.586 55.8814 65.719 55.7148 65.85 55.55Z"
                  fill="#6F5D5D"
                />
                <path
                  d="M108.65 56.35C108.982 56.577 109.048 56.877 108.85 57.25C108.683 57.3167 108.517 57.3833 108.35 57.45C108.35 57.35 108.35 57.25 108.35 57.15C108.25 57.15 108.15 57.15 108.05 57.15C108.053 57.4742 107.92 57.5075 107.65 57.25C107.617 57.1833 107.583 57.1167 107.55 57.05C107.695 56.915 107.762 56.7484 107.75 56.55C107.887 56.5343 108.021 56.551 108.15 56.6C108.138 56.7281 108.188 56.8448 108.3 56.95C108.482 56.7854 108.599 56.5854 108.65 56.35Z"
                  fill="#606061"
                />
                <path
                  d="M63.75 55.15C63.249 55.7189 63.049 56.3856 63.15 57.15C63.15 57.25 63.15 57.35 63.15 57.45C62.861 56.7254 62.945 56.0254 63.4 55.35C63.482 55.2177 63.598 55.1511 63.75 55.15Z"
                  fill="#594D24"
                />
                <path
                  d="M66.85 56.05C66.983 56.4833 66.983 56.9167 66.85 57.35C66.865 57.2448 66.848 57.1448 66.8 57.05C66.717 57.4166 66.534 57.7166 66.25 57.95C66.127 57.8349 66.127 57.7183 66.25 57.6C65.923 57.6063 65.707 57.4563 65.6 57.15C65.695 57.4358 65.779 57.7358 65.85 58.05C65.61 58.0607 65.426 57.9607 65.3 57.75C65.185 57.4607 65.135 57.1607 65.15 56.85C65.182 56.6952 65.282 56.6285 65.45 56.65C65.433 56.9797 65.5 57.0131 65.65 56.75C65.73 56.9078 65.78 57.0744 65.8 57.25C65.994 57.386 66.16 57.3527 66.3 57.15C66.367 56.9167 66.367 56.6833 66.3 56.45C66.106 56.314 65.94 56.3473 65.8 56.55C65.782 56.3174 65.898 56.184 66.15 56.15C66.343 56.3293 66.576 56.4293 66.85 56.45C66.85 56.3167 66.85 56.1833 66.85 56.05Z"
                  fill="#615151"
                />
                <path
                  d="M61.45 55.95C61.45 56.1833 61.45 56.4167 61.45 56.65C61.691 56.6863 61.841 56.5863 61.9 56.35C62.095 56.6446 62.345 56.7113 62.65 56.55C62.603 56.9905 62.703 57.3905 62.95 57.75C62.903 57.8693 62.803 57.936 62.65 57.95C62.382 57.9064 62.115 57.8564 61.85 57.8C61.635 57.5005 61.468 57.1838 61.35 56.85C61.319 56.5287 61.352 56.2287 61.45 55.95Z"
                  fill="#5E5D17"
                />
                <path
                  d="M69.35 57.05C69.18 57.2732 69.064 57.5399 69 57.85C68.87 57.956 68.754 58.0726 68.65 58.2C68.762 58.3235 68.762 58.4402 68.65 58.55C68.744 58.5489 68.811 58.5989 68.85 58.7C68.839 58.8722 68.789 58.8888 68.7 58.75C68.613 58.9896 68.663 59.0563 68.85 58.95C68.985 59.0518 69.085 59.1851 69.15 59.35C69.268 59.2145 69.368 59.2312 69.45 59.4C69.324 59.5113 69.207 59.528 69.1 59.45C69.02 59.6801 69.07 59.8968 69.25 60.1C68.875 60.2166 68.775 60.45 68.95 60.8C68.91 60.9473 68.843 61.0806 68.75 61.2C68.885 61.2772 68.968 61.3939 69 61.55C69.186 62.4332 68.92 62.6999 68.2 62.35C68.131 62.5891 68.031 62.5891 67.9 62.35C67.524 62.5904 67.174 62.857 66.85 63.15C66.658 63.2308 66.458 63.2808 66.25 63.3C66.317 63.3333 66.383 63.3667 66.45 63.4C66.179 63.5805 65.912 63.5805 65.65 63.4C65.752 63.2951 65.768 63.1784 65.7 63.05C65.575 63.3816 65.408 63.415 65.2 63.15C65.077 63.3947 64.927 63.4113 64.75 63.2C65.168 63.0604 65.201 62.9104 64.85 62.75C64.761 62.6675 64.728 62.5675 64.75 62.45C64.588 62.436 64.471 62.5027 64.4 62.65C64.383 61.7814 64.333 60.9148 64.25 60.05C64.118 59.7972 64.002 59.7972 63.9 60.05C63.7 59.9833 63.567 59.85 63.5 59.65C63.256 59.7906 63.006 59.924 62.75 60.05C62.313 59.7601 61.946 59.4601 61.65 59.15C61.743 58.9678 61.676 58.8345 61.45 58.75C61.645 58.5332 61.712 58.2998 61.65 58.05C61.508 57.6591 61.408 57.2591 61.35 56.85C61.468 57.1838 61.635 57.5005 61.85 57.8C62.115 57.8564 62.382 57.9064 62.65 57.95C62.803 57.936 62.903 57.8693 62.95 57.75C63.092 57.8925 63.259 57.9925 63.45 58.05C64.199 58.4047 64.999 58.5713 65.85 58.55C65.938 58.5369 66.004 58.5702 66.05 58.65C65.912 58.9547 65.679 59.088 65.35 59.05C65.365 58.9448 65.348 58.8448 65.3 58.75C64.914 59.5524 64.848 60.3857 65.1 61.25C65.839 62.1624 66.522 62.1124 67.15 61.1C67.683 59.9212 67.483 58.9045 66.55 58.05C66.669 57.8249 66.769 57.5915 66.85 57.35C66.983 56.9167 66.983 56.4833 66.85 56.05C66.85 55.95 66.85 55.85 66.85 55.75C66.975 55.7423 67.058 55.6756 67.1 55.55C67.131 55.6766 67.181 55.7933 67.25 55.9C67.217 55.9333 67.183 55.9667 67.15 56C67.309 56.1046 67.459 56.2213 67.6 56.35C67.835 56.2962 68.068 56.1628 68.3 55.95C68.422 55.9862 68.539 56.0362 68.65 56.1C68.594 56.2566 68.661 56.3899 68.85 56.5C68.805 56.6612 68.671 56.7612 68.45 56.8C68.656 56.8564 68.84 56.8064 69 56.65C69.176 56.6944 69.16 56.7444 68.95 56.8C69.086 56.8934 69.219 56.9768 69.35 57.05Z"
                  fill="#7C7B7B"
                />
                <path
                  d="M64.85 51.35C64.668 51.4063 64.535 51.5229 64.45 51.7C64.525 52.1461 64.575 52.5961 64.6 53.05C64.783 53.1667 64.967 53.2833 65.15 53.4C65.057 53.4388 64.991 53.5055 64.95 53.6C65.062 53.7235 65.062 53.8402 64.95 53.95C65.099 53.9533 65.232 54.0033 65.35 54.1C65.3 54.15 65.25 54.2 65.2 54.25C65.033 54.166 65.017 54.216 65.15 54.4C65.083 54.4333 65.017 54.4667 64.95 54.5C65.266 54.7107 65.599 54.8607 65.95 54.95C65.245 54.8749 64.545 54.8749 63.85 54.95C63.717 54.95 63.583 54.95 63.45 54.95C62.37 54.4264 61.704 54.7598 61.45 55.95C61.352 56.2287 61.319 56.5287 61.35 56.85C61.408 57.2591 61.508 57.6591 61.65 58.05C61.712 58.2998 61.645 58.5332 61.45 58.75C61.676 58.8345 61.743 58.9678 61.65 59.15C61.946 59.4601 62.313 59.7601 62.75 60.05C63.006 59.924 63.256 59.7906 63.5 59.65C63.567 59.85 63.7 59.9833 63.9 60.05C64.002 59.7972 64.118 59.7972 64.25 60.05C64.333 60.9148 64.383 61.7814 64.4 62.65C64.471 62.5027 64.588 62.436 64.75 62.45C64.728 62.5675 64.761 62.6675 64.85 62.75C65.201 62.9104 65.168 63.0604 64.75 63.2C64.927 63.4113 65.077 63.3947 65.2 63.15C65.408 63.415 65.575 63.3816 65.7 63.05C65.768 63.1784 65.752 63.2951 65.65 63.4C65.912 63.5805 66.179 63.5805 66.45 63.4C66.383 63.3667 66.317 63.3333 66.25 63.3C66.458 63.2808 66.658 63.2308 66.85 63.15C67.174 62.857 67.524 62.5904 67.9 62.35C68.031 62.5891 68.131 62.5891 68.2 62.35C68.92 62.6999 69.186 62.4332 69 61.55C68.968 61.3939 68.885 61.2772 68.75 61.2C68.843 61.0806 68.91 60.9473 68.95 60.8C68.775 60.45 68.875 60.2166 69.25 60.1C69.07 59.8968 69.02 59.6801 69.1 59.45C69.207 59.528 69.324 59.5113 69.45 59.4C69.368 59.2312 69.268 59.2145 69.15 59.35C69.085 59.1851 68.985 59.0518 68.85 58.95C68.663 59.0563 68.613 58.9896 68.7 58.75C68.789 58.8888 68.839 58.8722 68.85 58.7C68.811 58.5989 68.744 58.5489 68.65 58.55C68.762 58.4402 68.762 58.3235 68.65 58.2C68.754 58.0726 68.87 57.956 69 57.85C69.064 57.5399 69.18 57.2732 69.35 57.05C69.476 57.0461 69.576 57.0961 69.65 57.2C69.566 57.3666 69.616 57.3833 69.8 57.25C69.825 57.3624 69.875 57.4624 69.95 57.55C70.077 57.4572 70.21 57.4405 70.35 57.5C70.283 57.5333 70.217 57.5667 70.15 57.6C70.353 57.7677 70.586 57.8677 70.85 57.9C70.936 58.1734 71.019 58.1901 71.1 57.95C71.279 58.1513 71.412 58.1513 71.5 57.95C71.602 58.0891 71.685 58.2391 71.75 58.4C71.604 58.4423 71.554 58.5256 71.6 58.65C71.641 58.6043 71.691 58.5709 71.75 58.55C71.783 58.6167 71.817 58.6833 71.85 58.75C71.909 58.7291 71.959 58.6957 72 58.65C72.092 58.8632 72.225 58.9299 72.4 58.85C72.448 58.9448 72.465 59.0448 72.45 59.15C72.739 59.178 72.889 59.0447 72.9 58.75C73.012 59.089 73.162 59.4057 73.35 59.7C73.614 59.7255 73.798 59.6089 73.9 59.35C74.033 59.4833 74.167 59.6167 74.3 59.75C74.513 59.6137 74.563 59.6471 74.45 59.85C74.73 59.9248 74.796 60.0748 74.65 60.3C74.747 60.3349 74.831 60.4182 74.9 60.55C75.011 60.424 75.028 60.3073 74.95 60.2C75.158 60.1471 75.342 60.1971 75.5 60.35C75.595 60.3095 75.661 60.2428 75.7 60.15C75.896 60.2952 76.096 60.3285 76.3 60.25C76.385 60.4125 76.485 60.4458 76.6 60.35C76.561 60.5774 76.545 60.7941 76.55 61C76.745 61.0983 76.928 61.215 77.1 61.35C77.113 61.426 77.063 61.476 76.95 61.5C77 61.5167 77.05 61.5333 77.1 61.55C77.535 61.3816 77.552 61.165 77.15 60.9C77.207 60.7795 77.274 60.6628 77.35 60.55C77.333 60.7546 77.416 60.9546 77.6 61.15C77.636 60.8456 77.703 60.8122 77.8 61.05C77.842 60.9328 77.909 60.8328 78 60.75C78.103 61.2635 78.303 61.3301 78.6 60.95C78.855 61.4447 79.088 61.4447 79.3 60.95C79.325 61.0624 79.375 61.1624 79.45 61.25C79.592 61.1602 79.726 61.0602 79.85 60.95C79.799 63.4165 79.749 65.8831 79.7 68.35C78.727 68.3301 77.81 68.5468 76.95 69C75.74 69.1876 74.54 69.4042 73.35 69.65C73.367 69.0824 73.35 68.5157 73.3 67.95C72.934 67.5897 72.484 67.4231 71.95 67.45C71.682 67.4837 71.416 67.517 71.15 67.55C71.15 67.2833 71.15 67.0167 71.15 66.75C70.907 66.7523 70.674 66.8023 70.45 66.9C70.208 67.1094 69.941 67.276 69.65 67.4C67.781 67.7698 65.948 68.2198 64.15 68.75C62.638 69.0854 61.138 69.4187 59.65 69.75C59.517 69.75 59.383 69.75 59.25 69.75C59.43 69.6307 59.597 69.514 59.75 69.4C59.686 69.1071 59.786 68.8571 60.05 68.65C60.038 68.4622 60.038 68.2789 60.05 68.1C60.283 67.9757 60.35 67.8091 60.25 67.6C60.313 67.4108 60.413 67.2441 60.55 67.1C60.407 66.9286 60.441 66.7953 60.65 66.7C60.643 66.241 60.61 65.8077 60.55 65.4C60.649 65.079 60.716 64.779 60.75 64.5C60.683 64.3667 60.617 64.2333 60.55 64.1C60.781 63.9207 60.814 63.704 60.65 63.45C60.698 63.3522 60.764 63.2689 60.85 63.2C60.779 62.9204 60.712 62.637 60.65 62.35C60.698 62.2522 60.764 62.1689 60.85 62.1C60.801 61.5492 60.768 60.9992 60.75 60.45C60.803 60.3808 60.869 60.3308 60.95 60.3C61.011 60.0816 60.944 59.8816 60.75 59.7C60.879 59.4534 60.879 59.2034 60.75 58.95C60.812 58.6961 60.878 58.4461 60.95 58.2C60.833 58.0132 60.867 57.8298 61.05 57.65C61.069 56.915 61.069 56.1983 61.05 55.5C61.117 55.4333 61.183 55.3667 61.25 55.3C61.131 54.8935 61.264 54.5268 61.65 54.2C61.567 54.1085 61.467 54.0419 61.35 54C61.417 53.9667 61.483 53.9333 61.55 53.9C61.417 53.8 61.417 53.7 61.55 53.6C61.428 53.3904 61.345 53.4071 61.3 53.65C61.234 53.4892 61.284 53.3725 61.45 53.3C61.374 53.1488 61.274 53.0154 61.15 52.9C61.307 52.7174 61.391 52.5007 61.4 52.25C61.409 52.5849 61.526 52.6349 61.75 52.4C61.6 52.1833 61.417 52 61.2 51.85C61.078 52.1351 60.928 52.4018 60.75 52.65C60.783 52.9167 60.817 53.1833 60.85 53.45C60.72 53.6336 60.637 53.8336 60.6 54.05C60.553 53.9069 60.47 53.7903 60.35 53.7C60.417 53.6 60.483 53.5 60.55 53.4C60.498 53.1974 60.465 52.9974 60.45 52.8C60.641 52.6144 60.724 52.3977 60.7 52.15C60.222 52.0383 59.672 52.0383 59.05 52.15C58.383 52.15 57.717 52.15 57.05 52.15C59.641 51.9242 62.241 51.6575 64.85 51.35Z"
                  fill="#868585"
                />
                <path
                  d="M63.45 53.05C63.644 53.1014 63.744 53.2347 63.75 53.45C63.695 53.6135 63.662 53.7801 63.65 53.95C63.483 53.95 63.317 53.95 63.15 53.95C63.167 53.8178 63.134 53.7011 63.05 53.6C63.23 53.4469 63.363 53.2636 63.45 53.05Z"
                  fill="#47453F"
                />
                <path
                  d="M112.75 56.85C113.364 56.9822 113.881 57.2822 114.3 57.75C114.367 58.4833 114.367 59.2167 114.3 59.95C114.188 60.1624 114.038 60.3457 113.85 60.5C113.332 60.7393 112.799 60.9393 112.25 61.1C110.404 61.5032 108.571 61.9532 106.75 62.45C106.583 62.45 106.417 62.45 106.25 62.45C106.062 62.3659 105.862 62.3325 105.65 62.35C105.634 61.7833 105.6 61.75 105.55 62.25C105.319 62.2007 105.086 62.1674 104.85 62.15C104.85 61.95 104.85 61.75 104.85 61.55C105.304 61.5948 105.737 61.5281 106.15 61.35C106.252 61.2998 106.269 61.2332 106.2 61.15C105.659 61.0527 105.109 61.0193 104.55 61.05C104.756 60.5628 104.889 60.0628 104.95 59.55C105.148 59.7168 105.381 59.7834 105.65 59.75C105.704 60.1172 105.738 60.0838 105.75 59.65C107.677 59.2016 109.61 58.785 111.55 58.4C111.932 58.2723 112.299 58.1057 112.65 57.9C112.462 57.9096 112.295 57.8929 112.15 57.85C112.373 57.7772 112.557 57.6439 112.7 57.45C112.733 57.4833 112.767 57.5167 112.8 57.55C112.789 57.3822 112.739 57.2155 112.65 57.05C112.654 56.9584 112.688 56.8917 112.75 56.85Z"
                  fill="#060606"
                />
                <path
                  d="M23.65 57.25C26.3386 57.7237 29.0386 58.1571 31.75 58.55C31.559 58.6684 31.5257 58.8184 31.65 59C31.5906 59.0464 31.5239 59.0631 31.45 59.05C28.9146 58.614 26.3813 58.164 23.85 57.7C23.7733 57.553 23.7067 57.403 23.65 57.25Z"
                  fill="#2E2E2E"
                />
                <path
                  d="M65.15 56.85C65.135 57.1607 65.185 57.4607 65.3 57.75C65.426 57.9607 65.61 58.0607 65.85 58.05C65.779 57.7358 65.695 57.4358 65.6 57.15C65.707 57.4563 65.923 57.6063 66.25 57.6C66.127 57.7183 66.127 57.8349 66.25 57.95C66.534 57.7166 66.717 57.4166 66.8 57.05C66.848 57.1448 66.865 57.2448 66.85 57.35C66.769 57.5915 66.669 57.8249 66.55 58.05C66.34 58.2616 66.107 58.4283 65.85 58.55C64.999 58.5713 64.199 58.4047 63.45 58.05C63.387 57.825 63.287 57.625 63.15 57.45C63.15 57.35 63.15 57.25 63.15 57.15C63.481 57.3742 63.847 57.4576 64.25 57.4C64.155 57.3282 64.138 57.2449 64.2 57.15C64.344 57.287 64.511 57.387 64.7 57.45C64.781 57.1823 64.931 56.9823 65.15 56.85Z"
                  fill="#2D1314"
                />
                <path
                  d="M59.25 69.75C56.642 70.0555 54.0416 70.1222 51.45 69.95C52.65 69.95 53.85 69.95 55.05 69.95C55.028 69.8325 55.061 69.7325 55.15 69.65C55.272 69.7711 55.389 69.7711 55.5 69.65C55.707 69.9014 55.857 69.8848 55.95 69.6C56.256 69.5849 56.489 69.4515 56.65 69.2C56.617 69.1667 56.583 69.1333 56.55 69.1C56.771 68.9491 56.954 68.7658 57.1 68.55C57.284 68.6833 57.334 68.6666 57.25 68.5C57.468 68.2489 57.718 68.0322 58 67.85C58.068 67.7216 58.052 67.6049 57.95 67.5C58.117 67.3494 58.217 67.1661 58.25 66.95C58.355 66.9649 58.455 66.9483 58.55 66.9C58.475 66.7266 58.425 66.5433 58.4 66.35C58.333 66.2167 58.267 66.2167 58.2 66.35C58.133 66.25 58.133 66.15 58.2 66.05C58.289 66.1711 58.373 66.1711 58.45 66.05C58.333 65.9416 58.2 65.8583 58.05 65.8C57.484 65.7501 56.918 65.7334 56.35 65.75C56.976 65.6918 57.609 65.6085 58.25 65.5C58.434 65.2174 58.501 64.9007 58.45 64.55C58.515 64.6091 58.582 64.6757 58.65 64.75C58.683 64.7167 58.717 64.6833 58.75 64.65C58.497 64.1331 58.663 63.7831 59.25 63.6C59.166 63.2896 59.1 62.9729 59.05 62.65C59.107 62.4941 59.174 62.3441 59.25 62.2C59.175 61.9907 59.142 61.7907 59.15 61.6C59.365 61.4182 59.365 61.2682 59.15 61.15C59.275 60.9958 59.275 60.8458 59.15 60.7C59.231 60.6692 59.297 60.6192 59.35 60.55C59.256 60.5511 59.189 60.5011 59.15 60.4C59.189 60.2989 59.256 60.2489 59.35 60.25C59.302 60.1522 59.236 60.0689 59.15 60C59.229 59.7958 59.195 59.5958 59.05 59.4C58.987 59.1184 59.054 58.8518 59.25 58.6C59.02 58.484 59.054 58.384 59.35 58.3C59.331 57.9207 59.264 57.554 59.15 57.2C59.217 57.1667 59.283 57.1333 59.35 57.1C59.236 57.0259 59.236 56.9425 59.35 56.85C59.297 56.7808 59.231 56.7308 59.15 56.7C59.417 56.6 59.417 56.5 59.15 56.4C59.243 56.2806 59.31 56.1473 59.35 56C59.243 55.6133 59.243 55.23 59.35 54.85C59.403 54.7808 59.469 54.7308 59.55 54.7C59.349 54.6125 59.349 54.4791 59.55 54.3C59.435 54.1396 59.435 53.973 59.55 53.8C59.533 53.75 59.517 53.7 59.5 53.65C59.416 53.8007 59.3 53.8507 59.15 53.8C59.55 53.5326 59.617 53.2159 59.35 52.85C59.392 52.7328 59.459 52.6328 59.55 52.55C59.429 52.3459 59.263 52.2126 59.05 52.15C59.672 52.0383 60.222 52.0383 60.7 52.15C60.724 52.3977 60.641 52.6144 60.45 52.8C60.465 52.9974 60.498 53.1974 60.55 53.4C60.483 53.5 60.417 53.6 60.35 53.7C60.47 53.7903 60.553 53.9069 60.6 54.05C60.637 53.8336 60.72 53.6336 60.85 53.45C60.817 53.1833 60.783 52.9167 60.75 52.65C60.928 52.4018 61.078 52.1351 61.2 51.85C61.417 52 61.6 52.1833 61.75 52.4C61.526 52.6349 61.409 52.5849 61.4 52.25C61.391 52.5007 61.307 52.7174 61.15 52.9C61.274 53.0154 61.374 53.1488 61.45 53.3C61.284 53.3725 61.234 53.4892 61.3 53.65C61.345 53.4071 61.428 53.3904 61.55 53.6C61.417 53.7 61.417 53.8 61.55 53.9C61.483 53.9333 61.417 53.9667 61.35 54C61.467 54.0419 61.567 54.1085 61.65 54.2C61.264 54.5268 61.131 54.8935 61.25 55.3C61.183 55.3667 61.117 55.4333 61.05 55.5C61.069 56.1983 61.069 56.915 61.05 57.65C60.867 57.8298 60.833 58.0132 60.95 58.2C60.878 58.4461 60.812 58.6961 60.75 58.95C60.879 59.2034 60.879 59.4534 60.75 59.7C60.944 59.8816 61.011 60.0816 60.95 60.3C60.869 60.3308 60.803 60.3808 60.75 60.45C60.768 60.9992 60.801 61.5492 60.85 62.1C60.764 62.1689 60.698 62.2522 60.65 62.35C60.712 62.637 60.779 62.9204 60.85 63.2C60.764 63.2689 60.698 63.3522 60.65 63.45C60.814 63.704 60.781 63.9207 60.55 64.1C60.617 64.2333 60.683 64.3667 60.75 64.5C60.716 64.779 60.649 65.079 60.55 65.4C60.61 65.8077 60.643 66.241 60.65 66.7C60.441 66.7953 60.407 66.9286 60.55 67.1C60.413 67.2441 60.313 67.4108 60.25 67.6C60.35 67.8091 60.283 67.9757 60.05 68.1C60.038 68.2789 60.038 68.4622 60.05 68.65C59.786 68.8571 59.686 69.1071 59.75 69.4C59.597 69.514 59.43 69.6307 59.25 69.75Z"
                  fill="#8F8E8D"
                />
                <path
                  d="M32.55 57.75C32.5569 58.1897 32.4402 58.5897 32.2 58.95C31.9643 59.1646 31.7143 59.1979 31.45 59.05C31.5239 59.0631 31.5906 59.0464 31.65 59C31.5257 58.8184 31.559 58.6684 31.75 58.55C31.9371 58.5141 32.0871 58.4141 32.2 58.25C32.2697 58.0416 32.3864 57.8749 32.55 57.75Z"
                  fill="#5B5C5D"
                />
                <path
                  d="M112.15 57.85C112.295 57.8929 112.462 57.9096 112.65 57.9C112.299 58.1057 111.932 58.2723 111.55 58.4C109.61 58.785 107.677 59.2016 105.75 59.65C105.738 60.0838 105.704 60.1172 105.65 59.75C105.381 59.7834 105.148 59.7168 104.95 59.55C107.205 59.0054 109.471 58.4721 111.75 57.95C111.883 57.9167 112.017 57.8833 112.15 57.85Z"
                  fill="#515151"
                />
                <path
                  d="M79.35 49.25C79.606 49.1233 79.873 49.1233 80.15 49.25C80.074 53.0162 80.041 56.7828 80.05 60.55C79.945 63.0003 79.895 65.4669 79.9 67.95C79.969 68.0357 80.052 68.1023 80.15 68.15C80.307 68.0691 80.474 68.0357 80.65 68.05C80.65 68.0833 80.65 68.1167 80.65 68.15C80.488 68.2038 80.322 68.2371 80.15 68.25C80.15 68.35 80.15 68.45 80.15 68.55C79.614 68.567 79.081 68.617 78.55 68.7C76.843 69.2318 75.109 69.6485 73.35 69.95C73.35 69.85 73.35 69.75 73.35 69.65C74.54 69.4042 75.74 69.1876 76.95 69C77.81 68.5468 78.727 68.3301 79.7 68.35C79.749 65.8831 79.799 63.4165 79.85 60.95C79.851 57.332 79.917 53.7153 80.05 50.1C80.228 49.4438 79.995 49.1605 79.35 49.25Z"
                  fill="#6A6A6B"
                />
                <path
                  d="M9.35 61.65C9.0211 61.4603 8.9211 61.1937 9.05 60.85C9.1482 60.7859 9.2482 60.7193 9.35 60.65C9.4806 60.998 9.4806 61.3313 9.35 61.65Z"
                  fill="#EAEAEA"
                />
                <path
                  d="M66.55 58.05C67.483 58.9045 67.683 59.9212 67.15 61.1C66.522 62.1124 65.839 62.1624 65.1 61.25C64.848 60.3857 64.914 59.5524 65.3 58.75C65.348 58.8448 65.365 58.9448 65.35 59.05C65.679 59.088 65.912 58.9547 66.05 58.65C66.004 58.5702 65.938 58.5369 65.85 58.55C66.107 58.4283 66.34 58.2616 66.55 58.05Z"
                  fill="#49494A"
                />
                <path
                  d="M104.55 61.05C105.109 61.0193 105.659 61.0527 106.2 61.15C106.269 61.2332 106.252 61.2998 106.15 61.35C105.737 61.5281 105.304 61.5948 104.85 61.55C104.783 61.55 104.75 61.5167 104.75 61.45C105.085 61.4665 105.418 61.4498 105.75 61.4C105.831 61.3692 105.897 61.3192 105.95 61.25C105.502 61.1189 105.068 61.1189 104.65 61.25C104.566 61.2158 104.533 61.1492 104.55 61.05Z"
                  fill="#493710"
                />
                <path
                  d="M104.75 61.45C104.717 61.3833 104.683 61.3167 104.65 61.25C105.068 61.1189 105.502 61.1189 105.95 61.25C105.897 61.3192 105.831 61.3692 105.75 61.4C105.418 61.4498 105.085 61.4665 104.75 61.45Z"
                  fill="#836322"
                />
                <path
                  d="M9.05 60.85C8.9211 61.1937 9.0211 61.4603 9.35 61.65C9.35 61.6833 9.35 61.7167 9.35 61.75C9.35 61.8833 9.35 62.0167 9.35 62.15C8.9204 62.057 8.487 61.9737 8.05 61.9C7.8341 61.7941 7.6674 61.6441 7.55 61.45C7.6167 61.2833 7.6833 61.1167 7.75 60.95C8.012 60.7421 8.312 60.6087 8.65 60.55C8.7852 60.6524 8.9185 60.7524 9.05 60.85Z"
                  fill="#6C6C6C"
                />
                <path
                  d="M65.35 68.95C66.836 68.5536 68.336 68.2036 69.85 67.9C70.108 67.7617 70.074 67.6783 69.75 67.65C68.089 68.0522 66.423 68.4355 64.75 68.8C64.529 68.8789 64.329 68.8622 64.15 68.75C65.948 68.2198 67.781 67.7698 69.65 67.4C69.941 67.276 70.208 67.1094 70.45 66.9C70.674 66.8023 70.907 66.7523 71.15 66.75C71.15 67.0167 71.15 67.2833 71.15 67.55C71.416 67.517 71.682 67.4837 71.95 67.45C72.484 67.4231 72.934 67.5897 73.3 67.95C73.35 68.5157 73.367 69.0824 73.35 69.65C73.35 69.75 73.35 69.85 73.35 69.95C75.109 69.6485 76.843 69.2318 78.55 68.7C79.081 68.617 79.614 68.567 80.15 68.55C80.15 68.45 80.15 68.35 80.15 68.25C80.322 68.2371 80.488 68.2038 80.65 68.15C80.817 68.0334 80.983 68.0334 81.15 68.15C80.852 68.5644 80.536 68.9644 80.2 69.35C79.852 70.0333 79.885 70.7 80.3 71.35C80.792 72.1052 81.442 72.6885 82.25 73.1C83.406 73.5894 84.606 73.956 85.85 74.2C86.468 74.2819 87.068 74.2653 87.65 74.15C87.749 74.1672 87.816 74.1338 87.85 74.05C88.01 74.0232 88.143 74.0566 88.25 74.15C85.56 74.7087 83.026 74.2921 80.65 72.9C80.395 72.6147 80.111 72.3647 79.8 72.15C79.656 71.8397 79.473 71.5564 79.25 71.3C78.679 71.1619 78.179 70.8952 77.75 70.5C76.645 70.3023 75.545 70.0856 74.45 69.85C74.155 69.9488 73.855 70.0321 73.55 70.1C73.457 70.5591 73.191 70.8591 72.75 71C69.358 71.7458 65.958 72.5458 62.55 73.4C62.665 74.1086 62.681 74.8253 62.6 75.55C62.572 75.8457 62.489 76.1123 62.35 76.35C62.524 75.4918 62.574 74.6251 62.5 73.75C62.48 73.5744 62.43 73.4078 62.35 73.25C62.159 73.3348 61.959 73.3682 61.75 73.35C61.468 73.3539 61.201 73.4205 60.95 73.55C61.37 73.9226 61.57 74.3893 61.55 74.95C61.587 76.63 60.787 77.38 59.15 77.2C58.719 76.919 58.286 76.6523 57.85 76.4C57.756 76.3308 57.69 76.3475 57.65 76.45C57.357 76.32 57.123 76.12 56.95 75.85C56.597 75.1312 56.13 74.4812 55.55 73.9C54.5506 73.85 53.5506 73.8334 52.55 73.85C52.4628 74.4789 52.4295 75.1122 52.45 75.75C52.45 75.8833 52.45 76.0167 52.45 76.15C52.3539 75.9735 52.3205 75.7735 52.35 75.55C51.5002 75.2507 50.8836 74.6841 50.5 73.85C48.1487 73.7868 45.7987 73.5202 43.45 73.05C41.952 73.3662 40.452 73.6662 38.95 73.95C38.8027 73.8929 38.636 73.8929 38.45 73.95C38.45 73.7167 38.45 73.4833 38.45 73.25C38.1886 73.2277 38.0219 73.3444 37.95 73.6C37.8056 73.6781 37.6723 73.6614 37.55 73.55C37.7407 72.9049 37.8073 72.2383 37.75 71.55C37.6167 71.55 37.4833 71.55 37.35 71.55C37.3666 72.1509 37.3499 72.7509 37.3 73.35C37.25 72.7175 37.2334 72.0842 37.25 71.45C37.05 71.4167 36.85 71.3833 36.65 71.35C30.9835 70.05 25.3168 68.75 19.65 67.45C19.5336 69.5802 19.4503 69.5802 19.4 67.45C19.1 67.1797 18.8833 67.213 18.75 67.55C18.4717 67.3933 18.2051 67.21 17.95 67C15.0456 66.3541 12.1456 65.6875 9.25 65C8.6447 64.8226 8.128 64.5059 7.7 64.05C7.6209 63.9255 7.5709 63.7922 7.55 63.65C7.5334 63.0158 7.55 62.3825 7.6 61.75C7.7255 61.8211 7.8421 61.9044 7.95 62C8.5519 62.0447 9.0853 62.2447 9.55 62.6C15.7739 63.8765 22.0073 65.1431 28.25 66.4C33.2264 67.4486 38.1931 68.5486 43.15 69.7C44.8173 69.9081 46.4673 70.1914 48.1 70.55C48.3238 70.4006 48.6405 70.3339 49.05 70.35C53.9867 70.7939 58.887 70.5439 63.75 69.6C63.933 69.5727 64.083 69.4893 64.2 69.35C64.3 69.3833 64.4 69.4167 64.5 69.45C64.542 69.3328 64.609 69.2328 64.7 69.15C64.89 69.1694 65.074 69.1694 65.25 69.15C65.33 69.1043 65.363 69.0376 65.35 68.95Z"
                  fill="#030303"
                />
                <path
                  d="M27.45 62.05C27.6048 62.0821 27.6715 62.1821 27.65 62.35C27.75 62.35 27.85 62.35 27.95 62.35C27.9254 62.647 27.7588 62.7803 27.45 62.75C27.3562 62.509 27.3562 62.2756 27.45 62.05Z"
                  fill="#474747"
                />
                <path
                  d="M68.15 63.05C68.25 63.0414 68.333 63.0748 68.4 63.15C68.571 63.6199 68.421 63.8532 67.95 63.85C67.911 63.5487 67.977 63.282 68.15 63.05Z"
                  fill="#525255"
                />
                <path
                  d="M7.55 61.45C7.6674 61.6441 7.8341 61.7941 8.05 61.9C8.487 61.9737 8.9204 62.057 9.35 62.15C9.35 62.0167 9.35 61.8833 9.35 61.75C9.4167 61.75 9.4833 61.75 9.55 61.75C9.9068 61.8941 10.2734 62.0441 10.65 62.2C22.0107 64.6484 33.3774 67.0818 44.75 69.5C45.3489 69.5699 45.9489 69.6199 46.55 69.65C47.5828 69.9567 48.6494 70.0734 49.75 70C49.5657 69.9841 49.4991 69.9341 49.55 69.85C50.1815 69.911 50.8149 69.9443 51.45 69.95C54.0416 70.1222 56.642 70.0555 59.25 69.75C59.383 69.75 59.517 69.75 59.65 69.75C60.046 69.844 60.446 69.8607 60.85 69.8C62.354 69.5324 63.854 69.2491 65.35 68.95C65.363 69.0376 65.33 69.1043 65.25 69.15C65.074 69.1694 64.89 69.1694 64.7 69.15C64.609 69.2328 64.542 69.3328 64.5 69.45C64.4 69.4167 64.3 69.3833 64.2 69.35C64.083 69.4893 63.933 69.5727 63.75 69.6C58.887 70.5439 53.9867 70.7939 49.05 70.35C48.6405 70.3339 48.3238 70.4006 48.1 70.55C46.4673 70.1914 44.8173 69.9081 43.15 69.7C38.1931 68.5486 33.2264 67.4486 28.25 66.4C22.0073 65.1431 15.7739 63.8765 9.55 62.6C9.0853 62.2447 8.5519 62.0447 7.95 62C7.8421 61.9044 7.7255 61.8211 7.6 61.75C7.55 62.3825 7.5334 63.0158 7.55 63.65C7.4167 62.9167 7.4167 62.1833 7.55 61.45Z"
                  fill="#0F0F0F"
                />
                <path
                  d="M11.85 61.95C11.7761 61.9369 11.7094 61.9536 11.65 62C23.6497 64.5666 35.6497 67.1333 47.65 69.7C47.283 69.7279 46.9163 69.7112 46.55 69.65C45.9489 69.6199 45.3489 69.5699 44.75 69.5C33.3774 67.0818 22.0107 64.6484 10.65 62.2C10.2734 62.0441 9.9068 61.8941 9.55 61.75C9.534 61.5801 9.5506 61.4134 9.6 61.25C10.3251 61.5975 11.0751 61.8308 11.85 61.95Z"
                  fill="#777776"
                />
                <path
                  d="M104.25 62.55C104.35 62.55 104.45 62.55 104.55 62.55C104.536 63.2883 104.47 64.0216 104.35 64.75C104.481 64.9392 104.465 65.1059 104.3 65.25C104.091 64.9685 103.841 64.7852 103.55 64.7C103.606 64.7383 103.639 64.7883 103.65 64.85C103.65 64.9167 103.65 64.9833 103.65 65.05C103.333 65.0248 103.133 64.8582 103.05 64.55C102.86 64.4534 102.66 64.4201 102.45 64.45C102.347 65.3337 102.497 66.1671 102.9 66.95C103.101 67.256 103.384 67.4226 103.75 67.45C104.145 67.3638 104.545 67.3305 104.95 67.35C104.831 67.4272 104.731 67.5272 104.65 67.65C104.608 67.7222 104.542 67.7722 104.45 67.8C104.183 67.8667 103.917 67.8667 103.65 67.8C102.668 67.5438 101.668 67.3772 100.65 67.3C100.435 67.2901 100.268 67.2067 100.15 67.05C99.449 66.3132 99.016 65.4466 98.85 64.45C98.657 64.319 98.457 64.1857 98.25 64.05C98.324 63.9818 98.391 63.9151 98.45 63.85C100.387 63.4155 102.321 62.9822 104.25 62.55Z"
                  fill="#100402"
                />
                <path
                  d="M106.25 62.45C106.362 63.0418 106.379 63.6418 106.3 64.25C106.148 64.4569 106.064 64.6903 106.05 64.95C105.597 65.5751 104.997 65.7251 104.25 65.4C104.063 65.196 103.863 65.0127 103.65 64.85C103.639 64.7883 103.606 64.7383 103.55 64.7C103.841 64.7852 104.091 64.9685 104.3 65.25C104.465 65.1059 104.481 64.9392 104.35 64.75C104.47 64.0216 104.536 63.2883 104.55 62.55C104.45 62.55 104.35 62.55 104.25 62.55C104.4 62.4694 104.566 62.4028 104.75 62.35C104.83 62.3043 104.863 62.2376 104.85 62.15C105.086 62.1674 105.319 62.2007 105.55 62.25C105.6 61.75 105.634 61.7833 105.65 62.35C105.862 62.3325 106.062 62.3659 106.25 62.45Z"
                  fill="#141415"
                />
                <path
                  d="M50.55 64.35C51.3049 64.5048 52.0715 64.5715 52.85 64.55C54.6843 64.4794 56.518 64.4294 58.35 64.4C58.406 64.4383 58.439 64.4883 58.45 64.55C58.501 64.9007 58.434 65.2174 58.25 65.5C57.609 65.6085 56.976 65.6918 56.35 65.75C54.415 65.7649 52.4817 65.7149 50.55 65.6C50.3119 65.4491 50.2119 65.2325 50.25 64.95C50.2078 64.6692 50.3078 64.4692 50.55 64.35Z"
                  fill="#484849"
                />
                <path
                  d="M98.45 63.85C98.391 63.9151 98.324 63.9818 98.25 64.05C98.457 64.1857 98.657 64.319 98.85 64.45C98.85 64.55 98.85 64.65 98.85 64.75C98.76 64.6791 98.726 64.5791 98.75 64.45C98.494 64.38 98.244 64.28 98 64.15C96.359 64.5895 94.709 64.9895 93.05 65.35C92.802 65.2742 92.535 65.2742 92.25 65.35C93.023 65.0535 93.823 64.8035 94.65 64.6C95.917 64.3498 97.184 64.0998 98.45 63.85Z"
                  fill="#626264"
                />
                <path
                  d="M44.35 65.35C44.4943 65.4335 44.5943 65.5668 44.65 65.75C44.7478 65.7023 44.8311 65.6357 44.9 65.55C44.9494 65.7134 44.966 65.8801 44.95 66.05C44.2747 66.2555 44.0747 66.0221 44.35 65.35Z"
                  fill="#4B4B4B"
                />
                <path
                  d="M93.05 65.35C93.031 66.3219 92.864 67.2553 92.55 68.15C92.642 67.5667 92.742 66.9834 92.85 66.4C92.836 66.2045 92.753 66.0545 92.6 65.95C92.096 66.0121 91.679 66.2288 91.35 66.6C91.034 68.0652 90.401 69.3652 89.45 70.5C88.897 70.8599 88.33 71.1932 87.75 71.5C87.45 71.5667 87.15 71.5667 86.85 71.5C86.758 71.4722 86.692 71.4222 86.65 71.35C87.34 71.4565 87.94 71.2898 88.45 70.85C89.829 69.9619 90.663 68.6953 90.95 67.05C91.037 66.8283 91.07 66.595 91.05 66.35C89.231 66.6712 87.431 67.0879 85.65 67.6C85.304 67.7809 84.987 67.9976 84.7 68.25C84.652 68.1552 84.635 68.0552 84.65 67.95C84.494 67.9481 84.344 67.9148 84.2 67.85C83.804 68.0286 83.421 68.1453 83.05 68.2C82.827 68.5926 82.644 69.0093 82.5 69.45C82.207 69.6509 82.09 69.9343 82.15 70.3C82.127 70.6459 82.21 70.9626 82.4 71.25C82.933 71.7856 83.517 72.2356 84.15 72.6C84.367 72.8998 84.6 73.1831 84.85 73.45C83.792 73.1124 82.842 72.5791 82 71.85C81.519 71.3412 81.319 70.7412 81.4 70.05C81.775 69.4376 82.208 68.871 82.7 68.35C82.736 68.1579 82.819 67.9912 82.95 67.85C82.904 67.7702 82.838 67.7369 82.75 67.75C85.897 66.9529 89.064 66.1529 92.25 65.35C92.535 65.2742 92.802 65.2742 93.05 65.35Z"
                  fill="#292D30"
                />
                <path
                  d="M98.85 64.45C99.016 65.4466 99.449 66.3132 100.15 67.05C99.894 66.9457 99.678 66.779 99.5 66.55C99.14 65.9982 98.924 65.3982 98.85 64.75C98.85 64.65 98.85 64.55 98.85 64.45Z"
                  fill="#3F3A3A"
                />
                <path
                  d="M63.35 66.05C63.544 66.1014 63.644 66.2347 63.65 66.45C63.521 66.8819 63.288 66.9485 62.95 66.65C63.183 66.5168 63.317 66.3168 63.35 66.05Z"
                  fill="#3F3F3F"
                />
                <path
                  d="M106.25 62.45C106.417 62.45 106.583 62.45 106.75 62.45C106.823 63.5894 106.657 64.6894 106.25 65.75C105.968 66.3992 105.535 66.9326 104.95 67.35C104.545 67.3305 104.145 67.3638 103.75 67.45C103.384 67.4226 103.101 67.256 102.9 66.95C102.497 66.1671 102.347 65.3337 102.45 64.45C102.66 64.4201 102.86 64.4534 103.05 64.55C103.133 64.8582 103.333 65.0248 103.65 65.05C103.668 65.5676 103.868 66.0009 104.25 66.35C105.269 66.468 105.869 66.0014 106.05 64.95C106.064 64.6903 106.148 64.4569 106.3 64.25C106.379 63.6418 106.362 63.0418 106.25 62.45Z"
                  fill="#36160A"
                />
                <path
                  d="M103.65 64.85C103.863 65.0127 104.063 65.196 104.25 65.4C104.997 65.7251 105.597 65.5751 106.05 64.95C105.869 66.0014 105.269 66.468 104.25 66.35C103.868 66.0009 103.668 65.5676 103.65 65.05C103.65 64.9833 103.65 64.9167 103.65 64.85Z"
                  fill="#484545"
                />
                <path
                  d="M90.95 67.05C90.152 67.2062 89.352 67.3562 88.55 67.5C87.428 67.8741 86.295 68.1907 85.15 68.45C84.99 68.9554 85.09 69.4054 85.45 69.8C85.617 69.8333 85.783 69.8667 85.95 69.9C86.575 70.7798 87.409 71.0964 88.45 70.85C87.94 71.2898 87.34 71.4565 86.65 71.35C86.216 71.2569 85.866 71.0236 85.6 70.65C85.375 70.2993 85.175 69.9327 85 69.55C84.918 69.7788 84.851 70.0122 84.8 70.25C84.695 70.3517 84.578 70.3684 84.45 70.3C84.655 70.207 84.738 70.057 84.7 69.85C84.633 69.9167 84.567 69.9833 84.5 70.05C84.436 69.8238 84.352 69.6071 84.25 69.4C84.019 69.3663 83.836 69.4496 83.7 69.65C83.59 69.3735 83.39 69.2069 83.1 69.15C83.01 70.2655 83.31 71.2655 84 72.15C84.579 73.0291 85.362 73.6458 86.35 74C86.849 74.0499 87.349 74.0666 87.85 74.05C87.816 74.1338 87.749 74.1672 87.65 74.15C86.595 74.3358 85.662 74.1025 84.85 73.45C84.6 73.1831 84.367 72.8998 84.15 72.6C83.517 72.2356 82.933 71.7856 82.4 71.25C82.21 70.9626 82.127 70.6459 82.15 70.3C82.09 69.9343 82.207 69.6509 82.5 69.45C82.644 69.0093 82.827 68.5926 83.05 68.2C83.421 68.1453 83.804 68.0286 84.2 67.85C84.344 67.9148 84.494 67.9481 84.65 67.95C84.635 68.0552 84.652 68.1552 84.7 68.25C84.987 67.9976 85.304 67.7809 85.65 67.6C87.431 67.0879 89.231 66.6712 91.05 66.35C91.07 66.595 91.037 66.8283 90.95 67.05Z"
                  fill="#32383B"
                />
                <path
                  d="M7.75 60.95C7.6833 61.1167 7.6167 61.2833 7.55 61.45C7.4167 62.1833 7.4167 62.9167 7.55 63.65C7.5709 63.7922 7.6209 63.9255 7.7 64.05C8.128 64.5059 8.6447 64.8226 9.25 65C12.1456 65.6875 15.0456 66.3541 17.95 67C18.2051 67.21 18.4717 67.3933 18.75 67.55C18.9508 67.9476 19.0675 68.3809 19.1 68.85C19.1934 68.9858 19.2768 69.1192 19.35 69.25C19.7818 70.2 20.5151 70.7667 21.55 70.95C21.55 70.9833 21.55 71.0167 21.55 71.05C20.2665 70.8824 19.4165 70.1824 19 68.95C18.9 68.55 18.8 68.15 18.7 67.75C18.3911 67.604 18.1078 67.4207 17.85 67.2C15.1564 66.5413 12.4564 65.9079 9.75 65.3C9.0821 65.1161 8.4488 64.8494 7.85 64.5C7.657 64.2742 7.507 64.0242 7.4 63.75C7.2747 62.9356 7.2747 62.1356 7.4 61.35C7.466 61.1676 7.5827 61.0343 7.75 60.95Z"
                  fill="#929092"
                />
                <path
                  d="M106.25 65.75C106.25 65.8167 106.25 65.8833 106.25 65.95C105.955 66.5967 105.522 67.1467 104.95 67.6C104.855 67.6483 104.755 67.6649 104.65 67.65C104.731 67.5272 104.831 67.4272 104.95 67.35C105.535 66.9326 105.968 66.3992 106.25 65.75Z"
                  fill="#554B49"
                />
                <path
                  d="M36.65 71.35C36.8144 71.4316 36.931 71.565 37 71.75C37.0333 71.6833 37.0667 71.6167 37.1 71.55C37.183 72.1196 37.1663 72.6863 37.05 73.25C36.9672 73.3415 36.8672 73.4081 36.75 73.45C35.0664 73.1623 33.3998 72.8123 31.75 72.4C29.9057 71.8577 28.0391 71.391 26.15 71C24.123 70.7094 22.123 70.3261 20.15 69.85C19.8888 69.6948 19.7555 69.4614 19.75 69.15C19.5901 69.1232 19.4568 69.1566 19.35 69.25C19.2768 69.1192 19.1934 68.9858 19.1 68.85C19.0675 68.3809 18.9508 67.9476 18.75 67.55C18.8833 67.213 19.1 67.1797 19.4 67.45C19.4503 69.5802 19.5336 69.5802 19.65 67.45C25.3168 68.75 30.9835 70.05 36.65 71.35Z"
                  fill="#323132"
                />
                <path
                  d="M82.75 67.75C82.838 67.7369 82.904 67.7702 82.95 67.85C82.819 67.9912 82.736 68.1579 82.7 68.35C82.208 68.871 81.775 69.4376 81.4 70.05C81.319 70.7412 81.519 71.3412 82 71.85C82.842 72.5791 83.792 73.1124 84.85 73.45C85.662 74.1025 86.595 74.3358 87.65 74.15C87.068 74.2653 86.468 74.2819 85.85 74.2C84.606 73.956 83.406 73.5894 82.25 73.1C81.442 72.6885 80.792 72.1052 80.3 71.35C79.885 70.7 79.852 70.0333 80.2 69.35C80.536 68.9644 80.852 68.5644 81.15 68.15C80.983 68.0334 80.817 68.0334 80.65 68.15C80.65 68.1167 80.65 68.0833 80.65 68.05C80.885 67.9284 81.135 67.9284 81.4 68.05C81.85 67.9327 82.3 67.8327 82.75 67.75Z"
                  fill="#16191A"
                />
                <path
                  d="M65.35 68.95C63.854 69.2491 62.354 69.5324 60.85 69.8C60.446 69.8607 60.046 69.844 59.65 69.75C61.138 69.4187 62.638 69.0854 64.15 68.75C64.329 68.8622 64.529 68.8789 64.75 68.8C66.423 68.4355 68.089 68.0522 69.75 67.65C70.074 67.6783 70.108 67.7617 69.85 67.9C68.336 68.2036 66.836 68.5536 65.35 68.95Z"
                  fill="#454444"
                />
                <path
                  d="M90.95 67.05C90.663 68.6953 89.829 69.9619 88.45 70.85C87.409 71.0964 86.575 70.7798 85.95 69.9C85.783 69.8667 85.617 69.8333 85.45 69.8C85.09 69.4054 84.99 68.9554 85.15 68.45C86.295 68.1907 87.428 67.8741 88.55 67.5C89.352 67.3562 90.152 67.2062 90.95 67.05Z"
                  fill="#3D4448"
                />
                <path
                  d="M11.85 61.95C24.4282 64.5988 36.9948 67.2322 49.55 69.85C49.4991 69.9341 49.5657 69.9841 49.75 70C48.6494 70.0734 47.5828 69.9567 46.55 69.65C46.9163 69.7112 47.283 69.7279 47.65 69.7C35.6497 67.1333 23.6497 64.5666 11.65 62C11.7094 61.9536 11.7761 61.9369 11.85 61.95Z"
                  fill="#424241"
                />
                <path
                  d="M92.55 68.15C92.039 70.389 90.906 72.239 89.15 73.7C88.847 73.8513 88.547 74.0013 88.25 74.15C88.143 74.0566 88.01 74.0232 87.85 74.05C87.349 74.0666 86.849 74.0499 86.35 74C85.362 73.6458 84.579 73.0291 84 72.15C83.31 71.2655 83.01 70.2655 83.1 69.15C83.39 69.2069 83.59 69.3735 83.7 69.65C83.836 69.4496 84.019 69.3663 84.25 69.4C84.352 69.6071 84.436 69.8238 84.5 70.05C84.567 69.9833 84.633 69.9167 84.7 69.85C84.738 70.057 84.655 70.207 84.45 70.3C84.578 70.3684 84.695 70.3517 84.8 70.25C84.851 70.0122 84.918 69.7788 85 69.55C85.175 69.9327 85.375 70.2993 85.6 70.65C85.866 71.0236 86.216 71.2569 86.65 71.35C86.692 71.4222 86.758 71.4722 86.85 71.5C87.15 71.5667 87.45 71.5667 87.75 71.5C88.33 71.1932 88.897 70.8599 89.45 70.5C90.401 69.3652 91.034 68.0652 91.35 66.6C91.679 66.2288 92.096 66.0121 92.6 65.95C92.753 66.0545 92.836 66.2045 92.85 66.4C92.742 66.9834 92.642 67.5667 92.55 68.15Z"
                  fill="#3D4447"
                />
                <path
                  d="M20.15 69.85C21.2529 70.2281 22.3863 70.5281 23.55 70.75C23.6598 70.8397 23.6598 70.923 23.55 71C23.3567 71.0251 23.1734 71.0751 23 71.15C22.799 71.0152 22.599 70.8818 22.4 70.75C22.2467 70.8695 22.0967 70.8695 21.95 70.75C21.7974 70.7994 21.6641 70.8661 21.55 70.95C20.5151 70.7667 19.7818 70.2 19.35 69.25C19.4568 69.1566 19.5901 69.1232 19.75 69.15C19.7555 69.4614 19.8888 69.6948 20.15 69.85Z"
                  fill="#2B110A"
                />
                <path
                  d="M23.55 70.75C24.2276 70.7943 24.861 70.9776 25.45 71.3C25.3944 71.3383 25.3611 71.3883 25.35 71.45C24.7681 71.6464 24.1681 71.6964 23.55 71.6C22.8711 71.4139 22.2045 71.2306 21.55 71.05C21.55 71.0167 21.55 70.9833 21.55 70.95C21.6641 70.8661 21.7974 70.7994 21.95 70.75C22.0967 70.8695 22.2467 70.8695 22.4 70.75C22.599 70.8818 22.799 71.0152 23 71.15C23.1734 71.0751 23.3567 71.0251 23.55 71C23.6598 70.923 23.6598 70.8397 23.55 70.75Z"
                  fill="#150805"
                />
                <path
                  d="M20.15 69.85C22.123 70.3261 24.123 70.7094 26.15 71C28.0391 71.391 29.9057 71.8577 31.75 72.4C33.3998 72.8123 35.0664 73.1623 36.75 73.45C36.8672 73.4081 36.9672 73.3415 37.05 73.25C37.1663 72.6863 37.183 72.1196 37.1 71.55C37.0667 71.6167 37.0333 71.6833 37 71.75C36.931 71.565 36.8144 71.4316 36.65 71.35C36.85 71.3833 37.05 71.4167 37.25 71.45C37.2334 72.0842 37.25 72.7175 37.3 73.35C37.3499 72.7509 37.3666 72.1509 37.35 71.55C37.4833 71.55 37.6167 71.55 37.75 71.55C37.8073 72.2383 37.7407 72.9049 37.55 73.55C37.6723 73.6614 37.8056 73.6781 37.95 73.6C38.0219 73.3444 38.1886 73.2277 38.45 73.25C38.45 73.4833 38.45 73.7167 38.45 73.95C38.636 73.8929 38.8027 73.8929 38.95 73.95C38.4844 74.1795 37.9844 74.2628 37.45 74.2C33.5078 73.2811 29.5745 72.3311 25.65 71.35C25.5583 71.4127 25.4583 71.4461 25.35 71.45C25.3611 71.3883 25.3944 71.3383 25.45 71.3C24.861 70.9776 24.2276 70.7943 23.55 70.75C22.3863 70.5281 21.2529 70.2281 20.15 69.85Z"
                  fill="#212020"
                />
                <path
                  d="M56.95 75.85C56.717 75.5171 56.417 75.2504 56.05 75.05C55.776 75.2102 55.476 75.2936 55.15 75.3C54.9306 75.4553 54.814 75.6719 54.8 75.95C54.6831 75.4092 54.3665 75.0759 53.85 74.95C53.4977 75.1924 53.0977 75.3257 52.65 75.35C52.5571 75.4689 52.5238 75.6022 52.55 75.75C52.5167 75.75 52.4833 75.75 52.45 75.75C52.4295 75.1122 52.4628 74.4789 52.55 73.85C53.5506 73.8334 54.5506 73.85 55.55 73.9C56.13 74.4812 56.597 75.1312 56.95 75.85Z"
                  fill="#230901"
                />
                <path
                  d="M62.35 76.35C61.9 77.617 61.1 78.6004 59.95 79.3C59.354 79.4131 58.754 79.5131 58.15 79.6C58.271 79.7018 58.237 79.7518 58.05 79.75C57.344 79.3193 56.594 78.9859 55.8 78.75C55.7 78.85 55.6 78.95 55.5 79.05C54.8925 78.8141 54.2759 78.5975 53.65 78.4C52.9137 77.6766 52.5471 76.7933 52.55 75.75C52.5238 75.6022 52.5571 75.4689 52.65 75.35C53.0977 75.3257 53.4977 75.1924 53.85 74.95C54.3665 75.0759 54.6831 75.4092 54.8 75.95C54.814 75.6719 54.9306 75.4553 55.15 75.3C55.476 75.2936 55.776 75.2102 56.05 75.05C56.417 75.2504 56.717 75.5171 56.95 75.85C57.123 76.12 57.357 76.32 57.65 76.45C57.776 77.219 58.142 77.8356 58.75 78.3C59.31 78.4091 59.843 78.3424 60.35 78.1C61.754 76.8033 62.22 75.2199 61.75 73.35C61.959 73.3682 62.159 73.3348 62.35 73.25C62.43 73.4078 62.48 73.5744 62.5 73.75C62.574 74.6251 62.524 75.4918 62.35 76.35Z"
                  fill="#351203"
                />
                <path
                  d="M55.95 75.85C56.297 75.8576 56.631 75.9242 56.95 76.05C56.933 76.4182 56.95 76.7848 57 77.15C57.195 77.5242 57.379 77.9075 57.55 78.3C57.524 78.4261 57.457 78.5261 57.35 78.6C57.05 78.6667 56.75 78.6667 56.45 78.6C56.383 78.5 56.317 78.4 56.25 78.3C55.872 78.1531 55.522 77.9697 55.2 77.75C55.037 78.2147 54.7366 78.348 54.3 78.15C53.8761 77.5119 53.6761 76.8119 53.7 76.05C54.3513 76.1344 54.7513 76.501 54.9 77.15C54.8308 76.3695 55.181 76.0695 55.95 76.25C55.95 76.1167 55.95 75.9833 55.95 75.85Z"
                  fill="#3E1602"
                />
                <path
                  d="M61.75 73.35C62.22 75.2199 61.754 76.8033 60.35 78.1C59.843 78.3424 59.31 78.4091 58.75 78.3C58.142 77.8356 57.776 77.219 57.65 76.45C57.69 76.3475 57.756 76.3308 57.85 76.4C58.286 76.6523 58.719 76.919 59.15 77.2C60.787 77.38 61.587 76.63 61.55 74.95C61.57 74.3893 61.37 73.9226 60.95 73.55C61.201 73.4205 61.468 73.3539 61.75 73.35Z"
                  fill="#464444"
                />
                <path
                  d="M52.45 75.75C52.4833 75.75 52.5167 75.75 52.55 75.75C52.5471 76.7933 52.9137 77.6766 53.65 78.4C54.2759 78.5975 54.8925 78.8141 55.5 79.05C55.6 78.95 55.7 78.85 55.8 78.75C56.594 78.9859 57.344 79.3193 58.05 79.75C58.237 79.7518 58.271 79.7018 58.15 79.6C58.754 79.5131 59.354 79.4131 59.95 79.3C61.1 78.6004 61.9 77.617 62.35 76.35C62.004 77.6899 61.271 78.7732 60.15 79.6C59.683 79.8585 59.183 80.0085 58.65 80.05C57.264 79.6826 55.864 79.3659 54.45 79.1C53.2513 78.4835 52.5847 77.5002 52.45 76.15C52.45 76.0167 52.45 75.8833 52.45 75.75Z"
                  fill="#1A0D0A"
                />
              </g>
              <g clipPath="url(#clip1_0_1)">
                <path
                  d="M87.069 0H37.931L25 7.72414V28H100V7.72414L87.069 0Z"
                  fill="#A98258"
                />
                <path
                  d="M70.2586 13.0345H54.7414C53.319 13.0345 52.1552 12.6 52.1552 12.069C52.1552 11.5379 53.319 11.1034 54.7414 11.1034H70.2586C71.681 11.1034 72.8448 11.5379 72.8448 12.069C72.8448 12.6 71.681 13.0345 70.2586 13.0345Z"
                  fill="#5B4631"
                />
                <path
                  d="M72.8447 24.6207H52.1551C51.4413 24.6207 50.862 24.8365 50.862 25.1034C50.862 25.3704 51.4413 25.5862 52.1551 25.5862H72.8447C73.5585 25.5862 74.1378 25.3704 74.1378 25.1034C74.1378 24.8365 73.5585 24.6207 72.8447 24.6207Z"
                  fill="#E8D5B2"
                />
                <path
                  d="M52.1552 20.7586C52.4862 20.7586 52.8172 20.7113 53.0694 20.6172L54.7414 19.993V23.1724C54.7414 23.4394 55.3207 23.6552 56.0345 23.6552C56.7483 23.6552 57.3276 23.4394 57.3276 23.1724V19.993L58.9996 20.6172C59.2517 20.7113 59.5828 20.7586 59.9138 20.7586C60.2448 20.7586 60.5759 20.7113 60.828 20.6172C61.3336 20.4284 61.3336 20.1233 60.828 19.9345L56.95 18.4868C56.831 18.4419 56.6875 18.4066 56.5285 18.382C56.2129 18.3332 55.856 18.3332 55.5405 18.382C55.3815 18.4066 55.2392 18.4419 55.119 18.4868L51.241 19.9345C50.7353 20.1233 50.7353 20.4284 51.241 20.6172C51.4931 20.7113 51.8241 20.7586 52.1552 20.7586Z"
                  fill="#E8D5B2"
                />
                <path
                  d="M65.0862 20.7586C65.4172 20.7586 65.7483 20.7113 66.0004 20.6172L67.6724 19.993V23.1724C67.6724 23.4394 68.2517 23.6552 68.9655 23.6552C69.6793 23.6552 70.2586 23.4394 70.2586 23.1724V19.993L71.9306 20.6172C72.1828 20.7113 72.5138 20.7586 72.8448 20.7586C73.1759 20.7586 73.5069 20.7113 73.7591 20.6172C74.2647 20.4284 74.2647 20.1233 73.7591 19.9345L69.881 18.4868C69.7621 18.4419 69.6185 18.4066 69.4595 18.382C69.144 18.3332 68.7871 18.3332 68.4716 18.382C68.3125 18.4066 68.1703 18.4419 68.05 18.4868L64.172 19.9345C63.6664 20.1233 63.6664 20.4284 64.172 20.6172C64.4241 20.7113 64.7552 20.7586 65.0862 20.7586Z"
                  fill="#E8D5B2"
                />
                <path
                  d="M37.931 0L25 7.72414H100L87.069 0H37.931Z"
                  fill="#DAAE86"
                />
                <path
                  d="M63.7931 0H61.2069V7.72414H63.7931V0Z"
                  fill="#F4D5BD"
                />
              </g>
              <defs>
                <clipPath id="clip0_0_1">
                  <rect
                    width="200"
                    height="200"
                    fill="white"
                    transform="translate(0 14)"
                  />
                </clipPath>
                <clipPath id="clip1_0_1">
                  <rect
                    width="75"
                    height="28"
                    fill="white"
                    transform="translate(25)"
                  />
                </clipPath>
              </defs>
            </svg>
          ) : (
            // 車輛（沒貨）svg  transform 1s ease;
            <svg
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              width="200px"
              height="200px"
              viewBox="450 200 2000 2000"
              // preserveAspectRatio="xMinYMin slice"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              className="cursor-pointer"
              onClick={() => setCarInfoModal(true)}
            >
              {/* {ifCarIsFull !== true ? (
              <Image
                className="min-h-[1000px] min-w-[1000px] bg-gray-800"
                src={ImgBox}
                alt="box"
              ></Image>
            ) : (
              ""
            )} */}
              {/* {ifCarIsFull !== true ? (
              <g
                className="box-in-vehicle"
                transform={`translate(${calculateActCoordiateX(0)},
              ${calculateActCoordiateY(0)})`}
              >
                <svg
                  width="400px"
                  height="400px"
                  // width="200px"
                  // height="200px"
                  viewBox="-20 -8 60 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0" />

                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path
                      d="M17.5777 4.43152L15.5777 3.38197C13.8221 2.46066 12.9443 2 12 2C11.0557 2 10.1779 2.46066 8.42229 3.38197L8.10057 3.5508L17.0236 8.64967L21.0403 6.64132C20.3941 5.90949 19.3515 5.36234 17.5777 4.43152Z"
                      fill="#1C274C"
                    />{" "}
                    <path
                      d="M21.7484 7.96434L17.75 9.96353V13C17.75 13.4142 17.4142 13.75 17 13.75C16.5858 13.75 16.25 13.4142 16.25 13V10.7135L12.75 12.4635V21.904C13.4679 21.7252 14.2848 21.2965 15.5777 20.618L17.5777 19.5685C19.7294 18.4393 20.8052 17.8748 21.4026 16.8603C22 15.8458 22 14.5833 22 12.0585V11.9415C22 10.0489 22 8.86557 21.7484 7.96434Z"
                      fill="#1C274C"
                    />{" "}
                    <path
                      d="M11.25 21.904V12.4635L2.25164 7.96434C2 8.86557 2 10.0489 2 11.9415V12.0585C2 14.5833 2 15.8458 2.5974 16.8603C3.19479 17.8748 4.27062 18.4393 6.42228 19.5685L8.42229 20.618C9.71524 21.2965 10.5321 21.7252 11.25 21.904Z"
                      fill="#1C274C"
                    />{" "}
                    <path
                      d="M2.95969 6.64132L12 11.1615L15.4112 9.4559L6.52456 4.37785L6.42229 4.43152C4.64855 5.36234 3.6059 5.90949 2.95969 6.64132Z"
                      fill="#1C274C"
                    />{" "}
                  </g>
                </svg>
              </g>
            ) : (
              ""
            )} */}
              <path
                fill="#a6a6a6"
                d="M 1586.5,315.5 C 1541.82,312.889 1497.15,313.056 1452.5,316C 1453.97,316.71 1454.64,317.876 1454.5,319.5C 1452.47,319.662 1450.47,319.495 1448.5,319C 1449.62,318.751 1450.62,318.251 1451.5,317.5C 1448.89,316.031 1446.05,315.364 1443,315.5C 1433.18,316.18 1423.34,316.68 1413.5,317C 1409.3,320.11 1404.63,321.11 1399.5,320C 1401.38,319.784 1403.05,319.117 1404.5,318C 1401.52,317.502 1398.52,317.335 1395.5,317.5C 1395.92,316.778 1396.58,316.278 1397.5,316C 1396.15,313.875 1396.82,312.708 1399.5,312.5C 1402.18,312.708 1402.85,313.875 1401.5,316C 1403.81,316.497 1406.14,316.663 1408.5,316.5C 1408.5,315.5 1408.5,314.5 1408.5,313.5C 1413.85,314.973 1419.35,315.639 1425,315.5C 1443.82,314.353 1462.65,313.519 1481.5,313C 1450.2,311.025 1418.87,309.858 1387.5,309.5C 1387.5,308.5 1387.5,307.5 1387.5,306.5C 1383.15,306.334 1378.82,306.501 1374.5,307C 1372.77,310.457 1373.43,313.291 1376.5,315.5C 1375.62,316.251 1374.62,316.751 1373.5,317C 1377.82,317.499 1382.15,317.666 1386.5,317.5C 1381.02,318.489 1375.36,318.822 1369.5,318.5C 1370.26,317.732 1371.26,317.232 1372.5,317C 1371.43,316.261 1370.76,315.261 1370.5,314C 1371.88,312.403 1372.55,310.57 1372.5,308.5C 1302.16,307.5 1231.83,306.166 1161.5,304.5C 1158.18,303.835 1154.68,303.501 1151,303.5C 1141.5,303.945 1132,304.445 1122.5,305C 1124.96,306.216 1127.63,306.882 1130.5,307C 1127.96,307.339 1125.46,307.839 1123,308.5C 1121.47,307.783 1120.14,306.783 1119,305.5C 1117.83,306.009 1117,306.842 1116.5,308C 1114.57,308.251 1112.73,308.751 1111,309.5C 1109.81,308.437 1109.31,307.103 1109.5,305.5C 1106.83,305.5 1104.17,305.5 1101.5,305.5C 1101.5,303.5 1101.5,301.5 1101.5,299.5C 1097.82,299.335 1094.15,299.501 1090.5,300C 1088.81,301.401 1088.14,303.234 1088.5,305.5C 1084.17,305.5 1079.83,305.5 1075.5,305.5C 1075.5,306.5 1075.5,307.5 1075.5,308.5C 1073.05,308.376 1071.05,307.376 1069.5,305.5C 1068.26,306.037 1067.09,306.704 1066,307.5C 1060.4,306.83 1054.56,306.497 1048.5,306.5C 1027.84,307.248 1007.18,307.581 986.5,307.5C 1019.98,305.684 1053.65,304.684 1087.5,304.5C 1086.25,298.253 1088.75,295.92 1095,297.5C 1100.57,296.052 1103.07,298.052 1102.5,303.5C 1169.39,302.596 1236.22,303.596 1303,306.5C 1303.33,306.167 1303.67,305.833 1304,305.5C 1325.96,307.192 1348.46,307.525 1371.5,306.5C 1371.71,305.914 1372.04,305.414 1372.5,305C 1377.5,304.333 1382.5,304.333 1387.5,305C 1388.34,306.011 1388.67,307.178 1388.5,308.5C 1442.97,308.963 1497.47,310.629 1552,313.5C 1553,313.167 1554,312.833 1555,312.5C 1565.63,313.092 1576.13,314.092 1586.5,315.5 Z"
              />
              <g>
                <path
                  fill="#6b6b6c"
                  d="M 1161.5,304.5 C 1157.5,305.861 1153.5,307.361 1149.5,309C 1151.16,309.725 1151.66,310.892 1151,312.5C 1148.71,314.14 1146.54,315.14 1144.5,315.5C 1145.32,316.386 1146.32,316.719 1147.5,316.5C 1148.83,318.833 1148.83,321.167 1147.5,323.5C 1143.43,323.701 1139.43,324.368 1135.5,325.5C 1137,325.833 1138.5,326.167 1140,326.5C 1156.37,325.972 1172.7,324.972 1189,323.5C 1190.38,323.514 1191.55,323.848 1192.5,324.5C 1160.26,326.708 1127.93,328.041 1095.5,328.5C 1095.5,327.167 1095.5,325.833 1095.5,324.5C 1093.8,324.34 1092.13,324.506 1090.5,325C 1089.29,326.113 1089.29,327.28 1090.5,328.5C 1088.33,329.205 1086.33,330.205 1084.5,331.5C 1081.3,330.147 1078.8,328.813 1077,327.5C 1073.63,328.883 1070.13,329.717 1066.5,330C 1059.51,330.5 1052.51,330.666 1045.5,330.5C 1044.07,328.201 1044.73,326.535 1047.5,325.5C 1046.68,324.614 1045.68,324.281 1044.5,324.5C 1042.83,324.5 1041.17,324.5 1039.5,324.5C 1039.06,324.565 1038.73,324.399 1038.5,324C 1039.83,323.333 1041.17,322.667 1042.5,322C 1041.83,321.667 1041.17,321.333 1040.5,321C 1042.17,318.52 1043,315.687 1043,312.5C 1043.83,311.667 1044.67,310.833 1045.5,310C 1042.9,309.08 1040.23,308.413 1037.5,308C 1041.36,307.823 1045.02,307.323 1048.5,306.5C 1054.56,306.497 1060.4,306.83 1066,307.5C 1067.09,306.704 1068.26,306.037 1069.5,305.5C 1071.05,307.376 1073.05,308.376 1075.5,308.5C 1075.5,307.5 1075.5,306.5 1075.5,305.5C 1079.83,305.5 1084.17,305.5 1088.5,305.5C 1088.14,303.234 1088.81,301.401 1090.5,300C 1094.15,299.501 1097.82,299.335 1101.5,299.5C 1101.5,301.5 1101.5,303.5 1101.5,305.5C 1104.17,305.5 1106.83,305.5 1109.5,305.5C 1109.31,307.103 1109.81,308.437 1111,309.5C 1112.73,308.751 1114.57,308.251 1116.5,308C 1117,306.842 1117.83,306.009 1119,305.5C 1120.14,306.783 1121.47,307.783 1123,308.5C 1125.46,307.839 1127.96,307.339 1130.5,307C 1127.63,306.882 1124.96,306.216 1122.5,305C 1132,304.445 1141.5,303.945 1151,303.5C 1154.68,303.501 1158.18,303.835 1161.5,304.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#606060"
                  d="M 1161.5,304.5 C 1231.83,306.166 1302.16,307.5 1372.5,308.5C 1372.55,310.57 1371.88,312.403 1370.5,314C 1370.76,315.261 1371.43,316.261 1372.5,317C 1371.26,317.232 1370.26,317.732 1369.5,318.5C 1367.83,318.5 1366.17,318.5 1364.5,318.5C 1307.16,320.367 1249.83,322.367 1192.5,324.5C 1191.55,323.848 1190.38,323.514 1189,323.5C 1172.7,324.972 1156.37,325.972 1140,326.5C 1138.5,326.167 1137,325.833 1135.5,325.5C 1139.43,324.368 1143.43,323.701 1147.5,323.5C 1148.83,321.167 1148.83,318.833 1147.5,316.5C 1146.32,316.719 1145.32,316.386 1144.5,315.5C 1146.54,315.14 1148.71,314.14 1151,312.5C 1151.66,310.892 1151.16,309.725 1149.5,309C 1153.5,307.361 1157.5,305.861 1161.5,304.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#797979"
                  d="M 1048.5,306.5 C 1045.02,307.323 1041.36,307.823 1037.5,308C 1040.23,308.413 1042.9,309.08 1045.5,310C 1044.67,310.833 1043.83,311.667 1043,312.5C 1043,315.687 1042.17,318.52 1040.5,321C 1041.17,321.333 1041.83,321.667 1042.5,322C 1041.17,322.667 1039.83,323.333 1038.5,324C 1038.73,324.399 1039.06,324.565 1039.5,324.5C 1037.05,325.473 1034.39,325.806 1031.5,325.5C 1031.5,326.5 1031.5,327.5 1031.5,328.5C 1035.55,328.824 1039.55,328.491 1043.5,327.5C 1044.13,326.583 1044.46,325.583 1044.5,324.5C 1045.68,324.281 1046.68,324.614 1047.5,325.5C 1044.73,326.535 1044.07,328.201 1045.5,330.5C 1026.58,331.967 1007.58,332.967 988.5,333.5C 983.643,332.672 978.643,331.838 973.5,331C 975.5,330.667 977.5,330.333 979.5,330C 978.151,329.228 977.318,328.061 977,326.5C 976.501,321.511 976.334,316.511 976.5,311.5C 974.473,311.662 972.473,311.495 970.5,311C 975.047,310.571 979.381,309.738 983.5,308.5C 984.791,308.737 985.791,308.404 986.5,307.5C 1007.18,307.581 1027.84,307.248 1048.5,306.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#828282"
                  d="M 983.5,308.5 C 979.381,309.738 975.047,310.571 970.5,311C 972.473,311.495 974.473,311.662 976.5,311.5C 976.334,316.511 976.501,321.511 977,326.5C 977.318,328.061 978.151,329.228 979.5,330C 977.5,330.333 975.5,330.667 973.5,331C 978.643,331.838 983.643,332.672 988.5,333.5C 971.488,332.947 954.488,332.281 937.5,331.5C 933.614,330.51 929.614,329.51 925.5,328.5C 925.5,325.5 925.5,322.5 925.5,319.5C 929.449,319.307 929.449,318.807 925.5,318C 927.376,316.983 929.376,316.149 931.5,315.5C 929.234,314.686 926.9,314.186 924.5,314C 926.291,313.585 927.624,312.585 928.5,311C 933.684,310.826 938.684,310.326 943.5,309.5C 956.83,309.046 970.163,308.712 983.5,308.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#909090"
                  d="M 943.5,309.5 C 938.684,310.326 933.684,310.826 928.5,311C 927.624,312.585 926.291,313.585 924.5,314C 926.9,314.186 929.234,314.686 931.5,315.5C 929.376,316.149 927.376,316.983 925.5,318C 929.449,318.807 929.449,319.307 925.5,319.5C 925.5,322.5 925.5,325.5 925.5,328.5C 929.614,329.51 933.614,330.51 937.5,331.5C 923.147,331.15 908.814,330.483 894.5,329.5C 892.428,328.596 890.928,327.262 890,325.5C 889.501,321.848 889.335,318.182 889.5,314.5C 887.473,314.662 885.473,314.495 883.5,314C 886.5,313.667 889.5,313.333 892.5,313C 890.942,312.79 889.609,312.29 888.5,311.5C 906.79,310.501 925.123,309.834 943.5,309.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#676767"
                  d="M 1395.5,317.5 C 1392.5,317.5 1389.5,317.5 1386.5,317.5C 1382.15,317.666 1377.82,317.499 1373.5,317C 1374.62,316.751 1375.62,316.251 1376.5,315.5C 1373.43,313.291 1372.77,310.457 1374.5,307C 1378.82,306.501 1383.15,306.334 1387.5,306.5C 1387.5,307.5 1387.5,308.5 1387.5,309.5C 1418.87,309.858 1450.2,311.025 1481.5,313C 1462.65,313.519 1443.82,314.353 1425,315.5C 1419.35,315.639 1413.85,314.973 1408.5,313.5C 1408.5,314.5 1408.5,315.5 1408.5,316.5C 1406.14,316.663 1403.81,316.497 1401.5,316C 1402.85,313.875 1402.18,312.708 1399.5,312.5C 1396.82,312.708 1396.15,313.875 1397.5,316C 1396.58,316.278 1395.92,316.778 1395.5,317.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#9f9f9f"
                  d="M 888.5,311.5 C 889.609,312.29 890.942,312.79 892.5,313C 889.5,313.333 886.5,313.667 883.5,314C 885.473,314.495 887.473,314.662 889.5,314.5C 889.335,318.182 889.501,321.848 890,325.5C 890.928,327.262 892.428,328.596 894.5,329.5C 878.501,329.113 862.501,328.78 846.5,328.5C 841.407,327.892 836.407,326.559 831.5,324.5C 831.5,321.833 831.5,319.167 831.5,316.5C 829.94,316.481 828.44,316.148 827,315.5C 819.676,317.467 812.343,318.467 805,318.5C 804.517,317.552 804.351,316.552 804.5,315.5C 814.625,316.377 824.625,315.377 834.5,312.5C 835.442,312.608 836.275,312.941 837,313.5C 854.067,311.817 871.234,311.15 888.5,311.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#a0a2a3"
                  d="M 1337.5,313.5 C 1344.03,313.133 1350.7,312.8 1357.5,312.5C 1357.5,313.5 1357.5,314.5 1357.5,315.5C 1352.38,315.313 1347.38,315.313 1342.5,315.5C 1341.15,314.05 1339.48,313.383 1337.5,313.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#b4b4b4"
                  d="M 986.5,307.5 C 985.791,308.404 984.791,308.737 983.5,308.5C 970.163,308.712 956.83,309.046 943.5,309.5C 925.123,309.834 906.79,310.501 888.5,311.5C 871.234,311.15 854.067,311.817 837,313.5C 836.275,312.941 835.442,312.608 834.5,312.5C 824.625,315.377 814.625,316.377 804.5,315.5C 804.351,316.552 804.517,317.552 805,318.5C 812.343,318.467 819.676,317.467 827,315.5C 828.44,316.148 829.94,316.481 831.5,316.5C 831.5,319.167 831.5,321.833 831.5,324.5C 836.407,326.559 841.407,327.892 846.5,328.5C 825.095,328.662 803.762,327.496 782.5,325C 780.917,323.242 779.25,321.742 777.5,320.5C 776.829,321.847 776.829,323.014 777.5,324C 774.11,324.246 770.777,324.746 767.5,325.5C 719.565,322.837 671.565,321.17 623.5,320.5C 617.021,319.509 610.354,319.176 603.5,319.5C 659.511,316.833 715.511,314.833 771.5,313.5C 770.605,307.053 773.438,304.72 780,306.5C 782.5,306.833 785,307.167 787.5,307.5C 787.525,309.63 788.025,311.63 789,313.5C 831.607,311.814 874.273,310.147 917,308.5C 917.414,308.957 917.914,309.291 918.5,309.5C 940.363,308.51 962.197,307.51 984,306.5C 984.671,307.252 985.504,307.586 986.5,307.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#7f8080"
                  d="M 785.5,308.5 C 784.391,309.29 783.058,309.79 781.5,310C 782.423,312.041 782.756,314.208 782.5,316.5C 778.724,316.469 778.557,317.136 782,318.5C 786.781,317.581 791.615,317.248 796.5,317.5C 790.662,319.144 784.662,319.477 778.5,318.5C 777.702,318.957 777.369,319.624 777.5,320.5C 771.228,319.318 764.895,318.318 758.5,317.5C 758.709,316.914 759.043,316.414 759.5,316C 763.821,315.501 768.154,315.334 772.5,315.5C 772.5,313.167 772.5,310.833 772.5,308.5C 776.833,308.5 781.167,308.5 785.5,308.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#636464"
                  d="M 785.5,308.5 C 786.216,310.556 786.883,312.723 787.5,315C 791.211,315.175 794.878,315.675 798.5,316.5C 798.043,317.298 797.376,317.631 796.5,317.5C 791.615,317.248 786.781,317.581 782,318.5C 778.557,317.136 778.724,316.469 782.5,316.5C 782.756,314.208 782.423,312.041 781.5,310C 783.058,309.79 784.391,309.29 785.5,308.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#959596"
                  d="M 1060.5,316.5 C 1065.84,316.334 1071.18,316.501 1076.5,317C 1074.61,317.973 1072.61,318.64 1070.5,319C 1072.29,321.106 1072.96,323.606 1072.5,326.5C 1070.83,326.5 1069.17,326.5 1067.5,326.5C 1067.5,323.5 1067.5,320.5 1067.5,317.5C 1065.86,317.286 1064.36,317.62 1063,318.5C 1062.5,321.146 1062.34,323.813 1062.5,326.5C 1063.5,326.5 1064.5,326.5 1065.5,326.5C 1065.37,329.558 1063.87,329.891 1061,327.5C 1060.5,323.848 1060.33,320.182 1060.5,316.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#cdcecd"
                  d="M 1586.5,315.5 C 1585.5,316.167 1584.5,316.833 1583.5,317.5C 1565.51,318.338 1547.51,319.004 1529.5,319.5C 1489.2,321.892 1448.87,323.892 1408.5,325.5C 1410.04,324.837 1411.71,324.17 1413.5,323.5C 1414.51,322.604 1414.51,321.938 1413.5,321.5C 1381.92,321.345 1349.92,322.345 1317.5,324.5C 1318.26,323.732 1319.26,323.232 1320.5,323C 1320.17,322.667 1319.83,322.333 1319.5,322C 1321.17,321.667 1322.83,321.333 1324.5,321C 1338.04,320.971 1351.38,320.138 1364.5,318.5C 1366.17,318.5 1367.83,318.5 1369.5,318.5C 1375.36,318.822 1381.02,318.489 1386.5,317.5C 1389.5,317.5 1392.5,317.5 1395.5,317.5C 1398.52,317.335 1401.52,317.502 1404.5,318C 1403.05,319.117 1401.38,319.784 1399.5,320C 1404.63,321.11 1409.3,320.11 1413.5,317C 1423.34,316.68 1433.18,316.18 1443,315.5C 1446.05,315.364 1448.89,316.031 1451.5,317.5C 1450.62,318.251 1449.62,318.751 1448.5,319C 1450.47,319.495 1452.47,319.662 1454.5,319.5C 1454.64,317.876 1453.97,316.71 1452.5,316C 1497.15,313.056 1541.82,312.889 1586.5,315.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#c4c4c3"
                  d="M 1364.5,318.5 C 1351.38,320.138 1338.04,320.971 1324.5,321C 1322.83,321.333 1321.17,321.667 1319.5,322C 1319.83,322.333 1320.17,322.667 1320.5,323C 1319.26,323.232 1318.26,323.732 1317.5,324.5C 1272.32,325.949 1227.32,327.949 1182.5,330.5C 1168.49,330.551 1154.49,331.051 1140.5,332C 1137.06,332.649 1133.73,333.482 1130.5,334.5C 1125.62,334.389 1125.29,333.222 1129.5,331C 1127.93,330.301 1126.59,330.635 1125.5,332C 1081.84,334.182 1038.17,336.349 994.5,338.5C 870.821,333.761 747.155,328.761 623.5,323.5C 623.5,322.5 623.5,321.5 623.5,320.5C 671.565,321.17 719.565,322.837 767.5,325.5C 770.777,324.746 774.11,324.246 777.5,324C 776.829,323.014 776.829,321.847 777.5,320.5C 779.25,321.742 780.917,323.242 782.5,325C 803.762,327.496 825.095,328.662 846.5,328.5C 862.501,328.78 878.501,329.113 894.5,329.5C 908.814,330.483 923.147,331.15 937.5,331.5C 954.488,332.281 971.488,332.947 988.5,333.5C 1007.58,332.967 1026.58,331.967 1045.5,330.5C 1052.51,330.666 1059.51,330.5 1066.5,330C 1070.13,329.717 1073.63,328.883 1077,327.5C 1078.8,328.813 1081.3,330.147 1084.5,331.5C 1086.33,330.205 1088.33,329.205 1090.5,328.5C 1089.29,327.28 1089.29,326.113 1090.5,325C 1092.13,324.506 1093.8,324.34 1095.5,324.5C 1095.5,325.833 1095.5,327.167 1095.5,328.5C 1127.93,328.041 1160.26,326.708 1192.5,324.5C 1249.83,322.367 1307.16,320.367 1364.5,318.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#8a8a8a"
                  d="M 1583.5,317.5 C 1584.5,317.5 1585.5,317.5 1586.5,317.5C 1585.34,356.83 1584.34,396.163 1583.5,435.5C 1581.85,436.927 1579.85,437.76 1577.5,438C 1560.89,439.628 1544.55,441.128 1528.5,442.5C 1541.95,440.15 1555.61,438.317 1569.5,437C 1570.62,436.751 1571.62,436.251 1572.5,435.5C 1572.33,435.167 1572.17,434.833 1572,434.5C 1564.44,436.051 1556.94,436.718 1549.5,436.5C 1548.81,435.975 1548.31,435.308 1548,434.5C 1547.67,434.833 1547.33,435.167 1547,435.5C 1546.61,433.821 1546.77,432.155 1547.5,430.5C 1546.44,428.239 1545.1,426.239 1543.5,424.5C 1540,427.752 1539,431.585 1540.5,436C 1539.89,436.87 1539.06,437.37 1538,437.5C 1536.84,436.813 1535.67,436.647 1534.5,437C 1535.95,438.117 1537.62,438.784 1539.5,439C 1530.86,440.248 1522.19,440.582 1513.5,440C 1514.17,439.667 1514.83,439.333 1515.5,439C 1514.23,438.691 1513.07,438.191 1512,437.5C 1513.43,433.135 1512.1,429.802 1508,427.5C 1506.36,431.22 1505.19,435.053 1504.5,439C 1505.83,439.667 1507.17,440.333 1508.5,441C 1501.05,442.557 1493.72,444.057 1486.5,445.5C 1479.65,445.735 1472.98,446.402 1466.5,447.5C 1443.86,449.848 1421.2,452.015 1398.5,454C 1389.97,455.252 1381.64,456.752 1373.5,458.5C 1373.5,458.833 1373.5,459.167 1373.5,459.5C 1370.17,459.5 1366.83,459.5 1363.5,459.5C 1348.16,460.482 1332.82,461.649 1317.5,463C 1312.13,463.117 1307.13,464.284 1302.5,466.5C 1301.83,466.5 1301.17,466.5 1300.5,466.5C 1295.16,466.334 1289.82,466.501 1284.5,467C 1275.61,468.045 1266.94,469.545 1258.5,471.5C 1257.83,471.5 1257.17,471.5 1256.5,471.5C 1219.57,474.794 1182.57,478.627 1145.5,483C 1144.94,483.383 1144.61,483.883 1144.5,484.5C 1117.15,486.286 1089.82,488.619 1062.5,491.5C 1062.5,492.833 1062.5,494.167 1062.5,495.5C 1059.29,495.19 1056.29,495.523 1053.5,496.5C 1050.83,496.5 1048.17,496.5 1045.5,496.5C 1045.17,496.5 1044.83,496.5 1044.5,496.5C 1049.39,495.513 1054.06,494.346 1058.5,493C 1056.31,492.323 1055.98,491.156 1057.5,489.5C 1055.62,488.803 1055.28,487.803 1056.5,486.5C 1054.05,484.074 1054.05,481.574 1056.5,479C 1055.83,477.333 1055.17,475.667 1054.5,474C 1057.24,471.6 1057.58,469.1 1055.5,466.5C 1056.13,464.522 1056.13,462.355 1055.5,460C 1058.17,459.333 1058.17,458.667 1055.5,458C 1056.17,457.333 1056.83,456.667 1057.5,456C 1056.6,453.808 1055.6,451.642 1054.5,449.5C 1057.73,447.437 1057.73,444.937 1054.5,442C 1056.89,441.309 1056.89,440.309 1054.5,439C 1056.51,436.598 1056.51,434.598 1054.5,433C 1055.17,432.667 1055.83,432.333 1056.5,432C 1055.71,430.915 1055.04,429.748 1054.5,428.5C 1057.24,423.309 1057.58,418.142 1055.5,413C 1055.85,409.564 1056.52,406.231 1057.5,403C 1056.09,402.632 1055.09,401.799 1054.5,400.5C 1055.53,400.704 1056.53,400.204 1057.5,399C 1054.06,398.779 1053.72,397.779 1056.5,396C 1056.11,394.192 1056.11,392.525 1056.5,391C 1055.83,390.667 1055.17,390.333 1054.5,390C 1055.22,387.539 1055.88,385.039 1056.5,382.5C 1055.7,379.731 1055.37,377.064 1055.5,374.5C 1056.04,373.252 1056.71,372.085 1057.5,371C 1056.5,370 1055.5,369 1054.5,368C 1055.31,367.692 1055.97,367.192 1056.5,366.5C 1055.66,360.095 1055.66,353.929 1056.5,348C 1056.05,346.715 1055.38,345.548 1054.5,344.5C 1056.28,343.016 1058.28,342.016 1060.5,341.5C 1081.49,340.4 1102.49,339.4 1123.5,338.5C 1131.67,339.012 1139.83,339.679 1148,340.5C 1180.81,338.48 1213.65,336.814 1246.5,335.5C 1249.75,335.521 1252.92,335.854 1256,336.5C 1269.81,335.117 1283.64,333.617 1297.5,332C 1374.55,329.22 1451.55,325.553 1528.5,321C 1529.06,320.617 1529.39,320.117 1529.5,319.5C 1547.51,319.004 1565.51,318.338 1583.5,317.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#b2b2b1"
                  d="M 1529.5,319.5 C 1529.39,320.117 1529.06,320.617 1528.5,321C 1451.55,325.553 1374.55,329.22 1297.5,332C 1283.64,333.617 1269.81,335.117 1256,336.5C 1252.92,335.854 1249.75,335.521 1246.5,335.5C 1213.65,336.814 1180.81,338.48 1148,340.5C 1139.83,339.679 1131.67,339.012 1123.5,338.5C 1145.33,337.133 1167.33,336.133 1189.5,335.5C 1262.5,332.167 1335.5,328.833 1408.5,325.5C 1448.87,323.892 1489.2,321.892 1529.5,319.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#d8d8d7"
                  d="M 1408.5,325.5 C 1335.5,328.833 1262.5,332.167 1189.5,335.5C 1191.29,334.691 1193.29,334.191 1195.5,334C 1196.17,333 1196.83,332 1197.5,331C 1192.51,330.501 1187.51,330.334 1182.5,330.5C 1227.32,327.949 1272.32,325.949 1317.5,324.5C 1349.92,322.345 1381.92,321.345 1413.5,321.5C 1414.51,321.938 1414.51,322.604 1413.5,323.5C 1411.71,324.17 1410.04,324.837 1408.5,325.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#ebebeb"
                  d="M 603.5,319.5 C 610.354,319.176 617.021,319.509 623.5,320.5C 623.5,321.5 623.5,322.5 623.5,323.5C 747.155,328.761 870.821,333.761 994.5,338.5C 1038.17,336.349 1081.84,334.182 1125.5,332C 1126.59,330.635 1127.93,330.301 1129.5,331C 1125.29,333.222 1125.62,334.389 1130.5,334.5C 1133.73,333.482 1137.06,332.649 1140.5,332C 1154.49,331.051 1168.49,330.551 1182.5,330.5C 1187.51,330.334 1192.51,330.501 1197.5,331C 1196.83,332 1196.17,333 1195.5,334C 1193.29,334.191 1191.29,334.691 1189.5,335.5C 1167.33,336.133 1145.33,337.133 1123.5,338.5C 1102.49,339.4 1081.49,340.4 1060.5,341.5C 1055.8,341.437 1051.13,341.771 1046.5,342.5C 1006.17,342.667 965.832,342.5 925.5,342C 797.814,336.638 670.148,330.971 542.5,325C 539.949,324.998 537.949,324.164 536.5,322.5C 545.717,320.987 555.05,320.153 564.5,320C 577.075,319.823 589.575,319.323 602,318.5C 602.383,319.056 602.883,319.389 603.5,319.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#9e9e9d"
                  d="M 536.5,322.5 C 537.949,324.164 539.949,324.998 542.5,325C 670.148,330.971 797.814,336.638 925.5,342C 965.832,342.5 1006.17,342.667 1046.5,342.5C 1044.75,344.223 1042.75,345.723 1040.5,347C 1040.39,349.811 1040.72,352.478 1041.5,355C 1040.83,355.333 1040.17,355.667 1039.5,356C 1040.57,356.739 1041.24,357.739 1041.5,359C 1040.17,361 1040.17,363 1041.5,365C 1041.24,366.261 1040.57,367.261 1039.5,368C 1040.33,368.915 1041.33,369.581 1042.5,370C 1041.17,370.667 1041.17,371.333 1042.5,372C 1041.83,372.333 1041.17,372.667 1040.5,373C 1041.23,377.155 1041.23,381.155 1040.5,385C 1043.17,386.667 1043.17,388.333 1040.5,390C 1041.17,391.333 1042.17,392.333 1043.5,393C 1042.69,393.308 1042.03,393.808 1041.5,394.5C 1042.79,399.254 1042.12,404.42 1039.5,410C 1040.17,410.333 1040.83,410.667 1041.5,411C 1041.17,412.667 1040.83,414.333 1040.5,416C 1043.17,417.333 1043.17,418.667 1040.5,420C 1041.29,421.085 1041.96,422.252 1042.5,423.5C 1041.78,428.238 1041.78,433.238 1042.5,438.5C 1040.8,439.89 1040.13,441.39 1040.5,443C 1041.62,443.249 1042.62,443.749 1043.5,444.5C 1042.6,444.669 1041.6,445.002 1040.5,445.5C 1041.03,446.192 1041.69,446.692 1042.5,447C 1041.61,449.764 1041.61,452.764 1042.5,456C 1042.24,457.261 1041.57,458.261 1040.5,459C 1043.73,460.724 1044.06,462.724 1041.5,465C 1042.45,469.192 1042.45,473.525 1041.5,478C 1042.17,478.667 1042.83,479.333 1043.5,480C 1042.36,481.53 1041.36,482.863 1040.5,484C 1041.33,484.915 1042.33,485.581 1043.5,486C 1042.71,487.085 1042.04,488.252 1041.5,489.5C 1042.48,491.098 1042.65,492.765 1042,494.5C 1039.13,495.693 1036.3,496.693 1033.5,497.5C 1004.5,498.808 975.499,498.808 946.5,497.5C 943.5,497.5 940.5,497.5 937.5,497.5C 934.038,496.518 930.371,496.185 926.5,496.5C 925.833,495.833 925.167,495.167 924.5,494.5C 924.5,493.5 924.5,492.5 924.5,491.5C 902.524,489.483 880.524,487.649 858.5,486C 857.377,484.956 856.044,484.29 854.5,484C 842.52,482.977 830.52,482.477 818.5,482.5C 807.728,482.38 797.061,481.38 786.5,479.5C 780.887,477.742 774.887,476.576 768.5,476C 761.508,475.5 754.508,475.334 747.5,475.5C 746.833,475.5 746.167,475.5 745.5,475.5C 733.202,472.475 720.535,470.308 707.5,469C 683.177,466.895 658.844,465.061 634.5,463.5C 634.198,466.059 634.532,468.393 635.5,470.5C 635.5,480.833 635.5,491.167 635.5,501.5C 634.5,501.5 633.5,501.5 632.5,501.5C 633.897,500.181 634.563,498.514 634.5,496.5C 633.915,486.893 633.582,476.56 633.5,465.5C 606.903,462.19 580.403,459.524 554,457.5C 548.433,456.909 543.1,455.576 538,453.5C 536.982,410.361 535.815,367.195 534.5,324C 535.044,323.283 535.711,322.783 536.5,322.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#acadaf"
                  d="M 1039.5,324.5 C 1041.17,324.5 1042.83,324.5 1044.5,324.5C 1044.46,325.583 1044.13,326.583 1043.5,327.5C 1039.55,328.491 1035.55,328.824 1031.5,328.5C 1031.5,327.5 1031.5,326.5 1031.5,325.5C 1034.39,325.806 1037.05,325.473 1039.5,324.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#a8a8a8"
                  d="M 1586.5,315.5 C 1587.12,315.611 1587.62,315.944 1588,316.5C 1587.5,349.186 1586.34,382.019 1584.5,415C 1585.06,415.725 1585.39,416.558 1585.5,417.5C 1584.91,423.653 1584.25,429.653 1583.5,435.5C 1584.34,396.163 1585.34,356.83 1586.5,317.5C 1585.5,317.5 1584.5,317.5 1583.5,317.5C 1584.5,316.833 1585.5,316.167 1586.5,315.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#939392"
                  d="M 1060.5,341.5 C 1058.28,342.016 1056.28,343.016 1054.5,344.5C 1055.38,345.548 1056.05,346.715 1056.5,348C 1055.66,353.929 1055.66,360.095 1056.5,366.5C 1055.97,367.192 1055.31,367.692 1054.5,368C 1055.5,369 1056.5,370 1057.5,371C 1056.71,372.085 1056.04,373.252 1055.5,374.5C 1055.37,377.064 1055.7,379.731 1056.5,382.5C 1055.88,385.039 1055.22,387.539 1054.5,390C 1055.17,390.333 1055.83,390.667 1056.5,391C 1056.11,392.525 1056.11,394.192 1056.5,396C 1053.72,397.779 1054.06,398.779 1057.5,399C 1056.53,400.204 1055.53,400.704 1054.5,400.5C 1055.09,401.799 1056.09,402.632 1057.5,403C 1056.52,406.231 1055.85,409.564 1055.5,413C 1057.58,418.142 1057.24,423.309 1054.5,428.5C 1055.04,429.748 1055.71,430.915 1056.5,432C 1055.83,432.333 1055.17,432.667 1054.5,433C 1056.51,434.598 1056.51,436.598 1054.5,439C 1056.89,440.309 1056.89,441.309 1054.5,442C 1057.73,444.937 1057.73,447.437 1054.5,449.5C 1055.6,451.642 1056.6,453.808 1057.5,456C 1056.83,456.667 1056.17,457.333 1055.5,458C 1058.17,458.667 1058.17,459.333 1055.5,460C 1056.13,462.355 1056.13,464.522 1055.5,466.5C 1057.58,469.1 1057.24,471.6 1054.5,474C 1055.17,475.667 1055.83,477.333 1056.5,479C 1054.05,481.574 1054.05,484.074 1056.5,486.5C 1055.28,487.803 1055.62,488.803 1057.5,489.5C 1055.98,491.156 1056.31,492.323 1058.5,493C 1054.06,494.346 1049.39,495.513 1044.5,496.5C 1042.28,497.369 1039.95,497.702 1037.5,497.5C 1037.17,497.5 1036.83,497.5 1036.5,497.5C 1035.5,497.5 1034.5,497.5 1033.5,497.5C 1036.3,496.693 1039.13,495.693 1042,494.5C 1042.65,492.765 1042.48,491.098 1041.5,489.5C 1042.04,488.252 1042.71,487.085 1043.5,486C 1042.33,485.581 1041.33,484.915 1040.5,484C 1041.36,482.863 1042.36,481.53 1043.5,480C 1042.83,479.333 1042.17,478.667 1041.5,478C 1042.45,473.525 1042.45,469.192 1041.5,465C 1044.06,462.724 1043.73,460.724 1040.5,459C 1041.57,458.261 1042.24,457.261 1042.5,456C 1041.61,452.764 1041.61,449.764 1042.5,447C 1041.69,446.692 1041.03,446.192 1040.5,445.5C 1041.6,445.002 1042.6,444.669 1043.5,444.5C 1042.62,443.749 1041.62,443.249 1040.5,443C 1040.13,441.39 1040.8,439.89 1042.5,438.5C 1041.78,433.238 1041.78,428.238 1042.5,423.5C 1041.96,422.252 1041.29,421.085 1040.5,420C 1043.17,418.667 1043.17,417.333 1040.5,416C 1040.83,414.333 1041.17,412.667 1041.5,411C 1040.83,410.667 1040.17,410.333 1039.5,410C 1042.12,404.42 1042.79,399.254 1041.5,394.5C 1042.03,393.808 1042.69,393.308 1043.5,393C 1042.17,392.333 1041.17,391.333 1040.5,390C 1043.17,388.333 1043.17,386.667 1040.5,385C 1041.23,381.155 1041.23,377.155 1040.5,373C 1041.17,372.667 1041.83,372.333 1042.5,372C 1041.17,371.333 1041.17,370.667 1042.5,370C 1041.33,369.581 1040.33,368.915 1039.5,368C 1040.57,367.261 1041.24,366.261 1041.5,365C 1040.17,363 1040.17,361 1041.5,359C 1041.24,357.739 1040.57,356.739 1039.5,356C 1040.17,355.667 1040.83,355.333 1041.5,355C 1040.72,352.478 1040.39,349.811 1040.5,347C 1042.75,345.723 1044.75,344.223 1046.5,342.5C 1051.13,341.771 1055.8,341.437 1060.5,341.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#343334"
                  d="M 703.5,385.5 C 701.918,396.117 704.085,405.784 710,414.5C 714.568,418.986 720.068,420.653 726.5,419.5C 726.201,420.76 726.201,421.927 726.5,423C 724.5,423.333 722.5,423.667 720.5,424C 720.833,424.333 721.167,424.667 721.5,425C 720.328,425.419 719.328,426.085 718.5,427C 721.695,427.181 724.695,427.681 727.5,428.5C 714.807,427.764 702.141,426.764 689.5,425.5C 689.082,424.778 688.416,424.278 687.5,424C 692.437,422.915 697.437,422.248 702.5,422C 701.167,421.667 699.833,421.333 698.5,421C 699,420.5 699.5,420 700,419.5C 701.726,420.576 703.559,420.743 705.5,420C 703.924,418.423 702.091,417.256 700,416.5C 698.467,417.695 696.967,417.695 695.5,416.5C 695.167,417.167 694.833,417.833 694.5,418.5C 690.246,418.586 685.913,418.253 681.5,417.5C 681.744,400.479 681.411,383.479 680.5,366.5C 682.269,365.579 683.935,364.412 685.5,363C 687.167,362.333 688.833,362.333 690.5,363C 693.694,364.744 696.694,366.744 699.5,369C 700.701,369.903 701.535,371.069 702,372.5C 702.25,376.138 702.417,379.638 702.5,383C 694.719,388.351 692.552,395.518 696,404.5C 696.259,402.009 696.093,399.509 695.5,397C 696.395,394.18 697.229,391.346 698,388.5C 699.264,386.393 701.097,385.393 703.5,385.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#231f1e"
                  d="M 688.5,359.5 C 719.828,361.037 751.161,362.537 782.5,364C 786.219,365.263 788.719,367.763 790,371.5C 790.667,389.833 790.667,408.167 790,426.5C 789.31,429.196 787.81,431.363 785.5,433C 766.145,431.98 746.811,430.48 727.5,428.5C 724.695,427.681 721.695,427.181 718.5,427C 719.328,426.085 720.328,425.419 721.5,425C 721.167,424.667 720.833,424.333 720.5,424C 722.5,423.667 724.5,423.333 726.5,423C 726.201,421.927 726.201,420.76 726.5,419.5C 728.685,419.296 730.685,418.63 732.5,417.5C 736.607,417.877 740.274,416.877 743.5,414.5C 751.909,415.298 758.909,412.631 764.5,406.5C 764.152,409.019 762.819,410.853 760.5,412C 764.5,412.667 768.5,412.667 772.5,412C 773.931,411.535 775.097,410.701 776,409.5C 774.333,401.167 776.667,394.167 783,388.5C 783.738,384.598 783.072,380.932 781,377.5C 777.262,373.666 773.428,369.832 769.5,366C 768.056,365.219 766.723,365.386 765.5,366.5C 765.709,367.086 766.043,367.586 766.5,368C 764.709,370.414 763.043,372.914 761.5,375.5C 760.583,374.873 759.583,374.539 758.5,374.5C 755.039,372.909 751.372,372.242 747.5,372.5C 745.167,372.5 742.833,372.5 740.5,372.5C 737.236,371.676 733.902,371.342 730.5,371.5C 725.75,369.519 720.75,369.019 715.5,370C 714.944,370.383 714.611,370.883 714.5,371.5C 708.671,374.344 705.004,379.01 703.5,385.5C 701.097,385.393 699.264,386.393 698,388.5C 697.229,391.346 696.395,394.18 695.5,397C 696.093,399.509 696.259,402.009 696,404.5C 692.552,395.518 694.719,388.351 702.5,383C 702.417,379.638 702.25,376.138 702,372.5C 701.535,371.069 700.701,369.903 699.5,369C 696.694,366.744 693.694,364.744 690.5,363C 688.833,362.333 687.167,362.333 685.5,363C 683.935,364.412 682.269,365.579 680.5,366.5C 680.5,364.167 680.5,361.833 680.5,359.5C 683.167,359.5 685.833,359.5 688.5,359.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#403e40"
                  d="M 674.5,358.5 C 671.482,358.335 668.482,358.502 665.5,359C 665,359.5 664.5,360 664,360.5C 663.043,377.567 663.376,394.567 665,411.5C 666.873,403.049 668.373,394.549 669.5,386C 672.061,384.51 674.227,382.677 676,380.5C 676.333,380.833 676.667,381.167 677,381.5C 678.186,387.085 678.852,392.751 679,398.5C 679.5,385.171 679.667,371.837 679.5,358.5C 682.713,358.19 685.713,358.523 688.5,359.5C 685.833,359.5 683.167,359.5 680.5,359.5C 680.5,361.833 680.5,364.167 680.5,366.5C 681.411,383.479 681.744,400.479 681.5,417.5C 685.913,418.253 690.246,418.586 694.5,418.5C 694.833,417.833 695.167,417.167 695.5,416.5C 696.967,417.695 698.467,417.695 700,416.5C 702.091,417.256 703.924,418.423 705.5,420C 703.559,420.743 701.726,420.576 700,419.5C 699.5,420 699,420.5 698.5,421C 699.833,421.333 701.167,421.667 702.5,422C 697.437,422.248 692.437,422.915 687.5,424C 688.416,424.278 689.082,424.778 689.5,425.5C 682.786,425.637 676.12,425.137 669.5,424C 665.698,421.913 663.198,418.746 662,414.5C 661.333,396.5 661.333,378.5 662,360.5C 662.833,359.667 663.667,358.833 664.5,358C 668.027,357.192 671.36,357.359 674.5,358.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#31302f"
                  d="M 674.5,358.5 C 676.167,358.5 677.833,358.5 679.5,358.5C 679.667,371.837 679.5,385.171 679,398.5C 678.852,392.751 678.186,387.085 677,381.5C 676.667,381.167 676.333,380.833 676,380.5C 674.227,382.677 672.061,384.51 669.5,386C 668.373,394.549 666.873,403.049 665,411.5C 663.376,394.567 663.043,377.567 664,360.5C 664.5,360 665,359.5 665.5,359C 668.482,358.502 671.482,358.335 674.5,358.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#824931"
                  d="M 730.5,371.5 C 731.174,373.024 732.174,374.358 733.5,375.5C 732.624,376.251 731.624,376.751 730.5,377C 732.941,377.036 734.941,377.869 736.5,379.5C 735.271,380.281 733.938,380.781 732.5,381C 734.167,381.333 735.833,381.667 737.5,382C 738.252,382.671 738.586,383.504 738.5,384.5C 736.5,384.5 734.5,384.5 732.5,384.5C 732.662,386.527 732.495,388.527 732,390.5C 729.996,385.785 727.996,381.119 726,376.5C 722.717,373.361 718.883,371.694 714.5,371.5C 714.611,370.883 714.944,370.383 715.5,370C 720.75,369.019 725.75,369.519 730.5,371.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4f4f50"
                  d="M 589.5,371.5 C 591.048,371.821 591.715,372.821 591.5,374.5C 592.5,374.5 593.5,374.5 594.5,374.5C 594.962,379.244 593.462,380.244 590,377.5C 589.505,375.527 589.338,373.527 589.5,371.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#37110e"
                  d="M 730.5,371.5 C 733.902,371.342 737.236,371.676 740.5,372.5C 744.634,375.981 747.634,380.314 749.5,385.5C 752.087,396.236 750.087,405.902 743.5,414.5C 740.274,416.877 736.607,417.877 732.5,417.5C 734.054,416.086 735.388,414.419 736.5,412.5C 735.624,411.749 734.624,411.249 733.5,411C 734.833,410.667 736.167,410.333 737.5,410C 738.925,408.286 738.592,406.953 736.5,406C 737.448,405.517 738.448,405.351 739.5,405.5C 739.5,404.5 739.5,403.5 739.5,402.5C 738.325,402.719 737.325,402.386 736.5,401.5C 737.689,400.571 739.022,400.238 740.5,400.5C 740.5,399.167 740.5,397.833 740.5,396.5C 733.833,396.167 733.833,395.833 740.5,395.5C 740.5,394.167 740.5,392.833 740.5,391.5C 734.833,391.336 734.5,391.003 739.5,390.5C 739.675,388.379 739.341,386.379 738.5,384.5C 738.586,383.504 738.252,382.671 737.5,382C 735.833,381.667 734.167,381.333 732.5,381C 733.938,380.781 735.271,380.281 736.5,379.5C 734.941,377.869 732.941,377.036 730.5,377C 731.624,376.751 732.624,376.251 733.5,375.5C 732.174,374.358 731.174,373.024 730.5,371.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#511a12"
                  d="M 714.5,371.5 C 718.883,371.694 722.717,373.361 726,376.5C 727.996,381.119 729.996,385.785 732,390.5C 732.495,388.527 732.662,386.527 732.5,384.5C 734.5,384.5 736.5,384.5 738.5,384.5C 739.341,386.379 739.675,388.379 739.5,390.5C 734.5,391.003 734.833,391.336 740.5,391.5C 740.5,392.833 740.5,394.167 740.5,395.5C 733.833,395.833 733.833,396.167 740.5,396.5C 740.5,397.833 740.5,399.167 740.5,400.5C 739.022,400.238 737.689,400.571 736.5,401.5C 737.325,402.386 738.325,402.719 739.5,402.5C 739.5,403.5 739.5,404.5 739.5,405.5C 738.448,405.351 737.448,405.517 736.5,406C 738.592,406.953 738.925,408.286 737.5,410C 736.167,410.333 734.833,410.667 733.5,411C 734.624,411.249 735.624,411.749 736.5,412.5C 735.388,414.419 734.054,416.086 732.5,417.5C 730.685,418.63 728.685,419.296 726.5,419.5C 720.068,420.653 714.568,418.986 710,414.5C 704.085,405.784 701.918,396.117 703.5,385.5C 705.004,379.01 708.671,374.344 714.5,371.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#754717"
                  d="M 712.5,377.5 C 717.522,377.175 721.189,379.175 723.5,383.5C 721.257,384.383 719.59,383.549 718.5,381C 714.726,379.817 711.559,380.651 709,383.5C 708.333,382.833 708.333,382.167 709,381.5C 710.376,380.295 711.542,378.962 712.5,377.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3d2d11"
                  d="M 747.5,372.5 C 751.372,372.242 755.039,372.909 758.5,374.5C 759.782,377.617 761.949,379.95 765,381.5C 765.45,383.519 766.283,385.352 767.5,387C 766.691,392.417 766.191,397.917 766,403.5C 765.487,404.527 764.987,405.527 764.5,406.5C 758.909,412.631 751.909,415.298 743.5,414.5C 750.087,405.902 752.087,396.236 749.5,385.5C 751.415,390.529 752.415,395.863 752.5,401.5C 755.272,403.434 757.105,402.767 758,399.5C 759.689,388.388 756.189,379.388 747.5,372.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#271411"
                  d="M 764.5,406.5 C 764.987,405.527 765.487,404.527 766,403.5C 766.191,397.917 766.691,392.417 767.5,387C 766.283,385.352 765.45,383.519 765,381.5C 761.949,379.95 759.782,377.617 758.5,374.5C 759.583,374.539 760.583,374.873 761.5,375.5C 763.043,372.914 764.709,370.414 766.5,368C 766.043,367.586 765.709,367.086 765.5,366.5C 766.723,365.386 768.056,365.219 769.5,366C 773.428,369.832 777.262,373.666 781,377.5C 783.072,380.932 783.738,384.598 783,388.5C 776.667,394.167 774.333,401.167 776,409.5C 775.097,410.701 773.931,411.535 772.5,412C 768.5,412.667 764.5,412.667 760.5,412C 762.819,410.853 764.152,409.019 764.5,406.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#525252"
                  d="M 814.5,385.5 C 815.943,386.335 816.943,387.668 817.5,389.5C 820.402,387.197 821.236,388.197 820,392.5C 818.159,395.081 816.326,395.081 814.5,392.5C 813.71,390.384 813.71,388.051 814.5,385.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#444445"
                  d="M 1165.5,385.5 C 1169.17,387.238 1169.51,389.738 1166.5,393C 1165.21,393.49 1163.87,393.657 1162.5,393.5C 1163.03,390.646 1164.03,387.979 1165.5,385.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#434344"
                  d="M 1114.5,388.5 C 1115.88,388.962 1116.55,389.962 1116.5,391.5C 1116.65,395.825 1114.65,397.825 1110.5,397.5C 1110.88,394.104 1112.22,391.104 1114.5,388.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4b4b4c"
                  d="M 868.5,389.5 C 870.048,389.821 870.715,390.821 870.5,392.5C 871.833,392.5 873.167,392.5 874.5,392.5C 875.263,396.138 873.93,397.638 870.5,397C 867.489,395.132 866.822,392.632 868.5,389.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#624917"
                  d="M 740.5,372.5 C 742.833,372.5 745.167,372.5 747.5,372.5C 756.189,379.388 759.689,388.388 758,399.5C 757.105,402.767 755.272,403.434 752.5,401.5C 752.415,395.863 751.415,390.529 749.5,385.5C 747.634,380.314 744.634,375.981 740.5,372.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#744416"
                  d="M 705.5,392.5 C 706.403,399.183 709.07,405.183 713.5,410.5C 713.167,410.833 712.833,411.167 712.5,411.5C 706.782,406.34 704.449,400.007 705.5,392.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#a6a3fd"
                  d="M 1489.5,384.5 C 1491.83,384.247 1493.83,384.914 1495.5,386.5C 1498.81,392.416 1498.65,398.416 1495,404.5C 1492,408.5 1489,408.5 1486,404.5C 1483.18,396.956 1484.34,390.289 1489.5,384.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4f5254"
                  d="M 1490.5,388.5 C 1493.44,389.515 1494.77,391.682 1494.5,395C 1494.59,398.586 1493.26,401.42 1490.5,403.5C 1486.66,398.611 1486.66,393.611 1490.5,388.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#5e6264"
                  d="M 1201.5,413.5 C 1200.44,411.445 1198.77,410.111 1196.5,409.5C 1194.83,408.167 1193.17,408.167 1191.5,409.5C 1188.55,410.359 1186.71,412.359 1186,415.5C 1185.33,419.833 1185.33,424.167 1186,428.5C 1186.28,429.416 1186.78,430.082 1187.5,430.5C 1187.41,431.496 1187.75,432.329 1188.5,433C 1191.13,434.61 1193.79,434.777 1196.5,433.5C 1195.89,435.99 1194.23,437.324 1191.5,437.5C 1189.06,436.964 1186.72,436.131 1184.5,435C 1178.2,423.923 1179.86,414.256 1189.5,406C 1195.94,404.614 1199.94,407.114 1201.5,413.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#724617"
                  d="M 725.5,391.5 C 728.376,398.005 727.543,404.338 723,410.5C 721.989,411.337 720.822,411.67 719.5,411.5C 719.351,410.448 719.517,409.448 720,408.5C 721.676,407.939 723.009,406.939 724,405.5C 725.225,400.915 725.725,396.248 725.5,391.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#9792fb"
                  d="M 1196.5,409.5 C 1198.77,410.111 1200.44,411.445 1201.5,413.5C 1202.21,416.786 1202.54,420.119 1202.5,423.5C 1201.62,420.977 1200.78,418.31 1200,415.5C 1199.82,418.695 1199.32,421.695 1198.5,424.5C 1199.15,420.161 1198.15,416.327 1195.5,413C 1194.55,412.517 1193.55,412.351 1192.5,412.5C 1194.08,411.857 1195.41,410.857 1196.5,409.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#b9b5ff"
                  d="M 1196.5,409.5 C 1195.41,410.857 1194.08,411.857 1192.5,412.5C 1192.17,413.5 1191.5,414.167 1190.5,414.5C 1189.62,414.631 1188.96,414.298 1188.5,413.5C 1189.52,412.148 1190.52,410.815 1191.5,409.5C 1193.17,408.167 1194.83,408.167 1196.5,409.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4f5254"
                  d="M 1192.5,412.5 C 1193.55,412.351 1194.55,412.517 1195.5,413C 1198.15,416.327 1199.15,420.161 1198.5,424.5C 1197.19,428.805 1194.52,430.472 1190.5,429.5C 1187.83,424.495 1187.83,419.495 1190.5,414.5C 1191.5,414.167 1192.17,413.5 1192.5,412.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#9b99fb"
                  d="M 1191.5,409.5 C 1190.52,410.815 1189.52,412.148 1188.5,413.5C 1188.96,414.298 1189.62,414.631 1190.5,414.5C 1187.83,419.495 1187.83,424.495 1190.5,429.5C 1189.54,429.047 1188.71,428.381 1188,427.5C 1187.52,428.448 1187.35,429.448 1187.5,430.5C 1186.78,430.082 1186.28,429.416 1186,428.5C 1185.33,424.167 1185.33,419.833 1186,415.5C 1186.71,412.359 1188.55,410.359 1191.5,409.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#bcbafb"
                  d="M 1202.5,423.5 C 1202.01,424.995 1201.34,426.329 1200.5,427.5C 1197.21,432.829 1192.88,433.829 1187.5,430.5C 1187.35,429.448 1187.52,428.448 1188,427.5C 1188.71,428.381 1189.54,429.047 1190.5,429.5C 1194.52,430.472 1197.19,428.805 1198.5,424.5C 1199.32,421.695 1199.82,418.695 1200,415.5C 1200.78,418.31 1201.62,420.977 1202.5,423.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#7371e0"
                  d="M 1200.5,427.5 C 1200.38,430.292 1199.04,432.292 1196.5,433.5C 1193.79,434.777 1191.13,434.61 1188.5,433C 1187.75,432.329 1187.41,431.496 1187.5,430.5C 1192.88,433.829 1197.21,432.829 1200.5,427.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#757575"
                  d="M 1528.5,442.5 C 1517.12,443.06 1505.79,444.06 1494.5,445.5C 1494.5,452.167 1494.5,458.833 1494.5,465.5C 1494.17,465.5 1493.83,465.5 1493.5,465.5C 1493.5,458.833 1493.5,452.167 1493.5,445.5C 1491.17,445.5 1488.83,445.5 1486.5,445.5C 1493.72,444.057 1501.05,442.557 1508.5,441C 1507.17,440.333 1505.83,439.667 1504.5,439C 1505.19,435.053 1506.36,431.22 1508,427.5C 1512.1,429.802 1513.43,433.135 1512,437.5C 1513.07,438.191 1514.23,438.691 1515.5,439C 1514.83,439.333 1514.17,439.667 1513.5,440C 1522.19,440.582 1530.86,440.248 1539.5,439C 1537.62,438.784 1535.95,438.117 1534.5,437C 1535.67,436.647 1536.84,436.813 1538,437.5C 1539.06,437.37 1539.89,436.87 1540.5,436C 1539,431.585 1540,427.752 1543.5,424.5C 1545.1,426.239 1546.44,428.239 1547.5,430.5C 1546.77,432.155 1546.61,433.821 1547,435.5C 1547.33,435.167 1547.67,434.833 1548,434.5C 1548.31,435.308 1548.81,435.975 1549.5,436.5C 1556.94,436.718 1564.44,436.051 1572,434.5C 1572.17,434.833 1572.33,435.167 1572.5,435.5C 1571.62,436.251 1570.62,436.751 1569.5,437C 1555.61,438.317 1541.95,440.15 1528.5,442.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#a9a9a9"
                  d="M 1528.5,442.5 C 1517.73,444.547 1506.73,445.88 1495.5,446.5C 1495.82,453.022 1495.49,459.355 1494.5,465.5C 1494.5,458.833 1494.5,452.167 1494.5,445.5C 1505.79,444.06 1517.12,443.06 1528.5,442.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4e4e4f"
                  d="M 591.5,442.5 C 592.161,443.718 592.828,445.051 593.5,446.5C 596.213,443.786 597.046,444.453 596,448.5C 595.047,450.592 593.714,450.925 592,449.5C 590.585,447.157 590.418,444.823 591.5,442.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4a4a4b"
                  d="M 635.5,446.5 C 636.943,447.335 637.943,448.668 638.5,450.5C 639.086,450.291 639.586,449.957 640,449.5C 641.174,453.661 639.841,454.995 636,453.5C 634.482,451.187 634.316,448.854 635.5,446.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3736e9"
                  d="M 1444.5,451.5 C 1444.83,451.5 1445.17,451.5 1445.5,451.5C 1447.31,452.918 1447.97,454.918 1447.5,457.5C 1446.5,457.5 1445.5,457.5 1444.5,457.5C 1444.5,455.5 1444.5,453.5 1444.5,451.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#67676c"
                  d="M 1466.5,447.5 C 1460.39,448.933 1454.06,449.766 1447.5,450C 1446.58,450.278 1445.92,450.778 1445.5,451.5C 1445.17,451.5 1444.83,451.5 1444.5,451.5C 1436.97,451.626 1429.64,452.293 1422.5,453.5C 1415.41,454.755 1408.41,455.755 1401.5,456.5C 1401.17,456.5 1400.83,456.5 1400.5,456.5C 1396.63,456.185 1392.96,456.518 1389.5,457.5C 1385.96,457.187 1382.62,457.521 1379.5,458.5C 1377.5,458.5 1375.5,458.5 1373.5,458.5C 1381.64,456.752 1389.97,455.252 1398.5,454C 1421.2,452.015 1443.86,449.848 1466.5,447.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#48484d"
                  d="M 1486.5,445.5 C 1488.83,445.5 1491.17,445.5 1493.5,445.5C 1493.5,452.167 1493.5,458.833 1493.5,465.5C 1493.5,470.833 1493.5,476.167 1493.5,481.5C 1492.28,480.972 1491.11,480.305 1490,479.5C 1489.67,479.833 1489.33,480.167 1489,480.5C 1481.57,479.659 1474.07,478.993 1466.5,478.5C 1456.99,479.014 1447.32,479.68 1437.5,480.5C 1434.15,480.665 1430.82,480.498 1427.5,480C 1432.23,478.534 1436.9,476.867 1441.5,475C 1435.69,475.625 1430.02,475.625 1424.5,475C 1428.46,473.351 1432.13,471.184 1435.5,468.5C 1438.12,464.596 1440.62,460.596 1443,456.5C 1444.27,458.578 1445.77,458.912 1447.5,457.5C 1447.97,454.918 1447.31,452.918 1445.5,451.5C 1445.92,450.778 1446.58,450.278 1447.5,450C 1454.06,449.766 1460.39,448.933 1466.5,447.5C 1472.98,446.402 1479.65,445.735 1486.5,445.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2e2dea"
                  d="M 1460.5,450.5 C 1461.65,450.791 1462.32,451.624 1462.5,453C 1462.17,453.833 1461.83,454.667 1461.5,455.5C 1460.55,453.955 1460.21,452.288 1460.5,450.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#696875"
                  d="M 1363.5,459.5 C 1363.5,459.833 1363.5,460.167 1363.5,460.5C 1343.19,462.659 1322.86,464.659 1302.5,466.5C 1307.13,464.284 1312.13,463.117 1317.5,463C 1332.82,461.649 1348.16,460.482 1363.5,459.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#737276"
                  d="M 745.5,475.5 C 743.167,475.5 740.833,475.5 738.5,475.5C 730.837,474.567 723.17,473.567 715.5,472.5C 714.833,472.5 714.167,472.5 713.5,472.5C 708.482,471.898 703.482,471.232 698.5,470.5C 697.5,470.5 696.5,470.5 695.5,470.5C 690.493,470.249 685.493,469.916 680.5,469.5C 680.158,468.662 679.492,468.328 678.5,468.5C 678.167,468.5 677.833,468.5 677.5,468.5C 663.46,467.533 649.46,466.199 635.5,464.5C 635.5,466.5 635.5,468.5 635.5,470.5C 634.532,468.393 634.198,466.059 634.5,463.5C 658.844,465.061 683.177,466.895 707.5,469C 720.535,470.308 733.202,472.475 745.5,475.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#5857f2"
                  d="M 1363.5,460.5 C 1366.19,460.336 1368.85,460.503 1371.5,461C 1369.02,461.424 1366.69,462.257 1364.5,463.5C 1362.61,461.867 1361.11,462.2 1360,464.5C 1359,464.167 1358,463.833 1357,463.5C 1351.62,465.033 1346.12,466.2 1340.5,467C 1332.63,467.476 1324.79,468.309 1317,469.5C 1315.05,468.544 1313.22,468.211 1311.5,468.5C 1310.23,470.18 1308.56,471.347 1306.5,472C 1288.23,474.476 1270.07,476.31 1252,477.5C 1246.03,478.111 1240.19,479.278 1234.5,481C 1223.83,481.154 1213.33,482.32 1203,484.5C 1200.96,483.715 1198.96,484.048 1197,485.5C 1196.59,485.043 1196.09,484.709 1195.5,484.5C 1190.29,484.981 1185.29,486.147 1180.5,488C 1153.9,490.376 1127.57,493.209 1101.5,496.5C 1099.62,496.393 1099.29,496.893 1100.5,498C 1099.21,498.49 1097.87,498.657 1096.5,498.5C 1096.28,495.721 1096.61,493.054 1097.5,490.5C 1113.25,488.074 1128.91,486.074 1144.5,484.5C 1182.07,480.97 1219.4,476.636 1256.5,471.5C 1257.17,471.5 1257.83,471.5 1258.5,471.5C 1272.74,470.573 1286.74,468.906 1300.5,466.5C 1301.17,466.5 1301.83,466.5 1302.5,466.5C 1322.86,464.659 1343.19,462.659 1363.5,460.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4c4c97"
                  d="M 1389.5,457.5 C 1392.96,456.518 1396.63,456.185 1400.5,456.5C 1400.92,457.222 1401.58,457.722 1402.5,458C 1401.17,460.667 1399.17,462.667 1396.5,464C 1385.6,469.784 1374.27,474.45 1362.5,478C 1352.69,479.363 1343.02,481.363 1333.5,484C 1334.5,484.333 1335.5,484.667 1336.5,485C 1313.53,488.578 1290.7,492.411 1268,496.5C 1266.6,495.949 1265.27,495.616 1264,495.5C 1246.15,499.817 1226.98,502.65 1206.5,504C 1182.46,507.482 1158.63,510.649 1135,513.5C 1131.02,513.495 1127.02,513.495 1123,513.5C 1119.09,515.061 1115.26,516.061 1111.5,516.5C 1108.3,515.873 1105.13,515.206 1102,514.5C 1100.6,515.051 1099.27,515.384 1098,515.5C 1093.66,512.571 1088.99,511.571 1084,512.5C 1082.18,511.671 1080.35,510.837 1078.5,510C 1075.62,505.914 1072.29,502.247 1068.5,499C 1065.01,497.996 1061.84,498.496 1059,500.5C 1057.64,499.62 1056.14,499.286 1054.5,499.5C 1054.74,498.209 1054.4,497.209 1053.5,496.5C 1056.29,495.523 1059.29,495.19 1062.5,495.5C 1065.49,493.727 1068.82,493.06 1072.5,493.5C 1072.5,496.167 1072.5,498.833 1072.5,501.5C 1073.5,501.5 1074.5,501.5 1075.5,501.5C 1076.5,501.5 1077.5,501.5 1078.5,501.5C 1078.5,502.167 1078.5,502.833 1078.5,503.5C 1079.45,505.61 1081.12,506.777 1083.5,507C 1089.02,507.347 1094.52,507.847 1100,508.5C 1106.6,507.944 1113.26,506.944 1120,505.5C 1122.38,505.482 1124.55,506.149 1126.5,507.5C 1133.99,506.002 1141.49,504.669 1149,503.5C 1156.01,503.783 1162.68,503.783 1169,503.5C 1171.33,502.833 1173.67,502.167 1176,501.5C 1177.91,501.421 1179.91,501.754 1182,502.5C 1183.58,500.945 1185.42,499.778 1187.5,499C 1208.5,496.211 1229.5,493.878 1250.5,492C 1253.56,491.152 1256.56,490.152 1259.5,489C 1276.96,488.172 1294.13,485.672 1311,481.5C 1311.33,481.833 1311.67,482.167 1312,482.5C 1332.36,479.224 1352.53,475.724 1372.5,472C 1380.56,468.635 1387.9,464.969 1394.5,461C 1395.17,460 1395.83,459 1396.5,458C 1394.19,457.503 1391.86,457.337 1389.5,457.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#666572"
                  d="M 1300.5,466.5 C 1286.74,468.906 1272.74,470.573 1258.5,471.5C 1266.94,469.545 1275.61,468.045 1284.5,467C 1289.82,466.501 1295.16,466.334 1300.5,466.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1e1e25"
                  d="M 677.5,468.5 C 677.5,471.167 677.5,473.833 677.5,476.5C 678.5,476.5 679.5,476.5 680.5,476.5C 680.5,474.167 680.5,471.833 680.5,469.5C 685.493,469.916 690.493,470.249 695.5,470.5C 695.5,470.833 695.5,471.167 695.5,471.5C 695.5,473.833 695.5,476.167 695.5,478.5C 696.833,478.5 698.167,478.5 699.5,478.5C 699.802,475.941 699.468,473.607 698.5,471.5C 698.5,471.167 698.5,470.833 698.5,470.5C 703.482,471.232 708.482,471.898 713.5,472.5C 713.611,473.117 713.944,473.617 714.5,474C 712.717,475.067 712.217,476.567 713,478.5C 717.554,482.387 721.387,486.887 724.5,492C 729.94,495.709 734.94,499.875 739.5,504.5C 732.27,502.424 724.937,500.758 717.5,499.5C 712.882,498.781 708.215,498.281 703.5,498C 702.167,497 700.833,496 699.5,495C 692.313,492.761 685.48,490.594 679,488.5C 676.474,488.565 674.141,489.232 672,490.5C 669.667,489.833 667.333,489.167 665,488.5C 656.259,490.221 647.426,491.554 638.5,492.5C 637.914,492.291 637.414,491.957 637,491.5C 636.502,494.817 636.335,498.15 636.5,501.5C 636.167,501.5 635.833,501.5 635.5,501.5C 635.5,491.167 635.5,480.833 635.5,470.5C 635.5,468.5 635.5,466.5 635.5,464.5C 649.46,466.199 663.46,467.533 677.5,468.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#444445"
                  d="M 1164.5,463.5 C 1167.81,465.446 1168.31,468.113 1166,471.5C 1163.83,473 1162.33,472.5 1161.5,470C 1162.91,468.022 1163.91,465.855 1164.5,463.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#676673"
                  d="M 1256.5,471.5 C 1219.4,476.636 1182.07,480.97 1144.5,484.5C 1144.61,483.883 1144.94,483.383 1145.5,483C 1182.57,478.627 1219.57,474.794 1256.5,471.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2e2dd9"
                  d="M 678.5,468.5 C 679.492,468.328 680.158,468.662 680.5,469.5C 679.691,471.292 679.191,473.292 679,475.5C 678.503,473.19 678.337,470.857 678.5,468.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#212190"
                  d="M 695.5,471.5 C 696.165,473.369 696.831,475.369 697.5,477.5C 698.466,475.604 698.799,473.604 698.5,471.5C 699.468,473.607 699.802,475.941 699.5,478.5C 698.167,478.5 696.833,478.5 695.5,478.5C 695.5,476.167 695.5,473.833 695.5,471.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#444453"
                  d="M 1444.5,451.5 C 1444.5,453.5 1444.5,455.5 1444.5,457.5C 1445.5,457.5 1446.5,457.5 1447.5,457.5C 1445.77,458.912 1444.27,458.578 1443,456.5C 1440.62,460.596 1438.12,464.596 1435.5,468.5C 1432.13,471.184 1428.46,473.351 1424.5,475C 1430.02,475.625 1435.69,475.625 1441.5,475C 1436.9,476.867 1432.23,478.534 1427.5,480C 1430.82,480.498 1434.15,480.665 1437.5,480.5C 1432.83,481.833 1428.17,483.167 1423.5,484.5C 1420.21,485.461 1416.87,485.295 1413.5,484C 1415.5,483.333 1417.5,482.667 1419.5,482C 1418.5,481.833 1417.5,481.667 1416.5,481.5C 1412.54,482.49 1408.54,483.156 1404.5,483.5C 1402.19,483.993 1399.86,484.326 1397.5,484.5C 1395.62,484.607 1395.29,484.107 1396.5,483C 1399.36,481.601 1402.36,480.601 1405.5,480C 1403.5,479.667 1401.5,479.333 1399.5,479C 1403.63,476.698 1407.63,474.198 1411.5,471.5C 1413.97,467.533 1416.97,464.033 1420.5,461C 1422.71,459.956 1425.05,459.29 1427.5,459C 1429.05,456.219 1431.39,454.552 1434.5,454C 1432.19,453.503 1429.86,453.337 1427.5,453.5C 1425.83,453.5 1424.17,453.5 1422.5,453.5C 1429.64,452.293 1436.97,451.626 1444.5,451.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#201f7b"
                  d="M 677.5,468.5 C 677.833,468.5 678.167,468.5 678.5,468.5C 678.337,470.857 678.503,473.19 679,475.5C 679.191,473.292 679.691,471.292 680.5,469.5C 680.5,471.833 680.5,474.167 680.5,476.5C 679.5,476.5 678.5,476.5 677.5,476.5C 677.5,473.833 677.5,471.167 677.5,468.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3433fb"
                  d="M 695.5,471.5 C 695.5,471.167 695.5,470.833 695.5,470.5C 696.5,470.5 697.5,470.5 698.5,470.5C 698.5,470.833 698.5,471.167 698.5,471.5C 698.799,473.604 698.466,475.604 697.5,477.5C 696.831,475.369 696.165,473.369 695.5,471.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4d4d4d"
                  d="M 868.5,470.5 C 869.5,470.5 870.5,470.5 871.5,470.5C 871.633,473.896 872.633,474.229 874.5,471.5C 876.212,474.797 875.379,477.13 872,478.5C 868.33,476.834 867.163,474.167 868.5,470.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#454545"
                  d="M 1113.5,468.5 C 1114.12,468.611 1114.62,468.944 1115,469.5C 1115.67,472.167 1115.67,474.833 1115,477.5C 1112.21,479.184 1110.38,478.517 1109.5,475.5C 1111.11,473.275 1112.44,470.941 1113.5,468.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#747381"
                  d="M 747.5,476.5 C 747.5,476.167 747.5,475.833 747.5,475.5C 754.508,475.334 761.508,475.5 768.5,476C 774.887,476.576 780.887,477.742 786.5,479.5C 783.5,479.5 780.5,479.5 777.5,479.5C 771.699,478.318 765.699,477.652 759.5,477.5C 758.167,477.5 756.833,477.5 755.5,477.5C 753.052,476.527 750.385,476.194 747.5,476.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#5555dc"
                  d="M 1363.5,460.5 C 1363.5,460.167 1363.5,459.833 1363.5,459.5C 1366.83,459.5 1370.17,459.5 1373.5,459.5C 1375.53,459.338 1377.53,459.505 1379.5,460C 1377.86,461.935 1376.03,462.435 1374,461.5C 1364.86,464.286 1355.69,466.786 1346.5,469C 1311.66,474.353 1276.66,478.686 1241.5,482C 1239.83,482.985 1238.16,483.819 1236.5,484.5C 1225.14,484.414 1213.81,484.914 1202.5,486C 1174.6,490.175 1146.6,493.842 1118.5,497C 1112.65,497.818 1106.98,497.652 1101.5,496.5C 1127.57,493.209 1153.9,490.376 1180.5,488C 1185.29,486.147 1190.29,484.981 1195.5,484.5C 1196.09,484.709 1196.59,485.043 1197,485.5C 1198.96,484.048 1200.96,483.715 1203,484.5C 1213.33,482.32 1223.83,481.154 1234.5,481C 1240.19,479.278 1246.03,478.111 1252,477.5C 1270.07,476.31 1288.23,474.476 1306.5,472C 1308.56,471.347 1310.23,470.18 1311.5,468.5C 1313.22,468.211 1315.05,468.544 1317,469.5C 1324.79,468.309 1332.63,467.476 1340.5,467C 1346.12,466.2 1351.62,465.033 1357,463.5C 1358,463.833 1359,464.167 1360,464.5C 1361.11,462.2 1362.61,461.867 1364.5,463.5C 1366.69,462.257 1369.02,461.424 1371.5,461C 1368.85,460.503 1366.19,460.336 1363.5,460.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#5353c8"
                  d="M 1373.5,459.5 C 1373.5,459.167 1373.5,458.833 1373.5,458.5C 1375.5,458.5 1377.5,458.5 1379.5,458.5C 1382.85,458.335 1386.18,458.502 1389.5,459C 1388.75,459.671 1388.41,460.504 1388.5,461.5C 1382.13,460.56 1376.3,462.227 1371,466.5C 1366.03,467.754 1361.2,469.254 1356.5,471C 1344.37,471.698 1332.37,473.365 1320.5,476C 1304.74,476.349 1289.07,477.683 1273.5,480C 1261.37,482.925 1249.04,484.425 1236.5,484.5C 1238.16,483.819 1239.83,482.985 1241.5,482C 1276.66,478.686 1311.66,474.353 1346.5,469C 1355.69,466.786 1364.86,464.286 1374,461.5C 1376.03,462.435 1377.86,461.935 1379.5,460C 1377.53,459.505 1375.53,459.338 1373.5,459.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#454568"
                  d="M 1427.5,453.5 C 1429.86,453.337 1432.19,453.503 1434.5,454C 1431.39,454.552 1429.05,456.219 1427.5,459C 1425.05,459.29 1422.71,459.956 1420.5,461C 1416.97,464.033 1413.97,467.533 1411.5,471.5C 1407.63,474.198 1403.63,476.698 1399.5,479C 1401.5,479.333 1403.5,479.667 1405.5,480C 1402.36,480.601 1399.36,481.601 1396.5,483C 1395.29,484.107 1395.62,484.607 1397.5,484.5C 1391.6,485.365 1385.6,486.365 1379.5,487.5C 1374.51,488.222 1369.51,488.388 1364.5,488C 1371.12,486.737 1377.45,485.403 1383.5,484C 1381.53,483.505 1379.53,483.338 1377.5,483.5C 1380.37,482.675 1383.37,481.841 1386.5,481C 1390.19,477.825 1394.19,475.158 1398.5,473C 1397.83,472.667 1397.17,472.333 1396.5,472C 1403.29,467.164 1409.13,461.997 1414,456.5C 1418.4,457.467 1422.9,457.8 1427.5,457.5C 1427.5,456.167 1427.5,454.833 1427.5,453.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3a3a3b"
                  d="M 1493.5,481.5 C 1519.4,483.914 1545.4,486.747 1571.5,490C 1574.43,490.606 1577.26,491.44 1580,492.5C 1580.5,494.81 1580.66,497.143 1580.5,499.5C 1580.17,499.5 1579.83,499.5 1579.5,499.5C 1579.5,498.167 1579.5,496.833 1579.5,495.5C 1551.16,499.5 1522.83,503.5 1494.5,507.5C 1493.17,507.5 1491.83,507.5 1490.5,507.5C 1490.82,503.298 1490.48,499.298 1489.5,495.5C 1488.52,494.185 1487.52,492.852 1486.5,491.5C 1489.55,490.125 1490.88,487.792 1490.5,484.5C 1486.13,484.467 1481.8,484.8 1477.5,485.5C 1462.74,485.78 1448.07,487.114 1433.5,489.5C 1427.54,488.759 1427.21,487.259 1432.5,485C 1429.36,485.095 1426.36,484.928 1423.5,484.5C 1428.17,483.167 1432.83,481.833 1437.5,480.5C 1447.32,479.68 1456.99,479.014 1466.5,478.5C 1474.07,478.993 1481.57,479.659 1489,480.5C 1489.33,480.167 1489.67,479.833 1490,479.5C 1491.11,480.305 1492.28,480.972 1493.5,481.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#7e7c89"
                  d="M 818.5,482.5 C 830.52,482.477 842.52,482.977 854.5,484C 856.044,484.29 857.377,484.956 858.5,486C 880.524,487.649 902.524,489.483 924.5,491.5C 924.5,492.5 924.5,493.5 924.5,494.5C 919.595,493.555 914.595,493.221 909.5,493.5C 907.833,492.167 906.167,492.167 904.5,493.5C 898.62,491.853 892.62,490.853 886.5,490.5C 884.435,490.483 882.435,490.15 880.5,489.5C 859.573,488.132 838.907,485.799 818.5,482.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3736d3"
                  d="M 777.5,479.5 C 780.5,479.5 783.5,479.5 786.5,479.5C 797.061,481.38 807.728,482.38 818.5,482.5C 838.907,485.799 859.573,488.132 880.5,489.5C 882.545,490.923 883.545,492.923 883.5,495.5C 882.833,496.5 882.167,497.5 881.5,498.5C 880.596,497.791 880.263,496.791 880.5,495.5C 852.709,493.321 825.042,490.488 797.5,487C 791.434,484.601 785.101,482.935 778.5,482C 777.001,481.162 776.668,480.329 777.5,479.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#020109"
                  d="M 1489.5,495.5 C 1489.5,496.5 1489.5,497.5 1489.5,498.5C 1470.23,501.513 1450.9,504.346 1431.5,507C 1422.9,507.946 1414.4,507.446 1406,505.5C 1404.83,505.833 1403.67,506.167 1402.5,506.5C 1404.08,507.298 1405.74,507.798 1407.5,508C 1405.94,508.318 1404.77,509.151 1404,510.5C 1403.67,510.167 1403.33,509.833 1403,509.5C 1396.4,510.15 1389.9,510.816 1383.5,511.5C 1383.17,511.5 1382.83,511.5 1382.5,511.5C 1351.64,513.645 1320.97,517.311 1290.5,522.5C 1282.81,522.906 1275.14,523.572 1267.5,524.5C 1264.5,524.5 1261.5,524.5 1258.5,524.5C 1256.95,524.821 1256.29,525.821 1256.5,527.5C 1244.8,528.254 1233.13,529.421 1221.5,531C 1198.35,534.909 1175.02,538.242 1151.5,541C 1140.72,542.989 1130.05,544.822 1119.5,546.5C 1097.5,549.056 1075.5,551.723 1053.5,554.5C 1053.03,560.491 1052.7,566.491 1052.5,572.5C 1047.19,573.098 1041.85,573.431 1036.5,573.5C 1038.41,568.289 1039.08,562.955 1038.5,557.5C 1037.28,556.904 1035.95,556.737 1034.5,557C 1035.37,555.955 1036.37,555.122 1037.5,554.5C 1037.56,555.043 1037.89,555.376 1038.5,555.5C 1041.08,553.08 1042.08,550.08 1041.5,546.5C 1042.43,545.432 1042.77,544.099 1042.5,542.5C 1045.91,541.097 1049.58,540.43 1053.5,540.5C 1053.5,541.5 1053.5,542.5 1053.5,543.5C 1054.51,544.765 1056.01,545.431 1058,545.5C 1093.8,540.56 1129.64,535.894 1165.5,531.5C 1169.08,531.451 1172.41,530.785 1175.5,529.5C 1200.05,526.639 1224.38,523.305 1248.5,519.5C 1281.6,515.904 1314.6,511.571 1347.5,506.5C 1351.2,505.882 1354.87,505.049 1358.5,504C 1356.62,503.802 1354.95,503.302 1353.5,502.5C 1361.14,501.673 1368.81,501.007 1376.5,500.5C 1380.08,500.518 1383.58,500.852 1387,501.5C 1390,500.973 1392.5,499.64 1394.5,497.5C 1407.61,494.344 1420.94,492.511 1434.5,492C 1449.01,490.065 1463.34,487.898 1477.5,485.5C 1481.8,484.8 1486.13,484.467 1490.5,484.5C 1490.88,487.792 1489.55,490.125 1486.5,491.5C 1487.52,492.852 1488.52,494.185 1489.5,495.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4f4fa7"
                  d="M 1379.5,458.5 C 1382.62,457.521 1385.96,457.187 1389.5,457.5C 1391.86,457.337 1394.19,457.503 1396.5,458C 1395.83,459 1395.17,460 1394.5,461C 1387.9,464.969 1380.56,468.635 1372.5,472C 1352.53,475.724 1332.36,479.224 1312,482.5C 1311.67,482.167 1311.33,481.833 1311,481.5C 1294.13,485.672 1276.96,488.172 1259.5,489C 1256.56,490.152 1253.56,491.152 1250.5,492C 1229.5,493.878 1208.5,496.211 1187.5,499C 1185.42,499.778 1183.58,500.945 1182,502.5C 1179.91,501.754 1177.91,501.421 1176,501.5C 1173.67,502.167 1171.33,502.833 1169,503.5C 1162.68,503.783 1156.01,503.783 1149,503.5C 1141.49,504.669 1133.99,506.002 1126.5,507.5C 1124.55,506.149 1122.38,505.482 1120,505.5C 1113.26,506.944 1106.6,507.944 1100,508.5C 1094.52,507.847 1089.02,507.347 1083.5,507C 1081.12,506.777 1079.45,505.61 1078.5,503.5C 1095.34,504.653 1111.51,504.653 1127,503.5C 1130.09,502.333 1133.09,502 1136,502.5C 1147.81,501.543 1159.48,499.876 1171,497.5C 1171.72,498.059 1172.56,498.392 1173.5,498.5C 1194.13,496.051 1214.63,493.051 1235,489.5C 1235.56,490.022 1236.23,490.355 1237,490.5C 1275.99,485.473 1314.82,479.64 1353.5,473C 1361.92,470.958 1370.25,468.625 1378.5,466C 1382.23,465.089 1385.56,463.589 1388.5,461.5C 1388.41,460.504 1388.75,459.671 1389.5,459C 1386.18,458.502 1382.85,458.335 1379.5,458.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#6a6971"
                  d="M 1144.5,484.5 C 1128.91,486.074 1113.25,488.074 1097.5,490.5C 1096.5,490.5 1095.5,490.5 1094.5,490.5C 1091.94,490.198 1089.61,490.532 1087.5,491.5C 1083.39,491.74 1079.39,492.407 1075.5,493.5C 1074.5,493.5 1073.5,493.5 1072.5,493.5C 1068.82,493.06 1065.49,493.727 1062.5,495.5C 1062.5,494.167 1062.5,492.833 1062.5,491.5C 1089.82,488.619 1117.15,486.286 1144.5,484.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#353553"
                  d="M 1404.5,483.5 C 1404.61,484.117 1404.94,484.617 1405.5,485C 1398.52,485.908 1398.18,486.908 1404.5,488C 1400.83,489.104 1397.5,490.771 1394.5,493C 1395.31,493.308 1395.97,493.808 1396.5,494.5C 1395.39,495.265 1394.72,496.265 1394.5,497.5C 1388.16,494.899 1381.83,494.899 1375.5,497.5C 1373.5,497.167 1371.5,496.833 1369.5,496.5C 1364.92,497.986 1360.25,498.486 1355.5,498C 1361.64,496.246 1367.64,494.246 1373.5,492C 1376.17,491.333 1376.17,490.667 1373.5,490C 1375.61,489.155 1377.61,488.322 1379.5,487.5C 1385.6,486.365 1391.6,485.365 1397.5,484.5C 1399.86,484.326 1402.19,483.993 1404.5,483.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1d1d3a"
                  d="M 713.5,472.5 C 714.167,472.5 714.833,472.5 715.5,472.5C 715.421,473.93 715.754,475.264 716.5,476.5C 720.312,478.085 723.812,478.418 727,477.5C 731.001,481.005 734.501,485.005 737.5,489.5C 742.225,490.362 746.225,492.528 749.5,496C 747.244,495.385 744.911,495.052 742.5,495C 747.132,499.311 752.466,502.311 758.5,504C 759.701,504.903 760.535,506.069 761,507.5C 761.561,506.978 762.228,506.645 763,506.5C 770.105,509.31 777.272,511.643 784.5,513.5C 780.904,513.847 777.571,513.18 774.5,511.5C 770.129,513.026 766.129,512.359 762.5,509.5C 761.833,509.833 761.167,510.167 760.5,510.5C 756.804,508.268 752.804,507.268 748.5,507.5C 745.465,506.626 742.465,505.626 739.5,504.5C 734.94,499.875 729.94,495.709 724.5,492C 721.387,486.887 717.554,482.387 713,478.5C 712.217,476.567 712.717,475.067 714.5,474C 713.944,473.617 713.611,473.117 713.5,472.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4d4b9f"
                  d="M 1087.5,491.5 C 1089.61,490.532 1091.94,490.198 1094.5,490.5C 1094.5,491.167 1094.5,491.833 1094.5,492.5C 1092.28,491.631 1089.95,491.298 1087.5,491.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#5353cf"
                  d="M 1236.5,484.5 C 1233.68,485.507 1230.68,486.34 1227.5,487C 1184.15,491.217 1140.98,496.05 1098,501.5C 1091.28,500.57 1084.78,500.57 1078.5,501.5C 1077.5,501.5 1076.5,501.5 1075.5,501.5C 1075.5,498.833 1075.5,496.167 1075.5,493.5C 1079.39,492.407 1083.39,491.74 1087.5,491.5C 1089.95,491.298 1092.28,491.631 1094.5,492.5C 1094.03,495.082 1094.69,497.082 1096.5,498.5C 1097.87,498.657 1099.21,498.49 1100.5,498C 1099.29,496.893 1099.62,496.393 1101.5,496.5C 1106.98,497.652 1112.65,497.818 1118.5,497C 1146.6,493.842 1174.6,490.175 1202.5,486C 1213.81,484.914 1225.14,484.414 1236.5,484.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2d2d39"
                  d="M 1423.5,484.5 C 1426.36,484.928 1429.36,485.095 1432.5,485C 1427.21,487.259 1427.54,488.759 1433.5,489.5C 1448.07,487.114 1462.74,485.78 1477.5,485.5C 1463.34,487.898 1449.01,490.065 1434.5,492C 1420.94,492.511 1407.61,494.344 1394.5,497.5C 1394.72,496.265 1395.39,495.265 1396.5,494.5C 1395.97,493.808 1395.31,493.308 1394.5,493C 1397.5,490.771 1400.83,489.104 1404.5,488C 1398.18,486.908 1398.52,485.908 1405.5,485C 1404.94,484.617 1404.61,484.117 1404.5,483.5C 1408.54,483.156 1412.54,482.49 1416.5,481.5C 1417.5,481.667 1418.5,481.833 1419.5,482C 1417.5,482.667 1415.5,483.333 1413.5,484C 1416.87,485.295 1420.21,485.461 1423.5,484.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#15151a"
                  d="M 717.5,499.5 C 722.015,503.301 727.015,506.467 732.5,509C 729.247,510.036 725.914,510.703 722.5,511C 726.828,513.63 731.828,515.63 737.5,517C 735.618,517.198 733.952,517.698 732.5,518.5C 716.279,516.422 700.279,513.256 684.5,509C 669.583,506.694 654.583,505.528 639.5,505.5C 639.5,506.5 639.5,507.5 639.5,508.5C 637.706,506.572 636.706,504.238 636.5,501.5C 636.335,498.15 636.502,494.817 637,491.5C 637.414,491.957 637.914,492.291 638.5,492.5C 647.426,491.554 656.259,490.221 665,488.5C 667.333,489.167 669.667,489.833 672,490.5C 674.141,489.232 676.474,488.565 679,488.5C 685.48,490.594 692.313,492.761 699.5,495C 700.833,496 702.167,497 703.5,498C 708.215,498.281 712.882,498.781 717.5,499.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3030ad"
                  d="M 759.5,477.5 C 765.699,477.652 771.699,478.318 777.5,479.5C 776.668,480.329 777.001,481.162 778.5,482C 785.101,482.935 791.434,484.601 797.5,487C 825.042,490.488 852.709,493.321 880.5,495.5C 880.263,496.791 880.596,497.791 881.5,498.5C 881.217,499.289 880.717,499.956 880,500.5C 867.917,499.024 855.75,497.858 843.5,497C 822.783,493.561 802.116,490.228 781.5,487C 779.226,486.53 777.226,485.53 775.5,484C 771.584,483.542 767.75,482.708 764,481.5C 762.025,480.535 760.525,479.201 759.5,477.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1d1d3e"
                  d="M 1094.5,490.5 C 1095.5,490.5 1096.5,490.5 1097.5,490.5C 1096.61,493.054 1096.28,495.721 1096.5,498.5C 1094.69,497.082 1094.03,495.082 1094.5,492.5C 1094.5,491.833 1094.5,491.167 1094.5,490.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#34345d"
                  d="M 1377.5,483.5 C 1379.53,483.338 1381.53,483.505 1383.5,484C 1377.45,485.403 1371.12,486.737 1364.5,488C 1369.51,488.388 1374.51,488.222 1379.5,487.5C 1377.61,488.322 1375.61,489.155 1373.5,490C 1376.17,490.667 1376.17,491.333 1373.5,492C 1367.64,494.246 1361.64,496.246 1355.5,498C 1360.25,498.486 1364.92,497.986 1369.5,496.5C 1371.5,496.833 1373.5,497.167 1375.5,497.5C 1381.83,494.899 1388.16,494.899 1394.5,497.5C 1392.5,499.64 1390,500.973 1387,501.5C 1383.58,500.852 1380.08,500.518 1376.5,500.5C 1368.81,501.007 1361.14,501.673 1353.5,502.5C 1346.49,502.334 1339.49,502.5 1332.5,503C 1314.81,505.504 1297.14,508.004 1279.5,510.5C 1275.48,510.816 1271.48,510.983 1267.5,511C 1270.43,510.394 1273.26,509.56 1276,508.5C 1276.41,508.957 1276.91,509.291 1277.5,509.5C 1281.93,508.45 1286.26,507.116 1290.5,505.5C 1298.16,507.199 1304.83,505.866 1310.5,501.5C 1313.77,501.89 1317.1,501.39 1320.5,500C 1316.47,500.507 1312.47,500.34 1308.5,499.5C 1316.18,498.838 1323.85,497.338 1331.5,495C 1330.5,494.667 1329.5,494.333 1328.5,494C 1344.87,490.495 1361.21,486.995 1377.5,483.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#252565"
                  d="M 738.5,475.5 C 740.833,475.5 743.167,475.5 745.5,475.5C 746.167,475.5 746.833,475.5 747.5,475.5C 747.5,475.833 747.5,476.167 747.5,476.5C 746.127,476.343 744.793,476.51 743.5,477C 753.686,483.519 764.686,488.519 776.5,492C 800.831,498.612 825.331,502.779 850,504.5C 850.333,505.167 850.667,505.833 851,506.5C 851.368,505.09 852.201,504.09 853.5,503.5C 855.422,505.003 856.588,507.003 857,509.5C 857.414,509.043 857.914,508.709 858.5,508.5C 865.387,510.031 872.387,510.698 879.5,510.5C 885.896,510.576 892.23,510.076 898.5,509C 900.889,505.241 904.222,502.741 908.5,501.5C 909.213,499.224 909.713,496.891 910,494.5C 910.5,495.667 911.333,496.5 912.5,497C 914.433,497.251 916.266,497.751 918,498.5C 918.333,498.167 918.667,497.833 919,497.5C 919.667,498.833 920.667,499.833 922,500.5C 923.049,498.893 924.549,498.227 926.5,498.5C 926.5,499.167 926.5,499.833 926.5,500.5C 925.596,501.209 925.263,502.209 925.5,503.5C 921.594,504.77 917.594,505.936 913.5,507C 913.167,507.333 912.833,507.667 912.5,508C 913.851,509.617 915.518,510.784 917.5,511.5C 916.643,512.425 915.643,513.092 914.5,513.5C 913.768,512.192 912.934,510.858 912,509.5C 911.259,510.641 910.425,510.641 909.5,509.5C 906.244,512.103 902.744,513.103 899,512.5C 885.194,515.163 871.694,514.829 858.5,511.5C 855.123,512.307 851.623,512.641 848,512.5C 831.51,510.257 815.01,507.757 798.5,505C 787.52,502.11 776.52,499.11 765.5,496C 759.33,492.081 752.997,488.414 746.5,485C 743.917,482.245 741.251,479.745 738.5,477.5C 738.5,476.833 738.5,476.167 738.5,475.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1a1a2e"
                  d="M 880.5,489.5 C 882.435,490.15 884.435,490.483 886.5,490.5C 886.5,491.167 886.167,491.5 885.5,491.5C 884.686,493.631 884.186,495.964 884,498.5C 883.517,497.552 883.351,496.552 883.5,495.5C 883.545,492.923 882.545,490.923 880.5,489.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#414175"
                  d="M 1422.5,453.5 C 1424.17,453.5 1425.83,453.5 1427.5,453.5C 1427.5,454.833 1427.5,456.167 1427.5,457.5C 1422.9,457.8 1418.4,457.467 1414,456.5C 1409.13,461.997 1403.29,467.164 1396.5,472C 1397.17,472.333 1397.83,472.667 1398.5,473C 1394.19,475.158 1390.19,477.825 1386.5,481C 1383.37,481.841 1380.37,482.675 1377.5,483.5C 1361.21,486.995 1344.87,490.495 1328.5,494C 1329.5,494.333 1330.5,494.667 1331.5,495C 1323.85,497.338 1316.18,498.838 1308.5,499.5C 1307.18,499.67 1306.01,499.337 1305,498.5C 1302.73,498.982 1300.56,500.148 1298.5,502C 1281.55,504.41 1264.55,506.41 1247.5,508C 1246.12,509.625 1244.45,510.792 1242.5,511.5C 1241.83,511.167 1241.17,510.833 1240.5,510.5C 1242.91,508.429 1245.57,506.762 1248.5,505.5C 1249.09,505.709 1249.59,506.043 1250,506.5C 1265.15,504.336 1280.31,502.17 1295.5,500C 1297.6,499.444 1297.76,498.944 1296,498.5C 1285.87,498.186 1275.87,499.519 1266,502.5C 1264.89,502.415 1263.89,502.081 1263,501.5C 1257.64,502.99 1252.14,503.823 1246.5,504C 1244.91,504.862 1243.25,505.529 1241.5,506C 1230.75,505.688 1220.08,507.021 1209.5,510C 1207.92,510.707 1206.42,511.54 1205,512.5C 1202.93,512.837 1200.93,512.171 1199,510.5C 1195.92,512.489 1192.75,512.823 1189.5,511.5C 1180.91,512.54 1172.41,513.873 1164,515.5C 1163.59,515.043 1163.09,514.709 1162.5,514.5C 1160.17,515.833 1157.83,517.167 1155.5,518.5C 1148.38,518.136 1141.55,518.136 1135,518.5C 1132.87,520.065 1130.71,520.399 1128.5,519.5C 1115.78,521.837 1103.11,523.837 1090.5,525.5C 1089.83,525.5 1089.17,525.5 1088.5,525.5C 1088.61,524.883 1088.94,524.383 1089.5,524C 1084.61,522.509 1079.44,522.343 1074,523.5C 1073.25,522.874 1072.42,522.374 1071.5,522C 1073.5,521.667 1075.5,521.333 1077.5,521C 1072.99,520.737 1068.66,519.737 1064.5,518C 1064.83,517.667 1065.17,517.333 1065.5,517C 1064.69,515.887 1064.03,514.721 1063.5,513.5C 1067.77,513.063 1071.77,513.897 1075.5,516C 1082.48,517.582 1089.48,517.749 1096.5,516.5C 1101.17,516.963 1105.84,517.463 1110.5,518C 1109.5,518.333 1108.5,518.667 1107.5,519C 1109.2,519.958 1111.03,520.458 1113,520.5C 1118.62,519.142 1124.29,518.142 1130,517.5C 1130.33,517.833 1130.67,518.167 1131,518.5C 1134.44,515.832 1137.94,515.499 1141.5,517.5C 1146.08,515.51 1150.74,515.176 1155.5,516.5C 1158.34,514.367 1161.5,513.034 1165,512.5C 1169,512.5 1173,512.5 1177,512.5C 1184.35,511.268 1191.68,509.934 1199,508.5C 1200.47,508.903 1201.81,509.57 1203,510.5C 1215.79,506.358 1228.96,504.191 1242.5,504C 1252.61,501.078 1262.94,499.411 1273.5,499C 1292.1,494.912 1310.94,491.745 1330,489.5C 1330.77,489.645 1331.44,489.978 1332,490.5C 1348.86,486.55 1365.69,482.384 1382.5,478C 1380.83,477.667 1379.17,477.333 1377.5,477C 1387.04,473.29 1395.71,468.124 1403.5,461.5C 1406.77,458.039 1406.11,456.373 1401.5,456.5C 1408.41,455.755 1415.41,454.755 1422.5,453.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3433c2"
                  d="M 886.5,490.5 C 892.62,490.853 898.62,491.853 904.5,493.5C 904.5,493.833 904.5,494.167 904.5,494.5C 904.795,496.735 904.461,498.735 903.5,500.5C 903.628,498.345 903.128,496.345 902,494.5C 898.587,497.518 894.587,499.185 890,499.5C 889.047,497.408 887.714,497.075 886,498.5C 885.503,496.19 885.337,493.857 885.5,491.5C 886.167,491.5 886.5,491.167 886.5,490.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#191823"
                  d="M 909.5,493.5 C 907.92,495.717 906.92,498.384 906.5,501.5C 905.832,499.031 905.165,496.698 904.5,494.5C 904.5,494.167 904.5,493.833 904.5,493.5C 906.167,492.167 907.833,492.167 909.5,493.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#201f22"
                  d="M 1045.5,496.5 C 1048.17,496.5 1050.83,496.5 1053.5,496.5C 1053.5,511.167 1053.5,525.833 1053.5,540.5C 1049.58,540.43 1045.91,541.097 1042.5,542.5C 1040.07,540.957 1037.41,539.957 1034.5,539.5C 1034.5,536.167 1034.5,532.833 1034.5,529.5C 1035.59,518.862 1036.25,508.195 1036.5,497.5C 1036.83,497.5 1037.17,497.5 1037.5,497.5C 1037.33,504.175 1037.5,510.842 1038,517.5C 1039.54,519.477 1040.04,521.477 1039.5,523.5C 1038.52,523.023 1037.69,522.357 1037,521.5C 1036.83,522.167 1036.67,522.833 1036.5,523.5C 1039.09,527.669 1041.42,532.002 1043.5,536.5C 1045.08,531.656 1045.91,526.656 1046,521.5C 1046.8,513.088 1046.63,504.755 1045.5,496.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#040406"
                  d="M 1579.5,499.5 C 1560.96,502.765 1542.63,506.098 1524.5,509.5C 1438.5,521.945 1352.5,534.611 1266.5,547.5C 1266.5,548.5 1266.5,549.5 1266.5,550.5C 1261.29,550.608 1256.29,551.275 1251.5,552.5C 1248.73,551.233 1246.06,551.233 1243.5,552.5C 1230.43,553.296 1217.43,554.796 1204.5,557C 1189.9,559.445 1175.23,561.945 1160.5,564.5C 1146.15,566.085 1131.82,567.919 1117.5,570C 1116.26,570.232 1115.26,570.732 1114.5,571.5C 1108.92,571.255 1103.58,571.922 1098.5,573.5C 1072.41,576.575 1046.41,579.242 1020.5,581.5C 1003.17,581.5 985.833,581.5 968.5,581.5C 953.446,581.05 938.446,579.883 923.5,578C 806.205,561.449 688.872,545.115 571.5,529C 561.333,527.917 551.333,526.084 541.5,523.5C 541.5,521.833 541.5,520.167 541.5,518.5C 548.317,520.638 555.317,522.138 562.5,523C 587.483,526.403 612.483,529.569 637.5,532.5C 637.831,528.086 638.665,523.752 640,519.5C 640.973,517.36 642.473,515.693 644.5,514.5C 642.062,513.069 640.396,511.069 639.5,508.5C 639.5,507.5 639.5,506.5 639.5,505.5C 654.583,505.528 669.583,506.694 684.5,509C 700.279,513.256 716.279,516.422 732.5,518.5C 751.277,520.978 769.944,523.645 788.5,526.5C 791.791,528.6 795.458,529.933 799.5,530.5C 841.006,535.722 882.506,541.056 924,546.5C 925.376,546.316 926.209,545.649 926.5,544.5C 926.5,543.5 926.5,542.5 926.5,541.5C 930.269,541.244 933.936,541.577 937.5,542.5C 939.048,542.821 939.715,543.821 939.5,545.5C 938.223,546.694 937.556,548.36 937.5,550.5C 937.836,553.841 938.169,557.175 938.5,560.5C 936.633,560.955 934.8,561.622 933,562.5C 931.061,562.046 929.228,561.379 927.5,560.5C 927.117,558.592 926.117,557.092 924.5,556C 883.847,550.502 843.181,545.168 802.5,540C 787.329,539.633 772.162,539.133 757,538.5C 752.147,538.281 747.481,538.948 743,540.5C 742.667,539.833 742.333,539.167 742,538.5C 740.667,540.167 739.333,541.833 738,543.5C 737.086,542.346 736.253,542.513 735.5,544C 738.926,545.653 742.593,546.487 746.5,546.5C 749.974,547.525 753.64,548.192 757.5,548.5C 767.478,549.997 777.478,551.331 787.5,552.5C 803.365,554.826 819.365,557.159 835.5,559.5C 855.808,562.353 876.141,565.02 896.5,567.5C 901.29,568.725 906.29,569.392 911.5,569.5C 916.32,570.487 921.32,571.153 926.5,571.5C 931.787,572.342 937.12,572.676 942.5,572.5C 942.351,571.448 942.517,570.448 943,569.5C 946.627,567.256 949.794,564.422 952.5,561C 950.563,558.929 948.896,556.762 947.5,554.5C 946.659,552.621 946.325,550.621 946.5,548.5C 947.5,548.5 948.5,548.5 949.5,548.5C 951.265,549.461 953.265,549.795 955.5,549.5C 978.167,549.5 1000.83,549.5 1023.5,549.5C 1025.83,549.5 1028.17,549.5 1030.5,549.5C 1031.5,549.5 1032.5,549.5 1033.5,549.5C 1035.17,548.167 1036.83,548.167 1038.5,549.5C 1038.63,551.292 1038.3,552.958 1037.5,554.5C 1036.37,555.122 1035.37,555.955 1034.5,557C 1035.95,556.737 1037.28,556.904 1038.5,557.5C 1039.08,562.955 1038.41,568.289 1036.5,573.5C 1041.85,573.431 1047.19,573.098 1052.5,572.5C 1052.83,572.5 1053.17,572.5 1053.5,572.5C 1058.05,572.376 1062.38,571.709 1066.5,570.5C 1077.68,569.189 1088.68,567.522 1099.5,565.5C 1118.83,562.738 1138.16,560.072 1157.5,557.5C 1170.36,555.95 1183.03,553.95 1195.5,551.5C 1239.81,545.095 1284.15,538.761 1328.5,532.5C 1338.83,530.739 1349.16,529.072 1359.5,527.5C 1366.05,527.019 1372.38,526.019 1378.5,524.5C 1385.3,524.144 1391.97,523.144 1398.5,521.5C 1430.7,517.281 1462.7,512.614 1494.5,507.5C 1522.83,503.5 1551.16,499.5 1579.5,495.5C 1579.5,496.833 1579.5,498.167 1579.5,499.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#110306"
                  d="M 946.5,497.5 C 975.499,498.808 1004.5,498.808 1033.5,497.5C 1032.53,511.536 1031.2,525.536 1029.5,539.5C 1029.38,541.199 1029.05,542.865 1028.5,544.5C 1029.55,546.056 1030.21,547.723 1030.5,549.5C 1028.17,549.5 1025.83,549.5 1023.5,549.5C 1024.53,548.751 1025.7,548.085 1027,547.5C 1027.52,545.061 1027.02,544.895 1025.5,547C 1021.32,547.427 1017.16,547.927 1013,548.5C 1010.35,548.379 1007.85,547.712 1005.5,546.5C 1009.11,544.723 1011.44,541.89 1012.5,538C 1011.42,533.753 1009.75,529.753 1007.5,526C 991.625,515.806 975.291,514.973 958.5,523.5C 957.884,526.11 957.551,528.777 957.5,531.5C 957.75,536.572 958.416,541.572 959.5,546.5C 958.5,546.5 957.5,546.5 956.5,546.5C 954.829,536.827 952.162,527.494 948.5,518.5C 948.167,518.5 947.833,518.5 947.5,518.5C 946.911,511.515 946.578,504.515 946.5,497.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1e1e35"
                  d="M 1072.5,493.5 C 1073.5,493.5 1074.5,493.5 1075.5,493.5C 1075.5,496.167 1075.5,498.833 1075.5,501.5C 1074.5,501.5 1073.5,501.5 1072.5,501.5C 1072.5,498.833 1072.5,496.167 1072.5,493.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#212156"
                  d="M 738.5,477.5 C 741.251,479.745 743.917,482.245 746.5,485C 752.997,488.414 759.33,492.081 765.5,496C 776.52,499.11 787.52,502.11 798.5,505C 815.01,507.757 831.51,510.257 848,512.5C 851.623,512.641 855.123,512.307 858.5,511.5C 871.694,514.829 885.194,515.163 899,512.5C 902.744,513.103 906.244,512.103 909.5,509.5C 910.425,510.641 911.259,510.641 912,509.5C 912.934,510.858 913.768,512.192 914.5,513.5C 914.631,514.239 914.464,514.906 914,515.5C 910.632,514.17 907.465,514.67 904.5,517C 897.451,517.823 890.617,518.657 884,519.5C 867.867,517.884 851.701,516.384 835.5,515C 833.324,514.837 831.491,514.004 830,512.5C 829.667,512.833 829.333,513.167 829,513.5C 826.667,512.833 824.333,512.167 822,511.5C 806.471,509.461 790.637,506.294 774.5,502C 764.727,497.28 755.06,492.28 745.5,487C 742.538,484.218 740.205,481.051 738.5,477.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#474784"
                  d="M 1400.5,456.5 C 1400.83,456.5 1401.17,456.5 1401.5,456.5C 1406.11,456.373 1406.77,458.039 1403.5,461.5C 1395.71,468.124 1387.04,473.29 1377.5,477C 1379.17,477.333 1380.83,477.667 1382.5,478C 1365.69,482.384 1348.86,486.55 1332,490.5C 1331.44,489.978 1330.77,489.645 1330,489.5C 1310.94,491.745 1292.1,494.912 1273.5,499C 1262.94,499.411 1252.61,501.078 1242.5,504C 1228.96,504.191 1215.79,506.358 1203,510.5C 1201.81,509.57 1200.47,508.903 1199,508.5C 1191.68,509.934 1184.35,511.268 1177,512.5C 1173,512.5 1169,512.5 1165,512.5C 1161.5,513.034 1158.34,514.367 1155.5,516.5C 1150.74,515.176 1146.08,515.51 1141.5,517.5C 1137.94,515.499 1134.44,515.832 1131,518.5C 1130.67,518.167 1130.33,517.833 1130,517.5C 1124.29,518.142 1118.62,519.142 1113,520.5C 1111.03,520.458 1109.2,519.958 1107.5,519C 1108.5,518.667 1109.5,518.333 1110.5,518C 1105.84,517.463 1101.17,516.963 1096.5,516.5C 1089.48,517.749 1082.48,517.582 1075.5,516C 1071.77,513.897 1067.77,513.063 1063.5,513.5C 1063.5,513.167 1063.5,512.833 1063.5,512.5C 1065.7,512.154 1065.87,511.487 1064,510.5C 1062.97,510.836 1062.47,511.503 1062.5,512.5C 1059.38,511.085 1056.71,509.085 1054.5,506.5C 1054.5,504.167 1054.5,501.833 1054.5,499.5C 1056.14,499.286 1057.64,499.62 1059,500.5C 1061.84,498.496 1065.01,497.996 1068.5,499C 1072.29,502.247 1075.62,505.914 1078.5,510C 1080.35,510.837 1082.18,511.671 1084,512.5C 1088.99,511.571 1093.66,512.571 1098,515.5C 1099.27,515.384 1100.6,515.051 1102,514.5C 1105.13,515.206 1108.3,515.873 1111.5,516.5C 1115.26,516.061 1119.09,515.061 1123,513.5C 1127.02,513.495 1131.02,513.495 1135,513.5C 1158.63,510.649 1182.46,507.482 1206.5,504C 1226.98,502.65 1246.15,499.817 1264,495.5C 1265.27,495.616 1266.6,495.949 1268,496.5C 1290.7,492.411 1313.53,488.578 1336.5,485C 1335.5,484.667 1334.5,484.333 1333.5,484C 1343.02,481.363 1352.69,479.363 1362.5,478C 1374.27,474.45 1385.6,469.784 1396.5,464C 1399.17,462.667 1401.17,460.667 1402.5,458C 1401.58,457.722 1400.92,457.222 1400.5,456.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1d1d48"
                  d="M 715.5,472.5 C 723.17,473.567 730.837,474.567 738.5,475.5C 738.5,476.167 738.5,476.833 738.5,477.5C 740.205,481.051 742.538,484.218 745.5,487C 755.06,492.28 764.727,497.28 774.5,502C 790.637,506.294 806.471,509.461 822,511.5C 824.333,512.167 826.667,512.833 829,513.5C 829.333,513.167 829.667,512.833 830,512.5C 831.491,514.004 833.324,514.837 835.5,515C 851.701,516.384 867.867,517.884 884,519.5C 890.617,518.657 897.451,517.823 904.5,517C 907.465,514.67 910.632,514.17 914,515.5C 914.464,514.906 914.631,514.239 914.5,513.5C 915.643,513.092 916.643,512.425 917.5,511.5C 915.518,510.784 913.851,509.617 912.5,508C 912.833,507.667 913.167,507.333 913.5,507C 917.594,505.936 921.594,504.77 925.5,503.5C 925.263,502.209 925.596,501.209 926.5,500.5C 926.5,505.167 926.5,509.833 926.5,514.5C 926.201,518.35 924.701,521.683 922,524.5C 919.978,524.788 917.811,524.454 915.5,523.5C 912.574,524.698 909.574,525.698 906.5,526.5C 905.558,526.392 904.725,526.059 904,525.5C 901.631,526.551 899.131,527.218 896.5,527.5C 889.059,526.662 881.892,525.662 875,524.5C 874.097,525.701 872.931,526.535 871.5,527C 868.591,526.716 865.758,526.883 863,527.5C 862.147,525.875 861.147,525.542 860,526.5C 858.667,525.833 857.333,525.167 856,524.5C 853.583,525.352 851.083,526.019 848.5,526.5C 842.774,523.982 836.774,522.149 830.5,521C 815.216,518.176 799.882,515.676 784.5,513.5C 777.272,511.643 770.105,509.31 763,506.5C 762.228,506.645 761.561,506.978 761,507.5C 760.535,506.069 759.701,504.903 758.5,504C 752.466,502.311 747.132,499.311 742.5,495C 744.911,495.052 747.244,495.385 749.5,496C 746.225,492.528 742.225,490.362 737.5,489.5C 734.501,485.005 731.001,481.005 727,477.5C 723.812,478.418 720.312,478.085 716.5,476.5C 715.754,475.264 715.421,473.93 715.5,472.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2c2c90"
                  d="M 755.5,477.5 C 756.833,477.5 758.167,477.5 759.5,477.5C 760.525,479.201 762.025,480.535 764,481.5C 767.75,482.708 771.584,483.542 775.5,484C 777.226,485.53 779.226,486.53 781.5,487C 802.116,490.228 822.783,493.561 843.5,497C 855.75,497.858 867.917,499.024 880,500.5C 880.717,499.956 881.217,499.289 881.5,498.5C 882.167,497.5 882.833,496.5 883.5,495.5C 883.351,496.552 883.517,497.552 884,498.5C 884.186,495.964 884.686,493.631 885.5,491.5C 885.337,493.857 885.503,496.19 886,498.5C 887.714,497.075 889.047,497.408 890,499.5C 894.587,499.185 898.587,497.518 902,494.5C 903.128,496.345 903.628,498.345 903.5,500.5C 902.732,499.737 902.232,498.737 902,497.5C 899.634,499.212 897.301,500.878 895,502.5C 885.945,503.112 876.945,503.778 868,504.5C 863.559,503.432 859.059,502.432 854.5,501.5C 842.468,502.38 830.634,501.047 819,497.5C 818.667,497.833 818.333,498.167 818,498.5C 804.986,496.679 792.152,493.846 779.5,490C 777.844,488.171 775.844,486.837 773.5,486C 766.652,484.571 760.652,481.738 755.5,477.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#5151b9"
                  d="M 1388.5,461.5 C 1385.56,463.589 1382.23,465.089 1378.5,466C 1370.25,468.625 1361.92,470.958 1353.5,473C 1314.82,479.64 1275.99,485.473 1237,490.5C 1236.23,490.355 1235.56,490.022 1235,489.5C 1214.63,493.051 1194.13,496.051 1173.5,498.5C 1172.56,498.392 1171.72,498.059 1171,497.5C 1159.48,499.876 1147.81,501.543 1136,502.5C 1133.09,502 1130.09,502.333 1127,503.5C 1111.51,504.653 1095.34,504.653 1078.5,503.5C 1078.5,502.833 1078.5,502.167 1078.5,501.5C 1084.78,500.57 1091.28,500.57 1098,501.5C 1140.98,496.05 1184.15,491.217 1227.5,487C 1230.68,486.34 1233.68,485.507 1236.5,484.5C 1249.04,484.425 1261.37,482.925 1273.5,480C 1289.07,477.683 1304.74,476.349 1320.5,476C 1332.37,473.365 1344.37,471.698 1356.5,471C 1361.2,469.254 1366.03,467.754 1371,466.5C 1376.3,462.227 1382.13,460.56 1388.5,461.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#f9f9f9"
                  d="M 632.5,501.5 C 633.5,501.5 634.5,501.5 635.5,501.5C 635.833,501.5 636.167,501.5 636.5,501.5C 636.706,504.238 637.706,506.572 639.5,508.5C 640.396,511.069 642.062,513.069 644.5,514.5C 642.473,515.693 640.973,517.36 640,519.5C 638.665,523.752 637.831,528.086 637.5,532.5C 612.483,529.569 587.483,526.403 562.5,523C 555.317,522.138 548.317,520.638 541.5,518.5C 540.588,517.262 540.421,515.928 541,514.5C 542.878,513.947 544.378,512.947 545.5,511.5C 557.315,508.409 569.148,506.742 581,506.5C 598.054,504.145 615.221,502.478 632.5,501.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#25252f"
                  d="M 1489.5,495.5 C 1490.48,499.298 1490.82,503.298 1490.5,507.5C 1491.83,507.5 1493.17,507.5 1494.5,507.5C 1462.7,512.614 1430.7,517.281 1398.5,521.5C 1399.09,520.849 1399.76,520.182 1400.5,519.5C 1398.06,517.738 1395.4,516.404 1392.5,515.5C 1391.57,514.311 1391.24,512.978 1391.5,511.5C 1388.83,511.5 1386.17,511.5 1383.5,511.5C 1389.9,510.816 1396.4,510.15 1403,509.5C 1403.33,509.833 1403.67,510.167 1404,510.5C 1404.77,509.151 1405.94,508.318 1407.5,508C 1405.74,507.798 1404.08,507.298 1402.5,506.5C 1403.67,506.167 1404.83,505.833 1406,505.5C 1414.4,507.446 1422.9,507.946 1431.5,507C 1450.9,504.346 1470.23,501.513 1489.5,498.5C 1489.5,497.5 1489.5,496.5 1489.5,495.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#292876"
                  d="M 747.5,476.5 C 750.385,476.194 753.052,476.527 755.5,477.5C 760.652,481.738 766.652,484.571 773.5,486C 775.844,486.837 777.844,488.171 779.5,490C 792.152,493.846 804.986,496.679 818,498.5C 818.333,498.167 818.667,497.833 819,497.5C 830.634,501.047 842.468,502.38 854.5,501.5C 859.059,502.432 863.559,503.432 868,504.5C 876.945,503.778 885.945,503.112 895,502.5C 897.301,500.878 899.634,499.212 902,497.5C 902.232,498.737 902.732,499.737 903.5,500.5C 904.461,498.735 904.795,496.735 904.5,494.5C 905.165,496.698 905.832,499.031 906.5,501.5C 906.92,498.384 907.92,495.717 909.5,493.5C 914.595,493.221 919.595,493.555 924.5,494.5C 925.167,495.167 925.833,495.833 926.5,496.5C 926.5,497.167 926.5,497.833 926.5,498.5C 924.549,498.227 923.049,498.893 922,500.5C 920.667,499.833 919.667,498.833 919,497.5C 918.667,497.833 918.333,498.167 918,498.5C 916.266,497.751 914.433,497.251 912.5,497C 911.333,496.5 910.5,495.667 910,494.5C 909.713,496.891 909.213,499.224 908.5,501.5C 904.222,502.741 900.889,505.241 898.5,509C 892.23,510.076 885.896,510.576 879.5,510.5C 872.387,510.698 865.387,510.031 858.5,508.5C 857.914,508.709 857.414,509.043 857,509.5C 856.588,507.003 855.422,505.003 853.5,503.5C 852.201,504.09 851.368,505.09 851,506.5C 850.667,505.833 850.333,505.167 850,504.5C 825.331,502.779 800.831,498.612 776.5,492C 764.686,488.519 753.686,483.519 743.5,477C 744.793,476.51 746.127,476.343 747.5,476.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#37376b"
                  d="M 1308.5,499.5 C 1312.47,500.34 1316.47,500.507 1320.5,500C 1317.1,501.39 1313.77,501.89 1310.5,501.5C 1304.83,505.866 1298.16,507.199 1290.5,505.5C 1286.26,507.116 1281.93,508.45 1277.5,509.5C 1276.91,509.291 1276.41,508.957 1276,508.5C 1273.26,509.56 1270.43,510.394 1267.5,511C 1271.48,510.983 1275.48,510.816 1279.5,510.5C 1278.74,511.268 1277.74,511.768 1276.5,512C 1268.25,512.132 1260.08,512.965 1252,514.5C 1249.67,514.167 1247.33,513.833 1245,513.5C 1237.87,513.995 1231.04,515.495 1224.5,518C 1186.29,523.577 1147.96,528.743 1109.5,533.5C 1109.61,532.883 1109.94,532.383 1110.5,532C 1109.23,531.691 1108.07,531.191 1107,530.5C 1106.67,530.833 1106.33,531.167 1106,531.5C 1101.24,529.563 1096.4,528.396 1091.5,528C 1094.83,527.667 1098.17,527.333 1101.5,527C 1097.79,526.68 1094.12,526.18 1090.5,525.5C 1103.11,523.837 1115.78,521.837 1128.5,519.5C 1130.71,520.399 1132.87,520.065 1135,518.5C 1141.55,518.136 1148.38,518.136 1155.5,518.5C 1157.83,517.167 1160.17,515.833 1162.5,514.5C 1163.09,514.709 1163.59,515.043 1164,515.5C 1172.41,513.873 1180.91,512.54 1189.5,511.5C 1192.75,512.823 1195.92,512.489 1199,510.5C 1200.93,512.171 1202.93,512.837 1205,512.5C 1206.42,511.54 1207.92,510.707 1209.5,510C 1220.08,507.021 1230.75,505.688 1241.5,506C 1243.25,505.529 1244.91,504.862 1246.5,504C 1252.14,503.823 1257.64,502.99 1263,501.5C 1263.89,502.081 1264.89,502.415 1266,502.5C 1275.87,499.519 1285.87,498.186 1296,498.5C 1297.76,498.944 1297.6,499.444 1295.5,500C 1280.31,502.17 1265.15,504.336 1250,506.5C 1249.59,506.043 1249.09,505.709 1248.5,505.5C 1245.57,506.762 1242.91,508.429 1240.5,510.5C 1241.17,510.833 1241.83,511.167 1242.5,511.5C 1244.45,510.792 1246.12,509.625 1247.5,508C 1264.55,506.41 1281.55,504.41 1298.5,502C 1300.56,500.148 1302.73,498.982 1305,498.5C 1306.01,499.337 1307.18,499.67 1308.5,499.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#121226"
                  d="M 717.5,499.5 C 724.937,500.758 732.27,502.424 739.5,504.5C 742.465,505.626 745.465,506.626 748.5,507.5C 756.429,511.5 764.762,515 773.5,518C 769.216,517.543 764.882,517.543 760.5,518C 770.036,520.53 779.37,523.363 788.5,526.5C 769.944,523.645 751.277,520.978 732.5,518.5C 733.952,517.698 735.618,517.198 737.5,517C 731.828,515.63 726.828,513.63 722.5,511C 725.914,510.703 729.247,510.036 732.5,509C 727.015,506.467 722.015,503.301 717.5,499.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4140f9"
                  d="M 1063.5,512.5 C 1063.17,512.5 1062.83,512.5 1062.5,512.5C 1062.47,511.503 1062.97,510.836 1064,510.5C 1065.87,511.487 1065.7,512.154 1063.5,512.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#898989"
                  d="M 1528.5,524.5 C 1527.88,524.611 1527.38,524.944 1527,525.5C 1525.51,523.668 1523.68,522.835 1521.5,523C 1523.94,525.558 1523.44,526.392 1520,525.5C 1519.63,526.416 1519.13,527.25 1518.5,528C 1519.98,529.193 1521.31,529.693 1522.5,529.5C 1520.76,531.973 1518.92,531.973 1517,529.5C 1516.58,530.672 1515.91,531.672 1515,532.5C 1514.32,533.784 1514.48,534.951 1515.5,536C 1514.71,537.085 1514.04,538.252 1513.5,539.5C 1514.81,540.258 1515.31,541.258 1515,542.5C 1514.67,542.167 1514.33,541.833 1514,541.5C 1511.16,544.587 1509,547.754 1507.5,551C 1502.77,550.966 1502.27,552.466 1506,555.5C 1506.39,553.285 1507.39,551.952 1509,551.5C 1509.75,552.126 1510.58,552.626 1511.5,553C 1512.59,556.083 1512.59,558.583 1511.5,560.5C 1513.73,562.526 1516.07,564.026 1518.5,565C 1515.42,567.29 1512.25,569.457 1509,571.5C 1506.88,570.78 1506.38,569.613 1507.5,568C 1505.69,568.875 1503.69,569.209 1501.5,569C 1499.17,567.337 1496.84,565.17 1494.5,562.5C 1493.32,564.135 1493.32,565.802 1494.5,567.5C 1493.41,569.003 1492.24,569.336 1491,568.5C 1489.96,569.623 1489.29,570.956 1489,572.5C 1486.82,573.108 1484.82,572.441 1483,570.5C 1482.33,571.5 1482.33,572.5 1483,573.5C 1483.33,573.167 1483.67,572.833 1484,572.5C 1485.11,573.76 1485.28,574.927 1484.5,576C 1485.25,577.487 1486.09,577.654 1487,576.5C 1487.81,578.282 1488.98,579.782 1490.5,581C 1488.07,581.451 1487.9,582.285 1490,583.5C 1492.12,583.374 1494.29,583.041 1496.5,582.5C 1495.74,582.089 1494.74,581.923 1493.5,582C 1495.91,579.965 1495.25,578.965 1491.5,579C 1494.92,577.411 1497.92,575.245 1500.5,572.5C 1501.29,573.242 1501.95,574.075 1502.5,575C 1502.5,576.399 1502.17,577.899 1501.5,579.5C 1502.53,579.296 1503.53,579.796 1504.5,581C 1504.17,581.333 1503.83,581.667 1503.5,582C 1504.97,585.767 1507.14,588.267 1510,589.5C 1510.76,585.749 1511.93,585.583 1513.5,589C 1513.17,589.333 1512.83,589.667 1512.5,590C 1516.5,590.667 1516.5,591.333 1512.5,592C 1514.23,592.865 1515.89,593.531 1517.5,594C 1515.35,595.152 1513.52,596.652 1512,598.5C 1511.42,595.876 1510.09,595.209 1508,596.5C 1506.6,594.027 1505.1,594.027 1503.5,596.5C 1502.81,595.975 1502.31,595.308 1502,594.5C 1501.69,595.308 1501.19,595.975 1500.5,596.5C 1499.57,595.359 1498.74,595.359 1498,596.5C 1497.09,595.672 1496.42,594.672 1496,593.5C 1495.17,595 1494,596.167 1492.5,597C 1492.73,599.319 1494.06,601.319 1496.5,603C 1494.87,607.098 1493.37,611.265 1492,615.5C 1490.51,614.747 1490.35,613.914 1491.5,613C 1490.83,612.667 1490.17,612.333 1489.5,612C 1490.11,609.605 1490.11,607.438 1489.5,605.5C 1488.17,606.592 1487.34,607.926 1487,609.5C 1486.58,607.385 1485.41,606.552 1483.5,607C 1485.87,609.184 1485.7,611.35 1483,613.5C 1484,610.802 1483.5,608.302 1481.5,606C 1483.25,605.92 1484.91,605.087 1486.5,603.5C 1484.4,603.452 1482.24,603.452 1480,603.5C 1478.06,601.684 1477.39,599.684 1478,597.5C 1475.91,598.794 1473.91,599.794 1472,600.5C 1471.67,600.167 1471.33,599.833 1471,599.5C 1471.08,600.738 1470.91,601.738 1470.5,602.5C 1469.38,597.279 1468.54,597.279 1468,602.5C 1467.58,601.044 1466.74,600.544 1465.5,601C 1466.17,602.333 1467.17,603.333 1468.5,604C 1466.3,604.825 1464.47,604.325 1463,602.5C 1461.24,604.661 1459.4,604.828 1457.5,603C 1459.93,602.549 1460.1,601.715 1458,600.5C 1456.61,601.815 1455.61,601.481 1455,599.5C 1452.84,600.683 1450.84,600.35 1449,598.5C 1450.33,601.164 1452.5,603.33 1455.5,605C 1452.27,605.356 1450.77,607.19 1451,610.5C 1449.44,609.655 1448.44,610.321 1448,612.5C 1447.68,610.939 1446.85,609.772 1445.5,609C 1447.3,608.683 1447.63,608.016 1446.5,607C 1443.83,606.333 1441.17,606.333 1438.5,607C 1438.07,607.92 1437.74,608.753 1437.5,609.5C 1438.17,603.084 1436,602.084 1431,606.5C 1429.85,605.257 1428.51,604.257 1427,603.5C 1426.91,605.113 1427.74,606.28 1429.5,607C 1424.09,607.162 1423.43,608.662 1427.5,611.5C 1426.96,612.748 1426.29,613.915 1425.5,615C 1426.17,615.667 1426.83,615.667 1427.5,615C 1428.07,613.795 1428.74,612.628 1429.5,611.5C 1430.83,613.167 1430.83,614.833 1429.5,616.5C 1428.5,617.833 1427.5,617.833 1426.5,616.5C 1425.72,617.737 1424.72,618.737 1423.5,619.5C 1422.68,617.252 1421.68,617.086 1420.5,619C 1420.83,619.333 1421.17,619.667 1421.5,620C 1420.01,621.368 1418.51,621.535 1417,620.5C 1416.69,626.352 1415.19,626.852 1412.5,622C 1414.4,620.935 1414.56,620.102 1413,619.5C 1411.78,620.272 1410.78,621.272 1410,622.5C 1408.33,621.66 1408.17,622.16 1409.5,624C 1407.77,625.852 1406.6,625.686 1406,623.5C 1405.58,624.672 1404.91,625.672 1404,626.5C 1403.33,625.167 1402.67,625.167 1402,626.5C 1402.33,624.833 1402.67,623.167 1403,621.5C 1401.64,623.784 1400.14,623.951 1398.5,622C 1401.28,620.221 1400.94,619.221 1397.5,619C 1399.12,618.385 1400.45,617.385 1401.5,616C 1401,615.833 1400.5,615.667 1400,615.5C 1398.63,616.581 1397.13,617.415 1395.5,618C 1396.46,619.147 1396.12,620.147 1394.5,621C 1395.33,621.915 1396.33,622.581 1397.5,623C 1395.6,624.897 1394.1,627.064 1393,629.5C 1391.6,627.097 1390.43,625.097 1389.5,623.5C 1388.65,624.522 1387.65,625.355 1386.5,626C 1387.31,626.308 1387.97,626.808 1388.5,627.5C 1387.55,632.468 1386.05,632.468 1384,627.5C 1383.5,629.99 1382,631.49 1379.5,632C 1379.83,632.333 1380.17,632.667 1380.5,633C 1379.17,633 1377.83,633 1376.5,633C 1377.79,635.09 1377.12,636.424 1374.5,637C 1375.65,637.914 1375.49,638.747 1374,639.5C 1373.67,639.167 1373.33,638.833 1373,638.5C 1371.43,639.984 1370.09,641.651 1369,643.5C 1368.67,642.833 1368.33,642.167 1368,641.5C 1366.51,643.348 1364.67,644.181 1362.5,644C 1360.03,642.439 1358.03,640.439 1356.5,638C 1358.22,637.552 1358.89,636.718 1358.5,635.5C 1359.19,636.025 1359.69,636.692 1360,637.5C 1360.85,635.408 1361.52,633.408 1362,631.5C 1359.77,633.113 1357.27,633.78 1354.5,633.5C 1354.53,635.582 1353.86,637.416 1352.5,639C 1353.96,639.423 1354.46,640.256 1354,641.5C 1353,640.167 1352,640.167 1351,641.5C 1350.61,640.572 1349.95,639.905 1349,639.5C 1348.45,640.289 1347.79,641.289 1347,642.5C 1345.88,642.335 1344.72,642.002 1343.5,641.5C 1342.3,641.846 1342.3,642.346 1343.5,643C 1342.17,643.333 1340.83,643.667 1339.5,644C 1343.72,650.433 1342.06,652.099 1334.5,649C 1335.45,648.282 1335.62,647.449 1335,646.5C 1334.26,647.641 1333.43,647.641 1332.5,646.5C 1330.85,647.779 1329.69,649.445 1329,651.5C 1328.5,649.965 1328.67,648.465 1329.5,647C 1329.37,645.941 1328.87,645.108 1328,644.5C 1327.37,645.872 1326.7,647.205 1326,648.5C 1323.26,645.558 1320.26,642.891 1317,640.5C 1315.42,642.202 1315.92,643.536 1318.5,644.5C 1317.9,645.795 1317.4,647.128 1317,648.5C 1316.5,647.333 1315.67,646.5 1314.5,646C 1315.71,645.107 1315.71,644.274 1314.5,643.5C 1312.36,645.337 1310.19,646.337 1308,646.5C 1307.67,645.5 1307.33,644.5 1307,643.5C 1306.35,644.696 1305.85,644.696 1305.5,643.5C 1306.13,641.742 1307.13,640.242 1308.5,639C 1307.74,636.931 1307.24,634.764 1307,632.5C 1305.95,631.483 1304.78,631.316 1303.5,632C 1306.12,633.856 1306.95,636.356 1306,639.5C 1304.52,637.881 1303.35,637.714 1302.5,639C 1303.29,639.546 1304.29,640.213 1305.5,641C 1303.22,642.851 1303.22,644.518 1305.5,646C 1302.92,648.157 1302.92,649.323 1305.5,649.5C 1304.62,650.251 1303.62,650.751 1302.5,651C 1305.17,651.667 1305.17,652.333 1302.5,653C 1304.35,654.674 1306.02,655.841 1307.5,656.5C 1306.14,657.893 1305.3,659.559 1305,661.5C 1304.67,660.833 1304.33,660.167 1304,659.5C 1302.67,660.833 1301.33,660.833 1300,659.5C 1299.42,662.668 1298.42,663.001 1297,660.5C 1295.93,661.28 1294.76,661.113 1293.5,660C 1295.26,659.02 1296.93,658.353 1298.5,658C 1295.01,656.908 1294.68,655.075 1297.5,652.5C 1296.47,651.3 1295.64,649.966 1295,648.5C 1294.78,651.943 1293.78,652.276 1292,649.5C 1291.28,650.451 1290.45,650.617 1289.5,650C 1290.83,649.333 1290.83,648.667 1289.5,648C 1294.08,648.731 1295.08,647.231 1292.5,643.5C 1291.06,645.401 1289.4,645.734 1287.5,644.5C 1286.29,643.28 1286.29,642.113 1287.5,641C 1286.25,639.176 1285.08,639.343 1284,641.5C 1283.58,640.044 1282.74,639.544 1281.5,640C 1282.71,640.893 1282.71,641.726 1281.5,642.5C 1280.8,640.615 1279.8,640.282 1278.5,641.5C 1276.55,640.186 1274.72,639.52 1273,639.5C 1272.38,640.449 1272.55,641.282 1273.5,642C 1275.09,642.862 1276.75,643.529 1278.5,644C 1277.17,644.333 1275.83,644.667 1274.5,645C 1274.48,648.579 1272.48,650.913 1268.5,652C 1270.93,652.451 1271.1,653.285 1269,654.5C 1267.33,653.66 1267.17,654.16 1268.5,656C 1266.06,656.399 1265.39,655.566 1266.5,653.5C 1265.83,652.833 1265.17,652.167 1264.5,651.5C 1267.08,650.536 1267.58,649.202 1266,647.5C 1265.67,648.167 1265.33,648.833 1265,649.5C 1264.33,648.167 1263.67,648.167 1263,649.5C 1261.65,648.315 1260.48,646.981 1259.5,645.5C 1259.17,645.667 1258.83,645.833 1258.5,646C 1259.64,648.308 1261.31,650.141 1263.5,651.5C 1261.62,652.197 1261.28,653.197 1262.5,654.5C 1262.19,655.308 1261.69,655.975 1261,656.5C 1258.88,655.773 1256.71,655.106 1254.5,654.5C 1253.52,654.977 1252.69,655.643 1252,656.5C 1251.67,662.167 1251.33,667.833 1251,673.5C 1250.5,670.854 1250.34,668.187 1250.5,665.5C 1250.41,627.828 1250.74,590.162 1251.5,552.5C 1256.29,551.275 1261.29,550.608 1266.5,550.5C 1266.5,549.5 1266.5,548.5 1266.5,547.5C 1352.5,534.611 1438.5,521.945 1524.5,509.5C 1529.11,510.026 1533.44,509.359 1537.5,507.5C 1537.83,507.833 1538.17,508.167 1538.5,508.5C 1537.02,511.892 1534.68,513.059 1531.5,512C 1532.83,514 1534.17,516 1535.5,518C 1539.75,518.232 1540.42,519.732 1537.5,522.5C 1536.83,521.833 1536.17,521.167 1535.5,520.5C 1534.28,521.711 1533.11,521.711 1532,520.5C 1531.34,522.324 1530.17,523.657 1528.5,524.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3e3e46"
                  d="M 1044.5,496.5 C 1044.83,496.5 1045.17,496.5 1045.5,496.5C 1046.63,504.755 1046.8,513.088 1046,521.5C 1045.91,526.656 1045.08,531.656 1043.5,536.5C 1041.42,532.002 1039.09,527.669 1036.5,523.5C 1036.67,522.833 1036.83,522.167 1037,521.5C 1037.69,522.357 1038.52,523.023 1039.5,523.5C 1040.04,521.477 1039.54,519.477 1038,517.5C 1037.5,510.842 1037.33,504.175 1037.5,497.5C 1039.95,497.702 1042.28,497.369 1044.5,496.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#0d0d73"
                  d="M 1347.5,506.5 C 1314.6,511.571 1281.6,515.904 1248.5,519.5C 1224.38,523.305 1200.05,526.639 1175.5,529.5C 1174.45,529.649 1173.45,529.483 1172.5,529C 1194.58,525.489 1216.58,521.489 1238.5,517C 1271.01,514.487 1303.34,510.82 1335.5,506C 1339.69,505.188 1343.69,505.355 1347.5,506.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#6c6c6c"
                  d="M 587.5,513.5 C 593.509,513.334 599.509,513.501 605.5,514C 602.016,515.132 598.349,515.632 594.5,515.5C 591.167,515.333 587.833,515.167 584.5,515C 585.737,514.768 586.737,514.268 587.5,513.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#121335"
                  d="M 748.5,507.5 C 752.804,507.268 756.804,508.268 760.5,510.5C 761.167,510.167 761.833,509.833 762.5,509.5C 766.129,512.359 770.129,513.026 774.5,511.5C 777.571,513.18 780.904,513.847 784.5,513.5C 799.882,515.676 815.216,518.176 830.5,521C 836.774,522.149 842.774,523.982 848.5,526.5C 851.083,526.019 853.583,525.352 856,524.5C 857.333,525.167 858.667,525.833 860,526.5C 861.147,525.542 862.147,525.875 863,527.5C 865.758,526.883 868.591,526.716 871.5,527C 872.931,526.535 874.097,525.701 875,524.5C 881.892,525.662 889.059,526.662 896.5,527.5C 899.131,527.218 901.631,526.551 904,525.5C 904.725,526.059 905.558,526.392 906.5,526.5C 909.574,525.698 912.574,524.698 915.5,523.5C 917.811,524.454 919.978,524.788 922,524.5C 924.701,521.683 926.201,518.35 926.5,514.5C 926.5,523.5 926.5,532.5 926.5,541.5C 926.5,542.5 926.5,543.5 926.5,544.5C 884.488,539.498 842.488,534.165 800.5,528.5C 799.5,528.667 798.5,528.833 797.5,529C 798.416,529.278 799.082,529.778 799.5,530.5C 795.458,529.933 791.791,528.6 788.5,526.5C 779.37,523.363 770.036,520.53 760.5,518C 764.882,517.543 769.216,517.543 773.5,518C 764.762,515 756.429,511.5 748.5,507.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#43436b"
                  d="M 1054.5,506.5 C 1056.71,509.085 1059.38,511.085 1062.5,512.5C 1062.83,512.5 1063.17,512.5 1063.5,512.5C 1063.5,512.833 1063.5,513.167 1063.5,513.5C 1064.03,514.721 1064.69,515.887 1065.5,517C 1065.17,517.333 1064.83,517.667 1064.5,518C 1068.66,519.737 1072.99,520.737 1077.5,521C 1075.5,521.333 1073.5,521.667 1071.5,522C 1072.42,522.374 1073.25,522.874 1074,523.5C 1079.44,522.343 1084.61,522.509 1089.5,524C 1088.94,524.383 1088.61,524.883 1088.5,525.5C 1086.52,525.138 1084.52,524.805 1082.5,524.5C 1074.05,525.281 1065.71,526.447 1057.5,528C 1056.67,527.167 1055.83,526.333 1055,525.5C 1054.5,519.175 1054.33,512.842 1054.5,506.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1e1e22"
                  d="M 926.5,496.5 C 930.371,496.185 934.038,496.518 937.5,497.5C 937.5,512.5 937.5,527.5 937.5,542.5C 933.936,541.577 930.269,541.244 926.5,541.5C 926.5,532.5 926.5,523.5 926.5,514.5C 926.5,509.833 926.5,505.167 926.5,500.5C 926.5,499.833 926.5,499.167 926.5,498.5C 926.5,497.833 926.5,497.167 926.5,496.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#070630"
                  d="M 1382.5,511.5 C 1380,513.714 1377,514.881 1373.5,515C 1364.52,515.88 1355.52,516.38 1346.5,516.5C 1327.8,518.219 1309.13,520.219 1290.5,522.5C 1320.97,517.311 1351.64,513.645 1382.5,511.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1c0407"
                  d="M 1023.5,549.5 C 1000.83,549.5 978.167,549.5 955.5,549.5C 955.918,548.778 956.584,548.278 957.5,548C 956.944,547.617 956.611,547.117 956.5,546.5C 957.5,546.5 958.5,546.5 959.5,546.5C 958.416,541.572 957.75,536.572 957.5,531.5C 957.551,528.777 957.884,526.11 958.5,523.5C 975.291,514.973 991.625,515.806 1007.5,526C 1009.75,529.753 1011.42,533.753 1012.5,538C 1011.44,541.89 1009.11,544.723 1005.5,546.5C 1007.85,547.712 1010.35,548.379 1013,548.5C 1017.16,547.927 1021.32,547.427 1025.5,547C 1027.02,544.895 1027.52,545.061 1027,547.5C 1025.7,548.085 1024.53,548.751 1023.5,549.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2d2df9"
                  d="M 1248.5,519.5 C 1244.82,519.665 1241.15,519.499 1237.5,519C 1240.7,517.517 1244.04,517.183 1247.5,518C 1248.06,518.383 1248.39,518.883 1248.5,519.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#272652"
                  d="M 1382.5,511.5 C 1382.83,511.5 1383.17,511.5 1383.5,511.5C 1386.17,511.5 1388.83,511.5 1391.5,511.5C 1391.24,512.978 1391.57,514.311 1392.5,515.5C 1395.4,516.404 1398.06,517.738 1400.5,519.5C 1399.76,520.182 1399.09,520.849 1398.5,521.5C 1391.97,523.144 1385.3,524.144 1378.5,524.5C 1376.78,522.306 1374.45,521.139 1371.5,521C 1361.51,520.5 1351.51,520.334 1341.5,520.5C 1340.05,519.698 1338.38,519.198 1336.5,519C 1340.13,518.851 1343.47,518.018 1346.5,516.5C 1355.52,516.38 1364.52,515.88 1373.5,515C 1377,514.881 1380,513.714 1382.5,511.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#868687"
                  d="M 1528.5,524.5 C 1528.41,528.782 1530.24,531.782 1534,533.5C 1534.33,532.833 1534.67,532.167 1535,531.5C 1535.76,533.769 1535.59,535.936 1534.5,538C 1535.69,539.019 1536.69,540.186 1537.5,541.5C 1536.29,542.72 1536.29,543.887 1537.5,545C 1535.12,545.974 1535.46,546.641 1538.5,547C 1537.83,547.667 1537.17,548.333 1536.5,549C 1537.57,550.25 1537.57,551.584 1536.5,553C 1538.64,555.17 1538.64,557.504 1536.5,560C 1537.34,562.7 1538.34,565.367 1539.5,568C 1538.77,570.689 1539.44,573.189 1541.5,575.5C 1540.62,576.251 1539.62,576.751 1538.5,577C 1540.93,578.162 1541.59,579.829 1540.5,582C 1541.1,583.605 1542.1,584.938 1543.5,586C 1542.83,586.333 1542.17,586.667 1541.5,587C 1542.5,588 1543.5,589 1544.5,590C 1543.04,590.423 1542.54,591.256 1543,592.5C 1545.23,594.607 1547.23,596.94 1549,599.5C 1549.25,598.376 1549.75,597.376 1550.5,596.5C 1553.06,597.864 1554.56,599.531 1555,601.5C 1558.59,599.805 1561.26,597.805 1563,595.5C 1563.33,596.167 1563.67,596.833 1564,597.5C 1566.53,595.081 1568.36,595.747 1569.5,599.5C 1568.81,601.335 1569.14,603.168 1570.5,605C 1567.32,607.345 1567.32,610.012 1570.5,613C 1568.85,614.555 1568.52,616.221 1569.5,618C 1567.68,620.605 1567.01,623.272 1567.5,626C 1566.5,627 1565.5,628 1564.5,629C 1566.72,630.391 1566.72,632.057 1564.5,634C 1566.67,635.174 1567.67,637.007 1567.5,639.5C 1544.71,644.721 1522.05,650.054 1499.5,655.5C 1498.89,660.628 1497.56,665.628 1495.5,670.5C 1495.33,671.492 1495.66,672.158 1496.5,672.5C 1496.83,673.167 1497.17,673.833 1497.5,674.5C 1497.5,675.167 1497.83,675.5 1498.5,675.5C 1498.5,677.5 1498.5,679.5 1498.5,681.5C 1498.63,682.376 1498.3,683.043 1497.5,683.5C 1495.66,684.028 1494,684.694 1492.5,685.5C 1473.21,689.822 1453.87,694.155 1434.5,698.5C 1421.84,700.998 1409.17,703.498 1396.5,706C 1388.23,708.035 1380.23,710.535 1372.5,713.5C 1340.64,721.529 1308.97,729.529 1277.5,737.5C 1273,738.327 1268.5,739.327 1264,740.5C 1261.35,739.284 1258.85,739.284 1256.5,740.5C 1254.74,740.357 1253.07,740.691 1251.5,741.5C 1250.52,741.023 1249.69,740.357 1249,739.5C 1248.95,714.669 1249.45,690.003 1250.5,665.5C 1250.34,668.187 1250.5,670.854 1251,673.5C 1251.33,667.833 1251.67,662.167 1252,656.5C 1252.69,655.643 1253.52,654.977 1254.5,654.5C 1256.71,655.106 1258.88,655.773 1261,656.5C 1261.69,655.975 1262.19,655.308 1262.5,654.5C 1261.28,653.197 1261.62,652.197 1263.5,651.5C 1261.31,650.141 1259.64,648.308 1258.5,646C 1258.83,645.833 1259.17,645.667 1259.5,645.5C 1260.48,646.981 1261.65,648.315 1263,649.5C 1263.67,648.167 1264.33,648.167 1265,649.5C 1265.33,648.833 1265.67,648.167 1266,647.5C 1267.58,649.202 1267.08,650.536 1264.5,651.5C 1265.17,652.167 1265.83,652.833 1266.5,653.5C 1265.39,655.566 1266.06,656.399 1268.5,656C 1267.17,654.16 1267.33,653.66 1269,654.5C 1271.1,653.285 1270.93,652.451 1268.5,652C 1272.48,650.913 1274.48,648.579 1274.5,645C 1275.83,644.667 1277.17,644.333 1278.5,644C 1276.75,643.529 1275.09,642.862 1273.5,642C 1272.55,641.282 1272.38,640.449 1273,639.5C 1274.72,639.52 1276.55,640.186 1278.5,641.5C 1279.8,640.282 1280.8,640.615 1281.5,642.5C 1282.71,641.726 1282.71,640.893 1281.5,640C 1282.74,639.544 1283.58,640.044 1284,641.5C 1285.08,639.343 1286.25,639.176 1287.5,641C 1286.29,642.113 1286.29,643.28 1287.5,644.5C 1289.4,645.734 1291.06,645.401 1292.5,643.5C 1295.08,647.231 1294.08,648.731 1289.5,648C 1290.83,648.667 1290.83,649.333 1289.5,650C 1290.45,650.617 1291.28,650.451 1292,649.5C 1293.78,652.276 1294.78,651.943 1295,648.5C 1295.64,649.966 1296.47,651.3 1297.5,652.5C 1294.68,655.075 1295.01,656.908 1298.5,658C 1296.93,658.353 1295.26,659.02 1293.5,660C 1294.76,661.113 1295.93,661.28 1297,660.5C 1298.42,663.001 1299.42,662.668 1300,659.5C 1301.33,660.833 1302.67,660.833 1304,659.5C 1304.33,660.167 1304.67,660.833 1305,661.5C 1305.3,659.559 1306.14,657.893 1307.5,656.5C 1306.02,655.841 1304.35,654.674 1302.5,653C 1305.17,652.333 1305.17,651.667 1302.5,651C 1303.62,650.751 1304.62,650.251 1305.5,649.5C 1302.92,649.323 1302.92,648.157 1305.5,646C 1303.22,644.518 1303.22,642.851 1305.5,641C 1304.29,640.213 1303.29,639.546 1302.5,639C 1303.35,637.714 1304.52,637.881 1306,639.5C 1306.95,636.356 1306.12,633.856 1303.5,632C 1304.78,631.316 1305.95,631.483 1307,632.5C 1307.24,634.764 1307.74,636.931 1308.5,639C 1307.13,640.242 1306.13,641.742 1305.5,643.5C 1305.85,644.696 1306.35,644.696 1307,643.5C 1307.33,644.5 1307.67,645.5 1308,646.5C 1310.19,646.337 1312.36,645.337 1314.5,643.5C 1315.71,644.274 1315.71,645.107 1314.5,646C 1315.67,646.5 1316.5,647.333 1317,648.5C 1317.4,647.128 1317.9,645.795 1318.5,644.5C 1315.92,643.536 1315.42,642.202 1317,640.5C 1320.26,642.891 1323.26,645.558 1326,648.5C 1326.7,647.205 1327.37,645.872 1328,644.5C 1328.87,645.108 1329.37,645.941 1329.5,647C 1328.67,648.465 1328.5,649.965 1329,651.5C 1329.69,649.445 1330.85,647.779 1332.5,646.5C 1333.43,647.641 1334.26,647.641 1335,646.5C 1335.62,647.449 1335.45,648.282 1334.5,649C 1342.06,652.099 1343.72,650.433 1339.5,644C 1340.83,643.667 1342.17,643.333 1343.5,643C 1342.3,642.346 1342.3,641.846 1343.5,641.5C 1344.72,642.002 1345.88,642.335 1347,642.5C 1347.79,641.289 1348.45,640.289 1349,639.5C 1349.95,639.905 1350.61,640.572 1351,641.5C 1352,640.167 1353,640.167 1354,641.5C 1354.46,640.256 1353.96,639.423 1352.5,639C 1353.86,637.416 1354.53,635.582 1354.5,633.5C 1357.27,633.78 1359.77,633.113 1362,631.5C 1361.52,633.408 1360.85,635.408 1360,637.5C 1359.69,636.692 1359.19,636.025 1358.5,635.5C 1358.89,636.718 1358.22,637.552 1356.5,638C 1358.03,640.439 1360.03,642.439 1362.5,644C 1364.67,644.181 1366.51,643.348 1368,641.5C 1368.33,642.167 1368.67,642.833 1369,643.5C 1370.09,641.651 1371.43,639.984 1373,638.5C 1373.33,638.833 1373.67,639.167 1374,639.5C 1375.49,638.747 1375.65,637.914 1374.5,637C 1377.12,636.424 1377.79,635.09 1376.5,633C 1377.83,633 1379.17,633 1380.5,633C 1380.17,632.667 1379.83,632.333 1379.5,632C 1382,631.49 1383.5,629.99 1384,627.5C 1386.05,632.468 1387.55,632.468 1388.5,627.5C 1387.97,626.808 1387.31,626.308 1386.5,626C 1387.65,625.355 1388.65,624.522 1389.5,623.5C 1390.43,625.097 1391.6,627.097 1393,629.5C 1394.1,627.064 1395.6,624.897 1397.5,623C 1396.33,622.581 1395.33,621.915 1394.5,621C 1396.12,620.147 1396.46,619.147 1395.5,618C 1397.13,617.415 1398.63,616.581 1400,615.5C 1400.5,615.667 1401,615.833 1401.5,616C 1400.45,617.385 1399.12,618.385 1397.5,619C 1400.94,619.221 1401.28,620.221 1398.5,622C 1400.14,623.951 1401.64,623.784 1403,621.5C 1402.67,623.167 1402.33,624.833 1402,626.5C 1402.67,625.167 1403.33,625.167 1404,626.5C 1404.91,625.672 1405.58,624.672 1406,623.5C 1406.6,625.686 1407.77,625.852 1409.5,624C 1408.17,622.16 1408.33,621.66 1410,622.5C 1410.78,621.272 1411.78,620.272 1413,619.5C 1414.56,620.102 1414.4,620.935 1412.5,622C 1415.19,626.852 1416.69,626.352 1417,620.5C 1418.51,621.535 1420.01,621.368 1421.5,620C 1421.17,619.667 1420.83,619.333 1420.5,619C 1421.68,617.086 1422.68,617.252 1423.5,619.5C 1424.72,618.737 1425.72,617.737 1426.5,616.5C 1427.5,617.833 1428.5,617.833 1429.5,616.5C 1430.83,614.833 1430.83,613.167 1429.5,611.5C 1428.74,612.628 1428.07,613.795 1427.5,615C 1426.83,615.667 1426.17,615.667 1425.5,615C 1426.29,613.915 1426.96,612.748 1427.5,611.5C 1423.43,608.662 1424.09,607.162 1429.5,607C 1427.74,606.28 1426.91,605.113 1427,603.5C 1428.51,604.257 1429.85,605.257 1431,606.5C 1436,602.084 1438.17,603.084 1437.5,609.5C 1437.74,608.753 1438.07,607.92 1438.5,607C 1441.17,606.333 1443.83,606.333 1446.5,607C 1447.63,608.016 1447.3,608.683 1445.5,609C 1446.85,609.772 1447.68,610.939 1448,612.5C 1448.44,610.321 1449.44,609.655 1451,610.5C 1450.77,607.19 1452.27,605.356 1455.5,605C 1452.5,603.33 1450.33,601.164 1449,598.5C 1450.84,600.35 1452.84,600.683 1455,599.5C 1455.61,601.481 1456.61,601.815 1458,600.5C 1460.1,601.715 1459.93,602.549 1457.5,603C 1459.4,604.828 1461.24,604.661 1463,602.5C 1464.47,604.325 1466.3,604.825 1468.5,604C 1467.17,603.333 1466.17,602.333 1465.5,601C 1466.74,600.544 1467.58,601.044 1468,602.5C 1468.54,597.279 1469.38,597.279 1470.5,602.5C 1470.91,601.738 1471.08,600.738 1471,599.5C 1471.33,599.833 1471.67,600.167 1472,600.5C 1473.91,599.794 1475.91,598.794 1478,597.5C 1477.39,599.684 1478.06,601.684 1480,603.5C 1482.24,603.452 1484.4,603.452 1486.5,603.5C 1484.91,605.087 1483.25,605.92 1481.5,606C 1483.5,608.302 1484,610.802 1483,613.5C 1485.7,611.35 1485.87,609.184 1483.5,607C 1485.41,606.552 1486.58,607.385 1487,609.5C 1487.34,607.926 1488.17,606.592 1489.5,605.5C 1490.11,607.438 1490.11,609.605 1489.5,612C 1490.17,612.333 1490.83,612.667 1491.5,613C 1490.35,613.914 1490.51,614.747 1492,615.5C 1493.37,611.265 1494.87,607.098 1496.5,603C 1494.06,601.319 1492.73,599.319 1492.5,597C 1494,596.167 1495.17,595 1496,593.5C 1496.42,594.672 1497.09,595.672 1498,596.5C 1498.74,595.359 1499.57,595.359 1500.5,596.5C 1501.19,595.975 1501.69,595.308 1502,594.5C 1502.31,595.308 1502.81,595.975 1503.5,596.5C 1505.1,594.027 1506.6,594.027 1508,596.5C 1510.09,595.209 1511.42,595.876 1512,598.5C 1513.52,596.652 1515.35,595.152 1517.5,594C 1515.89,593.531 1514.23,592.865 1512.5,592C 1516.5,591.333 1516.5,590.667 1512.5,590C 1512.83,589.667 1513.17,589.333 1513.5,589C 1511.93,585.583 1510.76,585.749 1510,589.5C 1507.14,588.267 1504.97,585.767 1503.5,582C 1503.83,581.667 1504.17,581.333 1504.5,581C 1503.53,579.796 1502.53,579.296 1501.5,579.5C 1502.17,577.899 1502.5,576.399 1502.5,575C 1501.95,574.075 1501.29,573.242 1500.5,572.5C 1497.92,575.245 1494.92,577.411 1491.5,579C 1495.25,578.965 1495.91,579.965 1493.5,582C 1494.74,581.923 1495.74,582.089 1496.5,582.5C 1494.29,583.041 1492.12,583.374 1490,583.5C 1487.9,582.285 1488.07,581.451 1490.5,581C 1488.98,579.782 1487.81,578.282 1487,576.5C 1486.09,577.654 1485.25,577.487 1484.5,576C 1485.28,574.927 1485.11,573.76 1484,572.5C 1483.67,572.833 1483.33,573.167 1483,573.5C 1482.33,572.5 1482.33,571.5 1483,570.5C 1484.82,572.441 1486.82,573.108 1489,572.5C 1489.29,570.956 1489.96,569.623 1491,568.5C 1492.24,569.336 1493.41,569.003 1494.5,567.5C 1493.32,565.802 1493.32,564.135 1494.5,562.5C 1496.84,565.17 1499.17,567.337 1501.5,569C 1503.69,569.209 1505.69,568.875 1507.5,568C 1506.38,569.613 1506.88,570.78 1509,571.5C 1512.25,569.457 1515.42,567.29 1518.5,565C 1516.07,564.026 1513.73,562.526 1511.5,560.5C 1512.59,558.583 1512.59,556.083 1511.5,553C 1510.58,552.626 1509.75,552.126 1509,551.5C 1507.39,551.952 1506.39,553.285 1506,555.5C 1502.27,552.466 1502.77,550.966 1507.5,551C 1509,547.754 1511.16,544.587 1514,541.5C 1514.33,541.833 1514.67,542.167 1515,542.5C 1515.31,541.258 1514.81,540.258 1513.5,539.5C 1514.04,538.252 1514.71,537.085 1515.5,536C 1514.48,534.951 1514.32,533.784 1515,532.5C 1515.91,531.672 1516.58,530.672 1517,529.5C 1518.92,531.973 1520.76,531.973 1522.5,529.5C 1521.31,529.693 1519.98,529.193 1518.5,528C 1519.13,527.25 1519.63,526.416 1520,525.5C 1523.44,526.392 1523.94,525.558 1521.5,523C 1523.68,522.835 1525.51,523.668 1527,525.5C 1527.38,524.944 1527.88,524.611 1528.5,524.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#190b46"
                  d="M 1033.5,497.5 C 1034.5,497.5 1035.5,497.5 1036.5,497.5C 1036.25,508.195 1035.59,518.862 1034.5,529.5C 1033.52,532.962 1033.19,536.629 1033.5,540.5C 1032.84,538.631 1032.17,536.631 1031.5,534.5C 1030.83,536.291 1030.16,537.958 1029.5,539.5C 1031.2,525.536 1032.53,511.536 1033.5,497.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#292976"
                  d="M 1341.5,520.5 C 1351.51,520.334 1361.51,520.5 1371.5,521C 1374.45,521.139 1376.78,522.306 1378.5,524.5C 1372.38,526.019 1366.05,527.019 1359.5,527.5C 1359.25,526.078 1358.42,525.078 1357,524.5C 1339.46,524.894 1321.63,526.061 1303.5,528C 1299.33,528.705 1295.33,529.539 1291.5,530.5C 1288.94,530.198 1286.61,530.532 1284.5,531.5C 1270.53,533.045 1256.53,533.878 1242.5,534C 1244.25,533.529 1245.91,532.862 1247.5,532C 1246.57,531.009 1245.4,530.509 1244,530.5C 1238.73,533.16 1233.23,535.327 1227.5,537C 1221.44,537.613 1215.44,538.613 1209.5,540C 1208.65,541.728 1207.65,541.895 1206.5,540.5C 1203.17,540.5 1199.83,540.5 1196.5,540.5C 1193.47,543.36 1189.8,545.193 1185.5,546C 1149.7,550.266 1114.03,555.266 1078.5,561C 1077.35,561.645 1076.35,562.478 1075.5,563.5C 1075.24,562.095 1074.91,560.762 1074.5,559.5C 1071.5,559.5 1068.5,559.5 1065.5,559.5C 1066.21,558.596 1067.21,558.263 1068.5,558.5C 1075.87,558.616 1083.21,558.116 1090.5,557C 1101.28,554.874 1111.95,552.54 1122.5,550C 1136.89,549.325 1151.23,547.992 1165.5,546C 1170.84,543.325 1176.5,541.491 1182.5,540.5C 1196.66,540.071 1210.66,538.571 1224.5,536C 1229.74,534.522 1234.74,532.522 1239.5,530C 1243.83,529.333 1248.17,529.333 1252.5,530C 1249.77,531.232 1249.94,532.065 1253,532.5C 1254.07,532.472 1254.9,532.139 1255.5,531.5C 1269.16,530.334 1282.83,529.168 1296.5,528C 1298.25,527.529 1299.91,526.862 1301.5,526C 1315.04,524.642 1328.38,522.809 1341.5,520.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#212053"
                  d="M 1353.5,502.5 C 1354.95,503.302 1356.62,503.802 1358.5,504C 1354.87,505.049 1351.2,505.882 1347.5,506.5C 1343.69,505.355 1339.69,505.188 1335.5,506C 1303.34,510.82 1271.01,514.487 1238.5,517C 1216.58,521.489 1194.58,525.489 1172.5,529C 1173.45,529.483 1174.45,529.649 1175.5,529.5C 1172.41,530.785 1169.08,531.451 1165.5,531.5C 1166.61,530.71 1167.94,530.21 1169.5,530C 1130.87,533.661 1092.21,538.161 1053.5,543.5C 1053.5,542.5 1053.5,541.5 1053.5,540.5C 1054.22,540.082 1054.72,539.416 1055,538.5C 1055.67,539.578 1056.67,540.245 1058,540.5C 1075.24,538.618 1092.41,536.285 1109.5,533.5C 1147.96,528.743 1186.29,523.577 1224.5,518C 1231.04,515.495 1237.87,513.995 1245,513.5C 1247.33,513.833 1249.67,514.167 1252,514.5C 1260.08,512.965 1268.25,512.132 1276.5,512C 1277.74,511.768 1278.74,511.268 1279.5,510.5C 1297.14,508.004 1314.81,505.504 1332.5,503C 1339.49,502.5 1346.49,502.334 1353.5,502.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#171758"
                  d="M 1346.5,516.5 C 1343.47,518.018 1340.13,518.851 1336.5,519C 1338.38,519.198 1340.05,519.698 1341.5,520.5C 1328.38,522.809 1315.04,524.642 1301.5,526C 1299.91,526.862 1298.25,527.529 1296.5,528C 1282.83,529.168 1269.16,530.334 1255.5,531.5C 1256.6,529.908 1255.93,529.075 1253.5,529C 1255.85,528.76 1257.85,527.927 1259.5,526.5C 1262.52,526.665 1265.52,526.498 1268.5,526C 1267.94,525.617 1267.61,525.117 1267.5,524.5C 1275.14,523.572 1282.81,522.906 1290.5,522.5C 1309.13,520.219 1327.8,518.219 1346.5,516.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#070708"
                  d="M 1578.5,546.5 C 1578.5,547.833 1578.5,549.167 1578.5,550.5C 1577.17,557.647 1573.84,563.814 1568.5,569C 1549.67,574.849 1540.67,567.849 1541.5,548C 1541.86,537.92 1545.53,529.253 1552.5,522C 1571.73,519.061 1580.39,527.228 1578.5,546.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2322df"
                  d="M 1258.5,524.5 C 1261.5,524.5 1264.5,524.5 1267.5,524.5C 1267.61,525.117 1267.94,525.617 1268.5,526C 1265.52,526.498 1262.52,526.665 1259.5,526.5C 1257.3,526.591 1256.97,525.925 1258.5,524.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#7c7c7c"
                  d="M 1579.5,499.5 C 1579.83,499.5 1580.17,499.5 1580.5,499.5C 1579.99,515.329 1579.32,530.995 1578.5,546.5C 1580.39,527.228 1571.73,519.061 1552.5,522C 1545.53,529.253 1541.86,537.92 1541.5,548C 1540.67,567.849 1549.67,574.849 1568.5,569C 1573.84,563.814 1577.17,557.647 1578.5,550.5C 1578.03,570.338 1577.36,590.171 1576.5,610C 1576.52,616.244 1576.85,622.411 1577.5,628.5C 1576.88,628.917 1576.54,629.584 1576.5,630.5C 1577.39,632.155 1577.89,633.822 1578,635.5C 1577.67,635.167 1577.33,634.833 1577,634.5C 1575.57,636.439 1573.73,637.772 1571.5,638.5C 1570.17,638.833 1568.83,639.167 1567.5,639.5C 1567.67,637.007 1566.67,635.174 1564.5,634C 1566.72,632.057 1566.72,630.391 1564.5,629C 1565.5,628 1566.5,627 1567.5,626C 1567.01,623.272 1567.68,620.605 1569.5,618C 1568.52,616.221 1568.85,614.555 1570.5,613C 1567.32,610.012 1567.32,607.345 1570.5,605C 1569.14,603.168 1568.81,601.335 1569.5,599.5C 1568.36,595.747 1566.53,595.081 1564,597.5C 1563.67,596.833 1563.33,596.167 1563,595.5C 1561.26,597.805 1558.59,599.805 1555,601.5C 1554.56,599.531 1553.06,597.864 1550.5,596.5C 1549.75,597.376 1549.25,598.376 1549,599.5C 1547.23,596.94 1545.23,594.607 1543,592.5C 1542.54,591.256 1543.04,590.423 1544.5,590C 1543.5,589 1542.5,588 1541.5,587C 1542.17,586.667 1542.83,586.333 1543.5,586C 1542.1,584.938 1541.1,583.605 1540.5,582C 1541.59,579.829 1540.93,578.162 1538.5,577C 1539.62,576.751 1540.62,576.251 1541.5,575.5C 1539.44,573.189 1538.77,570.689 1539.5,568C 1538.34,565.367 1537.34,562.7 1536.5,560C 1538.64,557.504 1538.64,555.17 1536.5,553C 1537.57,551.584 1537.57,550.25 1536.5,549C 1537.17,548.333 1537.83,547.667 1538.5,547C 1535.46,546.641 1535.12,545.974 1537.5,545C 1536.29,543.887 1536.29,542.72 1537.5,541.5C 1536.69,540.186 1535.69,539.019 1534.5,538C 1535.59,535.936 1535.76,533.769 1535,531.5C 1534.67,532.167 1534.33,532.833 1534,533.5C 1530.24,531.782 1528.41,528.782 1528.5,524.5C 1530.17,523.657 1531.34,522.324 1532,520.5C 1533.11,521.711 1534.28,521.711 1535.5,520.5C 1536.17,521.167 1536.83,521.833 1537.5,522.5C 1540.42,519.732 1539.75,518.232 1535.5,518C 1534.17,516 1532.83,514 1531.5,512C 1534.68,513.059 1537.02,511.892 1538.5,508.5C 1538.17,508.167 1537.83,507.833 1537.5,507.5C 1533.44,509.359 1529.11,510.026 1524.5,509.5C 1542.63,506.098 1560.96,502.765 1579.5,499.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#9e9e9d"
                  d="M 545.5,511.5 C 544.378,512.947 542.878,513.947 541,514.5C 540.421,515.928 540.588,517.262 541.5,518.5C 541.5,520.167 541.5,521.833 541.5,523.5C 551.333,526.084 561.333,527.917 571.5,529C 688.872,545.115 806.205,561.449 923.5,578C 938.446,579.883 953.446,581.05 968.5,581.5C 986.996,582.332 1005.66,582.832 1024.5,583C 1025.17,583.333 1025.83,583.667 1026.5,584C 1025.44,585.188 1024.1,585.688 1022.5,585.5C 1022.17,588.472 1023.17,590.638 1025.5,592C 1024.76,594.235 1024.76,596.235 1025.5,598C 1023.49,599.791 1023.49,601.125 1025.5,602C 1024.36,602.741 1024.36,603.575 1025.5,604.5C 1024.02,605.48 1022.69,606.647 1021.5,608C 1022.45,608.617 1023.28,608.451 1024,607.5C 1024.69,608.025 1025.19,608.692 1025.5,609.5C 1024.17,609.833 1022.83,610.167 1021.5,610.5C 1022.5,611.333 1023.5,612.167 1024.5,613C 1021.69,615.521 1022.02,617.187 1025.5,618C 1022.87,620.789 1023.54,622.789 1027.5,624C 1026.17,624.667 1026.17,625.333 1027.5,626C 1023.96,627.071 1023.29,628.737 1025.5,631C 1024.83,631.667 1024.17,632.333 1023.5,633C 1023.52,636.309 1023.85,639.642 1024.5,643C 1022.11,644.309 1022.11,645.309 1024.5,646C 1023.83,646.333 1023.17,646.667 1022.5,647C 1024.92,649.112 1024.92,651.112 1022.5,653C 1024.96,654.154 1024.96,655.488 1022.5,657C 1023.36,657.689 1024.02,658.522 1024.5,659.5C 1023.56,659.489 1022.89,659.989 1022.5,661C 1024.38,663.607 1024.05,666.274 1021.5,669C 1025.5,669.667 1025.5,670.333 1021.5,671C 1022.17,671.667 1022.83,672.333 1023.5,673C 1023.47,675.387 1022.8,677.887 1021.5,680.5C 1022.67,682.691 1022.34,684.858 1020.5,687C 1020.6,689.996 1021.26,692.33 1022.5,694C 1021.83,694.333 1021.17,694.667 1020.5,695C 1020.62,696.268 1020.95,697.602 1021.5,699C 1020.55,699.617 1019.72,699.451 1019,698.5C 1018.51,699.793 1018.34,701.127 1018.5,702.5C 997.342,703.409 976.342,703.742 955.5,703.5C 953.078,704.692 952.078,706.692 952.5,709.5C 952.119,712.325 953.119,714.491 955.5,716C 974.817,717.149 994.15,717.649 1013.5,717.5C 1019.18,717.334 1024.84,717.501 1030.5,718C 1032,718.583 1033.33,719.416 1034.5,720.5C 1033.73,721.711 1032.89,721.711 1032,720.5C 1031.33,721.5 1031.33,722.5 1032,723.5C 1032.67,722.167 1033.33,722.167 1034,723.5C 1034.25,725.433 1034.75,727.266 1035.5,729C 1034.55,729.483 1033.55,729.649 1032.5,729.5C 1032.17,731.661 1031.17,733.494 1029.5,735C 1030.52,736.049 1030.68,737.216 1030,738.5C 1027.18,740.322 1024.68,742.489 1022.5,745C 1023.34,746.666 1022.84,746.833 1021,745.5C 1019.54,747.658 1017.71,749.491 1015.5,751C 1015.83,751.333 1016.17,751.667 1016.5,752C 1014.89,754.515 1012.56,755.849 1009.5,756C 1008.57,758.848 1007.07,759.014 1005,756.5C 1003.89,757.711 1002.72,757.711 1001.5,756.5C 1000.61,757.325 1000.28,758.325 1000.5,759.5C 988.5,759.5 976.5,759.5 964.5,759.5C 958.149,759.443 951.815,759.11 945.5,758.5C 819.948,732.322 694.282,705.988 568.5,679.5C 560.751,678.308 553.251,675.975 546,672.5C 545.506,674.134 545.34,675.801 545.5,677.5C 544.833,677.5 544.167,677.5 543.5,677.5C 543.5,677.167 543.5,676.833 543.5,676.5C 544.806,673.313 544.806,669.98 543.5,666.5C 542.482,667.193 541.482,667.859 540.5,668.5C 539.185,667.524 537.852,666.524 536.5,665.5C 533.12,666.087 530.12,667.421 527.5,669.5C 527.937,667.926 528.937,666.759 530.5,666C 534.288,664.022 538.121,662.189 542,660.5C 542.311,651.322 542.311,641.989 542,632.5C 545,630.229 545.166,627.896 542.5,625.5C 541.819,617.609 541.152,609.776 540.5,602C 541.238,600.176 541.572,598.176 541.5,596C 540.01,568.578 539.51,541.078 540,513.5C 541.725,512.536 543.559,511.869 545.5,511.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2f2e31"
                  d="M 937.5,497.5 C 940.5,497.5 943.5,497.5 946.5,497.5C 946.578,504.515 946.911,511.515 947.5,518.5C 948.479,524.139 946.979,528.806 943,532.5C 942.265,534.871 941.432,537.205 940.5,539.5C 941.311,540.216 941.978,541.05 942.5,542C 941.118,545.022 940.118,548.189 939.5,551.5C 939.254,549.78 939.254,547.78 939.5,545.5C 939.715,543.821 939.048,542.821 937.5,542.5C 937.5,527.5 937.5,512.5 937.5,497.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#180b28"
                  d="M 948.5,518.5 C 952.162,527.494 954.829,536.827 956.5,546.5C 956.611,547.117 956.944,547.617 957.5,548C 956.584,548.278 955.918,548.778 955.5,549.5C 953.265,549.795 951.265,549.461 949.5,548.5C 950.42,545.124 950.753,541.791 950.5,538.5C 949.32,531.884 948.654,525.218 948.5,518.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#333359"
                  d="M 1053.5,496.5 C 1054.4,497.209 1054.74,498.209 1054.5,499.5C 1054.5,501.833 1054.5,504.167 1054.5,506.5C 1054.33,512.842 1054.5,519.175 1055,525.5C 1055.83,526.333 1056.67,527.167 1057.5,528C 1065.71,526.447 1074.05,525.281 1082.5,524.5C 1084.52,524.805 1086.52,525.138 1088.5,525.5C 1089.17,525.5 1089.83,525.5 1090.5,525.5C 1094.12,526.18 1097.79,526.68 1101.5,527C 1098.17,527.333 1094.83,527.667 1091.5,528C 1096.4,528.396 1101.24,529.563 1106,531.5C 1106.33,531.167 1106.67,530.833 1107,530.5C 1108.07,531.191 1109.23,531.691 1110.5,532C 1109.94,532.383 1109.61,532.883 1109.5,533.5C 1092.41,536.285 1075.24,538.618 1058,540.5C 1056.67,540.245 1055.67,539.578 1055,538.5C 1054.72,539.416 1054.22,540.082 1053.5,540.5C 1053.5,525.833 1053.5,511.167 1053.5,496.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2f2f8c"
                  d="M 1359.5,527.5 C 1349.16,529.072 1338.83,530.739 1328.5,532.5C 1329.81,531.768 1331.14,530.934 1332.5,530C 1331.57,529.009 1330.4,528.509 1329,528.5C 1327.21,529.285 1325.54,529.285 1324,528.5C 1323,529.167 1322,529.833 1321,530.5C 1311.23,529.444 1301.4,529.444 1291.5,530.5C 1295.33,529.539 1299.33,528.705 1303.5,528C 1321.63,526.061 1339.46,524.894 1357,524.5C 1358.42,525.078 1359.25,526.078 1359.5,527.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#202026"
                  d="M 947.5,518.5 C 947.833,518.5 948.167,518.5 948.5,518.5C 948.654,525.218 949.32,531.884 950.5,538.5C 950.753,541.791 950.42,545.124 949.5,548.5C 948.5,548.5 947.5,548.5 946.5,548.5C 945.492,546.661 943.992,545.328 942,544.5C 941.667,546.047 942.167,547.38 943.5,548.5C 941.219,551.189 941.886,553.356 945.5,555C 946.437,555.692 947.103,555.525 947.5,554.5C 948.896,556.762 950.563,558.929 952.5,561C 949.794,564.422 946.627,567.256 943,569.5C 942.517,570.448 942.351,571.448 942.5,572.5C 937.12,572.676 931.787,572.342 926.5,571.5C 926.5,569.5 926.5,567.5 926.5,565.5C 926.5,564.167 926.5,562.833 926.5,561.5C 927.167,561.5 927.5,561.167 927.5,560.5C 929.228,561.379 931.061,562.046 933,562.5C 934.8,561.622 936.633,560.955 938.5,560.5C 938.169,557.175 937.836,553.841 937.5,550.5C 937.556,548.36 938.223,546.694 939.5,545.5C 939.254,547.78 939.254,549.78 939.5,551.5C 940.118,548.189 941.118,545.022 942.5,542C 941.978,541.05 941.311,540.216 940.5,539.5C 941.432,537.205 942.265,534.871 943,532.5C 946.979,528.806 948.479,524.139 947.5,518.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#07085f"
                  d="M 1165.5,531.5 C 1129.64,535.894 1093.8,540.56 1058,545.5C 1056.01,545.431 1054.51,544.765 1053.5,543.5C 1092.21,538.161 1130.87,533.661 1169.5,530C 1167.94,530.21 1166.61,530.71 1165.5,531.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#23137e"
                  d="M 1033.5,540.5 C 1033.5,543.5 1033.5,546.5 1033.5,549.5C 1032.5,549.5 1031.5,549.5 1030.5,549.5C 1030.21,547.723 1029.55,546.056 1028.5,544.5C 1029.05,542.865 1029.38,541.199 1029.5,539.5C 1030.16,537.958 1030.83,536.291 1031.5,534.5C 1032.17,536.631 1032.84,538.631 1033.5,540.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#0a0e45"
                  d="M 1258.5,524.5 C 1256.97,525.925 1257.3,526.591 1259.5,526.5C 1257.85,527.927 1255.85,528.76 1253.5,529C 1255.93,529.075 1256.6,529.908 1255.5,531.5C 1254.9,532.139 1254.07,532.472 1253,532.5C 1249.94,532.065 1249.77,531.232 1252.5,530C 1248.17,529.333 1243.83,529.333 1239.5,530C 1234.74,532.522 1229.74,534.522 1224.5,536C 1210.66,538.571 1196.66,540.071 1182.5,540.5C 1176.5,541.491 1170.84,543.325 1165.5,546C 1151.23,547.992 1136.89,549.325 1122.5,550C 1111.95,552.54 1101.28,554.874 1090.5,557C 1083.21,558.116 1075.87,558.616 1068.5,558.5C 1077.54,555.892 1086.87,554.059 1096.5,553C 1103.92,549.78 1111.58,547.613 1119.5,546.5C 1130.05,544.822 1140.72,542.989 1151.5,541C 1175.02,538.242 1198.35,534.909 1221.5,531C 1233.13,529.421 1244.8,528.254 1256.5,527.5C 1256.29,525.821 1256.95,524.821 1258.5,524.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#04033c"
                  d="M 926.5,544.5 C 926.209,545.649 925.376,546.316 924,546.5C 882.506,541.056 841.006,535.722 799.5,530.5C 799.082,529.778 798.416,529.278 797.5,529C 798.5,528.833 799.5,528.667 800.5,528.5C 842.488,534.165 884.488,539.498 926.5,544.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3232a4"
                  d="M 1328.5,532.5 C 1284.15,538.761 1239.81,545.095 1195.5,551.5C 1193.5,551.5 1191.5,551.5 1189.5,551.5C 1189.5,550.5 1189.5,549.5 1189.5,548.5C 1193.77,547.479 1197.94,546.146 1202,544.5C 1203.24,544.461 1204.58,544.795 1206,545.5C 1206.95,544.978 1207.78,544.311 1208.5,543.5C 1211.79,544.449 1215.13,544.449 1218.5,543.5C 1218.5,544.5 1218.5,545.5 1218.5,546.5C 1219.55,546.649 1220.55,546.483 1221.5,546C 1219.96,544.89 1219.3,543.39 1219.5,541.5C 1240.13,538.562 1260.8,535.729 1281.5,533C 1282.74,532.768 1283.74,532.268 1284.5,531.5C 1286.61,530.532 1288.94,530.198 1291.5,530.5C 1301.4,529.444 1311.23,529.444 1321,530.5C 1322,529.833 1323,529.167 1324,528.5C 1325.54,529.285 1327.21,529.285 1329,528.5C 1330.4,528.509 1331.57,529.009 1332.5,530C 1331.14,530.934 1329.81,531.768 1328.5,532.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#09082e"
                  d="M 926.5,561.5 C 926.5,562.833 926.5,564.167 926.5,565.5C 925.751,564.469 925.085,563.302 924.5,562C 920.217,561.461 916.217,560.128 912.5,558C 893.812,556.234 875.145,554.234 856.5,552C 847.687,549.407 838.687,547.74 829.5,547C 815.43,546.529 801.43,545.362 787.5,543.5C 780.395,543.336 773.395,544.002 766.5,545.5C 765.808,546.025 765.308,546.692 765,547.5C 763.111,546.903 761.278,546.569 759.5,546.5C 758.478,546.855 757.811,547.522 757.5,548.5C 753.64,548.192 749.974,547.525 746.5,546.5C 746.082,545.778 745.416,545.278 744.5,545C 746.433,544.749 748.266,544.249 750,543.5C 750.333,544.167 750.667,544.833 751,545.5C 752.236,543.462 754.069,542.295 756.5,542C 777.878,541.154 799.212,541.821 820.5,544C 854.663,549.075 888.83,553.908 923,558.5C 923.414,558.043 923.914,557.709 924.5,557.5C 925.362,558.766 926.029,560.099 926.5,561.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#050421"
                  d="M 927.5,560.5 C 927.5,561.167 927.167,561.5 926.5,561.5C 926.029,560.099 925.362,558.766 924.5,557.5C 923.914,557.709 923.414,558.043 923,558.5C 888.83,553.908 854.663,549.075 820.5,544C 799.212,541.821 777.878,541.154 756.5,542C 754.069,542.295 752.236,543.462 751,545.5C 750.667,544.833 750.333,544.167 750,543.5C 748.266,544.249 746.433,544.749 744.5,545C 745.416,545.278 746.082,545.778 746.5,546.5C 742.593,546.487 738.926,545.653 735.5,544C 736.253,542.513 737.086,542.346 738,543.5C 739.333,541.833 740.667,540.167 742,538.5C 742.333,539.167 742.667,539.833 743,540.5C 747.481,538.948 752.147,538.281 757,538.5C 772.162,539.133 787.329,539.633 802.5,540C 843.181,545.168 883.847,550.502 924.5,556C 926.117,557.092 927.117,558.592 927.5,560.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#222039"
                  d="M 1034.5,529.5 C 1034.5,532.833 1034.5,536.167 1034.5,539.5C 1037.41,539.957 1040.07,540.957 1042.5,542.5C 1042.77,544.099 1042.43,545.432 1041.5,546.5C 1039.5,546.5 1038.5,547.5 1038.5,549.5C 1036.83,548.167 1035.17,548.167 1033.5,549.5C 1033.5,546.5 1033.5,543.5 1033.5,540.5C 1033.19,536.629 1033.52,532.962 1034.5,529.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#0d105a"
                  d="M 946.5,548.5 C 946.325,550.621 946.659,552.621 947.5,554.5C 947.103,555.525 946.437,555.692 945.5,555C 941.886,553.356 941.219,551.189 943.5,548.5C 942.167,547.38 941.667,546.047 942,544.5C 943.992,545.328 945.492,546.661 946.5,548.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#525252"
                  d="M 574.5,545.5 C 575.859,546.007 576.859,547.007 577.5,548.5C 578.478,548.023 579.311,547.357 580,546.5C 580.743,548.441 580.576,550.274 579.5,552C 578.216,552.684 577.049,552.517 576,551.5C 575.187,549.564 574.687,547.564 574.5,545.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#303097"
                  d="M 1284.5,531.5 C 1283.74,532.268 1282.74,532.768 1281.5,533C 1260.8,535.729 1240.13,538.562 1219.5,541.5C 1219.3,543.39 1219.96,544.89 1221.5,546C 1220.55,546.483 1219.55,546.649 1218.5,546.5C 1218.5,545.5 1218.5,544.5 1218.5,543.5C 1215.13,544.449 1211.79,544.449 1208.5,543.5C 1207.78,544.311 1206.95,544.978 1206,545.5C 1204.58,544.795 1203.24,544.461 1202,544.5C 1197.94,546.146 1193.77,547.479 1189.5,548.5C 1189.5,549.5 1189.5,550.5 1189.5,551.5C 1191.5,551.5 1193.5,551.5 1195.5,551.5C 1183.03,553.95 1170.36,555.95 1157.5,557.5C 1159.41,556.518 1161.41,555.518 1163.5,554.5C 1160.39,553.017 1157.56,553.35 1155,555.5C 1154.11,554.919 1153.11,554.585 1152,554.5C 1138.9,556.392 1126.06,558.392 1113.5,560.5C 1112.81,561.025 1112.31,561.692 1112,562.5C 1106.78,561.21 1101.61,561.21 1096.5,562.5C 1096.5,563.5 1096.5,564.5 1096.5,565.5C 1097.5,565.5 1098.5,565.5 1099.5,565.5C 1088.68,567.522 1077.68,569.189 1066.5,570.5C 1065.71,570.217 1065.04,569.717 1064.5,569C 1066.74,566.733 1069.4,565.066 1072.5,564C 1073.6,563.23 1073.6,562.397 1072.5,561.5C 1073.5,561.167 1074.17,560.5 1074.5,559.5C 1074.91,560.762 1075.24,562.095 1075.5,563.5C 1076.35,562.478 1077.35,561.645 1078.5,561C 1114.03,555.266 1149.7,550.266 1185.5,546C 1189.8,545.193 1193.47,543.36 1196.5,540.5C 1197.69,541.777 1199.36,542.444 1201.5,542.5C 1203.64,542.444 1205.31,541.777 1206.5,540.5C 1207.65,541.895 1208.65,541.728 1209.5,540C 1215.44,538.613 1221.44,537.613 1227.5,537C 1233.23,535.327 1238.73,533.16 1244,530.5C 1245.4,530.509 1246.57,531.009 1247.5,532C 1245.91,532.862 1244.25,533.529 1242.5,534C 1256.53,533.878 1270.53,533.045 1284.5,531.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4141fe"
                  d="M 1196.5,540.5 C 1199.83,540.5 1203.17,540.5 1206.5,540.5C 1205.31,541.777 1203.64,542.444 1201.5,542.5C 1199.36,542.444 1197.69,541.777 1196.5,540.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1515a4"
                  d="M 1041.5,546.5 C 1042.08,550.08 1041.08,553.08 1038.5,555.5C 1037.89,555.376 1037.56,555.043 1037.5,554.5C 1038.3,552.958 1038.63,551.292 1038.5,549.5C 1038.5,547.5 1039.5,546.5 1041.5,546.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#080a38"
                  d="M 1119.5,546.5 C 1111.58,547.613 1103.92,549.78 1096.5,553C 1086.87,554.059 1077.54,555.892 1068.5,558.5C 1067.21,558.263 1066.21,558.596 1065.5,559.5C 1065.17,559.5 1064.83,559.5 1064.5,559.5C 1055.44,559.23 1051.77,563.564 1053.5,572.5C 1053.17,572.5 1052.83,572.5 1052.5,572.5C 1052.7,566.491 1053.03,560.491 1053.5,554.5C 1075.5,551.723 1097.5,549.056 1119.5,546.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#8a8a8a"
                  d="M 1243.5,552.5 C 1249.95,551.605 1252.28,554.438 1250.5,561C 1249.17,597.153 1248.51,633.32 1248.5,669.5C 1247.26,670.602 1245.92,671.602 1244.5,672.5C 1243.75,671.624 1243.25,670.624 1243,669.5C 1240.88,674.447 1238.55,674.447 1236,669.5C 1233.03,673.301 1231.03,672.635 1230,667.5C 1229.09,668.328 1228.42,669.328 1228,670.5C 1227.03,668.122 1226.36,668.456 1226,671.5C 1224.16,669.546 1223.33,667.546 1223.5,665.5C 1222.74,666.628 1222.07,667.795 1221.5,669C 1225.52,671.65 1225.35,673.816 1221,675.5C 1220.5,675.333 1220,675.167 1219.5,675C 1220.63,674.76 1221.13,674.26 1221,673.5C 1219.28,672.15 1217.45,670.983 1215.5,670C 1215.45,667.941 1215.61,665.774 1216,663.5C 1214.85,664.458 1213.85,664.125 1213,662.5C 1210.96,663.285 1208.96,662.952 1207,661.5C 1206.61,662.428 1205.95,663.095 1205,663.5C 1203.42,661.971 1201.58,661.471 1199.5,662C 1200.28,663.073 1200.11,664.24 1199,665.5C 1198.31,664.182 1197.47,663.349 1196.5,663C 1197.96,660.748 1197.3,659.248 1194.5,658.5C 1195.63,656.471 1195.13,656.137 1193,657.5C 1191.67,656.167 1190.33,654.833 1189,653.5C 1187.98,656.089 1186.14,657.255 1183.5,657C 1181.62,654.057 1180.12,650.89 1179,647.5C 1178.89,650.447 1177.39,651.78 1174.5,651.5C 1174.65,650.448 1174.48,649.448 1174,648.5C 1172.25,649.299 1170.92,648.632 1170,646.5C 1169.59,646.957 1169.09,647.291 1168.5,647.5C 1168.17,646.833 1167.83,646.167 1167.5,645.5C 1166.91,645.709 1166.41,646.043 1166,646.5C 1165.54,645.256 1166.04,644.423 1167.5,644C 1166.85,642.391 1166.02,640.891 1165,639.5C 1164.12,641.513 1162.79,641.513 1161,639.5C 1160.19,641.901 1159.36,641.734 1158.5,639C 1155.86,638.677 1153.53,637.677 1151.5,636C 1152.17,635.667 1152.83,635.333 1153.5,635C 1152.1,634.405 1150.77,634.572 1149.5,635.5C 1148.75,634.624 1148.25,633.624 1148,632.5C 1146.16,633.833 1145.66,633.666 1146.5,632C 1145.76,630.961 1144.76,630.461 1143.5,630.5C 1142.19,629.768 1140.86,628.934 1139.5,628C 1141.6,627.444 1141.76,626.944 1140,626.5C 1138.4,628.064 1136.56,628.564 1134.5,628C 1136.71,627.612 1138.05,626.612 1138.5,625C 1136.61,623.899 1135.94,622.566 1136.5,621C 1135.39,620.362 1134.22,619.862 1133,619.5C 1130.68,621.628 1128.35,622.962 1126,623.5C 1124.59,622.213 1123.09,621.046 1121.5,620C 1121.83,619.667 1122.17,619.333 1122.5,619C 1121.81,617.933 1121.31,616.766 1121,615.5C 1120.58,616.756 1119.75,617.423 1118.5,617.5C 1116.53,613.681 1113.53,611.014 1109.5,609.5C 1105.99,608.607 1102.66,607.107 1099.5,605C 1100.17,604.667 1100.83,604.333 1101.5,604C 1100.17,602.16 1100.33,601.66 1102,602.5C 1102.5,602 1103,601.5 1103.5,601C 1102.32,600.033 1100.99,599.533 1099.5,599.5C 1100.62,598.402 1100.62,597.235 1099.5,596C 1099.91,595.055 1100.57,594.388 1101.5,594C 1099.67,592.833 1097.83,591.667 1096,590.5C 1095.75,585.961 1095.25,581.461 1094.5,577C 1095.35,575.229 1096.68,574.063 1098.5,573.5C 1103.58,571.922 1108.92,571.255 1114.5,571.5C 1130.08,569.894 1145.42,567.561 1160.5,564.5C 1175.23,561.945 1189.9,559.445 1204.5,557C 1217.43,554.796 1230.43,553.296 1243.5,552.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#0f1045"
                  d="M 926.5,565.5 C 926.5,567.5 926.5,569.5 926.5,571.5C 921.32,571.153 916.32,570.487 911.5,569.5C 912.833,569.5 914.167,569.5 915.5,569.5C 915.657,568.127 915.49,566.793 915,565.5C 912.798,564.087 910.632,562.587 908.5,561C 890.306,557.721 871.973,555.054 853.5,553C 853,552.5 852.5,552 852,551.5C 848.75,551.368 845.75,551.701 843,552.5C 837.912,551.467 832.745,550.633 827.5,550C 813.543,549.539 799.876,549.873 786.5,551C 787.056,551.383 787.389,551.883 787.5,552.5C 777.478,551.331 767.478,549.997 757.5,548.5C 757.811,547.522 758.478,546.855 759.5,546.5C 761.278,546.569 763.111,546.903 765,547.5C 765.308,546.692 765.808,546.025 766.5,545.5C 773.395,544.002 780.395,543.336 787.5,543.5C 801.43,545.362 815.43,546.529 829.5,547C 838.687,547.74 847.687,549.407 856.5,552C 875.145,554.234 893.812,556.234 912.5,558C 916.217,560.128 920.217,561.461 924.5,562C 925.085,563.302 925.751,564.469 926.5,565.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#18186e"
                  d="M 843.5,554.5 C 845.988,556.388 848.988,557.055 852.5,556.5C 852.369,557.376 852.702,558.043 853.5,558.5C 856.993,556.672 860.493,556.005 864,556.5C 876.965,557.966 889.465,561.299 901.5,566.5C 904.026,565.609 906.359,566.109 908.5,568C 904.559,567.733 900.559,567.566 896.5,567.5C 876.141,565.02 855.808,562.353 835.5,559.5C 834.737,558.732 833.737,558.232 832.5,558C 833,557.5 833.5,557 834,556.5C 835.667,556.833 837.333,557.167 839,557.5C 840.615,556.614 842.115,555.614 843.5,554.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3a3afb"
                  d="M 1064.5,559.5 C 1064.83,559.5 1065.17,559.5 1065.5,559.5C 1068.5,559.5 1071.5,559.5 1074.5,559.5C 1074.17,560.5 1073.5,561.167 1072.5,561.5C 1070.14,561.663 1067.81,561.497 1065.5,561C 1064.94,560.617 1064.61,560.117 1064.5,559.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#16165e"
                  d="M 911.5,569.5 C 906.29,569.392 901.29,568.725 896.5,567.5C 900.559,567.566 904.559,567.733 908.5,568C 906.359,566.109 904.026,565.609 901.5,566.5C 889.465,561.299 876.965,557.966 864,556.5C 860.493,556.005 856.993,556.672 853.5,558.5C 852.702,558.043 852.369,557.376 852.5,556.5C 853.289,556.217 853.956,555.717 854.5,555C 850.848,554.501 847.182,554.335 843.5,554.5C 842.115,555.614 840.615,556.614 839,557.5C 837.333,557.167 835.667,556.833 834,556.5C 833.5,557 833,557.5 832.5,558C 833.737,558.232 834.737,558.732 835.5,559.5C 819.365,557.159 803.365,554.826 787.5,552.5C 787.389,551.883 787.056,551.383 786.5,551C 799.876,549.873 813.543,549.539 827.5,550C 832.745,550.633 837.912,551.467 843,552.5C 845.75,551.701 848.75,551.368 852,551.5C 852.5,552 853,552.5 853.5,553C 871.973,555.054 890.306,557.721 908.5,561C 910.632,562.587 912.798,564.087 915,565.5C 915.49,566.793 915.657,568.127 915.5,569.5C 914.167,569.5 912.833,569.5 911.5,569.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3030f5"
                  d="M 843.5,554.5 C 847.182,554.335 850.848,554.501 854.5,555C 853.956,555.717 853.289,556.217 852.5,556.5C 848.988,557.055 845.988,556.388 843.5,554.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3232af"
                  d="M 1157.5,557.5 C 1138.16,560.072 1118.83,562.738 1099.5,565.5C 1098.5,565.5 1097.5,565.5 1096.5,565.5C 1096.5,564.5 1096.5,563.5 1096.5,562.5C 1101.61,561.21 1106.78,561.21 1112,562.5C 1112.31,561.692 1112.81,561.025 1113.5,560.5C 1126.06,558.392 1138.9,556.392 1152,554.5C 1153.11,554.585 1154.11,554.919 1155,555.5C 1157.56,553.35 1160.39,553.017 1163.5,554.5C 1161.41,555.518 1159.41,556.518 1157.5,557.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#292976"
                  d="M 1064.5,559.5 C 1064.61,560.117 1064.94,560.617 1065.5,561C 1067.81,561.497 1070.14,561.663 1072.5,561.5C 1073.6,562.397 1073.6,563.23 1072.5,564C 1069.4,565.066 1066.74,566.733 1064.5,569C 1065.04,569.717 1065.71,570.217 1066.5,570.5C 1062.38,571.709 1058.05,572.376 1053.5,572.5C 1051.77,563.564 1055.44,559.23 1064.5,559.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#9f9e9f"
                  d="M 1493.5,465.5 C 1493.83,465.5 1494.17,465.5 1494.5,465.5C 1494.92,470.077 1494.92,475.077 1494.5,480.5C 1519.66,482.339 1545.33,484.839 1571.5,488C 1574.17,488.667 1576.83,489.333 1579.5,490C 1580.9,491.062 1581.9,492.395 1582.5,494C 1580.92,525.938 1579.76,558.104 1579,590.5C 1578.34,592.8 1577.84,595.133 1577.5,597.5C 1578.71,607.412 1578.71,616.745 1577.5,625.5C 1581,627.615 1584.67,629.448 1588.5,631C 1594.21,634.934 1596.54,640.434 1595.5,647.5C 1596.45,655.335 1594.12,661.835 1588.5,667C 1565.5,674.416 1542.17,680.583 1518.5,685.5C 1518.99,694.635 1518.16,703.635 1516,712.5C 1515.1,715.069 1513.93,717.402 1512.5,719.5C 1512.5,718.833 1512.5,718.167 1512.5,717.5C 1516.57,706.894 1518.23,695.894 1517.5,684.5C 1535.71,679.532 1554.04,675.032 1572.5,671C 1577.99,669.393 1583.32,667.393 1588.5,665C 1590.38,663.457 1591.88,661.624 1593,659.5C 1593.67,652.167 1593.67,644.833 1593,637.5C 1588.81,632.822 1583.64,629.822 1577.5,628.5C 1576.85,622.411 1576.52,616.244 1576.5,610C 1577.36,590.171 1578.03,570.338 1578.5,550.5C 1578.5,549.167 1578.5,547.833 1578.5,546.5C 1579.32,530.995 1579.99,515.329 1580.5,499.5C 1580.66,497.143 1580.5,494.81 1580,492.5C 1577.26,491.44 1574.43,490.606 1571.5,490C 1545.4,486.747 1519.4,483.914 1493.5,481.5C 1493.5,476.167 1493.5,470.833 1493.5,465.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#434344"
                  d="M 1258.5,563.5 C 1262.06,565.39 1262.39,567.89 1259.5,571C 1258.21,571.49 1256.87,571.657 1255.5,571.5C 1256.03,568.646 1257.03,565.979 1258.5,563.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#525252"
                  d="M 1160.5,564.5 C 1145.42,567.561 1130.08,569.894 1114.5,571.5C 1115.26,570.732 1116.26,570.232 1117.5,570C 1131.82,567.919 1146.15,566.085 1160.5,564.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4d4d4d"
                  d="M 723.5,566.5 C 724.161,567.718 724.828,569.051 725.5,570.5C 726.478,570.023 727.311,569.357 728,568.5C 729.259,574.419 727.426,575.752 722.5,572.5C 721.15,570.217 721.483,568.217 723.5,566.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#989796"
                  d="M 968.5,581.5 C 985.833,581.5 1003.17,581.5 1020.5,581.5C 1027.17,581.5 1033.83,581.5 1040.5,581.5C 1042.63,582.126 1044.29,583.459 1045.5,585.5C 1044.59,586.328 1043.92,587.328 1043.5,588.5C 1046.17,592.159 1045.5,595.326 1041.5,598C 1043,598.507 1044.16,598.007 1045,596.5C 1045.17,597 1045.33,597.5 1045.5,598C 1044.35,599.73 1044.35,601.396 1045.5,603C 1043.49,604.791 1043.49,606.125 1045.5,607C 1044.69,607.308 1044.03,607.808 1043.5,608.5C 1042.43,612.3 1042.43,616.133 1043.5,620C 1043.1,621.473 1042.43,622.806 1041.5,624C 1044.17,625 1044.17,626 1041.5,627C 1042.31,627.308 1042.97,627.808 1043.5,628.5C 1042.36,629.425 1042.36,630.259 1043.5,631C 1042.83,631.333 1042.17,631.667 1041.5,632C 1042.64,635.54 1043.31,639.207 1043.5,643C 1040.54,643.84 1040.2,644.84 1042.5,646C 1040.54,648.518 1039.87,651.184 1040.5,654C 1041.95,655.958 1042.29,657.958 1041.5,660C 1042.36,660.689 1043.02,661.522 1043.5,662.5C 1042.56,662.489 1041.89,662.989 1041.5,664C 1041.89,665.011 1042.56,665.511 1043.5,665.5C 1042.97,666.192 1042.31,666.692 1041.5,667C 1042.75,668.458 1042.75,669.958 1041.5,671.5C 1043.65,672.682 1043.65,674.182 1041.5,676C 1041.42,677.907 1041.75,679.907 1042.5,682C 1041.74,683.441 1041.07,684.941 1040.5,686.5C 1041,689.729 1041.66,692.896 1042.5,696C 1036.63,697.831 1034.97,701.331 1037.5,706.5C 1037.17,706.833 1036.83,707.167 1036.5,707.5C 1035.82,706.757 1035.15,706.091 1034.5,705.5C 1034.39,704.883 1034.06,704.383 1033.5,704C 1015.18,704.294 996.843,704.794 978.5,705.5C 970.715,705.715 963.049,705.048 955.5,703.5C 976.342,703.742 997.342,703.409 1018.5,702.5C 1018.34,701.127 1018.51,699.793 1019,698.5C 1019.72,699.451 1020.55,699.617 1021.5,699C 1020.95,697.602 1020.62,696.268 1020.5,695C 1021.17,694.667 1021.83,694.333 1022.5,694C 1021.26,692.33 1020.6,689.996 1020.5,687C 1022.34,684.858 1022.67,682.691 1021.5,680.5C 1022.8,677.887 1023.47,675.387 1023.5,673C 1022.83,672.333 1022.17,671.667 1021.5,671C 1025.5,670.333 1025.5,669.667 1021.5,669C 1024.05,666.274 1024.38,663.607 1022.5,661C 1022.89,659.989 1023.56,659.489 1024.5,659.5C 1024.02,658.522 1023.36,657.689 1022.5,657C 1024.96,655.488 1024.96,654.154 1022.5,653C 1024.92,651.112 1024.92,649.112 1022.5,647C 1023.17,646.667 1023.83,646.333 1024.5,646C 1022.11,645.309 1022.11,644.309 1024.5,643C 1023.85,639.642 1023.52,636.309 1023.5,633C 1024.17,632.333 1024.83,631.667 1025.5,631C 1023.29,628.737 1023.96,627.071 1027.5,626C 1026.17,625.333 1026.17,624.667 1027.5,624C 1023.54,622.789 1022.87,620.789 1025.5,618C 1022.02,617.187 1021.69,615.521 1024.5,613C 1023.5,612.167 1022.5,611.333 1021.5,610.5C 1022.83,610.167 1024.17,609.833 1025.5,609.5C 1025.19,608.692 1024.69,608.025 1024,607.5C 1023.28,608.451 1022.45,608.617 1021.5,608C 1022.69,606.647 1024.02,605.48 1025.5,604.5C 1024.36,603.575 1024.36,602.741 1025.5,602C 1023.49,601.125 1023.49,599.791 1025.5,598C 1024.76,596.235 1024.76,594.235 1025.5,592C 1023.17,590.638 1022.17,588.472 1022.5,585.5C 1024.1,585.688 1025.44,585.188 1026.5,584C 1025.83,583.667 1025.17,583.333 1024.5,583C 1005.66,582.832 986.996,582.332 968.5,581.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#555555"
                  d="M 893.5,591.5 C 894.85,592.483 895.85,593.816 896.5,595.5C 897.167,594.833 897.833,594.167 898.5,593.5C 899.363,595.771 899.363,598.105 898.5,600.5C 892.667,600.087 891.001,597.087 893.5,591.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#151515"
                  d="M 775.5,637.5 C 773.864,638.749 772.697,640.416 772,642.5C 770.871,644.141 769.371,645.141 767.5,645.5C 740.386,641.571 713.386,637.237 686.5,632.5C 680.061,626.196 678.894,618.863 683,610.5C 684.574,609.152 686.407,608.486 688.5,608.5C 714.742,613.582 741.075,618.082 767.5,622C 772.954,625.742 775.621,630.909 775.5,637.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3b3832"
                  d="M 1084.5,609.5 C 1085.83,609.5 1087.17,609.5 1088.5,609.5C 1088.17,610.167 1087.83,610.833 1087.5,611.5C 1085.98,611.511 1084.82,612.177 1084,613.5C 1079.45,620.254 1078.61,627.254 1081.5,634.5C 1082.87,636.25 1083.87,638.25 1084.5,640.5C 1082.59,639.925 1080.92,638.925 1079.5,637.5C 1077.03,633.905 1076.03,629.905 1076.5,625.5C 1075.67,618.279 1078.34,612.945 1084.5,609.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#7b7b1b"
                  d="M 1084.5,609.5 C 1078.34,612.945 1075.67,618.279 1076.5,625.5C 1073.45,627.113 1070.95,626.446 1069,623.5C 1068.41,625.863 1066.91,626.863 1064.5,626.5C 1064.5,624.167 1064.5,621.833 1064.5,619.5C 1067.04,607.598 1073.7,604.264 1084.5,609.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3b1414"
                  d="M 1109.5,609.5 C 1113.53,611.014 1116.53,613.681 1118.5,617.5C 1118.5,618.5 1118.5,619.5 1118.5,620.5C 1118.5,621.833 1118.5,623.167 1118.5,624.5C 1115.76,624.293 1113.43,623.293 1111.5,621.5C 1108.98,621.84 1107.82,623.174 1108,625.5C 1109.4,623.473 1111.06,623.14 1113,624.5C 1113.67,626.833 1113.67,629.167 1113,631.5C 1111.6,633.527 1109.94,633.86 1108,632.5C 1107.8,630.744 1107.3,629.078 1106.5,627.5C 1105,630.131 1104.33,629.797 1104.5,626.5C 1102.82,626.285 1101.82,626.952 1101.5,628.5C 1099.31,629.823 1097.81,631.823 1097,634.5C 1095.11,633.87 1093.44,632.87 1092,631.5C 1091.38,632.449 1091.55,633.282 1092.5,634C 1088.47,634.576 1084.81,633.742 1081.5,631.5C 1080.49,623.856 1082.49,617.189 1087.5,611.5C 1087.83,610.833 1088.17,610.167 1088.5,609.5C 1095.45,608.749 1102.45,608.749 1109.5,609.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#6f5d5d"
                  d="M 1108.5,615.5 C 1112.58,615.017 1114.91,616.684 1115.5,620.5C 1111.9,620.323 1108.56,620.823 1105.5,622C 1105.04,621.586 1104.71,621.086 1104.5,620.5C 1105.86,618.814 1107.19,617.148 1108.5,615.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#606061"
                  d="M 1536.5,623.5 C 1539.82,625.77 1540.48,628.77 1538.5,632.5C 1536.83,633.167 1535.17,633.833 1533.5,634.5C 1533.5,633.5 1533.5,632.5 1533.5,631.5C 1532.5,631.5 1531.5,631.5 1530.5,631.5C 1530.53,634.742 1529.2,635.075 1526.5,632.5C 1526.17,631.833 1525.83,631.167 1525.5,630.5C 1526.95,629.15 1527.62,627.484 1527.5,625.5C 1528.87,625.343 1530.21,625.51 1531.5,626C 1531.38,627.281 1531.88,628.448 1533,629.5C 1534.82,627.854 1535.99,625.854 1536.5,623.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#594d24"
                  d="M 1087.5,611.5 C 1082.49,617.189 1080.49,623.856 1081.5,631.5C 1081.5,632.5 1081.5,633.5 1081.5,634.5C 1078.61,627.254 1079.45,620.254 1084,613.5C 1084.82,612.177 1085.98,611.511 1087.5,611.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#615151"
                  d="M 1118.5,620.5 C 1119.83,624.833 1119.83,629.167 1118.5,633.5C 1118.65,632.448 1118.48,631.448 1118,630.5C 1117.17,634.166 1115.34,637.166 1112.5,639.5C 1111.27,638.349 1111.27,637.183 1112.5,636C 1109.23,636.063 1107.07,634.563 1106,631.5C 1106.95,634.358 1107.79,637.358 1108.5,640.5C 1106.1,640.607 1104.26,639.607 1103,637.5C 1101.85,634.607 1101.35,631.607 1101.5,628.5C 1101.82,626.952 1102.82,626.285 1104.5,626.5C 1104.33,629.797 1105,630.131 1106.5,627.5C 1107.3,629.078 1107.8,630.744 1108,632.5C 1109.94,633.86 1111.6,633.527 1113,631.5C 1113.67,629.167 1113.67,626.833 1113,624.5C 1111.06,623.14 1109.4,623.473 1108,625.5C 1107.82,623.174 1108.98,621.84 1111.5,621.5C 1113.43,623.293 1115.76,624.293 1118.5,624.5C 1118.5,623.167 1118.5,621.833 1118.5,620.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#5e5d17"
                  d="M 1064.5,619.5 C 1064.5,621.833 1064.5,624.167 1064.5,626.5C 1066.91,626.863 1068.41,625.863 1069,623.5C 1070.95,626.446 1073.45,627.113 1076.5,625.5C 1076.03,629.905 1077.03,633.905 1079.5,637.5C 1079.03,638.693 1078.03,639.36 1076.5,639.5C 1073.82,639.064 1071.15,638.564 1068.5,638C 1066.35,635.005 1064.68,631.838 1063.5,628.5C 1063.19,625.287 1063.52,622.287 1064.5,619.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#7c7b7b"
                  d="M 1143.5,630.5 C 1141.8,632.732 1140.64,635.399 1140,638.5C 1138.7,639.56 1137.54,640.726 1136.5,642C 1137.62,643.235 1137.62,644.402 1136.5,645.5C 1137.44,645.489 1138.11,645.989 1138.5,647C 1138.39,648.722 1137.89,648.888 1137,647.5C 1136.13,649.896 1136.63,650.563 1138.5,649.5C 1139.85,650.518 1140.85,651.851 1141.5,653.5C 1142.68,652.145 1143.68,652.312 1144.5,654C 1143.24,655.113 1142.07,655.28 1141,654.5C 1140.2,656.801 1140.7,658.968 1142.5,661C 1138.75,662.166 1137.75,664.5 1139.5,668C 1139.1,669.473 1138.43,670.806 1137.5,672C 1138.85,672.772 1139.68,673.939 1140,675.5C 1141.86,684.332 1139.2,686.999 1132,683.5C 1131.31,685.891 1130.31,685.891 1129,683.5C 1125.24,685.904 1121.74,688.57 1118.5,691.5C 1116.58,692.308 1114.58,692.808 1112.5,693C 1113.17,693.333 1113.83,693.667 1114.5,694C 1111.79,695.805 1109.12,695.805 1106.5,694C 1107.52,692.951 1107.68,691.784 1107,690.5C 1105.75,693.816 1104.08,694.15 1102,691.5C 1100.77,693.947 1099.27,694.113 1097.5,692C 1101.68,690.604 1102.01,689.104 1098.5,687.5C 1097.61,686.675 1097.28,685.675 1097.5,684.5C 1095.88,684.36 1094.71,685.027 1094,686.5C 1093.83,677.814 1093.33,669.148 1092.5,660.5C 1091.18,657.972 1090.02,657.972 1089,660.5C 1087,659.833 1085.67,658.5 1085,656.5C 1082.56,657.906 1080.06,659.24 1077.5,660.5C 1073.13,657.601 1069.46,654.601 1066.5,651.5C 1067.43,649.678 1066.76,648.345 1064.5,647.5C 1066.45,645.332 1067.12,642.998 1066.5,640.5C 1065.08,636.591 1064.08,632.591 1063.5,628.5C 1064.68,631.838 1066.35,635.005 1068.5,638C 1071.15,638.564 1073.82,639.064 1076.5,639.5C 1078.03,639.36 1079.03,638.693 1079.5,637.5C 1080.92,638.925 1082.59,639.925 1084.5,640.5C 1091.99,644.047 1099.99,645.713 1108.5,645.5C 1109.38,645.369 1110.04,645.702 1110.5,646.5C 1109.12,649.547 1106.79,650.88 1103.5,650.5C 1103.65,649.448 1103.48,648.448 1103,647.5C 1099.14,655.524 1098.48,663.857 1101,672.5C 1108.39,681.624 1115.22,681.124 1121.5,671C 1126.83,659.212 1124.83,649.045 1115.5,640.5C 1116.69,638.249 1117.69,635.915 1118.5,633.5C 1119.83,629.167 1119.83,624.833 1118.5,620.5C 1118.5,619.5 1118.5,618.5 1118.5,617.5C 1119.75,617.423 1120.58,616.756 1121,615.5C 1121.31,616.766 1121.81,617.933 1122.5,619C 1122.17,619.333 1121.83,619.667 1121.5,620C 1123.09,621.046 1124.59,622.213 1126,623.5C 1128.35,622.962 1130.68,621.628 1133,619.5C 1134.22,619.862 1135.39,620.362 1136.5,621C 1135.94,622.566 1136.61,623.899 1138.5,625C 1138.05,626.612 1136.71,627.612 1134.5,628C 1136.56,628.564 1138.4,628.064 1140,626.5C 1141.76,626.944 1141.6,627.444 1139.5,628C 1140.86,628.934 1142.19,629.768 1143.5,630.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#868585"
                  d="M 1098.5,573.5 C 1096.68,574.063 1095.35,575.229 1094.5,577C 1095.25,581.461 1095.75,585.961 1096,590.5C 1097.83,591.667 1099.67,592.833 1101.5,594C 1100.57,594.388 1099.91,595.055 1099.5,596C 1100.62,597.235 1100.62,598.402 1099.5,599.5C 1100.99,599.533 1102.32,600.033 1103.5,601C 1103,601.5 1102.5,602 1102,602.5C 1100.33,601.66 1100.17,602.16 1101.5,604C 1100.83,604.333 1100.17,604.667 1099.5,605C 1102.66,607.107 1105.99,608.607 1109.5,609.5C 1102.45,608.749 1095.45,608.749 1088.5,609.5C 1087.17,609.5 1085.83,609.5 1084.5,609.5C 1073.7,604.264 1067.04,607.598 1064.5,619.5C 1063.52,622.287 1063.19,625.287 1063.5,628.5C 1064.08,632.591 1065.08,636.591 1066.5,640.5C 1067.12,642.998 1066.45,645.332 1064.5,647.5C 1066.76,648.345 1067.43,649.678 1066.5,651.5C 1069.46,654.601 1073.13,657.601 1077.5,660.5C 1080.06,659.24 1082.56,657.906 1085,656.5C 1085.67,658.5 1087,659.833 1089,660.5C 1090.02,657.972 1091.18,657.972 1092.5,660.5C 1093.33,669.148 1093.83,677.814 1094,686.5C 1094.71,685.027 1095.88,684.36 1097.5,684.5C 1097.28,685.675 1097.61,686.675 1098.5,687.5C 1102.01,689.104 1101.68,690.604 1097.5,692C 1099.27,694.113 1100.77,693.947 1102,691.5C 1104.08,694.15 1105.75,693.816 1107,690.5C 1107.68,691.784 1107.52,692.951 1106.5,694C 1109.12,695.805 1111.79,695.805 1114.5,694C 1113.83,693.667 1113.17,693.333 1112.5,693C 1114.58,692.808 1116.58,692.308 1118.5,691.5C 1121.74,688.57 1125.24,685.904 1129,683.5C 1130.31,685.891 1131.31,685.891 1132,683.5C 1139.2,686.999 1141.86,684.332 1140,675.5C 1139.68,673.939 1138.85,672.772 1137.5,672C 1138.43,670.806 1139.1,669.473 1139.5,668C 1137.75,664.5 1138.75,662.166 1142.5,661C 1140.7,658.968 1140.2,656.801 1141,654.5C 1142.07,655.28 1143.24,655.113 1144.5,654C 1143.68,652.312 1142.68,652.145 1141.5,653.5C 1140.85,651.851 1139.85,650.518 1138.5,649.5C 1136.63,650.563 1136.13,649.896 1137,647.5C 1137.89,648.888 1138.39,648.722 1138.5,647C 1138.11,645.989 1137.44,645.489 1136.5,645.5C 1137.62,644.402 1137.62,643.235 1136.5,642C 1137.54,640.726 1138.7,639.56 1140,638.5C 1140.64,635.399 1141.8,632.732 1143.5,630.5C 1144.76,630.461 1145.76,630.961 1146.5,632C 1145.66,633.666 1146.16,633.833 1148,632.5C 1148.25,633.624 1148.75,634.624 1149.5,635.5C 1150.77,634.572 1152.1,634.405 1153.5,635C 1152.83,635.333 1152.17,635.667 1151.5,636C 1153.53,637.677 1155.86,638.677 1158.5,639C 1159.36,641.734 1160.19,641.901 1161,639.5C 1162.79,641.513 1164.12,641.513 1165,639.5C 1166.02,640.891 1166.85,642.391 1167.5,644C 1166.04,644.423 1165.54,645.256 1166,646.5C 1166.41,646.043 1166.91,645.709 1167.5,645.5C 1167.83,646.167 1168.17,646.833 1168.5,647.5C 1169.09,647.291 1169.59,646.957 1170,646.5C 1170.92,648.632 1172.25,649.299 1174,648.5C 1174.48,649.448 1174.65,650.448 1174.5,651.5C 1177.39,651.78 1178.89,650.447 1179,647.5C 1180.12,650.89 1181.62,654.057 1183.5,657C 1186.14,657.255 1187.98,656.089 1189,653.5C 1190.33,654.833 1191.67,656.167 1193,657.5C 1195.13,656.137 1195.63,656.471 1194.5,658.5C 1197.3,659.248 1197.96,660.748 1196.5,663C 1197.47,663.349 1198.31,664.182 1199,665.5C 1200.11,664.24 1200.28,663.073 1199.5,662C 1201.58,661.471 1203.42,661.971 1205,663.5C 1205.95,663.095 1206.61,662.428 1207,661.5C 1208.96,662.952 1210.96,663.285 1213,662.5C 1213.85,664.125 1214.85,664.458 1216,663.5C 1215.61,665.774 1215.45,667.941 1215.5,670C 1217.45,670.983 1219.28,672.15 1221,673.5C 1221.13,674.26 1220.63,674.76 1219.5,675C 1220,675.167 1220.5,675.333 1221,675.5C 1225.35,673.816 1225.52,671.65 1221.5,669C 1222.07,667.795 1222.74,666.628 1223.5,665.5C 1223.33,667.546 1224.16,669.546 1226,671.5C 1226.36,668.456 1227.03,668.122 1228,670.5C 1228.42,669.328 1229.09,668.328 1230,667.5C 1231.03,672.635 1233.03,673.301 1236,669.5C 1238.55,674.447 1240.88,674.447 1243,669.5C 1243.25,670.624 1243.75,671.624 1244.5,672.5C 1245.92,671.602 1247.26,670.602 1248.5,669.5C 1247.99,694.165 1247.49,718.831 1247,743.5C 1237.27,743.301 1228.1,745.468 1219.5,750C 1207.4,751.876 1195.4,754.042 1183.5,756.5C 1183.67,750.824 1183.5,745.157 1183,739.5C 1179.34,735.897 1174.84,734.231 1169.5,734.5C 1166.82,734.837 1164.16,735.17 1161.5,735.5C 1161.5,732.833 1161.5,730.167 1161.5,727.5C 1159.07,727.523 1156.74,728.023 1154.5,729C 1152.08,731.094 1149.41,732.76 1146.5,734C 1127.81,737.698 1109.48,742.198 1091.5,747.5C 1076.38,750.854 1061.38,754.187 1046.5,757.5C 1045.17,757.5 1043.83,757.5 1042.5,757.5C 1044.3,756.307 1045.97,755.14 1047.5,754C 1046.86,751.071 1047.86,748.571 1050.5,746.5C 1050.38,744.622 1050.38,742.789 1050.5,741C 1052.83,739.757 1053.5,738.091 1052.5,736C 1053.13,734.108 1054.13,732.441 1055.5,731C 1054.07,729.286 1054.41,727.953 1056.5,727C 1056.43,722.41 1056.1,718.077 1055.5,714C 1056.49,710.79 1057.16,707.79 1057.5,705C 1056.83,703.667 1056.17,702.333 1055.5,701C 1057.81,699.207 1058.14,697.04 1056.5,694.5C 1056.98,693.522 1057.64,692.689 1058.5,692C 1057.79,689.204 1057.12,686.37 1056.5,683.5C 1056.98,682.522 1057.64,681.689 1058.5,681C 1058.01,675.492 1057.68,669.992 1057.5,664.5C 1058.03,663.808 1058.69,663.308 1059.5,663C 1060.11,660.816 1059.44,658.816 1057.5,657C 1058.79,654.534 1058.79,652.034 1057.5,649.5C 1058.12,646.961 1058.78,644.461 1059.5,642C 1058.33,640.132 1058.67,638.298 1060.5,636.5C 1060.69,629.15 1060.69,621.983 1060.5,615C 1061.17,614.333 1061.83,613.667 1062.5,613C 1061.31,608.935 1062.64,605.268 1066.5,602C 1065.67,601.085 1064.67,600.419 1063.5,600C 1064.17,599.667 1064.83,599.333 1065.5,599C 1064.17,598 1064.17,597 1065.5,596C 1064.28,593.904 1063.45,594.071 1063,596.5C 1062.34,594.892 1062.84,593.725 1064.5,593C 1063.74,591.488 1062.74,590.154 1061.5,589C 1063.07,587.174 1063.91,585.007 1064,582.5C 1064.09,585.849 1065.26,586.349 1067.5,584C 1066,581.833 1064.17,580 1062,578.5C 1060.78,581.351 1059.28,584.018 1057.5,586.5C 1057.83,589.167 1058.17,591.833 1058.5,594.5C 1057.2,596.336 1056.37,598.336 1056,600.5C 1055.53,599.069 1054.7,597.903 1053.5,597C 1054.17,596 1054.83,595 1055.5,594C 1054.98,591.974 1054.65,589.974 1054.5,588C 1056.41,586.144 1057.24,583.977 1057,581.5C 1052.22,580.383 1046.72,580.383 1040.5,581.5C 1033.83,581.5 1027.17,581.5 1020.5,581.5C 1046.41,579.242 1072.41,576.575 1098.5,573.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#47453f"
                  d="M 1084.5,590.5 C 1086.44,591.014 1087.44,592.347 1087.5,594.5C 1086.95,596.135 1086.62,597.801 1086.5,599.5C 1084.83,599.5 1083.17,599.5 1081.5,599.5C 1081.67,598.178 1081.34,597.011 1080.5,596C 1082.3,594.469 1083.63,592.636 1084.5,590.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#060606"
                  d="M 1577.5,628.5 C 1583.64,629.822 1588.81,632.822 1593,637.5C 1593.67,644.833 1593.67,652.167 1593,659.5C 1591.88,661.624 1590.38,663.457 1588.5,665C 1583.32,667.393 1577.99,669.393 1572.5,671C 1554.04,675.032 1535.71,679.532 1517.5,684.5C 1515.83,684.5 1514.17,684.5 1512.5,684.5C 1510.62,683.659 1508.62,683.325 1506.5,683.5C 1506.34,677.833 1506,677.5 1505.5,682.5C 1503.19,682.007 1500.86,681.674 1498.5,681.5C 1498.5,679.5 1498.5,677.5 1498.5,675.5C 1503.04,675.948 1507.37,675.281 1511.5,673.5C 1512.52,672.998 1512.69,672.332 1512,671.5C 1506.59,670.527 1501.09,670.193 1495.5,670.5C 1497.56,665.628 1498.89,660.628 1499.5,655.5C 1501.48,657.168 1503.81,657.834 1506.5,657.5C 1507.04,661.172 1507.38,660.838 1507.5,656.5C 1526.77,652.016 1546.1,647.85 1565.5,644C 1569.32,642.723 1572.99,641.057 1576.5,639C 1574.62,639.096 1572.95,638.929 1571.5,638.5C 1573.73,637.772 1575.57,636.439 1577,634.5C 1577.33,634.833 1577.67,635.167 1578,635.5C 1577.89,633.822 1577.39,632.155 1576.5,630.5C 1576.54,629.584 1576.88,628.917 1577.5,628.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2e2e2e"
                  d="M 686.5,632.5 C 713.386,637.237 740.386,641.571 767.5,645.5C 765.59,646.684 765.257,648.184 766.5,650C 765.906,650.464 765.239,650.631 764.5,650.5C 739.146,646.14 713.813,641.64 688.5,637C 687.733,635.53 687.067,634.03 686.5,632.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2d1314"
                  d="M 1101.5,628.5 C 1101.35,631.607 1101.85,634.607 1103,637.5C 1104.26,639.607 1106.1,640.607 1108.5,640.5C 1107.79,637.358 1106.95,634.358 1106,631.5C 1107.07,634.563 1109.23,636.063 1112.5,636C 1111.27,637.183 1111.27,638.349 1112.5,639.5C 1115.34,637.166 1117.17,634.166 1118,630.5C 1118.48,631.448 1118.65,632.448 1118.5,633.5C 1117.69,635.915 1116.69,638.249 1115.5,640.5C 1113.4,642.616 1111.07,644.283 1108.5,645.5C 1099.99,645.713 1091.99,644.047 1084.5,640.5C 1083.87,638.25 1082.87,636.25 1081.5,634.5C 1081.5,633.5 1081.5,632.5 1081.5,631.5C 1084.81,633.742 1088.47,634.576 1092.5,634C 1091.55,633.282 1091.38,632.449 1092,631.5C 1093.44,632.87 1095.11,633.87 1097,634.5C 1097.81,631.823 1099.31,629.823 1101.5,628.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#8f8e8d"
                  d="M 1042.5,757.5 C 1016.42,760.555 990.416,761.222 964.5,759.5C 976.5,759.5 988.5,759.5 1000.5,759.5C 1000.28,758.325 1000.61,757.325 1001.5,756.5C 1002.72,757.711 1003.89,757.711 1005,756.5C 1007.07,759.014 1008.57,758.848 1009.5,756C 1012.56,755.849 1014.89,754.515 1016.5,752C 1016.17,751.667 1015.83,751.333 1015.5,751C 1017.71,749.491 1019.54,747.658 1021,745.5C 1022.84,746.833 1023.34,746.666 1022.5,745C 1024.68,742.489 1027.18,740.322 1030,738.5C 1030.68,737.216 1030.52,736.049 1029.5,735C 1031.17,733.494 1032.17,731.661 1032.5,729.5C 1033.55,729.649 1034.55,729.483 1035.5,729C 1034.75,727.266 1034.25,725.433 1034,723.5C 1033.33,722.167 1032.67,722.167 1032,723.5C 1031.33,722.5 1031.33,721.5 1032,720.5C 1032.89,721.711 1033.73,721.711 1034.5,720.5C 1033.33,719.416 1032,718.583 1030.5,718C 1024.84,717.501 1019.18,717.334 1013.5,717.5C 1019.76,716.918 1026.09,716.085 1032.5,715C 1034.34,712.174 1035.01,709.007 1034.5,705.5C 1035.15,706.091 1035.82,706.757 1036.5,707.5C 1036.83,707.167 1037.17,706.833 1037.5,706.5C 1034.97,701.331 1036.63,697.831 1042.5,696C 1041.66,692.896 1041,689.729 1040.5,686.5C 1041.07,684.941 1041.74,683.441 1042.5,682C 1041.75,679.907 1041.42,677.907 1041.5,676C 1043.65,674.182 1043.65,672.682 1041.5,671.5C 1042.75,669.958 1042.75,668.458 1041.5,667C 1042.31,666.692 1042.97,666.192 1043.5,665.5C 1042.56,665.511 1041.89,665.011 1041.5,664C 1041.89,662.989 1042.56,662.489 1043.5,662.5C 1043.02,661.522 1042.36,660.689 1041.5,660C 1042.29,657.958 1041.95,655.958 1040.5,654C 1039.87,651.184 1040.54,648.518 1042.5,646C 1040.2,644.84 1040.54,643.84 1043.5,643C 1043.31,639.207 1042.64,635.54 1041.5,632C 1042.17,631.667 1042.83,631.333 1043.5,631C 1042.36,630.259 1042.36,629.425 1043.5,628.5C 1042.97,627.808 1042.31,627.308 1041.5,627C 1044.17,626 1044.17,625 1041.5,624C 1042.43,622.806 1043.1,621.473 1043.5,620C 1042.43,616.133 1042.43,612.3 1043.5,608.5C 1044.03,607.808 1044.69,607.308 1045.5,607C 1043.49,606.125 1043.49,604.791 1045.5,603C 1044.35,601.396 1044.35,599.73 1045.5,598C 1045.33,597.5 1045.17,597 1045,596.5C 1044.16,598.007 1043,598.507 1041.5,598C 1045.5,595.326 1046.17,592.159 1043.5,588.5C 1043.92,587.328 1044.59,586.328 1045.5,585.5C 1044.29,583.459 1042.63,582.126 1040.5,581.5C 1046.72,580.383 1052.22,580.383 1057,581.5C 1057.24,583.977 1056.41,586.144 1054.5,588C 1054.65,589.974 1054.98,591.974 1055.5,594C 1054.83,595 1054.17,596 1053.5,597C 1054.7,597.903 1055.53,599.069 1056,600.5C 1056.37,598.336 1057.2,596.336 1058.5,594.5C 1058.17,591.833 1057.83,589.167 1057.5,586.5C 1059.28,584.018 1060.78,581.351 1062,578.5C 1064.17,580 1066,581.833 1067.5,584C 1065.26,586.349 1064.09,585.849 1064,582.5C 1063.91,585.007 1063.07,587.174 1061.5,589C 1062.74,590.154 1063.74,591.488 1064.5,593C 1062.84,593.725 1062.34,594.892 1063,596.5C 1063.45,594.071 1064.28,593.904 1065.5,596C 1064.17,597 1064.17,598 1065.5,599C 1064.83,599.333 1064.17,599.667 1063.5,600C 1064.67,600.419 1065.67,601.085 1066.5,602C 1062.64,605.268 1061.31,608.935 1062.5,613C 1061.83,613.667 1061.17,614.333 1060.5,615C 1060.69,621.983 1060.69,629.15 1060.5,636.5C 1058.67,638.298 1058.33,640.132 1059.5,642C 1058.78,644.461 1058.12,646.961 1057.5,649.5C 1058.79,652.034 1058.79,654.534 1057.5,657C 1059.44,658.816 1060.11,660.816 1059.5,663C 1058.69,663.308 1058.03,663.808 1057.5,664.5C 1057.68,669.992 1058.01,675.492 1058.5,681C 1057.64,681.689 1056.98,682.522 1056.5,683.5C 1057.12,686.37 1057.79,689.204 1058.5,692C 1057.64,692.689 1056.98,693.522 1056.5,694.5C 1058.14,697.04 1057.81,699.207 1055.5,701C 1056.17,702.333 1056.83,703.667 1057.5,705C 1057.16,707.79 1056.49,710.79 1055.5,714C 1056.1,718.077 1056.43,722.41 1056.5,727C 1054.41,727.953 1054.07,729.286 1055.5,731C 1054.13,732.441 1053.13,734.108 1052.5,736C 1053.5,738.091 1052.83,739.757 1050.5,741C 1050.38,742.789 1050.38,744.622 1050.5,746.5C 1047.86,748.571 1046.86,751.071 1047.5,754C 1045.97,755.14 1044.3,756.307 1042.5,757.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#5b5c5d"
                  d="M 775.5,637.5 C 775.569,641.897 774.402,645.897 772,649.5C 769.643,651.646 767.143,651.979 764.5,650.5C 765.239,650.631 765.906,650.464 766.5,650C 765.257,648.184 765.59,646.684 767.5,645.5C 769.371,645.141 770.871,644.141 772,642.5C 772.697,640.416 773.864,638.749 775.5,637.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#515151"
                  d="M 1571.5,638.5 C 1572.95,638.929 1574.62,639.096 1576.5,639C 1572.99,641.057 1569.32,642.723 1565.5,644C 1546.1,647.85 1526.77,652.016 1507.5,656.5C 1507.38,660.838 1507.04,661.172 1506.5,657.5C 1503.81,657.834 1501.48,657.168 1499.5,655.5C 1522.05,650.054 1544.71,644.721 1567.5,639.5C 1568.83,639.167 1570.17,638.833 1571.5,638.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#6a6a6b"
                  d="M 1243.5,552.5 C 1246.06,551.233 1248.73,551.233 1251.5,552.5C 1250.74,590.162 1250.41,627.828 1250.5,665.5C 1249.45,690.003 1248.95,714.669 1249,739.5C 1249.69,740.357 1250.52,741.023 1251.5,741.5C 1253.07,740.691 1254.74,740.357 1256.5,740.5C 1256.5,740.833 1256.5,741.167 1256.5,741.5C 1254.88,742.038 1253.22,742.371 1251.5,742.5C 1251.5,743.5 1251.5,744.5 1251.5,745.5C 1246.14,745.67 1240.81,746.17 1235.5,747C 1218.43,752.318 1201.09,756.485 1183.5,759.5C 1183.5,758.5 1183.5,757.5 1183.5,756.5C 1195.4,754.042 1207.4,751.876 1219.5,750C 1228.1,745.468 1237.27,743.301 1247,743.5C 1247.49,718.831 1247.99,694.165 1248.5,669.5C 1248.51,633.32 1249.17,597.153 1250.5,561C 1252.28,554.438 1249.95,551.605 1243.5,552.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#eaeaea"
                  d="M 543.5,676.5 C 540.211,674.603 539.211,671.937 540.5,668.5C 541.482,667.859 542.482,667.193 543.5,666.5C 544.806,669.98 544.806,673.313 543.5,676.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#49494a"
                  d="M 1115.5,640.5 C 1124.83,649.045 1126.83,659.212 1121.5,671C 1115.22,681.124 1108.39,681.624 1101,672.5C 1098.48,663.857 1099.14,655.524 1103,647.5C 1103.48,648.448 1103.65,649.448 1103.5,650.5C 1106.79,650.88 1109.12,649.547 1110.5,646.5C 1110.04,645.702 1109.38,645.369 1108.5,645.5C 1111.07,644.283 1113.4,642.616 1115.5,640.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#493710"
                  d="M 1495.5,670.5 C 1501.09,670.193 1506.59,670.527 1512,671.5C 1512.69,672.332 1512.52,672.998 1511.5,673.5C 1507.37,675.281 1503.04,675.948 1498.5,675.5C 1497.83,675.5 1497.5,675.167 1497.5,674.5C 1500.85,674.665 1504.18,674.498 1507.5,674C 1508.31,673.692 1508.97,673.192 1509.5,672.5C 1505.02,671.189 1500.68,671.189 1496.5,672.5C 1495.66,672.158 1495.33,671.492 1495.5,670.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#836322"
                  d="M 1497.5,674.5 C 1497.17,673.833 1496.83,673.167 1496.5,672.5C 1500.68,671.189 1505.02,671.189 1509.5,672.5C 1508.97,673.192 1508.31,673.692 1507.5,674C 1504.18,674.498 1500.85,674.665 1497.5,674.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#6c6c6c"
                  d="M 540.5,668.5 C 539.211,671.937 540.211,674.603 543.5,676.5C 543.5,676.833 543.5,677.167 543.5,677.5C 543.5,678.833 543.5,680.167 543.5,681.5C 539.204,680.57 534.87,679.737 530.5,679C 528.341,677.941 526.674,676.441 525.5,674.5C 526.167,672.833 526.833,671.167 527.5,669.5C 530.12,667.421 533.12,666.087 536.5,665.5C 537.852,666.524 539.185,667.524 540.5,668.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#030303"
                  d="M 1103.5,749.5 C 1118.36,745.536 1133.36,742.036 1148.5,739C 1151.08,737.617 1150.74,736.783 1147.5,736.5C 1130.89,740.522 1114.23,744.355 1097.5,748C 1095.29,748.789 1093.29,748.622 1091.5,747.5C 1109.48,742.198 1127.81,737.698 1146.5,734C 1149.41,732.76 1152.08,731.094 1154.5,729C 1156.74,728.023 1159.07,727.523 1161.5,727.5C 1161.5,730.167 1161.5,732.833 1161.5,735.5C 1164.16,735.17 1166.82,734.837 1169.5,734.5C 1174.84,734.231 1179.34,735.897 1183,739.5C 1183.5,745.157 1183.67,750.824 1183.5,756.5C 1183.5,757.5 1183.5,758.5 1183.5,759.5C 1201.09,756.485 1218.43,752.318 1235.5,747C 1240.81,746.17 1246.14,745.67 1251.5,745.5C 1251.5,744.5 1251.5,743.5 1251.5,742.5C 1253.22,742.371 1254.88,742.038 1256.5,741.5C 1258.17,740.334 1259.83,740.334 1261.5,741.5C 1258.52,745.644 1255.36,749.644 1252,753.5C 1248.52,760.333 1248.85,767 1253,773.5C 1257.92,781.052 1264.42,786.885 1272.5,791C 1284.06,795.894 1296.06,799.56 1308.5,802C 1314.68,802.819 1320.68,802.653 1326.5,801.5C 1327.49,801.672 1328.16,801.338 1328.5,800.5C 1330.1,800.232 1331.43,800.566 1332.5,801.5C 1305.6,807.087 1280.26,802.921 1256.5,789C 1253.95,786.147 1251.11,783.647 1248,781.5C 1246.56,778.397 1244.73,775.564 1242.5,773C 1236.79,771.619 1231.79,768.952 1227.5,765C 1216.45,763.023 1205.45,760.856 1194.5,758.5C 1191.55,759.488 1188.55,760.321 1185.5,761C 1184.57,765.591 1181.91,768.591 1177.5,770C 1143.58,777.458 1109.58,785.458 1075.5,794C 1076.65,801.086 1076.81,808.253 1076,815.5C 1075.72,818.457 1074.89,821.123 1073.5,823.5C 1075.24,814.918 1075.74,806.251 1075,797.5C 1074.8,795.744 1074.3,794.078 1073.5,792.5C 1071.59,793.348 1069.59,793.682 1067.5,793.5C 1064.68,793.539 1062.01,794.205 1059.5,795.5C 1063.7,799.226 1065.7,803.893 1065.5,809.5C 1065.87,826.3 1057.87,833.8 1041.5,832C 1037.19,829.19 1032.86,826.523 1028.5,824C 1027.56,823.308 1026.9,823.475 1026.5,824.5C 1023.57,823.2 1021.23,821.2 1019.5,818.5C 1015.97,811.312 1011.3,804.812 1005.5,799C 995.506,798.5 985.506,798.334 975.5,798.5C 974.628,804.789 974.295,811.122 974.5,817.5C 974.5,818.833 974.5,820.167 974.5,821.5C 973.539,819.735 973.205,817.735 973.5,815.5C 965.002,812.507 958.836,806.841 955,798.5C 931.487,797.868 907.987,795.202 884.5,790.5C 869.52,793.662 854.52,796.662 839.5,799.5C 838.027,798.929 836.36,798.929 834.5,799.5C 834.5,797.167 834.5,794.833 834.5,792.5C 831.886,792.277 830.219,793.444 829.5,796C 828.056,796.781 826.723,796.614 825.5,795.5C 827.407,789.049 828.073,782.383 827.5,775.5C 826.167,775.5 824.833,775.5 823.5,775.5C 823.666,781.509 823.499,787.509 823,793.5C 822.5,787.175 822.334,780.842 822.5,774.5C 820.5,774.167 818.5,773.833 816.5,773.5C 759.835,760.5 703.168,747.5 646.5,734.5C 645.336,755.802 644.503,755.802 644,734.5C 641,731.797 638.833,732.13 637.5,735.5C 634.717,733.933 632.051,732.1 629.5,730C 600.456,723.541 571.456,716.875 542.5,710C 536.447,708.226 531.28,705.059 527,700.5C 526.209,699.255 525.709,697.922 525.5,696.5C 525.334,690.158 525.5,683.825 526,677.5C 527.255,678.211 528.421,679.044 529.5,680C 535.519,680.447 540.853,682.447 545.5,686C 607.739,698.765 670.073,711.431 732.5,724C 782.264,734.486 831.931,745.486 881.5,757C 898.173,759.081 914.673,761.914 931,765.5C 933.238,764.006 936.405,763.339 940.5,763.5C 989.867,767.939 1038.87,765.439 1087.5,756C 1089.33,755.727 1090.83,754.893 1092,753.5C 1093,753.833 1094,754.167 1095,754.5C 1095.42,753.328 1096.09,752.328 1097,751.5C 1098.9,751.694 1100.74,751.694 1102.5,751.5C 1103.3,751.043 1103.63,750.376 1103.5,749.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#474747"
                  d="M 724.5,680.5 C 726.048,680.821 726.715,681.821 726.5,683.5C 727.5,683.5 728.5,683.5 729.5,683.5C 729.254,686.47 727.588,687.803 724.5,687.5C 723.562,685.09 723.562,682.756 724.5,680.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#525255"
                  d="M 1131.5,690.5 C 1132.5,690.414 1133.33,690.748 1134,691.5C 1135.71,696.199 1134.21,698.532 1129.5,698.5C 1129.11,695.487 1129.77,692.82 1131.5,690.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#0f0f0f"
                  d="M 525.5,674.5 C 526.674,676.441 528.341,677.941 530.5,679C 534.87,679.737 539.204,680.57 543.5,681.5C 543.5,680.167 543.5,678.833 543.5,677.5C 544.167,677.5 544.833,677.5 545.5,677.5C 549.068,678.941 552.734,680.441 556.5,682C 670.107,706.484 783.774,730.818 897.5,755C 903.489,755.699 909.489,756.199 915.5,756.5C 925.828,759.567 936.494,760.734 947.5,760C 945.657,759.841 944.991,759.341 945.5,758.5C 951.815,759.11 958.149,759.443 964.5,759.5C 990.416,761.222 1016.42,760.555 1042.5,757.5C 1043.83,757.5 1045.17,757.5 1046.5,757.5C 1050.46,758.44 1054.46,758.607 1058.5,758C 1073.54,755.324 1088.54,752.491 1103.5,749.5C 1103.63,750.376 1103.3,751.043 1102.5,751.5C 1100.74,751.694 1098.9,751.694 1097,751.5C 1096.09,752.328 1095.42,753.328 1095,754.5C 1094,754.167 1093,753.833 1092,753.5C 1090.83,754.893 1089.33,755.727 1087.5,756C 1038.87,765.439 989.867,767.939 940.5,763.5C 936.405,763.339 933.238,764.006 931,765.5C 914.673,761.914 898.173,759.081 881.5,757C 831.931,745.486 782.264,734.486 732.5,724C 670.073,711.431 607.739,698.765 545.5,686C 540.853,682.447 535.519,680.447 529.5,680C 528.421,679.044 527.255,678.211 526,677.5C 525.5,683.825 525.334,690.158 525.5,696.5C 524.167,689.167 524.167,681.833 525.5,674.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#777776"
                  d="M 568.5,679.5 C 567.761,679.369 567.094,679.536 566.5,680C 686.497,705.666 806.497,731.333 926.5,757C 922.83,757.279 919.163,757.112 915.5,756.5C 909.489,756.199 903.489,755.699 897.5,755C 783.774,730.818 670.107,706.484 556.5,682C 552.734,680.441 549.068,678.941 545.5,677.5C 545.34,675.801 545.506,674.134 546,672.5C 553.251,675.975 560.751,678.308 568.5,679.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#100402"
                  d="M 1492.5,685.5 C 1493.5,685.5 1494.5,685.5 1495.5,685.5C 1495.36,692.883 1494.7,700.216 1493.5,707.5C 1494.81,709.392 1494.65,711.059 1493,712.5C 1490.91,709.685 1488.41,707.852 1485.5,707C 1486.06,707.383 1486.39,707.883 1486.5,708.5C 1486.5,709.167 1486.5,709.833 1486.5,710.5C 1483.33,710.248 1481.33,708.582 1480.5,705.5C 1478.6,704.534 1476.6,704.201 1474.5,704.5C 1473.47,713.337 1474.97,721.671 1479,729.5C 1481.01,732.56 1483.84,734.226 1487.5,734.5C 1491.45,733.638 1495.45,733.305 1499.5,733.5C 1498.31,734.272 1497.31,735.272 1496.5,736.5C 1496.08,737.222 1495.42,737.722 1494.5,738C 1491.83,738.667 1489.17,738.667 1486.5,738C 1476.68,735.438 1466.68,733.772 1456.5,733C 1454.35,732.901 1452.68,732.067 1451.5,730.5C 1444.49,723.132 1440.16,714.466 1438.5,704.5C 1436.57,703.19 1434.57,701.857 1432.5,700.5C 1433.24,699.818 1433.91,699.151 1434.5,698.5C 1453.87,694.155 1473.21,689.822 1492.5,685.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#141415"
                  d="M 1512.5,684.5 C 1513.62,690.418 1513.79,696.418 1513,702.5C 1511.48,704.569 1510.64,706.903 1510.5,709.5C 1505.97,715.751 1499.97,717.251 1492.5,714C 1490.63,711.96 1488.63,710.127 1486.5,708.5C 1486.39,707.883 1486.06,707.383 1485.5,707C 1488.41,707.852 1490.91,709.685 1493,712.5C 1494.65,711.059 1494.81,709.392 1493.5,707.5C 1494.7,700.216 1495.36,692.883 1495.5,685.5C 1494.5,685.5 1493.5,685.5 1492.5,685.5C 1494,684.694 1495.66,684.028 1497.5,683.5C 1498.3,683.043 1498.63,682.376 1498.5,681.5C 1500.86,681.674 1503.19,682.007 1505.5,682.5C 1506,677.5 1506.34,677.833 1506.5,683.5C 1508.62,683.325 1510.62,683.659 1512.5,684.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#484849"
                  d="M 955.5,703.5 C 963.049,705.048 970.715,705.715 978.5,705.5C 996.843,704.794 1015.18,704.294 1033.5,704C 1034.06,704.383 1034.39,704.883 1034.5,705.5C 1035.01,709.007 1034.34,712.174 1032.5,715C 1026.09,716.085 1019.76,716.918 1013.5,717.5C 994.15,717.649 974.817,717.149 955.5,716C 953.119,714.491 952.119,712.325 952.5,709.5C 952.078,706.692 953.078,704.692 955.5,703.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#626264"
                  d="M 1434.5,698.5 C 1433.91,699.151 1433.24,699.818 1432.5,700.5C 1434.57,701.857 1436.57,703.19 1438.5,704.5C 1438.5,705.5 1438.5,706.5 1438.5,707.5C 1437.6,706.791 1437.26,705.791 1437.5,704.5C 1434.94,703.8 1432.44,702.8 1430,701.5C 1413.59,705.895 1397.09,709.895 1380.5,713.5C 1378.02,712.742 1375.35,712.742 1372.5,713.5C 1380.23,710.535 1388.23,708.035 1396.5,706C 1409.17,703.498 1421.84,700.998 1434.5,698.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#4b4b4b"
                  d="M 893.5,713.5 C 894.943,714.335 895.943,715.668 896.5,717.5C 897.478,717.023 898.311,716.357 899,715.5C 899.494,717.134 899.66,718.801 899.5,720.5C 892.747,722.555 890.747,720.221 893.5,713.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#292d30"
                  d="M 1380.5,713.5 C 1380.31,723.219 1378.64,732.553 1375.5,741.5C 1376.42,735.667 1377.42,729.834 1378.5,724C 1378.36,722.045 1377.53,720.545 1376,719.5C 1370.96,720.121 1366.79,722.288 1363.5,726C 1360.34,740.652 1354.01,753.652 1344.5,765C 1338.97,768.599 1333.3,771.932 1327.5,775C 1324.5,775.667 1321.5,775.667 1318.5,775C 1317.58,774.722 1316.92,774.222 1316.5,773.5C 1323.4,774.565 1329.4,772.898 1334.5,768.5C 1348.29,759.619 1356.63,746.953 1359.5,730.5C 1360.37,728.283 1360.7,725.95 1360.5,723.5C 1342.31,726.712 1324.31,730.879 1306.5,736C 1303.04,737.809 1299.87,739.976 1297,742.5C 1296.52,741.552 1296.35,740.552 1296.5,739.5C 1294.94,739.481 1293.44,739.148 1292,738.5C 1288.04,740.286 1284.21,741.453 1280.5,742C 1278.27,745.926 1276.44,750.093 1275,754.5C 1272.07,756.509 1270.9,759.343 1271.5,763C 1271.27,766.459 1272.1,769.626 1274,772.5C 1279.33,777.856 1285.17,782.356 1291.5,786C 1293.67,788.998 1296,791.831 1298.5,794.5C 1287.92,791.124 1278.42,785.791 1270,778.5C 1265.19,773.412 1263.19,767.412 1264,760.5C 1267.75,754.376 1272.08,748.71 1277,743.5C 1277.36,741.579 1278.19,739.912 1279.5,738.5C 1279.04,737.702 1278.38,737.369 1277.5,737.5C 1308.97,729.529 1340.64,721.529 1372.5,713.5C 1375.35,712.742 1378.02,712.742 1380.5,713.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3f3a3a"
                  d="M 1438.5,704.5 C 1440.16,714.466 1444.49,723.132 1451.5,730.5C 1448.94,729.457 1446.78,727.79 1445,725.5C 1441.4,719.982 1439.24,713.982 1438.5,707.5C 1438.5,706.5 1438.5,705.5 1438.5,704.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3f3f3f"
                  d="M 1083.5,720.5 C 1085.44,721.014 1086.44,722.347 1086.5,724.5C 1085.21,728.819 1082.88,729.485 1079.5,726.5C 1081.83,725.168 1083.17,723.168 1083.5,720.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#36160a"
                  d="M 1512.5,684.5 C 1514.17,684.5 1515.83,684.5 1517.5,684.5C 1518.23,695.894 1516.57,706.894 1512.5,717.5C 1509.68,723.992 1505.35,729.326 1499.5,733.5C 1495.45,733.305 1491.45,733.638 1487.5,734.5C 1483.84,734.226 1481.01,732.56 1479,729.5C 1474.97,721.671 1473.47,713.337 1474.5,704.5C 1476.6,704.201 1478.6,704.534 1480.5,705.5C 1481.33,708.582 1483.33,710.248 1486.5,710.5C 1486.68,715.676 1488.68,720.009 1492.5,723.5C 1502.69,724.68 1508.69,720.014 1510.5,709.5C 1510.64,706.903 1511.48,704.569 1513,702.5C 1513.79,696.418 1513.62,690.418 1512.5,684.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#484545"
                  d="M 1486.5,708.5 C 1488.63,710.127 1490.63,711.96 1492.5,714C 1499.97,717.251 1505.97,715.751 1510.5,709.5C 1508.69,720.014 1502.69,724.68 1492.5,723.5C 1488.68,720.009 1486.68,715.676 1486.5,710.5C 1486.5,709.833 1486.5,709.167 1486.5,708.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#32383b"
                  d="M 1359.5,730.5 C 1351.52,732.062 1343.52,733.562 1335.5,735C 1324.28,738.741 1312.95,741.907 1301.5,744.5C 1299.9,749.554 1300.9,754.054 1304.5,758C 1306.17,758.333 1307.83,758.667 1309.5,759C 1315.75,767.798 1324.09,770.964 1334.5,768.5C 1329.4,772.898 1323.4,774.565 1316.5,773.5C 1312.16,772.569 1308.66,770.236 1306,766.5C 1303.75,762.993 1301.75,759.327 1300,755.5C 1299.18,757.788 1298.51,760.122 1298,762.5C 1296.95,763.517 1295.78,763.684 1294.5,763C 1296.55,762.07 1297.38,760.57 1297,758.5C 1296.33,759.167 1295.67,759.833 1295,760.5C 1294.36,758.238 1293.52,756.071 1292.5,754C 1290.19,753.663 1288.36,754.496 1287,756.5C 1285.9,753.735 1283.9,752.069 1281,751.5C 1280.1,762.655 1283.1,772.655 1290,781.5C 1295.79,790.291 1303.62,796.458 1313.5,800C 1318.49,800.499 1323.49,800.666 1328.5,800.5C 1328.16,801.338 1327.49,801.672 1326.5,801.5C 1315.95,803.358 1306.62,801.025 1298.5,794.5C 1296,791.831 1293.67,788.998 1291.5,786C 1285.17,782.356 1279.33,777.856 1274,772.5C 1272.1,769.626 1271.27,766.459 1271.5,763C 1270.9,759.343 1272.07,756.509 1275,754.5C 1276.44,750.093 1278.27,745.926 1280.5,742C 1284.21,741.453 1288.04,740.286 1292,738.5C 1293.44,739.148 1294.94,739.481 1296.5,739.5C 1296.35,740.552 1296.52,741.552 1297,742.5C 1299.87,739.976 1303.04,737.809 1306.5,736C 1324.31,730.879 1342.31,726.712 1360.5,723.5C 1360.7,725.95 1360.37,728.283 1359.5,730.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#929092"
                  d="M 527.5,669.5 C 526.833,671.167 526.167,672.833 525.5,674.5C 524.167,681.833 524.167,689.167 525.5,696.5C 525.709,697.922 526.209,699.255 527,700.5C 531.28,705.059 536.447,708.226 542.5,710C 571.456,716.875 600.456,723.541 629.5,730C 632.051,732.1 634.717,733.933 637.5,735.5C 639.508,739.476 640.675,743.809 641,748.5C 641.934,749.858 642.768,751.192 643.5,752.5C 647.818,762 655.151,767.667 665.5,769.5C 665.5,769.833 665.5,770.167 665.5,770.5C 652.665,768.824 644.165,761.824 640,749.5C 639,745.5 638,741.5 637,737.5C 633.911,736.04 631.078,734.207 628.5,732C 601.564,725.413 574.564,719.079 547.5,713C 540.821,711.161 534.488,708.494 528.5,705C 526.57,702.742 525.07,700.242 524,697.5C 522.747,689.356 522.747,681.356 524,673.5C 524.66,671.676 525.827,670.343 527.5,669.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#554b49"
                  d="M 1512.5,717.5 C 1512.5,718.167 1512.5,718.833 1512.5,719.5C 1509.55,725.967 1505.22,731.467 1499.5,736C 1498.55,736.483 1497.55,736.649 1496.5,736.5C 1497.31,735.272 1498.31,734.272 1499.5,733.5C 1505.35,729.326 1509.68,723.992 1512.5,717.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#323132"
                  d="M 816.5,773.5 C 818.144,774.316 819.31,775.65 820,777.5C 820.333,776.833 820.667,776.167 821,775.5C 821.83,781.196 821.663,786.863 820.5,792.5C 819.672,793.415 818.672,794.081 817.5,794.5C 800.664,791.623 783.998,788.123 767.5,784C 749.057,778.577 730.391,773.91 711.5,770C 691.23,767.094 671.23,763.261 651.5,758.5C 648.888,756.948 647.555,754.614 647.5,751.5C 645.901,751.232 644.568,751.566 643.5,752.5C 642.768,751.192 641.934,749.858 641,748.5C 640.675,743.809 639.508,739.476 637.5,735.5C 638.833,732.13 641,731.797 644,734.5C 644.503,755.802 645.336,755.802 646.5,734.5C 703.168,747.5 759.835,760.5 816.5,773.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#16191a"
                  d="M 1277.5,737.5 C 1278.38,737.369 1279.04,737.702 1279.5,738.5C 1278.19,739.912 1277.36,741.579 1277,743.5C 1272.08,748.71 1267.75,754.376 1264,760.5C 1263.19,767.412 1265.19,773.412 1270,778.5C 1278.42,785.791 1287.92,791.124 1298.5,794.5C 1306.62,801.025 1315.95,803.358 1326.5,801.5C 1320.68,802.653 1314.68,802.819 1308.5,802C 1296.06,799.56 1284.06,795.894 1272.5,791C 1264.42,786.885 1257.92,781.052 1253,773.5C 1248.85,767 1248.52,760.333 1252,753.5C 1255.36,749.644 1258.52,745.644 1261.5,741.5C 1259.83,740.334 1258.17,740.334 1256.5,741.5C 1256.5,741.167 1256.5,740.833 1256.5,740.5C 1258.85,739.284 1261.35,739.284 1264,740.5C 1268.5,739.327 1273,738.327 1277.5,737.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#454444"
                  d="M 1103.5,749.5 C 1088.54,752.491 1073.54,755.324 1058.5,758C 1054.46,758.607 1050.46,758.44 1046.5,757.5C 1061.38,754.187 1076.38,750.854 1091.5,747.5C 1093.29,748.622 1095.29,748.789 1097.5,748C 1114.23,744.355 1130.89,740.522 1147.5,736.5C 1150.74,736.783 1151.08,737.617 1148.5,739C 1133.36,742.036 1118.36,745.536 1103.5,749.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3d4448"
                  d="M 1359.5,730.5 C 1356.63,746.953 1348.29,759.619 1334.5,768.5C 1324.09,770.964 1315.75,767.798 1309.5,759C 1307.83,758.667 1306.17,758.333 1304.5,758C 1300.9,754.054 1299.9,749.554 1301.5,744.5C 1312.95,741.907 1324.28,738.741 1335.5,735C 1343.52,733.562 1351.52,732.062 1359.5,730.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#424241"
                  d="M 568.5,679.5 C 694.282,705.988 819.948,732.322 945.5,758.5C 944.991,759.341 945.657,759.841 947.5,760C 936.494,760.734 925.828,759.567 915.5,756.5C 919.163,757.112 922.83,757.279 926.5,757C 806.497,731.333 686.497,705.666 566.5,680C 567.094,679.536 567.761,679.369 568.5,679.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3d4447"
                  d="M 1375.5,741.5 C 1370.39,763.89 1359.06,782.39 1341.5,797C 1338.47,798.513 1335.47,800.013 1332.5,801.5C 1331.43,800.566 1330.1,800.232 1328.5,800.5C 1323.49,800.666 1318.49,800.499 1313.5,800C 1303.62,796.458 1295.79,790.291 1290,781.5C 1283.1,772.655 1280.1,762.655 1281,751.5C 1283.9,752.069 1285.9,753.735 1287,756.5C 1288.36,754.496 1290.19,753.663 1292.5,754C 1293.52,756.071 1294.36,758.238 1295,760.5C 1295.67,759.833 1296.33,759.167 1297,758.5C 1297.38,760.57 1296.55,762.07 1294.5,763C 1295.78,763.684 1296.95,763.517 1298,762.5C 1298.51,760.122 1299.18,757.788 1300,755.5C 1301.75,759.327 1303.75,762.993 1306,766.5C 1308.66,770.236 1312.16,772.569 1316.5,773.5C 1316.92,774.222 1317.58,774.722 1318.5,775C 1321.5,775.667 1324.5,775.667 1327.5,775C 1333.3,771.932 1338.97,768.599 1344.5,765C 1354.01,753.652 1360.34,740.652 1363.5,726C 1366.79,722.288 1370.96,720.121 1376,719.5C 1377.53,720.545 1378.36,722.045 1378.5,724C 1377.42,729.834 1376.42,735.667 1375.5,741.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#2b110a"
                  d="M 651.5,758.5 C 662.529,762.281 673.863,765.281 685.5,767.5C 686.598,768.397 686.598,769.23 685.5,770C 683.567,770.251 681.734,770.751 680,771.5C 677.99,770.152 675.99,768.818 674,767.5C 672.467,768.695 670.967,768.695 669.5,767.5C 667.974,767.994 666.641,768.661 665.5,769.5C 655.151,767.667 647.818,762 643.5,752.5C 644.568,751.566 645.901,751.232 647.5,751.5C 647.555,754.614 648.888,756.948 651.5,758.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#150805"
                  d="M 685.5,767.5 C 692.276,767.943 698.61,769.776 704.5,773C 703.944,773.383 703.611,773.883 703.5,774.5C 697.681,776.464 691.681,776.964 685.5,776C 678.711,774.139 672.045,772.306 665.5,770.5C 665.5,770.167 665.5,769.833 665.5,769.5C 666.641,768.661 667.974,767.994 669.5,767.5C 670.967,768.695 672.467,768.695 674,767.5C 675.99,768.818 677.99,770.152 680,771.5C 681.734,770.751 683.567,770.251 685.5,770C 686.598,769.23 686.598,768.397 685.5,767.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#212020"
                  d="M 651.5,758.5 C 671.23,763.261 691.23,767.094 711.5,770C 730.391,773.91 749.057,778.577 767.5,784C 783.998,788.123 800.664,791.623 817.5,794.5C 818.672,794.081 819.672,793.415 820.5,792.5C 821.663,786.863 821.83,781.196 821,775.5C 820.667,776.167 820.333,776.833 820,777.5C 819.31,775.65 818.144,774.316 816.5,773.5C 818.5,773.833 820.5,774.167 822.5,774.5C 822.334,780.842 822.5,787.175 823,793.5C 823.499,787.509 823.666,781.509 823.5,775.5C 824.833,775.5 826.167,775.5 827.5,775.5C 828.073,782.383 827.407,789.049 825.5,795.5C 826.723,796.614 828.056,796.781 829.5,796C 830.219,793.444 831.886,792.277 834.5,792.5C 834.5,794.833 834.5,797.167 834.5,799.5C 836.36,798.929 838.027,798.929 839.5,799.5C 834.844,801.795 829.844,802.628 824.5,802C 785.078,792.811 745.745,783.311 706.5,773.5C 705.583,774.127 704.583,774.461 703.5,774.5C 703.611,773.883 703.944,773.383 704.5,773C 698.61,769.776 692.276,767.943 685.5,767.5C 673.863,765.281 662.529,762.281 651.5,758.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#230901"
                  d="M 1019.5,818.5 C 1017.17,815.171 1014.17,812.504 1010.5,810.5C 1007.76,812.102 1004.76,812.936 1001.5,813C 999.306,814.553 998.14,816.719 998,819.5C 996.831,814.092 993.665,810.759 988.5,809.5C 984.977,811.924 980.977,813.257 976.5,813.5C 975.571,814.689 975.238,816.022 975.5,817.5C 975.167,817.5 974.833,817.5 974.5,817.5C 974.295,811.122 974.628,804.789 975.5,798.5C 985.506,798.334 995.506,798.5 1005.5,799C 1011.3,804.812 1015.97,811.312 1019.5,818.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#351203"
                  d="M 1073.5,823.5 C 1069,836.17 1061,846.004 1049.5,853C 1043.54,854.131 1037.54,855.131 1031.5,856C 1032.71,857.018 1032.37,857.518 1030.5,857.5C 1023.44,853.193 1015.94,849.859 1008,847.5C 1007,848.5 1006,849.5 1005,850.5C 998.925,848.141 992.759,845.975 986.5,844C 979.137,836.766 975.471,827.933 975.5,817.5C 975.238,816.022 975.571,814.689 976.5,813.5C 980.977,813.257 984.977,811.924 988.5,809.5C 993.665,810.759 996.831,814.092 998,819.5C 998.14,816.719 999.306,814.553 1001.5,813C 1004.76,812.936 1007.76,812.102 1010.5,810.5C 1014.17,812.504 1017.17,815.171 1019.5,818.5C 1021.23,821.2 1023.57,823.2 1026.5,824.5C 1027.76,832.19 1031.42,838.356 1037.5,843C 1043.1,844.091 1048.43,843.424 1053.5,841C 1067.54,828.033 1072.2,812.199 1067.5,793.5C 1069.59,793.682 1071.59,793.348 1073.5,792.5C 1074.3,794.078 1074.8,795.744 1075,797.5C 1075.74,806.251 1075.24,814.918 1073.5,823.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#3e1602"
                  d="M 1009.5,818.5 C 1012.97,818.576 1016.31,819.242 1019.5,820.5C 1019.33,824.182 1019.5,827.848 1020,831.5C 1021.95,835.242 1023.79,839.075 1025.5,843C 1025.24,844.261 1024.57,845.261 1023.5,846C 1020.5,846.667 1017.5,846.667 1014.5,846C 1013.83,845 1013.17,844 1012.5,843C 1008.72,841.531 1005.22,839.697 1002,837.5C 1000.37,842.147 997.366,843.48 993,841.5C 988.761,835.119 986.761,828.119 987,820.5C 993.513,821.344 997.513,825.01 999,831.5C 998.308,823.695 1001.81,820.695 1009.5,822.5C 1009.5,821.167 1009.5,819.833 1009.5,818.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#464444"
                  d="M 1067.5,793.5 C 1072.2,812.199 1067.54,828.033 1053.5,841C 1048.43,843.424 1043.1,844.091 1037.5,843C 1031.42,838.356 1027.76,832.19 1026.5,824.5C 1026.9,823.475 1027.56,823.308 1028.5,824C 1032.86,826.523 1037.19,829.19 1041.5,832C 1057.87,833.8 1065.87,826.3 1065.5,809.5C 1065.7,803.893 1063.7,799.226 1059.5,795.5C 1062.01,794.205 1064.68,793.539 1067.5,793.5 Z"
                />
              </g>
              <g>
                <path
                  fill="#1a0d0a"
                  d="M 974.5,817.5 C 974.833,817.5 975.167,817.5 975.5,817.5C 975.471,827.933 979.137,836.766 986.5,844C 992.759,845.975 998.925,848.141 1005,850.5C 1006,849.5 1007,848.5 1008,847.5C 1015.94,849.859 1023.44,853.193 1030.5,857.5C 1032.37,857.518 1032.71,857.018 1031.5,856C 1037.54,855.131 1043.54,854.131 1049.5,853C 1061,846.004 1069,836.17 1073.5,823.5C 1070.04,836.899 1062.71,847.732 1051.5,856C 1046.83,858.585 1041.83,860.085 1036.5,860.5C 1022.64,856.826 1008.64,853.659 994.5,851C 982.513,844.835 975.847,835.002 974.5,821.5C 974.5,820.167 974.5,818.833 974.5,817.5 Z"
                />
              </g>
            </svg>
          )}
        </g>
      </svg>
      {showDiv === true && (
        <div
          className="map-detail-info"
          style={{
            position: "absolute",
            left: mousePosition.x,
            top: mousePosition.y,
          }}
        >
          {`貨物編號：${currentSVG.boxID}`}
        </div>
      )}
    </div>
  );
};

export default Map;
