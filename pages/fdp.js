import Layout from "@/components/layout";
import DeliveryEntryChart from "@/components/DeliveryEntryChart";
import StorageBinChart from "@/components/StorageBinChart";
import WarehouseUseChart from "@/components/WarehouseUseChart";
import WarehouseUseDetail from "@/components/WarehouseUseDetail";
import DateTime from "@/components/DateTime";
import faker from "faker";
import { useEffect, useState } from "react";

const FDP = () => {
  const labels = (n) => {
    let labelsList = [];
    let num = 0;
    for (let i = 0; i < n; i++) {
      num += 1;
      labelsList.push(`${num}日`);
    }
    return labelsList;
  };

  const [data, setData] = useState({
    data1: 0,
    data2: 0,
    data3: 0,
    data4: 0,
    data5: 0,
    data6: 0,
  });

  useEffect(() => {
    const data1 = Math.round(Math.random() * 10000);
    const data2 = Math.round(Math.random() * 1000);
    const data3 = Math.round(Math.random() * 10000);
    const data4 = Math.round(Math.random() * 1000);
    const data5 = Math.round(Math.random() * 100);
    const data6 = Math.round(Math.random() * 100);
    setData({ ...ProgressEvent, data1, data2, data3, data4, data5, data6 });
  }, []);

  return (
    <Layout>
      <div className="flex h-[92vh] w-full flex-col">
        <div className="flex h-[7%] items-center justify-evenly">
          <DateTime />
          <h1 className="text-2xl font-semibold tracking-widest text-white">
            X&X 立體倉庫看板系統
          </h1>
          <p className="w-[193px] text-white"></p>
        </div>
        <div className="flex h-[92%] w-full justify-evenly">
          <div className="flex h-full w-[15%] flex-col justify-between">
            <div className="h-[35%] w-full rounded-2xl bg-gray-700 py-1">
              <WarehouseUseChart className="h-full w-full" />
            </div>
            <div className="h-[63%] w-full rounded-2xl bg-gray-700">
              <WarehouseUseDetail />
            </div>
          </div>
          <div className="flex h-full w-[83%] flex-col justify-between">
            <div className="flex h-[8%] w-full items-center justify-evenly rounded-2xl bg-gray-700 text-white">
              <div>
                <span>入庫數量：</span>
                <span>{data.data1}</span>
              </div>
              <div>
                <span>入庫箱數：</span>
                <span>{data.data2}</span>
              </div>
              <div>
                <span>出庫數量：</span>
                <span>{data.data3}</span>
              </div>
              <div>
                <span>出庫箱數：</span>
                <span>{data.data4}</span>
              </div>
              <div>
                <span>整理釋放儲位數：</span>
                <span>{data.data5}</span>
              </div>
              <div>
                <span>移庫箱數：</span>
                <span>{data.data6}</span>
              </div>
            </div>
            <div className="h-[29%] w-full rounded-2xl bg-gray-700 p-1">
              <DeliveryEntryChart
                className="h-full w-full"
                bigTitle="每日出入庫長條圖"
                labelTitle1="入庫"
                labelTitle2="出庫"
                xdata={labels(31)}
                barColor1="rgb(124 58 237)"
                barColor2="rgb(219 39 119)"
                barData1={labels(31).map(() =>
                  faker.datatype.number({ min: 0, max: 1000 }),
                )}
                barData2={labels(31).map(() =>
                  faker.datatype.number({ min: 0, max: 1000 }),
                )}
              />
            </div>
            <div className="h-[29%] w-full rounded-2xl bg-gray-700 p-1">
              <StorageBinChart className="h-full w-full" />
            </div>
            <div className="flex h-[29%] w-full justify-between">
              <div className="h-full w-[49.6%] rounded-2xl bg-gray-700 p-1">
                <DeliveryEntryChart
                  className="h-full w-full"
                  bigTitle="每月出入庫長條圖"
                  labelTitle1="入庫"
                  labelTitle2="出庫"
                  xdata={labels(12)}
                  barColor1="rgb(2 132 199)"
                  barColor2="rgb(234 179 8)"
                  barData1={labels(12).map(() =>
                    faker.datatype.number({ min: 0, max: 1000 }),
                  )}
                  barData2={labels(12).map(() =>
                    faker.datatype.number({ min: 0, max: 1000 }),
                  )}
                />
              </div>
              <div className="h-full w-[49.6%] rounded-2xl bg-gray-700 p-1">
                <DeliveryEntryChart
                  className="h-full w-full"
                  bigTitle="預測當日每4小時空儲位柱狀圖"
                  labelTitle1="入庫"
                  labelTitle2="出庫"
                  xdata={[
                    "08:00",
                    "12:00",
                    "16:00",
                    "20:00",
                    "24:00",
                    "04:00",
                    "08:00",
                    "12:00",
                    "16:00",
                    "20:00",
                    "24:00",
                    "04:00",
                  ]}
                  barColor1="rgb(132 204 22)"
                  barColor2="rgb(234 88 12)"
                  barData1={labels(12).map(() =>
                    faker.datatype.number({ min: 0, max: 1000 }),
                  )}
                  barData2={labels(12).map(() =>
                    faker.datatype.number({ min: 0, max: 1000 }),
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FDP;
