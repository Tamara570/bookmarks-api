const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { store } = require('../store')
//const { restart } = require('nodemon')
const BookmarksService = require('./bookmarks-service')

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

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  rating: Number(bookmark.rating),
})

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

bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res) => {
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`'${field}' is required`)
      }
    }

    const { title, url, description, rating } = req.body

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`)
      return res.status(400).send(`'rating' must be a number between 0 and 5`)
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res.status(400).send(`'url' must be a valid URL`)
    }

    const addBookmark = { id: uuid(), title, url, description, rating }

    BookmarksService.insertBookmark(
      req.app.get('db'),
      addBookmark
    )
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created.`)
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `${bookmark.id}`))
          .json(serializeBookmark(bookmark))
      })
      .catch(next)
  })
  

bookmarksRouter
  .route('/bookmarks/:bookmark_id')
  .get((req, res, next) => {
    const { bookmark_id } = req.params
    BookmarksService.getById(req.app.get('db'), bookmark_id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${bookmark_id} not found.`)
          return res.status(404).json({
            error: { message: `Bookmark Not Found` }
          })
        }
        res.json(serializeBookmark(bookmark))
      })
      .catch(next)
  })

  .delete((req, res, next) => {
    const { bookmark_id } = req.params
    
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      bookmark_id
    )
      .then(numRowsAffected => {
        logger.info(`Bookmark with id ${bookmark_id} deleted.`)
        res.status(204).end()
      })
      .catch(next)
  })

  .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const updateBm = { title, url, description, rating }

    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.bookmark_id,
      updateBm
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })


  module.exports = bookmarksRouter