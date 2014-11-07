var mock = require( "../src/index.js" );
var expect = require( "expect.js" );

describe( "When setting up seriate.mock", function() {
	describe( "when adding it to the seriate object", function() {
		it( "should modify the object", function() {
			var sql = require( "seriate" );

			mock( sql );

			expect( sql.mockCache ).to.be.an( "object" );
			expect( sql.addMock ).to.be.a( "function" );
		} );
	} );

} );
