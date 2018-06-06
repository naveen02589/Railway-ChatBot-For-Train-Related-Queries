
//Railwaybot webhook
'use strict';

const PORT = process.env.PORT || 3000;
var restify = require('restify');
var request = require('request');
var os = require('os');
 
const server = restify.createServer({
  name: 'railwaybot',
  version: '1.0.0'
});
 
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.jsonp());
 const getstatus = (number, date, cb) => {
   return request({
      
        url: "https://api.railwayapi.com/v2/live/train/"+number+"/date/"+date+"/apikey/22lq23w7zc/",
       
        method: 'GET',
        json: true

   }, (error, response, body) => {
       if(!error && response.statusCode === 200){
         console.log(body);
         if(body.response_code === 200){
         cb(null, "Live Status ("+body.train.number+")"+" "+os.EOL+"Currently"+" "+body.train.name+" "+body.position+os.EOL+"Current_station"+" "+body.current_station.name) ;
       }
       else if(body.response_code === 404)
      cb(null,"NO data available .Please check once again and retry");
      else if(body.response_code === 210)
      cb(null,"Train doesn’t run on the date queried.Please check once again and retry");
      }
       else {
         cb(error,null);
       }
   }
  );
 }
 const getseatavailability = (number, date, sourcestationcode, destinationstationcode, cb) => {
  return request({
      url:  "https://api.railwayapi.com/v2/check-seat/train/"+number+"/source/"+sourcestationcode+"/dest/"+destinationstationcode+"/date/"+date+"/pref/CC/quota/GN/apikey/22lq23w7zc/",
       method: 'GET',
       json: true

  }, (error, response, body) => {
       
      if(!error && response.statusCode === 200){
       console.log(body);
       if(body.response_code === 200){
       var sendmsg =body.train.name+"("+ body.train.number+")"+os.EOL+"\r\n";
       for (var i=0;i<body.availability.length;i++) {
         
        sendmsg +="date"+" "+":"+" "+body.availability[i].date+" "+":"+" "+"status"+" "+"-"+" "+body.availability[i].status+os.EOL+"\r\n";
       }
       for (var j=0;j<body.train.classes.length;j++) {
       sendmsg +=body.train.classes[j].name+" "+":"+" "+body.train.classes[j].available+os.EOL;
      }
        cb(null,sendmsg);
        
      }
      else if(body.response_code === 404)
      cb(null,"NO data available .Please check once again and retry");
      else if(body.response_code === 210)
      cb(null,"Train doesn’t run on the date queried.Please check once again and retry");
    }
      else {
        cb(error,null);
      }
  }
 );
}
const gettrainroute = (number, cb) => {
  return request({
       url: "https://api.railwayapi.com/v2/route/train/"+number+"/apikey/22lq23w7zc/",
       method: 'GET',
       json: true

  }, (error, response, body) => {
      if(!error && response.statusCode === 200){
       console.log(body.route[0].station.name);
       var sendmsg= "train route"+os.EOL;
       for (var i=0;i<body.route.length;i++) {
         
        sendmsg +=os.EOL+"station :"+" "+body.route[i].station.name+" "+"at "+" "+body.route[i].schdep+os.EOL;
       }
        cb(null, sendmsg);
      }
      else {
        cb(error,null);
      }
  }
 );
}

//POST HANDLER
server.post('/',(req, res, next) => {

  let{
      status,
      result
  } = req.body;
  console.log(result.action);
  if(status.code === 200 && result.action  === 'get-railway-intents'){
    let date = req.body.result.parameters['date']; 
    let number = req.body.result.parameters['number']; 
    
    var moment = require('moment');
    var date1 = moment(date, 'YYYY-MM-DD');
    var train_date = date1.format('DD-MM-YYYY');
    console.log(train_date)
    
    getstatus(number,train_date, (error,result) => {
      if(!error && result){
        res.json({
          speech: result,
          displayText: result,
          source: "railway-webhook"

        });
      }
    });
    }
    if(status.code === 200 && result.action  === 'get-seat-availability'){
      let date = req.body.result.parameters['date'];
      let sourcestationcode =  req.body.result.parameters['source-station-code']; 
      let destinationstationcode =  req.body.result.parameters['destination-station-code']; 
      let number = req.body.result.parameters['number']; 
      var moment = require('moment');
       var date1 = moment(date, 'YYYY-MM-DD');
       var train_date = date1.format('DD-MM-YYYY');
       
      
    
      
      getseatavailability(number,train_date, sourcestationcode, destinationstationcode ,(error,result) => {
        if(!error && result){
          res.json({
            speech: result,
            displayText: result,
            source: "railway-webhook"
  
          });
        }
      });
      }

      if(status.code === 200 && result.action  === 'get-train-route'){
      
        let number = req.body.result.parameters['number']; 
        
      
        
        gettrainroute(number, (error,result) => {
          if(!error && result){
            res.json({
              speech: result,
              displayText: result,
              source: "railway-webhook"
    
            });
          }
        });
        }
  console.log(result);
  return next();

});


server.listen(PORT,() => console.log(PORT));
     


