const express = require('express')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth2').Strategy
const session = require("express-session")
const app = express()
const port = 3000

app.use(express.urlencoded({extended: false}))

// Session middleware
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize())
app.use(passport.session())

const GOOGLE_CLIENT_ID = require('./secrets').clientId
const GOOGLE_CLIENT_SECRET = require('./secrets').secret

authUser = (request, accessToken, refreshToken, profile, done) => {
    console.log(`request is -------> ${request}`)
    console.log(`accessToken is -------> ${accessToken}`)
    console.log(`profile is -------> ${profile}`)
    console.log(`refreshToken is -------> ${refreshToken}`)
    return done(null, profile)
}


passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true,
},authUser))


// the "user" is authenticated user object, that is passsed from
// the authUser() function in "Google Strategy"
// This "user" object is attached to "req.session.passport.user.{user}"
passport.serializeUser((user, done) => {
    console.log(`\n-------> sereialize user: `)
    console.log(user)
    // the USER object is the "authenticatd user" from done() in auth function
    // serializeUser() will attach this user to "req.session.passport.user.{user}",
    // so that it is tied to the session object for each session
    done(null, user)
})

// the "user" is the authenticated user object that was attached to "req.session.passport.user.{user}",
// in the passport.serializeuser() function
passport.deserializeUser((user, done)=>{
    console.log("\n-----> Deserialize user:")
    console.log(user)
    // this is the {user} that was saved in the req.session.passport.user.{user} in the serializationUser()
    // deserializeUser will attach this {user} to "req.user.{user}", so that it can be used anywhere in the App.
    done(null, user)
})

let count = 1
showLogs = (req, res, next)=>{
    console.log("\n==============================")
    console.log(`------------>  ${count++}`)

    console.log(`\n req.session.passport -------> `)
    console.log(req.session.passport)
  
    console.log(`\n req.user -------> `) 
    console.log(req.user) 
  
    console.log("\n Session and Cookie")
    console.log(`req.session.id -------> ${req.session.id}`) 
    console.log(`req.session.cookie -------> `) 
    console.log(req.session.cookie) 
  
    console.log("===========================================\n")

    next()
}

app.use(showLogs)

app.get("/auth/google", 
passport.authenticate('google', { scope: ['email', 'profile'] })
)

protectLogin = (req, res, next)=>{
    if(req.isAuthenticated()){res.redirect('/dashboard')}
    else {next()}
}



app.get("/login", protectLogin, (req, res)=>{
    res.render("login.ejs")
})

app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/dashboard',
    failureRedirect: '/login'
}))

// to protect loggedIn routes
// it will act as an middleware to protect the routes
checkAuthenticated = (req, res, next)=>{
    if(req.isAuthenticated()) { return next() }
    res.redirect("/login")
}

// dashboard will only be shown if the user is loggedIn
// we will get the req.user.displayName from the {authentiacted_user} object that is returned by the deserializeUser()
app.get("/dashboard", checkAuthenticated, (req, res)=>{
    res.render("dashboard.ejs", {name: req.user.displayName})
})

// if user is already logged in and attempt to access the register or login screen
// the you can direct them to the (protected) dashoard screen
checkLoggedIn = (req, res, next)=>{
    if(req.isAuthenticated()){
        return res.redirect("/dashboard")
    }
    next()
}

app.get("/login", checkLoggedIn, (req, res)=>{
    res.render("login.ejs")
})


// when req.logOut() function is called, it clears both the "req.session.passport" and "req.user"
app.post("/logout", (req, res)=>{
    req.logOut()
    res.redirect("/login")
    console.log("------> user logged out")
})

app.listen(port, () => {
    console.log(`app listening on http://localhost:${port}`)
})