import tracer from "dd-trace";
const { name: service, version } = require("../package.json"); // why wont import work here?

tracer.init({
  env: process.env.NODE_ENV,
  service,
  version,
});

export default tracer;
