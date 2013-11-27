var config = module.exports;

config['My tests"'] = {
    environment: "node",
    rootPath: '../../../',
    libs: [
        "lib/module-loader-tdd.js"
    ],
    tests: [
        "demo/server/tests/*-test.js"
    ]
}
