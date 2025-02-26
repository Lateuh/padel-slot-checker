module.exports = {
  apps : [{
    name   : "app-padel",
    script : "./server.js",
    log_file : "./logs/server.log",
    watch : true,
    ignore_watch : ["node_modules", ".clinic", "logs", ".git"],
  }]
}