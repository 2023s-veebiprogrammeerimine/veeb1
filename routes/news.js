const express = require('express');
//loome oma rakenduse sees toimiva miniäpi
const router = express.Router(); // Suur algustäht "R" on oluline!!!
const pool = require('../src/databasepool').pool;

//kuna siin on miniäpp router, siis kõik marsruudid on temga, mitte app'iga seotud
//kuna kõik siinsed marsruudid algavad "/news", siis selle jätame ära!

router.get('/', (req, res)=> {
	res.render('news');
});

router.get('/add', (req, res)=> {
	res.render('addnews');
});

router.post('/add', (req, res)=>{
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

router.get('/read', (req, res)=> {
	res.render('readnews');
});

router.get('/read/:id', (req, res)=> {
	//res.render('readnews');
	res.send('Tahame uudist, mille id on: ' + req.params.id);
});

router.get('/read/:id/:lang', (req, res)=> {
	//res.render('readnews');
	console.log(req.params);
	console.log(req.query);
	res.send('Tahame uudist, mille id on: ' + req.params.id);
});

module.exports = router;