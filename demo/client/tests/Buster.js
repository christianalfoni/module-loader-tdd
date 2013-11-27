var config = module.exports;

config["My tests"] = {
    environment: "browser",
    rootPath: '../../../',
    libs: [
        "module-loader.js"
    ],
    sources: [
        "demo/client/*.js"
    ],
    tests: [
        "demo/client/tests/*-test.js"
    ]
};