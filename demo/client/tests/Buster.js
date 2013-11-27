var config = module.exports;

config["My tests"] = {
    environment: "browser",
    rootPath: '../../../',
    libs: [
        "module-loader-tdd.js"
    ],
    sources: [
        "demo/client/*.js"
    ],
    tests: [
        "demo/client/tests/*-test.js"
    ]
};