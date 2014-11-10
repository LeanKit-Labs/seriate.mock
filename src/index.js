var mock = require( "./mock.js" );

module.exports = function seriate_mock( sql, options ) {
	mock.setup( sql, options );
};
