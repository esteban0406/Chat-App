import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { OIDCStrategy } from "passport-azure-ad";
import User from "../models/User.js";

// =====================
// Google Strategy
// =====================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use( 
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🟢 GOOGLE_CALLBACK_URL in use:", JSON.stringify(process.env.GOOGLE_CALLBACK_URL));
          let user = await User.findOne({ email: profile.emails[0].value });

          if (!user) {
            user = await User.create({
              username: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos?.[0]?.value || null,
              provider: "google",
            });
          } else {
            user.username = profile.displayName;
            user.avatar = profile.photos?.[0]?.value || user.avatar;
            user.provider = "google";
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn("⚠️ GoogleStrategy no inicializado: faltan GOOGLE_CLIENT_ID/SECRET");
}

// =====================
// Microsoft Strategy
// =====================
if (process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET) {
  passport.use(
    new OIDCStrategy(
      {
        identityMetadata:
          "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
        clientID: process.env.MS_CLIENT_ID,
        clientSecret: process.env.MS_CLIENT_SECRET,
        redirectUrl: process.env.MS_CALLBACK_URL || "http://localhost:4000/auth/microsoft/callback",
        responseType: "code",
        responseMode: "form_post",
        allowHttpForRedirectUrl: true,
        scope: ["profile", "email"],
      },
      async (iss, sub, profile, accessToken, refreshToken, done) => {
        try {
          const email = profile._json.preferred_username;
          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              username: profile.displayName || profile._json.name,
              email,
              avatar: profile._json.picture || null,
              provider: "microsoft",
            });
          } else {
            user.username = profile.displayName || profile._json.name || user.username;
            user.avatar = profile._json.picture || user.avatar;
            user.provider = "microsoft";
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn("⚠️ MicrosoftStrategy no inicializado: faltan MS_CLIENT_ID/SECRET");
}

// =====================
// Serialize / Deserialize
// =====================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
