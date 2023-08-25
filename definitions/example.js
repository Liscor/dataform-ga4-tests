const run_tests = require("../index");

run_tests(
    {
        table:"events_*",
        date_start: "20210101",
        date_end: "20210131"
    })
