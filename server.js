import express from "express";
import bodyParser from "body-parser";
import axios from 'axios';
import pg from 'pg';
import bcrypt from "bcrypt";
import session from "express-session";
import dotenv from 'dotenv'
import GoogleStrategy from "passport-google-oauth2";
import passport from "passport";


dotenv.config();


const app = express();
const port = 3000;
const salt_rounds = 10;

const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});
db.connect();


app.set("view engine", "ejs");
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
  }
}));


app.use(passport.initialize());
app.use(passport.session());



function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}



app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/search", requireLogin, (req, res) => {
    res.render("search.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});


app.get("/fantasy", requireLogin, (req, res) => {
  res.render("fantasy.ejs");
});


app.get("/test", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM players_info");

    console.log(result.rows);

    res.render("test.ejs", {
      players: result.rows
    });

  } catch (err) {
    console.error(err);
    res.send("Error fetching player info");
  }
});


app.get("/player/:name", async (req, res) => {
  const playerName = req.params.name;
    try {
        const response = await axios.get(
            `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php`,
            { params: { p: playerName } }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch player" });
    }
});


app.get("/api-info", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM players_info WHERE user_id = $1",
      [req.session.userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching team:", err);
    res.status(500).json({ error: err.message });
  }
});







app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {

    req.session.userId = req.user.user_id;

    req.session.save(() => {
      res.redirect("/fantasy");
    });
  }
);




app.post("/add-to-team", async (req, res) => {
  if (!req.session.userId) {
    console.error("No user logged in");
    return res.status(401).json({ 
      success: false, 
      error: "Please log in first" 
    });
  }

  const { player_id, player_name, player_image, position } = req.body;
  const userId = req.session.userId;
  
  console.log("=== ADD TO TEAM ===");
  console.log("User ID:", userId);
  console.log("Player ID:", player_id);
  console.log("Player Name:", player_name);
  console.log("Position:", position);
  
  try {
        await db.query(`
          INSERT INTO players_info
          (user_id, player_id, player_name, player_image, position)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [userId, player_id, player_name, player_image, position]);
    
    console.log(`${player_name} added to ${position} for user ${userId}`);
    res.json({ success: true });
    
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


app.delete("/remove-player/:position", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      error: "Not logged in" 
    });
  }

  const userId = req.session.userId;
  const position = req.params.position;
  
  console.log(`Deleting player from position: ${position} for user ${userId}`);
  
  try {
    await db.query(
      "DELETE FROM players_info WHERE user_id = $1 AND position = $2",
      [userId, position]
    );
    
    console.log(`Player removed from ${position}`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post("/register", async (req, res) => {

    const email = req.body.username;
    const password = req.body.password;

  try {
    const checkResult = await db.query(
      "SELECT * FROM user_info WHERE user_email = $1", 
      [email]
    );
    
    if (checkResult.rows.length > 0) {
      return res.send("Email already exists. Try logging in.");
    }

    const hash = await bcrypt.hash(password, salt_rounds);
    
    console.log("Hashed Password:", hash);
    
    const result = await db.query(
      "INSERT INTO user_info (user_email, user_password) VALUES ($1, $2) RETURNING user_id",
      [email, hash]
    );
    
    const newUserId = result.rows[0].user_id;
    req.session.userId = newUserId;
    
    console.log(`User registered with ID: ${newUserId}`);
    
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Registration error");
      }
      res.redirect("/fantasy");
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).send("Server error");
  }
});


app.post("/login", async (req, res) => {

  const email = req.body.username;
  const loginPassword = req.body.password;

  try {
    const result = await db.query("SELECT * FROM user_info WHERE user_email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.send("User not found");
    }

    const user = result.rows[0];
    const storedHashedPassword = user.user_password;
    
    const isMatch = await bcrypt.compare(loginPassword, storedHashedPassword);
    
    if (isMatch) {
      req.session.userId = user.user_id;
      
      console.log("Login successful, user ID:", req.session.userId);
      
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).send("Login error");
        }
        res.redirect("/fantasy");
      });
    } else {
      res.send("Incorrect Password");
    }
    
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed");
    }
    res.redirect("/login");
  });
});


passport.use(
  "google",
   new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  }, async (accessToken, refreshToken, profile, cb) => {
    console.log(profile);

        try {
          console.log(profile);
          const result = await db.query("SELECT * FROM user_info WHERE user_email = $1", [
            profile.email,
          ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO user_info (user_email, user_password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
      cb(err);
    }

  }
));


passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
