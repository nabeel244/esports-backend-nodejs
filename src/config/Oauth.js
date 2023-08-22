const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
const Torus = require("@toruslabs/torus-embed");
const request = require("request");

const asyncHandler = require("../utils/asyncHandler");
const { codeGenerator } = require("../utils/codeGenerator");
const User = require("../models/userModel");

dotenv.config();
const clientId = process.env.REDDIT_CLIENT_ID;
const redditSec = process.env.REDDIT_SEC_ID;

// const torus = new Torus();

// // Torus Login
// exports.torusLogin = asyncHandler(async (req, res, next) => {
//   const { torusVerifier } = req.body;

//   const torusKey = await torus.getPublicAddress({
//     verifier: torusVerifier,
//     verifierId: process.env.TORUS_CLIENT_ID,
//   });

//   const token = jwt.sign({ torusKey }, TORUS_CLIENT_SEC);
//   res.send({ success: true, token });
// });

const opts = {
  secretOrKey: process.env.JWT_SEC,
};

opts.jwtFromRequest = function (req) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.jwt;
  }
  return token;
};

passport.use(
  new JwtStrategy(opts, function (jwt_payload, done) {
    return done(null, jwt_payload.data);
  })
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FB_REDIRECT,
      profileFields: ["emails", "displayName", "profileUrl"],
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT,
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CON_KEY,
      consumerSecret: process.env.TWITTER_CON_SEC,
      callbackURL: process.env.TWITTER_REDIRECT,
      userProfileURL:
        "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true",
      includeEmail: true,
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

exports.redirectCallback = asyncHandler(async (req, res, next) => {
  const email = req.user._json.email;
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: req.user.displayName,
      email: req.user._json.email,
      password: req.user.id,
      username: req.user._json.email.split("@")[0],
      socialId: req.user.id,
      info: {
        friendCode: codeGenerator(),
      },
    });
    user.password = undefined;
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SEC, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie("jwt", token);
  req.user = user;
  res.redirect("/success");
});

exports.redditAuth = (req, res) => {
  // Construct the URL to the Reddit authorization page
  const state = Math.random().toString(36).substring(2, 15);
  const redUri = encodeURIComponent(`${process.env.REDDIT_REDIRECT}`);
  const scope = encodeURIComponent("identity");
  const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${redUri}&duration=temporary&scope=${scope}`;
  res.redirect(authUrl);
};

exports.redditCallback = (req, res, next) => {
  // Exchange the authorization code for an access token
  const code = req.query.code;

  const requestOptions = {
    url: "https://www.reddit.com/api/v1/access_token",
    method: "POST",
    headers: {
      "User-Agent": "My App",
      Authorization:
        "Basic " + Buffer.from(`${clientId}:${redditSec}`).toString("base64"),
    },
    form: {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.REDDIT_REDIRECT,
    },
  };

  request(requestOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      // Parse the JSON response
      const json = JSON.parse(body);

      // Use the access token to get the user's information
      const requestOptions = {
        url: "https://oauth.reddit.com/api/v1/me",
        method: "GET",
        headers: {
          "User-Agent": "My App",
          Authorization: "Bearer " + json.access_token,
        },
      };

      request(
        requestOptions,
        asyncHandler(async (error, response, body) => {
          if (!error && response.statusCode === 200) {
            const json = JSON.parse(body);
            const username = json.subreddit.display_name;

            let user = await User.findOne({ username });

            if (!user) {
              user = await User.create({
                name: json.name,
                username,
                email: `${json.username}@email.com`,
                password: json.id,
                socialId: json.id,
              });
            }

            const token = jwt.sign({ id: user.id }, process.env.JWT_SEC, {
              expiresIn: process.env.JWT_EXPIRES_IN,
            });

            res.cookie("jwt", token);
            req.user = user;
            res.redirect("/success");
          } else {
            return next(
              new ErrorHandler("Error getting user information", 400)
            );
          }
        })
      );
    } else {
      return next(
        new ErrorHandler(
          "Error exchaning autorization code for accessToken",
          400
        )
      );
    }
  });
};

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
