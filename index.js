var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var footon = require('footon');

var noteDB = footon('notes');
noteDB.on('ready', function(){
  console.log('DB Ready');
});

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride());

function checkAuth(req, res, next){
  if(req.body.token === 'TOKEN')
    next();
  else res.status(401).end();
}

function buildNote(content){
  var data = {};
  data.content = content;
  data.contentLowerCase = content.toLowerCase();
  return data;
}

function create(req, res, content){
  var note = buildNote(content);
  var db = noteDB.get(req.body.user_name);
  db.add(note);
  db.save(function(err){
    if(err) res.send('Sorry, couldn\'t create this note');
    else res.send('Got it');
  });
}

function fetch(req, res){
  var db = noteDB.get(req.body.user_name);
  var notes = db.find({});
  notes = notes.map(function(item){
    return item.content;
  });
  if(notes == undefined || notes.length == 0)
    res.send('Couldn\'t find any note');
  else res.send(notes.join('\n'));
}

function search(req, res, title){
  var db = noteDB.get(req.body.user_name);
  var notes = db.find({});

  var lowerTitle = title.toLowerCase();
  notes = notes.filter(function(item){
    return item.content.indexOf(title) != -1 || item.contentLowerCase.indexOf(lowerTitle) != -1;
  });
  notes = notes.map(function(item){
    return item.content;
  });

  if(notes == undefined || notes.length == 0)
    res.send('Couldn\'t find that one');
  else res.send(notes.join('\n'));
}

function remove(req, res, title){
  var db = noteDB.get(req.body.user_name);
  var notes = db.find({});

  if(title != 'all'){
    var lowerTitle = title.toLowerCase();
    notes = notes.filter(function(item){
      return item.content.indexOf(title) != -1 || item.contentLowerCase.indexOf(lowerTitle) != -1;
    });
  }

  notes.forEach(function(item){
    item.remove();
    item.remove();
  });
  
  db.save();
  if(notes == undefined || notes.length == 0)
    res.send('Couldn\'t find that one');
  else res.send('Crushed that notes');
}

app.post('/', checkAuth, function (req, res) {
  var user = req.body.user_name;
  var command = req.body.text;
  var commandArray = command.split(' ');
  var action = commandArray[0];
  var content = command.substring(action.length + 1);

  if(action === 'create'){
    create(req, res, content);
  }
  else if(action === 'search'){
    search(req, res, content);
  }
  else if(action === 'delete'){
    remove(req, res, content);
  }
  else if(action === 'list')
    fetch(req, res);
  else res.send('Couldn\'t understand you');
});

var server = app.listen(80, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
