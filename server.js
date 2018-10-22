const cluster = require('@clusic/cluster');
const parseArgv = require('./utils/parse-argv');
const filterArgv = require('./utils/filter-service-argv');
const args = parseArgv(process.argv.slice(2));
const app = new cluster(filterArgv(args));
app.createServer().catch(e => app.kill());