import { useState, useEffect } from "react";

const DateTime = () => {
  const [currentDateTime, setCurrentDateTime] = useState();

  const getDateTime = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const formatTime = (time) => {
      return time < 10 ? `0${time}` : time;
    };

    return `${year} / ${formatTime(month)} / ${formatTime(day)} -- ${formatTime(
      hours,
    )} : ${formatTime(minutes)} : ${formatTime(seconds)}`;
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newDateTime = getDateTime();
      setCurrentDateTime(newDateTime);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
  return <p className="text-white">{currentDateTime}</p>;
};

export default DateTime;
