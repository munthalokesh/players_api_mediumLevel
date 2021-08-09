const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json());

const intializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server started successfull");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
intializeServer();

let convertToObjectPlayer = (details) => {
  return {
    playerId: details.player_id,
    playerName: details.player_name,
  };
};
//get all players from player_details table

app.get("/players/", async (request, response) => {
  const query = `SELECT * FROM player_details ORDER BY player_id;`;
  const dbResponse = await db.all(query);
  response.send(dbResponse.map((details) => convertToObjectPlayer(details)));
});

//get a specific player from player_details table

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_details
    WHERE player_id=${playerId};`;
  const dbResponse = await db.get(query);
  response.send(convertToObjectPlayer(dbResponse));
});

//update a specific player details in player_details table

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const query = `UPDATE player_details SET player_name="${playerName}"
   WHERE player_id=${playerId};`;
  await db.run(query);
  response.send("Player Details Updated");
});

//get aaa specific match details from match_details table

const convertToObjectMatch = (details) => {
  return {
    matchId: details.match_id,
    match: details.match,
    year: details.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT * FROM match_details
    WHERE match_id=${matchId};`;
  const dbResponse = await db.get(query);
  response.send(convertToObjectMatch(dbResponse));
});

//get the matches played by a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM match_details INNER JOIN player_match_score ON
    match_details.match_id=player_match_score.match_id
    WHERE player_match_score.player_id=${playerId};`;
  const dbResponse = await db.all(query);
  response.send(dbResponse.map((details) => convertToObjectMatch(details)));
});

//get players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT * FROM player_details INNER JOIN player_match_score ON
   player_details.player_id=player_match_score.player_id
    WHERE player_match_score.match_id=${matchId};`;
  const dbResponse = await db.all(query);
  response.send(dbResponse.map((details) => convertToObjectPlayer(details)));
});

//get stats of a player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score INNER JOIN player_details ON
    player_match_score.player_id=player_details.player_id
    WHERE player_match_score.player_id=${playerId}
    GROUP BY player_match_score.player_id;`;
  const dbResponse = await db.get(query);
  response.send(dbResponse);
});

module.exports = app;
