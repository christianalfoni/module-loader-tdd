var config = module.exports;

config['My tests"'] = {
    environment: "node",
    rootPath: '../../../',
    libs: [
        "module-loader.js"
    ],
    tests: [
        "demo/server/tests/*-test.js"
    ]
}
