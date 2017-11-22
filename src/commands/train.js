require("string_score");
const AWS = require('paws-sdk');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const _ = require('lodash');

/**
 * Initializes AWS
 *
 * @param profile
 * @param region
 */
function initializeAWS(profile, region) {
  // Initialize the AWS configuration
  let credentials = new AWS.SharedIniFileCredentials({
    profile
  });

  AWS.config.update({
    region
  });
  AWS.config.credentials = credentials;

}

/**
 * Queries the missing utterances
 * @param botName
 * @returns {LexModelBuildingService.ListOfUtterance}
 */
const getMissingUtterances = async(function (botName) {
  try {
    let params = {
      botName,
      botVersions: [
        '$LATEST'
      ],
      statusType: 'Detected' // Change to Missed
    };
    let lexService = new AWS.LexModelBuildingService();
    let response = await(lexService.getUtterancesView(params));

    return _.filter(response.data.utterances[0].utterances, (item) => {
      return item.count >= 5;
    });
  } catch (error) {
    console.error(error.stack);
  }
});

const getAllIntentsForBotWithUtterances = async(function (botName) {
  try {
    let lexService = new AWS.LexModelBuildingService();
    let response = await(lexService.getBot({
      name: botName,
      versionOrAlias: '$LATEST',
    }));
    let intents = response.data.intents;
    return _.map(intents, (intent) => {
      let service = new AWS.LexModelBuildingService();
      let response = await(service.getIntent({
        version: "$LATEST",
        name: intent.intentName,
      }));

      return {
        name: intent.intentName,
        utterances: response.data.sampleUtterances
      }
    });
  } catch (error) {
    console.error(error.stack);
  }
});

const processUtterances = function(missingUtterances, intentsUtteranceMap){
  _.each(missingUtterances, (item) => {
    let utterance = item.utteranceString;
    _.each(intentsUtteranceMap, (intentData) => {
      _.each(intentData.utterances, (intentUtterance) => {
        let score = intentUtterance.score(utterance);
        if (score >= 0.80) {
          console.log('---Simulation Only---');
          console.log(`Adding "${utterance}" to this intent: ${intentData.name}`)
        }
      });
    });
  });
};

module.exports = async(function (botName, profile, region) {
  console.log(`Training ${botName}..`);
  initializeAWS(profile, region);
  let missingUtterances = await(getMissingUtterances(botName));
  let intentsUtteranceMap = await(getAllIntentsForBotWithUtterances(botName));

  processUtterances(missingUtterances, intentsUtteranceMap);
});