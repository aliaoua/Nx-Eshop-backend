const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

//Get liot of users

router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash");
  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

//Get user
router.get(`/:id`, async (req, res) => {
  let user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) {
    res.status(500).send("The category with the given ID was not found!");
  }
  res.status(200).send(user);
});

//Add user
router.post(`/`, async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: await argon2.hash(req.body.password),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();
  if (!user) {
    res.status(400).send("the user can not be created!");
  }
  res.send(user);
});
router.put("/:id", async (req, res) => {
  const userExist = await User.findById(req.params.id);
  let newPassword;
  if (req.body.password) {
    newPassword = await argon2.hash(req.body.password);
  } else {
    newPassword = userExist.passwordHash;
  }

  const updatedUser = {
    name: req.body.name,
    email: req.body.email,
    passwordHash: newPassword,
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  };

  const user = await User.findByIdAndUpdate(req.params.id, updatedUser, {
    new: true,
  });
  if (!user) {
    res.status(400).send("the user can not be updated!");
  }
  res.send(user);
});

router.post("/login", async (req, res) => {
  const secret = process.env.secret;
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).send("You are not registered");
  }
  if (user && (await argon2.verify(user.passwordHash, req.body.password))) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      secret,
      { expiresIn: "1d" }
    );
    res.status(200).send({ user: user.email, token });
  } else {
    res.status(500).send("Password is wrong!");
  }
});
//Register user
router.post(`/register`, async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: await argon2.hash(req.body.passwordHash),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();
  if (!user) {
    res.status(400).send("the user can not be created!");
  }
  res.send(user);
});
router.delete("/:id", async (req, res) => {
  try {
    let user = await User.findByIdAndDelete(req.params.id);
    if (user) {
      return res
        .status(200)
        .json({ success: true, message: "the user is deleted" });
    } else {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
  } catch (err) {
    return res.status(400).json({ success: false, error: err });
  }
});

router.get("/get/count", async (req, res) => {
  const usersCount = await User.countDocuments();
  if (!usersCount) {
    res.status(500).json({ success: false });
  }
  res.send({ count: usersCount });
});

module.exports = router;
