const axios = require('axios');
const { DateTime } = require('luxon');

const timeEndPoint = (location) =>
  'http://worldtimeapi.org/api/timezone/' + location;

async function lookUpTime(location) {
  try {
    const response = await axios.get(timeEndPoint(location));
    const { datetime } = response.data;
    console.log(response.data);
    console.log(datetime);
    const dateTimeObj = DateTime.fromISO(datetime, { setZone: true });

    // Format the time while keeping the original timezone
    const timeString = dateTimeObj.toLocaleString(DateTime.TIME_WITH_SECONDS);
    return {
      time: timeString,
    };
  } catch (err) {
    console.log(err.message);
    return {
      error: err.message,
    };
  }
}

lookUpTime('america/chicago')
  .then((success) => {
    console.log(success);
  })
  .catch((err) => console.log(err));
