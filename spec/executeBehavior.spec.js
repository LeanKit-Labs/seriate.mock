var mock = require( "../src/index.js" );
var expect = require( "expect.js" );
var _ = require( "lodash" );

describe( "When mocking one-time queries", function() {
	var sql = require( "seriate" );
	var records = [
		{ title: "Kanban", author: "David Anderson" },
		{ title: "Gunsmithing Rifles", author: "Patrick Sweeney" },
		{ title: "Programming Ruby", author: "Dave Thomas" }
	];

	before( function() {
		mock( sql );
	} );

	beforeEach( function() {
		sql.clearMock();
	} );

	describe( "when mocking an execute() call", function() {
		it( "should support mocking by query", function( done ) {
			sql.addMock( "SELECT * FROM books", records );

			sql.execute( {
				query: "SELECT * FROM books"
			} )
				.then( function( sets ) {
					expect( sets ).to.eql( records );
					done();
				} );

		} );

		it( "should support mocking by preparedSql", function( done ) {
			sql.addMock( "SELECT * FROM books", records );

			sql.execute( {
				preparedSql: "SELECT * FROM books"
			} )
				.then( function( sets ) {
					expect( sets ).to.eql( records );
					done();
				} );
		} );
	} );

	describe( "when mocking a first() call", function() {
		it( "should support mocking by query", function( done ) {
			sql.addMock( "SELECT * FROM books", records );

			sql.first( {
				query: "SELECT * FROM books"
			} )
				.then( function( sets ) {
					expect( sets ).to.eql( records[ 0 ] );
					done();
				} );
		} );

		it( "should support mocking by preparedSql", function( done ) {
			sql.addMock( "SELECT * FROM books", records );

			sql.first( {
				preparedSql: "SELECT * FROM books"
			} )
				.then( function( sets ) {
					expect( sets ).to.eql( records[ 0 ] );
					done();
				} );
		} );
	} );


} );
