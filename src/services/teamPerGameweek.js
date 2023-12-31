import {event} from "./fpl/event.js";
import {specificPlayer} from "./fpl/specificPlayer.js";
import {futureFixtures} from "./fpl/futureFixtures.js";

export const futureFixturesDifficulty = async (managerID, eventID) =>{
    const responseList = []
    const data = await event(managerID,eventID);
    //Get the entries of the specific elements
    const picks = data["picks"];
    // Get the elements from `data`
    const elementList = picks.map(pick => pick.element)
    //Loop to fetch specific player information
    //Promise.all() to fetch player summaries in parallel
    const playerSummaryPromises = elementList.map(eachElement => specificPlayer(eachElement))
    const playerSummaryList = await Promise.all(playerSummaryPromises)
    //Custom Service to Pull Future Fixtures
    const upcomingFixturesAPI = await futureFixtures();
    //Store the data portion of the incoming response
    const upcomingFixtures = upcomingFixturesAPI.data;
    const teamFixturesMap = upcomingFixtures.reduce((map, fixture)=>{
        (map[fixture.team_a] || (map[fixture.team_a] = [])).push(fixture);
        (map[fixture.team_h] || (map[fixture.team_h] = [])).push(fixture)
        return map
    },{})
    for(let i = 0; i < playerSummaryList.length; i++) {
        let team_id = playerSummaryList[i]["fixtures"][0].is_home === true ? playerSummaryList[i]["fixtures"][0].team_h : playerSummaryList[i]["fixtures"][0].team_a

        const elementSevenFutureFixtures = (teamFixturesMap[team_id] || [])
            //Limit the items to 7
            .slice(0, 7)

        const playerFixtures = elementSevenFutureFixtures.map((fixture, i) => ({
            fixtureID: fixture.id, //eventID
            playerID: playerSummaryList[i].id, //elementID
            teamID: team_id,
            homeTeamID: playerSummaryList[i]["fixtures"][0].team_h, //team_h
            awayTeamID: playerSummaryList[i]["fixtures"][0].team_a, //team_a
            homeTeamDifficulty: fixture.team_h_difficulty, //team_h_difficulty
            awayTeamDifficulty: fixture.team_a_difficulty,//team_a_difficulty
            kickOffTime: fixture.kickoff_time
        }))
        responseList.push(...playerFixtures)
    }
    return responseList;
}