const fs = require('fs');
const path = require('path');
const citySearch = require('./search.js');
const pollutionDataRequest = require('./requests');

/* Function to handle requests for the homePage and send back appropriate response */

const homePage = (response) => {
  const filePath = path.join(__dirname, '..', 'public', 'index.html');
  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/html' });
      response.end('<h1>Sorry, something went wrong</h1>');
    } else {
      response.writeHead(200, { 'Content-type': 'text/html' });
      response.end(file);
    }
  });
};

/* Function to handle requests for the assets e.g. css, images, javascript pages
and send back the appropriate response */

const assetsHandler = (url, response) => {
  const extension = url.split('.')[1];
  const extensionType = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    ico: 'image/x-icon',
    jpg: 'image/jpeg',
    png: 'image/png',
    json: 'application/json',
  };
  const filePath = path.join(__dirname, '..', 'public', url);
  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/html' });
      response.end('<h1>sorry, something went wrong</h1>');
    } else {
      response.writeHead(200, { 'Content-Type': extensionType[extension] });
      response.end(file);
    }
  });
};

/* Fn to handle data requests from the frontend using the POST method. */

const pollutionDataHandler = (request, response) => {
  /* Using post method so data is coming in streams, need to create a variable
  to store all data */
  let allData = '';
  /* Method to capture each stream of data and store it in the 'allData'
  variable  */
  request.on('data', (data) => {
    allData += data;
  });
  /* Method to trigger when all data has been received */
  request.on('end', () => {
    allData = JSON.parse(allData);
    /* The data is validated by checking if it has the properties long and lat */
    const dataClean = Object.prototype.hasOwnProperty.call(allData, 'lat') && Object.prototype.hasOwnProperty.call(allData, 'long');
    if (dataClean) {
      pollutionDataRequest(allData.lat, allData.long, (err, APIresp) => {
        if (err) {
          /* In the case that there is no data for these coordinates, it will
           return a 204 response (i.e. no content) */
          response.writeHead(204, { 'Content-Type': 'text/plain' });
          response.end(err.message);
        } else {
          /* Define the response headers - which is 200 and JSON */
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify(APIresp));
        }
      });
    } else {
      response.writeHead(422, { 'Content-Type': 'text/plain' });
      response.end('Coordinate data is not in the expected format');
    }
  });
};

/* Fn to handle auto complete requests */

const autocompleteHandler = (request, response) => {
  const { url } = request;
  let [, query] = url.split('q=');
  /* Decoding deals with issues related to URL encoding */
  query = decodeURI(query);
  // Cleanses all non alphanumeric data out of the query
  query = query.replace(/[^a-zA-Z0-9 -]/g, '');
  /* citySearch function returns an array of city objects for autocomplete */
  const cityList = citySearch(query);
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(cityList));
};


/* Function to handle 404 Pages (Pages not found) and return the appropriate
response code and content */

const notFound = (response) => {
  response.writeHead(404, { 'Content-Type': 'text/html' });
  response.end('<h1>Sorry, Page Not Found</h1>');
};

module.exports = {
  homePage,
  notFound,
  assetsHandler,
  pollutionDataHandler,
  autocompleteHandler,
};
