import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { OIDCStrategy } from "passport-azure-ad";
import User from "../models/User.js";

// =====================
// Google Strategy
// =====================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, 
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Crear nuevo usuario con datos de Google
          user = await User.create({
            username: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos?.[0]?.value || null,
            provider: "google",
          });
        } else {
          // Actualizar datos si ya existe
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

// =====================
// Microsoft Strategy
// =====================
passport.use(
  new OIDCStrategy(
    {
      identityMetadata:
        "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
      clientID: process.env.MS_CLIENT_ID,
      clientSecret: process.env.MS_CLIENT_SECRET,
      responseType: "code",
      responseMode: "form_post",
      redirectUrl: "http://localhost:4000/auth/microsoft/callback", // ajusta en prod
      allowHttpForRedirectUrl: true,
      scope: ["profile", "email"],
    },
    async (iss, sub, profile, accessToken, refreshToken, done) => {
      try {
        const email = profile._json.preferred_username;
        let user = await User.findOne({ email });

        if (!user) {
          // Crear nuevo usuario con datos de Microsoft
          user = await User.create({
            username: profile.displayName || profile._json.name,
            email,
            avatar: profile._json.picture || null, // si MS lo provee
            provider: "microsoft",
          });
        } else {
          // Actualizar datos si ya existe
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

// =====================
// Serialize/Deserialize
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
