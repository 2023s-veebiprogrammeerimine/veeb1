const express = require('express');
const fs = require("fs");
const app = express();
const mysql = require('mysql2');
const timeInfo = require('./datetime_fnc');
const bodyparser = require('body-parser');
const dbInfo = require('../../../vp23config');
//Kuna Rinde kasutab ajutiselt Inga andmebaasi, siis:
//const dataBase = 'if23_inga_pe_DM';
const dataBase = 'if23_rinde';
//fotode laadimiseks
const multer = require('multer');
//seadistame vahevara (middleware), mis määrab üleslaadimise kataloogi
const upload = multer({dest: './public/gallery/orig/'});
const sharp = require('sharp');

app.set('view engine', 'ejs');
app.use(express.static('public'));
//järgnev, kui ainult tekst, siis "false", kui ka muud kraami, näiteks pilti, siis "true"
app.use(bodyparser.urlencoded({extended: true}));

//loon andmebaasiühenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.password,
	database: dataBase
});

app.get('/', (req, res)=>{
	//res.send('See töötab!');
	//res.download('index.js');
	res.render('index');
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
/*
app.get('/eestifilm', (req, res)=>{
	res.render('filmindex');
});

app.get('/eestifilm/filmiloend', (req, res)=>{
	let sql = 'SELECT title, production_year FROM movie';
	let sqlResult = [];
	conn.query(sql, (err, result)=>{
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
*/
app.get('/news', (req, res)=> {
	res.render('news');
});

app.get('/news/add', (req, res)=> {
	res.render('addnews');
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

app.post('/eestifilm/addfilmperson', (req, res)=>{
	//res.render('addfilmperson');
	//res.send(req.body);
	let notice = '';
	let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES(?,?,?)';
	conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result)=>{
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


app.get('/photoupload', (req, res)=> {
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
	conn.query(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userid], (err, result)=>{
		if(err) {
			throw err;
			notice = 'Foto andmete salvestamine ebaõnnestus!';
			res.render('photoupload', {notice: notice});
		} else {
			notice = 'Foto ' + req.file.originalname + ' laeti edukalt üles!';
			res.render('photoupload', {notice: notice});
		}
	});
});

app.get('/photogallery', (req, res)=> {
	
	//andmebaasist tuleb lugeda piltide id, filename, alttext
	
	res.render('photogallery');
});

app.listen(5100);