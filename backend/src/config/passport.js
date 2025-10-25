import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { OIDCStrategy } from "passport-azure-ad";
import User from "../models/User.js";

// ✅ Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: profile.emails[0].value,
            password: null, // No hay password local
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ✅ Microsoft Strategy
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
      clientID: process.env.MS_CLIENT_ID,
      clientSecret: process.env.MS_CLIENT_SECRET,
      responseType: "code",
      responseMode: "form_post",
      redirectUrl: "http://localhost:4000/auth/microsoft/callback",
      allowHttpForRedirectUrl: true,
      scope: ["profile", "email"],
    },
    async (iss, sub, profile, accessToken, refreshToken, done) => {
      try {
        let user = await User.findOne({ email: profile._json.preferred_username });

        if (!user) {
          user = await User.create({
            username: profile.displayName || profile._json.name,
            email: profile._json.preferred_username,
            password: null,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export default passport;
