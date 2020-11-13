var MongoClient = require('mongodb').MongoClient;  
var url = "mongodb://localhost:27017/";  
var dbm;
MongoClient.connect(url, {useNewUrlParser: true },function(err, db) {  
    console.log("Connecting to Db ...");
    if (err) 
        throw err; 
    else
        exports.dbm = db;     
    //console.log (exports.dbm);
    });  
exports.queryConfig = function(classname) {
        var dbm = exports.dbm;
        //console.log(dbm);
        let m1 = (new Date()).getTime();
        //console.log("insert MONGODB started ..")
        return new Promise(function(resolve, reject) {
            // Get First Record >>>> Config
            dbm.db('Sensor').collection(classname).findOne({}, function(err, res) {  
                if (err)     
                 reject(err);
                else  {
                  //  let m2 = (new Date()).getTime() - m1;
                  //  console.log(`Got MONGODB record in ${m2} milliseconds`);
                  //  console.log(res);
                    resolve(res);  
                }
            });
        });
    };
//
exports.updateConfig = function(sensor, values) {
    var dbm = exports.dbm;
    //console.log(dbm);
    let m1 = (new Date()).getTime();
    //console.log("insert MONGODB started ..")
    return new Promise(function(resolve, reject) {
        // Get First Record >>>> Config
        var newvalues = { $set: values };
        var myquery = { sensor: sensor};
        dbm.db('Sensor').collection('Params').updateOne(myquery, newvalues, function(err, res) { 
            if (err)     
             reject(err);
            else  {
                //let m2 = (new Date()).getTime() - m1;
                //console.log(`Updated MONGODB record in ${m2} milliseconds`);
                //console.log(res);
                resolve(res);  
            }
        });
    });
};
    
exports.getContacts = function(classname, sensor) {
    var dbm = exports.dbm;
    //console.log(dbm);
    let m1 = (new Date()).getTime();
    //console.log("insert MONGODB started ..")
    return new Promise(function(resolve, reject) {
        // Do async job
        var query = { sensor: sensor};
        dbm.db('Sensor').collection(classname).find(query).toArray(function(err, result) { 
            if (err)     
             reject(err);
            else  {
                resolve(result);  
            }
        });
    });
};

exports.insert = function(classname, obj) {
    var dbm = exports.dbm;
    //console.log(dbm);
    let m1 = (new Date()).getTime();
    //console.log("insert MONGODB started ..")
    return new Promise(function(resolve, reject) {
        // Do async job
        dbm.db('Sensor').collection(classname).insert(obj, function(err, res) {  
            if (err)     
             reject(err);
            else  {
                obj._id = res.insertedIds[0];
                let m2 = (new Date()).getTime() - m1;
                console.log(`insert MONGODB done in ${m2} milliseconds`);
                resolve(obj._id);  
            };
        });
    });
};