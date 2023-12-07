const express = require('express');
const fs = require("fs");
const app = express();
//kui kõik db asjad pool'is, siis pole seda enam vaja
const mysql = require('mysql2');
const timeInfo = require('./src/datetime_fnc');
const bodyparser = require('body-parser');
//kui kõik db asjad pool'is, siis pole seda enam vaja
const dbInfo = require('../../../vp23config');
//Kuna Rinde kasutab ajutiselt Inga andmebaasi, siis:
const dBase = 'if23_inga_pe_DM';
//kui kõik db asjad pool'is, siis pole seda enam vaja
//const dataBase = 'if23_rinde';
const pool = require('./src/databasepool').pool;
//fotode laadimiseks
const multer = require('multer');
//seadistame vahevara (middleware), mis määrab üleslaadimise kataloogi
const upload = multer({dest: './public/gallery/orig/'});
const sharp = require('sharp');
const async = require('async');
//paroolide krüpteerimiseks
const bcrypt = require('bcrypt');
//sessiooni jaoks
const session = require('express-session');

app.use(session({secret: 'minuAbsoluutseltSalajaneVõti', saveUninitialized: true, resave: true}));
let mySession;

app.set('view engine', 'ejs');
app.use(express.static('public'));
//järgnev, kui ainult tekst, siis "false", kui ka muud kraami, näiteks pilti, siis "true"
app.use(bodyparser.urlencoded({extended: true}));

//loon andmebaasiühenduse
//kui kõik db asjad pool'is, siis pole seda enam vaja
/* const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.password,
	database: dataBase
}); */

const conn2 = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.password,
	database: dBase
});

app.get('/', (req, res)=>{
	let notice = 'Sisesta oma kasutajakonto andmed!';
	//res.send('See töötab!');
	//res.download('index.js');
	res.render('index', {notice: notice});
});

app.post('/', (req, res)=>{
	let notice = 'Sisesta oma kasutajakonto andmed!';
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log('Paha');
		res.render('index', {notice: notice});
	}
	else {
		console.log('Hea');
		let sql = 'SELECT password FROM vpusers WHERE email = ?';
		//andmebaasi ühendus pool'i kaudu
		pool.getConnection((err, conn)=>{
			if(err){
				throw err;
			}
			else {
				//andmebaasi osa
				conn.execute(sql, [req.body.emailInput], (err, result)=>{
					if(err) {
						notice = 'Tehnilise vea tõttu ei saa sisse logida!';
						console.log(notice);
						res.render('index', {notice: notice});
					}
					else {
						//console.log(result);
						if(result[0] != null){
							console.log(result[0].password);
							bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
								if(err){
										throw err;
								}
								else {
									if(compareresult){
										mySession = req.session;
										mySession.userName = req.body.emailInput;
										
										notice = mySession.userName + ' on sisse loginud!';
										console.log(notice);
										
										res.render('index', {notice: notice});
									}
									else {
										notice = 'Kasutajatunnus või parool oli vigane!';
										console.log(notice);
										res.render('index', {notice: notice});
									}
								}
							});
						
						}
						else {
							notice = 'Kasutajatunnus või parool oli vigane!';
							console.log(notice);
							res.render('index', {notice: notice});
						}
						
					}
				});
				//andmebaasi osa lõppeb
			}
		});
		//res.render('index', {notice: notice});
	}
});

app.get('/logout', (req, res)=>{
	req.session.destroy();
	mySession = null;
	console.log('Logi vlja!');
	res.redirect('/');	
});


app.get('/signup', (req, res)=>{
	res.render('signup');
});

app.post('/signup', (req, res)=>{
	let notice = 'Ootan andmeid!';
	console.log(req.body);
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.genderInput || !req.body.birthInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput){
		console.log('Andmeid on puudu või pole nad korrektsed!');
		notice = 'Andmeid on puudu või pole nad korrektsed!';
		res.render('signup', {notice: notice});
	}
	else {
		console.log('Ok!');
		bcrypt.genSalt(10, (err, salt)=> {
			bcrypt.hash(req.body.passwordInput, salt, (err, pwdhash)=>{
				let sql = 'INSERT INTO vpusers (firstname, lastname, birthdate, gender, email, password) VALUES(?,?,?,?,?,?)';
				//andmebaasi ühendus pool'i kaudu
				pool.getConnection((err, conn)=>{
					if(err){
						throw err;
					}
					else {
						//andmebaasi osa
						conn.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthInput, req.body.genderInput, req.body.emailInput, pwdhash], (err, result)=>{
							if(err){
								console.log(err);
								notice = 'Tehnilistel põhjustel kasutajat ei loodud!';
								res.render('signup', {notice: notice});
							}
							else {
								console.log('kasutaja loodud');
								notice = 'Kasutaja ' + req.body.emailInput + ' edukalt loodud!';
								res.render('signup', {notice: notice});
							}
						});
						//andmebaasi osa lõppeb
					}
				});
			});
		});
	}
	
	//res.render('signup');
});

app.get('/timenow', (req, res)=>{
	const dateNow = timeInfo.dateETformatted();
	const timeNow = timeInfo.timeETformatted();
	//res.render('timenow');
	res.render('timenow', {nowD: dateNow, nowT: timeNow});
});

app.get('/wisdom', (req, res)=>{
	let folkWisdom = [];
	fs.readFile('public/txtfiles/vanasonad.txt', 'utf8', (err, data)=>{
		if(err){
			throw err;
		}
		else {
			folkWisdom = data.split(';');
			res.render('justlist', {h1: 'Vanasõnad', wisdom: folkWisdom});
		}
	});
});

app.get('/eestifilm', (req, res)=>{
	res.render('filmindex');
});

app.get('/eestifilm/filmiloend', (req, res)=>{
	let sql = 'SELECT title, production_year FROM movie';
	let sqlResult = [];
	conn2.execute(sql, (err, result)=>{
		if (err){
			res.render('filmlist', {filmlist: sqlResult});
			//conn.end();
			throw err;
		}
		else {
			//console.log(result);
			res.render('filmlist', {filmlist: result});
			//conn.end();
		}
	});
});

app.get('/eestifilm/addfilmperson', (req, res)=>{
	res.render('addfilmperson');
});

app.get('/eestifilm/addfilmrelation', (req, res)=>{
	//kasutades async moodulit paneme mitu tegevust paralleelselt tööle
	//kõigepealt loome tegevuste loendi
	const myQueries = [
		function(callback){
			conn2.execute('SELECT id,first_name,last_name FROM person', (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			conn2.execute('SELECT id,title FROM movie', (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		}//veel ,  ja järgmine function jne
	];
	//paneme kõik need tegevused paralleelselt tööle, tulemuseks list (array) ühistest tulemustest
	async.parallel(myQueries, (err, results)=>{
		if(err){
			throw err;
		}
		else {
			//siin kõik asjad, mis on vaja teha
			console.log(results);
		}
	});
	
	
	res.render('addfilmrelation');
});

app.post('/eestifilm/addfilmperson', (req, res)=>{
	//res.render('addfilmperson');
	//res.send(req.body);
	let notice = '';
	let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES(?,?,?)';
	conn2.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result)=>{
		if (err) {
			notice = 'Andmete salvestamine ebaõnnestus!';
			res.render('addfilmperson', {notice: notice});
			throw err;
		}
		else {
			notice = req.body.firstNameInput + ' ' + req.body.lastNameInput + ' salvestamine õnnestus!';
			res.render('addfilmperson', {notice: notice});
		}
	});
});

app.get('/news', (req, res)=> {
	res.render('news');
});

app.get('/news/add', (req, res)=> {
	res.render('addnews');
});

app.post('/news/add', (req, res)=>{
	if(!req.body.titleInput || !req.body.contentInput || !req.body.expireInput){
		console.log('Uudisega jama');
		notice = 'Andmeid puudu!';
		res.render('addnews', {notice: notice});
	}
	else {
		let sql = 'INSERT INTO vpnews (title, content, expire, userid) VALUES(?,?,?,?)';
		let userid = 1;
		//andmebaasi ühendus pool'i kaudu
		pool.getConnection((err, conn)=>{
			if(err){
				throw err;
			}
			else {
				//andmebaasi osa
				conn.execute(sql, [req.body.titleInput, req.body.contentInput, req.body.expireInput, userid], (err, result)=>{
					if(err) {
						throw err;
						notice = 'Uudise salvestamine ebaõnnestus!';
						res.render('addnews', {notice: notice});
						conn.release();
					} else {
						notice = 'Uudis edukalt salvestatud!';
						res.render('addnews', {notice: notice});
						conn.release();
					}
				});
				//andmebaasi osa lõppeb
			}
		});
	}
});

app.get('/news/read', (req, res)=> {
	res.render('readnews');
});

app.get('/news/read/:id', (req, res)=> {
	//res.render('readnews');
	res.send('Tahame uudist, mille id on: ' + req.params.id);
});

app.get('/news/read/:id/:lang', (req, res)=> {
	//res.render('readnews');
	console.log(req.params);
	console.log(req.query);
	res.send('Tahame uudist, mille id on: ' + req.params.id);
});

app.get('/photoupload', checkLogin, (req, res)=> {
	res.render('photoupload');
});

app.post('/photoupload', upload.single('photoInput'), (req, res)=>{
	let notice = '';
	console.log(req.file);
	console.log(req.body);
	const fileName = 'vp_' + Date.now() + '.jpg';
	//fs.rename(req.file.path, './public/gallery/orig/' + req.file.originalname, (err)=>{
	fs.rename(req.file.path, './public/gallery/orig/' + fileName, (err)=>{
		console.log('Faili laadimise viga: ' + err);
	});
	//loome kaks väiksema mõõduga pildi varianti
	sharp('./public/gallery/orig/' + fileName).resize(100,100).jpeg({quality : 90}).toFile('./public/gallery/thumbs/' + fileName);
	sharp('./public/gallery/orig/' + fileName).resize(800,600).jpeg({quality : 90}).toFile('./public/gallery/normal/' + fileName);
	
	//foto andmed andmetabelisse
	let sql = 'INSERT INTO vpgallery (filename, originalname, alttext, privacy, userid) VALUES(?,?,?,?,?)';
	const userid = 1;
	
	//andmebaasi ühendus pool'i kaudu
	pool.getConnection((err, conn)=>{
		if(err){
			throw err;
		}
		else {
			//andmebaasi osa
			conn.execute(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userid], (err, result)=>{
				if(err) {
					throw err;
					notice = 'Foto andmete salvestamine ebaõnnestus!';
					res.render('photoupload', {notice: notice});
					conn.release();
				} else {
					notice = 'Foto ' + req.file.originalname + ' laeti edukalt üles!';
					res.render('photoupload', {notice: notice});
					conn.release();
				}
			});
			//andmebaasi osa lõppeb
		}
	});
	
});

app.get('/photogallery', (req, res)=> {
	let photoList = [];
	let sql = 'SELECT id,filename,alttext FROM vpgallery WHERE privacy > 1 AND deleted IS NULL ORDER BY id DESC';
	
	//andmebaasi ühendus pool'i kaudu
	pool.getConnection((err, conn)=>{
		if(err){
			throw err;
		}
		else {
			//andmebaasi osa
			conn.execute(sql, (err,result)=>{
				if (err){
					throw err;
					res.render('photogallery', {photoList : photoList});
					conn.release();
				}
				else {
					photoList = result;
					console.log(result);
					res.render('photogallery', {photoList : photoList});
					conn.release();
				}
			});
			//andmebaasi osa lõppeb
		}//pool.getConnection callback else lõppeb
	});//pool.getConnection lõppeb
	
	
});

function checkLogin(req, res, next){
	console.log('kontrollime sisselogimist');
	if(mySession != null){
		if(mySession.userName){
			console.log('Täitsa sees on!');
			next();
		}
		else {
			console.log('E ole üldse sees!');
			res.redirect('/');
		}
	}
	else {
		res.redirect('/');
	}
}

app.listen(5100);