var path = require( "path" );
var _ = require( "lodash" );

function getCacheKey( options ) {
	options = options || {};
	return options.cacheKey || "root";
}

function isFileMock( str ) {
	return str.slice( 0, 7 ) === "file://";
}

function getFileMockKey( str ) {
	return str.slice( 7 );
}

module.exports = {
	addMock: function( key, mock, options ) {
		var cacheKey = getCacheKey( options );
		var realMock = mock;
		var defaults = {
			isError: false,
			once: false,
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
			};
		}

		this.mockCache[ cacheKey ][ key ] = realMock;
	},

	addFileMock: function( filePath, mock ) {
		var absPath = path.resolve( this.getMockConfig( "sqlFileBasePath" ), filePath );
		this.addMock( absPath, mock, { cacheKey: "file" } );
	},

	getMock: function( key, options ) {
		var cacheKey = getCacheKey( options );
		// can't mock "result" key, since
		// that's the internal step name used
		// when calling execute/executeTransaction

		if ( _.isUndefined( this.mockCache[ cacheKey ] ) ) {
			return undefined;
		}

		var mock = ( key === "__result__" ) ? undefined : this.mockCache[ cacheKey ][ key ];

		return mock ? mock : undefined;
	},
	getFileMock: function( key ) {
		if ( !isFileMock( key ) ) {
			return undefined;
		}
		key = getFileMockKey( key );
		return this.getMock( key, { cacheKey: "file" } );
	},
	clearFileMock: function( key ) {
		return this.clearMock( key, { cacheKey: "file" } );
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
			if ( mock.once ) {
				this.clearMock( key );
			}

			return mock;
		} else {
			mock = this.getFileMock( key );

			if ( !_.isUndefined( mock ) && mock.once ) {
				this.clearFileMock( key );
			}
		}

		return mock;
	},
	resolveMock: function( stepName, options ) {
		// Search by:
		// 1. Step Name
		// 2. Query
		// 3. Prepared SQL
		// 4. Procedure

		var mock; // undefined

		mock = this.findMockForKey( stepName );

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
