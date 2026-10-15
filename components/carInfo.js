import React from "react";
import { useRef } from "react";
import { LegacyDialog, LegacyDialogTitle } from "./legacy/LegacyDialog";
import Image from "next/image";
import carInfo from "../styles/carInfo.png";

const CarInfo = ({ openModal, closeModal, position, carWorking }) => {
  const cancelButtonRef = useRef(null);
  const carInfoDetail = [
    { name: "車輛編號：", value: 1 },
    { name: "車輛電量：", value: "100%" },
    { name: "車輛位置：", value: `[ ${position[0]} , ${position[1]} ]` },
    { name: "車輛狀態：", value: carWorking },
  ];

  return (
    <LegacyDialog
      open={openModal}
      onClose={closeModal}
      initialFocus={cancelButtonRef}
    >
      <div className="background-agv bg-gray-900">
        <div>
          <div className="flex items-center justify-between bg-blue-950 px-4 py-2">
            <Image
              src={carInfo}
              alt=""
              className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"
            />
            <LegacyDialogTitle className="text-2xl font-semibold text-gray-200 sm:text-3xl">
              車體資訊
            </LegacyDialogTitle>
            <div className="h-[30px] w-[30px] sm:h-[45px] sm:w-[45px]"></div>
          </div>
          <div className="flex h-[300px] flex-col items-center justify-evenly">
            {carInfoDetail.map((item) => (
              <div className="mx-16 flex" key={item.name}>
                <p className="text-lg font-bold text-gray-200">{item.name}</p>
                <p className="text-lg text-gray-200">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t-2 border-gray-800 bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-800 px-4 py-2 text-base font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-700 hover:text-white sm:mt-0 sm:w-auto"
          onClick={() => {
            closeModal();
          }}
          ref={cancelButtonRef}
        >
          取消
        </button>
      </div>
    </LegacyDialog>
  );
};

export default CarInfo;
