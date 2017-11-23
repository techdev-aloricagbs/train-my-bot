"use strict";

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
      statusType: 'Missed'
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

      return response.data;
    });
  } catch (error) {
    console.error(error.stack);
  }
});

const processUtterances = async(function(missingUtterances, intentsUtteranceMap){
  console.log('Processing utterances..');
  _.each(missingUtterances, (item) => {
    let utterance = item.utteranceString;
    _.each(intentsUtteranceMap, (intentData) => {
      let checksum = intentData.checksum;
      _.each(intentData.sampleUtterances, (intentUtterance) => {
        let score = intentUtterance.score(utterance);
        if (score >= 0.80 && checksum === intentData.checksum) {
          console.log('Adding utterance to intent..');
          intentData.sampleUtterances.push(utterance);
          delete intentData.lastUpdatedDate;
          delete intentData.createdDate;
          delete intentData.version;
          let service = new AWS.LexModelBuildingService();
          let response = await(service.putIntent(intentData));
          checksum = response.data.checksum;
        }
      });
    });
  });
});

const buildBot = async(function(botName) {
  console.log('Building the bot..');
  try {
    let lexService = new AWS.LexModelBuildingService();
    let response = await(lexService.getBot({
      name: botName,
      versionOrAlias: '$LATEST',
    }));

    let botData = response.data;
    // Update all intents for now...
    botData.intents = _.map(botData.intents, (intent) => {
      return {
        intentName: intent.intentName,
        intentVersion: '$LATEST',
      }
    });
    botData.processBehavior = 'BUILD';
    delete botData.lastUpdatedDate;
    delete botData.createdDate;
    delete botData.version;
    delete botData.status;
    delete botData.failureReason;
    await(lexService.putBot(botData));
    console.log('Build finished..');
  } catch (error) {
    console.error(error.stack);
  }

});

module.exports = async(function (botName, profile, region) {
  console.log(`Training ${botName}..`);
  initializeAWS(profile, region);
  let missingUtterances = await(getMissingUtterances(botName));
  let intentsUtteranceMap = await(getAllIntentsForBotWithUtterances(botName));

  await(processUtterances(missingUtterances, intentsUtteranceMap));
  await(buildBot(botName));
  console.log('Training finish!');
});