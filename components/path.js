import React from "react";

const Path = ({ deetu, start, end, setPath, ifCarIsFull }) => {
  //   // 測試地圖：
  //                 ┌ ── ── ── > Y
  //                 ∣
  //                 ∣
  //              X  ∣
  //                 v
  // 定義地圖屬性
  const STORAGE = 0;
  const ROAD = 1;
  const BRIDGE = 2;
  const WALL = 3;

  const OOUHUIE = 9; //有貨
  const SONHUIE = 8; //送貨
  // var ifCarIsFull = false;

  // 節點定義
  class Node {
    constructor(x, y, g, h) {
      this.x = x;
      this.y = y;
      this.g = g; // 從起點到當前節點的代價
      this.h = h; // 估算到終點的代價
      this.f = g + h; // 總代價
      this.parent = null;
    }
  }

  // 代價估算
  const heuristic = (node, end) => {
    // 曼哈頓距離作為估算
    return Math.abs(node.x - end.x) + Math.abs(node.y - end.y);
  };

  // Astar算法
  let count = 0;
  const astar = (grid, start, end) => {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    const rows = grid.length;
    const cols = grid[0].length;
    const openSet = new Set();
    const closedSet = new Set();
    // 檢查起始點和目標點是否在地圖範圍內
    if (
      start[0] < 0 ||
      start[0] >= rows ||
      start[1] < 0 ||
      start[1] >= cols ||
      end[0] < 0 ||
      end[0] >= rows ||
      end[1] < 0 ||
      end[1] >= cols
    ) {
      return null;
    }

    const startNode = new Node(
      start[0],
      start[1],
      0,
      heuristic({ x: start[0], y: start[1] }, { x: end[0], y: end[1] }),
    );
    openSet.add(startNode);

    const gValues = new Array(rows).fill(null).map(() => {
      return new Array(cols).fill(Infinity);
    });

    gValues[start[0]][start[1]] = 0;

    // 計算閾值，可以根據地圖大小調整
    // const maxCount = (rows * cols) * 4 * (rows * cols);
    const maxCount = 1000000;
    // console.log("rows * cols =", maxCount);
    let a = 0;

    while (openSet.size > 0) {
      a += 1;
      // console.log("Count times =", a);
      // 找到具有最低代價（f值）的節點
      let current = null;
      for (const node of openSet) {
        if (!current || node.f < current.f) {
          current = node;
        }
      }
      // 將當前節點從開放集合移動到封閉集合
      openSet.delete(current);
      closedSet.add(current);

      // 如果達到目標，重建並返回路徑
      if (current.x === end[0] && current.y === end[1]) {
        const path = [];
        while (current.parent) {
          path.push([current.x, current.y]);
          current = current.parent;
        }
        path.push([start[0], start[1]]);
        return path.reverse();
      }

      for (const dir of directions) {
        const newX = current.x + dir[0];
        const newY = current.y + dir[1];

        if (ifCarIsFull) {
          //貨車
          // 檢查新的座標是否在網格範圍內
          if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
            const g = current.g + 1; // 從起點到鄰居的代價
            // const g = gValues[current.x][current.y] + 1;
            const h = heuristic({ x: newX, y: newY }, { x: end[0], y: end[1] }); // 從鄰居到終點的估算
            const neighborNode = new Node(newX, newY, g, h);

            // 根據地圖屬性調整移動規則
            if (
              grid[current.x][current.y] === STORAGE ||
              grid[current.x][current.y] === BRIDGE
            ) {
              //如果現在位置為橋2或倉0
              if (dir[0] !== -1 && dir[0] !== 1) {
                //限定不為上下
                if (
                  grid[newX][newY] === STORAGE ||
                  grid[newX][newY] === BRIDGE
                ) {
                  //如果目標位置為倉0或橋2
                  if (dir[0] === 0) {
                    //只能左右移動
                    if (!openSet.has(neighborNode) || g < neighborNode.g) {
                      // 檢查鄰居節點是否不在開放集合中或者到鄰居的新路徑更短
                      neighborNode.parent = current; // 將當前節點設為鄰居節點的父節點，更新代價
                      openSet.add(neighborNode); // 將鄰居節點添加到開放集合中
                    }
                  }
                } else if (
                  grid[newX][newY] === ROAD ||
                  grid[newX][newY] === SONHUIE
                ) {
                  // 如果目標位置屬性為1(路) 上下左右皆可移動
                  if (!openSet.has(neighborNode) || g < neighborNode.g) {
                    neighborNode.parent = current;
                    openSet.add(neighborNode);
                  }
                } else if (
                  grid[newX][newY] === WALL ||
                  grid[newX][newY] === OOUHUIE
                ) {
                  // 3(牆) 9(貨)
                  // 視為牆壁，不能移動
                  count++;
                }
              }
            } else {
              if (grid[newX][newY] === STORAGE || grid[newX][newY] === BRIDGE) {
                //如果目標位置為倉0或橋2
                if (dir[0] === 0) {
                  //只能左右移動
                  if (!openSet.has(neighborNode) || g < neighborNode.g) {
                    neighborNode.parent = current;
                    openSet.add(neighborNode);
                  }
                }
              } else if (
                grid[newX][newY] === ROAD ||
                grid[newX][newY] === SONHUIE
              ) {
                // 如果目標位置屬性為1(路) 上下左右皆可移動
                if (!openSet.has(neighborNode) || g < neighborNode.g) {
                  //if (!openSet.has(neighborNode) || g < neighborNode.g)
                  neighborNode.parent = current;
                  openSet.add(neighborNode);
                }
              } else if (
                grid[newX][newY] === WALL ||
                grid[newX][newY] === OOUHUIE
              ) {
                // 3(牆) 9(貨)
                // 視為牆壁，不能移動
                count++;
              }
            }
          }
        }

        if (!ifCarIsFull) {
          //空車
          // console.log("ifCarIsFull =", ifCarIsFull);
          // 檢查新的座標是否在網格範圍內
          if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
            const g = current.g + 1; // 從起點到鄰居的代價
            // const g = gValues[current.x][current.y] + 1;
            const h = heuristic({ x: newX, y: newY }, { x: end[0], y: end[1] }); // 從鄰居到終點的估算
            const neighborNode = new Node(newX, newY, g, h);

            // 根據地圖屬性調整移動規則
            if (
              grid[current.x][current.y] === STORAGE ||
              grid[current.x][current.y] === BRIDGE ||
              grid[current.x][current.y] === OOUHUIE
            ) {
              //如果現在位置為橋2或倉0
              if (dir[0] === 0) {
                //限定不為上下
                if (
                  grid[newX][newY] === STORAGE ||
                  grid[newX][newY] === BRIDGE ||
                  grid[newX][newY] === OOUHUIE
                ) {
                  //如果目標位置為倉0或橋2
                  // if (dir[0] === 0) {
                  //只能左右移動
                  if (!openSet.has(neighborNode) || g < neighborNode.g) {
                    // 檢查鄰居節點是否不在開放集合中或者到鄰居的新路徑更短
                    neighborNode.parent = current; // 將當前節點設為鄰居節點的父節點，更新代價
                    openSet.add(neighborNode); // 將鄰居節點添加到開放集合中
                  }
                  // }
                } else if (
                  grid[newX][newY] === ROAD ||
                  grid[newX][newY] === SONHUIE
                ) {
                  // 如果目標位置屬性為1(路) 上下左右皆可移動
                  if (!openSet.has(neighborNode) || g < neighborNode.g) {
                    neighborNode.parent = current;
                    openSet.add(neighborNode);
                  }
                } else if (grid[newX][newY] === WALL) {
                  // 3(牆)
                  // 視為牆壁，不能移動
                  count++;
                }
              }
            } else {
              if (
                grid[newX][newY] === STORAGE ||
                grid[newX][newY] === BRIDGE ||
                grid[newX][newY] === OOUHUIE
              ) {
                //如果目標位置為倉0或橋2
                if (dir[0] === 0) {
                  //只能左右移動
                  if (!openSet.has(neighborNode) || g < neighborNode.g) {
                    neighborNode.parent = current;
                    openSet.add(neighborNode);
                  }
                }
              } else if (
                grid[newX][newY] === ROAD ||
                grid[newX][newY] === SONHUIE
              ) {
                // 如果目標位置屬性為1(路) 上下左右皆可移動
                if (!openSet.has(neighborNode) || g < neighborNode.g) {
                  //if (!openSet.has(neighborNode) || g < neighborNode.g)
                  neighborNode.parent = current;
                  openSet.add(neighborNode);
                }
              } else if (grid[newX][newY] === WALL) {
                // 3(牆)
                // 視為牆壁，不能移動
                count++;
              }
            }
          }
        }
      }
      if (count >= maxCount) {
        // console.log("已達到最大疊代次數，強制結束算法");
        // console.log("count =", count);
        return null;
      }
    }
    // 如果開放集合為空且未達到目標，則沒有路徑
    return null;
  };

  // 提取 susin 值
  const susinValues = deetu.map((item) => item.susin);

  // 将 susin 值分成每9個一组的數组
  const grid = Array.from({ length: susinValues.length / 9 }, (_, i) =>
    susinValues.slice(i * 9, (i + 1) * 9),
  );

  // console.log(grid);

  // 讀取地圖
  const path = astar(grid, start, end);

  // console.log("路徑:", path);
  // console.log("有無貨物：", ifCarIsFull);
  if (path === null) {
    // console.log("未找到路徑");
    alert("未找到路徑");
  } else {
    // console.log("count =", count);
    // console.log(
    //   "找到路徑：",
    //   path.map((coord) => `[${coord.join(", ")}]`).join(" "),
    // );
    // alert("找到路徑：\n" + path.map(coord => `[${coord.join(', ')}]`).join('\n'));

    for (const point of path) {
      grid[point[0]][point[1]] = 10;
    }

    // console.log("顯示路徑：");

    let pathString = "";
    for (const row of grid) {
      for (const cell of row) {
        if (cell === 10) {
          // process.stdout.write("* ");
          pathString += "* ";
        } else {
          // process.stdout.write(cell + " ");
          pathString += cell + " ";
        }
      }
      pathString += "\n";
      // console.log();
    }
    // console.log(pathString);
    // 使用 alert 彈窗顯示路徑
    // alert("路徑:\n" + pathString);
    setPath(path);
  }
  return <></>;
};

export default Path;
