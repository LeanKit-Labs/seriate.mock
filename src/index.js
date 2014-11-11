var mock = require( "./mock.js" );

module.exports = function seriateMock( sql, options ) {
	mock.setup( sql, options );
};
