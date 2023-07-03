const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const databasePath = path.join(__dirname, "covid19India.db");
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDictrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT
      *
    FROM
      state;`;
  const stateArray = await database.all(getStateQuery);
  response.send(
    stateArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT *
  FROM state
  WHERE state_id = ${stateId}`;
  const state = await database.get(getStateQuery);
  response.send(
    state.map((each) => convertStateDbObjectToResponseObject(each))
  );
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT *
  FROM district
  WHERE district_id = ${districtId}`;
  const district = await database.get(getDistrictQuery);
  response.send(
    district.map((each) => convertDictrictDbObjectToResponseObject(each))
  );
});

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE 
  FROM district
  WHERE district_id = ${districtId}`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE 
        district
    SET 
       district_name = ${districtName},
       state_id = ${stateId},
       cases = ${cases},
       cured = ${cured},
       active = ${active},
       deaths = ${deaths}
       WHERE district_id = ${districtId};
       `;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district
    WHERE state_id = ${stateId}`;
  const stateStates = await database.all(getStateQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictNameQuery = `
  SELECT state_name
  FROM district
  NATURAL JOIN
    state
  WHERE district_id = ${districtId}`;
  const stateName = await database.get(getDistrictNameQuery);
  response.send(stateName);
});

module.exports = app;
