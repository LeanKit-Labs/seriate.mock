var mock = require( "../src/index.js" );
var expect = require( "expect.js" );
var _ = require( "lodash" );

describe( "When clearing a mock", function() {
	var sql = require( "seriate" );
	mock( sql );

	describe( "when specifying a key", function() {
		it( "should remove only the specified key", function() {
			sql.addMock( "myMock", [ 'val1', 'val2', 'val3' ] );
			sql.addMock( "myMock2", [ 'val4', 'val5', 'val6' ] );

			expect( sql.mockCache[ "root" ].myMock ).to.be.an( "object" );
			expect( sql.mockCache[ "root" ].myMock2 ).to.be.an( "object" );

			sql.clearMock( "myMock" );

			expect( sql.mockCache[ "root" ].myMock ).to.not.be.an( "object" );
			expect( sql.mockCache[ "root" ].myMock2 ).to.be.an( "object" );
		} );

	} );

	describe( "when not specifying a key", function() {
		it( "should remove all mocks", function() {
			sql.addMock( "myMock", [ 'val1', 'val2', 'val3' ] );
			sql.addMock( "myMock2", [ 'val4', 'val5', 'val6' ] );

			expect( sql.mockCache[ "root" ].myMock ).to.be.an( "object" );
			expect( sql.mockCache[ "root" ].myMock2 ).to.be.an( "object" );

			sql.clearMock();

			expect( sql.mockCache ).to.be.empty();

		} );

	} );

} );

describe( "When getting a mock", function() {
	var sql = require( "seriate" );
	mock( sql );

	beforeEach( function() {
		sql.clearMock();
	} );

	describe( "when specifying a key", function() {
		it( "should return the mock for that key", function() {
			var expected = [ 'val1', 'val2', 'val3' ];
			sql.addMock( "myMock", expected );

			var myMock = sql.getMock( "myMock" );

			expect( myMock.mockResults() ).to.eql( expected );
		} );

		it( "should return undefined if key is not found", function() {
			var expected = [ 'val1', 'val2', 'val3' ];
			sql.addMock( "myMock", expected );

			var myMock = sql.getMock( "myMock2" );

			expect( myMock ).to.be( undefined );
		} );

		it( "should return undefined if key is 'result'", function() {
			var expected = [ 'val1', 'val2', 'val3' ];
			sql.addMock( "__result__", expected );

			var myMock = sql.getMock( "result" );

			expect( myMock ).to.be( undefined );
		} );

	} );

} );

describe( "When finding a mock", function() {
	var sql = require( "seriate" );
	mock( sql );

	beforeEach( function() {
		sql.clearMock();
	} );

	it( "should first look up by step name", function() {
		var expected = [ 'val1', 'val2', 'val3' ];
		sql.addMock( "myMock", expected );

		var myMock = sql.resolveMock( "myMock", {} );

		expect( myMock.mockResults() ).to.eql( expected );
	} );

	it( "should fall back to search by query", function() {
		var expected = [ 'val1', 'val2', 'val3' ];
		sql.addMock( "SELECT * FROM sys.sysusers", expected );

		var myMock = sql.resolveMock( "myMock", {
			query: "SELECT * FROM sys.sysusers",
			mockResults: expected
		} );

		expect( myMock.mockResults() ).to.eql( expected );
	} );
} );
