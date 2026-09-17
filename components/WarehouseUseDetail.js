import WarehouseUseDetailData from "./WarehouseUseDetailData";

const WarehouseUseDetail = () => {
  // Stable display fixture until this panel reads a WMS projection.
  const data = { data1: 68, data2: 54, data3: 72, data4: 61 };

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
