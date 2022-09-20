# Age of Empires II Rank

Using the data from aoe2.net, this page displays the rank and civilizations of current players.

You need to provide `profile_id` from aoe2.net. (`e.g. https://aoe2.net/#profile-`**247224**`)`

## Stats Against Another Player

You can check the score between two players: `vs.html`

You can check the win rate against the current opponent: `current.html`

# API

`/api/vs/:p1ID/:p2ID`

Searches `p1` game history for the last 1000 games and returns all the 1v1 games played against `p2`.

You can also create a Nightbot command for the current opponent: `/api/current/:gamecount/:p1ID`

`$(eval r=$(urlfetch https://aoestats.vercel.app/api/current/1000/247224); t=r.playerName+' won '+r.winCount+'('+r.winRate+'%) vs '+r.opponentName+ ' won '+r.loseCount+'('+r.loseRate+'%)'; t;)`

URL: https://aoestats.vercel.app/api/current/1000/247224

Will return:

```json
{
  "loseCount": 0,
  "winCount": 3,
  "playedCount": 3,
  "playerName": "Survivalist",
  "playerRating": 2017,
  "opponentName": "AR12",
  "opponentRating": 1758,
  "loseRate": 0,
  "winRate": 100
}
```
