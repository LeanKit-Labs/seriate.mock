var mock = require("./mock.js");

module.exports = function seriate_mock( sql ) {
	mock.setup( sql );
};