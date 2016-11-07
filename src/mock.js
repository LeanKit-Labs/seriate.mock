var _ = require("lodash");
var when = require("when");
var mockMethods = require("./methods");

/* Example mock object structure

	{
		mockResults: function() {
			return []; // array of mock rows
		},
		isError: true/false,
		waitTime: { milliseconds } to wait (defaults to 0),
		once: false
	}

*/

function executeSqlFn(sql, fallbackFn) {
    return function(step,stepName,options) {
        var mock = sql.resolveMock(stepName, options);

        if (!_.isUndefined(mock)) {
            return when.promise(function(resolve, reject) {
                var results = mock.mockResults.call(this, stepName, options);
                var timeout = mock.waitTime || 0;

                setTimeout(function() {
                    if (mock.isError) {
                        reject(results);
                    } else {
                        resolve(results);
                    }
                }, timeout);

            }.bind(this));
        }

        return fallbackFn.call(this, options);
    };
}

module.exports = {

    setup: function(sql, options) {
        options = options || {};

        sql.mockCache = {};
        sql.mockConfig = {};

        _.extend(sql, mockMethods);

        var defaultConfig = {
            ignoreFailedConnections: true
        };

        sql.setMockConfig(_.merge(defaultConfig, options));

        this.patchSeriate(sql);

        this.patchSqlContext(sql);

        this.patchTransactionContext(sql);

    },

    patchSeriate: function(sql) {
        var _fromFile = sql.fromFile;

        sql.fromFile = function(p) {
            p = this._getFilePath(p);

            var mockExists = !_.isUndefined(this.getMock(p, {
                    cacheKey: "file"
                }));

            if (mockExists) {
                return "file://" + p;
            } else {
                return _fromFile.call(this, p);
            }

        };
    },

    patchSqlContext: function(sql) {
        var origContext = sql.SqlContext;
        var _executeSql = origContext.prototype.executeSql;
        var _errorState = origContext.prototype.states.connecting.error;

		// var md5sum = require('crypto').createHash('md5');
		// md5sum.update(require('util').inspect(sql.SqlContext,showHidden=true, depth=5));
		// console.log('PRE ',md5sum.digest('hex'));

		sql.SqlContext = origContext.extend({
            executeSql: executeSqlFn(sql, _executeSql),
            states: {
                connecting: {
                    error: function(err) {
                        if (sql.getMockConfig("ignoreFailedConnections")) {
                            return this.states.connecting.success.call(this);
                        }
                        return _errorState.call(this, err);
                    }
                }
            }
        });

		if(!sql.SqlContext.prototype.executeSql.isSinonProxy) {
			require('sinon').stub(sql.SqlContext.prototype, 'executeSql', executeSqlFn(sql, _executeSql));
		}
		if(!sql.SqlContext.prototype.states.connecting.error.isSinonProxy) {
			require('sinon').stub(sql.SqlContext.prototype.states.connecting, 'error', function (err) {
				if (sql.getMockConfig("ignoreFailedConnections")) {
					return this.states.connecting.success.call(this);
				}
				return _errorState.call(this, err);
			});
		}

		sql.SqlContext['mockedSym'] = Symbol('mock');
    //
		// var md5sum2 = require('crypto').createHash('md5');
		// md5sum2.update(require('util').inspect(sql.SqlContext,showHidden=true, depth=5));
		// console.log('POST',md5sum2.digest('hex'));
    },

    patchTransactionContext: function(sql) {
        var origContext = sql.TransactionContext;
        var _executeSql = origContext.prototype.executeSql;
        var _errorState = origContext.prototype.states.connecting.error;

        sql.TransactionContext = origContext.extend({
            executeSql: executeSqlFn(sql, _executeSql),
            states: {
                connecting: {
                    error: function(err) {
                        if (sql.getMockConfig("ignoreFailedConnections")) {
                            var success = this.states.connecting.success;
                            if (_.isString(success)) {
                                return this.transition(success);
                            } else {
                                return success.call(this);
                            }
                        }
                        return _errorState.call(this, err);
                    }
                },
                startingTransaction: {
                    _onEnter: function() {
                        return this.states.startingTransaction.success.call(this);
                    }
                },
                done: {
                    _onEnter: function() {
                        var self = this;
                        self.emit("end", {
                            sets: self.results,
                            transaction: {
                                commit: function() {
                                    return when.promise(function(resolve) {
                                        resolve();
                                    });
                                },
                                rollback: function() {
                                    return when.promise(function(resolve) {
                                        resolve();
                                    });
                                }
                            }
                        });
                    }
                }
            }
        });
    }

};
