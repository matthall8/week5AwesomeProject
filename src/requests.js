const request = require('request');

// Checks if city has enough pollution and distance data
const cityHasData = (city, pollutants = ['pm10', 'no2', 'o3']) => {
  const tracker = [false, false, false];
  city.measurements.forEach((measure) => {
    if (pollutants.includes(measure.parameter)) {
      const index = pollutants.indexOf(measure.parameter);
      tracker[index] = true;
    }
  });
  // The distance property is required to filter out far away results
  const hasDistance = Object.prototype.hasOwnProperty.call(city, 'distance');
  const test = tracker.reduce((acc, ele) => (ele ? acc + 1 : acc), 0);
  return test >= 2 && hasDistance;
};

// Converts ppm units into µg/m³ so that data is comparable
const convertUnits = (city, pollutants = ['no2', 'o3']) => {
  const molecularMassArr = [46, 48];
  city.measurements.forEach((measure) => {
    if (pollutants.includes(measure.parameter) && measure.unit === 'ppm') {
      measure.unit = 'µg/m³';
      // µg/m³ = ppm * (Molecular mass/ molar volume of air at 25degrees)/1000
      const molMass = molecularMassArr[pollutants.indexOf(measure.parameter)];
      measure.value = measure.value * (molMass / 24.45) * 1000;
      measure.value = Math.round(measure.value * 10) / 10;
    }
    return measure;
  });
  return city;
};

// The code below is used to get Air quality data using lat,long & radius .s
const pollutionDataRequest = (lat, long, cb, radius = 500000) => {
  const limit = 1000;
  const url = `https://api.openaq.org/v1/latest?coordinates=${lat},${long}&radius=${radius}&limit=${limit}`;
  request(url, (err, res, body) => {
    if (err) {
      cb(new Error('There was an error with the data request to openAQ'));
    } else if (res.statusCode === 200) {
      // We should check that the response is 200
      const cityArray = JSON.parse(body).results;
      if (cityArray.length > 0) {
        let chosenCity = '';
        cityArray.forEach((city) => {
          if (cityHasData(city) && !chosenCity) {
            chosenCity = city;
          } else if (cityHasData(city) && city.distance < chosenCity.distance) {
            chosenCity = city;
          }
        });
        cb(null, convertUnits(chosenCity));
      } else {
        cb(new Error(`Sorry, no pollution data could be found within ${radius} of this city`));
      }
    } else { cb(new Error(`There was an issue with the request to openAQ. REST status code: ${res.statusCode}`)); }
  });
};

module.exports = pollutionDataRequest;
