module.exports = {
    eventLogger: async function(result) {
        for (var i = 0; i < result.logs.length; i++) {
            var log = result.logs[i];
            if (log.event !== 'undefined') {
                console.log("event: " + JSON.stringify(log.event)
                    + " args: " + JSON.stringify(log.args));
            }
        }
    },
    eventValidator: function(result, expectedEvent, occurrences) {
        let foundEventTypes = 0;
        // console.log("expectedEvent: " + JSON.stringify(expectedEvent));
        for (var i = 0; i < result.logs.length; i++) {
            if (foundEventTypes > occurrences) {
                assert.ok(false, "Transaction should fail");
            }
            var log = result.logs[i];
            if (log.event !== 'undefined') {
                // console.log("log.event: " + JSON.stringify(log.event));
                if (log.event === expectedEvent.name) {
                    foundEventTypes++;
                    if (expectedEvent.args) {
                        for(arg in expectedEvent.args) {
                            // console.log("arg: " + arg)
                            if (!log.args[arg]) {                            
                                continue;
                            }
                        }
                    }
                    // console.log("Found expected event: " + log.event);
                    assert.ok(true, "Found expected event:");
                }
            }
        }
    }
};