const WarehouseUseDetailData = ({ title, data }) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between">
        <span className="text-white">{title}</span>
        {data && data >= 0 ? (
          <span className="text-white">{`${data}%`}</span>
        ) : (
          <span className="text-white">{"0%"}</span>
        )}
      </div>
      <div className="mt-1 h-2 w-full rounded-lg bg-gray-800">
        {data && data >= 0 ? (
          <div
            className="flow flex h-full justify-end rounded-lg bg-amber-400"
            style={{ width: `${data}%` }}
          ></div>
        ) : (
          <div
            className="flow flex h-full justify-end rounded-lg bg-amber-400"
            style={{ width: "0%" }}
          ></div>
        )}
      </div>
    </div>
  );
};

export default WarehouseUseDetailData;
