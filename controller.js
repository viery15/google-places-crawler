'use strict';

var response = require('./res');
var puppeteer = require('puppeteer');
const fs = require('fs');
var MongoClient = require('mongodb').MongoClient;  
var urlMongo = "mongodb://viery15:mendol817@cluster0-shard-00-00-aybsr.mongodb.net:27017,cluster0-shard-00-01-aybsr.mongodb.net:27017,cluster0-shard-00-02-aybsr.mongodb.net:27017/travel_planner?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority"; 

exports.index = function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed

    // var url = "https://www.google.com/maps/place/Wisata+Alam+Sumber+Jenon/@-7.8309555,112.420832,10z/data=!4m8!1m2!2m1!1sWisata+alam+malang!3m4!1s0x2dd62831f7a2d477:0xec7cd4e78c57fa6f!8m2!3d-8.0496699!4d112.7164657";
    var url = req.body.url;
    var urls = url.toString().split("/");
    urls[6] = urls[6].replace('@','');
    var location = urls[6].toString().split(",");
    (async () => {
        const browser = await puppeteer.launch({
            // headless: false,
            args: ['--no-sandbox', '--disabled-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.goto(url, {
            waitUntil:'networkidle2',
            timeout: 0
        });

        await page.waitForSelector('.widget-pane-link', {
            visible: true,
        });
        
        const result = await page.evaluate(() => {
            var informasi = document.querySelectorAll("span.widget-pane-link");
            var tempat = document.getElementsByClassName("GLOBAL__gm2-headline-5 section-hero-header-title-title");
            var hari = document.querySelectorAll("th > div:nth-child(1)");
            var jam = document.querySelectorAll("td.widget-pane-info-open-hours-row-data > ul > li");
            var jam_buka = {};
            for (let i = 0; i < 7; i++) {
                jam_buka[hari[i].innerText] = jam[i].innerText;
            }

            let data = {
                "tempat" : tempat[0].innerText,
                "alamat" : informasi[2].innerText,
                "jam_buka" : jam_buka,
            }
            return data;
        });

        console.log("informasi umum berhasil ditambahkan");

        await page.click('#pane > div > div.widget-pane-content.scrollable-y > div > div > div.section-layout.section-layout-justify-space-between.section-layout-vertically-center-content.section-layout-flex-vertical.section-layout-flex-horizontal > div.iRxY3GoUYUY__actionicon > div > button');
        await page.waitFor(5000)

        const scrollable_section = '.section-scrollbox';
        await page.waitForSelector( '.section-scrollbox' );

        var count2 = 0;
        var count = 0;
        var counts = 0;

        while(count == count2) {
            counts = await page.evaluate(({count, count2}) =>
                {
                    const scrollableSection = document.querySelector('.section-scrollbox');
                    
                    scrollableSection.scrollTop += 5000;
                    var count = scrollableSection.scrollTop += 5000;

                    if(count > count2){
                        count2 = count;
                    }
                    else {
                        count2 = 0;
                    }

                    return {
                        count,
                        count2
                    }

                },{count, count2});

            await page.waitFor(10000);
            
            count = counts.count;
            count2 = counts.count2;

        };


       await page.evaluate(() => {
            let detail_reviews = document.querySelectorAll(".section-expand-review")
            

            var index = 0;
            while(index < detail_reviews.length){
                detail_reviews[index].click()
                console.log("index "+index+"clicked")
                index++;
            }
            return {
                detail_reviews
            }
                
        });
    //     console.log(coba);
        

        const result2 = await page.evaluate(() => {
            
            var postReview = document.getElementsByClassName("section-review-text");
            var reviews = [];
            for (var i = 0; i < postReview.length; i++) {
                reviews.push(postReview[i].innerText);
            }

            return {
                reviews
            }
        });

        console.log("Review berhasil didapatkan");

        var responseData = {
            'informasi' : result,
            'kategori' : 'Alam',
            'location' : {
                'latitude' : location[0],
                'longitude' : location[1]
            },
            'reviews' : result2.reviews
        }

        responseData.reviews = responseData.reviews.filter(function (el) {
            return el != "";
        });
        response.ok(responseData, res);

        
        await browser.close();
        fs.writeFileSync(
            './Data Output/'+responseData.informasi.tempat+'.json',
            JSON.stringify(responseData, null, 2)
        )

        MongoClient.connect(urlMongo, function(err, db) {
            if (err) throw err;
            db.collection("tempat_wisata").insertOne(responseData, function(err, res) {  
                if (err) throw err;  
                console.log("1 record inserted");  
                db.close();  
            });  
        });
    })();
};