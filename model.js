// Soccer Analytics Lab — Multi-Factor Match Model
function buildTeamProfile(stats={}){return{elo:Number(stats.elo??1500),xgFor:Number(stats.xgFor??1.3),shots:Number(stats.shots??12),shotsOnTarget:Number(stats.shotsOnTarget??4),xgAgainst:Number(stats.xgAgainst??1.3),form:Number(stats.form??0),attack:Number(stats.attack??1),defense:Number(stats.defense??1),possession:Number(stats.possession??50)}}
function predictMatch(team1Stats,team2Stats,venue="neutral"){
 const team1=buildTeamProfile(team1Stats),team2=buildTeamProfile(team2Stats);
 let venueAdjustment=venue==="home"?0.18:venue==="away"?-0.18:0;
 const eloGap=(team1.elo-team2.elo)/400;
 // Softer around close matchups, but still very strong for extreme Elo gaps.
 const strength=tanh(eloGap*0.95);
 const attack1=0.45*team1.xgFor+0.20*(team1.shots/10)+0.15*(team1.shotsOnTarget/4)+0.10*team1.attack+0.10*(team1.possession/50);
 const attack2=0.45*team2.xgFor+0.20*(team2.shots/10)+0.15*(team2.shotsOnTarget/4)+0.10*team2.attack+0.10*(team2.possession/50);
 const defense1=0.70*team1.xgAgainst+0.30*team1.defense;
 const defense2=0.70*team2.xgAgainst+0.30*team2.defense;
 const base1=1.15+(attack1-defense2)*0.50+team1.form*0.04+venueAdjustment;
 const base2=1.15+(attack2-defense1)*0.50+team2.form*0.04-venueAdjustment;
 const rawTotal=Math.max(1.8,base1+base2);
 // Scoring-volume boost grows slowly for close games and much more for extreme mismatches.
 const gapBoost=Math.min(1.35,Math.pow(Math.abs(strength),1.55)*1.35);
 const totalGoals=Math.min(5.6,rawTotal+gapBoost);
 // Keep close Elo matchups competitive; only extreme gaps become strongly asymmetric.
 const share1=0.5+0.43*strength;
 const expectedGoals1=Math.max(0.06,totalGoals*share1);
 const expectedGoals2=Math.max(0.06,totalGoals*(1-share1));
 return{expectedGoals:{team1:expectedGoals1,team2:expectedGoals2},eloDifference:team1.elo-team2.elo}
}
function poissonProbability(goals,lambda){let factorial=1;for(let i=2;i<=goals;i++)factorial*=i;return Math.exp(-lambda)*Math.pow(lambda,goals)/factorial}
function scoreMatrix(prediction,maxGoals=10){const matrix=[];for(let team1Goals=0;team1Goals<=maxGoals;team1Goals++)for(let team2Goals=0;team2Goals<=maxGoals;team2Goals++)matrix.push({team1Goals,team2Goals,probability:poissonProbability(team1Goals,prediction.expectedGoals.team1)*poissonProbability(team2Goals,prediction.expectedGoals.team2)});return matrix.sort((a,b)=>b.probability-a.probability)}
function regulationProbabilities(prediction,maxGoals=10){const scores=scoreMatrix(prediction,maxGoals);let team1Win=0,draw=0,team2Win=0;for(const s of scores){if(s.team1Goals>s.team2Goals)team1Win+=s.probability;else if(s.team1Goals===s.team2Goals)draw+=s.probability;else team2Win+=s.probability}const total=team1Win+draw+team2Win;return{team1Win:team1Win/total,draw:draw/total,team2Win:team2Win/total}}
function knockoutStages(prediction,regulation){const regScore=scoreMatrix(prediction,10)[0];if(regScore.team1Goals!==regScore.team2Goals)return{regulationScore:regScore,extraTimeScore:null,penaltyWinner:null,penaltyScore:'not needed',penaltyRounds:0,extraTimeNeeded:false};const etPrediction={expectedGoals:{team1:prediction.expectedGoals.team1/3,team2:prediction.expectedGoals.team2/3}};const etAdds=scoreMatrix(etPrediction,4)[0];const etScore={team1Goals:regScore.team1Goals+etAdds.team1Goals,team2Goals:regScore.team2Goals+etAdds.team2Goals};if(etScore.team1Goals!==etScore.team2Goals)return{regulationScore:regScore,extraTimeScore:etScore,penaltyWinner:null,penaltyScore:'not needed',penaltyRounds:0,extraTimeNeeded:true};const p1=regulation.team1Win/(regulation.team1Win+regulation.team2Win);const winner=p1>=0.5?'team1':'team2';const penaltyScore=winner==='team1'?'5–4':'4–5';return{regulationScore:regScore,extraTimeScore:etScore,penaltyWinner:winner,penaltyScore,penaltyRounds:5,extraTimeNeeded:true,penaltyNote:'If tied after the first five kicks, sudden-death rounds continue until one team wins.'}}
function analyzeMatch(team1Stats,team2Stats,venue="neutral",noDraw=false){const prediction=predictMatch(team1Stats,team2Stats,venue);const regulation=regulationProbabilities(prediction,10);const scores=scoreMatrix(prediction,10);const stages=noDraw?knockoutStages(prediction,regulation):null;let probabilities=regulation;if(noDraw){const split=regulation.draw/2;probabilities={team1Win:regulation.team1Win+split,draw:0,team2Win:regulation.team2Win+split}}return{prediction,probabilities,format:noDraw?'extraTimePenalties':'drawAllowed',regulationProbabilities:regulation,mostLikelyScores:scores.slice(0,10),knockoutStages:stages}}
window.SoccerModel={buildTeamProfile,predictMatch,poissonProbability,scoreMatrix,regulationProbabilities,knockoutStages,analyzeMatch};