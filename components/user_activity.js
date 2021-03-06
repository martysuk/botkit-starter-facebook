const request = require('request');

const { User } = require('./models/user.js');
const { Order } = require('./models/order.js');

const { shopGoods, aboutProduct } = require(`${__dirname}/best_buy_modules/api_usage.js`);
const { goBackToMainMenu, goToShopOrMenu } = require(`${__dirname}/all_quick_replies.js`);


const usage_tip = () => {
  console.log('~~~~~~~~~~');
  console.log('Botkit Studio Starter Kit');
  console.log('Execute your bot application like this:');
  console.log('page_token=<MY PAGE TOKEN> verify_token=<MY VERIFY TOKEN> studio_token=<MY BOTKIT STUDIO TOKEN> node bot.js');
  console.log('Get Facebook token here: https://developers.facebook.com/docs/messenger-platform/implementation');
  console.log('Get a Botkit Studio token here: https://studio.botkit.ai/');
  console.log('~~~~~~~~~~');
};


const getUserInfo = async userID => new Promise(async (resolve, reject) => {
  // throw Error('test')
  const usersPublicProfile = `${await 'https://graph.facebook.com/v2.6/' + userID}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${process.env.page_token}`;
  request({
    url: usersPublicProfile,
    json: true, // parse
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      resolve(body);
    } else {
      console.log(error);
      reject(error);
    }
  });
}).catch((error) => { console.log(error.message); }); // не ловить помилки


const addNewUserToDB = async (userID) => {
  const userInfo = await getUserInfo(userID).catch(err => console.log(err));
  const user = new User({
    facebookID: userID,
    fullName: `${userInfo.first_name} ${userInfo.last_name}`,
    purchases: [],
    favourites: [],
  });
  user.save().then((doc) => {
    // res.send(doc);
  }, (err) => /* res.status(400).send(err) */ { });
};

const getUserPurchases = (bot, userID) => {
  // check if user exists in db
  User.find({ facebookID: userID }).then((user) => {
    if (!user) { // no user
      bot.say({ channel: userID, text: 'You have no purchases yet. Would you like to add any?', quick_replies: goToShopOrMenu });
    } else { // he|she exists
      // const { purchases } = user;
      // const start = 0;
      // const end = 5;


      // const nextFivePurchases = purchases.slice(start, end);
      // get all from DB, send last 5 by buttons + buttons [next 5, main menu]

      // let quick_replies = quick_replies.push(..nextFivePurchases)
      // each button in with payload - date_userID

      // if(length > 5){ +next button }


      // get productID from db searching through userID and date
      // aboutProduct(productID) - returns picture and info
      // send them and back to main menu button and repeat? button
      bot.say({
        channel: userID,
        text: 'Your last purchases',
        quick_replies: goBackToMainMenu,
      });
    }
  }).catch(err => console.log(err));
};

const getUserFavourites = (bot, userID) => {
  // get list of all available goods, send top 10 +  buttons [next 5, main menu]
  User.find({ facebookID: userID }).then((user) => {
    if (!user) { // no
      bot.reply(userID, {
        text: 'You have no favourites yet. Would you like to add any?',
        quick_replies: goToShopOrMenu,
      });
    } else { // yes
      // const { favourites } = user;
      // const start = 0;
      // const end = 5;


      // const nextFivePurchases = purchases.slice(start, end);
      // get all from DB, send last 5 by buttons + buttons [next 5, main menu]
      // let quick_replies = quick_replies.push(..nextFiveFavourites)
      // if(length > 5){ +next button }
      bot.reply(userID, { text: 'Your last purchases', quick_replies: goBackToMainMenu });
    }
  }).catch(err => console.log(err));
};


const feedbackTwoDaysAfter = (bot, message) => {
  // get all users that have bought smth 2 days ago to gather the feedback
  User.find({}, (recentClientsArr, error) => {
    if (error) {
      return console.log(error);
    }
    for (let i = 0; i < recentClientsArr.length; i++) {
      bot.startConversation(message, (err, convo) => {
        if (err) {
          return console.log(err);
        }
        convo.ask({
          channel: recentClientsArr[i].facebookID,
          text: `Thanks for being with us, ${recentClientsArr[i].fullName}.
                             \nRate the product you bought from 1 to 10 please`,
        }, (response, error) => { /* якщо кілька товарів за день - назва товару у пвдм */
          if (error) {
            return console.log(error);
          }
          Order.findOneAndUpdate({ buyer: recentClientsArr[i]._id }, { $set: { feedback: response.text } });
          convo.say({
            channel: recentClientsArr[i].facebookID,
            text: 'Thanks for your feedback! See you :)',
            quick_replies: goBackToMainMenu,
          });
        });
      });
    }
  });
};


module.exports = {
  usage_tip,
  getUserInfo,
  getUserPurchases,
  getUserFavourites,
  feedbackTwoDaysAfter,
  addNewUserToDB
};
