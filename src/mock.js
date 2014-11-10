var _ = require( "lodash" );
var when = require( "when" );
var path = require( "path" );

/* Example mock object structure

	{
		mockResults: function() {
			return []; // array of mock rows
		},
		isError: true/false,
		waitTime: { milliseconds } to wait (defaults to 0)
	}

*/

function getCacheKey( options ) {
	options = options || {};
	return options.cacheKey || "root";
}

function isAbsolutePath( p ) {
	return path.resolve( p ) === path.normalize( p ).replace( /(.+)([\/|\\])$/, "$1" );
}

function isFileMock( str ) {
	return str.slice( 0, 7 ) === "file://";
}

function getFileMockKey( str ) {
	return str.slice( 7 );
}

var methods = {
	addMock: function( key, mock, options ) {
		var cacheKey = getCacheKey( options );
		var realMock = mock;
		var defaults = {
			isError: false,
			waitTime: 0
		};

		if ( !this.mockCache[ cacheKey ] ) {
			this.mockCache[ cacheKey ] = {};
		}

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

		this.mockCache[ cacheKey ][ key ] = realMock;
	},

	addMockFile: function( filePath, mock ) {
		var absPath = path.resolve( this.getMockConfig( "sqlFileBasePath" ), filePath );
		this.addMock( absPath, mock, { cacheKey: "file" } )
	},

	getMock: function( key, options ) {
		var cacheKey = getCacheKey( options );
		// can't mock "result" key, since
		// that's the internal step name used
		// when calling execute/executeTransaction

		if ( _.isUndefined( this.mockCache[ cacheKey ] ) ) {
			return undefined;
		}

		var mock = ( key === "result" ) ? undefined : this.mockCache[ cacheKey ][ key ];
		if ( mock ) {
			//console.info( "Mock key found:", key );
		}
		return mock ? mock : undefined;
	},
	getFileMock: function( key ) {
		if ( !isFileMock( key ) ) {
			return undefined;
		}
		var key = getFileMockKey( key );
		return this.getMock( key, { cacheKey: "file" } );
	},
	clearMock: function( key, options ) {
		var cacheKey = getCacheKey( options );
		if ( arguments.length === 0 ) {
			this.mockCache = {};
		} else {
			if ( this.mockCache[ cacheKey ].hasOwnProperty( key ) ) {
				delete this.mockCache[ cacheKey ][ key ];
			}
		}
	},
	findMockForKey: function( key ) {
		var mock = this.getMock( key );

		if ( !_.isUndefined( mock ) ) {
			return mock;
		} else {
			mock = this.getFileMock( key );
		}

		return mock;
	},
	resolveMock: function( stepName, options ) {
		// Search by:
		// 1. Step Name
		// 2. Query
		// 3. Prepared SQL
		// 4. Procedure
		// 5. File

		var mock; // undefined

		mock = this.getMock( stepName );

		if ( !_.isUndefined( mock ) ) {
			return mock;
		}

		if ( options.query ) {
			mock = this.findMockForKey( options.query );
			if ( !_.isUndefined( mock ) ) {
				return mock;
			}
		}

		if ( options.preparedSql ) {
			mock = this.findMockForKey( options.preparedSql );

			if ( !_.isUndefined( mock ) ) {
				return mock;
			}
		}

		if ( options.procedure ) {
			mock = this.findMockForKey( options.procedure );

			if ( !_.isUndefined( mock ) ) {
				return mock;
			}
		}



		return mock;
	},

	setMockConfig: function( config ) {
		_.extend( this.mockConfig, config );
	},

	getMockConfig: function( key ) {
		return this.mockConfig[ key ];
	}
};

module.exports = {

	setup: function( sql, options ) {
		options = options || {};

		sql.mockCache = {};
		sql.mockConfig = {};

		_.extend( sql, methods );

		var defaultConfig = {
			ignoreFailedConnections: true
		};

		sql.setMockConfig( _.merge( defaultConfig, options ) );

		var origContext = sql.SqlContext;
		var _executeSql = origContext.prototype.executeSql;
		var _errorState = origContext.prototype.states.connecting.error;

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

				return origPrototype.executeSql.call( this, options );
			},
			states: {
				connecting: {
					error: function( err ) {
						if ( sql.getMockConfig( "ignoreFailedConnections" ) ) {
							return this.states.connecting.success.call( this );
						}
						return _errorState.call( this, err );
					}
				}
			}
		} );

		var _fromFile = sql.fromFile;

		sql.fromFile = function( p ) {
			p = this._getFilePath( p );

			var mockExists = !_.isUndefined( this.getMock( p, { cacheKey: "file" } ) );

			if ( mockExists ) {
				return "file://" + p;
			} else {
				return _fromFile.call( this, p );
			}

		};

	}

};
