#Seriate.mock
=========

An addon library for [Seriate](https://github.com/LeanKit-Labs/seriate) that provides request mocking.

##API

The follow methods are added to the `seriate` instance:

|method name         | description              |
|--------------------|--------------------------|
|`addMock(key, config)` | Stores the mock in the cache to be retrieved later
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

When passing a plain object to `addMock` it must be in the form of a raw mock object:

```javascript
// ...

sql.addMock( "ninjaTurtles", {
	mockResults: [ 'Leonardo', 'Donatello', 'Raphael', 'Michelangelo' ], // This can be any data type including a function
	isError: false, // If true, results will be passed to query error handler
	waitTime: 1000, // Time in milliseconds to wait for query to resolve
});
```
