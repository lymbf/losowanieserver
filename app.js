const express = require('express');
const app = express();
const dotenv = require('dotenv');
const {connect} = require('mongoose');
const cors = require('cors');
dotenv.config();

connect(process.env.DB_STRING).catch(err => {
    console.log(err)
});

app.use(cors());
app.use(express.json());

const authorize = require('./Middlewares/authorization')


const userRouter = require('./Routes/user');
const authRouter = require('./Routes/auth');
const roomRouter = require('./Routes/room')

app.use('/auth', authRouter);
app.use('/*', authorize);
app.use('/user', userRouter);
app.use('/room', roomRouter);


app.listen(process.env.PORT || 5000, () => {
    console.log('server upnrunnin');
});