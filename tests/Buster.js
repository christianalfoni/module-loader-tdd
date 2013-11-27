var config = module.exports;

config["My tests"] = {
    environment: "browser",
    rootPath: '../',
    sources: [
        "module-loader.js"
    ],
    tests: [
        "tests/module-loader-test.js"
    ]
};