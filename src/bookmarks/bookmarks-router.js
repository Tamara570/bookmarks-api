const express = require('express')
const { v4: uuid } = require('uuid')
//const logger = require('../logger')
const { bookmarks } = require('../store')
const { restart } = require('nodemon')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const { Client } = require('pg');

const client = new Client(
    { 
        connectionString: "postgresql://postgres:Kayla2020!@localhost:5432/inventory"
        //"postgresql://your_username:your_password@cluster-do-user-1234567-0.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    }
);

client.connect();

function getData(callback) {
  client.query('SELECT * FROM customers', (err, result) => {
    if (err) {
        console.log(err);
    }
    customers = result.rows;
    console.log(customers);
    callback(customers);


});
}

bookmarksRouter.get('/data', (req, res) => {
  getData((data) => {
    res.json(data)
  });
})

bookmarksRouter.post('/createcustomer', (req, res) => {
  console.log(req)

  const text = 'INSERT INTO users(id, customer_name, phone) VALUES($1, $2, $3) RETURNING *'
  const values = req.body.data

  client.query(text, values, (err, result) => {
    if (err) {
        console.log(err);
    }

    console.log("insertion: " + result)
    res.json({"added" : "added"})
});

})


bookmarksRouter
  .route('/bookmark')
  .get((req, res) => {
    res.json(bookmarks)
  })
  .post(bodyParser, (req, res) => {
    const { title, description } = req.body;

    // Validation
    if (!title) {
        //logger.error(`Title is required`)
        return res
            .status(400)
            .send('Invalid data');
    }
    if (!description) {
        //logger.error(`Description is required`)
        return res
            .status(400)
            .send('Invalid data');
    }

    // get an id
    const id = uuid();

    const bookmark = {
        id,
        title,
        description
    };

    bookmarks.push(bookmark);

   // logger.info(`Bookmark with id ${id} created`)

    res
        .status(201)
        .location(`http://localhost:8000/list/${id}`)
        .json({id});
  })

bookmarksRouter
  .route('/bookmark/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(bm => bm.id == id);

    if (!bookmark) {
       // logger.error(`Bookmark with id ${id} not found.`);
        return res
            .status(404)
            .send('Bookmark Not Found');
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    //require the param ID
    const { id } = req.params;
  
    //get the index number of the list
    const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id);
  
    // validation
    if (bookmarkIndex === -1) {
      //logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not Found');
    }
  
    // remove the list from the array of lists, log info, send response
    bookmarks.splice(bookmarkIndex, 1);
  
   // logger.info(`Bookmark with id ${id} deleted.`);
    res
      .status(204)
      .end();
  })

  module.exports = bookmarksRouter