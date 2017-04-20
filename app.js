const express = require('express');
const path = require('path');
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/libs', express.static(path.join(__dirname, 'node_modules')));

const overpass = require('query-overpass');
/**
 * Based on http://stackoverflow.com/questions/20322823/how-to-get-all-roads-around-a-given-location-in-openstreetmap
 * and http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_API_by_Example
 *
 * @param lat
 * @param lon
 * @returns {Promise}
 */
const getNearestRoad = (lat, lon) => {
  const maxDist = 10;
  const query = `[out:json];
      way
      (around:${maxDist},${lat},${lon})
      ["highway"];
    (
      ._;
      >;
    );
    out;`;

  return new Promise((resolve, reject) => {
    overpass(query, (error, roads) => {
      if (error) {
        return reject(error);
      } else if (roads.features.length < 1) {
        return reject({statusCode: 404, message: "No roads found"});
      } else {
        return resolve(roads.features[0]);
      }
    });
  });
};

app.use('/road/:lat/:lon', (req, res) => {
  const lat = parseFloat(req.params.lat),
    lon = parseFloat(req.params.lon);

  getNearestRoad(lat, lon).then(road => {
    return res.json(road);
  }).catch(err => {
    return res.status(err.statusCode).json(err);
  });
});

app.use('/', (req, res) => {
  res.render('index');
});

// error handler
app.use(function (err, req, res, next) {
  console.log(err);
  res.json(err);
});

module.exports = app;
