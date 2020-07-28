const { app } = require('./app')
const { PORT } = require('./config')



console.log("Hello world");

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})