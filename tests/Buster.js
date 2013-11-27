var config = module.exports;

config["My tests"] = {
    environment: "browser",
    rootPath: '../',
    sources: [
        "lib/module-loader-tdd.js"
    ],
    tests: [
        "tests/module-loader-tdd-test.js"
    ]
};