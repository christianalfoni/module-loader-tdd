var config = module.exports;

config["My tests"] = {
    environment: "browser",
    rootPath: '../../../',
    libs: [
        "demo/client/vendors/jquery-1.10.2.js",
        "demo/client/vendors/handlebars-v1.1.2.js",
        "lib/module-loader-tdd.js"
    ],
    sources: [
        "demo/client/*.js",
        "demo/client/**/*.hbs"
    ],
    tests: [
        "demo/client/tests/*-test.js"
    ]
};