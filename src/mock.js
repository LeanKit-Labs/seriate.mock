var _ = require( "lodash" );
var when = require( "when" );

/* Example mock object structure

	{
		mockResults: function() {
			return []; // array of mock rows
		},
		isError: true/false,
		waitTime: { milliseconds } to wait (defaults to 0)
	}

*/

var methods = {
	addMock: function( key, mock ) {
		var realMock = mock;
		var defaults = {
			isError: false,
			waitTime: 0
		};

		if ( _.isFunction( realMock ) ) {
			// Just a function was given
			realMock = _.merge( defaults, {
				mockResults: mock,
			} );
		} else if ( !_.isPlainObject( realMock ) ) {
			// Something other than a function or object was given
			var result = _.clone( realMock );
			realMock = _.merge( defaults, {
				mockResults: function() {
					return result;
				}
			} );
		} else {
			realMock = _.merge( defaults, mock );
		}

		if ( !_.isFunction( realMock.mockResults ) ) {
			// Ensure that mockResults is a function
			var results = _.clone( realMock.mockResults );
			realMock.mockResults = function() {
				return results;
			}
		}

		this.mockCache[ key ] = realMock;
	},
	getMock: function( key ) {
		// can't mock "result" key, since
		// that's the internal step name used
		// when calling execute/executeTransaction
		var mock = ( key === "result" ) ? undefined : this.mockCache[ key ];
		if ( mock ) {
			//console.info( "Mock key found:", key );
		}
		return mock ? mock : undefined;
	},
	clearMock: function( key ) {
		if ( arguments.length === 0 ) {
			this.mockCache = {};
		} else {
			if ( this.mockCache.hasOwnProperty( key ) ) {
				delete this.mockCache[ key ];
			}
		}
	},
	resolveMock: function( stepName, options ) {
		// Search by:
		// 1. Step Name
		// 2. Query
		// 3. File

		var mock; // undefined

		mock = this.getMock( stepName );

		if ( !_.isUndefined( mock ) ) {
			return mock;
		}

		if ( options.query ) {
			mock = this.getMock( options.query );
		}

		return mock;
	}
};

module.exports = {

	setup: function( sql ) {

		sql.mockCache = {};
		sql._allow_failed_connections = true;

		_.extend( sql, methods );

		var origContext = sql.SqlContext;
		sql.SqlContext = origContext.extend( {
			executeSql: function( options ) {
				var stepName = this.state;
				var mock = sql.resolveMock( stepName, options );

				if ( !_.isUndefined( mock ) ) {
					return when.promise( function( resolve, reject ) {
						var results = mock.mockResults.call( this, stepName, options );
						var timeout = mock.waitTime || 0;

						setTimeout( function() {
							if ( mock.isError ) {
								reject( results );
							} else {
								resolve( results );
							}
						}, timeout )

					}.bind( this ) );
				}

				if ( options.query || options.procedure ) {
					return this.nonPreparedSql.call( this, options );
				} else {
					return this.preparedSql.call( this, options );
				}
			},
			states: {
				connecting: {
					error: function( err ) {
						if ( sql._allow_failed_connections ) {
							return this.states.connecting.success.call( this );
						}
						this.err = err;
						this.transition( "error" );
					}
				}
			}
		} );

	}

};
