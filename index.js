const ecommerce_test = require("./includes/ecommerce_test");
const session_quality_test = require("./includes/session_quality_test");

module.exports = (params) => {

    params = {
      // TODO: set default params
      table: "events_*",
      date_start: "20230101",
      date_end: "20230601",
      ...params
    };

    // Publish and return datasets.
    let result = {
    // TODO: update files to call with params
      ecommerce_test: ecommerce_test(params.table,params.date_start,params.date_end),
      session_quality_test: session_quality_test(params.table)

    //   file_two: file_two(params)
    };

    return result;
}