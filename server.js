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

var collMissionSparql = 'http://data.bioversityinternational.org:3000/collectingmissions/query';

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

        req.pipe(request('http://data.bioversityinternational.org:3000/ontology/query' + urlParts.search)).pipe(res);
    });
    app.get('/collectingmissions', function (req, res, next) {
        var sparql = 'SELECT  DISTINCT ?type WHERE {\
            ?s a ?type .\
            }\
            LIMIT 100';

        request(collMissionSparql + '?query=' + sparql +'&output=json', function(err, response, body) {
            var j = JSON.parse(body);

            res.writeHead(200, {
                'Content-Type': 'text/html',
            }); 
            renderIndex('skins/cm.html', j.results, function(html) {
                res.end(html);
            });
        
        });
    });
    // SPARQL
    app.get('/collectingmissions/query', function (req, res, next) {
        var urlParts = url.parse(req.url, true);

        req.pipe(request(collMissionSparql + urlParts.search)).pipe(res);
    });
    // Linked Data
    app.get('/collectingmissions*', function (req, res, next) {
        var hostname = req.headers.host; // hostname = 'localhost:8080'
        // XXX pathname probably needs to be uri encoded with encodeURIComponent
        var pathname = url.parse(req.url).pathname; // pathname = '/MyApp'
        var uri = 'http://' + hostname + pathname;

        // send it to SPARQL DESCRIBE <>
        var acceptHeader = req.headers.accept;
        if(acceptHeader.match(/text\/html/g)) {
            // need the actual XLS version so not using construct
            var stylesheet = '&output=xml&stylesheet=%2Fxml-to-html-links.xsl';
            var query = 'SELECT * WHERE { { <'+uri+'> ?p1 ?o1 } UNION { ?s2 ?p2 <'+uri+'> } }';
            query = query + stylesheet;

        } else {
            //var query = 'DESCRIBE <'+uri+'>';
            var query = 'construct { <'+uri+'> ?p1 ?o1 . ?s2 ?p2 <'+uri+'> } { { <'+uri+'> ?p1 ?o1 } UNION { ?s2 ?p2 <'+uri+'> } }';
        }
        req.pipe(request(collMissionSparql + '?query=' + query)).pipe(res);

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
