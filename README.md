#Seriate.mock
=========

An addon library for [Seriate](https://github.com/LeanKit-Labs/seriate) that provides request mocking.

##API

The follow methods are added to the `seriate` instance:

|method name         | description              |
|--------------------|--------------------------|
|`addMock(key, config)` | Stores the mock in the cache to be retrieved later
|`addFileMock(path, config)` | Stores a mock for use when `sql.fromFile()` is called
|`clearMock([key])` | Removes specific mock from cache if key is provided or clears all mocks if no key is provided.
|`getMock(key)` | Retrieves mock from cache
|`resolveMock(stepName, stepConfig)` | Retrieves the correct mock to be used for a particular SQL Context step.


###Examples

Seriate.mock provides a factory function that modifies a `seriate` object.

```javascript
var sql = require( "seriate" );
var mock = require( "seriate.mock" );

mock( sql );

sql.addMock( "findUsers", [
	{ name: "Bob Ross", occupation: "painter" },
	{ name: "Tony Stark", occupation: "super hero" }
]);

sql.getPlainContext()
	.step( "findUsers" )
	.end( function( sets ) {
		sets.findUsers; // [{ name: "Bob Ross", occupation: "painter" },{ name: "Tony Stark", occupation: "super hero" }]
	});

```

The value passed to `addMock` can take several forms:

```javascript
// ...

sql.addMock( "findRecords", [ 'val1', 'val2', 'val3' ] ); // Will return the array

sql.addMock( "getTotal", 123 ); // Will return the numeric value

// ...

sql.addMock( "findSomething", function( stepName, stepConfig ) {

	// stepName is the name of the current step being executed

	// stepConfig is the configuration object that was defined with the step

	return { title: "Happy Little Clouds", alias: stepConfig.params.alias };
});

sql.getPlainContext()
	.step( "findSomething", {
		params: {
			alias: "happy-little-clouds"
		}
	})
	.end( function( sets ) {
		sets.findSomething; // { title: "Happy Little Clouds", alias: "happy-little-clouds" }
	});

```

**Warning:** *Giving `addMock` a plain object will not work the way you think it does.*

When passing a plain object to `addMock` it must be in the form of a raw mock object including at least the `mockResults` key:

```javascript
// ...

sql.addMock( "ninjaTurtles", {
	mockResults: [ 'Leonardo', 'Donatello', 'Raphael', 'Michelangelo' ], // This can be any data type including a function
	isError: false, // [Default false] If true, results will be passed to query error handler
	waitTime: 1000, // [Default 0] Time in milliseconds to wait for query to resolve
	once: false // [Default false] If true, mock will be discarded after one use
});
```

The API works the same way with Seriate's `TransactionContext` object:

```javascript
sql.addMock( "dogs", [ "German Shepherds", "Labradors", "Dobermans" ] );

sql.getTransactionContext()
	.step( "dogs" )
	.end( function( sets ) {
		sets.dogs; // [ "German Shepherds", "Labradors", "Dobermans" ]
	});
```

**Warning:** *Using this library will mock all transaction contexts. You will not be able to perform actual transactions at any point.*

You can mock calls to `execute` or `first` by using the query (or preparedSql) as the key:

```javascript
sql.addMock( "SELECT * FROM sys.books", [
	"A Tale of Two Cities",
	"The Jungle",
	"Heart of Darkness"
] );

sql.execute({
		query: "SELECT * FROM sys.books"
	})
	.end(function( results ) {
		results; // [ "A Tale of Two Cities", "The Jungle", "Heart of Darkness" ]
	});

sql.first({
		query: "SELECT * FROM sys.books"
	})
	.end(function( result ) {
		result; // "A Tale of Two Cities"
	});
```

You might consider using the `once` parameter single use mocks to avoid collisions without having to remember to clear the mock manually.

```javascript
sql.addMock( "SELECT * FROM sys.books", [
	"A Tale of Two Cities",
	"The Jungle",
	"Heart of Darkness"
], { once: true } );

sql.execute({
		query: "SELECT * FROM sys.books"
	})
	.end(function( results ) {
		results; // [ "A Tale of Two Cities", "The Jungle", "Heart of Darkness" ]
	});

sql.first({
		query: "SELECT * FROM sys.books"
	})
	.end(function( result ) {
		result; // Mock no longer exists and will not be found
	});
```

####File Mocking

You can mock by file access by using the `addFileMock` method.

```javascript
var expectedResults = [{ name: "Neo" }, { name: "Trinity" }, { name: "Morpheus" }];

sql.addFileMock( "./matrixCharacters", function( stepName, stepArg ) {
	return expectedResults;
} );

sql.getPlainContext()
	.step( "characters", {
		preparedSql: sql.fromFile( "./matrixCharacters" ),
	})
	.end( function( sets ) {
		sets.characters; // [{ name: "Neo" }, { name: "Trinity" }, { name: "Morpheus" }]
	} );
```

The file mocks will try to resolve to the same absolute path as the value given to `sql.fromFile`. Set the configuration option `sqlFileBasePath` to form the basis for your absolute paths built by `addFileMock`. For instance;


```javascript
// Filename: /Users/me/myProject/src/lib/somefile.js

sql.getPlainContext()
	.step( "characters", {
		preparedSql: sql.fromFile( "./matrixCharacters" ),
	})
	.end( function( sets ) {
		sets.characters; // [{ name: "Neo" }, { name: "Trinity" }, { name: "Morpheus" }]
	} );

// File will resolve to /Users/me/myProject/src/lib/matrixCharacters
```

To mock this file from an external test, you would do something like this:

```javascript
// Filename: /Users/me/myProject/spec/lib/somefile.spec.js

var sql = require( "seriate" );
var mock = require( "seriate.mock" );

mock( sql, { sqlFileBasePath: "/Users/me/myProject/src"} );

var expectedResults = [{ name: "Neo" }, { name: "Trinity" }, { name: "Morpheus" }];

sql.addFileMock( "lib/matrixCharacters", function( stepName, stepArg ) {
	return expectedResults;
} );

// Mock file will resolve to /Users/me/myProject/src/lib/matrixCharacters
```
