var mock = require( "../src/index.js" );
var expect = require( "expect.js" );
var _ = require( "lodash" );

describe( "When adding a file mock", function() {
	var sql = require( "seriate" );
	before( function() {
		mock( sql, {
			sqlFileBasePath: __dirname + "/../"
		} );
	} );


	beforeEach( function() {
		sql.clearMock();
	} )


	it( "should return the correct results", function( done ) {
		var expectedResults = { name: "Neo", alias: "The One" };

		sql.addFileMock( "./spec/userById", function( stepName, stepArg ) {
			return expectedResults;
		} );

		sql.getPlainContext()
			.step( "user", {
				preparedSql: sql.fromFile( "./userById" ),
				params: {
					boardId: {
						val: 1,
						type: sql.INT
					},
					laneId: {
						val: 2,
						type: sql.INT
					}
				}
			}
			)
			.end( function( sets ) {
				expect( sets.user ).to.eql( expectedResults );
				done();
			} );

	} );

} );
