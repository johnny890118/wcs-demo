import Layout from "@/components/layout";
import DeliveryEntryChart from "@/components/DeliveryEntryChart";
import StorageBinChart from "@/components/StorageBinChart";
import WarehouseUseChart from "@/components/WarehouseUseChart";
import WarehouseUseDetail from "@/components/WarehouseUseDetail";
import DateTime from "@/components/DateTime";

// Stable sample series keep the legacy dashboard reproducible until its cards
// are replaced by WMS/WCS projections. They are display fixtures, not telemetry.
const demoSeries = (count, seed) =>
  Array.from({ length: count }, (_, index) =>
    Math.round(((index * 73 + seed * 41) % 101) * 9.7),
  );

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

  // Stable display fixture until the dashboard reads WMS/WCS projections.
  const data = {
    data1: 8420,
    data2: 486,
    data3: 7910,
    data4: 451,
    data5: 37,
    data6: 29,
  };

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
                barData1={demoSeries(31, 1)}
                barData2={demoSeries(31, 2)}
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
                  barData1={demoSeries(12, 3)}
                  barData2={demoSeries(12, 4)}
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
                  barData1={demoSeries(12, 5)}
                  barData2={demoSeries(12, 6)}
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
