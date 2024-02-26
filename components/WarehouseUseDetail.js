import { useEffect, useState } from "react";
import WarehouseUseDetailData from "./WarehouseUseDetailData";

const WarehouseUseDetail = () => {
  const [data, setData] = useState({ data1: 0, data2: 0, data3: 0, data4: 0 });

  useEffect(() => {
    const data1 = Math.round(Math.random() * 100);
    const data2 = Math.round(Math.random() * 100);
    const data3 = Math.round(Math.random() * 100);
    const data4 = Math.round(Math.random() * 100);
    setData({ ...ProgressEvent, data1, data2, data3, data4 });
  }, []);

  return (
    <div className="p-3">
      <p className="text-center text-base font-semibold text-white">
        詳細庫位使用率
      </p>
      <WarehouseUseDetailData title={"一層使用率"} data={data.data1} />
      <WarehouseUseDetailData title={"二層使用率"} data={data.data2} />
      <WarehouseUseDetailData title={"三層使用率"} data={data.data3} />
      <WarehouseUseDetailData title={"四層使用率"} data={data.data4} />
    </div>
  );
};

export default WarehouseUseDetail;
