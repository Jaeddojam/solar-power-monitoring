const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/signup', async (req, res) => {
  const { username, nickname, password } = req.body;
  const existingUser = await User.findOne({ username });

  if (existingUser) {
      return res.render('signup', { errorMessage: '사용자 이름이 이미 존재합니다. 다른 이름을 사용해 주세요.' });
  }

  const user = new User({ username, nickname, password }); 
  await user.save();
  res.redirect('/login');
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await user.comparePassword(password)) {
      const token = jwt.sign({ userId: user._id, nickname: user.nickname }, 'your_jwt_secret');
      res.cookie('token', token, { httpOnly: true });
      res.redirect('/dashboard');
  } else {
      res.render('login', { errorMessage: '로그인이 실패하였습니다. 다시 시도해 주세요.' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
