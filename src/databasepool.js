const mysql = require('mysql2');
const dbInfo = require('../../../../vp23config');
const dataBase = 'if23_rinde';

const pool = mysql.createPool({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.password,
	database: dataBase,
	connectionLimit: 5
});

exports.pool = pool;