var fs = require('fs');
var connect = require('connect');
var urlrouter = require('urlrouter');
var request = require("request");
var mustache = require('mustache');
var url = require('url');

var VERSION = '0.0.1';

function renderIndex(htmlFile, data, cb) {
    if(!data) data = {};
    fs.readFile(htmlFile, function(err, htmlFileContent) {
        var partials = { 
            CONTENT: ''+htmlFileContent, 
            VERSION: VERSION
        };
        fs.readFile('skins/index.html', function(err, indexContent) {
            var html = mustache.to_html(''+indexContent, data, partials);
            cb(html);
        });
    });
}

connect()

.use(connect.static('public'))


.use(urlrouter(function (app) {
    app.get('/', function (req, res, next) {
        renderIndex('skins/home.html', {}, function(html) {
            res.end(html);
        });
    });
    app.get('/ontology', function (req, res, next) {
        renderIndex('skins/ontology.html', {}, function(html) {
            res.end(html);
        });
    });
    // SPARQL
    app.get('/ontology/query', function (req, res, next) {
        var urlParts = url.parse(req.url, true);

        request('http://data.bioversityinternational.org:3000/ontology/query' + urlParts.search, function(error, response, body) {

            res.end(body);
        });
    });
    app.get('/collectingmissions', function (req, res, next) {
        renderIndex('skins/cm.html', {}, function(html) {
            res.end(html);
        });
    });
    // SPARQL
    app.get('/collectingmissions/query', function (req, res, next) {
        var urlParts = url.parse(req.url, true);

        request('http://data.bioversityinternational.org:3000/collectingmissions/query' + urlParts.search, function(error, response, body) {

            res.end(body);
        });
    });
    // Linked Data
    app.get('/collectingmissions*', function (req, res, next) {
        var hostname = req.headers.host; // hostname = 'localhost:8080'
        var pathname = url.parse(req.url).pathname; // pathname = '/MyApp'
        var uri = 'http://' + hostname + pathname;

        // send it to SPARQL DESCRIBE <>
        var sparql = 'DESCRIBE <'+uri+'>';
        request('http://data.bioversityinternational.org:3000/collectingmissions/query?query=' + sparql, function(error, response, body) {
            res.end(body);

        });

    });

  app.get('/cco.ttl', function (req, res, next) {
    request("https://raw.github.com/bioversity/cco/gh-pages/cco.ttl", function(error, response, body) {
        res.writeHead(200, {
                 'Content-Type': 'text/turtle',
                 'Access-Control-Allow-Origin' : '*'}); 

        res.end(body);
    });
  });
  app.get('/cco', function (req, res, next) {
    var acceptHeader = req.headers.accept;
    if(acceptHeader.match(/text\/turtle|text\/plain/g)) {
        // return raw data
        request("https://raw.github.com/bioversity/cco/gh-pages/cco.ttl", function(error, response, body) {
            res.writeHead(200, {
                     'Content-Type': 'text/turtle',
                     'Access-Control-Allow-Origin' : '*'}); 

            res.end(body);
        });

    } else {
        // return nice html
        request("https://raw.github.com/bioversity/cco/gh-pages/static.html", function(error, response, body) {
            res.writeHead(200, {
                     'Content-Type': 'text/html',
                     'Access-Control-Allow-Origin' : '*'}); 

            res.end(body);
        });
    }

  });
}))
.listen(80);
