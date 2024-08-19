const express = require('express');
const axios = require('axios'); 
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

const userRoutes = require('./routes/user');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect('mongodb://localhost:27017/solar-power-monitoring')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

app.use('/user', userRoutes);

app.get('/', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, 'your_jwt_secret');
            req.userId = decoded.userId;
            return res.redirect('/dashboard');
        } catch (err) {
            return res.clearCookie('token').redirect('/login');
        }
    }
    res.redirect('/login');
});

app.get('/dashboard', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, 'your_jwt_secret');
            res.render('index', { userNickname: decoded.nickname });
        } catch (err) {
            return res.clearCookie('token').redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

app.get('/news', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, 'your_jwt_secret');
            res.render('news', { userNickname: decoded.nickname });
        } catch (err) {
            return res.clearCookie('token').redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
});

app.get('/forecast', async (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, 'your_jwt_secret');
            const weatherData = await getWeatherData(); 
            res.render('forecast', { 
                userNickname: decoded.nickname, 
                temperature: weatherData.temperature,
                weather: weatherData.weather,
                rainProbability: weatherData.rainProbability 
            });
        } catch (err) {
            return res.clearCookie('token').redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
});

app.get('/mode', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, 'your_jwt_secret');
            res.render('mode', { userNickname: decoded.nickname });
        } catch (err) {
            return res.clearCookie('token').redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
});

app.get('/trade', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, 'your_jwt_secret');
            res.render('trade', { userNickname: decoded.nickname });
        } catch (err) {
            return res.clearCookie('token').redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
});

app.get('/run-snow-mode', (req, res) => {
    exec('python ./snow_mode.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return res.status(500).send('Error activating Snow Mode');
        }
        if (stderr) {
            console.error(`Script error: ${stderr}`);
            return res.status(500).send('Script error occurred');
        }
        console.log(`Script output: ${stdout}`);
        res.send('Snow mode activated successfully');
    });
});

app.get('/run-wind-mode', (req, res) => {
    exec('python ./wind_mode.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return res.status(500).send('Error activating Wind Mode');
        }
        if (stderr) {
            console.error(`Script error: ${stderr}`);
            return res.status(500).send('Script error occurred');
        }
        console.log(`Script output: ${stdout}`);
        res.send('Wind mode activated successfully');
    });
});

function getTemperatureFromData(data) {
    const temp = data.find(item => item.category === 'TMP');
    return temp ? `${temp.fcstValue}°C` : null;
}


function getWeatherFromData(data) {
    const sky = data.find(item => item.category === 'SKY');
    if (sky) {
        switch(sky.fcstValue) {
            case '1': return '맑음';
            case '2': return '구름조금';
            case '3': return '구름많음';
            case '4': return '흐림';
            default: return '알 수 없음';
        }
    }
    return null;
}

function getRainProbabilityFromData(data) {
    const pop = data.find(item => item.category === 'POP');
    return pop ? `${pop.fcstValue}%` : null;
}

async function getWeatherData() {
    const serviceKey = 'N62hRRqAXrRx48Ymn9vgtTziX5FN2acFO28%2BGWwMadwtta7mYtn7Ff117HbO4bXEVMCW3jmH3ieIsghcVNnz5Q%3D%3D';
    const baseDate = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // 오늘 날짜
    const baseTime = getClosestTime(); // 가까운 시간대
    const nx = '60'; // 서울의 X 좌표
    const ny = '127'; // 서울의 Y 좌표
    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${serviceKey}&numOfRows=100&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

    try {
        const response = await axios.get(url);
        console.log('Weather Data:', JSON.stringify(response.data, null, 2)); // 응답 데이터 로그 출력
        const data = response.data.response.body.items.item;

        // 여기서 data를 활용해 필요한 정보를 추출하십시오.
        return {
            temperature: getTemperatureFromData(data),
            weather: getWeatherFromData(data),
            rainProbability: getRainProbabilityFromData(data)
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw new Error('Error fetching weather data');
    }
}


function getClosestTime() {
    const now = new Date();
    const hours = now.getHours();
    const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
    let closest = baseTimes[0];
  
    for (let i = 1; i < baseTimes.length; i++) {
      if (Math.abs(hours - parseInt(baseTimes[i].substring(0, 2))) < Math.abs(hours - parseInt(closest.substring(0, 2)))) {
        closest = baseTimes[i];
      }
    }
    return closest;
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
