module.exports = {
    eventLogger: async function(result) {
        if (!result) {
            console.log("No result to check events on");
            return;
        }
        if (!result.logs) {
            console.log("No logs to check events on");
            return;
        }
        for (var i = 0; i < result.logs.length; i++) {
            var log = result.logs[i];
            if (log.event !== 'undefined') {
                console.log("event: " + JSON.stringify(log.event)
                    + " args: " + JSON.stringify(log.args));
            }
        }
    },
    eventValidator: function(result, expectedEvent, occurrences) {
        if (!result) {
            console.log("No result to check events on");
            return;
        }
        if (!result.logs) {
            console.log("No logs to check events on");
            return;
        }
        let foundEventTypes = 0;
        // console.log("expectedEvent: " + JSON.stringify(expectedEvent));
        for (var i = 0; i < result.logs.length; i++) {
            if (foundEventTypes > occurrences) {
                assert.ok(false, "Transaction should fail");
            }
            var log = result.logs[i];
            if (log && log.event !== 'undefined') {
                // console.log("log.event: " + JSON.stringify(log.event));
                if (log.event === expectedEvent.name) {
                    foundEventTypes++;
                    if (expectedEvent.args) {
                        for(arg in expectedEvent.args) {
                            if (log.args[arg] != expectedEvent.args[arg]) {                            
                                console.log("ACTUAL arg: " + arg + " value " + log.args[arg])
                                console.log("EXPECTED arg: " + arg + " value " + expectedEvent.args[arg])
                                assert.ok(false, "Could not validate args");
                            }
                        }
                    }
                    assert.ok(true, "Found expected event");
                }
            }
        }
    }
};