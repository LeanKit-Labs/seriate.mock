var mock = require( "../src/index.js" );
var expect = require( "expect.js" );
var _ = require( "lodash" );

describe( "When adding a mock", function() {
	var sql = require( "seriate" );
	mock( sql );

	beforeEach( function() {
		sql.clearMock();
	} )

	describe( "when specifying the configuration object directly", function() {
		it( "should store the given object as the mock with merged defaults", function() {
			var mockObj = {
				mockResults: function() {
					return "something";
				},
				isError: true
			};

			sql.addMock( "myMock", mockObj );

			expect( sql.mockCache.myMock ).to.eql( _.merge( { waitTime: 0 }, mockObj ) );
		} );
		it( "should ensure that mockResults is a function", function() {
			var mockObj = {
				mockResults: "something",
			};

			sql.addMock( "myMock", mockObj );

			var result = sql.mockCache.myMock.mockResults;
			expect( result ).to.be.a( "function" );
			expect( result() ).to.equal( "something" );
		} );
	} );

	describe( "when specifying the mock as a function", function() {
		it( "should create the mock object with the function as the result callback", function() {

			sql.addMock( "myMock", function( step, stepArgs ) {
				return "results";
			} );

			var thisMock = sql.mockCache.myMock;

			var result = sql.mockCache.myMock.mockResults;
			expect( thisMock.mockResults ).to.be.a( "function" );
			expect( thisMock.mockResults() ).to.equal( "results" );
			expect( thisMock.isError ).to.not.be.ok();
			expect( thisMock.waitTime ).to.equal( 0 );
		} );
	} );

	describe( "when specifying the mock as a function", function() {
		it( "should create the mock object with the function as the result callback", function() {
			var expected = [ 'val1', 'val2', 'val3' ];
			sql.addMock( "myMock", expected );

			var thisMock = sql.mockCache.myMock;

			var result = sql.mockCache.myMock.mockResults;
			expect( thisMock.mockResults ).to.be.a( "function" );
			expect( thisMock.mockResults() ).to.eql( expected );
			expect( thisMock.isError ).to.not.be.ok();
			expect( thisMock.waitTime ).to.equal( 0 );
		} );
	} );

} );
