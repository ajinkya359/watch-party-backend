const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Sessions = require("../models/Sessions");
const bcrypt = require("bcryptjs");

router.post("/login", async (req, res) => {
  if (await is_logged_in(req)) {
    res.json({error:"Already logged in",status:false});
    return;
  }
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email: email });
    if (!user) {
      return res.json({ error: "User does not exists",status:false });
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      return res.json({ error: "Wrong Credentials",status:false });
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(password, salt);
    const session = await Sessions.create({
      user_session_id: secPass,
      user_id: user._id,
    });

    const cookie_data = { session_id: secPass, user_id: user._id, username: user.username };
    res.cookie("watchParty", cookie_data, {
      maxAge: 900000,
      httpOnly: true,
    });

    res.status(200).json({status:true});
  } catch (err) {
    console.log(err);
    res.status(400).json({ err });
  }
});

router.post("/register", async (req, res) => {
  if (await is_logged_in(req)) {
    res.json({error:"Already logged in",status:false});
    return;
  }
  const { email, username, password } = req.body;
  try {
    let user_byemail = await User.findOne({ email: email });
    let user_byusername = await User.findOne({ username: username });
    if (user_byemail || user_byusername) {
      return res.json({ error: "Sorry, user already exists!" ,status:false});
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(password, salt);
    const user = await User.create({
      username: username,
      email: email,
      password: secPass,
    });
    const session = await Sessions.create({
      user_session_id: secPass,
      user_id: user._id,
    });
    const cookie_data = { session_id: secPass, user_id: user._id, username: user.username };
    res.cookie("watchParty", cookie_data, {
      maxAge: 900000,
      httpOnly: true,
    });
    res.status(200).json({status:true});
  } catch (err) {
    console.log(err);
    res.json({ error:err,status:false });
  }
});
router.get("/logout", async (req, res) => {
  if (await is_logged_in(req)) {
    const cookie = req.cookies.watchParty;
    const { session_id, user_id } = cookie;
    console.log("Logging out");
    res.clearCookie("watchParty");
    res.status(200).send({status:true,data:"Logged out successfully"});
    await Sessions.deleteMany({
      user_id: user_id,
    });
  } else res.send({status:false,data:"Not Logged In"});
});
router.get('/check_login_status',async (req,res)=>{
  const status=await is_logged_in(req)
  console.log(status);
  if(status)
 {
  const cookie = req.cookies.watchParty;
  const { session_id, user_id } = cookie;
  // console.log(user_id);

   const user=await User.findOne({
     _id:user_id
   })
  //  console.log(user);
   res.send({
     status:true,
     username:user.username
   })
  }
  else{
    res.send({
      status:false
    })
  }
  
})
const is_logged_in = async (req) => {
  const cookie = req.cookies.watchParty;
  if (cookie === null || cookie === undefined) return false;
  const { session_id, user_id } = cookie;
  const status = await verify(session_id, user_id);
  if (status) return true;
  else return false;
};

const verify = async (session_id, user_id) => {
  const session = await Sessions.findOne({
    user_id: user_id,
    user_session_id: session_id,
  });
  if (session === null) return false;
  return true;
};

module.exports = router;
