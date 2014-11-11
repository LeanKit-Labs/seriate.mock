var mock = require( "../src/index.js" );
var expect = require( "expect.js" );
var _ = require( "lodash" );
var sql = require( "seriate" );

mock( sql );

describe( "Transaction Context Mocking behavior", function() {

	beforeEach( function() {
		sql.clearMock();
	} );

	describe( "when mock is a function", function() {
		var expectedResult = [
			{ name: "brian", paramVal: "foo", superpower: "lightning from fingertips" },
			{ name: "alex", paramVal: "foo", superpower: "gaseous anomalies" },
			{ name: "jim", paramVal: "foo", superpower: "drives doug crazy" },
			{ name: "doug", paramVal: "foo", superpower: "the human linter" },
			{ name: "gunny", paramVal: "foo", superpower: "kung fu" }
		];
		beforeEach( function() {
			sql.addMock( "guise", function( stepName, stepAction ) {
				return [
					{ name: "brian", paramVal: stepAction.params.testval, superpower: "lightning from fingertips" },
					{ name: "alex", paramVal: stepAction.params.testval, superpower: "gaseous anomalies" },
					{ name: "jim", paramVal: stepAction.params.testval, superpower: "drives doug crazy" },
					{ name: "doug", paramVal: stepAction.params.testval, superpower: "the human linter" },
					{ name: "gunny", paramVal: stepAction.params.testval, superpower: "kung fu" }
				];
			} );
		} );
		it( "should produce correct mock results", function( done ) {
			sql.getTransactionContext()
				.step( "guise", {
					params: {
						testval: "foo"
					}
				} )
				.end( function( results ) {
					expect( results.sets.guise ).to.eql( expectedResult );
					done();
				} );
		} );
	} );
	describe( "when mock is an array of static records", function() {
		var expectedResult = [
			{ name: "brian", superpower: "lightning from fingertips" },
			{ name: "alex", superpower: "gaseous anomalies" },
			{ name: "jim", superpower: "drives doug crazy" },
			{ name: "doug", superpower: "the human linter" },
			{ name: "gunny", superpower: "kung fu" }
		];
		beforeEach( function() {
			sql.addMock( "guise", [
				{ name: "brian", superpower: "lightning from fingertips" },
				{ name: "alex", superpower: "gaseous anomalies" },
				{ name: "jim", superpower: "drives doug crazy" },
				{ name: "doug", superpower: "the human linter" },
				{ name: "gunny", superpower: "kung fu" }
			] );
		} );
		it( "should produce correct mock results", function( done ) {
			sql.getTransactionContext()
				.step( "guise", {
					testval: "foo"
				} )
				.end( function( results ) {
					expect( results.sets.guise ).to.eql( expectedResult );
					done();
				} );
		} );
	} );

	describe( "When mock is specified as an error", function() {
		it( "should pass results to error callback", function( done ) {
			var expectedResult = new Error( "Uh oh" );
			sql.addMock( 'someMock', {
				mockResults: expectedResult,
				isError: true
			} )
			sql.getTransactionContext()
				.step( "someMock", {
					params: {
						testval: "foo"
					}
				} )
				.error( function( err ) {
					expect( err ).to.eql( expectedResult );
					done();
				} );
		} );
	} );

	describe( "When mock contains a specified timeout", function() {
		it( "should wait appropriately to execute", function( done ) {
			this.timeout( 5000 );
			var start = Date.now();

			var expectedResult = [ "thing1", "thing2" ];
			sql.addMock( 'someMock', {
				mockResults: expectedResult,
				waitTime: 1000
			} )
			sql.getTransactionContext()
				.step( "someMock", {
					params: {
						testval: "foo"
					}
				} )
				.end( function( results ) {
					var interval = Date.now() - start;
					expect( interval >= 1000 && interval < 2000 ).to.be.ok();
					expect( results.sets.someMock ).to.eql( expectedResult );
					done();
				} );
		} );
	} );

} );
